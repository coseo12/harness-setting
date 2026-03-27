#!/usr/bin/env bash
# 오케스트레이터: 에이전트 간 워크플로우를 조율하는 메인 스크립트
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
STATE_FILE="${PROJECT_DIR}/.harness/state.json"
LOG_DIR="${PROJECT_DIR}/.harness/logs"
POLL_INTERVAL="${HARNESS_POLL_INTERVAL:-60}"
MAX_CONCURRENT="${HARNESS_MAX_CONCURRENT:-3}"

mkdir -p "${LOG_DIR}"

# 현재 백그라운드 에이전트 수 확인
count_running_agents() {
  jobs -rp 2>/dev/null | wc -l | tr -d ' '
}

# 동시성 제한 — 최대 실행 수를 넘으면 대기
wait_for_slot() {
  while [ "$(count_running_agents)" -ge "${MAX_CONCURRENT}" ]; do
    log "동시 실행 한도(${MAX_CONCURRENT}) 도달. 슬롯 대기 중..."
    sleep 10
  done
}

usage() {
  echo "사용법: $0 <명령>"
  echo ""
  echo "명령:"
  echo "  start              - 오케스트레이터 시작 (이벤트 루프)"
  echo "  status             - 현재 상태 출력"
  echo "  dispatch <agent> <n> - 에이전트에 작업 할당"
  echo "  pipeline <issue>   - 이슈를 파이프라인에 투입 (Architect→Developer→Auditor→Reviewer→QA)"
  echo "  full <issue>       - PM부터 시작하는 전체 파이프라인"
  echo "  parallel <i1> <i2> - 여러 이슈를 병렬로 Developer에게 할당"
  echo ""
  exit 1
}

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "${LOG_DIR}/orchestrator.log"
}

# 상태 파일 읽기
read_state() {
  if [ -f "${STATE_FILE}" ]; then
    cat "${STATE_FILE}"
  else
    echo "{}"
  fi
}

# 상태 파일 업데이트
update_phase() {
  local phase="$1"
  if command -v jq &> /dev/null; then
    jq --arg p "${phase}" '.current_phase = $p' "${STATE_FILE}" > "${STATE_FILE}.tmp" \
      && mv "${STATE_FILE}.tmp" "${STATE_FILE}"
  fi
  log "Phase 변경: ${phase}"
}

# GitHub 이슈/PR 상태 동기화
sync_github() {
  log "GitHub 동기화 시작..."

  # 리뷰 대기 PR 확인
  local review_prs
  review_prs=$(gh pr list --label "status:review" --json number,title 2>/dev/null || echo "[]")

  # QA 대기 PR 확인
  local qa_prs
  qa_prs=$(gh pr list --label "status:qa" --json number,title 2>/dev/null || echo "[]")

  # 대기 중인 이슈 확인
  local todo_issues
  todo_issues=$(gh issue list --label "status:todo" --json number,title,labels 2>/dev/null || echo "[]")

  log "리뷰 대기 PR: $(echo "${review_prs}" | jq length 2>/dev/null || echo 0)건"
  log "QA 대기 PR: $(echo "${qa_prs}" | jq length 2>/dev/null || echo 0)건"
  log "대기 이슈: $(echo "${todo_issues}" | jq length 2>/dev/null || echo 0)건"

  echo "${review_prs}" "${qa_prs}" "${todo_issues}"
}

