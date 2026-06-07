"use strict";
/**
 * UGA HOST Database CLI Commands
 * Like `wrangler d1` but for UGA HOST R2-backed JSON store
 *
 * Commands:
 *   ugahost db info                          - Show DB info & storage usage
 *   ugahost db collections                   - List all collections
 *   ugahost db find <collection> [query]     - Find documents
 *   ugahost db get <collection> <id>         - Get one document by _id
 *   ugahost db insert <collection> <json>    - Insert a document
 *   ugahost db update <collection> <query> <updates> - Update documents
 *   ugahost db delete <collection> <query>   - Delete documents
 *   ugahost db drop <collection>             - Drop a collection
 *   ugahost db count <collection> [query]    - Count documents
 *   ugahost db migrate <file>                - Run a migration JSON file
 *   ugahost db export <collection>           - Export collection to JSON
 *   ugahost db import <collection> <file>    - Import JSON file into collection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
const api_1 = require("../utils/api");
// ── Helpers ───────────────────────────────────────────────────────────────────
function requireAuth() {
    if (!(0, config_1.isLoggedIn)()) {
        console.log(chalk_1.default.red('❌ Not logged in. Run: ugahost login'));
        return false;
    }
    return true;
}
function requireProject() {
    const config = (0, config_1.getProjectConfig)();
    if (!config?.projectId) {
        console.log(chalk_1.default.red('❌ No project found. Run: ugahost init'));
        return null;
    }
    return config.projectId;
}
function parseJsonArg(input) {
    try {
        return JSON.parse(input);
    }
    catch {
        // Try as key=value pairs: "name=John age=30"
        if (input.includes('=')) {
            const obj = {};
            input.split(/\s+/).forEach(pair => {
                const [k, ...rest] = pair.split('=');
                const v = rest.join('=');
                // Auto-type
                if (v === 'true')
                    obj[k] = true;
                else if (v === 'false')
                    obj[k] = false;
                else if (!isNaN(Number(v)) && v !== '')
                    obj[k] = Number(v);
                else
                    obj[k] = v;
            });
            return obj;
        }
        throw new Error(`Invalid JSON: ${input}`);
    }
}
function printTable(docs) {
    if (docs.length === 0) {
        console.log(chalk_1.default.gray('  (empty)'));
        return;
    }
    // Get all keys
    const keys = Array.from(new Set(docs.flatMap(d => Object.keys(d)))).sort((a, b) => {
        if (a === '_id')
            return -1;
        if (b === '_id')
            return 1;
        if (a.startsWith('_'))
            return 1;
        if (b.startsWith('_'))
            return -1;
        return a.localeCompare(b);
    });
    // Calculate column widths
    const widths = {};
    keys.forEach(k => {
        widths[k] = Math.max(k.length, ...docs.map(d => String(d[k] ?? '—').length));
        widths[k] = Math.min(widths[k], 40); // cap at 40
    });
    // Header
    const header = keys.map(k => k.padEnd(widths[k])).join('  ');
    const divider = keys.map(k => '─'.repeat(widths[k])).join('──');
    console.log(chalk_1.default.bold.cyan('  ' + header));
    console.log(chalk_1.default.gray('  ' + divider));
    // Rows
    docs.forEach(doc => {
        const row = keys.map(k => {
            let val = doc[k] ?? '—';
            if (typeof val === 'object')
                val = JSON.stringify(val);
            val = String(val);
            if (val.length > 40)
                val = val.slice(0, 37) + '...';
            return val.padEnd(widths[k]);
        }).join('  ');
        console.log('  ' + row);
    });
}
async function dbCall(api, projectId, collection, operation, body = {}) {
    const { data } = await api.post(`/api/backend/projects/${projectId}/db/${collection}/${operation}`, body);
    if (!data.success)
        throw new Error(data.error || 'DB operation failed');
    return data;
}
// ── Commands ──────────────────────────────────────────────────────────────────
exports.dbCommand = {
    // ── INFO ──────────────────────────────────────────────────────────────────
    async info() {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const spinner = (0, ora_1.default)('Fetching database info...').start();
        try {
            const api = (0, api_1.createApiClient)();
            const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
            spinner.stop();
            const db = data.database;
            console.log(chalk_1.default.bold.cyan('\n🗄️  Database Info\n'));
            console.log(chalk_1.default.white('  Type:        ') + chalk_1.default.green(db.type || 'R2 JSON Store'));
            console.log(chalk_1.default.white('  Collections: ') + chalk_1.default.yellow(db.collections?.length ?? 0));
            console.log(chalk_1.default.white('  Storage:     ') + chalk_1.default.yellow(`${db.storage_used_mb} MB`) + chalk_1.default.gray(` / ${db.storage_quota_mb} MB`));
            const pct = db.storage_used_bytes && db.storage_quota_mb
                ? Math.round((db.storage_used_bytes / (Number(db.storage_quota_mb) * 1024 * 1024)) * 100)
                : 0;
            const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
            console.log(chalk_1.default.white('  Usage:       ') + chalk_1.default.cyan(`[${bar}] ${pct}%`));
            if (db.collections?.length > 0) {
                console.log(chalk_1.default.white('\n  Collections:'));
                db.collections.forEach((c) => console.log(chalk_1.default.gray(`    • ${c}`)));
            }
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── COLLECTIONS ───────────────────────────────────────────────────────────
    async collections() {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const spinner = (0, ora_1.default)('Listing collections...').start();
        try {
            const api = (0, api_1.createApiClient)();
            const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
            spinner.stop();
            const colls = data.database?.collections || [];
            if (colls.length === 0) {
                console.log(chalk_1.default.gray('\n  No collections yet. Use: ugahost db insert <collection> <json>\n'));
                return;
            }
            console.log(chalk_1.default.bold.cyan(`\n📋 Collections (${colls.length})\n`));
            colls.forEach(c => console.log(chalk_1.default.white(`  • ${c}`)));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── FIND ──────────────────────────────────────────────────────────────────
    async find(collection, queryStr, options) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const query = queryStr ? parseJsonArg(queryStr) : {};
        const spinner = (0, ora_1.default)(`Querying ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'find', { query });
            spinner.stop();
            const docs = data.docs || [];
            console.log(chalk_1.default.bold.cyan(`\n📋 ${collection} — ${docs.length} document(s)\n`));
            if (options?.json) {
                console.log(JSON.stringify(docs, null, 2));
            }
            else {
                printTable(docs);
            }
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── GET ───────────────────────────────────────────────────────────────────
    async get(collection, id) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const spinner = (0, ora_1.default)(`Getting document...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'findOne', { query: { _id: id } });
            spinner.stop();
            if (!data.doc) {
                console.log(chalk_1.default.yellow(`\n  No document found with _id: ${id}\n`));
                return;
            }
            console.log(chalk_1.default.bold.cyan(`\n📄 ${collection}/${id}\n`));
            console.log(JSON.stringify(data.doc, null, 2));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── INSERT ────────────────────────────────────────────────────────────────
    async insert(collection, jsonStr) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        let doc;
        try {
            doc = parseJsonArg(jsonStr);
        }
        catch (e) {
            console.log(chalk_1.default.red('❌ Invalid JSON: ' + e.message));
            return;
        }
        const spinner = (0, ora_1.default)(`Inserting into ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'insert', { doc });
            spinner.succeed(chalk_1.default.green('✅ Document inserted'));
            console.log(chalk_1.default.white('\n  _id:       ') + chalk_1.default.cyan(data.doc._id));
            console.log(chalk_1.default.white('  createdAt: ') + chalk_1.default.gray(data.doc._createdAt));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── UPDATE ────────────────────────────────────────────────────────────────
    async update(collection, queryStr, updatesStr) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        let query, updates;
        try {
            query = parseJsonArg(queryStr);
            updates = parseJsonArg(updatesStr);
        }
        catch (e) {
            console.log(chalk_1.default.red('❌ Invalid JSON: ' + e.message));
            return;
        }
        const spinner = (0, ora_1.default)(`Updating ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'update', { query, updates });
            spinner.succeed(chalk_1.default.green(`✅ ${data.modified} document(s) updated`));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── DELETE ────────────────────────────────────────────────────────────────
    async delete(collection, queryStr) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        let query;
        try {
            query = parseJsonArg(queryStr);
        }
        catch (e) {
            console.log(chalk_1.default.red('❌ Invalid JSON: ' + e.message));
            return;
        }
        const spinner = (0, ora_1.default)(`Deleting from ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'delete', { query });
            spinner.succeed(chalk_1.default.green(`✅ ${data.deleted} document(s) deleted`));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── DROP ──────────────────────────────────────────────────────────────────
    async drop(collection) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        console.log(chalk_1.default.yellow(`\n⚠️  This will permanently delete ALL documents in "${collection}".`));
        const readline = await Promise.resolve().then(() => __importStar(require('readline')));
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => rl.question(chalk_1.default.white(`  Type "${collection}" to confirm: `), resolve));
        rl.close();
        if (answer.trim() !== collection) {
            console.log(chalk_1.default.gray('\n  Cancelled.\n'));
            return;
        }
        const spinner = (0, ora_1.default)(`Dropping ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            await dbCall(api, projectId, collection, 'drop', {});
            spinner.succeed(chalk_1.default.green(`✅ Collection "${collection}" dropped`));
            console.log('');
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── COUNT ─────────────────────────────────────────────────────────────────
    async count(collection, queryStr) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const query = queryStr ? parseJsonArg(queryStr) : {};
        const spinner = (0, ora_1.default)(`Counting...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'count', { query });
            spinner.stop();
            console.log(chalk_1.default.bold.cyan(`\n  ${collection}: `) + chalk_1.default.yellow(`${data.count} document(s)\n`));
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── MIGRATE ───────────────────────────────────────────────────────────────
    // Migration file format (JSON):
    // { "version": "001", "description": "seed users", "operations": [
    //   { "op": "insert", "collection": "users", "doc": { "name": "Admin", "role": "admin" } },
    //   { "op": "insert", "collection": "settings", "doc": { "key": "theme", "value": "dark" } }
    // ]}
    async migrate(filePath) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const absPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) {
            console.log(chalk_1.default.red(`❌ Migration file not found: ${absPath}`));
            return;
        }
        let migration;
        try {
            migration = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
        }
        catch (e) {
            console.log(chalk_1.default.red('❌ Invalid migration file: ' + e.message));
            return;
        }
        const ops = migration.operations || [];
        console.log(chalk_1.default.bold.cyan(`\n🔄 Running migration: ${migration.description || filePath}`));
        console.log(chalk_1.default.gray(`   Version: ${migration.version || 'unknown'} · ${ops.length} operation(s)\n`));
        const api = (0, api_1.createApiClient)();
        let success = 0, failed = 0;
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            const spinner = (0, ora_1.default)(`  [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`).start();
            try {
                switch (op.op) {
                    case 'insert':
                        await dbCall(api, projectId, op.collection, 'insert', { doc: op.doc });
                        break;
                    case 'update':
                        await dbCall(api, projectId, op.collection, 'update', { query: op.query, updates: op.updates });
                        break;
                    case 'delete':
                        await dbCall(api, projectId, op.collection, 'delete', { query: op.query });
                        break;
                    case 'drop':
                        await dbCall(api, projectId, op.collection, 'drop', {});
                        break;
                    default:
                        throw new Error(`Unknown operation: ${op.op}`);
                }
                spinner.succeed(chalk_1.default.green(`  ✅ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`));
                success++;
            }
            catch (e) {
                spinner.fail(chalk_1.default.red(`  ❌ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}: ${e.message}`));
                failed++;
            }
        }
        console.log('');
        if (failed === 0) {
            console.log(chalk_1.default.bold.green(`✅ Migration complete: ${success}/${ops.length} operations succeeded\n`));
        }
        else {
            console.log(chalk_1.default.bold.yellow(`⚠️  Migration finished: ${success} succeeded, ${failed} failed\n`));
        }
    },
    // ── EXPORT ────────────────────────────────────────────────────────────────
    async export(collection, options) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const spinner = (0, ora_1.default)(`Exporting ${collection}...`).start();
        try {
            const api = (0, api_1.createApiClient)();
            const data = await dbCall(api, projectId, collection, 'find', { query: {} });
            spinner.stop();
            const docs = data.docs || [];
            const output = JSON.stringify(docs, null, 2);
            const outFile = options?.output || `${collection}-export-${Date.now()}.json`;
            const outPath = path.resolve(process.cwd(), outFile);
            fs.writeFileSync(outPath, output, 'utf-8');
            console.log(chalk_1.default.bold.green(`\n✅ Exported ${docs.length} document(s) to: ${outFile}\n`));
        }
        catch (e) {
            spinner.fail(chalk_1.default.red('Failed: ' + (e.response?.data?.error || e.message)));
        }
    },
    // ── IMPORT ────────────────────────────────────────────────────────────────
    async import(collection, filePath) {
        if (!requireAuth())
            return;
        const projectId = requireProject();
        if (!projectId)
            return;
        const absPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(absPath)) {
            console.log(chalk_1.default.red(`❌ File not found: ${absPath}`));
            return;
        }
        let docs;
        try {
            const raw = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
            docs = Array.isArray(raw) ? raw : [raw];
        }
        catch (e) {
            console.log(chalk_1.default.red('❌ Invalid JSON file: ' + e.message));
            return;
        }
        console.log(chalk_1.default.bold.cyan(`\n📥 Importing ${docs.length} document(s) into "${collection}"...\n`));
        const api = (0, api_1.createApiClient)();
        let success = 0, failed = 0;
        for (let i = 0; i < docs.length; i++) {
            const spinner = (0, ora_1.default)(`  [${i + 1}/${docs.length}] Inserting...`).start();
            try {
                // Strip system fields so they get regenerated
                const { _id, _createdAt, _updatedAt, ...cleanDoc } = docs[i];
                await dbCall(api, projectId, collection, 'insert', { doc: cleanDoc });
                spinner.succeed(chalk_1.default.green(`  ✅ [${i + 1}/${docs.length}] Inserted`));
                success++;
            }
            catch (e) {
                spinner.fail(chalk_1.default.red(`  ❌ [${i + 1}/${docs.length}] ${e.message}`));
                failed++;
            }
        }
        console.log('');
        if (failed === 0) {
            console.log(chalk_1.default.bold.green(`✅ Import complete: ${success} document(s) inserted\n`));
        }
        else {
            console.log(chalk_1.default.bold.yellow(`⚠️  Import finished: ${success} inserted, ${failed} failed\n`));
        }
    },
};
//# sourceMappingURL=db.js.map