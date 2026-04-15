'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

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
 * 파일 단위 액션 종류:
 *   identical / added / removed-upstream / missing-locally /
 *   modified-pristine / converged / divergent / user-modified-stable
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
 * harness update --check — 비파괴 요약
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

  const noChange =
    manifest.harnessVersion === PKG_VERSION &&
    !counts.divergent &&
    !counts['modified-pristine'] &&
    !counts.added &&
    !counts['removed-upstream'];
  if (noChange) {
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
  lines.push(c('cyan', '  적용 옵션:'));
  lines.push('    harness update --apply-all-safe   # frozen + pristine + added 자동 적용 (충돌 없는 모든 변경)');
  lines.push('    harness update --apply-frozen     # frozen 카테고리만');
  lines.push('    harness update --apply-pristine   # 사용자 미수정 파일만');
  lines.push('    harness update --apply-added      # 신규 파일만');
  lines.push('    harness update --interactive      # divergent/removed-upstream 파일별 결정');
  lines.push('    harness update --dry-run [옵션]   # 적용 없이 시뮬레이션');
  lines.push('');
  if (counts.divergent) {
    lines.push(c('yellow', '  ⚠  divergent 파일은 --interactive 또는 수동 머지 필요. Phase C는 자동 3-way merge를 지원하지 않음.'));
  }

  return { ok: true, manifest, actions, counts, output: lines.join('\n') };
}

function copyFromPkg(rel, cwd) {
  const src = path.join(PKG_ROOT, rel);
  const dest = path.join(cwd, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function deleteLocal(rel, cwd) {
  const dest = path.join(cwd, rel);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
}

function ask(rl, prompt) {
  return new Promise((resolve) => rl.question(prompt, (a) => resolve(a.trim().toLowerCase())));
}

function showDiff(rel, cwd) {
  const { execSync } = require('node:child_process');
  const src = path.join(PKG_ROOT, rel);
  const dest = path.join(cwd, rel);
  try {
    return execSync(`diff -u "${dest}" "${src}"`, { encoding: 'utf8' });
  } catch (err) {
    return err.stdout || err.message;
  }
}

/**
 * harness update [--apply-* | --interactive | --dry-run]
 * 적용 후 매니페스트 자동 갱신.
 */
async function update(cwd = process.cwd(), opts = {}) {
  const result = check(cwd);
  if (!result.ok) return result;
  const { manifest, actions } = result;

  const dryRun = !!opts.dryRun;
  const lines = [result.output, ''];

  // 적용할 액션 결정
  const applied = []; // { rel, action, type: 'copy'|'delete' }
  const interactive = !!opts.interactive;
  const applyFrozen = !!opts.applyFrozen || !!opts.applyAllSafe;
  const applyPristine = !!opts.applyPristine || !!opts.applyAllSafe;
  const applyAdded = !!opts.applyAdded || !!opts.applyAllSafe;

  // 1단계: 자동 적용 가능 항목
  for (const a of actions) {
    if (a.action === 'modified-pristine' && (applyPristine || (applyFrozen && a.category === 'frozen'))) {
      applied.push({ ...a, type: 'copy' });
    } else if (a.action === 'added' && applyAdded) {
      applied.push({ ...a, type: 'copy' });
    }
  }

  // 2단계: 인터랙티브 (TTY 필수)
  if (interactive) {
    if (!process.stdin.isTTY) {
      lines.push(c('red', '\n  ✗ --interactive 는 TTY가 필요합니다 (CI/파이프 환경에서는 사용 불가).'));
      return { ok: false, output: lines.join('\n') };
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const interactiveTargets = actions.filter((a) =>
      a.action === 'divergent' || a.action === 'removed-upstream' || a.action === 'missing-locally'
    );
    for (const a of interactiveTargets) {
      console.log(c('bold', `\n── ${a.rel}`) + c('gray', ` [${a.category}/${a.action}]`));
      let choice;
      if (a.action === 'divergent') {
        console.log('  옵션: [k]eep 사용자 보존 / [n]ew 신규로 덮어쓰기 / [d]iff 표시 / [s]kip');
        while (true) {
          choice = await ask(rl, '  선택 (k/n/d/s): ');
          if (choice === 'd') {
            console.log(showDiff(a.rel, cwd));
            continue;
          }
          if (['k', 'n', 's'].includes(choice)) break;
          console.log(c('yellow', '  알 수 없는 선택. k/n/d/s 중 하나.'));
        }
        if (choice === 'n') applied.push({ ...a, type: 'copy' });
        // k/s는 변경 없음
      } else if (a.action === 'removed-upstream') {
        console.log('  옵션: [k]eep 보존 / [d]elete 삭제 / [s]kip');
        while (true) {
          choice = await ask(rl, '  선택 (k/d/s): ');
          if (['k', 'd', 's'].includes(choice)) break;
        }
        if (choice === 'd') applied.push({ ...a, type: 'delete' });
      } else if (a.action === 'missing-locally') {
        console.log('  옵션: [r]estore 복원 / [s]kip');
        while (true) {
          choice = await ask(rl, '  선택 (r/s): ');
          if (['r', 's'].includes(choice)) break;
        }
        if (choice === 'r') applied.push({ ...a, type: 'copy' });
      }
    }
    rl.close();
  }

  // 3단계: 적용 (또는 dry-run 표시)
  if (applied.length === 0) {
    lines.push(c('gray', '  적용할 변경 없음. (옵션 확인: --apply-all-safe, --interactive 등)'));
    return { ok: true, output: lines.join('\n') };
  }

  lines.push(c('bold', `\n  ${dryRun ? '[DRY-RUN] ' : ''}적용 대상 ${applied.length}건:`));
  for (const a of applied) {
    const verb = a.type === 'delete' ? '삭제' : (a.action === 'added' ? '추가' : '덮어쓰기');
    lines.push(`    ${c('cyan', verb)} ${c('gray', `[${a.category}/${a.action}]`)} ${a.rel}`);
    if (!dryRun) {
      if (a.type === 'copy') copyFromPkg(a.rel, cwd);
      else if (a.type === 'delete') deleteLocal(a.rel, cwd);
    }
  }

  // 4단계: 매니페스트 자동 갱신
  if (!dryRun) {
    const newManifest = buildManifest(cwd, PKG_VERSION);
    // 기존 installedAt 보존, 적용 시점은 별도 필드로
    newManifest.installedAt = manifest.installedAt;
    newManifest.lastUpdatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    writeManifest(cwd, newManifest);
    lines.push('');
    lines.push(c('green', `  ✅ 적용 완료. 매니페스트 갱신 (v${PKG_VERSION}, ${Object.keys(newManifest.files).length}개 파일).`));
  } else {
    lines.push('');
    lines.push(c('yellow', '  ℹ  [DRY-RUN] 실제 변경되지 않았습니다. 옵션에서 --dry-run 제거 시 적용됩니다.'));
  }

  // divergent 잔존 안내
  const remainingDivergent = actions
    .filter((a) => a.action === 'divergent')
    .filter((a) => !applied.some((ap) => ap.rel === a.rel));
  if (remainingDivergent.length > 0) {
    lines.push('');
    lines.push(c('yellow', `  ⚠  미해결 divergent ${remainingDivergent.length}건 — --interactive 또는 수동 머지 필요:`));
    for (const a of remainingDivergent) {
      lines.push(`      diff -u ${a.rel} ${path.join(PKG_ROOT, a.rel)}`);
    }
  }

  return { ok: true, output: lines.join('\n'), appliedCount: applied.length };
}

/**
 * harness update --bootstrap — 현재 상태를 새 baseline으로 박제
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
