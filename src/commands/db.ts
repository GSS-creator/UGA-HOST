/**
 * UGA HOST Database CLI Commands
 *
 * Turso (SQLite) projects — commands talk to /database/query via raw SQL:
 *   ugahost db tables                              List tables + row counts
 *   ugahost db query "<SQL>"                       Run any SQL statement
 *   ugahost db find   <table>  [where_clause]      SELECT * FROM <table> [WHERE ...]
 *   ugahost db get    <table>  <id>                SELECT * … WHERE id=<id>
 *   ugahost db insert <table>  <json>              INSERT INTO <table>
 *   ugahost db update <table>  <where> <setjson>   UPDATE <table> SET … WHERE …
 *   ugahost db delete <table>  <where>             DELETE FROM <table> WHERE …
 *   ugahost db drop   <table>                      DROP TABLE <table>
 *   ugahost db count  <table>  [where_clause]      SELECT COUNT(*) …
 *   ugahost db migrate <file>                      Run .sql file or JSON migration
 *   ugahost db export  <table> [-o file]           Export rows to JSON
 *   ugahost db import  <table> <file>              Bulk-insert JSON array
 *
 * R2 (NoSQL) projects — original collection-based behaviour unchanged:
 *   ugahost db info / collections / find / get / insert / update / delete /
 *              drop / count / migrate / export / import
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import ora from 'ora';
import { getProjectConfig, isLoggedIn } from '../utils/config';
import { createApiClient } from '../utils/api';

// ── Auth / project guards ─────────────────────────────────────────────────────

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

// ── JSON / key=value parser ───────────────────────────────────────────────────

function parseJsonArg(input: string): any {
  try { return JSON.parse(input); } catch { /* fall through */ }
  if (input.includes('=')) {
    const obj: any = {};
    input.split(/\s+/).forEach(pair => {
      const [k, ...rest] = pair.split('=');
      const v = rest.join('=');
      if (v === 'true') obj[k] = true;
      else if (v === 'false') obj[k] = false;
      else if (!isNaN(Number(v)) && v !== '') obj[k] = Number(v);
      else obj[k] = v;
    });
    return obj;
  }
  throw new Error(`Invalid JSON: ${input}`);
}

// ── Detect project DB type ────────────────────────────────────────────────────

async function detectDbType(api: any, projectId: string): Promise<'turso' | 'r2'> {
  try {
    const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
    return data.database?.type === 'turso' ? 'turso' : 'r2';
  } catch {
    return 'r2';
  }
}

// ── Turso query helper ────────────────────────────────────────────────────────

async function tursoQuery(
  api: any,
  projectId: string,
  sql: string,
  args?: any[]
): Promise<{ columns: string[]; rows: Record<string, any>[]; rows_affected: number }> {
  const body: any = { sql };
  if (args && args.length > 0) body.args = args;
  const { data } = await api.post(`/api/backend/projects/${projectId}/database/query`, body);
  if (!data.success) throw new Error(data.error || 'Query failed');
  return { columns: data.columns || [], rows: data.rows || [], rows_affected: data.rows_affected ?? 0 };
}

// ── R2 collection helper ──────────────────────────────────────────────────────

async function r2Call(
  api: any, projectId: string,
  collection: string, operation: string, body: any = {}
): Promise<any> {
  const { data } = await api.post(
    `/api/backend/projects/${projectId}/db/${collection}/${operation}`, body
  );
  if (!data.success) throw new Error(data.error || 'DB operation failed');
  return data;
}

// ── Print helpers ─────────────────────────────────────────────────────────────

function printTable(rows: Record<string, any>[], cols?: string[]): void {
  if (rows.length === 0) { console.log(chalk.gray('  (empty)')); return; }

  const keys = cols ?? Array.from(new Set(rows.flatMap(d => Object.keys(d)))).sort((a, b) => {
    if (a === 'id' || a === '_id') return -1;
    if (b === 'id' || b === '_id') return 1;
    if (a.startsWith('_')) return 1;
    if (b.startsWith('_')) return -1;
    return a.localeCompare(b);
  });

  const widths: Record<string, number> = {};
  keys.forEach(k => {
    widths[k] = Math.max(k.length, ...rows.map(d => String(d[k] ?? 'NULL').length));
    widths[k] = Math.min(widths[k], 44);
  });

  const header  = keys.map(k => k.padEnd(widths[k])).join('  ');
  const divider = keys.map(k => '─'.repeat(widths[k])).join('──');
  console.log(chalk.bold.cyan('  ' + header));
  console.log(chalk.gray('  ' + divider));

  rows.forEach(row => {
    const line = keys.map(k => {
      let v = row[k];
      if (v === null || v === undefined) return chalk.dim('NULL'.padEnd(widths[k]));
      if (typeof v === 'object') v = JSON.stringify(v);
      v = String(v);
      if (v.length > 44) v = v.slice(0, 41) + '...';
      return v.padEnd(widths[k]);
    }).join('  ');
    console.log('  ' + line);
  });
}

