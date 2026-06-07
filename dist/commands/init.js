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
            type: 'input',
            name: 'port',
            message: 'Port:',
            default: '3000'
        }
    ]);
    (0, config_1.saveProjectConfig)({
        name: answers.name,
        subdomain: answers.subdomain,
        language: answers.language,
        port: parseInt(answers.port)
    });
    console.log(chalk_1.default.green('\n✅ Project initialized!'));
    console.log(chalk_1.default.gray('Configuration saved to ugahost.json'));
    console.log(chalk_1.default.cyan('\nNext steps:'));
    console.log(chalk_1.default.white('  1. ugahost deploy - Deploy your application'));
    console.log(chalk_1.default.white('  2. ugahost logs -f - View logs'));
}
//# sourceMappingURL=init.js.map