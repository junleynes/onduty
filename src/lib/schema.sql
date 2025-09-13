
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT,
    birthDate TEXT,
    startDate TEXT,
    position TEXT,
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'member')),
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    visibility TEXT,
    lastPromotionDate TEXT,
    reportsTo TEXT,
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
    isDayOff BOOLEAN DEFAULT FALSE,
    isHolidayOff BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'draft',
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay BOOLEAN DEFAULT TRUE,
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
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  shiftId TEXT,
  assigneeId TEXT,
  scope TEXT NOT NULL CHECK(scope IN ('personal', 'global', 'shift')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  completedAt TEXT,
  dueDate TEXT,
  createdBy TEXT NOT NULL,
  FOREIGN KEY(shiftId) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY(assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY(createdBy) REFERENCES employees(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT NOT NULL,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS permissions (
    role TEXT PRIMARY KEY,
    allowed_views TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Seed initial data if tables are empty --

-- Default Admin User (if no users exist)
INSERT INTO employees (id, employeeNumber, firstName, lastName, email, phone, position, role, "group", password)
SELECT 'emp-admin-01', '001', 'Super', 'Admin', 'admin@onduty.local', '123-456-7890', 'System Administrator', 'admin', 'Administration', 'P@ssw0rd'
WHERE NOT EXISTS (SELECT 1 FROM employees);

-- Default Groups
INSERT INTO groups (name) SELECT 'Administration' WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Administration');

-- Default Permissions
INSERT INTO permissions (role, allowed_views) 
SELECT 'admin', '["dashboard","my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","faq","reports","report-work-schedule","report-attendance","report-work-extension","report-overtime","report-user-summary","report-tardy","report-wfh","admin","smtp-settings","permissions","danger-zone"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'admin');

INSERT INTO permissions (role, allowed_views) 
SELECT 'manager', '["dashboard","my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","faq","reports","report-work-schedule","report-attendance","report-work-extension","report-overtime","report-user-summary","report-tardy","report-wfh"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'manager');

INSERT INTO permissions (role, allowed_views) 
SELECT 'member', '["dashboard","my-schedule","my-tasks","onduty","time-off","allowance","team","org-chart","celebrations","holidays","faq","reports","report-wfh"]'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE role = 'member');
