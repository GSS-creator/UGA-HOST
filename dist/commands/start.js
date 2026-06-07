"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCommand = startCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
async function startCommand() {
    if (!(0, config_1.isLoggedIn)()) {
        console.log(chalk_1.default.red('❌ Not logged in. Run: ugahost login'));
        return;
    }
    const projectConfig = (0, config_1.getProjectConfig)();
    if (!projectConfig?.projectId) {
        console.log(chalk_1.default.red('❌ No project found. Run: ugahost init'));
        return;
    }
    const spinner = (0, ora_1.default)('Starting your application...').start();
    try {
        const api = (0, api_1.createApiClient)();
        const { data } = await api.post(`/api/backend/projects/${projectConfig.projectId}/start`);
        spinner.succeed(chalk_1.default.green('✅ Application started!'));
        console.log(chalk_1.default.cyan(`\n🌐 Your app is running at: https://${projectConfig.subdomain}.gss-tec.com`));
        console.log(chalk_1.default.gray('\nView logs with: ugahost logs -f'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Failed to start application'));
        console.log(chalk_1.default.red(error.response?.data?.error || error.message));
    }
}
//# sourceMappingURL=start.js.map