# 자동 디스패치: 대기 중인 작업을 감지하고 에이전트 실행
auto_dispatch() {
  log "자동 디스패치 확인..."

  # 리뷰 대기 PR → Evaluator 디스패치 (정적 분석 + 코드 리뷰 통합)
  local review_prs
  review_prs=$(gh pr list --label "status:review" --json number 2>/dev/null || echo "[]")
  local review_count
  review_count=$(echo "${review_prs}" | jq length 2>/dev/null || echo 0)

  if [ "${review_count}" -gt 0 ]; then
    wait_for_slot
    local pr_num
    pr_num=$(echo "${review_prs}" | jq -r '.[0].number')
    # 중복 디스패치 방지: 즉시 라벨 전이
    gh pr edit "${pr_num}" --remove-label "status:review" --add-label "status:evaluating" 2>/dev/null || true
    log "리뷰 대기 PR #${pr_num} 감지 → Evaluator 디스패치"
    "${SCRIPT_DIR}/dispatch-agent.sh" evaluator "${pr_num}" &
  fi

  # QA 대기 PR → QA 디스패치
  local qa_prs
  qa_prs=$(gh pr list --label "status:qa" --json number 2>/dev/null || echo "[]")
  local qa_count
  qa_count=$(echo "${qa_prs}" | jq length 2>/dev/null || echo 0)

  if [ "${qa_count}" -gt 0 ]; then
    wait_for_slot
    local pr_num
    pr_num=$(echo "${qa_prs}" | jq -r '.[0].number')
    log "QA 대기 PR #${pr_num} 감지 → QA 디스패치"
    "${SCRIPT_DIR}/dispatch-agent.sh" qa "${pr_num}" &
  fi

  # TODO 이슈 중 개발자 라벨 → 해당 Developer 디스패치 (의존성 확인 포함)
  # agent:developer, agent:frontend-developer, agent:backend-developer 모두 감지
  local agent_labels=("agent:developer" "agent:frontend-developer" "agent:backend-developer")
  local agent_names=("developer" "frontend-developer" "backend-developer")

  for idx in "${!agent_labels[@]}"; do
    local label="${agent_labels[$idx]}"
    local agent_name="${agent_names[$idx]}"

    local dev_issues
    dev_issues=$(gh issue list --label "status:todo,${label}" --json number,body 2>/dev/null || echo "[]")
    local dev_count
    dev_count=$(echo "${dev_issues}" | jq length 2>/dev/null || echo 0)

    if [ "${dev_count}" -gt 0 ]; then
      local i=0
      while [ "${i}" -lt "${dev_count}" ]; do
        local issue_num
        issue_num=$(echo "${dev_issues}" | jq -r ".[${i}].number")
        local issue_body
        issue_body=$(echo "${dev_issues}" | jq -r ".[${i}].body // \"\"")

        # 의존성 확인: "선행: #번호" 패턴에서 선행 이슈가 닫혔는지 검증
        local blocked=false
        local dep_nums
        dep_nums=$(echo "${issue_body}" | grep -oE '선행:?\s*#[0-9]+' | grep -oE '[0-9]+' || true)

        if [ -n "${dep_nums}" ]; then
          for dep in ${dep_nums}; do
            local dep_state
            dep_state=$(gh issue view "${dep}" --json state --jq '.state' 2>/dev/null || echo "UNKNOWN")
            if [ "${dep_state}" != "CLOSED" ]; then
              log "이슈 #${issue_num}: 선행 이슈 #${dep} 미완료 (${dep_state}) → 디스패치 보류"
              blocked=true
              break
            fi
          done
        fi

        if [ "${blocked}" = false ]; then
          wait_for_slot
          # 중복 디스패치 방지: 즉시 라벨 전이
          gh issue edit "${issue_num}" --remove-label "status:todo" --add-label "status:in-progress" 2>/dev/null || true
          log "개발 대기 이슈 #${issue_num} 감지 → ${agent_name} 디스패치"
          "${SCRIPT_DIR}/dispatch-agent.sh" "${agent_name}" "${issue_num}" &
          break  # 한 사이클에 하나씩만 디스패치
        fi

        i=$((i + 1))
      done
    fi
  done

  # 역방향 전이: 리뷰 반려된 PR → Developer에게 재할당
  local rejected_prs
  rejected_prs=$(gh pr list --search "review:changes-requested" --json number,labels 2>/dev/null || echo "[]")
  local rejected_count
  rejected_count=$(echo "${rejected_prs}" | jq length 2>/dev/null || echo 0)

  if [ "${rejected_count}" -gt 0 ]; then
    local pr_num
    pr_num=$(echo "${rejected_prs}" | jq -r '.[0].number')
    # 이미 in-progress 라벨이면 중복 디스패치 방지
    local has_inprogress
    has_inprogress=$(echo "${rejected_prs}" | jq -r '.[0].labels[]?.name' 2>/dev/null | grep -c "status:in-progress" || true)
    if [ "${has_inprogress}" -eq 0 ]; then
      log "리뷰 반려 PR #${pr_num} 감지 → Developer 재할당"
      gh pr edit "${pr_num}" --remove-label "status:review" --add-label "status:in-progress" 2>/dev/null || true
      "${SCRIPT_DIR}/dispatch-agent.sh" developer "${pr_num}" &
    fi
  fi
}

