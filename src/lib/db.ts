import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// In a serverless environment, the filesystem can be read-only, except for the /tmp directory.
// We will work with a copy of the database in the /tmp directory.
const DB_SOURCE_PATH = path.join(process.cwd(), 'src', 'lib', 'seed.db');
const DB_PATH = process.env.NODE_ENV === 'development' ? DB_SOURCE_PATH : path.join('/tmp', 'local.db');


/**
 * Copies the seed database to the temporary writable directory if it doesn't exist.
 * This function is called when the database is first requested.
 */
function initializeDatabase() {
  if (process.env.NODE_ENV !== 'development' && !fs.existsSync(DB_PATH)) {
    console.log(`No database found at ${DB_PATH}. Copying seed database...`);
    try {
      const dbSource = fs.readFileSync(DB_SOURCE_PATH);
      fs.writeFileSync(DB_PATH, dbSource);
      console.log('Database successfully copied to /tmp/local.db');
    } catch (error) {
        console.error('Failed to copy seed database:', error);
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