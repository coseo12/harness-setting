'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SCRIPT = path.join(__dirname, '..', 'lib', 'verify-docs-links.js');
const PROJECT_ROOT = path.resolve(__dirname, '..');

// fixture helper — temp 디렉토리에 CLAUDE.md 와 관련 파일 배치 후 PROJECT_ROOT 를 덮어쓰는 대신
// CLAUDEMD_FILE 환경변수로 타깃을 지정. 존재 확인은 실제 PROJECT_ROOT 기준이므로
// 유효 링크 fixture 는 실제 파일 경로 (CLAUDE.md / docs/ 등) 를 재사용한다.

function makeTempClaudeMd(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-links-'));
  const file = path.join(dir, 'CLAUDE.md');
  fs.writeFileSync(file, content);
  return { dir, file };
}

function run(file) {
  try {
    const stdout = execFileSync('node', [SCRIPT], {
      env: { ...process.env, CLAUDEMD_FILE: file },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err) {
    return {
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
      code: err.status || 1,
    };
  }
}

test('유효 링크만 존재 → exit 0', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 가이드: [claudemd-governance](docs/guides/claudemd-governance.md)',
    '- 스크립트: [verify](scripts/verify-agent-ssot.sh)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /모두 유효/);
    assert.match(result.stdout, /2건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('깨진 링크 1건 → exit 1 + stderr 보고', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 존재함: [real](CLAUDE.md)',
    '- 깨짐: [ghost](docs/nonexistent-file-xyz.md)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /깨진 상대 링크 1건/);
    assert.match(result.stderr, /docs\/nonexistent-file-xyz\.md/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('외부 URL (http/https) 는 검증 대상 아님', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 외부: [github](https://github.com/coseo12/harness-setting)',
    '- 외부: [example](http://example.com/foo)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('앵커 전용 링크 (#section) 스킵', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 섹션 링크: [헤더로](#section-header)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('코드펜스 내부 링크는 스킵 (문법 비활성)', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '```markdown',
    '예시: [ghost](docs/this-file-does-not-exist.md)',
    '```',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('인라인 코드 내부 링크는 스킵 (placeholder 표기)', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 포맷: `[placeholder](docs/fake-path.md)` 이런 식으로',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('파일#앵커 링크는 파일 부분만 검증', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 섹션 지정: [target](CLAUDE.md#some-anchor)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /1건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('파일 없음 → exit 1', () => {
  const result = run('/tmp/docs-links-does-not-exist-xyz.md');
  assert.equal(result.code, 1);
  assert.match(result.stderr, /파일 없음/);
});

test('실제 CLAUDE.md 는 통과 (링크 유효성 회귀 가드)', () => {
  const result = run(path.join(PROJECT_ROOT, 'CLAUDE.md'));
  assert.equal(result.code, 0);
  assert.match(result.stdout, /모두 유효/);
});

// leading slash 링크는 프로젝트 루트 기준으로 해석되어야 한다.
// path.resolve 로 구현하면 파일 시스템 루트로 빠져나가 오탐이 나는데,
// 현재는 path.join 을 쓰므로 올바르게 동작한다. 교차검증 오탐 (Gemini 의
// path.resolve 전환 제안) 이 재발하면 이 테스트가 터져서 차단한다.
test('leading slash 링크도 프로젝트 루트 기준으로 해석', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '- 루트 상대: [claudemd](/CLAUDE.md)',
    '- 루트 상대: [script](/scripts/verify-agent-ssot.sh)',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /모두 유효/);
    assert.match(result.stdout, /2건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- #203 엣지케이스 추가 ----

test('tilde 펜스 (~~~) 내부 링크는 스킵', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '~~~markdown',
    '예시: [ghost](docs/this-file-does-not-exist.md)',
    '~~~',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('HTML 주석 내부 링크는 스킵 (multi-line)', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '<!-- 주석 안의 placeholder: [ghost](docs/nonexistent.md) -->',
    '실제 링크: [real](CLAUDE.md)',
    '<!--',
    '여러 줄',
    '[also-ghost](docs/also-missing.md)',
    '-->',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /1건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('4-space 들여쓰기 코드블록은 스킵', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '일반 링크: [real](CLAUDE.md)',
    '',
    '    예시: [ghost](docs/indented-block-missing.md)',
    '    또다른: [ghost2](docs/also-missing.md)',
    '',
    '본문 복귀.',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /1건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('reference-style 링크 정의도 검증 대상 (깨진 ref → exit 1)', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '본문에서 [text][real-ref] + [other][ghost-ref] 참조.',
    '',
    '[real-ref]: CLAUDE.md',
    '[ghost-ref]: docs/nonexistent-ref.md',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /docs\/nonexistent-ref\.md/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('reference-style 링크 정의 (유효) 는 검증 통과', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '본문 [text][ref1] + [other][ref2].',
    '',
    '[ref1]: CLAUDE.md',
    '[ref2]: scripts/verify-agent-ssot.sh',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /2건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('외부 URL 의 reference-style 정의는 스킵', () => {
  const { dir, file } = makeTempClaudeMd([
    '# 테스트',
    '[github][gh-ref] 참조.',
    '',
    '[gh-ref]: https://github.com/coseo12/harness-setting',
  ].join('\n'));
  try {
    const result = run(file);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /0건/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
