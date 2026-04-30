import chalk from 'chalk';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function logsCommand(options: any): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig || !projectConfig.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost deploy first'));
    return;
  }

  try {
    const api = createApiClient();
    const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}/logs`, {
      params: { limit: options.lines || 100 }
    });

    if (data.logs && data.logs.length > 0) {
      data.logs.forEach((log: any) => {
        const color = log.log_level === 'error' ? chalk.red : 
                     log.log_level === 'warn' ? chalk.yellow : chalk.white;
        console.log(color(`[${log.timestamp}] ${log.message}`));
      });
    } else {
      console.log(chalk.gray('No logs available'));
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to fetch logs:'), error.message);
  }
}
