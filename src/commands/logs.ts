import chalk from 'chalk';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function logsCommand(options: any): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost deploy first'));
    return;
  }

  const limit = options.lines || 100;

  try {
    const api = createApiClient();
    const { data } = await api.get(
      `/api/backend/projects/${projectConfig.projectId}/logs?limit=${limit}`
    );

    const logs = data.logs || [];

    if (logs.length === 0) {
      console.log(chalk.gray('\n  No logs yet. Make some requests to your app first.\n'));
      return;
    }

    console.log(chalk.bold.cyan(`\n📋 Logs — ${projectConfig.name || 'project'} (last ${logs.length})\n`));

    logs.reverse().forEach((log: any) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const level = (log.log_level || 'info').toLowerCase();

      const levelStr = level === 'error' ? chalk.red('✗ ERROR') :
                       level === 'warn'  ? chalk.yellow('⚠ WARN ') :
                       level === 'debug' ? chalk.gray('· DEBUG') :
                                           chalk.cyan('ℹ INFO ');

      const msg = level === 'error' ? chalk.red(log.message) :
                  level === 'warn'  ? chalk.yellow(log.message) :
                  level === 'debug' ? chalk.gray(log.message) :
                                      chalk.white(log.message);

      console.log(`  ${chalk.gray(time)}  ${levelStr}  ${msg}`);
    });

    console.log('');

    if (options.follow) {
      console.log(chalk.gray('  Live streaming not available in this version. Re-run to refresh.\n'));
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to fetch logs:'), error.response?.data?.error || error.message);
  }
}
