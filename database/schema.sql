-- database/schema.sql


-- =============================================
-- EMPLOYEES
-- =============================================
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(50),
    role VARCHAR(50),
    base_salary DECIMAL(10, 2) NOT NULL,
    joining_date DATE,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
);

-- =============================================
-- ATTENDANCE
-- =============================================
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    date DATE NOT NULL,
    status ENUM('Present', 'Absent', 'Leave') NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    UNIQUE KEY emp_date_unique (employee_id, date)
);

-- =============================================
-- LEAVE TYPES
-- =============================================
CREATE TABLE leave_types (
    leave_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

INSERT INTO leave_types (name) VALUES ('Sick Leave'), ('Casual Leave'), ('Paid Leave'), ('Unpaid Leave');

-- =============================================
-- LEAVE REQUESTS
-- =============================================
CREATE TABLE leave_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    leave_type_id INT,
    start_date DATE,
    end_date DATE,
    reason VARCHAR(255),
    status ENUM('Pending', 'Manager Approved', 'HR Approved', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id)
);

-- =============================================
-- LEAVE BALANCES
-- =============================================
CREATE TABLE leave_balances (
    balance_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    leave_type_id INT,
    total_days INT DEFAULT 0,
    used_days INT DEFAULT 0,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(leave_type_id)
);

-- =============================================
-- TAX SLABS
-- =============================================
CREATE TABLE tax_slabs (
    slab_id INT AUTO_INCREMENT PRIMARY KEY,
    min_salary DECIMAL(10, 2) NOT NULL,
    max_salary DECIMAL(10, 2),
    tax_rate DECIMAL(5, 2) NOT NULL -- in percentage
);

INSERT INTO tax_slabs (min_salary, max_salary, tax_rate) VALUES 
(0, 500000, 0),
(500000.01, 1000000, 10),
(1000000.01, 2000000, 20),
(2000000.01, NULL, 30);

-- =============================================
-- PAYROLL
-- =============================================
CREATE TABLE payroll (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    month_year VARCHAR(7), -- e.g., '2024-01'
    base_salary DECIMAL(10, 2),
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    bonus DECIMAL(10, 2) DEFAULT 0,
    leave_deduction DECIMAL(10, 2) DEFAULT 0,
    tax_deduction DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending', 'Manager Approved', 'HR Approved', 'Final Approved', 'Stored in Blockchain') DEFAULT 'Pending',
    approved_by VARCHAR(255) DEFAULT '',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- =============================================
-- PAYSLIPS
-- =============================================
CREATE TABLE payslips (
    payslip_id INT AUTO_INCREMENT PRIMARY KEY,
    payroll_id INT,
    employee_id INT,
    month_year VARCHAR(7),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_id) REFERENCES payroll(payroll_id),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

-- =============================================
-- BLOCKCHAIN AUDIT BLOCKS
-- =============================================
CREATE TABLE blockchain_blocks (
    block_index INT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    data JSON NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL
);

-- =============================================
-- SAMPLE DATA
-- =============================================
INSERT INTO employees (name, email, phone, department, role, base_salary, joining_date, status) VALUES
('Aarav Sharma', 'aarav.sharma@adaptivepay.com', '9876543210', 'Engineering', 'Senior Developer', 950000, '2022-01-15', 'Active'),
('Vivaan Patel', 'vivaan.patel@adaptivepay.com', '9876543211', 'Engineering', 'Backend Engineer', 800000, '2022-03-10', 'Active'),
('Priya Singh', 'priya.singh@adaptivepay.com', '9876543212', 'HR', 'HR Manager', 700000, '2021-06-01', 'Active'),
('Aditya Gupta', 'aditya.gupta@adaptivepay.com', '9876543213', 'Finance', 'Financial Analyst', 750000, '2023-01-20', 'Active'),
('Anika Joshi', 'anika.joshi@adaptivepay.com', '9876543214', 'Marketing', 'Marketing Lead', 720000, '2023-05-11', 'Active');

ALTER TABLE employees ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';
ALTER TABLE attendance ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';
ALTER TABLE leave_requests ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';
ALTER TABLE payroll ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';
ALTER TABLE blockchain_blocks ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';
ALTER TABLE tax_slabs ADD COLUMN org_domain VARCHAR(100) DEFAULT 'adaptivepay.com';

-- =============================================
-- USERS
-- =============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Employee', 'Manager', 'HR', 'Admin') NOT NULL,
    org_domain VARCHAR(100) DEFAULT 'adaptivepay.com',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password, role, org_domain) VALUES 
('admin@adaptivepay.com', '$2b$12$7NfZnd4GV4uQUILEHvlTHuJw19N/RvfRMnDXKz4vlbyq94M0OQqEO', 'Admin', 'adaptivepay.com'), -- admin123
('priya.singh@adaptivepay.com', '$2b$12$7NfZnd4GV4uQUILEHvlTHuJw19N/RvfRMnDXKz4vlbyq94M0OQqEO', 'HR', 'adaptivepay.com'), -- admin123
('manager@adaptivepay.com', '$2b$12$7NfZnd4GV4uQUILEHvlTHuJw19N/RvfRMnDXKz4vlbyq94M0OQqEO', 'Manager', 'adaptivepay.com'), -- admin123
('vivaan.patel@adaptivepay.com', '$2b$12$7NfZnd4GV4uQUILEHvlTHuJw19N/RvfRMnDXKz4vlbyq94M0OQqEO', 'Employee', 'adaptivepay.com'); -- admin123

