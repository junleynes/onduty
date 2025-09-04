
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.NODE_ENV === 'development' 
    ? path.join(process.cwd(), 'src', 'lib', 'local.db') 
    : path.join('/tmp', 'local.db');

let dbInstance: Database.Database | null = null;

function initializeDatabase() {
    // In development, force a clean state by deleting the old DB file.
    // This ensures schema changes are always applied to a fresh database.
    if (process.env.NODE_ENV === 'development' && fs.existsSync(DB_PATH)) {
        console.log('Development environment detected. Deleting old database file to ensure a clean state.');
        fs.unlinkSync(DB_PATH);
    }

    const db = new Database(DB_PATH);
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        try {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema);
            console.log('Database schema applied successfully.');
        } catch(e) {
            console.error('Failed to initialize database from schema:', e);
            throw e; // re-throw the error to fail startup
        }
    } else {
        console.warn(`Schema file not found at ${schemaPath}. Starting with an empty database.`);
    }
    return db;
}

export function getDb() {
  if (!dbInstance) {
    console.log(`Connecting to database at ${DB_PATH}`);
    dbInstance = initializeDatabase();

    // Gracefully close the database connection on exit
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

// For convenience, you can still export a direct db object.
// The getDb() function will ensure it is initialized on first access.
export const db = getDb();
