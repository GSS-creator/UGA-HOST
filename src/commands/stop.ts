import chalk from 'chalk';
import ora from 'ora';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function stopCommand(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost init'));
    return;
  }

  const spinner = ora('Stopping your application...').start();

  try {
    const api = createApiClient();
    const { data } = await api.post(`/api/backend/projects/${projectConfig.projectId}/stop`);
    
    spinner.succeed(chalk.green('✅ Application stopped!'));
    console.log(chalk.gray('\nStart it again with: ugahost start'));
  } catch (error: any) {
    spinner.fail(chalk.red('❌ Failed to stop application'));
    console.log(chalk.red(error.response?.data?.error || error.message));
  }
}
