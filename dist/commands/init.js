"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../utils/config");
async function initCommand() {
    console.log(chalk_1.default.cyan('🚀 Initialize UGA HOST Project\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            validate: (input) => input.length > 0 || 'Name is required'
        },
        {
            type: 'input',
            name: 'subdomain',
            message: 'Subdomain (will be: subdomain.gss-tec.com):',
            validate: (input) => /^[a-z0-9-]+$/.test(input) || 'Only lowercase letters, numbers, and hyphens'
        },
        {
            type: 'list',
            name: 'language',
            message: 'Language:',
            choices: ['nodejs', 'python']
        },
        {
            type: 'list',
            name: 'pythonMode',
            message: 'Python deployment mode:',
            choices: [
                { name: 'Standard HTTP Server (Flask, FastAPI, Uvicorn)', value: 'standard' },
                { name: 'Cloudflare Pyodide Worker (workers API)', value: 'pyodide-worker' }
            ],
            when: (answers) => answers.language === 'python',
            default: 'standard'
        },
        {
            type: 'input',
            name: 'port',
            message: 'Port:',
            default: '3000',
            when: (answers) => answers.language === 'nodejs' || answers.pythonMode === 'standard'
        }
    ]);
    const config = {
        name: answers.name,
        subdomain: answers.subdomain,
        language: answers.language,
        port: answers.language === 'nodejs' ? parseInt(answers.port) : undefined,
        pythonMode: answers.pythonMode || 'standard'
    };
    (0, config_1.saveProjectConfig)(config);
    console.log(chalk_1.default.green('\n✅ Project initialized!'));
    console.log(chalk_1.default.gray('Configuration saved to ugahost.json'));
    console.log(chalk_1.default.cyan('\nPython mode:'));
    console.log(chalk_1.default.white(`  ${answers.pythonMode === 'pyodide-worker' ? 'Cloudflare Pyodide Worker' : 'Standard HTTP Server (Flask, FastAPI, Uvicorn)'}`));
    console.log(chalk_1.default.cyan('\nNext steps:'));
    console.log(chalk_1.default.white('  1. ugahost deploy - Deploy your application'));
    console.log(chalk_1.default.white('  2. ugahost logs -f - View logs'));
    console.log(chalk_1.default.gray('\n📋 Mode details:'));
    console.log(chalk_1.default.gray('  Standard: Use Flask, FastAPI, Uvicorn with traditional HTTP servers'));
    console.log(chalk_1.default.gray('  Pyodide Worker: Use Cloudflare Workers with pyodide.http'));
}
//# sourceMappingURL=init.js.map