MAX_RETRIES="${HARNESS_MAX_RETRIES:-2}"

# 에이전트 실행 + 재시도
dispatch_with_retry() {
  local agent="$1"
  local number="$2"
  local attempt=1

  while [ "${attempt}" -le "${MAX_RETRIES}" ]; do
    log "${agent} 실행 (시도 ${attempt}/${MAX_RETRIES})..."
    if "${SCRIPT_DIR}/dispatch-agent.sh" "${agent}" "${number}"; then
      return 0
    fi
    log "${agent} 실패 (시도 ${attempt}/${MAX_RETRIES})"
    attempt=$((attempt + 1))
    sleep 5
  done

  log "에러: ${agent} 에이전트가 ${MAX_RETRIES}회 시도 후 실패"

  # 실패 시 알림: 이슈에 blocked 라벨 + 코멘트
  if [ -n "${number}" ]; then
    gh issue edit "${number}" --add-label "status:blocked" 2>/dev/null || true
    gh issue comment "${number}" --body "$(cat <<EOF
## 에이전트 실패 알림

- **에이전트**: ${agent}
- **시도 횟수**: ${MAX_RETRIES}회
- **시각**: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- **로그**: \`.harness/logs/\` 에서 확인

수동 개입이 필요합니다.
EOF
)" 2>/dev/null || log "경고: 실패 알림 코멘트 작성 실패"
  fi

  return 1
}

MAX_FIX_LOOPS="${HARNESS_MAX_FIX_LOOPS:-3}"

# 이슈를 전체 파이프라인에 투입
run_pipeline() {
  local issue_num="$1"
  log "=== 파이프라인 시작: 이슈 #${issue_num} ==="

  # 0. 컨텍스트 맵 갱신
  if [ -f "${SCRIPT_DIR}/generate-context.sh" ]; then
    log "컨텍스트 맵 갱신..."
    bash "${SCRIPT_DIR}/generate-context.sh" 2>/dev/null || true
  fi

  # 1. Architect 설계
  log "1/6 Architect 설계 중..."
  update_phase "design"
  if ! dispatch_with_retry architect "${issue_num}"; then
    log "파이프라인 중단: Architect 실패"
    update_phase "failed"
    return 1
  fi

  # 2. Developer 구현
  log "2/6 Developer 구현 중..."
  update_phase "implementation"
  if ! dispatch_with_retry developer "${issue_num}"; then
    log "파이프라인 중단: Developer 실패"
    update_phase "failed"
    return 1
  fi

  # 3. PR 번호 찾기
  local pr_num
  pr_num=$(gh pr list --search "is:open #${issue_num}" --json number --jq '.[0].number' 2>/dev/null || echo "")

  if [ -z "${pr_num}" ]; then
    log "경고: PR을 찾을 수 없습니다. 수동 확인 필요."
    update_phase "failed"
    return 1
  fi

  # 4. Evaluator 정적 분석 + 코드 리뷰
  log "3/5 Evaluator 평가 중..."
  update_phase "evaluating"
  if ! dispatch_with_retry evaluator "${pr_num}"; then
    log "Evaluator 실패 → Developer 재수정 필요"
    dispatch_with_retry developer "${issue_num}" || true
    # 재시도
    if ! dispatch_with_retry evaluator "${pr_num}"; then
      log "파이프라인 중단: Evaluator 재실패"
      update_phase "failed"
      return 1
    fi
  fi

  # 5. QA 테스트 (피드백 루프 포함)
  log "4/5 QA 테스트 중..."
  update_phase "testing"

  local fix_loop=0
  while [ "${fix_loop}" -lt "${MAX_FIX_LOOPS}" ]; do
    if dispatch_with_retry qa "${pr_num}"; then
      log "QA 통과"
      break
    fi

    fix_loop=$((fix_loop + 1))
    if [ "${fix_loop}" -ge "${MAX_FIX_LOOPS}" ]; then
      log "QA ${MAX_FIX_LOOPS}회 실패 → 파이프라인 중단"
      update_phase "failed"
      return 1
    fi

    log "QA 실패 (${fix_loop}/${MAX_FIX_LOOPS}) → Developer fix-error 루프"

    # 실패 로그를 PR에 코멘트
    gh pr comment "${pr_num}" --body "QA 실패 (시도 ${fix_loop}/${MAX_FIX_LOOPS}). Developer에게 수정을 요청합니다." 2>/dev/null || true

    # Developer에게 에러 수정 요청
    update_phase "fix"
    if ! dispatch_with_retry developer "${issue_num}"; then
      log "Developer 수정 실패"
      update_phase "failed"
      return 1
    fi

    # 변경 범위가 크면 Evaluator 재평가
    local changed_files
    changed_files=$(gh pr diff "${pr_num}" --name-only 2>/dev/null | wc -l | tr -d ' ')
    if [ "${changed_files}" -gt 5 ]; then
      log "변경 파일 ${changed_files}개 → Evaluator 재평가"
      update_phase "evaluating"
      dispatch_with_retry evaluator "${pr_num}" || true
    fi

    update_phase "testing"
  done

  # 6. 완료
  update_phase "done"
  log "=== 파이프라인 완료: 이슈 #${issue_num} ==="
}

# 전체 파이프라인 (Planner부터 시작)
run_full_pipeline() {
  local issue_num="$1"
  log "=== 전체 파이프라인 시작: 이슈 #${issue_num} ==="

  # 현재 시각 기록 — PM이 생성한 이슈만 필터링하기 위해
  local pipeline_start
  pipeline_start=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # 0. Planner 기획
  log "0/N Planner 기획 중..."
  update_phase "planning"
  if ! dispatch_with_retry planner "${issue_num}"; then
    log "Planner 실패 → PM 단계로 진행"
  fi

  # 1. PM 이슈 분해
  log "1/N PM 이슈 분해 중..."
  update_phase "decomposition"
  if ! dispatch_with_retry pm "${issue_num}"; then
    log "파이프라인 중단: PM 실패"
    update_phase "failed"
    return 1
  fi

  # PM이 생성한 하위 이슈 찾기 — 파이프라인 시작 이후 생성된 이슈만
  local sub_issues
  sub_issues=$(gh issue list --label "status:todo" --json number,createdAt \
    --jq "[.[] | select(.createdAt >= \"${pipeline_start}\")] | .[].number" 2>/dev/null || echo "")

  if [ -z "${sub_issues}" ]; then
    log "경고: PM이 생성한 하위 이슈를 찾을 수 없습니다."
    return 1
  fi

  # 각 하위 이슈에 대해 pipeline 실행
  for sub in ${sub_issues}; do
    run_pipeline "${sub}"
  done

  log "=== 전체 파이프라인 완료 ==="
}

# 여러 이슈를 병렬로 Developer에게 할당
run_parallel() {
  local issues=("$@")
  log "=== 병렬 개발 시작: ${issues[*]} ==="
  update_phase "implementation"

  local pids=()
  for issue_num in "${issues[@]}"; do
    log "Developer 디스패치: 이슈 #${issue_num}"
    "${SCRIPT_DIR}/dispatch-agent.sh" developer "${issue_num}" &
    pids+=($!)
  done

  # 모든 Developer 완료 대기
  for pid in "${pids[@]}"; do
    wait "${pid}" || log "경고: PID ${pid} 비정상 종료"
  done

  log "=== 병렬 개발 완료 ==="
}

# 이벤트 루프
start_loop() {
  log "=== 오케스트레이터 시작 (폴링 간격: ${POLL_INTERVAL}초) ==="
  log "중지: Ctrl+C"

  while true; do
    # 만료된 파일 잠금 정리
    if [ -f "${SCRIPT_DIR}/lock-file.sh" ]; then
      "${SCRIPT_DIR}/lock-file.sh" cleanup 2>/dev/null || true
    fi
    sync_github
    auto_dispatch
    sleep "${POLL_INTERVAL}"
  done
}

# 현재 상태 출력 (칸반 보드 형식)
show_status() {
  echo "=== Harness 칸반 보드 ==="
  echo ""

  if ! gh auth status &> /dev/null 2>&1; then
    echo "(GitHub 접근 불가 — 로컬 상태만 표시)"
    echo ""
    if [ -f "${STATE_FILE}" ] && command -v jq &> /dev/null; then
      jq '.' "${STATE_FILE}"
    fi
    return
  fi

  # 각 상태별 이슈/PR 조회
  local todo review inprog qa done blocked
  todo=$(gh issue list --label "status:todo" --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null)
  inprog=$(gh issue list --label "status:in-progress" --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null)
  review=$(gh pr list --label "status:review" --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null)
  qa=$(gh pr list --label "status:qa" --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null)
  done=$(gh issue list --label "status:done" --state closed --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null | head -5)
  blocked=$(gh issue list --label "status:blocked" --json number,title --template '{{range .}}  #{{.number}} {{.title}}{{"\n"}}{{end}}' 2>/dev/null)

  printf "%-30s | %-30s | %-30s | %-30s | %-30s\n" \
    "TODO" "IN PROGRESS" "REVIEW" "QA" "DONE (최근 5)"
  printf "%-30s-+-%-30s-+-%-30s-+-%-30s-+-%-30s\n" \
    "------------------------------" "------------------------------" "------------------------------" "------------------------------" "------------------------------"

  echo "${todo:-  (없음)}"
  echo ""
  echo "--- IN PROGRESS ---"
  echo "${inprog:-  (없음)}"
  echo ""
  echo "--- REVIEW ---"
  echo "${review:-  (없음)}"
  echo ""
  echo "--- QA ---"
  echo "${qa:-  (없음)}"
  echo ""
  echo "--- DONE (최근 5) ---"
  echo "${done:-  (없음)}"

  if [ -n "${blocked}" ]; then
    echo ""
    echo "--- BLOCKED ---"
    echo "${blocked}"
  fi

  echo ""

  # 상태 파일 요약
  if [ -f "${STATE_FILE}" ] && command -v jq &> /dev/null; then
    local phase
    phase=$(jq -r '.current_phase // "unknown"' "${STATE_FILE}")
    echo "현재 Phase: ${phase}"
  fi
}

# 메인
case "${1:-}" in
  start)
    start_loop
    ;;
  status)
    show_status
    ;;
  dispatch)
    if [ $# -lt 3 ]; then
      echo "사용법: $0 dispatch <agent> <번호>"
      exit 1
    fi
    "${SCRIPT_DIR}/dispatch-agent.sh" "$2" "$3"
    ;;
  pipeline)
    if [ $# -lt 2 ]; then
      echo "사용법: $0 pipeline <이슈번호>"
      exit 1
    fi
    run_pipeline "$2"
    ;;
  full)
    if [ $# -lt 2 ]; then
      echo "사용법: $0 full <이슈번호>"
      exit 1
    fi
    run_full_pipeline "$2"
    ;;
  parallel)
    shift
    if [ $# -lt 2 ]; then
      echo "사용법: $0 parallel <이슈1> <이슈2> [이슈3...]"
      exit 1
    fi
    run_parallel "$@"
    ;;
  *)
    usage
    ;;
esac
