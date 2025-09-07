

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
    role TEXT NOT NULL,
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility TEXT,
    gender TEXT,
    employeeClassification TEXT,
    FOREIGN KEY (reportsTo) REFERENCES employees (id) ON DELETE SET NULL
);

-- Seed with a default admin user if the table is empty
INSERT INTO employees (id, employeeNumber, firstName, lastName, email, phone, password, position, role, "group")
SELECT 'emp-admin-01', '001', 'Super', 'Admin', 'admin@onduty.local', '123-456-7890', 'P@ssw0rd', 'System Administrator', 'admin', 'Administration'
WHERE NOT EXISTS (SELECT 1 FROM employees);


CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    date TEXT,
    color TEXT,
    isDayOff INTEGER DEFAULT 0,
    isHolidayOff INTEGER DEFAULT 0,
    status TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak INTEGER DEFAULT 0,
    FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay INTEGER NOT NULL,
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
    FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (managedBy) REFERENCES employees (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_date ON notes(date);


CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);


CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT NOT NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts (id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES employees (id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL,
    asOfDate TEXT,
    screenshot TEXT,
    UNIQUE (employeeId, year, month),
    FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY
);


CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    host TEXT,
    port INTEGER,
    secure INTEGER,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT
);

CREATE TABLE IF NOT EXISTS tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
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
    isUnpaidBreak INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);

INSERT INTO leave_types (type, color)
SELECT 'VL', '#3b82f6' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'VL');

INSERT INTO leave_types (type, color)
SELECT 'SL', '#f97316' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'SL');

INSERT INTO leave_types (type, color)
SELECT 'OFFSET', '#8b5cf6' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'OFFSET');

INSERT INTO leave_types (type, color)
SELECT 'Work Extension', '#10b981' WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE type = 'Work Extension');


CREATE TABLE IF NOT EXISTS permissions (
    role TEXT PRIMARY KEY,
    allowed_views TEXT NOT NULL
);

-- Seed default permissions
INSERT INTO permissions (role, allowed_views)
SELECT 'admin', '["my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","reports","report-work-schedule","report-attendance","report-work-extension","report-user-summary","report-tardy","report-wfh","admin","smtp-settings","permissions"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'admin');

INSERT INTO permissions (role, allowed_views)
SELECT 'manager', '["my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","reports"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'manager');

INSERT INTO permissions (role, allowed_views)
SELECT 'member', '["my-schedule","my-tasks","time-off","allowance"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'member');

