'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

/**
 * 3-way merge wrapper using `git merge-file`.
 * 입력: base / current / other (모두 텍스트)
 * 출력: { merged: string, conflicts: boolean }
 *
 * git merge-file 종료 코드: 0=깨끗, >0=충돌 갯수, <0=에러
 * 충돌 시 결과에 <<<<<<< ======= >>>>>>> 마커가 삽입됨.
 */
function threeWayMerge({ base, current, other, label = { current: 'LOCAL', other: 'PACKAGE' } }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-merge-'));
  const baseP = path.join(tmp, 'base');
  const curP = path.join(tmp, 'current');
  const othP = path.join(tmp, 'other');

  fs.writeFileSync(baseP, base);
  fs.writeFileSync(curP, current);
  fs.writeFileSync(othP, other);

  let conflicts = false;
  try {
    execFileSync(
      'git',
      ['merge-file', '-L', label.current, '-L', 'BASE', '-L', label.other, curP, baseP, othP],
      { stdio: 'pipe' }
    );
  } catch (err) {
    // status > 0 = 충돌. status < 0 또는 다른 에러는 throw.
    if (err.status && err.status > 0) {
      conflicts = true;
    } else {
      fs.rmSync(tmp, { recursive: true, force: true });
      throw err;
    }
  }

  const merged = fs.readFileSync(curP, 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
  return { merged, conflicts };
}

module.exports = { threeWayMerge };
