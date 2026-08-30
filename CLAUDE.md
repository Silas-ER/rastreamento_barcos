# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Refactor of a boat tracking system (`rastreamento_barcos`) that monitors boats and checks their position history. Backend is a FastAPI + SQLAlchemy + PostgreSQL API with JWT auth and role-based access (admin / consulta). A separate Next.js frontend (deployed on Vercel) is planned but not yet started — the backend must not assume same-origin with it.

## Commands

Install dependencies:
```
pip install -r requirements.txt
```

Run the dev server (from the repo root — note this differs from the command in README.md, which assumes running from inside `app/`):
```
uvicorn app.main:app --reload
```

Database migrations (Alembic):
```
alembic upgrade head                 # apply migrations
alembic revision --autogenerate -m "descrição"   # generate a new migration from model changes
```

Seed the first admin user (uses hardcoded credentials in the script — run once):
```
python -m scripts.seed_admin
```

There are no tests or a linter/formatter configured yet in this repo.

## Environment

Config is read from a `.env` file (via `python-dotenv`), not committed. Required variables:
- `CONNECTION_STRING` — SQLAlchemy database URL (`app/database.py`)
- `SECRET_KEY` — JWT signing key (`app/auth.py`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — optional, defaults to 480

## Architecture

- `app/main.py` — FastAPI app; wires up routers only, no logic.
- `app/database.py` — SQLAlchemy engine/session setup; `get_db()` dependency for per-request sessions.
- `app/models.py` — SQLAlchemy ORM models (`Usuario`, `Barco`) and the `Cargo` role enum (`admin`, `consulta`).
- `app/schemas.py` — Pydantic request/response schemas, separate from ORM models.
- `app/auth.py` — password hashing (passlib/bcrypt), JWT creation/decoding (python-jose), and the `get_current_user` / `requer_admin` FastAPI dependencies used to protect routes.
- `app/routers/` — one router per resource (`auth_router.py`, `usuarios.py`, `barcos.py`), each declaring its own `APIRouter` with prefix/tags and auth dependencies applied at the router level (e.g. `usuarios` requires admin for the whole router; `barcos` requires login for all routes and admin only for write routes).
- `alembic/` — migration environment (`env.py` reuses `app.database.Base.metadata` for autogenerate); `alembic.ini` has a placeholder `sqlalchemy.url` — the real URL comes from `CONNECTION_STRING` via `.env`, not from `alembic.ini`.
- `scripts/` — standalone one-off scripts run as modules (e.g. `python -m scripts.seed_admin`), not part of the API.

Auth model: login (`POST /auth/login`) issues a JWT with `sub` (email) and `cargo` (role) claims. Protected routes depend on `get_current_user` (any authenticated user) or `requer_admin` (must have `Cargo.ADMIN`).

As routes, models, and services grow, prefer extending this structure (e.g. `app/services/`) rather than accumulating logic in routers or `main.py`.
