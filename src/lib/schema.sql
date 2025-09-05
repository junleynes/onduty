
-- This file defines the database schema.
-- It is used to initialize a new SQLite database.

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT,
    birthDate TEXT,
    startDate TEXT,
    lastPromotionDate TEXT,
    position TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'member')) NOT NULL DEFAULT 'member',
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility TEXT -- JSON object for app visibility toggles
);

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
    status TEXT CHECK(status IN ('draft', 'published')) DEFAULT 'draft',
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay BOOLEAN NOT NULL DEFAULT 1,
    startTime TEXT,
    endTime TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reason TEXT,
    requestedAt TEXT,
    managedBy TEXT,
    managedAt TEXT,
    originalShiftDate TEXT,
    originalStartTime TEXT,
    originalEndTime TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (managedBy) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT CHECK(scope IN ('personal', 'global', 'shift')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('pending', 'completed')) NOT NULL DEFAULT 'pending',
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT NOT NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL,
    asOfDate TEXT,
    screenshot TEXT,
    UNIQUE(employeeId, year, month),
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT,
    employeeName TEXT,
    date TEXT,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT
);


-- Initial Data (optional, for seeding)
INSERT OR IGNORE INTO leave_types (type, color) VALUES ('VL', '#3b82f6');
INSERT OR IGNORE INTO leave_types (type, color) VALUES ('SL', '#f97316');
INSERT OR IGNORE INTO leave_types (type, color) VALUES ('EL', '#8b5cf6');
INSERT OR IGNORE INTO leave_types (type, color) VALUES ('Work Extension', '#10b981');
INSERT OR IGNORE INTO leave_types (type, color) VALUES ('TARDY', '#ef4444');

-- Create an index on dates for faster lookups
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave(startDate, endDate);
