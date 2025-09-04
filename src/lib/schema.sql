

CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeNumber TEXT UNIQUE,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    middleInitial TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT,
    position TEXT,
    role TEXT NOT NULL,
    "group" TEXT,
    avatar TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    birthDate TEXT,
    startDate TEXT,
    signature TEXT,
    visibility TEXT,
    lastPromotionDate TEXT,
    FOREIGN KEY(reportsTo) REFERENCES employees(id) ON DELETE SET NULL
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
    status TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
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
    status TEXT,
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
    date TEXT NOT NULL,
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
  scope TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  completedAt TEXT,
  dueDate TEXT,
  createdBy TEXT,
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
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
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


CREATE INDEX IF NOT EXISTS idx_shifts_employeeId_date ON shifts(employeeId, date);
CREATE INDEX IF NOT EXISTS idx_leave_employeeId_date ON leave(employeeId, startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_tasks_shiftId ON tasks(shiftId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigneeId ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_allowances_employee_period ON communication_allowances(employeeId, year, month);

