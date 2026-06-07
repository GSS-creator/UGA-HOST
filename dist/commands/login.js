"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = loginCommand;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
async function loginCommand() {
    console.log(chalk_1.default.cyan('🔐 Login to UGA HOST\n'));
    console.log(chalk_1.default.gray('Get your API key from: https://qssnpaas.gss-tec.com\n'));
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email:',
            validate: (input) => {
                if (!input || !input.includes('@')) {
                    return 'Please enter a valid email address';
                }
                return true;
            }
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'API Key:',
            mask: '*',
            validate: (input) => {
                if (!input || !input.startsWith('ugahost_')) {
                    return 'Please enter a valid API key (starts with ugahost_)';
                }
                return true;
            }
        }
    ]);
    try {
        const api = (0, api_1.createApiClient)();
        const response = await api.post('https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev/api/auth/validate-api-key', {
            email: answers.email,
            api_key: answers.apiKey
        });
        if (response.data.success) {
            (0, config_1.saveConfig)({
                email: answers.email,
                apiKey: answers.apiKey,
                userId: response.data.user_id,
                apiUrl: 'https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev'
            });
            console.log(chalk_1.default.green('\n✅ Login successful!'));
            console.log(chalk_1.default.gray(`Logged in as: ${answers.email}`));
            console.log(chalk_1.default.gray('You can now deploy your applications with: ugahost deploy\n'));
        }
        else {
            console.log(chalk_1.default.red('\n❌ Authentication failed'));
            console.log(chalk_1.default.red(`Error: ${response.data.error || 'Invalid credentials'}`));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('\n❌ Authentication failed:'), error.response?.data?.error || error.message);
        console.log(chalk_1.default.yellow('\nMake sure you have created an API key at: https://qssnpaas.gss-tec.com'));
    }
}
//# sourceMappingURL=login.js.map