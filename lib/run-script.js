'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PKG_SCRIPTS_DIR = path.resolve(__dirname, '..', 'scripts');

/**
 * Bash 스크립트 실행 헬퍼
 * 로컬 프로젝트의 scripts/에 해당 스크립트가 있으면 로컬 사용, 없으면 패키지 내부 폴백
 */
function runScript(scriptName, args = []) {
  const localPath = path.resolve(process.cwd(), 'scripts', scriptName);
  const pkgPath = path.join(PKG_SCRIPTS_DIR, scriptName);

  let scriptPath;
  if (fs.existsSync(localPath)) {
    scriptPath = localPath;
  } else if (fs.existsSync(pkgPath)) {
    scriptPath = pkgPath;
  } else {
    console.error(`스크립트를 찾을 수 없습니다: ${scriptName}`);
    console.error(`  로컬: ${localPath}`);
    console.error(`  패키지: ${pkgPath}`);
    process.exit(1);
  }

  try {
    execFileSync('bash', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (err) {
    // execFileSync는 프로세스 종료 코드가 0이 아니면 에러를 던짐
    // stdio: inherit로 이미 출력이 표시되었으므로 종료 코드만 전달
    process.exit(err.status || 1);
  }
}

module.exports = { runScript };
