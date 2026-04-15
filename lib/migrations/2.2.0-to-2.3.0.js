'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * 2.3.0 — 좀비 인프라 정리.
 * - .harness/state.json 제거 (이슈/PR 라벨이 SSoT)
 * - orchestrator/dispatch 명령 제거 (페르소나는 슬래시 커맨드로 호출)
 *
 * state.json은 사용자 데이터가 들어있을 수 있으므로, 삭제 대신 .deprecated 로 rename.
 */
module.exports = {
  from: '2.2.0',
  to: '2.3.0',
  name: '좀비 인프라 제거 (state.json deprecate, orchestrator/dispatch 명령 제거)',
  run(cwd) {
    const notes = [];
    const changed = [];
    const stateP = path.join(cwd, '.harness', 'state.json');
    if (fs.existsSync(stateP)) {
      const target = `${stateP}.deprecated`;
      try {
        fs.renameSync(stateP, target);
        notes.push(`.harness/state.json → state.json.deprecated 로 이동 (참조하는 코드 없음, 안전 시 삭제)`);
        changed.push('.harness/state.json');
      } catch (err) {
        notes.push(`state.json rename 실패: ${err.message}`);
      }
    } else {
      notes.push('.harness/state.json 없음 — 스킵');
    }
    notes.push('orchestrator/dispatch 명령은 v2.3.0에서 제거됐습니다. /pm /architect /dev /review /qa /next 슬래시 커맨드 사용.');
    return { changed, notes };
  },
};
