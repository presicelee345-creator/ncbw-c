from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from models import db, User, Track, Module, Course, Quiz, QuizQuestion, QuizOption
from models import Enrollment, CourseProgress, QuizAttempt, Certificate, CertificateTemplate, EmailTemplate

admin_bp = Blueprint('admin', __name__)

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

# ── TRAINEES ──────────────────────────────────────────

@admin_bp.route('/trainees', methods=['GET'])
@admin_required
def get_trainees():
    trainees = User.query.filter_by(role='trainee').all()
    result = []
    for u in trainees:
        enrollments = Enrollment.query.filter_by(user_id=u.id).all()
        track_name = enrollments[0].track.name if enrollments else None

        total_courses = 0
        completed_courses = 0
        for e in enrollments:
            for mod in e.track.modules:
                total_courses += len(mod.courses)
                completed_courses += CourseProgress.query.filter_by(
                    user_id=u.id, completed=True
                ).join(Course).filter(Course.module_id == mod.id).count()

        progress = round((completed_courses / total_courses * 100)) if total_courses > 0 else 0

        attempts = QuizAttempt.query.filter_by(user_id=u.id).all()
        avg_score = round(sum(a.score for a in attempts) / len(attempts)) if attempts else 0

        data = u.to_dict()
        data['track'] = track_name
        data['progress'] = progress
        data['avg_quiz_score'] = avg_score
        result.append(data)
    return jsonify(result), 200


