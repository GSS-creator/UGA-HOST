#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from './commands/login';
import { deployCommand } from './commands/deploy';
import { logsCommand } from './commands/logs';
import { envCommand } from './commands/env';
import { dbCommand } from './commands/db';
import { projectsCommand } from './commands/projects';
import { initCommand } from './commands/init';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';
import { restartCommand } from './commands/restart';
import { statusCommand } from './commands/status';

const program = new Command();

program
  .name('ugahost')
  .description('UGA HOST CLI - Deploy backend applications to QSSN PaaS')
  .version('1.0.5');

// Login command
program
  .command('login')
  .description('Login to UGA HOST')
  .action(loginCommand);

// Init command
program
  .command('init')
  .description('Initialize a new UGA HOST project')
  .action(initCommand);

// Deploy command
program
  .command('deploy')
  .description('Deploy your application to UGA HOST')
  .option('-m, --message <message>', 'Deployment message')
  .action(deployCommand);

// Logs command
program
  .command('logs')
  .description('View application logs')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '100')
  .action(logsCommand);

// Environment variables commands
const envCmd = program
  .command('env')
  .description('Manage environment variables');

envCmd
  .command('list')
  .description('List all environment variables')
  .action(envCommand.list);

envCmd
  .command('set <key> <value>')
  .description('Set an environment variable')
  .option('-s, --secret', 'Mark as secret')
  .action(envCommand.set);

envCmd
  .command('unset <key>')
  .description('Remove an environment variable')
  .action(envCommand.unset);

// Database commands
const dbCmd = program
  .command('db')
  .description('Manage your R2 database (like wrangler d1)');

dbCmd
  .command('info')
  .description('Show database info and storage usage')
  .action(dbCommand.info);

dbCmd
  .command('collections')
  .description('List all collections')
  .action(dbCommand.collections);

dbCmd
  .command('find <collection> [query]')
  .description('Find documents  e.g. ugahost db find users \'{"role":"admin"}\'')
  .option('--json', 'Output raw JSON')
  .action(dbCommand.find);

dbCmd
  .command('get <collection> <id>')
  .description('Get one document by _id')
  .action(dbCommand.get);

dbCmd
  .command('insert <collection> <json>')
  .description('Insert a document  e.g. ugahost db insert users \'{"name":"John","email":"j@x.com"}\'')
  .action(dbCommand.insert);

dbCmd
  .command('update <collection> <query> <updates>')
  .description('Update documents  e.g. ugahost db update users \'{"email":"j@x.com"}\' \'{"name":"Jane"}\'')
  .action(dbCommand.update);

dbCmd
  .command('delete <collection> <query>')
  .description('Delete documents  e.g. ugahost db delete users \'{"email":"j@x.com"}\'')
  .action(dbCommand.delete);

dbCmd
  .command('drop <collection>')
  .description('Drop an entire collection (irreversible)')
  .action(dbCommand.drop);

dbCmd
  .command('count <collection> [query]')
  .description('Count documents in a collection')
  .action(dbCommand.count);

dbCmd
  .command('migrate <file>')
  .description('Run a migration JSON file')
  .action(dbCommand.migrate);

dbCmd
  .command('export <collection>')
  .description('Export a collection to a JSON file')
  .option('-o, --output <file>', 'Output file path')
  .action(dbCommand.export);

dbCmd
  .command('import <collection> <file>')
  .description('Import a JSON file into a collection')
  .action(dbCommand.import);

// Projects command
program
  .command('projects')
  .description('List all your projects')
  .action(projectsCommand);

// Start command
program
  .command('start')
  .description('Start your backend server')
  .action(startCommand);

// Stop command
program
  .command('stop')
  .description('Stop your backend server')
  .action(stopCommand);

// Restart command
program
  .command('restart')
  .description('Restart your backend server')
  .action(restartCommand);

// Status command
program
  .command('status')
  .description('Show project status')
  .action(statusCommand);

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.version') {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
