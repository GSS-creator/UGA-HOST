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
      type: 'list',
      name: 'pythonMode',
      message: 'Python deployment mode:',
      choices: [
        { name: 'Standard HTTP Server (Flask, FastAPI, Uvicorn)', value: 'standard' },
        { name: 'Cloudflare Pyodide Worker (workers API)', value: 'pyodide-worker' }
      ],
      when: (answers: any) => answers.language === 'python',
      default: 'standard'
    },
    {
      type: 'input',
      name: 'port',
      message: 'Port:',
      default: '3000',
      when: (answers: any) => answers.language === 'nodejs' || answers.pythonMode === 'standard'
    }
  ]);

  const config: any = {
    name: answers.name,
    subdomain: answers.subdomain,
    language: answers.language,
    port: answers.language === 'nodejs' ? parseInt(answers.port) : undefined,
    pythonMode: answers.pythonMode || 'standard'
  };

  saveProjectConfig(config);

  console.log(chalk.green('\n✅ Project initialized!'));
  console.log(chalk.gray('Configuration saved to ugahost.json'));
  console.log(chalk.cyan('\nPython mode:'));
  console.log(chalk.white(`  ${answers.pythonMode === 'pyodide-worker' ? 'Cloudflare Pyodide Worker' : 'Standard HTTP Server (Flask, FastAPI, Uvicorn)'}`));
  console.log(chalk.cyan('\nNext steps:'));
  console.log(chalk.white('  1. ugahost deploy - Deploy your application'));
  console.log(chalk.white('  2. ugahost logs -f - View logs'));
  console.log(chalk.gray('\n📋 Mode details:'));
  console.log(chalk.gray('  Standard: Use Flask, FastAPI, Uvicorn with traditional HTTP servers'));
  console.log(chalk.gray('  Pyodide Worker: Use Cloudflare Workers with pyodide.http'));
}
