-- supabase_setup.sql
-- Supabase PostgreSQL Setup Script for School Registrations Portal
-- This script creates the core schema, tables, constraints, default settings, indexes, and initial default settings.
-- It can be executed as a single batch within the Supabase SQL Editor.

-- BEGIN TRANSACTION
BEGIN;

-- ==========================================
-- 1. CLEANUP PREVIOUS SCHEMAS (IF APPLICABLE)
-- ==========================================
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS grade_settings CASCADE;
DROP TABLE IF EXISTS classes CASCADE;

-- ==========================================
-- 2. CREATE `grade_settings` TABLE
-- ==========================================
CREATE TABLE grade_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INTEGER UNIQUE NOT NULL,
    students_per_class INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT check_valid_grade CHECK (grade IN (10, 11, 12)),
    CONSTRAINT check_positive_size CHECK (students_per_class > 0)
);

-- ==========================================
-- 3. CREATE `classes` TABLE
-- ==========================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(100) UNIQUE NOT NULL,
    grade INTEGER NOT NULL,
    class_type VARCHAR(20) NOT NULL DEFAULT 'Regular',
    total_students INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT check_class_grade CHECK (grade IN (10, 11, 12)),
    CONSTRAINT check_class_type CHECK (class_type IN ('Special', 'Regular')),
    CONSTRAINT check_non_negative_students CHECK (total_students >= 0)
);

-- ==========================================
-- 4. CREATE `registrations` TABLE
-- ==========================================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    sex VARCHAR(10) NOT NULL,
    promoted_grade INTEGER NOT NULL,
    average NUMERIC(5, 2) NOT NULL,
    transcript_url TEXT NOT NULL,
    receipt_url TEXT NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review',
    class_assignment VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT check_student_age CHECK (age >= 12 AND age <= 25),
    CONSTRAINT check_student_sex CHECK (sex IN ('Male', 'Female')),
    CONSTRAINT check_student_grade CHECK (promoted_grade IN (10, 11, 12)),
    CONSTRAINT check_student_average CHECK (average >= 0.00 AND average <= 100.00),
    CONSTRAINT check_student_status CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
    
    -- Foreign key linking class_assignment to classes(class_name) on update cascade, set null on delete
    CONSTRAINT fk_class_assignment FOREIGN KEY (class_assignment) 
        REFERENCES classes(class_name) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
);

-- ==========================================
-- 5. PERFORMANCE INDEXES
-- ==========================================
CREATE INDEX idx_registrations_promoted_grade ON registrations(promoted_grade);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_class_assignment ON registrations(class_assignment);
CREATE INDEX idx_registrations_created_at ON registrations(created_at DESC);

CREATE INDEX idx_classes_grade ON classes(grade);
CREATE INDEX idx_classes_class_name ON classes(class_name);

-- ==========================================
-- 6. TRIGGERS FOR UPDATE TIMESTAMP
-- ==========================================
-- Helper function to auto-update updating_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trigger_update_registrations_depth
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_classes_depth
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_update_grade_settings_depth
    BEFORE UPDATE ON grade_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- 7. DEFAULT & SEED RECOGNIZED VALUES
-- ==========================================
-- Insert Default Target Class Capacities
INSERT INTO grade_settings (grade, students_per_class) VALUES
(10, 45),
(11, 40),
(12, 35)
ON CONFLICT (grade) DO UPDATE 
SET students_per_class = EXCLUDED.students_per_class;

-- Insert Seed Class Blocks if needed
INSERT INTO classes (class_name, grade, class_type, total_students) VALUES
('G10-A', 10, 'Regular', 0),
('G10-B', 10, 'Regular', 0),
('G10-SP', 10, 'Special', 0),
('G11-A', 11, 'Regular', 0),
('G11-B', 11, 'Regular', 0),
('G11-SP', 11, 'Special', 0),
('G12-A', 12, 'Regular', 0),
('G12-SP', 12, 'Special', 0)
ON CONFLICT (class_name) DO NOTHING;

-- COMMIT TRANSACTION
COMMIT;
