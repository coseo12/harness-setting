'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, execSync } = require('node:child_process');

const { buildManifest, writeManifest } = require('./manifest');
const { writeDefaultPolicy } = require('./policy');

const PKG_ROOT = path.resolve(__dirname, '..');
const PKG_VERSION = require(path.join(PKG_ROOT, 'package.json')).version;

// 복사할 디렉토리/파일 목록
const COPY_DIRS = ['.claude', '.github', 'scripts', 'docs'];
const COPY_FILES = ['CLAUDE.md'];

/**
 * 필수 도구 존재 여부 검사
 */
function checkTool(cmd, url) {
  try {
    const ver = execSync(`${cmd} --version 2>&1`, { encoding: 'utf8' }).split('\n')[0];
    console.log(`  [OK] ${cmd}: ${ver}`);
    return true;
  } catch {
    console.log(`  [MISSING] ${cmd}: 설치 필요 → ${url}`);
    return false;
  }
}

/**
 * init-project.sh의 Node.js 재구현
 * 패키지 루트에서 대상 디렉토리로 템플릿 파일을 복사
 */
function copyTemplate(targetDir) {
  const dest = path.resolve(process.cwd(), targetDir);

  console.log('=== Harness Engineering Framework 초기화 ===\n');
  console.log('환경 검사 중...');

  // 필수 도구 검사
  let missing = false;
  if (!checkTool('git', 'https://git-scm.com/')) missing = true;
  if (!checkTool('gh', 'https://cli.github.com/')) missing = true;
  if (!checkTool('claude', 'https://docs.anthropic.com/en/docs/claude-code')) missing = true;

  // jq는 권장
  try {
    const jqVer = execSync('jq --version 2>&1', { encoding: 'utf8' }).trim();
    console.log(`  [OK] jq: ${jqVer}`);
  } catch {
    console.log('  [WARN] jq: 미설치 (권장). 오케스트레이터 기능 일부 제한됨');
  }

  // gh 인증 확인
  try {
    execSync('gh auth status 2>&1', { encoding: 'utf8' });
    console.log('  [OK] gh 인증 확인됨');
  } catch {
    console.log('  [WARN] gh 미인증. 나중에 \'gh auth login\' 필요');
  }

  if (missing) {
    console.log('\n필수 도구가 누락되었습니다. 설치 후 다시 실행하세요.');
    process.exit(1);
  }

  console.log(`\n대상 디렉토리: ${dest}`);

  // 대상 디렉토리 생성
  fs.mkdirSync(dest, { recursive: true });

  // 디렉토리 복사
  console.log('Harness 설정 파일 복사 중...');
  for (const dir of COPY_DIRS) {
    const src = path.join(PKG_ROOT, dir);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(dest, dir), { recursive: true });
      console.log(`  - ${dir}/ 복사 완료`);
    }
  }

  // 파일 복사
  for (const file of COPY_FILES) {
    const src = path.join(PKG_ROOT, file);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(dest, file));
      console.log(`  - ${file} 복사 완료`);
    }
  }

  // .harness/state.json 생성
  const harnessDir = path.join(dest, '.harness');
  const logsDir = path.join(harnessDir, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const projectName = path.basename(dest);
  const stateJson = {
    project: projectName,
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    current_phase: 'planning',
    agents: {
      orchestrator: { status: 'idle', current_task: null },
      planner: { status: 'idle', current_task: null },
      pm: { status: 'idle', current_task: null },
      architect: { status: 'idle', current_task: null },
      'frontend-developers': [],
      'backend-developers': [],
      developers: [],
      reviewer: { status: 'idle', current_task: null },
      qa: { status: 'idle', current_task: null },
      auditor: { status: 'idle', current_task: null },
      integrator: { status: 'idle', current_task: null },
    },
    issues: [],
    pull_requests: [],
    blocked: [],
  };
  fs.writeFileSync(
    path.join(harnessDir, 'state.json'),
    JSON.stringify(stateJson, null, 2) + '\n'
  );
  console.log('  - .harness/state.json 생성 완료');

  // .harness/policy.json — 페르소나 호출 정책 (auto/manual)
  try {
    writeDefaultPolicy(dest);
    console.log('  - .harness/policy.json 생성 완료 (페르소나 자동/수동 정책)');
  } catch (err) {
    console.log(`  [WARN] policy.json 생성 실패: ${err.message}`);
  }

  // .harness/manifest.json — update 추적용 baseline (방금 복사한 파일들을 박제)
  try {
    const manifest = buildManifest(dest, PKG_VERSION);
    writeManifest(dest, manifest);
    console.log(`  - .harness/manifest.json 생성 완료 (v${PKG_VERSION}, ${Object.keys(manifest.files).length}개 파일 추적)`);
  } catch (err) {
    console.log(`  [WARN] manifest 생성 실패: ${err.message}`);
  }

  // .gitignore 업데이트
  const gitignorePath = path.join(dest, '.gitignore');
  let gitignore = '';
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }
  if (!gitignore.includes('.harness/logs')) {
    gitignore += '\n# Harness 로그 (상태 파일은 추적)\n.harness/logs/\n';
  }
  if (!gitignore.includes('node_modules')) {
    gitignore += '\n# Node.js\nnode_modules/\n';
  }
  fs.writeFileSync(gitignorePath, gitignore);

  // scripts/*.sh 실행 권한 부여
  const scriptsDir = path.join(dest, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const shFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
    for (const sh of shFiles) {
      fs.chmodSync(path.join(scriptsDir, sh), 0o755);
    }
    console.log('  - scripts/*.sh 실행 권한 설정 완료');
  }

  // git init (없으면)
  const gitDir = path.join(dest, '.git');
  if (!fs.existsSync(gitDir)) {
    try {
      execFileSync('git', ['init'], { cwd: dest, stdio: 'pipe' });
      console.log('  - Git 저장소 초기화 완료');
    } catch (err) {
      console.log('  [WARN] Git 초기화 실패:', err.message);
    }
  }

  // develop 브랜치 생성
  try {
    execFileSync('git', ['checkout', '-b', 'develop'], {
      cwd: dest,
      stdio: 'pipe',
    });
    console.log('  - develop 브랜치 생성 완료');
  } catch {
    // 이미 존재하면 무시
  }

  console.log('\n=== 초기화 완료 ===\n');
  console.log('다음 단계:');
  console.log('  1. GitHub 저장소 생성 후 리모트 연결');
  console.log('     git remote add origin <URL>');
  console.log('  2. 라벨 생성 (아직 안 했다면)');
  console.log('     harness labels');
  console.log('  3. 오케스트레이터 시작');
  console.log('     harness orchestrator start');
  console.log('  4. 또는 개별 에이전트 실행');
  console.log('     harness dispatch <pm|architect|developer|reviewer|qa> <이슈번호>');
}

module.exports = { copyTemplate };
