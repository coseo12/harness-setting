'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { hasSentinels } = require('../sentinels');

/**
 * 2.2.0 — CLAUDE.md에 managed 센티널 도입.
 * 기존 사용자의 CLAUDE.md를 분석하여 다음 두 섹션을 센티널로 감싼다:
 *   - critical-directives: "## 🚫 CRITICAL DIRECTIVES" ~ 다음 "---" 구분선 직전
 *   - real-lessons: "## 실전 교훈" ~ 다음 "---" 구분선 직전
 *
 * 실패 조건(섹션을 못 찾으면) 변경 없이 노트만 남김 — 사용자가 직접 마이그레이션해야 함.
 */
module.exports = {
  from: '2.1.0',
  to: '2.2.0',
  name: 'CLAUDE.md sentinel 도입',
  run(cwd) {
    const claudePath = path.join(cwd, 'CLAUDE.md');
    if (!fs.existsSync(claudePath)) {
      return { changed: [], notes: ['CLAUDE.md 없음 — 마이그레이션 스킵'] };
    }
    let text = fs.readFileSync(claudePath, 'utf8');
    if (hasSentinels(text)) {
      return { changed: [], notes: ['CLAUDE.md 이미 센티널 적용됨 — 스킵'] };
    }

    const notes = [];
    const wraps = [
      { id: 'critical-directives', heading: /^##\s*🚫?\s*CRITICAL DIRECTIVES/m },
      { id: 'real-lessons', heading: /^##\s*실전 교훈/m },
    ];

    for (const w of wraps) {
      const headMatch = w.heading.exec(text);
      if (!headMatch) {
        notes.push(`${w.id}: 헤더 매칭 실패 — 수동 wrap 필요`);
        continue;
      }
      const sectionStart = headMatch.index;
      // 섹션 종료: 다음 '\n---\n' 까지 (없으면 파일 끝까지)
      const after = text.slice(sectionStart);
      const sepMatch = /\n---\n/.exec(after);
      const sectionEnd = sectionStart + (sepMatch ? sepMatch.index : after.length);

      const before = text.slice(0, sectionStart);
      const section = text.slice(sectionStart, sectionEnd).replace(/\n+$/, '');
      const tail = text.slice(sectionEnd);

      text =
        before +
        `<!-- harness:managed:${w.id}:start -->\n` +
        section +
        `\n<!-- harness:managed:${w.id}:end -->\n` +
        tail;
      notes.push(`${w.id}: 센티널 적용 완료`);
    }

    fs.writeFileSync(claudePath, text);
    return { changed: ['CLAUDE.md'], notes };
  },
};
