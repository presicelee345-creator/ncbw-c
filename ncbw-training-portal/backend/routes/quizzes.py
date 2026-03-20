from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Quiz, QuizQuestion, QuizOption, QuizAttempt, ModuleProgress

quizzes_bp = Blueprint('quizzes', __name__)

@quizzes_bp.route('/<int:quiz_id>', methods=['GET'])
@jwt_required()
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    data = quiz.to_dict(include_questions=True)
    # Don't send correct answers to frontend
    for q in data.get('questions', []):
        for opt in q.get('options', []):
            opt.pop('is_correct', None)
    return jsonify(data), 200


@quizzes_bp.route('/<int:quiz_id>/submit', methods=['POST'])
@jwt_required()
def submit_quiz(quiz_id):
    user_id = int(get_jwt_identity())
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    answers = data.get('answers', {})  # {question_id: option_id}

    total = len(quiz.questions)
    if total == 0:
        return jsonify({'error': 'Quiz has no questions'}), 400

    correct = 0
    for question in quiz.questions:
        selected_option_id = answers.get(str(question.id))
        if selected_option_id:
            option = QuizOption.query.get(int(selected_option_id))
            if option and option.is_correct:
                correct += 1

    score = round((correct / total) * 100)
    passed = score >= quiz.pass_percentage

    attempt = QuizAttempt(user_id=user_id, quiz_id=quiz_id, score=score, passed=passed)
    db.session.add(attempt)

    if passed:
        existing = ModuleProgress.query.filter_by(user_id=user_id, module_id=quiz.module_id).first()
        if not existing:
            existing = ModuleProgress(user_id=user_id, module_id=quiz.module_id)
            db.session.add(existing)
        existing.completed = True
        existing.completed_at = datetime.utcnow()

    db.session.commit()
    return jsonify({'score': score, 'passed': passed, 'correct': correct, 'total': total}), 200


@quizzes_bp.route('/<int:quiz_id>/attempts', methods=['GET'])
@jwt_required()
def get_attempts(quiz_id):
    user_id = int(get_jwt_identity())
    attempts = QuizAttempt.query.filter_by(user_id=user_id, quiz_id=quiz_id)\
        .order_by(QuizAttempt.attempted_at.desc()).all()
    return jsonify([{
        'id': a.id, 'score': a.score, 'passed': a.passed,
        'attempted_at': a.attempted_at.isoformat()
    } for a in attempts]), 200
