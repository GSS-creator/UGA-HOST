import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveConfig } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function loginCommand(): Promise<void> {
  console.log(chalk.cyan('🔐 Login to UGA HOST\n'));
  console.log(chalk.gray('Get your API key from: https://qssnpaas.gss-tec.com\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (input: string) => {
        if (!input || !input.includes('@')) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'API Key:',
      mask: '*',
      validate: (input: string) => {
        if (!input || !input.startsWith('ugahost_')) {
          return 'Please enter a valid API key (starts with ugahost_)';
        }
        return true;
      }
    }
  ]);

  try {
    const api = createApiClient();
    const response = await api.post('https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev/api/auth/validate-api-key', {
      email: answers.email,
      api_key: answers.apiKey
    });

    if (response.data.success) {
      saveConfig({
        email: answers.email,
        apiKey: answers.apiKey,
        userId: response.data.user_id,
        apiUrl: 'https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev'
      });

      console.log(chalk.green('\n✅ Login successful!'));
      console.log(chalk.gray(`Logged in as: ${answers.email}`));
      console.log(chalk.gray('You can now deploy your applications with: ugahost deploy\n'));
    } else {
      console.log(chalk.red('\n❌ Authentication failed'));
      console.log(chalk.red(`Error: ${response.data.error || 'Invalid credentials'}`));
    }
  } catch (error: any) {
    console.log(chalk.red('\n❌ Authentication failed:'), error.response?.data?.error || error.message);
    console.log(chalk.yellow('\nMake sure you have created an API key at: https://qssnpaas.gss-tec.com'));
  }
}
