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
export declare const dbCommand: {
    info(): Promise<void>;
    tables(): Promise<void>;
    collections(): Promise<void>;
    query(sqlStr: string): Promise<void>;
    find(collection: string, queryStr?: string, options?: any): Promise<void>;
    get(collection: string, id: string): Promise<void>;
    insert(collection: string, jsonStr: string): Promise<void>;
    update(collection: string, queryStr: string, updatesStr: string): Promise<void>;
    delete(collection: string, queryStr: string): Promise<void>;
    drop(collection: string): Promise<void>;
    count(collection: string, queryStr?: string): Promise<void>;
    migrate(filePath: string): Promise<void>;
    export(collection: string, options?: any): Promise<void>;
    import(collection: string, filePath: string): Promise<void>;
};
//# sourceMappingURL=db.d.ts.map