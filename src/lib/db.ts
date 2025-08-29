import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_FILE = 'local.db';

// In a serverless environment, the filesystem is not guaranteed to be persistent.
// We check if the db exists, if not, we create it from the schema.
const dbExists = fs.existsSync(DB_FILE);

export const db = new Database(DB_FILE);

if (!dbExists) {
  console.log('No database found, creating a new one.');
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema loaded.');

  // Optional: Seed the database with initial data if needed
  // const seedPath = path.join(process.cwd(), 'src', 'lib', 'seed.sql');
  // const seed = fs.readFileSync(seedPath, 'utf-8');
  // db.exec(seed);
  // console.log('Database seeded with initial data.');
} else {
    console.log('Connected to existing database.');
}

// Gracefully close the database connection on exit
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
