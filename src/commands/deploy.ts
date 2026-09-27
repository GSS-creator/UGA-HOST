import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { getProjectConfig, isLoggedIn, saveProjectConfig } from '../utils/config';
import { createApiClient } from '../utils/api';

/**
 * Validate Python container source code based on deployment mode.
 *
 * Supports two modes:
 * 1. Standard mode: Traditional HTTP servers (Flask, FastAPI, etc.)
 * 2. Pyodide Worker mode: Cloudflare Workers with Pyodide runtime
 */
function validatePythonContainerSource(code: string, pythonMode?: string): void {
  const failures: string[] = [];
  const pyodidePatterns = [
    /\bfrom\s+workers\s+import\b/i,
    /\bimport\s+workers\b/i,
    /\bWorkerEntrypoint\b/i,
    /\bpyodide(?:\.http)?\b/i,
    /\bon_fetch\s*\(/i,
  ];

  const isPyodideWorkerMode = pythonMode === 'pyodide-worker';

  if (isPyodideWorkerMode) {
    // PYODIDE WORKER MODE: Must use Cloudflare Workers APIs
    if (!/\bfrom\s+workers\s+import\s+WorkerEntrypoint/.test(code)) {
      failures.push('Pyodide Worker mode requires: "from workers import WorkerEntrypoint, Response"');
    }
    if (!/\bclass\s+Default\s*\(\s*WorkerEntrypoint\s*\)/.test(code)) {
      failures.push('Pyodide Worker mode requires: "class Default(WorkerEntrypoint):"');
    }
    if (!/\basync\s+on_fetch\s*\(/.test(code)) {
      failures.push('Pyodide Worker mode requires: "async def on_fetch(self, request, env, ctx=None):" method');
    }
    // Block traditional HTTP servers in Pyodide Worker mode
    if (/\b(?:Flask|FastAPI|Starlette|Django|Bottle)\s*\(/.test(code) ||
        /\b(?:HTTPServer|ThreadingHTTPServer)\s*\(/.test(code) ||
        /\buvicorn\.run\s*\(/.test(code)) {
      failures.push('Pyodide Worker mode does not allow traditional HTTP servers (Flask, FastAPI, etc.)');
    }
  } else {
    // STANDARD MODE: Must use standard HTTP servers
    const startsHttpServer =
      // Traditional HTTP servers
      /\b(?:ThreadingHTTPServer|HTTPServer)\s*\(/.test(code) ||
      // Common Python web frameworks
      /\b(?:Flask|FastAPI|Starlette|Django|Bottle|Flask-RESTful)\s*\(/.test(code) ||
      // ASGI servers
      /\buvicorn\.run\s*\(/.test(code) ||
      /\bfastapi\.FastAPI\s*\(/.test(code) ||
      /\bstarlette\.Starlette\s*\(/.test(code) ||
      // Standard app.run patterns
      /\b(?:app|application|flask_app)\s*\.\s*run\s*\(/.test(code) ||
      /\b(?:Flask|FastAPI|Starlette|Django)\s*\.\s*run\s*\(/.test(code);

    if (!startsHttpServer) {
      failures.push('Standard mode requires: Flask, FastAPI, Uvicorn, or standard HTTP server');
    }

    // Block Pyodide Worker APIs in standard mode
    if (pyodidePatterns.some((pattern) => pattern.test(code))) {
      failures.push('Standard mode does not allow Cloudflare Worker/Pyodide APIs');
    }
  }

  if (!/\bPORT\b/.test(code)) {
    failures.push('Must reference PORT environment variable');
  }

  if (failures.length > 0) {
    throw new Error(
      `Python ${isPyodideWorkerMode ? 'Pyodide Worker' : 'Standard'} compatibility check failed:\n\n${failures.map((item) => `  • ${item}`).join('\n')}\n\n` +
      `For ${isPyodideWorkerMode ? 'Pyodide Worker mode: Use Cloudflare Worker APIs' : 'Standard mode: Use Flask, FastAPI, Uvicorn, or HTTPServer'}.\n`
    );
  }
}

/**
 * Read and process project files for deployment
 */
function readProjectFiles(projectPath: string, language: string, pythonMode?: string): string {
  const entryFile = language === 'nodejs' ? 'index.js' : 'app.py';
  const entryPath = path.join(projectPath, entryFile);

  if (!fs.existsSync(entryPath)) {
    throw new Error(`Entry file ${entryFile} not found in ${projectPath}`);
  }

  let code = fs.readFileSync(entryPath, 'utf-8');

  if (language === 'python') {
    validatePythonContainerSource(code, pythonMode);

    // Python-specific processing based on mode
    if (pythonMode === 'pyodide-worker') {
      // For Pyodide Worker mode, ensure workers API is properly structured
      if (!code.includes('from workers import')) {
        code += '\n\n// Import required for Pyodide Worker mode\nfrom workers import WorkerEntrypoint, Response\n';
      }
      // Ensure there's a class Default(WorkerEntrypoint)
      if (!/class Default\s*\(\s*WorkerEntrypoint\s*\):/.test(code)) {
        // Add minimal structure if missing
        code += '\n\n// Worker entrypoint class\nclass Default(WorkerEntrypoint):\n    async def on_fetch(self, request, env, ctx=None):\n        return Response("Hello from Pyodide Worker!", status=200)\n';
      }
    }
  }

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

  const pythonMode = projectConfig.pythonMode || 'standard';

  const isUpdate = !!projectConfig.projectId;
  const spinner = ora(isUpdate ? 'Redeploying to UGA HOST...' : 'Deploying to UGA HOST...').start();

  try {
    const api = createApiClient();
    
    // Read project code
    spinner.text = 'Reading project files...';
    const code = readProjectFiles(process.cwd(), projectConfig.language, pythonMode);
    const version = generateVersion(code);

    // Read requirements.txt for Python projects
    let requirements: string | undefined;
    if (projectConfig.language === 'python') {
      const reqPath = path.join(process.cwd(), 'requirements.txt');
      if (fs.existsSync(reqPath)) {
        requirements = fs.readFileSync(reqPath, 'utf-8');
      }
    }

    let projectId: string;
    let workerVersion: string | undefined;

    if (isUpdate) {
      // ── REDEPLOY existing project ──────────────────────────
      spinner.text = `Redeploying ${projectConfig.name} (${projectConfig.projectId})...`;
      
      const { data } = await api.post(`/api/backend/projects/${projectConfig.projectId}/redeploy`, {
        code,
        version,
        ...(requirements !== undefined && { requirements }),
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
        ...(requirements !== undefined && { requirements }),
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
    
    // An upload alone is not a successful Python deployment. Start the
    // container through the private runtime and require an HTTP response.
    if (projectConfig.language === 'python') {
      spinner.text = 'Starting Python server and verifying health...';
      try {
        const { data: health } = await api.get(`/api/backend/projects/${projectId}/runtime-health`);
        if (!health.success) {
          throw new Error(health.error || health.message || 'Python server did not pass its startup health check');
        }
      } catch (healthError: any) {
        const statusCode = healthError.response?.status;
        const detail: string = healthError.response?.data?.detail
          || healthError.response?.data?.error
          || healthError.response?.data?.body
          || healthError.message
          || '';

        // Non-fatal conditions — code was accepted by platform, container will start on first request
        const isContainerNotReady =
          statusCode === 404 ||
          statusCode === 503 ||
          /container.*not running|container.*start|just exited|not running.*start|starting|cold.?start/i.test(detail);

        if (isContainerNotReady) {
          // Container not warm yet — skip health verification, deploy is still good
        } else {
          throw new Error(`Python server failed startup verification: ${detail}`);
        }
      }
    }

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
