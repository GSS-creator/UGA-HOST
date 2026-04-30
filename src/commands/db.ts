
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

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAuth(): boolean {
  if (!isLoggedIn()) {
    console.log(chalk.red('❌ Not logged in. Run: ugahost login'));
    return false;
  }
  return true;
}

function requireProject(): string | null {
  const config = getProjectConfig();
  if (!config?.projectId) {
    console.log(chalk.red('❌ No project found. Run: ugahost init'));
    return null;
  }
  return config.projectId;
}

function parseJsonArg(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    // Try as key=value pairs: "name=John age=30"
    if (input.includes('=')) {
      const obj: any = {};
      input.split(/\s+/).forEach(pair => {
        const [k, ...rest] = pair.split('=');
        const v = rest.join('=');
        // Auto-type
        if (v === 'true') obj[k] = true;
        else if (v === 'false') obj[k] = false;
        else if (!isNaN(Number(v)) && v !== '') obj[k] = Number(v);
        else obj[k] = v;
      });
      return obj;
    }
    throw new Error(`Invalid JSON: ${input}`);
  }
}

function printTable(docs: any[]): void {
  if (docs.length === 0) {
    console.log(chalk.gray('  (empty)'));
    return;
  }

  // Get all keys
  const keys = Array.from(new Set(docs.flatMap(d => Object.keys(d)))).sort((a, b) => {
    if (a === '_id') return -1;
    if (b === '_id') return 1;
    if (a.startsWith('_')) return 1;
    if (b.startsWith('_')) return -1;
    return a.localeCompare(b);
  });

  // Calculate column widths
  const widths: Record<string, number> = {};
  keys.forEach(k => {
    widths[k] = Math.max(k.length, ...docs.map(d => String(d[k] ?? '—').length));
    widths[k] = Math.min(widths[k], 40); // cap at 40
  });

  // Header
  const header = keys.map(k => k.padEnd(widths[k])).join('  ');
  const divider = keys.map(k => '─'.repeat(widths[k])).join('──');
  console.log(chalk.bold.cyan('  ' + header));
  console.log(chalk.gray('  ' + divider));

  // Rows
  docs.forEach(doc => {
    const row = keys.map(k => {
      let val = doc[k] ?? '—';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val);
      if (val.length > 40) val = val.slice(0, 37) + '...';
      return val.padEnd(widths[k]);
    }).join('  ');
    console.log('  ' + row);
  });
}

async function dbCall(
  api: any,
  projectId: string,
  collection: string,
  operation: string,
  body: any = {}
): Promise<any> {
  const { data } = await api.post(
    `/api/backend/projects/${projectId}/db/${collection}/${operation}`,
    body
  );
  if (!data.success) throw new Error(data.error || 'DB operation failed');
  return data;
}

// ── Commands ──────────────────────────────────────────────────────────────────

