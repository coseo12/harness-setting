'use strict';

/**
 * harness doctor — 매니페스트 해시 정합성 검증.
 * 완료 기준: "해시 불일치" 또는 "파일 누락" 감지 시 warn 리포트.
 *
 * 이슈 #89
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { runDoctor } = require('../lib/doctor');
const { writeManifest } = require('../lib/manifest');

function makeTmpCwd(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `harness-doctor-${prefix}-`));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function shaOf(text) {
  return require('node:crypto').createHash('sha256').update(text).digest('hex');
}

function seedMinimalProject(cwd) {
  // doctor 가 요구하는 최소 파일들
  fs.mkdirSync(path.join(cwd, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.claude', 'skills'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.claude', 'settings.json'), JSON.stringify({ hooks: { SessionStart: [] } }));
  fs.writeFileSync(
    path.join(cwd, 'CLAUDE.md'),
    '# CRITICAL DIRECTIVES\n\n(test fixture)\n'
  );
}

test('doctor: 매니페스트 해시 = 파일 실측 해시 일치 시 pass', () => {
  const cwd = makeTmpCwd('hash-ok');
  try {
    seedMinimalProject(cwd);
    const targetRel = 'docs/fixture.md';
    const content = '# fixture\n';
    fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(cwd, targetRel), content);

    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        [targetRel]: { sha256: shaOf(content), category: 'pristine' },
      },
    });

    const report = runDoctor(cwd);
    const integrity = report.items.find((i) => i.name === '매니페스트 해시 정합성');
    assert.ok(integrity, '해시 정합성 항목이 리포트에 포함돼야 함');
    assert.strictEqual(integrity.status, 'pass', `해시 일치 시 pass. 실제: ${integrity.status} / ${integrity.detail}`);
  } finally {
    cleanup(cwd);
  }
});

test('doctor: 매니페스트 해시 ≠ 파일 실측 해시 (해시 위조) 감지 시 warn', () => {
  const cwd = makeTmpCwd('hash-mismatch');
  try {
    seedMinimalProject(cwd);
    const targetRel = 'docs/fixture.md';
    fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
    // 실제 파일은 "rolled back content"
    fs.writeFileSync(path.join(cwd, targetRel), '# rolled back\n');
    // 매니페스트는 "upstream content" 해시를 가짐 — 해시 위조 상태
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        [targetRel]: { sha256: shaOf('# upstream fresh\n'), category: 'pristine' },
      },
    });

    const report = runDoctor(cwd);
    const integrity = report.items.find((i) => i.name === '매니페스트 해시 정합성');
    assert.ok(integrity, '해시 정합성 항목이 리포트에 포함돼야 함');
    assert.strictEqual(integrity.status, 'warn', `해시 불일치 시 warn. 실제: ${integrity.status}`);
    assert.match(integrity.detail, /해시 불일치 1건/, '불일치 건수가 detail 에 표시돼야 함');
  } finally {
    cleanup(cwd);
  }
});

test('doctor: 매니페스트에 기록된 파일이 디스크에 없으면 warn', () => {
  const cwd = makeTmpCwd('missing');
  try {
    seedMinimalProject(cwd);
    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        'docs/ghost.md': { sha256: shaOf('ghost'), category: 'pristine' },
      },
    });

    const report = runDoctor(cwd);
    const integrity = report.items.find((i) => i.name === '매니페스트 해시 정합성');
    assert.ok(integrity);
    assert.strictEqual(integrity.status, 'warn');
    assert.match(integrity.detail, /파일 누락 1건/);
  } finally {
    cleanup(cwd);
  }
});

test('doctor: previousSha256 매치 시 "외부 롤백 의심" 별도 항목으로 분류 (Phase 2)', () => {
  const cwd = makeTmpCwd('rollback-classify');
  try {
    seedMinimalProject(cwd);
    const targetRel = 'docs/fixture.md';
    fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
    const rolledBackContent = '# old (rolled back)\n';
    fs.writeFileSync(path.join(cwd, targetRel), rolledBackContent);

    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        [targetRel]: {
          sha256: shaOf('# new upstream\n'),
          previousSha256: shaOf(rolledBackContent),
          category: 'pristine',
        },
      },
    });

    const report = runDoctor(cwd);
    const rollback = report.items.find((i) => i.name === '매니페스트 해시 정합성 — 외부 롤백 의심');
    assert.ok(rollback, '외부 롤백 의심 항목이 별도로 표시돼야 함');
    assert.strictEqual(rollback.status, 'warn');
    assert.match(rollback.detail, /1건 \(previousSha256 매치\)/);
    assert.match(rollback.detail, /자가 복구 가능/);

    // 기타 항목은 없어야 함
    const other = report.items.find((i) => i.name === '매니페스트 해시 정합성 — 기타');
    assert.strictEqual(other, undefined, '분류 안 된 불일치는 없어야 함');
  } finally {
    cleanup(cwd);
  }
});

test('doctor: 롤백 + 사용자 수정 혼재 시 두 항목 모두 warn', () => {
  const cwd = makeTmpCwd('mixed');
  try {
    seedMinimalProject(cwd);
    fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
    // 파일 A: 외부 롤백 (previousSha256 매치)
    const relA = 'docs/a.md';
    const rolledA = '# old A\n';
    fs.writeFileSync(path.join(cwd, relA), rolledA);
    // 파일 B: 사용자 수정 (아무 해시와도 매치 안 됨)
    const relB = 'docs/b.md';
    fs.writeFileSync(path.join(cwd, relB), '# user edited B\n');

    writeManifest(cwd, {
      harnessVersion: '0.0.1',
      installedAt: '2020-01-01T00:00:00Z',
      files: {
        [relA]: { sha256: shaOf('# new A\n'), previousSha256: shaOf(rolledA), category: 'pristine' },
        [relB]: { sha256: shaOf('# new B\n'), previousSha256: shaOf('# old B\n'), category: 'pristine' },
      },
    });

    const report = runDoctor(cwd);
    const rollback = report.items.find((i) => i.name === '매니페스트 해시 정합성 — 외부 롤백 의심');
    const other = report.items.find((i) => i.name === '매니페스트 해시 정합성 — 기타');
    assert.ok(rollback);
    assert.ok(other);
    assert.match(rollback.detail, /1건/);
    assert.match(other.detail, /해시 불일치 1건/);
  } finally {
    cleanup(cwd);
  }
});
