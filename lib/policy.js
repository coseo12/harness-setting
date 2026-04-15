'use strict';

const fs = require('node:fs');
const path = require('node:path');

const POLICY_REL = '.harness/policy.json';

const DEFAULT_POLICY = {
  default: 'manual',
  personas: {
    pm: 'manual',
    architect: 'manual',
    developer: 'manual',
    reviewer: 'auto',
    qa: 'manual',
  },
  // 정책 무관 강제 사용자 확인 트리거
  force_review_on: ['architect-decision', 'qa-fail', 'security-flag'],
};

function policyPath(cwd) {
  return path.join(cwd, POLICY_REL);
}

function readPolicy(cwd = process.cwd()) {
  const p = policyPath(cwd);
  if (!fs.existsSync(p)) return DEFAULT_POLICY;
  try {
    const loaded = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { ...DEFAULT_POLICY, ...loaded, personas: { ...DEFAULT_POLICY.personas, ...(loaded.personas || {}) } };
  } catch (err) {
    throw new Error(`policy.json 파싱 실패 (${p}): ${err.message}`);
  }
}

function writeDefaultPolicy(cwd) {
  const p = policyPath(cwd);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(DEFAULT_POLICY, null, 2) + '\n');
  return p;
}

/**
 * 페르소나 호출이 자동 진행 가능한지 판단.
 *   - 정책이 'auto'이고 force_review_on 트리거 미해당 → true
 *   - 그 외 → false (사용자 확인 필요)
 */
function isAutoApproved(persona, triggers = [], cwd = process.cwd()) {
  const policy = readPolicy(cwd);
  const personaPolicy = policy.personas[persona] || policy.default;
  if (personaPolicy !== 'auto') return false;
  for (const t of triggers) {
    if (policy.force_review_on.includes(t)) return false;
  }
  return true;
}

module.exports = { readPolicy, writeDefaultPolicy, isAutoApproved, policyPath, DEFAULT_POLICY, POLICY_REL };
