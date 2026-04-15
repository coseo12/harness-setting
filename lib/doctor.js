'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

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
  if (fs.existsSync(manifestPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const fileCount = m.files ? Object.keys(m.files).length : 0;
      report.add('pass', '.harness/manifest.json', `update 추적 활성 (v${m.harnessVersion}, ${fileCount}개 파일)`);
    } catch (err) {
      report.add('fail', '.harness/manifest.json', `JSON 파싱 실패: ${err.message}`);
    }
  } else {
    report.add('warn', '.harness/manifest.json', 'update 추적 미활성 — `harness update --bootstrap` 권장');
  }

  // 6. 현재 브랜치가 main/master가 아닌지
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

module.exports = { runDoctor, formatReport };
