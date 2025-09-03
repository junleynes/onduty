
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT,
    firstName TEXT,
    lastName TEXT,
    middleInitial TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    position TEXT,
    role TEXT,
    "group" TEXT,
    avatar TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    birthDate TEXT,
    startDate TEXT,
    lastPromotionDate TEXT,
    signature TEXT,
    visibility TEXT
);

CREATE TABLE shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    date TEXT,
    color TEXT,
    isDayOff INTEGER,
    isHolidayOff INTEGER,
    status TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak INTEGER
);

CREATE TABLE leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    type TEXT,
    color TEXT,
    date TEXT,
    isAllDay INTEGER,
    startTime TEXT,
    endTime TEXT,
    status TEXT,
    reason TEXT,
    requestedAt TEXT,
    managedBy TEXT,
    managedAt TEXT,
    originalShiftDate TEXT,
    originalStartTime TEXT,
    originalEndTime TEXT
);

CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    date TEXT,
    title TEXT,
    description TEXT
);

CREATE TABLE holidays (
    id TEXT PRIMARY KEY,
    date TEXT,
    title TEXT
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT,
    title TEXT,
    description TEXT,
    status TEXT,
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT
);

CREATE TABLE communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    year INTEGER,
    month INTEGER,
    balance REAL,
    asOfDate TEXT,
    screenshot TEXT
);

CREATE TABLE groups (
    name TEXT PRIMARY KEY
);

INSERT INTO groups (name) VALUES ('Administration');

CREATE TABLE smtp_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    host TEXT,
    port INTEGER,
    secure INTEGER,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT
);

CREATE TABLE tardy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT,
    employeeName TEXT,
    date TEXT,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT
);

CREATE TABLE key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);
