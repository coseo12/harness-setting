#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { copyTemplate } = require('../lib/copy-template');
const { runScript } = require('../lib/run-script');

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
사용법: harness <command> [options]

Commands:
  init [경로]              새 프로젝트에 harness 프레임워크 초기화
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
