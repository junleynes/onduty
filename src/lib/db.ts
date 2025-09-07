
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// This will create the database file in the root of your project.
// The .gitignore file will prevent it from being committed.
const DB_PATH = path.join(process.cwd(), 'local.db');

export let dbInstance: Database.Database | null = null;

function initializeDatabase() {
    const db = new Database(DB_PATH);

    // Run schema to create tables if they don't exist
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        try {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema);
        } catch(e) {
            console.error('Failed to initialize database from schema:', e);
            throw e;
        }
    } else {
            console.error(`CRITICAL: Schema file not found at ${schemaPath}. Cannot initialize database.`);
            throw new Error(`Schema file not found at ${schemaPath}`);
    }

    // Run migrations to add new columns if they don't exist
    try {
        db.exec("ALTER TABLE employees ADD COLUMN gender TEXT;");
        console.log("Column 'gender' added to 'employees' table.");
    } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
            console.error("Error adding 'gender' column:", e);
        }
    }
    
    try {
        db.exec("ALTER TABLE employees ADD COLUMN employeeClassification TEXT;");
        console.log("Column 'employeeClassification' added to 'employees' table.");
    } catch (e: any) {
         if (!e.message.includes('duplicate column name')) {
            console.error("Error adding 'employeeClassification' column:", e);
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
