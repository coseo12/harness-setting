'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { categorize } = require('./categorize');
const { managedSha256 } = require('./sentinels');
const { loadPatterns, isIgnored } = require('./harnessignore');

const MANIFEST_REL = '.harness/manifest.json';
const TRACKED_DIRS = ['.claude', '.github', 'scripts', 'docs'];
const TRACKED_FILES = ['CLAUDE.md'];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(absPath) {
  return sha256(fs.readFileSync(absPath));
}

/**
 * 카테고리 기반 SHA — managed-block은 센티널 내부만 해시.
 * 그래야 사용자가 센티널 외부(자유 영역)를 편집해도 update 추적이 깨지지 않는다.
 */
function categoricalSha256(relPath, absPath) {
  const cat = categorize(relPath);
  if (cat === 'managed-block') {
    const text = fs.readFileSync(absPath, 'utf8');
    return managedSha256(text);
  }
  return sha256File(absPath);
}

/**
 * 추적 대상 파일을 재귀적으로 수집한다.
 * 결과: { '<rel/path>': '<absPath>' }
 *   - user-only 카테고리는 매니페스트에 기록하지 않으므로 수집 단계에서 제외.
 *   - rootDir 에 `.harnessignore` 가 있으면 gitignore 스타일 패턴과 매칭되는 파일 제외.
 *     (사용자 프로젝트의 ignore만 반영. 패키지 소스 스캔에서는 빈 리스트라 no-op.)
 */
function walkTracked(rootDir) {
  const result = {};
  const ignorePatterns = loadPatterns(rootDir);

  function walk(rel, abs) {
    if (!fs.existsSync(abs)) return;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      if (isIgnored(rel, ignorePatterns)) return;
      for (const entry of fs.readdirSync(abs)) {
        walk(path.posix.join(rel, entry), path.join(abs, entry));
      }
    } else if (stat.isFile()) {
      if (categorize(rel) === 'user-only') return;
      if (isIgnored(rel, ignorePatterns)) return;
      result[rel] = abs;
    }
  }

  for (const file of TRACKED_FILES) {
    walk(file, path.join(rootDir, file));
  }
  for (const dir of TRACKED_DIRS) {
    walk(dir, path.join(rootDir, dir));
  }

  return result;
}

function buildManifest(rootDir, harnessVersion) {
  const tracked = walkTracked(rootDir);
  const files = {};
  for (const [rel, abs] of Object.entries(tracked)) {
    files[rel] = { sha256: categoricalSha256(rel, abs), category: categorize(rel) };
  }
  return {
    harnessVersion,
    installedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    files,
  };
}

function manifestPath(cwd) {
  return path.join(cwd, MANIFEST_REL);
}

function readManifest(cwd) {
  const p = manifestPath(cwd);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (err) {
    throw new Error(`manifest 파싱 실패 (${p}): ${err.message}`);
  }
}

function writeManifest(cwd, manifest) {
  const p = manifestPath(cwd);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  return p;
}

module.exports = {
  MANIFEST_REL,
  TRACKED_DIRS,
  TRACKED_FILES,
  walkTracked,
  buildManifest,
  readManifest,
  writeManifest,
  manifestPath,
  sha256,
  sha256File,
  categoricalSha256,
};
