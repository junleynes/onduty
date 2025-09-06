
-- This schema is intended to be idempotent.
-- Using `CREATE TABLE IF NOT EXISTS` ensures that this script can be run multiple times
-- without causing errors, which is useful for initial setup and testing.

-- Employee table to store user information
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT UNIQUE,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    position TEXT,
    role TEXT NOT NULL DEFAULT 'member', -- admin, manager, member
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL DEFAULT 0,
    birthDate TEXT,
    startDate TEXT,
    lastPromotionDate TEXT,
    visibility TEXT, -- JSON object for app visibility settings
    reportsTo TEXT,
    FOREIGN KEY(reportsTo) REFERENCES employees(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_group ON employees("group");


-- Groups table for team organization
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);


-- Shifts table for scheduling
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    date TEXT NOT NULL,
    color TEXT,
    isDayOff BOOLEAN DEFAULT 0,
    isHolidayOff BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, published
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shifts_employeeId_date ON shifts(employeeId, date);


-- Leave table for time off requests
CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay BOOLEAN DEFAULT 1,
    startTime TEXT,
    endTime TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    reason TEXT,
    requestedAt TEXT,
    managedBy TEXT,
    managedAt TEXT,
    originalShiftDate TEXT,
    originalStartTime TEXT,
    originalEndTime TEXT,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(managedBy) REFERENCES employees(id) ON DELETE SET NULL
);


-- Notes table for daily annotations
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT
);


-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
);


-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT NOT NULL, -- personal, global, shift
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT NOT NULL,
    FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY(assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(createdBy) REFERENCES employees(id) ON DELETE CASCADE
);


-- Communication Allowances table
CREATE TABLE IF NOT EXISTS communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL NOT NULL,
    asOfDate TEXT,
    screenshot TEXT,
    UNIQUE(employeeId, year, month),
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);


-- SMTP Settings table (singleton)
CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    host TEXT,
    port INTEGER,
    secure BOOLEAN,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT
);


-- Tardy Records table
CREATE TABLE IF NOT EXISTS tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    UNIQUE(employeeId, date)
);


-- Shift Templates table
CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0
);


-- Leave Types table
CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);


-- Key-Value Store for general purpose data like templates
CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Pre-populate default leave types if the table is empty
INSERT INTO leave_types (type, color)
SELECT 'VL', '#3b82f6' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'VL');

INSERT INTO leave_types (type, color)
SELECT 'SL', '#f97316' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'SL');

INSERT INTO leave_types (type, color)
SELECT 'EL', '#ef4444' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'EL');

INSERT INTO leave_types (type, color)
SELECT 'TARDY', '#facc15' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'TARDY');

INSERT INTO leave_types (type, color)
SELECT 'Work Extension', '#a855f7' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'Work Extension');
