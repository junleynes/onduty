
-- src/lib/schema.sql

CREATE TABLE employees (
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
  position TEXT,
  role TEXT NOT NULL,
  groupName TEXT, -- Renamed from 'group' to avoid SQL keyword conflict
  avatar TEXT,
  signature TEXT,
  loadAllocation REAL,
  reportsTo TEXT,
  visibility TEXT
);

CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  employeeId TEXT,
  label TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  date TEXT NOT NULL,
  color TEXT,
  isDayOff BOOLEAN DEFAULT 0,
  isHolidayOff BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'draft',
  breakStartTime TEXT,
  breakEndTime TEXT,
  isUnpaidBreak BOOLEAN DEFAULT 0,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE leave (
  id TEXT PRIMARY KEY,
  employeeId TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  date TEXT NOT NULL,
  isAllDay BOOLEAN NOT NULL,
  startTime TEXT,
  endTime TEXT,
  status TEXT DEFAULT 'pending',
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

CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    shiftId TEXT,
    assigneeId TEXT,
    scope TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    completedAt TEXT,
    dueDate TEXT,
    createdBy TEXT NOT NULL,
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE communication_allowances (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    balance REAL NOT NULL,
    asOfDate TEXT,
    screenshot TEXT,
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE groups (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE shift_templates (
    name TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0
);

CREATE TABLE leave_types (
    type TEXT PRIMARY KEY NOT NULL,
    color TEXT
);

CREATE TABLE smtp_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce a single row
    host TEXT,
    port INTEGER,
    secure BOOLEAN,
    user TEXT,
    pass TEXT,
    fromEmail TEXT,
    fromName TEXT
);
