
-- schema.sql

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT UNIQUE,
    personnelNumber TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT,
    birthDate TEXT,
    startDate TEXT,
    lastPromotionDate TEXT,
    position TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'member')) NOT NULL,
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL DEFAULT 0,
    reportsTo TEXT,
    visibility TEXT,
    gender TEXT,
    employeeClassification TEXT
);

-- Ensure the Super Admin user exists
INSERT OR IGNORE INTO employees (id, employeeNumber, firstName, lastName, email, phone, position, role, "group", password)
VALUES ('emp-admin-01', '001', 'Super', 'Admin', 'admin@onduty.local', '123-456-7890', 'System Administrator', 'admin', 'Administration', 'P@ssw0rd');


-- Shifts Table
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
    status TEXT CHECK(status IN ('draft', 'published')),
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Leave Table
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
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL,
    reason TEXT,
    requestedAt TEXT,
    managedBy TEXT,
    managedAt TEXT,
    originalShiftDate TEXT,
    originalStartTime TEXT,
    originalEndTime TEXT,
    dateFiled TEXT,
    department TEXT,
    idNumber TEXT,
    contactInfo TEXT,
    employeeSignature TEXT,
    managerSignature TEXT,
    pdfDataUri TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (managedBy) REFERENCES employees(id) ON DELETE SET NULL
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT CHECK(scope IN ('personal', 'global', 'shift')) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('pending', 'completed')) NOT NULL,
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT NOT NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees(id) ON DELETE CASCADE
);

-- Communication Allowances Table
CREATE TABLE IF NOT EXISTS communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL NOT NULL,
    asOfDate TEXT,
    screenshot TEXT,
    UNIQUE(employeeId, year, month),
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- SMTP Settings Table
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

-- Shift Templates Table
CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE
);

-- Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT
);

-- Tardy Records Table
CREATE TABLE IF NOT EXISTS tardy_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId TEXT,
  employeeName TEXT,
  date TEXT NOT NULL,
  schedule TEXT,
  timeIn TEXT,
  timeOut TEXT,
  remarks TEXT,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
);

-- Key-Value Store for Templates etc.
CREATE TABLE IF NOT EXISTS key_value_store (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    role TEXT PRIMARY KEY,
    allowed_views TEXT
);

INSERT OR IGNORE INTO permissions (role, allowed_views) VALUES 
('admin', '["admin","smtp-settings","permissions","danger-zone"]'),
('manager', '["dashboard","my-schedule","my-tasks","schedule","onduty","time-off","allowance","task-manager","team","org-chart","celebrations","holidays","reports","faq","report-work-schedule","report-attendance","report-user-summary","report-tardy","report-wfh","report-work-extension","report-overtime"]'),
('member', '["dashboard","my-schedule","my-tasks","onduty","time-off","allowance","team","org-chart","celebrations","holidays","faq","reports","report-wfh"]');

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

