-- Base Schema for OnDuty Application

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    birthDate TEXT,
    startDate TEXT,
    lastPromotionDate TEXT,
    position TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'member')),
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility TEXT,
    FOREIGN KEY ("group") REFERENCES groups(name) ON DELETE SET NULL,
    FOREIGN KEY (reportsTo) REFERENCES employees(id) ON DELETE SET NULL
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
    status TEXT,
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
    isAllDay BOOLEAN DEFAULT 1,
    startTime TEXT,
    endTime TEXT,
    status TEXT NOT NULL,
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
    date TEXT NOT NULL,
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
    scope TEXT NOT NULL CHECK(scope IN ('personal', 'global', 'shift')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
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
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT
);


CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    host TEXT,
    port INTEGER,
    secure BOOLEAN,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT NOT NULL,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    role TEXT PRIMARY KEY CHECK(role IN ('admin', 'manager', 'member')),
    allowed_views TEXT NOT NULL
);

-- Default Data
INSERT OR IGNORE INTO groups (name) VALUES ('Administration'), ('Default Group');
INSERT OR IGNORE INTO employees (id, firstName, lastName, email, password, role, "group") VALUES ('emp-admin-01', 'Super', 'Admin', 'admin@onduty.local', 'P@ssw0rd', 'admin', 'Administration');

INSERT OR IGNORE INTO leave_types (type, color) VALUES ('VL', '#3b82f6'), ('SL', '#f97316'), ('Work Extension', '#8b5cf6'), ('TARDY', '#ef4444');

-- Default Permissions
INSERT OR IGNORE INTO permissions (role, allowed_views) VALUES 
('admin', '["admin","smtp-settings","permissions"]'),
('member', '["my-schedule","my-tasks","schedule","onduty","time-off","allowance","team","org-chart","celebrations","holidays","reports"]'),
('manager', '["my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","reports"]');
