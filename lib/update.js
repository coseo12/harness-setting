'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  walkTracked,
  buildManifest,
  readManifest,
  writeManifest,
  manifestPath,
  sha256File,
} = require('./manifest');
const { categorize } = require('./categorize');

const PKG_ROOT = path.resolve(__dirname, '..');
const PKG_VERSION = require(path.join(PKG_ROOT, 'package.json')).version;

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};
const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

/**
 * 로컬 설치본과 패키지 본을 비교하여 파일별 액션을 결정한다.
 *
 * 액션 종류:
 *   - identical            : 동일, 변경 없음
 *   - added                : 패키지에만 있음 (신규 도입)
 *   - removed-upstream     : 매니페스트에 있으나 패키지에서 사라짐
 *   - missing-locally      : 매니페스트에 있으나 사용자 디렉토리에서 사라짐 (사용자 삭제)
 *   - modified-pristine    : 사용자가 안 건드림 + 패키지가 바뀜 (안전 덮어쓰기)
 *   - converged            : 사용자가 수정했지만 패키지와 우연히 일치
 *   - divergent            : 사용자도 수정 + 패키지도 변경 (3-way merge 필요, B에선 수동)
 *   - user-modified-stable : 사용자가 수정 + 패키지는 그대로 (사용자 변경 보존)
 */
function diffAgainstPackage(cwd, manifest) {
  const userFiles = walkTracked(cwd);
  const pkgFiles = walkTracked(PKG_ROOT);
  const actions = [];

  const allRels = new Set([
    ...Object.keys(manifest.files),
    ...Object.keys(userFiles),
    ...Object.keys(pkgFiles),
  ]);

  for (const rel of allRels) {
    const inManifest = manifest.files[rel];
    const inUser = userFiles[rel];
    const inPkg = pkgFiles[rel];
    const category = categorize(rel);

    const userSha = inUser ? sha256File(inUser) : null;
    const pkgSha = inPkg ? sha256File(inPkg) : null;
    const baseSha = inManifest ? inManifest.sha256 : null;

    let action;
    if (!inManifest && inPkg && !inUser) action = 'added';
    else if (!inManifest && inPkg && inUser) {
      action = userSha === pkgSha ? 'converged' : 'divergent';
    } else if (inManifest && !inPkg) action = 'removed-upstream';
    else if (inManifest && !inUser) action = 'missing-locally';
    else if (userSha === pkgSha) action = 'identical';
    else if (userSha === baseSha) action = 'modified-pristine';
    else if (pkgSha === baseSha) action = 'user-modified-stable';
    else action = 'divergent';

    actions.push({ rel, category, action, userSha, pkgSha, baseSha });
  }

  return actions;
}

function summarize(actions) {
  const counts = {};
  for (const a of actions) counts[a.action] = (counts[a.action] || 0) + 1;
  return counts;
}

/**
 * `harness update --check` — 비파괴 요약
 */
function check(cwd = process.cwd()) {
  const manifest = readManifest(cwd);
  if (!manifest) {
    return { ok: false, reason: 'no-manifest', message: noManifestMessage(cwd) };
  }

  const actions = diffAgainstPackage(cwd, manifest);
  const counts = summarize(actions);
  const lines = [];

  lines.push(c('bold', '\n📦 Harness Update — 변경 요약\n'));
  lines.push(`  설치 버전 : ${c('cyan', manifest.harnessVersion)}`);
  lines.push(`  최신 버전 : ${c('cyan', PKG_VERSION)}`);
  lines.push(`  설치 시점 : ${c('gray', manifest.installedAt)}`);
  lines.push('');

  if (manifest.harnessVersion === PKG_VERSION && (counts.divergent || 0) === 0 && (counts['modified-pristine'] || 0) === 0 && (counts.added || 0) === 0 && (counts['removed-upstream'] || 0) === 0) {
    lines.push(c('green', '  ✅ 최신입니다. 적용할 변경 없음.'));
    return { ok: true, manifest, actions, counts, output: lines.join('\n') };
  }

  const buckets = [
    ['added', '신규 추가', 'green'],
    ['modified-pristine', '안전 업데이트 (사용자 미수정)', 'green'],
    ['divergent', '충돌 (사용자도 수정 + 패키지도 변경)', 'red'],
    ['user-modified-stable', '사용자 변경 보존 (패키지 미변경)', 'gray'],
    ['removed-upstream', '상위에서 삭제됨', 'yellow'],
    ['missing-locally', '로컬에서 누락', 'yellow'],
    ['converged', '우연히 일치', 'gray'],
    ['identical', '동일', 'gray'],
  ];

  for (const [key, label, color] of buckets) {
    if (!counts[key]) continue;
    lines.push(`  ${c(color, '●')} ${label}: ${c('bold', counts[key])}`);
    if (key !== 'identical' && key !== 'converged' && key !== 'user-modified-stable') {
      for (const a of actions.filter((x) => x.action === key)) {
        lines.push(`      ${c('gray', `[${a.category}]`)} ${a.rel}`);
      }
    }
  }

  lines.push('');
  lines.push(c('cyan', '  다음 단계:'));
  lines.push('    harness update              # 파일별 diff 표시 (자동 적용 안 함)');
  lines.push('    harness update --apply-frozen   # frozen 카테고리만 자동 덮어쓰기');
  lines.push('');
  if (counts.divergent) {
    lines.push(c('yellow', '  ⚠  Phase B는 자동 머지를 지원하지 않습니다. divergent 파일은 수동으로 검토/적용하세요.'));
  }

  return { ok: true, manifest, actions, counts, output: lines.join('\n') };
}

