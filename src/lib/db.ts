
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
        console.log("Migration successful: Added 'gender' column to 'employees' table.");
    } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
            console.error("Error migrating 'gender' column:", e.message);
        }
    }
    
    try {
        db.exec("ALTER TABLE employees ADD COLUMN employeeClassification TEXT;");
        console.log("Migration successful: Added 'employeeClassification' column to 'employees' table.");
    } catch (e: any) {
         if (!e.message.includes('duplicate column name')) {
            console.error("Error migrating 'employeeClassification' column:", e.message);
        }
    }
    
    try {
        db.exec("ALTER TABLE employees ADD COLUMN personnelNumber TEXT;");
        console.log("Migration successful: Added 'personnelNumber' column to 'employees' table.");
    } catch (e: any) {
         if (!e.message.includes('duplicate column name')) {
            console.error("Error migrating 'personnelNumber' column:", e.message);
        }
    }
    
    // Migrations for Leave PDF feature
    const leaveColumns = [
        { name: 'dateFiled', type: 'TEXT' },
        { name: 'department', type: 'TEXT' },
        { name: 'idNumber', type: 'TEXT' },
        { name: 'contactInfo', type: 'TEXT' },
        { name: 'employeeSignature', type: 'TEXT' },
        { name: 'managerSignature', type: 'TEXT' },
        { name: 'pdfDataUri', type: 'TEXT' },
    ];
    
    leaveColumns.forEach(col => {
         try {
            db.exec(`ALTER TABLE leave ADD COLUMN ${col.name} ${col.type};`);
            console.log(`Migration successful: Added '${col.name}' column to 'leave' table.`);
        } catch (e: any) {
             if (!e.message.includes('duplicate column name')) {
                console.error(`Error migrating '${col.name}' column:`, e.message);
            }
        }
    });


    return db;
}

export function getDb() {
  if (!dbInstance || !dbInstance.open) {
    if (dbInstance && !dbInstance.open) {
        console.log('Database connection was closed. Re-initializing.');
    }
      
    console.log(`Connecting to database at ${DB_PATH}`);
    try {
        dbInstance = initializeDatabase();
    } catch(error: any) {
        if (error.code === 'SQLITE_CORRUPT' || error.message.includes('malformed') || error.message.includes('not a database')) {
            console.error(`Database file at ${DB_PATH} is corrupted. Deleting and re-initializing.`, error);
            if (dbInstance && dbInstance.open) {
                dbInstance.close();
            }
            try {
                fs.unlinkSync(DB_PATH);
                const shmPath = `${DB_PATH}-shm`;
                if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
                const walPath = `${DB_PATH}-wal`;
                if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
                console.log('Corrupted database file deleted.');
            } catch (unlinkError) {
                console.error('Failed to delete corrupted database file:', unlinkError);
                throw unlinkError; // If we can't delete it, we can't continue.
            }
            // Retry initialization
            dbInstance = initializeDatabase();
        } else {
            // Re-throw other errors
            throw error;
        }
    }

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
