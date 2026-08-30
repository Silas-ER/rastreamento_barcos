from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, requer_admin
from app.database import get_db
from app.models import Barco
from app.schemas import BarcoCreate, BarcoOut, BarcoUpdate

router = APIRouter(
    prefix="/barcos",
    tags=["barcos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[BarcoOut])
def listar_barcos(db: Session = Depends(get_db)):
    return db.query(Barco).all()


@router.get("/{barco_id}", response_model=BarcoOut)
def obter_barco(barco_id: int, db: Session = Depends(get_db)):
    barco = db.get(Barco, barco_id)
    if not barco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barco não encontrado")
    return barco


@router.post(
    "/",
    response_model=BarcoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requer_admin)],
)
def criar_barco(dados: BarcoCreate, db: Session = Depends(get_db)):
    if db.query(Barco).filter(Barco.mmsi == dados.mmsi).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MMSI já cadastrado")
    barco = Barco(nome=dados.nome, mmsi=dados.mmsi)
    db.add(barco)
    db.commit()
    db.refresh(barco)
    return barco


@router.put(
    "/{barco_id}",
    response_model=BarcoOut,
    dependencies=[Depends(requer_admin)],
)
def atualizar_barco(barco_id: int, dados: BarcoUpdate, db: Session = Depends(get_db)):
    barco = db.get(Barco, barco_id)
    if not barco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barco não encontrado")

    if dados.nome is not None:
        barco.nome = dados.nome
    if dados.mmsi is not None:
        barco.mmsi = dados.mmsi

    db.commit()
    db.refresh(barco)
    return barco


@router.delete(
    "/{barco_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requer_admin)],
)
def deletar_barco(barco_id: int, db: Session = Depends(get_db)):
    barco = db.get(Barco, barco_id)
    if not barco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barco não encontrado")
    db.delete(barco)
    db.commit()
