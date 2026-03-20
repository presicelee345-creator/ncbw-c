-- NCBW Training Portal — PostgreSQL Schema
-- Run: psql -U ncbw_user -d ncbw_training -f schema.sql

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'trainee', -- 'trainee' | 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- LEADERSHIP TRACKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- MODULES (sections within a track)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- COURSES (lessons within a module)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    source VARCHAR(100),        -- e.g. 'LinkedIn Learning', 'Coursera'
    duration_mins INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- QUIZZES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    duration_mins INTEGER DEFAULT 15,
    pass_percentage INTEGER DEFAULT 70,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0
);

-- ─────────────────────────────────────────
-- TRAINEE ENROLLMENT
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, track_id)
);

-- ─────────────────────────────────────────
-- PROGRESS TRACKING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    time_spent_mins INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS module_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, module_id)
);

-- ─────────────────────────────────────────
-- QUIZ ATTEMPTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- CERTIFICATES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificate_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    track_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
    template_type VARCHAR(50) DEFAULT 'standard',
    first_signature_name VARCHAR(100) DEFAULT 'Administrator Signature',
    second_signature_name VARCHAR(100) DEFAULT 'Chapter President',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES certificate_templates(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, track_id)
);

-- ─────────────────────────────────────────
-- EMAIL TEMPLATES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'welcome','weekly_reminder','quiz_passed','certificate','at_risk'
    subject VARCHAR(255),
    body_html TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────

-- Default admin user (password: 123123)
INSERT INTO users (first_name, last_name, username, email, password_hash, role)
VALUES ('Admin', 'User', 'admin', 'admin@ncbwqmc.org',
'$2b$12$dtb6LezIOjIx9mb7TWXojOnIa7ENcKdtQ0q6HjJRlMLs1NrV3ZXCm', 'admin')
ON CONFLICT DO NOTHING;

-- Leadership Tracks
INSERT INTO tracks (name, description, display_order) VALUES
('President', 'The President''s role demands strategic thinking, leadership, communication, and conflict-resolution skills.', 1),
('Vice President', 'The Vice President supports executive leadership and program coordination.', 2),
('Second Vice President', 'The Second Vice President oversees membership and community engagement.', 3),
('Third Vice President', 'The Third Vice President manages fundraising and financial planning.', 4),
('Treasurer', 'The Treasurer manages chapter finances, budgets, and financial reporting.', 5),
('Financial Secretary', 'The Financial Secretary tracks dues, income, and financial records.', 6),
('Corresponding Secretary', 'The Corresponding Secretary handles all chapter communications.', 7),
('Chaplain', 'The Chaplain provides spiritual guidance and program support.', 8),
('Parliamentarian', 'The Parliamentarian ensures meetings follow proper procedures.', 9)
ON CONFLICT DO NOTHING;

-- Sample modules for President track
INSERT INTO modules (track_id, title, description, display_order)
SELECT t.id, 'Leadership & Strategic Visioning',
       'Overview of leadership styles, strategic planning, and setting organizational vision and goals.', 1
FROM tracks t WHERE t.name = 'President' ON CONFLICT DO NOTHING;

-- Sample courses
INSERT INTO courses (module_id, title, source, duration_mins, display_order)
SELECT m.id, 'What is Strategic Planning?', 'LinkedIn Learning', 20, 1
FROM modules m WHERE m.title = 'Leadership & Strategic Visioning' ON CONFLICT DO NOTHING;

INSERT INTO courses (module_id, title, source, duration_mins, display_order)
SELECT m.id, 'Creating Your Personal Leadership Plan', 'Coursera', 45, 2
FROM modules m WHERE m.title = 'Leadership & Strategic Visioning' ON CONFLICT DO NOTHING;

INSERT INTO courses (module_id, title, source, duration_mins, display_order)
SELECT m.id, 'Leadership Fundamentals', 'YouTube by FutureLearn', 30, 3
FROM modules m WHERE m.title = 'Leadership & Strategic Visioning' ON CONFLICT DO NOTHING;

INSERT INTO courses (module_id, title, source, duration_mins, display_order)
SELECT m.id, 'Strategic Thinking', 'LinkedIn Learning', 50, 4
FROM modules m WHERE m.title = 'Leadership & Strategic Visioning' ON CONFLICT DO NOTHING;

INSERT INTO courses (module_id, title, source, duration_mins, display_order)
SELECT m.id, 'Defining Your Leadership Values and Vision', 'Coursera', 30, 5
FROM modules m WHERE m.title = 'Leadership & Strategic Visioning' ON CONFLICT DO NOTHING;

-- Default email templates
INSERT INTO email_templates (name, type, subject, body_html) VALUES
('Welcome Email', 'welcome', 'Welcome to Your Leadership Journey!',
 '<h1>Welcome to NCBW Training Portal</h1><p>Your leadership journey begins now.</p>'),
('Weekly Reminder', 'weekly_reminder', 'Keep Up the Great Work!',
 '<h1>Weekly Progress Update</h1><p>Stay on track with your training.</p>'),
('Quiz Passed', 'quiz_passed', 'Congratulations! You Passed!',
 '<h1>Great job!</h1><p>You have passed your quiz and unlocked the next module.</p>'),
('Certificate Award', 'certificate', 'Achievement Unlocked!',
 '<h1>Congratulations!</h1><p>You have completed your leadership track.</p>'),
('At-Risk Alert', 'at_risk', 'We Miss You!',
 '<h1>Come Back!</h1><p>You have not been active recently. Keep going!</p>')
ON CONFLICT DO NOTHING;

-- Default certificate template
INSERT INTO certificate_templates (name, template_type, first_signature_name, second_signature_name)
VALUES ('Standard Leadership Certificate', 'standard', 'Administrator Signature', 'Chapter President')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- PASSWORD RESET TOKENS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
