
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// This will create the database file in the root of your project.
// The .gitignore file will prevent it from being committed.
const DB_PATH = path.join(process.cwd(), 'local.db');

export let dbInstance: Database.Database | null = null;

function initializeDatabase() {
    const db = new Database(DB_PATH);

    const requiredTables = [
        'employees', 'shifts', 'leave', 'notes', 'holidays', 'tasks',
        'communication_allowances', 'groups', 'smtp_settings',
        'tardy_records', 'key_value_store', 'shift_templates', 'leave_types',
        'permissions'
    ];

    let allTablesExist = true;
    const checkStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");

    for (const table of requiredTables) {
        if (!checkStmt.get(table)) {
            allTablesExist = false;
            break;
        }
    }
    
    // Also check for a key column in the 'leave' table to ensure schema is updated.
    let leaveTableIsCorrect = false;
    if (allTablesExist) {
        try {
            const columns = db.prepare("PRAGMA table_info(leave)").all();
            if (columns.some((col: any) => col.name === 'startDate')) {
                leaveTableIsCorrect = true;
            }
        } catch (e) {
            // Table might not exist, which is handled by allTablesExist
        }
    }

    if (!allTablesExist || !leaveTableIsCorrect) {
        console.log('One or more database tables are missing or outdated. Applying schema...');
        const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            try {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                db.exec(schema);
                console.log('Database schema applied successfully.');
            } catch(e) {
                console.error('Failed to initialize database from schema:', e);
                throw e;
            }
        } else {
             console.error(`CRITICAL: Schema file not found at ${schemaPath}. Cannot initialize database.`);
             throw new Error(`Schema file not found at ${schemaPath}`);
        }
    }
    
    return db;
}

export function getDb() {
  if (!dbInstance || !dbInstance.open) {
    if (dbInstance && !dbInstance.open) {
        console.log('Database connection was closed. Re-initializing.');
    }
      
    console.log(`Connecting to database at ${DB_PATH}`);
    dbInstance = initializeDatabase();

    process.on('exit', () => {
        if (dbInstance && dbInstance.open) {
            console.log('Closing database connection.');
            dbInstance.close();
        }
    });
    process.on('SIGHUP', () => process.exit(128 + 1));
    process.on('SIGINT', () => process.exit(128 + 2));
    process.on('SIGTERM', () => process.exit(128 + 15));

  }
  return dbInstance;
}

export const db = getDb();
