'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { categoricalSha256 } = require('./manifest');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * 개별 점검 결과 누적기
 * status: 'pass' | 'warn' | 'fail'
 */
function createReport() {
  const items = [];
  return {
    add(status, name, detail) {
      items.push({ status, name, detail });
    },
    items,
    summary() {
      const pass = items.filter((i) => i.status === 'pass').length;
      const warn = items.filter((i) => i.status === 'warn').length;
      const fail = items.filter((i) => i.status === 'fail').length;
      return { pass, warn, fail, total: items.length };
    },
  };
}

function checkFileContains(filePath, needle) {
  if (!fs.existsSync(filePath)) return { ok: false, reason: '파일 없음' };
  const content = fs.readFileSync(filePath, 'utf8');
  return { ok: content.includes(needle), content };
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

/**
 * gitflow 브랜치 정합성 분류 — origin/main 과 origin/develop 의 커밋 격차로 drift 를 판정.
 * 순수 함수로 분리해 doctor 의 git 호출 없이 단위 테스트 가능하게 한다.
 *
 * 분류 (v2.15.0 — #105 #110 통합):
 *   - null 입력 (rev-list 실패 또는 unrelated histories) → warn: 공통 조상 확인 요청
 *   - mainAhead === 0 → pass: 동기 또는 릴리스 대기 정상
 *   - mainAhead > 0 && developIsAncestorOfMain → pass: fast-forward 동기화 대기 중 (merge commit 직후 정상)
 *   - mainAhead > 0 && hasHotfixBranch → warn: hotfix 진행 중 (merge-back PR 대기)
 *   - mainAhead > 0 (기타) → warn: hotfix merge-back 누락 또는 release squash 실수 의심
 *
 * 과거 drift 사례 (v2.12.0 이전): dual PR 변형 + 고빈도 작업 압박으로 develop 이 main 보다 56 커밋 뒤처짐.
 * 이 함수가 해당 상태를 조기 탐지하는 신호원이다.
 *
 * @param {number|null} mainAhead origin/develop..origin/main 커밋 수 (null = rev-list 실패)
 * @param {number|null} devAhead  origin/main..origin/develop 커밋 수 (null = rev-list 실패)
 * @param {object} opts
 * @param {boolean} [opts.developIsAncestorOfMain] develop 이 main 의 직계 조상인가 (merge commit 직후 true)
 * @param {string|null} [opts.hasHotfixBranch] hotfix/* 브랜치가 있으면 브랜치명, 아니면 null
 */
function classifyGitflowDrift(mainAhead, devAhead, opts = {}) {
  const { developIsAncestorOfMain = false, hasHotfixBranch = null } = opts;

  // unrelated histories 또는 rev-list 실패 방어 (#105 (1))
  if (mainAhead === null || devAhead === null) {
    return {
      status: 'warn',
      detail: 'origin/main 과 origin/develop 격차 계산 실패 — unrelated histories 또는 ref 부재 가능성. `git merge-base origin/main origin/develop` 로 공통 조상 확인 후 `git fetch --prune` 재실행',
    };
  }

  if (mainAhead === 0) {
    return {
      status: 'pass',
      detail:
        devAhead === 0
          ? '동기 (릴리스 직후 또는 초기 상태)'
          : `develop 이 main 보다 ${devAhead} 커밋 앞섬 (릴리스 대기 정상)`,
    };
  }

  // merge commit 직후 fast-forward 전 정상 상태 (#110 Gemini 고유 발견)
  if (developIsAncestorOfMain) {
    return {
      status: 'pass',
      detail: `main 이 develop 보다 ${mainAhead} 커밋 앞섬이나 develop 이 main 의 조상 — fast-forward 동기화 대기 중 (정상). \`git push origin main:develop\` 로 해소`,
    };
  }

  // hotfix 진행 중 (#105 (3))
  if (hasHotfixBranch) {
    return {
      status: 'warn',
      detail: `main 이 develop 보다 ${mainAhead} 커밋 앞섬 — hotfix 진행 중 (${hasHotfixBranch}). 머지 후 \`main → develop\` merge-back PR 필요`,
    };
  }

  return {
    status: 'warn',
    detail: `main 이 develop 보다 ${mainAhead} 커밋 앞섬 — hotfix merge-back 누락 의심. release PR 직후라면 \`--squash\` 로 실수 머지한 가능성 (ADR: release PR 은 \`--merge\` 필수). merge-back PR 또는 release PR revert+재머지 로 복구`,
  };
}

/**
 * 셋업 시 에이전트가 놓치기 쉬운 핵심 규칙/구성을 자체 점검한다.
 * 세션 시작 직후 또는 신규 프로젝트 초기화 후 실행 권장.
 */
function runDoctor(cwd = process.cwd()) {
  const report = createReport();

  // 1. CLAUDE.md CRITICAL DIRECTIVES 블록 존재
  const claudeMd = path.join(cwd, 'CLAUDE.md');
  const critical = checkFileContains(claudeMd, 'CRITICAL DIRECTIVES');
  report.add(
    critical.ok ? 'pass' : 'fail',
    'CLAUDE.md CRITICAL DIRECTIVES 블록',
    critical.ok ? '상단 규칙 블록 존재' : 'CLAUDE.md 상단에 CRITICAL DIRECTIVES 블록이 없습니다'
  );

  // 2. 한글 인코딩 깨짐 검사
  // U+FFFD를 문서에서 설명하는 라인(예시/규칙 인용)은 오탐이므로 제외
  if (critical.content) {
    // 문서 설명 라인(U+FFFD 언급) 또는 인라인 코드(`...�...`) 내부의 참조는 오탐으로 제외
    const offenders = critical.content.split('\n').filter((line) => {
      if (!line.includes('\uFFFD')) return false;
      if (line.includes('U+FFFD')) return false;
      const stripped = line.replace(/`[^`]*`/g, '');
      return stripped.includes('\uFFFD');
    });
    report.add(
      offenders.length === 0 ? 'pass' : 'fail',
      'CLAUDE.md 한글 인코딩',
      offenders.length === 0 ? '깨진 문자 없음' : `실제 깨짐 ${offenders.length}줄 발견`
    );
  }

  // 3. .claude/settings.json SessionStart hook
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    report.add('fail', '.claude/settings.json', '파일 없음');
  } else {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const hasHook = !!(settings.hooks && settings.hooks.SessionStart);
      report.add(
        hasHook ? 'pass' : 'warn',
        'SessionStart hook',
        hasHook ? '규칙 주입 훅 활성' : '훅 미설정 — 초기화 시 규칙 인식률 저하 위험'
      );
    } catch (err) {
      report.add('fail', '.claude/settings.json', `JSON 파싱 실패: ${err.message}`);
    }
  }

  // 4. .claude/agents, .claude/skills 존재
  for (const dir of ['.claude/agents', '.claude/skills']) {
    const full = path.join(cwd, dir);
    const exists = fs.existsSync(full) && fs.statSync(full).isDirectory();
    report.add(exists ? 'pass' : 'warn', dir, exists ? '존재' : '디렉토리 없음');
  }

  // 5. .harness/manifest.json 존재 여부 (update 추적 활성화 확인)
  const manifestPath = path.join(cwd, '.harness', 'manifest.json');
  let parsedManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      parsedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const fileCount = parsedManifest.files ? Object.keys(parsedManifest.files).length : 0;
      report.add('pass', '.harness/manifest.json', `update 추적 활성 (v${parsedManifest.harnessVersion}, ${fileCount}개 파일)`);
    } catch (err) {
      report.add('fail', '.harness/manifest.json', `JSON 파싱 실패: ${err.message}`);
    }
  } else {
    report.add('warn', '.harness/manifest.json', 'update 추적 미활성 — `harness update --bootstrap` 권장');
  }

  // 5b. 매니페스트 기록 해시 vs 파일 실측 해시 일치 검증 (해시 위조 탐지)
  // 분류 (v2.10.0 — #92 Phase 2):
  //   (a) pass            — 모든 파일 일치
  //   (b) 외부 롤백 의심   — actual === previousSha256 (v2.9.0 자가 복구 신호)
  //   (c) 해시 불일치      — actual ≠ sha256 AND ≠ previousSha256 (사용자 수정 또는 근원 불명)
  //   (d) 파일 누락        — baseline 파손
  // 외부 롤백 의심은 `--apply-all-safe` 로 자가 복구 가능함을 별도 항목으로 안내.
  if (parsedManifest && parsedManifest.files) {
    const rolledBack = []; // previousSha256 매치
    const mismatched = []; // 분류 불가능한 불일치
    const missing = [];
    for (const [rel, entry] of Object.entries(parsedManifest.files)) {
      const abs = path.join(cwd, rel);
      if (!fs.existsSync(abs)) {
        missing.push(rel);
        continue;
      }
      try {
        const actual = categoricalSha256(rel, abs);
        if (actual === entry.sha256) continue;
        if (entry.previousSha256 && actual === entry.previousSha256) {
          rolledBack.push(rel);
        } else {
          mismatched.push(rel);
        }
      } catch {
        // 파일 읽기 실패는 무시 (권한 등)
      }
    }
    if (rolledBack.length === 0 && mismatched.length === 0 && missing.length === 0) {
      report.add('pass', '매니페스트 해시 정합성', '기록된 모든 파일의 실측 해시 일치');
    } else {
      if (rolledBack.length > 0) {
        report.add(
          'warn',
          '매니페스트 해시 정합성 — 외부 롤백 의심',
          `${rolledBack.length}건 (previousSha256 매치) — \`harness update --apply-all-safe\` 로 자가 복구 가능`
        );
      }
      if (mismatched.length > 0 || missing.length > 0) {
        const parts = [];
        if (mismatched.length > 0) parts.push(`해시 불일치 ${mismatched.length}건`);
        if (missing.length > 0) parts.push(`파일 누락 ${missing.length}건`);
        report.add(
          'warn',
          '매니페스트 해시 정합성' + (rolledBack.length > 0 ? ' — 기타' : ''),
          `${parts.join(', ')} — 사용자 수정이면 정상. \`harness update --check\` 로 상세 확인`
        );
      }
    }
  }

  // 6a. .harnessignore — manifest 추적 제외 패턴 (사용자 오버라이드)
  const ignoreP = path.join(cwd, '.harnessignore');
  if (fs.existsSync(ignoreP)) {
    const lines = fs.readFileSync(ignoreP, 'utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    report.add('pass', '.harnessignore', `manifest 추적 제외 패턴 ${lines.length}개`);
  }

  // 6. .harness/policy.json — 페르소나 호출 정책
  const policyP = path.join(cwd, '.harness', 'policy.json');
  if (fs.existsSync(policyP)) {
    try {
      const pol = JSON.parse(fs.readFileSync(policyP, 'utf8'));
      const personas = pol.personas ? Object.keys(pol.personas).length : 0;
      report.add('pass', '.harness/policy.json', `페르소나 정책 ${personas}개 정의됨`);
    } catch (err) {
      report.add('fail', '.harness/policy.json', `JSON 파싱 실패: ${err.message}`);
    }
  } else {
    report.add('warn', '.harness/policy.json', '정책 미설정 — 모든 페르소나 호출이 수동 기본값');
  }

  // 7. stage:* 라벨 무결성 (현재 저장소에 라벨이 정의돼 있는지 + 다중 stage 동시 부여 검사)
  if (tryExec('git rev-parse --git-dir')) {
    const labelList = tryExec('gh label list --limit 100 --json name -q "[.[].name]"');
    if (labelList) {
      try {
        const names = JSON.parse(labelList);
        const stageLabels = names.filter((n) => n.startsWith('stage:'));
        const expected = ['stage:planning', 'stage:design', 'stage:dev', 'stage:review', 'stage:qa', 'stage:done'];
        const missing = expected.filter((e) => !stageLabels.includes(e));
        if (missing.length === 0) {
          report.add('pass', 'stage:* 라벨', `6종 모두 존재 (페르소나 핸드오프 가능)`);
        } else {
          report.add('warn', 'stage:* 라벨', `${missing.length}개 누락 — bash scripts/setup-stage-labels.sh 실행 권장`);
        }
      } catch {
        report.add('warn', 'stage:* 라벨', 'gh label list 파싱 실패');
      }
    } else {
      report.add('warn', 'stage:* 라벨', 'gh 미인증 또는 원격 저장소 미설정 — 점검 스킵');
    }
  }

  // 8. 현재 브랜치가 main/master가 아닌지
  const branch = tryExec('git rev-parse --abbrev-ref HEAD');
  if (branch) {
    const protectedBranch = branch === 'main' || branch === 'master';
    report.add(
      protectedBranch ? 'warn' : 'pass',
      '현재 브랜치',
      protectedBranch ? `보호 브랜치(${branch}) 작업 중 — feature/fix 브랜치 전환 권장` : branch
    );
  } else {
    report.add('warn', '현재 브랜치', 'git 저장소가 아니거나 확인 실패');
  }

  // 9. gitflow 브랜치 정합성 — origin/main 과 origin/develop 의 커밋 격차로 drift 조기 탐지
  //   근거: v2.12.0 이전 dual PR 변형 시기에 develop 이 56 커밋 뒤처진 drift 를 놓쳤음.
  //   분류 로직은 classifyGitflowDrift() 에 분리되어 단위 테스트 가능.
  //   v2.15.0 (#105 #110): --is-ancestor 체크로 merge commit 직후 거짓 양성 제거 + hotfix 문맥 인식 + unrelated histories 방어
  if (branch) {
    const hasOrigin = tryExec('git remote get-url origin');
    if (hasOrigin) {
      const mainRef = tryExec('git rev-parse --verify origin/main 2>/dev/null');
      const devRef = tryExec('git rev-parse --verify origin/develop 2>/dev/null');
      if (!mainRef || !devRef) {
        report.add(
          'warn',
          'gitflow 브랜치 정합성',
          'origin/main 또는 origin/develop ref 없음 — `git fetch --prune` 후 재확인'
        );
      } else {
        const mainAheadRaw = tryExec('git rev-list --count origin/develop..origin/main');
        const devAheadRaw = tryExec('git rev-list --count origin/main..origin/develop');
        const mainAhead = mainAheadRaw == null ? null : parseInt(mainAheadRaw, 10);
        const devAhead = devAheadRaw == null ? null : parseInt(devAheadRaw, 10);
        // develop 이 main 의 조상이면 fast-forward 로 동기화 가능 (merge commit 직후 정상)
        const ancestorCheck = tryExec('git merge-base --is-ancestor origin/develop origin/main && echo yes || echo no');
        const developIsAncestorOfMain = ancestorCheck === 'yes';
        // hotfix 진행 중 감지 — hotfix/* 브랜치 존재 시 첫 브랜치명 전달
        const hotfixList = tryExec("git branch -r --list 'origin/hotfix/*'");
        const hasHotfixBranch = hotfixList && hotfixList.trim()
          ? hotfixList.split('\n').map((s) => s.trim()).filter(Boolean)[0]
          : null;
        const result = classifyGitflowDrift(mainAhead, devAhead, { developIsAncestorOfMain, hasHotfixBranch });
        report.add(result.status, 'gitflow 브랜치 정합성', result.detail);
      }
    }
  }

  return report;
}

function formatReport(report) {
  const lines = [];
  lines.push(c('bold', '\n🔍 Harness Doctor — 프레임워크 자체 점검\n'));
  for (const item of report.items) {
    const icon =
      item.status === 'pass' ? c('green', '✓') : item.status === 'warn' ? c('yellow', '⚠') : c('red', '✗');
    lines.push(`  ${icon} ${item.name}`);
    if (item.detail) lines.push(`      ${c('cyan', item.detail)}`);
  }
  const s = report.summary();
  lines.push('');
  lines.push(
    `  통과 ${c('green', s.pass)} · 경고 ${c('yellow', s.warn)} · 실패 ${c('red', s.fail)} / 총 ${s.total}`
  );
  lines.push('');
  if (s.fail === 0 && s.warn === 0) {
    lines.push(c('green', '  ✅ 모든 규칙 구성이 정상입니다. A등급 유지 가능.'));
  } else if (s.fail === 0) {
    lines.push(c('yellow', '  ⚠  경고 항목을 검토하세요. 동작은 가능하지만 bypass 위험이 있습니다.'));
  } else {
    lines.push(c('red', '  ❌ 실패 항목을 수정한 뒤 작업을 시작하세요.'));
  }
  return lines.join('\n');
}

module.exports = { runDoctor, formatReport, classifyGitflowDrift };