// Build WHERE clause from a JSON object: {a:1,b:"x"} → "a = 1 AND b = 'x'"
function buildWhere(obj: Record<string, any>): { clause: string; args: any[] } {
  const parts: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(obj)) {
    parts.push(`"${k}" = ?`);
    args.push(v);
  }
  return { clause: parts.join(' AND '), args };
}

// Build SET clause from a JSON object: {a:1} → "a = ?"
function buildSet(obj: Record<string, any>): { clause: string; args: any[] } {
  const parts: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(obj)) {
    parts.push(`"${k}" = ?`);
    args.push(v);
  }
  return { clause: parts.join(', '), args };
}

// ── Command object ────────────────────────────────────────────────────────────

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

      if (db.type === 'turso') {
        console.log(chalk.bold.cyan('\n🗄️  Database Info\n'));
        console.log(chalk.white('  Type:    ') + chalk.green('Turso (libSQL / SQLite)'));
        console.log(chalk.white('  URL:     ') + chalk.gray(db.database_url));
        console.log(chalk.white('  Tables:  ') + chalk.yellow(db.tables?.length ?? 0));
        if (db.tables?.length > 0) {
          console.log('');
          db.tables.forEach((t: any) =>
            console.log(chalk.gray(`    • ${t.name.padEnd(24)} `) + chalk.yellow(`${t.rows} rows`))
          );
        }
      } else {
        console.log(chalk.bold.cyan('\n🗄️  Database Info\n'));
        console.log(chalk.white('  Type:        ') + chalk.green(db.type || 'R2 JSON Store'));
        console.log(chalk.white('  Collections: ') + chalk.yellow(db.collections?.length ?? 0));
        console.log(chalk.white('  Storage:     ') + chalk.yellow(`${db.storage_used_mb} MB`) + chalk.gray(` / ${db.storage_quota_mb} MB`));
        const pct = db.storage_used_bytes && db.storage_quota_mb
          ? Math.round((db.storage_used_bytes / (Number(db.storage_quota_mb) * 1024 * 1024)) * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        console.log(chalk.white('  Usage:       ') + chalk.cyan(`[${bar}] ${pct}%`));
        if (db.collections?.length > 0) {
          console.log(chalk.white('\n  Collections:'));
          db.collections.forEach((c: string) => console.log(chalk.gray(`    • ${c}`)));
        }
      }
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── TABLES (Turso only) ────────────────────────────────────────────────────
  async tables(): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora('Listing tables...').start();
    try {
      const api = createApiClient();
      const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
      spinner.stop();

      if (data.database?.type !== 'turso') {
        console.log(chalk.yellow('\n  This project uses R2 (NoSQL). Use: ugahost db collections\n'));
        return;
      }

      const tables: { name: string; rows: number }[] = data.database.tables || [];
      if (tables.length === 0) {
        console.log(chalk.gray('\n  No tables yet. Use: ugahost db query "CREATE TABLE ..."\n'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📋 Tables (${tables.length})\n`));
      tables.forEach(t =>
        console.log(chalk.white(`  • ${t.name.padEnd(28)} `) + chalk.yellow(`${t.rows} rows`))
      );
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── COLLECTIONS (R2 only, kept for backwards compat) ──────────────────────
  async collections(): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora('Listing collections...').start();
    try {
      const api = createApiClient();
      const { data } = await api.get(`/api/backend/projects/${projectId}/database`);
      spinner.stop();

      if (data.database?.type === 'turso') {
        spinner.stop();
        console.log(chalk.yellow('\n  Turso project — use: ugahost db tables\n'));
        return;
      }

      const colls: string[] = data.database?.collections || [];
      if (colls.length === 0) {
        console.log(chalk.gray('\n  No collections yet.\n'));
        return;
      }
      console.log(chalk.bold.cyan(`\n📋 Collections (${colls.length})\n`));
      colls.forEach(c => console.log(chalk.white(`  • ${c}`)));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── QUERY (Turso only — raw SQL) ───────────────────────────────────────────
  async query(sqlStr: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora('Running query...').start();
    try {
      const api = createApiClient();
      const result = await tursoQuery(api, projectId, sqlStr);
      spinner.stop();

      if (result.columns.length === 0) {
        console.log(chalk.bold.green(`\n✅ OK — ${result.rows_affected} row(s) affected\n`));
      } else {
        console.log(chalk.bold.cyan(`\n  ${result.rows.length} row(s)\n`));
        printTable(result.rows, result.columns);
        console.log('');
      }
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── FIND ──────────────────────────────────────────────────────────────────
  async find(collection: string, queryStr?: string, options?: any): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const spinner = ora(`Querying ${collection}...`).start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        // queryStr is treated as a raw WHERE clause string or JSON obj
        let whereClause = '';
        let args: any[] = [];
        if (queryStr) {
          try {
            const obj = parseJsonArg(queryStr);
            const w = buildWhere(obj);
            whereClause = ` WHERE ${w.clause}`;
            args = w.args;
          } catch {
            // treat as raw SQL WHERE expression
            whereClause = ` WHERE ${queryStr}`;
          }
        }
        const sql = `SELECT * FROM "${collection}"${whereClause} LIMIT 200`;
        const result = await tursoQuery(api, projectId, sql, args);
        spinner.stop();
        console.log(chalk.bold.cyan(`\n📋 ${collection} — ${result.rows.length} row(s)\n`));
        if (options?.json) {
          console.log(JSON.stringify(result.rows, null, 2));
        } else {
          printTable(result.rows, result.columns);
        }
      } else {
        const query = queryStr ? parseJsonArg(queryStr) : {};
        const data = await r2Call(api, projectId, collection, 'find', { query });
        spinner.stop();
        const docs: any[] = data.docs || [];
        console.log(chalk.bold.cyan(`\n📋 ${collection} — ${docs.length} document(s)\n`));
        if (options?.json) console.log(JSON.stringify(docs, null, 2));
        else printTable(docs);
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

    const spinner = ora('Getting row...').start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        // Try numeric id first, then text
        const idVal = isNaN(Number(id)) ? id : Number(id);
        const result = await tursoQuery(api, projectId,
          `SELECT * FROM "${collection}" WHERE id = ? LIMIT 1`, [idVal]);
        spinner.stop();
        if (result.rows.length === 0) {
          console.log(chalk.yellow(`\n  No row found with id: ${id}\n`));
          return;
        }
        console.log(chalk.bold.cyan(`\n📄 ${collection}/${id}\n`));
        console.log(JSON.stringify(result.rows[0], null, 2));
      } else {
        const data = await r2Call(api, projectId, collection, 'findOne', { query: { _id: id } });
        spinner.stop();
        if (!data.doc) { console.log(chalk.yellow(`\n  No document found with _id: ${id}\n`)); return; }
        console.log(chalk.bold.cyan(`\n📄 ${collection}/${id}\n`));
        console.log(JSON.stringify(data.doc, null, 2));
      }
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
    try { doc = parseJsonArg(jsonStr); }
    catch (e: any) { console.log(chalk.red('❌ Invalid JSON: ' + e.message)); return; }

    const spinner = ora(`Inserting into ${collection}...`).start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        const cols = Object.keys(doc);
        const placeholders = cols.map(() => '?').join(', ');
        const vals = cols.map(k => doc[k]);
        const sql = `INSERT INTO "${collection}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
        const result = await tursoQuery(api, projectId, sql, vals);
        spinner.succeed(chalk.green('✅ Row inserted'));
        console.log(chalk.gray(`   ${result.rows_affected} row(s) affected`));
      } else {
        const data = await r2Call(api, projectId, collection, 'insert', { doc });
        spinner.succeed(chalk.green('✅ Document inserted'));
        console.log(chalk.white('\n  _id:       ') + chalk.cyan(data.doc._id));
        console.log(chalk.white('  createdAt: ') + chalk.gray(data.doc._createdAt));
      }
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
    } catch (e: any) { console.log(chalk.red('❌ Invalid JSON: ' + e.message)); return; }

    const spinner = ora(`Updating ${collection}...`).start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        const set   = buildSet(query !== updates ? updates : updates);
        const where = buildWhere(query);
        const sql   = `UPDATE "${collection}" SET ${set.clause} WHERE ${where.clause}`;
        const result = await tursoQuery(api, projectId, sql, [...set.args, ...where.args]);
        spinner.succeed(chalk.green(`✅ ${result.rows_affected} row(s) updated`));
      } else {
        const data = await r2Call(api, projectId, collection, 'update', { query, updates });
        spinner.succeed(chalk.green(`✅ ${data.modified} document(s) updated`));
      }
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
    try { query = parseJsonArg(queryStr); }
    catch (e: any) { console.log(chalk.red('❌ Invalid JSON: ' + e.message)); return; }

    const spinner = ora(`Deleting from ${collection}...`).start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        const where = buildWhere(query);
        const sql   = `DELETE FROM "${collection}" WHERE ${where.clause}`;
        const result = await tursoQuery(api, projectId, sql, where.args);
        spinner.succeed(chalk.green(`✅ ${result.rows_affected} row(s) deleted`));
      } else {
        const data = await r2Call(api, projectId, collection, 'delete', { query });
        spinner.succeed(chalk.green(`✅ ${data.deleted} document(s) deleted`));
      }
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

    console.log(chalk.yellow(`\n⚠️  This will permanently delete "${collection}" and ALL its data.`));
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(resolve =>
      rl.question(chalk.white(`  Type "${collection}" to confirm: `), resolve));
    rl.close();

    if (answer.trim() !== collection) {
      console.log(chalk.gray('\n  Cancelled.\n'));
      return;
    }

    const spinner = ora(`Dropping ${collection}...`).start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        await tursoQuery(api, projectId, `DROP TABLE IF EXISTS "${collection}"`);
        spinner.succeed(chalk.green(`✅ Table "${collection}" dropped`));
      } else {
        await r2Call(api, projectId, collection, 'drop', {});
        spinner.succeed(chalk.green(`✅ Collection "${collection}" dropped`));
      }
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

    const spinner = ora('Counting...').start();
    try {
      const api = createApiClient();
      const dbType = await detectDbType(api, projectId);

      if (dbType === 'turso') {
        let whereClause = '';
        let args: any[] = [];
        if (queryStr) {
          try {
            const obj = parseJsonArg(queryStr);
            const w = buildWhere(obj);
            whereClause = ` WHERE ${w.clause}`;
            args = w.args;
          } catch { whereClause = ` WHERE ${queryStr}`; }
        }
        const result = await tursoQuery(api, projectId,
          `SELECT COUNT(*) as cnt FROM "${collection}"${whereClause}`, args);
        spinner.stop();
        const cnt = result.rows[0]?.cnt ?? 0;
        console.log(chalk.bold.cyan(`\n  ${collection}: `) + chalk.yellow(`${cnt} row(s)\n`));
      } else {
        const query = queryStr ? parseJsonArg(queryStr) : {};
        const data  = await r2Call(api, projectId, collection, 'count', { query });
        spinner.stop();
        console.log(chalk.bold.cyan(`\n  ${collection}: `) + chalk.yellow(`${data.count} document(s)\n`));
      }
    } catch (e: any) {
      spinner.fail(chalk.red('Failed: ' + (e.response?.data?.error || e.message)));
    }
  },

  // ── MIGRATE ───────────────────────────────────────────────────────────────
  // Supports two formats:
  //   .sql  file  — run each statement separated by ";"
  //   .json file  — { version, description, operations: [{sql,op,collection,...}] }
  async migrate(filePath: string): Promise<void> {
    if (!requireAuth()) return;
    const projectId = requireProject();
    if (!projectId) return;

    const absPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absPath)) {
      console.log(chalk.red(`❌ File not found: ${absPath}`));
      return;
    }

    const api = createApiClient();
    const dbType = await detectDbType(api, projectId);
    const ext = path.extname(filePath).toLowerCase();

    if (dbType === 'turso') {
      // .sql file — split on ";" and run each statement
      let statements: string[] = [];
      if (ext === '.sql') {
        const raw = fs.readFileSync(absPath, 'utf-8');
        statements = raw.split(';').map(s => s.trim()).filter(Boolean);
      } else {
        // JSON with { operations: [{sql: "..."}] }
        const migration = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
        statements = (migration.operations || []).map((op: any) => op.sql).filter(Boolean);
      }

      console.log(chalk.bold.cyan(`\n🔄 Running migration: ${path.basename(filePath)}`));
      console.log(chalk.gray(`   ${statements.length} statement(s)\n`));

      let success = 0, failed = 0;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const label = stmt.slice(0, 60).replace(/\s+/g, ' ') + (stmt.length > 60 ? '…' : '');
        const spinner = ora(`  [${i + 1}/${statements.length}] ${label}`).start();
        try {
          const result = await tursoQuery(api, projectId, stmt);
          spinner.succeed(chalk.green(`  ✅ [${i + 1}/${statements.length}] ${label}`));
          success++;
        } catch (e: any) {
          spinner.fail(chalk.red(`  ❌ [${i + 1}/${statements.length}] ${label}: ${e.message}`));
          failed++;
        }
      }

      console.log('');
      if (failed === 0) console.log(chalk.bold.green(`✅ Migration complete: ${success}/${statements.length} succeeded\n`));
      else console.log(chalk.bold.yellow(`⚠️  Migration finished: ${success} succeeded, ${failed} failed\n`));

    } else {
      // R2 — original JSON migration format
      let migration: any;
      try { migration = JSON.parse(fs.readFileSync(absPath, 'utf-8')); }
      catch (e: any) { console.log(chalk.red('❌ Invalid migration file: ' + e.message)); return; }

      const ops = migration.operations || [];
      console.log(chalk.bold.cyan(`\n🔄 Running migration: ${migration.description || filePath}`));
      console.log(chalk.gray(`   Version: ${migration.version || 'unknown'} · ${ops.length} operation(s)\n`));

      let success = 0, failed = 0;
      for (let i = 0; i < ops.length; i++) {
        const op = ops[i];
        const spinner = ora(`  [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`).start();
        try {
          switch (op.op) {
            case 'insert': await r2Call(api, projectId, op.collection, 'insert', { doc: op.doc }); break;
            case 'update': await r2Call(api, projectId, op.collection, 'update', { query: op.query, updates: op.updates }); break;
            case 'delete': await r2Call(api, projectId, op.collection, 'delete', { query: op.query }); break;
            case 'drop':   await r2Call(api, projectId, op.collection, 'drop',   {}); break;
            default: throw new Error(`Unknown operation: ${op.op}`);
          }
          spinner.succeed(chalk.green(`  ✅ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}`));
          success++;
        } catch (e: any) {
          spinner.fail(chalk.red(`  ❌ [${i + 1}/${ops.length}] ${op.op} → ${op.collection}: ${e.message}`));
          failed++;
        }
      }
      console.log('');
      if (failed === 0) console.log(chalk.bold.green(`✅ Migration complete: ${success}/${ops.length} succeeded\n`));
      else console.log(chalk.bold.yellow(`⚠️  Migration finished: ${success} succeeded, ${failed} failed\n`));
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
      const dbType = await detectDbType(api, projectId);

      let rows: any[];
      if (dbType === 'turso') {
        const result = await tursoQuery(api, projectId, `SELECT * FROM "${collection}"`);
        rows = result.rows;
      } else {
        const data = await r2Call(api, projectId, collection, 'find', { query: {} });
        rows = data.docs || [];
      }
      spinner.stop();

      const outFile = options?.output || `${collection}-export-${Date.now()}.json`;
      const outPath = path.resolve(process.cwd(), outFile);
      fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf-8');
      console.log(chalk.bold.green(`\n✅ Exported ${rows.length} row(s) → ${outFile}\n`));
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

    let rows: any[];
    try {
      const raw = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
      rows = Array.isArray(raw) ? raw : [raw];
    } catch (e: any) { console.log(chalk.red('❌ Invalid JSON file: ' + e.message)); return; }

    console.log(chalk.bold.cyan(`\n📥 Importing ${rows.length} row(s) into "${collection}"...\n`));
    const api = createApiClient();
    const dbType = await detectDbType(api, projectId);
    let success = 0, failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const spinner = ora(`  [${i + 1}/${rows.length}] Inserting...`).start();
      try {
        if (dbType === 'turso') {
          // Only strip the auto-increment primary key; keep all other fields including created_at
          const { id, _id, _createdAt, _updatedAt, ...cleanRow } = rows[i];
          const cols = Object.keys(cleanRow);
          const sql  = `INSERT INTO "${collection}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
          await tursoQuery(api, projectId, sql, cols.map(k => cleanRow[k]));
        } else {
          const { _id, _createdAt, _updatedAt, ...cleanDoc } = rows[i];
          await r2Call(api, projectId, collection, 'insert', { doc: cleanDoc });
        }
        spinner.succeed(chalk.green(`  ✅ [${i + 1}/${rows.length}] Inserted`));
        success++;
      } catch (e: any) {
        spinner.fail(chalk.red(`  ❌ [${i + 1}/${rows.length}] ${e.message}`));
        failed++;
      }
    }

    console.log('');
    if (failed === 0) console.log(chalk.bold.green(`✅ Import complete: ${success} row(s) inserted\n`));
    else console.log(chalk.bold.yellow(`⚠️  Import finished: ${success} inserted, ${failed} failed\n`));
  },
};
