import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.ugahost');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const PROJECT_CONFIG = 'ugahost.json';

export interface Config {
  email?: string;
  apiKey?: string;
  userId?: string;
  apiUrl: string;
}

export interface ProjectConfig {
  name: string;
  projectId?: string;
  language: string;
  framework?: string;
  subdomain: string;
  port?: number;
  buildCommand?: string;
  startCommand?: string;
  installCommand?: string;
}

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig(): Config {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return {
      apiUrl: 'https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev'
    };
  }
  
  const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getProjectConfig(): ProjectConfig | null {
  if (!fs.existsSync(PROJECT_CONFIG)) {
    return null;
  }
  
  const data = fs.readFileSync(PROJECT_CONFIG, 'utf-8');
  return JSON.parse(data);
}

export function saveProjectConfig(config: ProjectConfig): void {
  fs.writeFileSync(PROJECT_CONFIG, JSON.stringify(config, null, 2));
}

export function isLoggedIn(): boolean {
  const config = getConfig();
  return !!config.apiKey && !!config.email;
}
