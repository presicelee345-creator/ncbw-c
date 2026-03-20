import re
import secrets
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import bcrypt
from models import db, User, PasswordResetToken

auth_bp = Blueprint('auth', __name__)

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 30
RESET_TOKEN_EXPIRY_MINUTES = 30

# ─── Password validation ──────────────────────────────────────────────────────
def validate_password(password):
    """Returns a list of error strings. Empty list means valid."""
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters.')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain at least one uppercase letter.')
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:\'",.<>/?\\|`~]', password):
        errors.append('Password must contain at least one special character.')
    if not re.match(r'^[A-Za-z0-9!@#$%^&*()\-_=+\[\]{};:\'",.<>/?\\|`~]+$', password):
        errors.append('Password may only contain letters, numbers, and special characters.')
    return errors


# ─── Register ─────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required = ['first_name', 'last_name', 'username', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    # Server-side password validation
    pw_errors = validate_password(data['password'])
    if pw_errors:
        return jsonify({'error': ' '.join(pw_errors)}), 400

    # Email format check
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
        return jsonify({'error': 'Invalid email address'}), 400

    # Username: alphanumeric + underscore, 3-30 chars
    if not re.match(r'^[a-zA-Z0-9_]{3,30}$', data['username']):
        return jsonify({'error': 'Username must be 3-30 characters (letters, numbers, underscores only)'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        username=data['username'].strip(),
        email=data['email'].strip().lower(),
        password_hash=password_hash,
        role='trainee'
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 201


# ─── Login ────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'Invalid username or password', 'attempts': 0, 'max_attempts': MAX_ATTEMPTS}), 401

    # Check lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        return jsonify({
            'error': f'Account locked. Try again in {remaining} minute{"s" if remaining != 1 else ""}.',
            'locked': True
        }), 423

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        user.login_attempts += 1
        if user.login_attempts >= MAX_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            db.session.commit()
            return jsonify({
                'error': f'Account locked after {MAX_ATTEMPTS} failed attempts. Try again in {LOCKOUT_MINUTES} minutes.',
                'locked': True
            }), 423

        db.session.commit()
        remaining = MAX_ATTEMPTS - user.login_attempts
        return jsonify({
            'error': 'Invalid username or password. Please try again.',
            'attempts_used': user.login_attempts,
            'max_attempts': MAX_ATTEMPTS,
            'attempts_remaining': remaining
        }), 401

    # Success — reset attempts
    user.login_attempts = 0
    user.locked_until = None
    user.last_active = datetime.utcnow()
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'user': user.to_dict()}), 200


# ─── Get current user ─────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200


# ─── Change password ──────────────────────────────────────────────────────────
@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if not bcrypt.checkpw(data['current_password'].encode(), user.password_hash.encode()):
        return jsonify({'error': 'Current password is incorrect'}), 400

    pw_errors = validate_password(data['new_password'])
    if pw_errors:
        return jsonify({'error': ' '.join(pw_errors)}), 400

    user.password_hash = bcrypt.hashpw(data['new_password'].encode(), bcrypt.gensalt()).decode()
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'}), 200


# ─── Forgot password — request reset link ────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = (data.get('email') or '').strip().lower()

    # Always return 200 — prevents user enumeration attacks
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200

    # Invalidate any existing unused tokens
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})
    db.session.flush()

    raw_token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=raw_token,
        expires_at=datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
    )
    db.session.add(reset_token)
    db.session.commit()

    # TODO: Hook up your email service here (Flask-Mail, SendGrid, SES, etc.)
    # Reset URL example: f"{request.host_url}reset-password?token={raw_token}"
    print(f"[DEV] Reset token for {email}: {raw_token}")

    return jsonify({'message': 'If that email is registered, a reset link has been sent.'}), 200


# ─── Reset password — consume token ──────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    raw_token = (data.get('token') or '').strip()
    new_password = data.get('new_password', '')

    if not raw_token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400

    pw_errors = validate_password(new_password)
    if pw_errors:
        return jsonify({'error': ' '.join(pw_errors)}), 400

    reset_token = PasswordResetToken.query.filter_by(token=raw_token, used=False).first()
    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset link'}), 400
    if reset_token.expires_at < datetime.utcnow():
        reset_token.used = True
        db.session.commit()
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400

    user = User.query.get(reset_token.user_id)
    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    user.login_attempts = 0
    user.locked_until = None
    reset_token.used = True
    db.session.commit()

    return jsonify({'message': 'Password reset successfully. You can now log in.'}), 200
