from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from datetime import datetime, timedelta
from models import db, User, Track, Module, Course, Enrollment, CourseProgress, QuizAttempt, Certificate

reports_bp = Blueprint('reports', __name__)


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


@reports_bp.route('/overview', methods=['GET'])
@admin_required
def overview():
    total_trainees = User.query.filter_by(role='trainee').count()
    total_tracks = Track.query.count()
    certs_issued = Certificate.query.count()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_this_month = User.query.filter(
        User.role == 'trainee',
        User.last_active >= thirty_days_ago
    ).count()

    total_completions = 0
    for e in Enrollment.query.all():
        total = sum(len(m.courses) for m in e.track.modules)
        if total == 0:
            continue
        completed = CourseProgress.query.join(Course).join(Module).filter(
            Module.track_id == e.track_id,
            CourseProgress.user_id == e.user_id,
            CourseProgress.completed == True
        ).count()
        if completed >= total:
            total_completions += 1

    all_attempts = QuizAttempt.query.all()
    avg_score = round(sum(a.score for a in all_attempts) / len(all_attempts)) if all_attempts else 0

    return jsonify({
        'total_trainees': total_trainees,
        'total_tracks': total_tracks,
        'active_this_month': active_this_month,
        'total_completions': total_completions,
        'certificates_issued': certs_issued,
        'avg_quiz_score': avg_score
    }), 200


@reports_bp.route('/track-analytics', methods=['GET'])
@admin_required
def track_analytics():
    tracks = Track.query.order_by(Track.display_order).all()
    result = []
    for track in tracks:
        enrolled_count = Enrollment.query.filter_by(track_id=track.id).count()
        total_courses = sum(len(m.courses) for m in track.modules)

        completed_count = 0
        progress_sum = 0
        enrollments = Enrollment.query.filter_by(track_id=track.id).all()
        for e in enrollments:
            comp = CourseProgress.query.join(Course).join(Module).filter(
                Module.track_id == track.id,
                CourseProgress.user_id == e.user_id,
                CourseProgress.completed == True
            ).count()
            pct = round(comp / total_courses * 100) if total_courses > 0 else 0
            progress_sum += pct
            if pct == 100:
                completed_count += 1

        avg_progress = round(progress_sum / len(enrollments)) if enrollments else 0

        result.append({
            'track_name': track.name,
            'enrolled': enrolled_count,
            'completions': completed_count,
            'avg_progress': avg_progress,
        })
    return jsonify(result), 200


@reports_bp.route('/engagement', methods=['GET'])
@admin_required
def engagement():
    now = datetime.utcnow()
    data = []
    for i in range(29, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        active = User.query.filter(
            User.role == 'trainee',
            User.last_active >= day_start,
            User.last_active < day_end
        ).count()
        data.append({'date': day_start.strftime('%b %d'), 'active_users': active})
    return jsonify(data), 200


@reports_bp.route('/recent-activity', methods=['GET'])
@admin_required
def recent_activity():
    attempts = QuizAttempt.query.order_by(QuizAttempt.attempted_at.desc()).limit(20).all()
    certs = Certificate.query.order_by(Certificate.issued_at.desc()).limit(10).all()

    events = []
    for a in attempts:
        events.append({
            'type': 'quiz',
            'user': f"{a.user.first_name} {a.user.last_name}",
            'description': f"completed '{a.quiz.title}' quiz with {a.score}%",
            'timestamp': a.attempted_at.isoformat()
        })
    for c in certs:
        events.append({
            'type': 'certificate',
            'user': f"{c.user.first_name} {c.user.last_name}",
            'description': f"earned '{c.track.name}' track certificate",
            'timestamp': c.issued_at.isoformat()
        })

    events.sort(key=lambda x: x['timestamp'], reverse=True)
    return jsonify(events[:20]), 200
