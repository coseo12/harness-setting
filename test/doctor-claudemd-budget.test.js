'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { runDoctor } = require('../lib/doctor');

// CLAUDE.md 각인 예산 doctor 항목 (#197 Phase 2) 단위 테스트.
// temp cwd 에 최소한의 CLAUDE.md 만 배치하고 charCount 판정을 확인.

function findBudgetItem(report) {
  return report.items.find((i) => i.name === 'CLAUDE.md 각인 예산');
}

function makeWorkspace(claudeMdContent) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-budget-'));
  // runDoctor 가 CRITICAL DIRECTIVES 블록 존재 확인하므로 포함
  const header = 'CRITICAL DIRECTIVES\n\n';
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), header + claudeMdContent);
  return dir;
}

test('20k chars → pass (여유)', () => {
  const dir = makeWorkspace('a'.repeat(20000));
  try {
    const report = runDoctor(dir);
    const item = findBudgetItem(report);
    assert.ok(item, '각인 예산 항목이 리포트에 존재해야 함');
    assert.equal(item.status, 'pass');
    assert.match(item.detail, /여유/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('37k chars → warn (경계 경보)', () => {
  const dir = makeWorkspace('a'.repeat(37000));
  try {
    const report = runDoctor(dir);
    const item = findBudgetItem(report);
    assert.equal(item.status, 'warn');
    assert.match(item.detail, /경계/);
    assert.doesNotMatch(item.detail, /PR warn/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('42k chars → warn (PR warn)', () => {
  const dir = makeWorkspace('a'.repeat(42000));
  try {
    const report = runDoctor(dir);
    const item = findBudgetItem(report);
    assert.equal(item.status, 'warn');
    assert.match(item.detail, /PR warn/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('46k chars → fail (초과)', () => {
  const dir = makeWorkspace('a'.repeat(46000));
  try {
    const report = runDoctor(dir);
    const item = findBudgetItem(report);
    assert.equal(item.status, 'fail');
    assert.match(item.detail, /초과/);
    assert.match(item.detail, /가지치기/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
