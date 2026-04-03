CREATE DATABASE IF NOT EXISTS punaime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE punaime;


CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    positions INT DEFAULT 1,
    is_new BOOLEAN DEFAULT FALSE,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    city VARCHAR(100),
    job_title VARCHAR(100) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO jobs (title, company, location, positions, is_new) VALUES
('Zhvillues Web (Junior)', 'TechKos', 'Prishtinë', 3, TRUE),
('Dizajner Grafik', 'Creative Studio', 'Prishtinë', 2, TRUE),
('Menaxher Projektesh IT', 'InnoSoft', 'Prizren', 1, FALSE),
('Specialist Marketingu Dixhital', 'DigiPro', 'Ferizaj', 2, TRUE),
('Analist i të Dhënave', 'DataKos', 'Prishtinë', 1, FALSE),
('Inxhinier Softueri', 'SoftWorks', 'Gjakovë', 2, TRUE);

SELECT 'Database punaime created successfully with sample data!' AS Status;
