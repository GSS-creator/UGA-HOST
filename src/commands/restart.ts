import chalk from 'chalk';
import ora from 'ora';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function restartCommand(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost init'));
    return;
  }

  const spinner = ora('Restarting your application...').start();

  try {
    const api = createApiClient();
    const { data } = await api.post(`/api/backend/projects/${projectConfig.projectId}/restart`);
    
    spinner.succeed(chalk.green('✅ Application restarted!'));
    console.log(chalk.cyan(`\n🌐 Your app is running at: https://${projectConfig.subdomain}.gss-tec.com`));
    console.log(chalk.gray('\nView logs with: ugahost logs -f'));
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Failed to restart application'));
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