@admin_bp.route('/trainees/<int:user_id>', methods=['GET'])
@admin_required
def get_trainee(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


# ── TRACKS MANAGEMENT ─────────────────────────────────

@admin_bp.route('/tracks', methods=['GET'])
@admin_required
def get_tracks():
    tracks = Track.query.order_by(Track.display_order).all()
    return jsonify([t.to_dict(include_modules=True) for t in tracks]), 200


@admin_bp.route('/tracks', methods=['POST'])
@admin_required
def create_track():
    data = request.get_json()
    track = Track(name=data['name'], description=data.get('description', ''),
                  display_order=data.get('display_order', 0))
    db.session.add(track)
    db.session.commit()
    return jsonify(track.to_dict()), 201


@admin_bp.route('/tracks/<int:track_id>', methods=['PUT'])
@admin_required
def update_track(track_id):
    track = Track.query.get_or_404(track_id)
    data = request.get_json()
    track.name = data.get('name', track.name)
    track.description = data.get('description', track.description)
    db.session.commit()
    return jsonify(track.to_dict(include_modules=True)), 200


@admin_bp.route('/tracks/<int:track_id>', methods=['DELETE'])
@admin_required
def delete_track(track_id):
    track = Track.query.get_or_404(track_id)
    db.session.delete(track)
    db.session.commit()
    return jsonify({'message': 'Track deleted'}), 200


@admin_bp.route('/tracks/<int:track_id>/modules', methods=['POST'])
@admin_required
def add_module(track_id):
    data = request.get_json()
    module = Module(track_id=track_id, title=data['title'],
                    description=data.get('description', ''),
                    display_order=data.get('display_order', 0))
    db.session.add(module)
    db.session.commit()
    return jsonify(module.to_dict()), 201


@admin_bp.route('/modules/<int:module_id>', methods=['PUT'])
@admin_required
def update_module(module_id):
    module = Module.query.get_or_404(module_id)
    data = request.get_json()
    module.title = data.get('title', module.title)
    module.description = data.get('description', module.description)
    db.session.commit()
    return jsonify(module.to_dict()), 200


@admin_bp.route('/modules/<int:module_id>', methods=['DELETE'])
@admin_required
def delete_module(module_id):
    module = Module.query.get_or_404(module_id)
    db.session.delete(module)
    db.session.commit()
    return jsonify({'message': 'Module deleted'}), 200


@admin_bp.route('/modules/<int:module_id>/courses', methods=['POST'])
@admin_required
def add_course(module_id):
    data = request.get_json()
    course = Course(module_id=module_id, title=data['title'],
                    source=data.get('source', ''),
                    duration_mins=data.get('duration_mins', 0),
                    display_order=data.get('display_order', 0))
    db.session.add(course)
    db.session.commit()
    return jsonify(course.to_dict()), 201


@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@admin_required
def delete_course(course_id):
    course = Course.query.get_or_404(course_id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted'}), 200


# ── QUIZZES ───────────────────────────────────────────

@admin_bp.route('/quizzes', methods=['GET'])
@admin_required
def get_all_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([q.to_dict(include_questions=True) for q in quizzes]), 200


@admin_bp.route('/quizzes', methods=['POST'])
@admin_required
def create_quiz():
    data = request.get_json()
    quiz = Quiz(module_id=data['module_id'], title=data['title'],
                duration_mins=data.get('duration_mins', 15),
                pass_percentage=data.get('pass_percentage', 70))
    db.session.add(quiz)
    db.session.flush()

    for q_data in data.get('questions', []):
        question = QuizQuestion(quiz_id=quiz.id, question_text=q_data['question_text'],
                                display_order=q_data.get('display_order', 0))
        db.session.add(question)
        db.session.flush()
        for opt in q_data.get('options', []):
            option = QuizOption(question_id=question.id, option_text=opt['option_text'],
                                is_correct=opt.get('is_correct', False),
                                display_order=opt.get('display_order', 0))
            db.session.add(option)

    db.session.commit()
    return jsonify(quiz.to_dict(include_questions=True)), 201


@admin_bp.route('/quizzes/<int:quiz_id>', methods=['DELETE'])
@admin_required
def delete_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({'message': 'Quiz deleted'}), 200


# ── CERTIFICATES ──────────────────────────────────────

@admin_bp.route('/certificate-templates', methods=['GET'])
@admin_required
def get_cert_templates():
    templates = CertificateTemplate.query.all()
    return jsonify([t.to_dict() for t in templates]), 200


@admin_bp.route('/certificate-templates', methods=['POST'])
@admin_required
def create_cert_template():
    data = request.get_json()
    template = CertificateTemplate(
        name=data['name'], track_id=data.get('track_id'),
        template_type=data.get('template_type', 'standard'),
        first_signature_name=data.get('first_signature_name', 'Administrator Signature'),
        second_signature_name=data.get('second_signature_name', 'Chapter President')
    )
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201


@admin_bp.route('/certificate-templates/<int:template_id>', methods=['PUT'])
@admin_required
def update_cert_template(template_id):
    template = CertificateTemplate.query.get_or_404(template_id)
    data = request.get_json()
    for field in ['name', 'template_type', 'first_signature_name', 'second_signature_name']:
        if field in data:
            setattr(template, field, data[field])
    db.session.commit()
    return jsonify(template.to_dict()), 200


@admin_bp.route('/certificate-templates/<int:template_id>', methods=['DELETE'])
@admin_required
def delete_cert_template(template_id):
    template = CertificateTemplate.query.get_or_404(template_id)
    db.session.delete(template)
    db.session.commit()
    return jsonify({'message': 'Template deleted'}), 200


# ── EMAIL TEMPLATES ───────────────────────────────────

@admin_bp.route('/email-templates', methods=['GET'])
@admin_required
def get_email_templates():
    templates = EmailTemplate.query.all()
    return jsonify([t.to_dict() for t in templates]), 200


@admin_bp.route('/email-templates/<int:template_id>', methods=['PUT'])
@admin_required
def update_email_template(template_id):
    template = EmailTemplate.query.get_or_404(template_id)
    data = request.get_json()
    template.subject = data.get('subject', template.subject)
    template.body_html = data.get('body_html', template.body_html)
    from datetime import datetime
    template.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(template.to_dict()), 200


@admin_bp.route('/email-templates/<int:template_id>/send', methods=['POST'])
@admin_required
def send_email(template_id):
    # Placeholder — wire up Flask-Mail for real sending
    return jsonify({'message': 'Email sent (configure SMTP in .env to enable)'}), 200
