'use strict';

const fs = require('node:fs');
const path = require('node:path');

const HARNESSIGNORE_REL = '.harnessignore';

/**
 * gitignore 스타일 패턴을 정규식으로 변환.
 * 지원: * ** ? 디렉토리 접두사(path/) 와일드카드 말미(path/*).
 * 미지원: ! 네거티브, [abc] 문자 클래스 — 필요 시 후속.
 */
function patternToRegex(pattern) {
  // 선두/후미 공백 제거, 빈 줄 / 주석 스킵
  const p = pattern.trim();
  if (!p || p.startsWith('#')) return null;

  // 디렉토리 규칙 (trailing /)
  const isDir = p.endsWith('/');
  const core = isDir ? p.slice(0, -1) : p;

  // glob → regex
  let re = '';
  let i = 0;
  while (i < core.length) {
    const ch = core[i];
    if (ch === '*') {
      if (core[i + 1] === '*') {
        re += '.*';
        i += 2;
        if (core[i] === '/') i += 1;
      } else {
        re += '[^/]*';
        i += 1;
      }
    } else if (ch === '?') {
      re += '[^/]';
      i += 1;
    } else if ('.+()|^$[]{}\\'.includes(ch)) {
      re += '\\' + ch;
      i += 1;
    } else if (ch === '/') {
      re += '/';
      i += 1;
    } else {
      re += ch;
      i += 1;
    }
  }

  // 앵커: 경로는 레포 루트 기준. 패턴에 '/'가 없으면 어느 depth에서도 매칭.
  const hasSlash = core.includes('/');
  const anchor = hasSlash ? '^' : '(^|/)';
  const tail = isDir ? '(/.*)?$' : '$';

  return new RegExp(anchor + re + tail);
}

function loadPatterns(cwd) {
  const p = path.join(cwd, HARNESSIGNORE_REL);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .map((line) => patternToRegex(line))
    .filter(Boolean);
}

function isIgnored(relPath, patterns) {
  if (!patterns || patterns.length === 0) return false;
  const normalized = relPath.replace(/\\/g, '/');
  return patterns.some((re) => re.test(normalized));
}

module.exports = { HARNESSIGNORE_REL, loadPatterns, isIgnored, patternToRegex };
