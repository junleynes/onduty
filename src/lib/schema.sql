
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT,
    position TEXT,
    role TEXT CHECK(role IN ('admin', 'manager', 'member')) NOT NULL,
    "group" TEXT,
    avatar TEXT,
    loadAllocation REAL,
    birthDate TEXT,
    startDate TEXT,
    signature TEXT,
    visibility TEXT,
    lastPromotionDate TEXT,
    reportsTo TEXT,
    FOREIGN KEY(reportsTo) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    date TEXT NOT NULL,
    color TEXT,
    isDayOff INTEGER DEFAULT 0,
    isHolidayOff INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak INTEGER DEFAULT 0,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay INTEGER DEFAULT 1,
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
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(managedBy) REFERENCES employees(id) ON DELETE SET NULL
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
    scope TEXT NOT NULL CHECK(scope IN ('personal', 'global', 'shift')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'completed')),
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
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
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
    color TEXT
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_employee_date ON shifts(employeeId, date);
CREATE INDEX IF NOT EXISTS idx_leave_employee_date ON leave(employeeId, startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_tasks_shift ON tasks(shiftId);
CREATE INDEX IF NOT EXISTS idx_allowances_employee_year_month ON communication_allowances(employeeId, year, month);

-- Default Admin User (optional, can be handled by application logic)
INSERT INTO employees (id, firstName, lastName, email, role, "group", password)
VALUES ('emp-admin-01', 'Super', 'Admin', 'admin@onduty.local', 'admin', 'Administration', 'P@ssw0rd')
ON CONFLICT(id) DO NOTHING;
