import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Barco

# Credenciais do admin seed (scripts/seed_admin.py)
ADMIN_EMAIL = "silasn1@live.com"
ADMIN_SENHA = "super@dministrador@88226"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token(client):
    resp = client.post(
        "/auth/login",
        json={"email": ADMIN_EMAIL, "senha": ADMIN_SENHA},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def barco_existente():
    """Retorna um barco já cadastrado no banco (o seed cadastra 23 embarcações)."""
    db = SessionLocal()
    try:
        barco = db.query(Barco).first()
        assert barco is not None, "Esperava ao menos um barco cadastrado no banco (rode scripts/seed_boats.py)"
        return {"id": barco.id, "nome": barco.nome, "mmsi": barco.mmsi}
    finally:
        db.close()
