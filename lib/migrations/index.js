'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * 마이그레이션 등록.
 * 각 마이그레이션은 { from, to, name, run(cwd, manifest) -> { changed: string[], notes: string[] } }.
 * - from: 시작 버전 (semver). semver 비교는 단순 split — pre-release 비지원.
 * - to: 도달 버전.
 * - run: 사용자 디렉토리(cwd) 와 현재 manifest를 받아 변경 수행. 부수효과 발생 가능.
 */
const MIGRATIONS = [
  require('./2.1.0-to-2.2.0'),
  require('./2.2.0-to-2.3.0'),
];

function cmpSemver(a, b) {
  const pa = a.split('.').map((n) => parseInt(n, 10));
  const pb = b.split('.').map((n) => parseInt(n, 10));
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/**
 * fromVersion → toVersion 사이에 적용해야 할 마이그레이션 체인을 반환.
 */
function planMigrations(fromVersion, toVersion) {
  return MIGRATIONS.filter(
    (m) => cmpSemver(fromVersion, m.from) <= 0 && cmpSemver(m.to, toVersion) <= 0
  ).sort((a, b) => cmpSemver(a.from, b.from));
}

function runMigrations(cwd, manifest, toVersion) {
  const plan = planMigrations(manifest.harnessVersion, toVersion);
  const results = [];
  for (const mig of plan) {
    const result = mig.run(cwd, manifest);
    results.push({ migration: `${mig.from}→${mig.to} ${mig.name}`, ...result });
  }
  return results;
}

module.exports = { planMigrations, runMigrations, cmpSemver };
