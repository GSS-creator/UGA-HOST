import chalk from 'chalk';
import inquirer from 'inquirer';
import { saveProjectConfig } from '../utils/config';

export async function initCommand(): Promise<void> {
  console.log(chalk.cyan('🚀 Initialize UGA HOST Project\n'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => input.length > 0 || 'Name is required'
    },
    {
      type: 'input',
      name: 'subdomain',
      message: 'Subdomain (will be: subdomain.gss-tec.com):',
      validate: (input: string) => /^[a-z0-9-]+$/.test(input) || 'Only lowercase letters, numbers, and hyphens'
    },
    {
      type: 'list',
      name: 'language',
      message: 'Language:',
      choices: ['nodejs', 'python']
    },
    {
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: '3000'
    }
  ]);

  saveProjectConfig({
    name: answers.name,
    subdomain: answers.subdomain,
    language: answers.language,
    port: parseInt(answers.port)
  });

  console.log(chalk.green('\n✅ Project initialized!'));
  console.log(chalk.gray('Configuration saved to ugahost.json'));
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white('  1. ugahost deploy - Deploy your application'));
  console.log(chalk.white('  2. ugahost logs -f - View logs'));
}
