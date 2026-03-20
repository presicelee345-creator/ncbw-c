from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='trainee')
    is_active = db.Column(db.Boolean, default=True)
    login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    quiz_attempts = db.relationship('QuizAttempt', backref='user', lazy=True)
    certificates = db.relationship('Certificate', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_active': self.last_active.isoformat() if self.last_active else None
        }

class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    modules = db.relationship('Module', backref='track', lazy=True, order_by='Module.display_order')

    def to_dict(self, include_modules=False):
        d = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'display_order': self.display_order
        }
        if include_modules:
            d['modules'] = [m.to_dict(include_courses=True) for m in self.modules]
        return d

class Module(db.Model):
    __tablename__ = 'modules'
    id = db.Column(db.Integer, primary_key=True)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    courses = db.relationship('Course', backref='module', lazy=True, order_by='Course.display_order')
    quizzes = db.relationship('Quiz', backref='module', lazy=True)

    def to_dict(self, include_courses=False):
        d = {
            'id': self.id,
            'track_id': self.track_id,
            'title': self.title,
            'description': self.description,
            'display_order': self.display_order
        }
        if include_courses:
            d['courses'] = [c.to_dict() for c in self.courses]
            d['quizzes'] = [q.to_dict() for q in self.quizzes]
        return d

class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    source = db.Column(db.String(100))
    duration_mins = db.Column(db.Integer)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'module_id': self.module_id,
            'title': self.title,
            'source': self.source,
            'duration_mins': self.duration_mins,
            'display_order': self.display_order
        }

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    duration_mins = db.Column(db.Integer, default=15)
    pass_percentage = db.Column(db.Integer, default=70)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship('QuizQuestion', backref='quiz', lazy=True, order_by='QuizQuestion.display_order')

    def to_dict(self, include_questions=False):
        d = {
            'id': self.id,
            'module_id': self.module_id,
            'title': self.title,
            'duration_mins': self.duration_mins,
            'pass_percentage': self.pass_percentage
        }
        if include_questions:
            d['questions'] = [q.to_dict() for q in self.questions]
        return d

class QuizQuestion(db.Model):
    __tablename__ = 'quiz_questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    display_order = db.Column(db.Integer, default=0)

    options = db.relationship('QuizOption', backref='question', lazy=True, order_by='QuizOption.display_order')

    def to_dict(self):
        return {
            'id': self.id,
            'question_text': self.question_text,
            'display_order': self.display_order,
            'options': [o.to_dict() for o in self.options]
        }

class QuizOption(db.Model):
    __tablename__ = 'quiz_options'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('quiz_questions.id'), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self, include_correct=False):
        d = {'id': self.id, 'option_text': self.option_text, 'display_order': self.display_order}
        if include_correct:
            d['is_correct'] = self.is_correct
        return d

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    track = db.relationship('Track')

class CourseProgress(db.Model):
    __tablename__ = 'course_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    time_spent_mins = db.Column(db.Integer, default=0)

class ModuleProgress(db.Model):
    __tablename__ = 'module_progress'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    passed = db.Column(db.Boolean, nullable=False)
    attempted_at = db.Column(db.DateTime, default=datetime.utcnow)
    quiz = db.relationship('Quiz')

class CertificateTemplate(db.Model):
    __tablename__ = 'certificate_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'))
    template_type = db.Column(db.String(50), default='standard')
    first_signature_name = db.Column(db.String(100), default='Administrator Signature')
    second_signature_name = db.Column(db.String(100), default='Chapter President')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'track_id': self.track_id,
            'template_type': self.template_type,
            'first_signature_name': self.first_signature_name,
            'second_signature_name': self.second_signature_name,
            'created_at': self.created_at.isoformat()
        }

class Certificate(db.Model):
    __tablename__ = 'certificates'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey('certificate_templates.id'))
    issued_at = db.Column(db.DateTime, default=datetime.utcnow)
    track = db.relationship('Track')
    template = db.relationship('CertificateTemplate')

class EmailTemplate(db.Model):
    __tablename__ = 'email_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    subject = db.Column(db.String(255))
    body_html = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'type': self.type,
            'subject': self.subject, 'body_html': self.body_html
        }


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token = db.Column(db.String(128), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
