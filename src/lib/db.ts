
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.NODE_ENV === 'development' 
    ? path.join(process.cwd(), 'src', 'lib', 'local.db') 
    : path.join('/tmp', 'local.db');

let dbInstance: Database.Database | null = null;

function initializeDatabase() {
    const db = new Database(DB_PATH);
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
        try {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema);
            console.log('Database successfully initialized from schema.');
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
    if (process.env.NODE_ENV !== 'development' && fs.existsSync(DB_PATH)) {
        // In a deployed environment, always start fresh from schema if not the first launch
        // to avoid issues with stale/restored temporary files.
        // For this specific environment, we'll just delete to ensure it gets recreated.
        fs.unlinkSync(DB_PATH);
    }
    if (!fs.existsSync(DB_PATH)) {
      console.log('Database file does not exist, initializing...');
      dbInstance = initializeDatabase();
    } else {
      dbInstance = new Database(DB_PATH);
    }

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
