import chalk from 'chalk';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export const envCommand = {
  async list(): Promise<void> {
    if (!isLoggedIn()) {
      console.log(chalk.red('❌ Not logged in'));
      return;
    }

    const projectConfig = getProjectConfig();
    if (!projectConfig?.projectId) {
      console.log(chalk.red('❌ No project found'));
      return;
    }

    try {
      const api = createApiClient();
      const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}/env`);
      
      if (data.env_vars && data.env_vars.length > 0) {
        console.log(chalk.cyan('\n📋 Environment Variables:\n'));
        data.env_vars.forEach((env: any) => {
          console.log(`${chalk.white(env.key)} = ${env.is_secret ? chalk.gray('***') : env.value}`);
        });
      } else {
        console.log(chalk.gray('No environment variables set'));
      }
    } catch (error: any) {
      console.log(chalk.red('❌ Failed:'), error.message);
    }
  },

  async set(key: string, value: string, options: any): Promise<void> {
    if (!isLoggedIn()) {
      console.log(chalk.red('❌ Not logged in'));
      return;
    }

    const projectConfig = getProjectConfig();
    if (!projectConfig?.projectId) {
      console.log(chalk.red('❌ No project found'));
      return;
    }

    try {
      const api = createApiClient();
      await api.post(`/api/backend/projects/${projectConfig.projectId}/env`, {
        key,
        value,
        is_secret: options.secret || false
      });
      
      console.log(chalk.green(`✅ Set ${key}`));
    } catch (error: any) {
      console.log(chalk.red('❌ Failed:'), error.message);
    }
  },

  async unset(key: string): Promise<void> {
    if (!isLoggedIn()) {
      console.log(chalk.red('❌ Not logged in'));
      return;
    }

    const projectConfig = getProjectConfig();
    if (!projectConfig?.projectId) {
      console.log(chalk.red('❌ No project found'));
      return;
    }

    try {
      const api = createApiClient();
      await api.delete(`/api/backend/projects/${projectConfig.projectId}/env/${key}`);
      
      console.log(chalk.green(`✅ Removed ${key}`));
    } catch (error: any) {
      console.log(chalk.red('❌ Failed:'), error.message);
    }
  }
};
