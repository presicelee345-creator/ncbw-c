# NCBW Training Portal — Full Stack

A complete leadership training portal for the **National Coalition of 100 Black Women, Queen City Metropolitan Chapter**.

- **Backend:** Python / Flask / SQLAlchemy / PostgreSQL / JWT
- **Frontend:** React 18 / TypeScript / Tailwind CSS / shadcn/ui

---

## Project Structure

```
ncbw-training-portal/
├── backend/                  # Python Flask API
│   ├── app.py                # App factory
│   ├── config.py             # Config from .env
│   ├── models/
│   │   └── models.py         # SQLAlchemy models
│   ├── routes/
│   │   ├── auth.py           # /api/auth  — register, login, password reset
│   │   ├── tracks.py         # /api/tracks — enroll, progress, complete
│   │   ├── quizzes.py        # /api/quizzes — fetch, submit
│   │   ├── admin.py          # /api/admin — trainees, tracks, quizzes, certs, emails
│   │   └── reports.py        # /api/reports — overview, analytics, engagement
│   ├── schema.sql            # Database schema reference
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
│
└── frontend/                 # React TypeScript app
    ├── src/
    │   ├── App.tsx            # Router + auth guard
    │   ├── api/
    │   │   ├── client.ts      # Axios + JWT interceptor
    │   │   └── index.ts       # All API calls
    │   ├── context/
    │   │   └── AuthContext.tsx # Auth state
    │   ├── components/
    │   │   ├── Sidebar.tsx    # NCBW branded sidebar
    │   │   ├── QuizModal.tsx  # Quiz with real submission
    │   │   └── ui/            # shadcn/ui components
    │   ├── pages/
    │   │   ├── LoginPage.tsx  # Sign in + Register + Forgot password
    │   │   ├── ProfilePage.tsx
    │   │   ├── TrackPage.tsx  # Track + courses + quizzes
    │   │   └── admin/
    │   │       ├── AdminLayout.tsx
    │   │       ├── AdminTrainees.tsx
    │   │       ├── AdminTracks.tsx
    │   │       ├── AdminQuizzes.tsx
    │   │       ├── AdminCertificates.tsx
    │   │       ├── AdminEmails.tsx
    │   │       └── AdminReports.tsx
    │   └── styles/
    │       └── globals.css    # Tailwind + NCBW gold/black theme
    ├── package.json
    ├── vite.config.ts         # Dev proxy → Flask :5000
    └── tsconfig.json
```

---

## Setup

### 1. Database (PostgreSQL)

```sql
CREATE USER ncbw_user WITH PASSWORD 'ncbw_password123';
CREATE DATABASE ncbw_training OWNER ncbw_user;
```

Then run `schema.sql` inside the database:

```bash
psql -U ncbw_user -d ncbw_training -f backend/schema.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your DB credentials and secret keys

python app.py
# Runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
# API calls proxy to http://localhost:5000
```

---

## Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Frontend origin (default: http://localhost:5173) |
| `MAIL_SERVER` | SMTP server for email (optional) |
| `MAIL_USERNAME` | SMTP username (optional) |
| `MAIL_PASSWORD` | SMTP password (optional) |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new trainee |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request reset link |
| POST | `/api/auth/reset-password` | Reset with token |
| GET | `/api/tracks/` | List all tracks |
| GET | `/api/tracks/:id` | Track with modules + progress |
| POST | `/api/tracks/:id/enroll` | Enroll in track |
| POST | `/api/tracks/courses/:id/complete` | Mark course complete |
| GET | `/api/quizzes/:id` | Get quiz (no answers) |
| POST | `/api/quizzes/:id/submit` | Submit answers |
| GET | `/api/admin/trainees` | All trainees with progress |
| GET/POST | `/api/admin/tracks` | Manage tracks |
| POST | `/api/admin/tracks/:id/modules` | Add module |
| POST | `/api/admin/modules/:id/courses` | Add course |
| GET/POST | `/api/admin/quizzes` | Manage quizzes |
| GET/POST | `/api/admin/certificate-templates` | Manage cert templates |
| GET/PUT | `/api/admin/email-templates` | Manage email templates |
| GET | `/api/reports/overview` | Dashboard stats |
| GET | `/api/reports/track-analytics` | Per-track analytics |
| GET | `/api/reports/engagement` | Daily active users |
| GET | `/api/reports/recent-activity` | Latest events |

---

## Default Admin Account

Create one via registration and then manually update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Features

- ✅ JWT authentication with refresh, lockout after 5 failed attempts
- ✅ Password reset via email token
- ✅ Trainee self-registration + admin-managed tracks
- ✅ Course completion tracking
- ✅ Module quizzes with pass/fail gating
- ✅ Certificate template management
- ✅ Email template management (SMTP configurable)
- ✅ Reports: enrollment, progress charts, engagement, recent activity
- ✅ NCBW black & gold branded UI (Tailwind + shadcn/ui)
