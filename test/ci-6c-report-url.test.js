'use strict';

/**
 * 6c 경로 리포팅 URL — 환경 메타 수집 + querystring 인코딩 안전성 검증.
 *
 * 이슈 #208. 완료 기준 중 "URL querystring 인코딩 테스트 (특수문자 안전)" 에 대응.
 *
 * 검증 축:
 *   1. collectEnvMeta 가 ci.yml 없음 / 존재 / 읽기 실패 3 경로를 모두 안전하게 처리
 *   2. build6cReportUrl 이 GitHub new issue 표준 querystring 포맷을 생성
 *   3. 한글 / & / # / 공백 / 줄바꿈 등 특수문자가 encodeURIComponent 로 안전하게 인코딩되어
 *      decode 시 원본과 동일하게 복원
 *   4. 실제 6c 분기 통과 시 notes / stderr 에 URL 이 포함됨
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const migration = require('../lib/migrations/2.31.0-to-3.0.0');
const { collectEnvMeta, build6cReportUrl } = migration._helpers;
const { REPORT_ISSUE_BASE_URL, REPORT_TEMPLATE } = migration._constants;

function makeTmpCwd(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `harness-6c-url-${prefix}-`));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

test('collectEnvMeta: ci.yml 없음 → ciHash="missing"', () => {
  const cwd = makeTmpCwd('no-ci');
  try {
    const meta = collectEnvMeta(cwd);
    assert.strictEqual(meta.ciHash, 'missing', 'ci.yml 부재 시 missing 마커');
    assert.match(meta.nodeVersion, /^v\d+\./, 'Node version 포맷');
    assert.match(meta.osString, /^[a-z0-9]+-[a-z0-9_]+$/, 'OS 는 platform-arch');
    assert.ok(typeof meta.harnessVersion === 'string', 'harnessVersion 은 문자열');
  } finally {
    cleanup(cwd);
  }
});

test('collectEnvMeta: ci.yml 존재 → sha256 앞 12자리 hex', () => {
  const cwd = makeTmpCwd('with-ci');
  try {
    fs.mkdirSync(path.join(cwd, '.github', 'workflows'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.github', 'workflows', 'ci.yml'), 'name: CI\n');
    const meta = collectEnvMeta(cwd);
    assert.match(meta.ciHash, /^[0-9a-f]{12}$/, '12자리 hex');
    // 동일 내용은 동일 해시
    const meta2 = collectEnvMeta(cwd);
    assert.strictEqual(meta.ciHash, meta2.ciHash, '동일 내용 동일 해시');
  } finally {
    cleanup(cwd);
  }
});

test('build6cReportUrl: GitHub new issue 표준 querystring 포맷', () => {
  const meta = {
    harnessVersion: '3.2.0',
    nodeVersion: 'v20.11.1',
    osString: 'linux-x64',
    ciHash: 'abc123def456',
  };
  const url = build6cReportUrl(meta);

  assert.ok(url.startsWith(`${REPORT_ISSUE_BASE_URL}?`), 'base URL 로 시작');
  assert.ok(
    url.includes(`template=${encodeURIComponent(REPORT_TEMPLATE)}`),
    'template 파라미터 포함'
  );
  assert.ok(url.includes('title='), 'title 파라미터 포함');
  assert.ok(url.includes('body='), 'body 파라미터 포함');
});

test('build6cReportUrl: 환경 메타가 body 에 자동 삽입됨', () => {
  const meta = {
    harnessVersion: '3.99.0',
    nodeVersion: 'v21.0.0',
    osString: 'win32-x64',
    ciHash: 'deadbeef1234',
  };
  const url = build6cReportUrl(meta);
  const body = decodeURIComponent(url.match(/body=([^&]+)/)[1]);

  assert.ok(body.includes(meta.harnessVersion), 'harness version 포함');
  assert.ok(body.includes(meta.nodeVersion), 'Node version 포함');
  assert.ok(body.includes(meta.osString), 'OS 포함');
  assert.ok(body.includes(meta.ciHash), 'ci.yml 해시 포함');
});

test('build6cReportUrl: title 에 ci.yml 해시 포함 (식별성)', () => {
  const meta = {
    harnessVersion: '3.2.0',
    nodeVersion: 'v20.11.1',
    osString: 'darwin-arm64',
    ciHash: 'feedface9999',
  };
  const url = build6cReportUrl(meta);
  const title = decodeURIComponent(url.match(/title=([^&]+)/)[1]);

  assert.ok(title.includes('6c'), 'title 에 6c 마커');
  assert.ok(title.includes(meta.ciHash), 'title 에 해시 포함 (중복 제출 식별)');
});

test('build6cReportUrl: 한글 / 특수문자 safe round-trip (querystring 인코딩 안전성)', () => {
  // 환경 메타에 특수문자가 섞여도 encode → decode 라운드트립이 완벽해야 함.
  // 실제로는 OS/Node version 에 특수문자가 섞일 일은 없지만, 만약 사용자가
  // package.json::version 을 커스터마이즈해 한글이나 # & 등을 넣어도 URL 이 깨지면 안 됨.
  const meta = {
    harnessVersion: '3.2.0-한글+test & special #hash',
    nodeVersion: 'v20.11.1',
    osString: 'darwin-arm64',
    ciHash: 'a1b2c3d4e5f6',
  };
  const url = build6cReportUrl(meta);

  // URL 구조는 유효해야 함 — URL 생성자로 파싱
  const parsed = new URL(url);
  assert.strictEqual(parsed.origin + parsed.pathname, REPORT_ISSUE_BASE_URL);

  // body 파라미터를 디코드 → 원본 harnessVersion 이 그대로 복원됨
  const body = parsed.searchParams.get('body');
  assert.ok(body, 'body 파라미터 추출 성공');
  assert.ok(
    body.includes(meta.harnessVersion),
    '한글/특수문자 포함 버전 문자열이 decode 후 원형 복원'
  );

  // title 도 마찬가지
  const title = parsed.searchParams.get('title');
  assert.ok(title, 'title 파라미터 추출 성공');
});

test('build6cReportUrl: URL 이 GitHub 현실적 길이 제한(<8192) 이내', () => {
  // GitHub issue URL 은 약 8KB 제한. 표준 메타로는 충분한 여유가 있어야 함.
  const meta = {
    harnessVersion: '3.2.0',
    nodeVersion: 'v20.11.1',
    osString: 'darwin-arm64',
    ciHash: 'a1b2c3d4e5f6',
  };
  const url = build6cReportUrl(meta);
  assert.ok(url.length < 8192, `URL 길이 ${url.length} < 8192`);
  assert.ok(url.length > 100, 'URL 이 비어있지 않음 (sanity)');
});

test('build6cReportUrl: encodeURIComponent 적용 — 생(raw) 한글이 URL 에 직접 노출되지 않음', () => {
  // querystring value 는 반드시 percent-encoded 상태여야 함.
  // 생 한글이 URL 에 그대로 있으면 일부 브라우저/프록시에서 깨질 수 있음.
  const meta = {
    harnessVersion: '3.2.0',
    nodeVersion: 'v20.11.1',
    osString: 'darwin-arm64',
    ciHash: 'a1b2c3d4e5f6',
  };
  const url = build6cReportUrl(meta);

  // "가" = U+AC00 = %EA%B0%80 (percent-encoded). raw 한글이 URL 에 없어야 함.
  assert.ok(!/[ㄱ-힝]/.test(url), 'URL 에 생 한글 문자 없음 (모두 percent-encoded)');
  // 줄바꿈도 %0A 로 인코딩되어야 함
  assert.ok(!url.includes('\n'), 'URL 에 raw 줄바꿈 없음');
});

test('build6cReportUrl 통합: 6c 분기 실제 실행 시 notes/stderr 에 URL 이 포함됨', () => {
  const cwd = makeTmpCwd('6c-integration');
  try {
    fs.mkdirSync(path.join(cwd, '.github', 'workflows'), { recursive: true });
    // 가드 블록을 byte-exact 와 다르게 작성 → 6c 경로 진입
    fs.writeFileSync(
      path.join(cwd, '.github', 'workflows', 'ci.yml'),
      'name: CI\n\njobs:\n  custom:\n    runs-on: ubuntu-latest\n    steps:\n      - name: custom guard\n        run: echo "customized guard --verbose"\n'
    );

    // stderr 캡처
    const originalWrite = process.stderr.write.bind(process.stderr);
    const captured = [];
    process.stderr.write = (chunk) => {
      captured.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      return true;
    };

    let result;
    try {
      result = migration.run(cwd);
    } finally {
      process.stderr.write = originalWrite;
    }

    // notes 에 [ACTION REQUIRED] 헤더 + URL 포함
    const notesJoined = result.notes.join('\n');
    assert.ok(notesJoined.includes('[ACTION REQUIRED]'), 'notes 에 ACTION REQUIRED 헤더');
    assert.ok(notesJoined.includes(REPORT_ISSUE_BASE_URL), 'notes 에 리포트 URL 포함');

    // stderr 출력에도 URL 포함
    const stderrJoined = captured.join('');
    assert.ok(stderrJoined.includes('[ACTION REQUIRED]'), 'stderr 에 ACTION REQUIRED 헤더');
    assert.ok(stderrJoined.includes(REPORT_ISSUE_BASE_URL), 'stderr 에 리포트 URL');
    assert.ok(stderrJoined.includes('docs/harness-ci-migration.md'), 'stderr 에 수동 가이드 경로');
  } finally {
    cleanup(cwd);
  }
});

test('ISSUE_TEMPLATE/6c-migration-report.md 파일 존재 — URL template 파라미터의 실제 대상', () => {
  // build6cReportUrl 이 참조하는 template=6c-migration-report.md 가 실제 레포에 존재해야 함.
  // 없으면 GitHub 이 빈 템플릿으로 fallback → 사용자가 구조 없이 이슈를 작성하게 됨.
  const repoRoot = path.resolve(__dirname, '..');
  const templatePath = path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', REPORT_TEMPLATE);
  assert.ok(fs.existsSync(templatePath), `${REPORT_TEMPLATE} 템플릿 파일 존재`);

  // frontmatter 가 있어야 GitHub 이 템플릿으로 인식
  const content = fs.readFileSync(templatePath, 'utf8');
  assert.ok(content.startsWith('---\n'), 'markdown frontmatter 시작');
  assert.ok(content.includes('name:'), 'name: 필드');
  assert.ok(content.includes('labels:'), 'labels: 필드');
});
