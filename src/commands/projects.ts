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
    
    if (data.projects && data.projects.length > 0) {
      console.log(chalk.cyan('\n📦 Your Projects:\n'));
      
      data.projects.forEach((project: any) => {
        const statusColor = project.status === 'running' ? chalk.green : 
                           project.status === 'stopped' ? chalk.yellow : 
                           chalk.gray;
        
        console.log(chalk.white(`  ${project.name}`));
        console.log(chalk.gray(`    URL: https://${project.subdomain}.gss-tec.com`));
        console.log(chalk.gray(`    Language: ${project.language}`));
        console.log(chalk.gray(`    Status: ${statusColor(project.status)}`));
        console.log(chalk.gray(`    Created: ${new Date(project.created_at).toLocaleDateString()}`));
        console.log('');
      });
      
      console.log(chalk.gray(`Total: ${data.projects.length} project(s)`));
    } else {
      console.log(chalk.gray('\nNo projects found. Create one with: ugahost init'));
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to list projects:'), error.response?.data?.error || error.message);
  }
}
