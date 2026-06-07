"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logsCommand = logsCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
async function logsCommand(options) {
    if (!(0, config_1.isLoggedIn)()) {
        console.log(chalk_1.default.red('❌ Not logged in. Run: ugahost login'));
        return;
    }
    const projectConfig = (0, config_1.getProjectConfig)();
    if (!projectConfig?.projectId) {
        console.log(chalk_1.default.red('❌ No project found. Run: ugahost deploy first'));
        return;
    }
    const limit = options.lines || 100;
    try {
        const api = (0, api_1.createApiClient)();
        const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}/logs?limit=${limit}`);
        const logs = data.logs || [];
        if (logs.length === 0) {
            console.log(chalk_1.default.gray('\n  No logs yet. Make some requests to your app first.\n'));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📋 Logs — ${projectConfig.name || 'project'} (last ${logs.length})\n`));
        logs.reverse().forEach((log) => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            const level = (log.log_level || 'info').toLowerCase();
            const levelStr = level === 'error' ? chalk_1.default.red('✗ ERROR') :
                level === 'warn' ? chalk_1.default.yellow('⚠ WARN ') :
                    level === 'debug' ? chalk_1.default.gray('· DEBUG') :
                        chalk_1.default.cyan('ℹ INFO ');
            const msg = level === 'error' ? chalk_1.default.red(log.message) :
                level === 'warn' ? chalk_1.default.yellow(log.message) :
                    level === 'debug' ? chalk_1.default.gray(log.message) :
                        chalk_1.default.white(log.message);
            console.log(`  ${chalk_1.default.gray(time)}  ${levelStr}  ${msg}`);
        });
        console.log('');
        if (options.follow) {
            console.log(chalk_1.default.gray('  Live streaming not available in this version. Re-run to refresh.\n'));
        }
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to fetch logs:'), error.response?.data?.error || error.message);
    }
}
//# sourceMappingURL=logs.js.map