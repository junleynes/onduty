

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
    role TEXT NOT NULL,
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility TEXT
);
CREATE INDEX IF NOT EXISTS idx_employees_group ON employees("group");
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);


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
    status TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak INTEGER DEFAULT 0,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shifts_employeeId_date ON shifts(employeeId, date);


CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    requestId TEXT,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    date TEXT NOT NULL,
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
    originalEndTime TEXT,
    startDate TEXT,
    endDate TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_leave_employeeId_date ON leave(employeeId, date);


CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date);


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


CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    startTime TEXT,
    endTime TEXT,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak INTEGER
);


CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);


-- Triggers
CREATE TRIGGER IF NOT EXISTS delete_employee_cleanup_trigger
AFTER DELETE ON employees
FOR EACH ROW
BEGIN
    DELETE FROM shifts WHERE employeeId = OLD.id;
    DELETE FROM leave WHERE employeeId = OLD.id;
    DELETE FROM tasks WHERE assigneeId = OLD.id OR createdBy = OLD.id;
    DELETE FROM communication_allowances WHERE employeeId = OLD.id;
END;


CREATE TRIGGER IF NOT EXISTS update_employee_leave_trigger
AFTER UPDATE OF "group" ON employees
FOR EACH ROW
WHEN NEW."group" != OLD."group"
BEGIN
    DELETE FROM leave WHERE employeeId = NEW.id AND date(startDate) > date('now');
END;

