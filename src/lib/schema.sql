
-- Employee Table
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
    "group" TEXT,
    avatar TEXT,
    signature TEXT,
    loadAllocation REAL,
    reportsTo TEXT,
    visibility_schedule INTEGER DEFAULT 1,
    visibility_onDuty INTEGER DEFAULT 1,
    visibility_orgChart INTEGER DEFAULT 1,
    visibility_mobileLoad INTEGER DEFAULT 1
);

-- Shift Table
CREATE TABLE shifts (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    label TEXT NOT NULL,
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

-- Leave Table
CREATE TABLE leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    date TEXT NOT NULL,
    isAllDay INTEGER NOT NULL,
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
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (managedBy) REFERENCES employees(id)
);

-- Note Table
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Holiday Table
CREATE TABLE holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL
);

-- Task Table
CREATE TABLE tasks (
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
    FOREIGN KEY (shiftId) REFERENCES shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (assigneeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES employees(id) ON DELETE CASCADE
);

-- Communication Allowance Table
CREATE TABLE communication_allowances (
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

-- Tardy Records Table
CREATE TABLE tardy_records (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    employeeName TEXT NOT NULL,
    date TEXT NOT NULL,
    schedule TEXT,
    timeIn TEXT,
    timeOut TEXT,
    remarks TEXT,
    UNIQUE(employeeId, date),
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE
);


-- Key-Value Store for App Settings (like SMTP, templates, etc.)
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Initial data for settings
INSERT INTO app_settings (key, value) VALUES
('groups', '["Administration","MAMS Support"]'),
('leaveTypes', '[{"type":"VL","color":"#6b7280"},{"type":"EL","color":"#ef4444"},{"type":"OFFSET","color":"#6b7280"},{"type":"SL","color":"#f97316"},{"type":"BL","color":"#14b8a6"},{"type":"PL","color":"#8b5cf6"},{"type":"ML","color":"#ec4899"},{"type":"TARDY","color":"#eab308"},{"type":"Work Extension","color":"#3b82f6"}]'),
('shiftTemplates', '[{"name":"Morning Shift (06:00-14:00)","label":"Morning Shift","startTime":"06:00","endTime":"14:00","color":"hsl(var(--chart-2))","breakStartTime":"10:00","breakEndTime":"10:30","isUnpaidBreak":false},{"name":"Late Morning Shift (07:00-15:00)","label":"Late Morning Shift","startTime":"07:00","endTime":"15:00","color":"hsl(var(--chart-2))","breakStartTime":"11:00","breakEndTime":"11:30","isUnpaidBreak":false},{"name":"Afternoon Shift (14:00-22:00)","label":"Afternoon Shift","startTime":"14:00","endTime":"22:00","color":"#3498db","breakStartTime":"18:00","breakEndTime":"18:30","isUnpaidBreak":false},{"name":"Early-Afternoon Shift (12:00-20:00)","label":"Early-Afternoon Shift","startTime":"12:00","endTime":"20:00","color":"#3498db","breakStartTime":"16:00","breakEndTime":"16:30","isUnpaidBreak":false},{"name":"Night Shift (22:00-06:00)","label":"Night Shift","startTime":"22:00","endTime":"06:00","color":"#e91e63","breakStartTime":"02:00","breakEndTime":"02:30","isUnpaidBreak":false},{"name":"Early Mid Shift (08:00-16:00)","label":"Early Mid Shift","startTime":"08:00","endTime":"16:00","color":"#ffffff","breakStartTime":"12:00","breakEndTime":"12:30","isUnpaidBreak":false},{"name":"Mid Shift (10:00-18:00)","label":"Mid Shift","startTime":"10:00","endTime":"18:00","color":"#ffffff","breakStartTime":"14:00","breakEndTime":"14:30","isUnpaidBreak":false},{"name":"Manager Shift (10:00-19:00)","label":"Manager Shift","startTime":"10:00","endTime":"19:00","color":"hsl(var(--chart-1))","breakStartTime":"14:00","breakEndTime":"15:00","isUnpaidBreak":true},{"name":"Manager Shift (11:00-20:00)","label":"Manager Shift","startTime":"11:00","endTime":"20:00","color":"hsl(var(--chart-1))","breakStartTime":"15:00","breakEndTime":"16:00","isUnpaidBreak":true},{"name":"Manager Shift (12:00-21:00)","label":"Manager Shift","startTime":"12:00","endTime":"21:00","color":"hsl(var(--chart-1))","breakStartTime":"16:00","breakEndTime":"17:00","isUnpaidBreak":true},{"name":"Probationary Shift (09:00-18:00)","label":"Probationary Shift","startTime":"09:00","endTime":"18:00","color":"hsl(var(--chart-1))","breakStartTime":"13:00","breakEndTime":"14:00","isUnpaidBreak":true}]'),
('smtpSettings', '{"host":"","port":587,"secure":true,"user":"","pass":"","fromEmail":"","fromName":""}');
