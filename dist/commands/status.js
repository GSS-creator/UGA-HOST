"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = statusCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
async function statusCommand() {
    if (!(0, config_1.isLoggedIn)()) {
        console.log(chalk_1.default.red('❌ Not logged in. Run: ugahost login'));
        return;
    }
    const projectConfig = (0, config_1.getProjectConfig)();
    if (!projectConfig?.projectId) {
        console.log(chalk_1.default.red('❌ No project found. Run: ugahost init'));
        return;
    }
    try {
        const api = (0, api_1.createApiClient)();
        // GET /api/backend/projects/:id — returns project details
        const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}`);
        const project = data.project;
        if (!project) {
            console.log(chalk_1.default.red('❌ Project not found'));
            return;
        }
        console.log(chalk_1.default.bold.cyan('\n📊 Project Status\n'));
        console.log(chalk_1.default.white('  Name:      ') + chalk_1.default.green(project.name));
        console.log(chalk_1.default.white('  URL:       ') + chalk_1.default.cyan(`https://${project.subdomain}.gss-tec.com`));
        console.log(chalk_1.default.white('  Language:  ') + chalk_1.default.white(project.language));
        console.log(chalk_1.default.white('  Worker:    ') + chalk_1.default.gray(project.worker_name || '—'));
        const statusColor = project.status === 'running' ? chalk_1.default.green :
            project.status === 'stopped' ? chalk_1.default.yellow :
                project.status === 'failed' ? chalk_1.default.red : chalk_1.default.gray;
        console.log(chalk_1.default.white('  Status:    ') + statusColor(project.status?.toUpperCase() || 'UNKNOWN'));
        console.log(chalk_1.default.white('  Created:   ') + chalk_1.default.gray(new Date(project.created_at).toLocaleString()));
        if (project.last_deployed_at) {
            console.log(chalk_1.default.white('  Deployed:  ') + chalk_1.default.gray(new Date(project.last_deployed_at).toLocaleString()));
        }
        // Quota info
        try {
            const { data: quotaData } = await api.get('/api/backend/quota');
            const q = quotaData.quota;
            console.log(chalk_1.default.bold.cyan('\n📈 Quota\n'));
            console.log(chalk_1.default.white('  Apps:      ') + chalk_1.default.yellow(`${q.apps.used}/${q.apps.max}`));
            console.log(chalk_1.default.white('  Storage:   ') + chalk_1.default.yellow(`${q.storage.used_mb} MB / ${q.storage.max_mb} MB`));
            console.log(chalk_1.default.white('  Requests:  ') + chalk_1.default.yellow(`${q.requests.today.toLocaleString()} / ${q.requests.max.toLocaleString()} today`));
        }
        catch (_) { }
        console.log('');
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to get status:'), error.response?.data?.error || error.message);
    }
}
//# sourceMappingURL=status.js.map