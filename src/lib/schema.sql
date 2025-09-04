
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
    visibility TEXT,
    FOREIGN KEY(reportsTo) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    date TEXT NOT NULL,
    color TEXT,
    isDayOff BOOLEAN DEFAULT 0,
    isHolidayOff BOOLEAN DEFAULT 0,
    status TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL,
    isAllDay BOOLEAN DEFAULT 1,
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
    date TEXT NOT NULL UNIQUE,
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
    secure BOOLEAN,
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
    PRIMARY KEY (employeeId, date)
);

CREATE TABLE IF NOT EXISTS shift_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT,
    breakStartTime TEXT,
    breakEndTime TEXT,
    isUnpaidBreak BOOLEAN DEFAULT 0
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT
);

CREATE TABLE IF NOT EXISTS key_value_store (
    key TEXT PRIMARY KEY,
    value TEXT
);


-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_employeeId_date ON shifts(employeeId, date);
CREATE INDEX IF NOT EXISTS idx_leave_employeeId_dates ON leave(employeeId, startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_tasks_shiftId ON tasks(shiftId);
CREATE INDEX IF NOT EXISTS idx_tasks_assigneeId ON tasks(assigneeId);


-- Create Triggers for data integrity
CREATE TRIGGER IF NOT EXISTS delete_employee_cleanup_trigger
AFTER DELETE ON employees
FOR EACH ROW
BEGIN
    -- This trigger is now mostly redundant due to ON DELETE CASCADE,
    -- but can be kept for explicit clarity or extended for logging.
    -- Example: INSERT INTO audit_log (action, details) VALUES ('delete_employee', OLD.id);
    DELETE FROM leave WHERE employeeId = OLD.id;
    DELETE FROM shifts WHERE employeeId = OLD.id;
    DELETE FROM tasks WHERE assigneeId = OLD.id OR createdBy = OLD.id;
    DELETE FROM communication_allowances WHERE employeeId = OLD.id;
END;


-- Seed initial data if tables are empty
INSERT OR IGNORE INTO groups (name) VALUES ('Default Group');

INSERT OR IGNORE INTO leave_types (type, color) VALUES 
('VL', '#3b82f6'), ('SL', '#f97316'), ('EL', '#ef4444'), ('WFH', '#14b8a6'), ('TARDY', '#eab308'), ('Work Extension', '#9b59b6');

INSERT OR IGNORE INTO shift_templates (id, name, label, startTime, endTime, color, breakStartTime, breakEndTime, isUnpaidBreak) VALUES
('tpl-1', 'Morning Shift (08:00-17:00)', 'Morning Shift', '08:00', '17:00', 'hsl(var(--chart-2))', '12:00', '13:00', 1),
('tpl-2', 'Mid Shift (13:00-22:00)', 'Mid Shift', '13:00', '22:00', 'hsl(var(--chart-4))', '17:00', '18:00', 1),
('tpl-3', 'Night Shift (22:00-07:00)', 'Night Shift', '22:00', '07:00', 'hsl(var(--chart-3))', '02:00', '03:00', 1),
('tpl-4', 'Manager Shift (09:00-18:00)', 'Manager Shift', '09:00', '18:00', 'hsl(var(--chart-1))', '12:00', '13:00', 0);

