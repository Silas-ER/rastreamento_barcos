import enum

from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.sql import func
from sqlalchemy import DateTime

from app.database import Base


class Cargo(str, enum.Enum):
    ADMIN = "admin"
    CONSULTA = "consulta"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    senha_hash = Column(String, nullable=False)
    cargo = Column(Enum(Cargo), nullable=False, default=Cargo.CONSULTA)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())


class Barco(Base):
    __tablename__ = "barcos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, index=True)
    mmsi = Column(String, unique=True, index=True, nullable=False)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
