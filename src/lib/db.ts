
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// In a serverless environment, the filesystem can be read-only, except for the /tmp directory.
// We will work with a copy of the database in the /tmp directory.
const DB_PATH = process.env.NODE_ENV === 'development' ? path.join(process.cwd(), 'src', 'lib', 'local.db') : path.join('/tmp', 'local.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src', 'lib', 'schema.sql');


/**
 * Initializes a new database from the schema if one doesn't exist.
 */
function initializeDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    console.log(`No database found at ${DB_PATH}. Creating a new one from schema...`);
    try {
      const db = new Database(DB_PATH);
      const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schema);
      console.log('Database successfully created and schema applied.');
      db.close();
    } catch (error) {
        console.error('Failed to initialize database from schema:', error);
        // If we can't create the DB, we can't run the app.
        process.exit(1);
    }
  }
}

// Initialize the database on module load.
initializeDatabase();

export const db = new Database(DB_PATH);
console.log(`Connected to database at ${DB_PATH}`);


// Gracefully close the database connection on exit
process.on('exit', () => {
    if (db && db.open) {
        console.log('Closing database connection.');
        db.close();
    }
});
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
