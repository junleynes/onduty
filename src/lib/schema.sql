-- Base schema for the ShiftMaster application

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
    position TEXT,
    role TEXT NOT NULL,
    "group" TEXT,
    avatar TEXT
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
    status TEXT DEFAULT 'draft',
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave (
    id TEXT PRIMARY KEY,
    employeeId TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT,
    date TEXT NOT NULL,
    isAllDay BOOLEAN NOT NULL,
    startTime TEXT,
    endTime TEXT,
    FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_groups (
    name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS shift_templates (
    name TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leave_types (
    type TEXT PRIMARY KEY,
    color TEXT NOT NULL
);


-- Seed initial data from db.json
INSERT INTO employees (id, employeeNumber, firstName, lastName, email, phone, password, position, role, "group", avatar) VALUES
('emp-admin-01', '001', 'Super', 'Admin', 'admin@shiftmaster.local', '123-456-7890', 'password', 'System Administrator', 'admin', 'Administration', '');

INSERT INTO app_groups (name) VALUES
('Administration'),
('Cashiers'),
('Chefs'),
('Baristas');

INSERT INTO shift_templates (name, label, startTime, endTime, color) VALUES
('Morning Shift (06:00-14:00)', 'Morning Shift', '06:00', '14:00', 'hsl(var(--chart-2))'),
('Late Morning Shift (07:00-15:00)', 'Late Morning Shift', '07:00', '15:00', 'hsl(var(--chart-2))'),
('Afternoon Shift (14:00-22:00)', 'Afternoon Shift', '14:00', '22:00', '#3498db'),
('Early-Afternoon Shift (12:00-20:00)', 'Early-Afternoon Shift', '12:00', '20:00', '#3498db'),
('Night Shift (22:00-06:00)', 'Night Shift', '22:00', '06:00', '#e91e63'),
('Early Mid Shift (08:00-16:00)', 'Early Mid Shift', '08:00', '16:00', '#ffffff'),
('Mid Shift (10:00-18:00)', 'Mid Shift', '10:00', '18:00', '#ffffff'),
('Manager Shift (10:00-19:00)', 'Manager Shift', '10:00', '19:00', 'hsl(var(--chart-1))'),
('Manager Shift (11:00-20:00)', 'Manager Shift', '11:00', '20:00', 'hsl(var(--chart-1))'),
('Manager Shift (12:00-21:00)', 'Manager Shift', '12:00', '21:00', 'hsl(var(--chart-1))'),
('Probationary Shift (09:00-18:00)', 'Probationary Shift', '09:00', '18:00', 'hsl(var(--chart-1))');

INSERT INTO leave_types (type, color) VALUES
('VL', '#6b7280'),
('EL', '#ef4444'),
('OFFSET', '#6b7280'),
('SL', '#f97316'),
('BL', '#14b8a6'),
('PL', '#8b5cf6'),
('ML', '#ec4899'),
('AVL', '#6b7280');
