'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

/**
 * managed-block 파일에서 harness가 소유하는 영역을 표시하는 센티널.
 * 형식: <!-- harness:managed:<id>:start --> ... <!-- harness:managed:<id>:end -->
 *
 * 센티널 내부는 update 시 패키지 버전으로 교체된다.
 * 외부는 사용자가 자유롭게 수정 가능 — 절대 손대지 않는다.
 */

const START = /<!--\s*harness:managed:([\w-]+):start\s*-->/g;
const END_FOR = (id) => new RegExp(`<!--\\s*harness:managed:${id}:end\\s*-->`);

/**
 * 텍스트에서 모든 managed 블록을 추출.
 * 결과: [{ id, content, startIdx, endIdx, blockStart, blockEnd }]
 *   - content: 센티널 내부 본문 (앞뒤 줄바꿈 한 줄 트림)
 *   - blockStart/End: 센티널 마커 자체를 포함한 인덱스 범위
 */
function parseBlocks(text) {
  const blocks = [];
  let m;
  START.lastIndex = 0;
  while ((m = START.exec(text)) !== null) {
    const id = m[1];
    const blockStart = m.index;
    const startMarkerEnd = m.index + m[0].length;
    const endRe = END_FOR(id);
    endRe.lastIndex = startMarkerEnd;
    const tail = text.slice(startMarkerEnd);
    const endM = endRe.exec(tail);
    if (!endM) continue; // 닫는 센티널 없음 — 무시
    const endMarkerStart = startMarkerEnd + endM.index;
    const blockEnd = endMarkerStart + endM[0].length;
    const inner = text.slice(startMarkerEnd, endMarkerStart);
    // 앞뒤 한 줄의 줄바꿈만 트림 (들여쓰기 보존)
    const content = inner.replace(/^\n/, '').replace(/\n$/, '');
    blocks.push({ id, content, startIdx: startMarkerEnd, endIdx: endMarkerStart, blockStart, blockEnd });
  }
  return blocks;
}

/**
 * managed-block 파일의 SHA — 센티널 내부 콘텐츠만 정규화하여 해시.
 * 외부 사용자 편집은 SHA에 영향 없음 (그래야 update 추적이 의미 있음).
 */
function managedSha256(text) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) {
    // 센티널이 없으면 전체 파일을 해시 (마이그레이션 전 상태)
    return crypto.createHash('sha256').update(text).digest('hex');
  }
  const concat = blocks.map((b) => `${b.id}\n${b.content}`).join('\n---\n');
  return crypto.createHash('sha256').update(concat).digest('hex');
}

/**
 * userText의 센티널 내부를 pkgText의 동일 id 블록으로 교체한다.
 * - userText에 있는 외부 콘텐츠는 보존
 * - pkgText에 새로 추가된 블록은 파일 끝에 append (드물지만 발생 가능)
 * - userText에 있는데 pkgText에 없는 블록은 보존 (사용자가 직접 추가한 블록일 수 있음)
 */
function syncManagedBlocks(userText, pkgText) {
  const userBlocks = parseBlocks(userText);
  const pkgBlocks = parseBlocks(pkgText);
  const pkgById = new Map(pkgBlocks.map((b) => [b.id, b]));
  const userIds = new Set(userBlocks.map((b) => b.id));

  // 1. userText의 블록을 pkg 블록으로 in-place 교체 (뒤에서부터)
  let out = userText;
  for (const ub of [...userBlocks].reverse()) {
    const pb = pkgById.get(ub.id);
    if (!pb) continue;
    out = out.slice(0, ub.startIdx) + '\n' + pb.content + '\n' + out.slice(ub.endIdx);
  }

  // 2. pkg에만 있는 신규 블록은 파일 끝에 append
  const newBlocks = pkgBlocks.filter((pb) => !userIds.has(pb.id));
  if (newBlocks.length > 0) {
    const appended = newBlocks
      .map((pb) => `\n<!-- harness:managed:${pb.id}:start -->\n${pb.content}\n<!-- harness:managed:${pb.id}:end -->\n`)
      .join('');
    if (!out.endsWith('\n')) out += '\n';
    out += appended;
  }

  return out;
}

/**
 * 현재 텍스트가 센티널을 가지고 있는가 — 마이그레이션 필요 판단용
 */
function hasSentinels(text) {
  return parseBlocks(text).length > 0;
}

module.exports = { parseBlocks, managedSha256, syncManagedBlocks, hasSentinels };
