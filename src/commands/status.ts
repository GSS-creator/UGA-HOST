import chalk from 'chalk';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function statusCommand(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost init'));
    return;
  }

  try {
    const api = createApiClient();
    // GET /api/backend/projects/:id — returns project details
    const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}`);
    const project = data.project;

    if (!project) {
      console.log(chalk.red('❌ Project not found'));
      return;
    }

    console.log(chalk.bold.cyan('\n📊 Project Status\n'));
    console.log(chalk.white('  Name:      ') + chalk.green(project.name));
    console.log(chalk.white('  URL:       ') + chalk.cyan(`https://${project.subdomain}.gss-tec.com`));
    console.log(chalk.white('  Language:  ') + chalk.white(project.language));
    console.log(chalk.white('  Worker:    ') + chalk.gray(project.worker_name || '—'));

    const statusColor = project.status === 'running' ? chalk.green :
                        project.status === 'stopped'  ? chalk.yellow :
                        project.status === 'failed'   ? chalk.red : chalk.gray;
    console.log(chalk.white('  Status:    ') + statusColor(project.status?.toUpperCase() || 'UNKNOWN'));
    console.log(chalk.white('  Created:   ') + chalk.gray(new Date(project.created_at).toLocaleString()));

    if (project.last_deployed_at) {
      console.log(chalk.white('  Deployed:  ') + chalk.gray(new Date(project.last_deployed_at).toLocaleString()));
    }

    // Quota info
    try {
      const { data: quotaData } = await api.get('/api/backend/quota');
      const q = quotaData.quota;
      console.log(chalk.bold.cyan('\n📈 Quota\n'));
      console.log(chalk.white('  Apps:      ') + chalk.yellow(`${q.apps.used}/${q.apps.max}`));
      console.log(chalk.white('  Storage:   ') + chalk.yellow(`${q.storage.used_mb} MB / ${q.storage.max_mb} MB`));
      console.log(chalk.white('  Requests:  ') + chalk.yellow(`${q.requests.today.toLocaleString()} / ${q.requests.max.toLocaleString()} today`));
    } catch (_) {}

    console.log('');
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to get status:'), error.response?.data?.error || error.message);
  }
}
