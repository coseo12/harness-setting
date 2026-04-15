#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { copyTemplate } = require('../lib/copy-template');
const { runScript } = require('../lib/run-script');
const { runDoctor, formatReport } = require('../lib/doctor');
const updater = require('../lib/update');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
사용법: harness <command> [options]

Commands:
  init [경로]              새 프로젝트에 harness 프레임워크 초기화
  update [옵션]            업데이트 확인/적용
                           --check           : 변경 요약만 (비파괴)
                           --bootstrap       : 현재 상태를 baseline으로 박제
                           --apply-all-safe  : frozen + pristine + added 자동 적용
                           --apply-frozen    : frozen 카테고리만
                           --apply-pristine  : 사용자 미수정 파일만
                           --apply-added     : 신규 파일만
                           --interactive,-i  : divergent/removed 파일별 결정
                           --dry-run         : 적용 없이 시뮬레이션
  doctor                   셋업 규칙 자체 점검 (CRITICAL DIRECTIVES, hook, 브랜치 등)
  validate                 프로젝트 설정 검증
  integrity                문서/설정 정합성 검증
  orchestrator <cmd>       오케스트레이터 실행 (start|pipeline|parallel)
  dispatch <agent> [n]     에이전트 디스패치
  labels                   GitHub 라벨 설정
  version                  버전 출력
`);
}

switch (command) {
  case 'init': {
    const targetDir = args[1] || '.';
    copyTemplate(targetDir);
    break;
  }

  case 'update': {
    const sub = args.slice(1);
    (async () => {
      let result;
      if (sub.includes('--bootstrap')) {
        result = updater.bootstrap();
      } else if (sub.includes('--check')) {
        result = updater.check();
      } else {
        result = await updater.update(process.cwd(), {
          applyFrozen: sub.includes('--apply-frozen'),
          applyPristine: sub.includes('--apply-pristine'),
          applyAdded: sub.includes('--apply-added'),
          applyAllSafe: sub.includes('--apply-all-safe'),
          interactive: sub.includes('--interactive') || sub.includes('-i'),
          dryRun: sub.includes('--dry-run'),
        });
      }
      if (result.output) console.log(result.output);
      if (result.message) console.log(result.message);
      process.exit(result.ok ? 0 : 1);
    })();
    break;
  }

  case 'doctor': {
    const report = runDoctor();
    console.log(formatReport(report));
    const { fail } = report.summary();
    process.exit(fail > 0 ? 1 : 0);
  }

  case 'validate':
    runScript('validate-setup.sh', args.slice(1));
    break;

  case 'integrity':
    runScript('validate-integrity.sh', args.slice(1));
    break;

  case 'orchestrator':
    runScript('orchestrator.sh', args.slice(1));
    break;

  case 'dispatch':
    runScript('dispatch-agent.sh', args.slice(1));
    break;

  case 'labels':
    runScript('setup-labels.sh', args.slice(1));
    break;

  case 'version':
  case '--version':
  case '-v': {
    const pkg = require('../package.json');
    console.log(pkg.version);
    break;
  }

  case '--help':
  case '-h':
  case undefined:
    printUsage();
    break;

  default:
    console.error(`알 수 없는 명령: ${command}`);
    printUsage();
    process.exit(1);
}
