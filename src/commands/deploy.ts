import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { getProjectConfig, isLoggedIn, saveProjectConfig } from '../utils/config';
import { createApiClient } from '../utils/api';

/**
 * Read and process project files for deployment
 */
function readProjectFiles(projectPath: string, language: string): string {
  const entryFile = language === 'nodejs' ? 'index.js' : 'app.py';
  const entryPath = path.join(projectPath, entryFile);
  
  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry file ${entryFile} not found in ${projectPath}`);
  }
  
  let code = fs.readFileSync(entryPath, 'utf-8');
  
  if (language === 'nodejs') {
    // Remove app.listen() calls line by line
    const lines = code.split('\n');
    const filteredLines: string[] = [];
    let skipUntilClosingBrace = false;
    let braceCount = 0;
    
    for (const line of lines) {
      if (line.includes('app.listen(')) {
        skipUntilClosingBrace = true;
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (line.trim().endsWith(');') || braceCount === 0) {
          skipUntilClosingBrace = false;
        }
        continue;
      }
      if (skipUntilClosingBrace) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount <= 0 && line.includes(');')) {
          skipUntilClosingBrace = false;
        }
        continue;
      }
      filteredLines.push(line);
    }
    
    code = filteredLines.join('\n');
    
    if (!code.includes('export default') && !code.includes('module.exports') && !code.includes('globalThis.app')) {
      code += '\n\n// Export for UGA HOST\nglobalThis.app = app;\n';
    }
  }
  
  return code;
}

/**
 * Generate a short version string based on timestamp + file hash
 */
function generateVersion(code: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  // Simple hash of code length + first/last chars
  const hash = (code.length + code.charCodeAt(0) + code.charCodeAt(code.length - 1))
    .toString(36).toUpperCase().padStart(4, '0').slice(-4);
  return `v${timestamp.slice(-4)}.${hash}`;
}

export async function deployCommand(options: any): Promise<void> {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return;
  }

  const projectConfig = getProjectConfig();
  if (!projectConfig) {
    console.log(chalk.red('❌ No project configuration found. Run: ugahost init'));
    return;
  }

  const isUpdate = !!projectConfig.projectId;
  const spinner = ora(isUpdate ? 'Redeploying to UGA HOST...' : 'Deploying to UGA HOST...').start();

  try {
    const api = createApiClient();
    
    // Read project code
    spinner.text = 'Reading project files...';
    const code = readProjectFiles(process.cwd(), projectConfig.language);
    const version = generateVersion(code);

    let projectId: string;
    let workerVersion: string | undefined;

    if (isUpdate) {
      // ── REDEPLOY existing project ──────────────────────────
      spinner.text = `Redeploying ${projectConfig.name} (${projectConfig.projectId})...`;
      
      const { data } = await api.post(`/api/backend/projects/${projectConfig.projectId}/redeploy`, {
        code,
        version,
      });

      if (!data.success) {
        throw new Error(data.error || data.message || 'Redeploy failed');
      }

      projectId = projectConfig.projectId!;
      workerVersion = data.deployment?.versionId || data.versionId || version;

    } else {
      // ── FIRST DEPLOY ──────────────────────────────────────
      spinner.text = 'Creating project and deploying...';
      
      const { data } = await api.post('/api/backend/projects', {
        ...projectConfig,
        code,
        version,
      });

      if (!data.success) {
        throw new Error(data.error || data.message || 'Deployment failed');
      }

      projectId = data.project?.id;
      workerVersion = data.deployment?.versionId || data.versionId || version;

      // Save project ID for future redeploys
      saveProjectConfig({
        ...projectConfig,
        projectId,
      });
    }

    spinner.succeed(chalk.green(`✅ ${isUpdate ? 'Redeployment' : 'Deployment'} successful!`));
    
    // Show deployment summary
    console.log('');
    console.log(chalk.bold('  Deployment Summary'));
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log(chalk.white('  Project:  ') + chalk.cyan(projectConfig.name));
    console.log(chalk.white('  ID:       ') + chalk.gray(projectId));
    console.log(chalk.white('  Version:  ') + chalk.yellow(workerVersion || version));
    console.log(chalk.white('  URL:      ') + chalk.cyan(`https://${projectConfig.subdomain}.gss-tec.com`));
    console.log(chalk.white('  Status:   ') + chalk.green('● Running'));
    console.log(chalk.gray('  ─────────────────────────────────────'));
    console.log('');
    console.log(chalk.gray('  Useful commands:'));
    console.log('  ' + chalk.white('ugahost logs -f') + chalk.gray('  — Stream live logs'));
    console.log('  ' + chalk.white('ugahost status') + chalk.gray('   — Check status'));
    console.log('  ' + chalk.white('ugahost env list') + chalk.gray(' — Manage env vars'));
    console.log('');

  } catch (error: any) {
    spinner.fail(chalk.red(`❌ ${isUpdate ? 'Redeployment' : 'Deployment'} failed`));
    
    if (error.response) {
      const errData = error.response.data;
      console.log(chalk.red('\n  Error details:'));
      console.log(chalk.yellow('  Status:  '), error.response.status);
      console.log(chalk.yellow('  Message: '), errData?.message || errData?.error || error.message);
      if (errData && typeof errData === 'object' && Object.keys(errData).length > 2) {
        console.log(chalk.gray('  Details: '), JSON.stringify(errData, null, 2));
      }
    } else {
      console.log(chalk.red('\n  ' + error.message));
    }
    
    console.log('');
    console.log(chalk.gray('  Troubleshooting:'));
    console.log(chalk.white('  1.') + chalk.gray(' Check your internet connection'));
    console.log(chalk.white('  2.') + chalk.gray(' Verify your API key: ') + chalk.white('ugahost login'));
    console.log(chalk.white('  3.') + chalk.gray(' Check status: ') + chalk.cyan('https://qssnpaas.gss-tec.com'));
  }
}

/**
 * Read project files for deployment
 */
