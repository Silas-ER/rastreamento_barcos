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


class BarcoAtual(BaseModel):
    id: int
    nome: str
    mmsi: str
    lat: float | None = None
    lon: float | None = None
    timestamp: str | None = None


class PontoHistorico(BaseModel):
    lat: float | None = None
    lon: float | None = None
    timestamp: str | None = None


class ResultadoPesquisa(BaseModel):
    id: int | None = None
    nome: str
    mmsi: str
    cadastrado: bool = False
    vigente: bool = True
    """Indica se este é o registro de identidade mais recente (maior
    `transmissionDateTo`) para o MMSI, entre os possivelmente vários retornados pelo
    GFW. Quando um MMSI aparece mais de uma vez no resultado, apenas o mais recente
    tem `vigente=True`; os demais aparecem depois, ordenados do mais recente para o
    mais antigo, para o usuário identificar rapidamente qual é o registro atual do
    barco sem perder o histórico de nomes anteriores."""


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str
