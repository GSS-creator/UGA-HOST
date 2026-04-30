import chalk from 'chalk';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

export async function statusCommand(): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost init'));
    return;
  }

  try {
    const api = createApiClient();
    const { data } = await api.get(`/api/backend/projects/${projectConfig.projectId}/status`);
    
    console.log(chalk.cyan('\n📊 Project Status:\n'));
    
    // Project Info
    console.log(chalk.white('Project:'), chalk.green(data.project.name));
    console.log(chalk.white('URL:'), chalk.cyan(`https://${data.project.subdomain}.gss-tec.com`));
    console.log(chalk.white('Language:'), data.project.language);
    
    // Status
    const statusColor = data.project.status === 'running' ? chalk.green : 
                       data.project.status === 'stopped' ? chalk.yellow : 
                       chalk.red;
    console.log(chalk.white('Status:'), statusColor(data.project.status.toUpperCase()));
    
    // Deployment Info
    if (data.deployment) {
      console.log(chalk.white('\nLast Deployment:'));
      console.log(chalk.gray(`  Version: ${data.deployment.version}`));
      console.log(chalk.gray(`  Deployed: ${new Date(data.deployment.deployed_at).toLocaleString()}`));
    }
    
    // Metrics
    if (data.metrics) {
      console.log(chalk.white('\nMetrics (Last 24h):'));
      console.log(chalk.gray(`  Requests: ${data.metrics.requests || 0}`));
      console.log(chalk.gray(`  Errors: ${data.metrics.errors || 0}`));
      console.log(chalk.gray(`  Avg Response Time: ${data.metrics.avg_response_time || 0}ms`));
      console.log(chalk.gray(`  CPU Usage: ${data.metrics.cpu_usage || 0}%`));
      console.log(chalk.gray(`  Memory Usage: ${data.metrics.memory_usage || 0}MB`));
    }
    
    // Database
    if (data.database) {
      console.log(chalk.white('\nDatabase:'));
      console.log(chalk.gray(`  Status: ${data.database.status === 'active' ? chalk.green('Active') : chalk.yellow(data.database.status)}`));
      console.log(chalk.gray(`  Name: ${data.database.database_name}`));
    }
    
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to get status:'), error.response?.data?.error || error.message);
  }
}
