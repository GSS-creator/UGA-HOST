"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectsCommand = projectsCommand;
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
async function projectsCommand() {
    if (!(0, config_1.isLoggedIn)()) {
        console.log(chalk_1.default.red('❌ Not logged in. Run: ugahost login'));
        return;
    }
    try {
        const api = (0, api_1.createApiClient)();
        const { data } = await api.get('/api/backend/projects');
        const projects = data.projects || [];
        if (projects.length === 0) {
            console.log(chalk_1.default.gray('\n  No projects yet. Run: ugahost init && ugahost deploy\n'));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📦 Your Projects (${projects.length}/${2} used)\n`));
        projects.forEach((project, i) => {
            const statusColor = project.status === 'running' ? chalk_1.default.green :
                project.status === 'stopped' ? chalk_1.default.yellow :
                    project.status === 'failed' ? chalk_1.default.red : chalk_1.default.gray;
            console.log(chalk_1.default.bold.white(`  ${i + 1}. ${project.name}`));
            console.log(chalk_1.default.white('     URL:      ') + chalk_1.default.cyan(`https://${project.subdomain}.gss-tec.com`));
            console.log(chalk_1.default.white('     Language: ') + chalk_1.default.white(project.language));
            console.log(chalk_1.default.white('     Status:   ') + statusColor(project.status || 'unknown'));
            console.log(chalk_1.default.white('     ID:       ') + chalk_1.default.gray(project.id));
            console.log(chalk_1.default.white('     Created:  ') + chalk_1.default.gray(new Date(project.created_at).toLocaleDateString()));
            console.log('');
        });
    }
    catch (error) {
        console.log(chalk_1.default.red('❌ Failed to list projects:'), error.response?.data?.error || error.message);
    }
}
//# sourceMappingURL=projects.js.map