#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const login_1 = require("./commands/login");
const deploy_1 = require("./commands/deploy");
const logs_1 = require("./commands/logs");
const env_1 = require("./commands/env");
const db_1 = require("./commands/db");
const projects_1 = require("./commands/projects");
const init_1 = require("./commands/init");
const start_1 = require("./commands/start");
const stop_1 = require("./commands/stop");
const restart_1 = require("./commands/restart");
const status_1 = require("./commands/status");
const program = new commander_1.Command();
program
    .name('ugahost')
    .description('UGA HOST CLI - Deploy backend applications to QSSN PaaS')
    .version('1.0.9');
// Login command
program
    .command('login')
    .description('Login to UGA HOST')
    .action(login_1.loginCommand);
// Init command
program
    .command('init')
    .description('Initialize a new UGA HOST project')
    .action(init_1.initCommand);
// Deploy command
program
    .command('deploy')
    .description('Deploy your application to UGA HOST')
    .option('-m, --message <message>', 'Deployment message')
    .action(deploy_1.deployCommand);
// Logs command
program
    .command('logs')
    .description('View application logs')
    .option('-f, --follow', 'Follow log output')
    .option('-n, --lines <number>', 'Number of lines to show', '100')
    .action(logs_1.logsCommand);
// Environment variables commands
const envCmd = program
    .command('env')
    .description('Manage environment variables');
envCmd
    .command('list')
    .description('List all environment variables')
    .action(env_1.envCommand.list);
envCmd
    .command('set [key] [value]')
    .description('Set an environment variable (prompts if not provided)')
    .option('-s, --secret', 'Mark as secret')
    .action(env_1.envCommand.set);
envCmd
    .command('unset <key>')
    .description('Remove an environment variable')
    .action(env_1.envCommand.unset);
// Database commands
const dbCmd = program
    .command('db')
    .description('Manage your project database (Turso/SQLite or R2/NoSQL)');
dbCmd
    .command('info')
    .description('Show database info, tables/collections and storage usage')
    .action(db_1.dbCommand.info);
dbCmd
    .command('tables')
    .description('List all tables with row counts (Turso projects)')
    .action(db_1.dbCommand.tables);
dbCmd
    .command('collections')
    .description('List all collections (R2/NoSQL projects)')
    .action(db_1.dbCommand.collections);
dbCmd
    .command('query <sql>')
    .description('Run a raw SQL statement  e.g. ugahost db query "SELECT * FROM users"')
    .action(db_1.dbCommand.query);
dbCmd
    .command('find <collection> [query]')
    .description('Find rows/documents  e.g. ugahost db find users \'{"role":"admin"}\'')
    .option('--json', 'Output raw JSON')
    .action(db_1.dbCommand.find);
dbCmd
    .command('get <collection> <id>')
    .description('Get one document by _id')
    .action(db_1.dbCommand.get);
dbCmd
    .command('insert <collection> <json>')
    .description('Insert a document  e.g. ugahost db insert users \'{"name":"John","email":"j@x.com"}\'')
    .action(db_1.dbCommand.insert);
dbCmd
    .command('update <collection> <query> <updates>')
    .description('Update documents  e.g. ugahost db update users \'{"email":"j@x.com"}\' \'{"name":"Jane"}\'')
    .action(db_1.dbCommand.update);
dbCmd
    .command('delete <collection> <query>')
    .description('Delete documents  e.g. ugahost db delete users \'{"email":"j@x.com"}\'')
    .action(db_1.dbCommand.delete);
dbCmd
    .command('drop <collection>')
    .description('Drop an entire collection (irreversible)')
    .action(db_1.dbCommand.drop);
dbCmd
    .command('count <collection> [query]')
    .description('Count documents in a collection')
    .action(db_1.dbCommand.count);
dbCmd
    .command('migrate <file>')
    .description('Run a migration JSON file')
    .action(db_1.dbCommand.migrate);
dbCmd
    .command('export <collection>')
    .description('Export a collection to a JSON file')
    .option('-o, --output <file>', 'Output file path')
    .action(db_1.dbCommand.export);
dbCmd
    .command('import <collection> <file>')
    .description('Import a JSON file into a collection')
    .action(db_1.dbCommand.import);
// Projects command
program
    .command('projects')
    .description('List all your projects')
    .action(projects_1.projectsCommand);
// Start command
program
    .command('start')
    .description('Start your backend server')
    .action(start_1.startCommand);
// Stop command
program
    .command('stop')
    .description('Stop your backend server')
    .action(stop_1.stopCommand);
// Restart command
program
    .command('restart')
    .description('Restart your backend server')
    .action(restart_1.restartCommand);
// Status command
program
    .command('status')
    .description('Show project status')
    .action(status_1.statusCommand);
// Error handling
program.exitOverride();
try {
    program.parse(process.argv);
}
catch (error) {
    if (error.code !== 'commander.help' && error.code !== 'commander.version') {
        console.error(chalk_1.default.red('Error:'), error.message);
        process.exit(1);
    }
}
// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map