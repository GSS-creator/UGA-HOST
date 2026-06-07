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
export declare const dbCommand: {
    info(): Promise<void>;
    collections(): Promise<void>;
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