/**
 * `harness update` — diff 표시 + 옵션에 따라 frozen 자동 적용
 */
function update(cwd = process.cwd(), opts = {}) {
  const result = check(cwd);
  if (!result.ok) return result;
  const { actions } = result;
  const lines = [result.output, ''];

  let appliedCount = 0;

  for (const a of actions) {
    if (a.action === 'identical' || a.action === 'converged' || a.action === 'user-modified-stable') continue;

    lines.push(c('bold', `\n── ${a.rel} `) + c('gray', `[${a.category}/${a.action}]`));

    if (a.action === 'modified-pristine' && opts.applyFrozen && a.category === 'frozen') {
      const src = path.join(PKG_ROOT, a.rel);
      const dest = path.join(cwd, a.rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      lines.push(c('green', `  ✓ frozen 자동 적용 완료`));
      appliedCount++;
      continue;
    }

    if (a.action === 'added') {
      lines.push(c('green', `  + 신규 파일 — 적용 권장:`));
      lines.push(c('gray', `    cp ${path.join(PKG_ROOT, a.rel)} ${a.rel}`));
    } else if (a.action === 'removed-upstream') {
      lines.push(c('yellow', `  - 상위에서 제거됨 — 삭제 여부 직접 결정:`));
      lines.push(c('gray', `    rm ${a.rel}`));
    } else if (a.action === 'missing-locally') {
      lines.push(c('yellow', `  ! 로컬에서 누락 — 의도적이 아니면 복원:`));
      lines.push(c('gray', `    cp ${path.join(PKG_ROOT, a.rel)} ${a.rel}`));
    } else if (a.action === 'modified-pristine') {
      lines.push(c('green', `  ↑ 안전 업데이트 가능 (사용자 미수정):`));
      lines.push(c('gray', `    cp ${path.join(PKG_ROOT, a.rel)} ${a.rel}`));
    } else if (a.action === 'divergent') {
      lines.push(c('red', `  ✗ 충돌 — 사용자 수정과 패키지 변경 모두 존재. 수동 머지 필요:`));
      lines.push(c('gray', `    diff -u ${a.rel} ${path.join(PKG_ROOT, a.rel)}`));
    }
  }

  if (appliedCount > 0) {
    lines.push('');
    lines.push(c('cyan', `  매니페스트를 갱신하려면:`));
    lines.push('    harness update --bootstrap   # 현재 상태를 새 baseline으로 기록');
  }

  lines.push('');
  lines.push(c('gray', '  ℹ  Phase B는 안전을 위해 atomic/managed-block 파일을 자동 적용하지 않습니다.'));
  lines.push(c('gray', '     사용자가 cp 명령을 직접 실행하거나 Edit 도구로 머지하세요.'));
  lines.push(c('gray', '     적용 완료 후 `harness update --bootstrap` 으로 매니페스트를 갱신하세요.'));

  return { ok: true, output: lines.join('\n'), appliedCount };
}

/**
 * `harness update --bootstrap` — 현재 상태를 새 baseline으로 박제
 * 매니페스트가 없거나, 수동 머지 후 baseline을 갱신할 때 사용.
 */
function bootstrap(cwd = process.cwd()) {
  const manifest = buildManifest(cwd, PKG_VERSION);
  const written = writeManifest(cwd, manifest);
  const lines = [];
  lines.push(c('bold', '\n📦 Harness Update — Bootstrap\n'));
  lines.push(`  매니페스트 생성: ${c('cyan', written)}`);
  lines.push(`  버전 기록     : ${c('cyan', PKG_VERSION)}`);
  lines.push(`  추적 파일 수  : ${c('cyan', Object.keys(manifest.files).length)}`);
  lines.push('');
  lines.push(c('green', '  ✅ 이후 `harness update --check` 로 변경을 추적할 수 있습니다.'));
  return { ok: true, output: lines.join('\n'), manifest };
}

function noManifestMessage(cwd) {
  const lines = [];
  lines.push(c('bold', '\n📦 Harness Update\n'));
  lines.push(c('yellow', `  ⚠  매니페스트가 없습니다 (${manifestPath(cwd)}).`));
  lines.push('');
  lines.push('  이 프로젝트는 update 추적이 활성화되지 않았습니다.');
  lines.push('  현재 상태를 baseline으로 기록하려면:');
  lines.push('');
  lines.push(c('cyan', '    harness update --bootstrap'));
  lines.push('');
  lines.push(c('gray', '  주의: bootstrap은 "지금 상태가 정상"임을 가정합니다. 손상된 설치라면 먼저 init을 다시 실행하세요.'));
  return lines.join('\n');
}

module.exports = { check, update, bootstrap, PKG_VERSION };
