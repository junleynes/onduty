
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import initialDb from './db.json';

const DB_FILE = 'local.db';

// In a serverless environment, the filesystem is not guaranteed to be persistent.
// We check if the db exists, if not, we create it from the schema.
const dbExists = fs.existsSync(DB_FILE);

export const db = new Database(DB_FILE);

const runMigrations = () => {
    try {
        console.log("Running database migrations if needed...");
        // Migration for key_value_store table
        const checkKeyValueStore = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='key_value_store'").get();
        if (!checkKeyValueStore) {
             console.log("`key_value_store` table not found. Creating it.");
             db.exec("CREATE TABLE IF NOT EXISTS key_value_store (key TEXT PRIMARY KEY, value TEXT)");
             console.log("`key_value_store` table created successfully.");
        }

        // Migration for visibility column in employees table
        const columns = db.prepare("PRAGMA table_info(employees)").all();
        const hasVisibilityColumn = columns.some((col: any) => col.name === 'visibility');

        if (!hasVisibilityColumn) {
            console.log("`visibility` column not found in `employees` table. Adding it.");
            db.exec("ALTER TABLE employees ADD COLUMN visibility TEXT");
            
            const defaultVisibility = JSON.stringify({
                schedule: true,
                onDuty: true,
                orgChart: true,
                mobileLoad: true,
            });
            db.prepare("UPDATE employees SET visibility = ?").run(defaultVisibility);
            console.log("`visibility` column added and populated with default values.");
        }
        console.log("Migrations check complete.");

    } catch(e) {
        console.error("Error during database migration check:", e);
    }
}

if (!dbExists) {
  console.log('No database found, creating a new one.');
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database schema loaded.');

  // Seed the database with initial data
  console.log('Seeding database with initial data...');
  try {
    const insertEmployee = db.prepare('INSERT INTO employees (id, employeeNumber, firstName, lastName, email, phone, password, position, role, "group", avatar, loadAllocation, reportsTo, birthDate, startDate, signature, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertGroup = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const insertSmtpSettings = db.prepare('INSERT INTO smtp_settings (id, host, port, secure, user, pass, fromEmail, fromName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    db.transaction(() => {
        // Seed Employees
        initialDb.employees.forEach(emp => {
            const visibility = (emp as any).visibility || { schedule: true, onDuty: true, orgChart: true, mobileLoad: true };
            insertEmployee.run(
                emp.id,
                emp.employeeNumber,
                emp.firstName,
                emp.lastName,
                emp.email,
                emp.phone,
                emp.password,
                emp.position,
                emp.role,
                emp.group,
                emp.avatar,
                (emp as any).loadAllocation,
                (emp as any).reportsTo,
                (emp as any).birthDate,
                (emp as any).startDate,
                (emp as any).signature,
                JSON.stringify(visibility)
            );
        });

        // Seed Groups
        initialDb.groups.forEach(group => {
            insertGroup.run(group);
        });
        
        // Seed SMTP Settings
        if (initialDb.smtpSettings) {
            insertSmtpSettings.run(1, initialDb.smtpSettings.host, initialDb.smtpSettings.port, initialDb.smtpSettings.secure ? 1 : 0, initialDb.smtpSettings.user, initialDb.smtpSettings.pass, initialDb.smtpSettings.fromEmail, initialDb.smtpSettings.fromName);
        }

    })();
    
    console.log('Database seeded successfully.');
  } catch(error) {
    console.error('Failed to seed database:', error);
  }

} else {
    console.log('Connected to existing database.');
    runMigrations();
}

// Gracefully close the database connection on exit
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
