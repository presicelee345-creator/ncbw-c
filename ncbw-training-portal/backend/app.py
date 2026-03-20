from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from models import db
from routes import auth_bp, tracks_bp, quizzes_bp, admin_bp, reports_bp
# ( will change ) from routes import auth_bp, tracks_bp, quizzes_bp, admin_bp, reports_bp, certificates_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)
    CORS(app, origins=[app.config['FRONTEND_URL']], supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tracks_bp, url_prefix='/api/tracks')
    app.register_blueprint(quizzes_bp, url_prefix='/api/quizzes')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    # will change / app.register_blueprint(certificates_bp, url_prefix='/api/certificates')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'NCBW Training Portal API is running'}

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
