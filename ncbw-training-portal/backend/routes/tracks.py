from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Track, Module, Course, Quiz, Enrollment, CourseProgress, ModuleProgress, QuizAttempt, User

tracks_bp = Blueprint('tracks', __name__)

@tracks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tracks():
    user_id = int(get_jwt_identity())
    tracks = Track.query.order_by(Track.display_order).all()
    enrolled_ids = {e.track_id for e in Enrollment.query.filter_by(user_id=user_id).all()}

    result = []
    for track in tracks:
        t = track.to_dict()
        t['enrolled'] = track.id in enrolled_ids
        t['module_count'] = len(track.modules)
        result.append(t)
    return jsonify(result), 200


@tracks_bp.route('/<int:track_id>', methods=['GET'])
@jwt_required()
def get_track(track_id):
    user_id = int(get_jwt_identity())
    track = Track.query.get_or_404(track_id)
    data = track.to_dict(include_modules=True)

    # Enrich with user progress
    completed_courses = {cp.course_id for cp in CourseProgress.query.filter_by(user_id=user_id, completed=True).all()}
    completed_modules = {mp.module_id for mp in ModuleProgress.query.filter_by(user_id=user_id, completed=True).all()}

    for mod in data['modules']:
        mod['completed'] = mod['id'] in completed_modules
        for course in mod.get('courses', []):
            course['completed'] = course['id'] in completed_courses

    return jsonify(data), 200


@tracks_bp.route('/<int:track_id>/enroll', methods=['POST'])
@jwt_required()
def enroll(track_id):
    user_id = int(get_jwt_identity())
    existing = Enrollment.query.filter_by(user_id=user_id, track_id=track_id).first()
    if existing:
        return jsonify({'message': 'Already enrolled'}), 200

    enrollment = Enrollment(user_id=user_id, track_id=track_id)
    db.session.add(enrollment)
    db.session.commit()
    return jsonify({'message': 'Enrolled successfully'}), 201


@tracks_bp.route('/courses/<int:course_id>/complete', methods=['POST'])
@jwt_required()
def complete_course(course_id):
    from datetime import datetime
    user_id = int(get_jwt_identity())
    progress = CourseProgress.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not progress:
        progress = CourseProgress(user_id=user_id, course_id=course_id)
        db.session.add(progress)
    progress.completed = True
    progress.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Course marked complete'}), 200


@tracks_bp.route('/progress/<int:track_id>', methods=['GET'])
@jwt_required()
def get_progress(track_id):
    user_id = int(get_jwt_identity())
    track = Track.query.get_or_404(track_id)
    total_courses = sum(len(m.courses) for m in track.modules)
    if total_courses == 0:
        return jsonify({'percentage': 0, 'completed': 0, 'total': 0}), 200

    completed = CourseProgress.query.join(Course).join(Module).filter(
        Module.track_id == track_id,
        CourseProgress.user_id == user_id,
        CourseProgress.completed == True
    ).count()

    return jsonify({
        'percentage': round((completed / total_courses) * 100),
        'completed': completed,
        'total': total_courses
    }), 200
