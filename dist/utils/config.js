"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConfigDir = ensureConfigDir;
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.getProjectConfig = getProjectConfig;
exports.saveProjectConfig = saveProjectConfig;
exports.isLoggedIn = isLoggedIn;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), '.ugahost');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
const PROJECT_CONFIG = 'ugahost.json';
function ensureConfigDir() {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
function getConfig() {
    ensureConfigDir();
    if (!fs_1.default.existsSync(CONFIG_FILE)) {
        return {
            apiUrl: 'https://qssn-paas-management.gastonsoftwaresolutions234.workers.dev'
        };
    }
    const data = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
}
function saveConfig(config) {
    ensureConfigDir();
    fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function getProjectConfig() {
    if (!fs_1.default.existsSync(PROJECT_CONFIG)) {
        return null;
    }
    const data = fs_1.default.readFileSync(PROJECT_CONFIG, 'utf-8');
    return JSON.parse(data);
}
function saveProjectConfig(config) {
    fs_1.default.writeFileSync(PROJECT_CONFIG, JSON.stringify(config, null, 2));
}
function isLoggedIn() {
    const config = getConfig();
    return !!config.apiKey && !!config.email;
}
//# sourceMappingURL=config.js.map