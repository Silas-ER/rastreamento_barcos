from pydantic import BaseModel, ConfigDict, EmailStr

from app.models import Cargo


class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    cargo: Cargo = Cargo.CONSULTA


class UsuarioCreate(UsuarioBase):
    senha: str


class UsuarioUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    cargo: Cargo | None = None
    senha: str | None = None


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class BarcoBase(BaseModel):
    nome: str
    mmsi: str


class BarcoCreate(BarcoBase):
    pass


class BarcoUpdate(BaseModel):
    nome: str | None = None
    mmsi: str | None = None


class BarcoOut(BarcoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
