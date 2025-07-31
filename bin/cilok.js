#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const CilokAgent = require('../src/cilok-agent');

program
  .name('cilok')
  .description('AI-powered location toolkit CLI agent')
  .version('1.0.0');

program
  .command('start')
  .description('Start Cilok interactive session')
  .action(async () => {
    const agent = new CilokAgent();
    await agent.start();
  });

// Default action when no command specified
program.action(async () => {
  const agent = new CilokAgent();
  await agent.start();
});

program.parse();