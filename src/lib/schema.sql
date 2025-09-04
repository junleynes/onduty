
-- Employees Table
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
    role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'member')),
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility TEXT,
    FOREIGN KEY (reportsTo) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY ("group") REFERENCES groups(name) ON DELETE SET NULL
);

-- Shifts Table
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
    status TEXT CHECK(status IN ('draft', 'published')),
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Leave Table
CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    requestId TEXT,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    date TEXT NOT NULL,
    isAllDay BOOLEAN NOT NULL,
    startTime TEXT,
    endTime TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    requestedAt TEXT,
    managedBy TEXT,
    managedAt TEXT,
    originalShiftDate TEXT,
    originalStartTime TEXT,
    originalEndTime TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
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
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
);

-- Tasks Table
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

-- Communication Allowances Table
CREATE TABLE IF NOT EXISTS communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL NOT NULL,
    asOfDate TEXT,
    screenshot TEXT,
    UNIQUE (employeeId, year, month),
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY
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

-- Tardy Records Table (for CSV imports)
CREATE TABLE IF NOT EXISTS tardy_records (
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    PRIMARY KEY (employeeId, date),
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

-- Shift Templates Table
CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT NOT NULL,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0
);

-- Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);

-- Key-Value Store for general purpose storage (like templates)
CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Create Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_shifts_employeeId_date ON shifts(employeeId, date);
CREATE INDEX IF NOT EXISTS idx_leave_employeeId_date ON leave(employeeId, date);
CREATE INDEX IF NOT EXISTS idx_tasks_shiftId ON tasks(shiftId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigneeId ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
