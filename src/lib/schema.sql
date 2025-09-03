
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT UNIQUE,
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
    FOREIGN KEY (reportsTo) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    date TEXT,
    color TEXT,
    isDayOff BOOLEAN DEFAULT FALSE,
    isHolidayOff BOOLEAN DEFAULT FALSE,
    status TEXT CHECK(status IN ('draft', 'published')),
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT,
    color TEXT,
    date TEXT,
    isAllDay BOOLEAN,
    startTime TEXT,
    endTime TEXT,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
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
    FOREIGN KEY (assigneeId) REFERENCES employees(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS groups (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS smtp_settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
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
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);
