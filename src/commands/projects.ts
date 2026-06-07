import chalk from 'chalk';
import { isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function projectsCommand(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  try {
    const api = createApiClient();
    const { data } = await api.get('/api/backend/projects');
    const projects = data.projects || [];

    if (projects.length === 0) {
      console.log(chalk.gray('\n  No projects yet. Run: ugahost init && ugahost deploy\n'));
      return;
    }

    console.log(chalk.bold.cyan(`\n📦 Your Projects (${projects.length}/${2} used)\n`));

    projects.forEach((project: any, i: number) => {
      const statusColor = project.status === 'running' ? chalk.green :
                          project.status === 'stopped'  ? chalk.yellow :
                          project.status === 'failed'   ? chalk.red : chalk.gray;

      console.log(chalk.bold.white(`  ${i + 1}. ${project.name}`));
      console.log(chalk.white('     URL:      ') + chalk.cyan(`https://${project.subdomain}.gss-tec.com`));
      console.log(chalk.white('     Language: ') + chalk.white(project.language));
      console.log(chalk.white('     Status:   ') + statusColor(project.status || 'unknown'));
      console.log(chalk.white('     ID:       ') + chalk.gray(project.id));
      console.log(chalk.white('     Created:  ') + chalk.gray(new Date(project.created_at).toLocaleDateString()));
      console.log('');
    });
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to list projects:'), error.response?.data?.error || error.message);
  }
}
