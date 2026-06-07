import chalk from 'chalk';
import inquirer from 'inquirer';
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

  async set(key?: string, value?: string, options?: any): Promise<void> {
    if (!isLoggedIn()) {
      console.log(chalk.red('❌ Not logged in'));
      return;
    }

    const projectConfig = getProjectConfig();
    if (!projectConfig?.projectId) {
      console.log(chalk.red('❌ No project found'));
      return;
    }

    // If key or value not provided, prompt for them
    let envKey = key;
    let envValue = value;
    let isSecret = options?.secret || false;

    if (!envKey || !envValue) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Variable name:',
          when: !envKey,
          validate: (input: string) => {
            if (!input.trim()) return 'Variable name is required';
            if (!/^[A-Z_][A-Z0-9_]*$/i.test(input)) {
              return 'Variable name must start with a letter or underscore and contain only letters, numbers, and underscores';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'value',
          message: 'Value:',
          when: !envValue,
          validate: (input: string) => {
            if (!input) return 'Value is required';
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'secret',
          message: 'Mark as secret? (will be hidden in logs)',
          default: false,
          when: !options?.secret
        }
      ]);

      envKey = envKey || answers.key;
      envValue = envValue || answers.value;
      isSecret = options?.secret || answers.secret || false;
    }

    try {
      const api = createApiClient();
      await api.post(`/api/backend/projects/${projectConfig.projectId}/env`, {
        key: envKey,
        value: envValue,
        is_secret: isSecret
      });
      
      console.log(chalk.green(`✅ Set ${envKey}${isSecret ? ' (secret)' : ''}`));
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
