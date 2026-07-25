# Decision Twin AI

> An AI-Powered Career Intelligence Platform

Decision Twin AI creates a continuously evolving **Digital Career Twin** — a high-fidelity representation of every student that learns from academic history, skills, interests, certifications, projects, career goals, psychometric traits, and behavioral signals to provide **explainable, data-driven career intelligence**.

## Architecture

```
Frontend (React/TypeScript)
    ↓
REST API (/api/v1)
    ↓
FastAPI (async)
    ↓
Service Layer → Repository Layer → SQLAlchemy ORM → PostgreSQL
    ↓
Feature Engineering → Vector Retrieval (FAISS) → ML Ranking (XGBoost)
    ↓
Recommendation + Explanation Engine → JSON Response
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.x (async), Pydantic v2 |
| **Database** | PostgreSQL 16, Alembic migrations |
| **Auth** | JWT (PyJWT), bcrypt (Passlib), RBAC |
| **Frontend** | React 18+, TypeScript, Vite, Zustand, Tailwind CSS |
| **ML** | XGBoost, scikit-learn, FAISS, Pandas, NumPy |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.12+ (for local development)
- Node.js 20+ (for frontend development)

### 1. Clone & Configure

```bash
git clone <repository-url>
cd "Decision Ai Twin"
cp .env.example .env
# Edit .env with your settings (especially JWT_SECRET_KEY)
```

### 2. Start with Docker Compose

```bash
# Production mode
docker-compose up -d

# Development mode (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 3. Run Migrations

```bash
# Inside the backend container
docker-compose exec backend alembic upgrade head
```

### 4. Verify

```bash
# Health check
curl http://localhost:8000/api/v1/health

# API documentation
open http://localhost:8000/docs
```

### Local Development (without Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend (Phase 4)
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with credentials |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Liveness probe |
| GET | `/api/v1/health/ready` | Readiness probe |

## Project Structure

```
Decision Ai Twin/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints
│   │   ├── core/               # Security, middleware, exceptions
│   │   ├── db/                 # Database session management
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── repositories/       # Data access layer
│   │   ├── services/           # Business logic layer
│   │   └── ml/                 # ML pipeline (Phase 3)
│   ├── alembic/                # Database migrations
│   └── tests/                  # Test suite
├── frontend/                   # React app (Phase 4)
├── docker-compose.yml
└── docker-compose.dev.yml
```

## Development

### Code Quality

```bash
cd backend
ruff check app/               # Linting
black --check app/             # Formatting
mypy app/                      # Type checking
pytest                         # Tests
```

## License

MIT
