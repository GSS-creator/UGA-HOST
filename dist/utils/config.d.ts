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
export declare function ensureConfigDir(): void;
export declare function getConfig(): Config;
export declare function saveConfig(config: Config): void;
export declare function getProjectConfig(): ProjectConfig | null;
export declare function saveProjectConfig(config: ProjectConfig): void;
export declare function isLoggedIn(): boolean;
//# sourceMappingURL=config.d.ts.map