export const dbCommand = {

  // ── INFO ──────────────────────────────────────────────────────────────────
  async info(): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora('Fetching database info...').start();
    try {
      const api = createApiClient();
      const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
      spinner.stop();

      const db = data.database;
      console.log(chalk.bold.cyan('\n🗄️  Database Info\n'));
      console.log(chalk.white('  Type:        ') + chalk.green(db.type || 'R2 JSON Store'));
      console.log(chalk.white('  Collections: ') + chalk.yellow(db.collections?.length ?? 0));
      console.log(chalk.white('  Storage:     ') + chalk.yellow(`${db.storage_used_mb} MB`) + chalk.gray(` / ${db.storage_quota_mb} MB`));

      const pct = db.storage_used_bytes && db.storage_quota_mb
        ? Math.round((db.storage_used_bytes / (Number(db.storage_quota_mb) * 1024 * 1024)) * 100)
        : 0;
      const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
      console.log(chalk.white('  Usage:       ') + chalk.cyan(`[${bar}] ${pct}%`));

      if (db.collections?.length > 0) {
        console.log(chalk.white('\n  Collections:'));
        db.collections.forEach((c: string) => console.log(chalk.gray(`    • ${c}`)));
      }
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── COLLECTIONS ───────────────────────────────────────────────────────────
  async collections(): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora('Listing collections...').start();
    try {
      const api = createApiClient();
      const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
      spinner.stop();

      const colls: string[] = data.database?.collections || [];
      if (colls.length === 0) {
        console.log(chalk.gray('\n  No collections yet. Use: ugahost db insert <collection> <json>\n'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📋 Collections (${colls.length})\n`));
      colls.forEach(c => console.log(chalk.white(`  • ${c}`)));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── FIND ──────────────────────────────────────────────────────────────────
  async find(collection: string, queryStr?: string, options?: any): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const query = queryStr ? parseJsonArg(queryStr) : {};
    const spinner = ora(`Querying ${collection}...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'find', { query });
      spinner.stop();

      const docs: any[] = data.docs || [];
      console.log(chalk.bold.cyan(`\n📋 ${collection} — ${docs.length} document(s)\n`));

      if (options?.json) {
        console.log(JSON.stringify(docs, null, 2));
      } else {
        printTable(docs);
      }
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── GET ───────────────────────────────────────────────────────────────────
  async get(collection: string, id: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora(`Getting document...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'findOne', { query: { _id: id } });
      spinner.stop();

      if (!data.doc) {
        console.log(chalk.yellow(`\n  No document found with _id: ${id}\n`));
        return;
      }

      console.log(chalk.bold.cyan(`\n📄 ${collection}/${id}\n`));
      console.log(JSON.stringify(data.doc, null, 2));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── INSERT ────────────────────────────────────────────────────────────────
  async insert(collection: string, jsonStr: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    let doc: any;
    try {
      doc = parseJsonArg(jsonStr);
    } catch (e: any) {
      console.log(chalk.red('❌ Invalid JSON: ' + e.message));
      return;
    }

    const spinner = ora(`Inserting into ${collection}...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'insert', { doc });
      spinner.succeed(chalk.green('✅ Document inserted'));
      console.log(chalk.white('\n  _id:       ') + chalk.cyan(data.doc._id));
      console.log(chalk.white('  createdAt: ') + chalk.gray(data.doc._createdAt));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── UPDATE ────────────────────────────────────────────────────────────────
  async update(collection: string, queryStr: string, updatesStr: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    let query: any, updates: any;
    try {
      query   = parseJsonArg(queryStr);
      updates = parseJsonArg(updatesStr);
    } catch (e: any) {
      console.log(chalk.red('❌ Invalid JSON: ' + e.message));
      return;
    }

    const spinner = ora(`Updating ${collection}...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'update', { query, updates });
      spinner.succeed(chalk.green(`✅ ${data.modified} document(s) updated`));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── DELETE ────────────────────────────────────────────────────────────────
  async delete(collection: string, queryStr: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    let query: any;
    try {
      query = parseJsonArg(queryStr);
    } catch (e: any) {
      console.log(chalk.red('❌ Invalid JSON: ' + e.message));
      return;
    }

    const spinner = ora(`Deleting from ${collection}...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'delete', { query });
      spinner.succeed(chalk.green(`✅ ${data.deleted} document(s) deleted`));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── DROP ──────────────────────────────────────────────────────────────────
  async drop(collection: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    console.log(chalk.yellow(`\n⚠️  This will permanently delete ALL documents in "${collection}".`));
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(resolve => rl.question(chalk.white(`  Type "${collection}" to confirm: `), resolve));
    rl.close();

    if (answer.trim() !== collection) {
      console.log(chalk.gray('\n  Cancelled.\n'));
      return;
    }

    const spinner = ora(`Dropping ${collection}...`).start();
    try {
      const api = createApiClient();
      await dbCall(api, projectId, collection, 'drop', {});
      spinner.succeed(chalk.green(`✅ Collection "${collection}" dropped`));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── COUNT ─────────────────────────────────────────────────────────────────
  async count(collection: string, queryStr?: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const query = queryStr ? parseJsonArg(queryStr) : {};
    const spinner = ora(`Counting...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'count', { query });
      spinner.stop();
      console.log(chalk.bold.cyan(`\n  ${collection}: `) + chalk.yellow(`${data.count} document(s)\n`));
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── MIGRATE ───────────────────────────────────────────────────────────────
  // Migration file format (JSON):
  // { "version": "001", "description": "seed users", "operations": [
  //   { "op": "insert", "collection": "users", "doc": { "name": "Admin", "role": "admin" } },
  //   { "op": "insert", "collection": "settings", "doc": { "key": "theme", "value": "dark" } }
  // ]}
  async migrate(filePath: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      console.log(chalk.red(`❌ Migration file not found: ${absPath}`));
      return;
    }

    let migration: any;
    try {
      migration = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
    } catch (e: any) {
      console.log(chalk.red('❌ Invalid migration file: ' + e.message));
      return;
    }

    const ops = migration.operations || [];
    console.log(chalk.bold.cyan(`\n🔄 Running migration: ${migration.description || filePath}`));
    console.log(chalk.gray(`   Version: ${migration.version || 'unknown'} · ${ops.length} operation(s)\n`));

    const api = createApiClient();
    let success = 0, failed = 0;

    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const spinner = ora(`  [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`).start();
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
        spinner.succeed(chalk.green(`  ✅ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`));
        success++;
      } catch (e: any) {
        spinner.fail(chalk.red(`  ❌ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}: ${e.message}`));
        failed++;
      }
    }

    console.log('');
    if (failed === 0) {
      console.log(chalk.bold.green(`✅ Migration complete: ${success}/${ops.length} operations succeeded\n`));
    } else {
      console.log(chalk.bold.yellow(`⚠️  Migration finished: ${success} succeeded, ${failed} failed\n`));
    }
  },

  // ── EXPORT ────────────────────────────────────────────────────────────────
  async export(collection: string, options?: any): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora(`Exporting ${collection}...`).start();
    try {
      const api = createApiClient();
      const data = await dbCall(api, projectId, collection, 'find', { query: {} });
      spinner.stop();

      const docs = data.docs || [];
      const output = JSON.stringify(docs, null, 2);

      const outFile = options?.output || `${collection}-export-${Date.now()}.json`;
      const outPath = path.resolve(process.cwd(), outFile);
      fs.writeFileSync(outPath, output, 'utf-8');

      console.log(chalk.bold.green(`\n✅ Exported ${docs.length} document(s) to: ${outFile}\n`));
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── IMPORT ────────────────────────────────────────────────────────────────
  async import(collection: string, filePath: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      console.log(chalk.red(`❌ File not found: ${absPath}`));
      return;
    }

    let docs: any[];
    try {
      const raw = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
      docs = Array.isArray(raw) ? raw : [raw];
    } catch (e: any) {
      console.log(chalk.red('❌ Invalid JSON file: ' + e.message));
      return;
    }

    console.log(chalk.bold.cyan(`\n📥 Importing ${docs.length} document(s) into "${collection}"...\n`));
    const api = createApiClient();
    let success = 0, failed = 0;

    for (let i = 0; i < docs.length; i++) {
      const spinner = ora(`  [${i + 1}/${docs.length}] Inserting...`).start();
      try {
        // Strip system fields so they get regenerated
        const { _id, _createdAt, _updatedAt, ...cleanDoc } = docs[i];
        await dbCall(api, projectId, collection, 'insert', { doc: cleanDoc });
        spinner.succeed(chalk.green(`  ✅ [${i + 1}/${docs.length}] Inserted`));
        success++;
      } catch (e: any) {
        spinner.fail(chalk.red(`  ❌ [${i + 1}/${docs.length}] ${e.message}`));
        failed++;
      }
    }

    console.log('');
    if (failed === 0) {
      console.log(chalk.bold.green(`✅ Import complete: ${success} document(s) inserted\n`));
    } else {
      console.log(chalk.bold.yellow(`⚠️  Import finished: ${success} inserted, ${failed} failed\n`));
    }
  },
};
