"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
exports.envCommand = {
    async list() {
        if (!(0, config_1.isLoggedIn)()) {
            console.log(chalk_1.default.red('❌ Not logged in'));
            return;
        }
        const projectConfig = (0, config_1.getProjectConfig)();
        if (!projectConfig?.projectId) {
            console.log(chalk_1.default.red('❌ No project found'));
            return;
        }
        try {
            const api = (0, api_1.createApiClient)();
            const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}/env`);
            if (data.env_vars && data.env_vars.length > 0) {
                console.log(chalk_1.default.cyan('\n📋 Environment Variables:\n'));
                data.env_vars.forEach((env) => {
                    console.log(`${chalk_1.default.white(env.key)} = ${env.is_secret ? chalk_1.default.gray('***') : env.value}`);
                });
            }
            else {
                console.log(chalk_1.default.gray('No environment variables set'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Failed:'), error.message);
        }
    },
    async set(key, value, options) {
        if (!(0, config_1.isLoggedIn)()) {
            console.log(chalk_1.default.red('❌ Not logged in'));
            return;
        }
        const projectConfig = (0, config_1.getProjectConfig)();
        if (!projectConfig?.projectId) {
            console.log(chalk_1.default.red('❌ No project found'));
            return;
        }
        // If key or value not provided, prompt for them
        let envKey = key;
        let envValue = value;
        let isSecret = options?.secret || false;
        if (!envKey || !envValue) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'key',
                    message: 'Variable name:',
                    when: !envKey,
                    validate: (input) => {
                        if (!input.trim())
                            return 'Variable name is required';
                        if (!/^[A-Z_][A-Z0-9_]*$/i.test(input)) {
                            return 'Variable name must start with a letter or underscore and contain only letters, numbers, and underscores';
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'value',
                    message: 'Value:',
                    when: !envValue,
                    validate: (input) => {
                        if (!input)
                            return 'Value is required';
                        return true;
                    }
                },
                {
                    type: 'confirm',
                    name: 'secret',
                    message: 'Mark as secret? (will be hidden in logs)',
                    default: false,
                    when: !options?.secret
                }
            ]);
            envKey = envKey || answers.key;
            envValue = envValue || answers.value;
            isSecret = options?.secret || answers.secret || false;
        }
        try {
            const api = (0, api_1.createApiClient)();
            await api.post(`/api/backend/projects/${projectConfig.projectId}/env`, {
                key: envKey,
                value: envValue,
                is_secret: isSecret
            });
            console.log(chalk_1.default.green(`✅ Set ${envKey}${isSecret ? ' (secret)' : ''}`));
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Failed:'), error.message);
        }
    },
    async unset(key) {
        if (!(0, config_1.isLoggedIn)()) {
            console.log(chalk_1.default.red('❌ Not logged in'));
            return;
        }
        const projectConfig = (0, config_1.getProjectConfig)();
        if (!projectConfig?.projectId) {
            console.log(chalk_1.default.red('❌ No project found'));
            return;
        }
        try {
            const api = (0, api_1.createApiClient)();
            await api.delete(`/api/backend/projects/${projectConfig.projectId}/env/${key}`);
            console.log(chalk_1.default.green(`✅ Removed ${key}`));
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Failed:'), error.message);
        }
    }
};
//# sourceMappingURL=env.js.map