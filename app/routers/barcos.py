import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, requer_admin
from app.database import get_db
from app.models import Barco
from app.schemas import (
    BarcoAtual,
    BarcoCreate,
    BarcoOut,
    BarcoUpdate,
    PontoHistorico,
    ResultadoPesquisa,
)
from app.services import gfw

logger = logging.getLogger(__name__)

DIAS_VALIDOS = (5, 10, 15, 30)

router = APIRouter(
    prefix="/barcos",
    tags=["barcos"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/", response_model=list[BarcoOut])
def listar_barcos(db: Session = Depends(get_db)):
    return db.query(Barco).all()


@router.get("/rastreamento/atual", response_model=list[BarcoAtual])
def rastreamento_atual(db: Session = Depends(get_db)):
    """Posição atual (via GFW) de todos os barcos cadastrados no banco."""
    barcos = db.query(Barco).all()
    resultado: list[BarcoAtual] = []

    for barco in barcos:
        posicao = None
        try:
            posicao = gfw.obter_status_atual(barco.mmsi)
        except gfw.GFWError as exc:
            logger.warning("Falha ao obter posição atual do barco %s (%s): %s", barco.id, barco.mmsi, exc)

        resultado.append(
            BarcoAtual(
                id=barco.id,
                nome=barco.nome,
                mmsi=barco.mmsi,
                lat=posicao.get("lat") if posicao else None,
                lon=posicao.get("lon") if posicao else None,
                timestamp=posicao.get("timestamp") if posicao else None,
            )
        )

    return resultado


@router.get("/pesquisa", response_model=list[ResultadoPesquisa])
def pesquisar_barcos(
    nome: str | None = None,
    mmsi: str | None = None,
    db: Session = Depends(get_db),
):
    """Pesquisa embarcações diretamente na API externa do GFW, por nome ou MMSI."""
    if not nome and not mmsi:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Informe ao menos um dos parâmetros: nome ou mmsi",
        )

    try:
        itens = gfw.buscar(nome=nome, mmsi=mmsi)
    except gfw.GFWError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao consultar a API externa: {exc}",
        ) from exc

    mmsis_cadastrados = {
        b.mmsi: b.id for b in db.query(Barco).all()
    }

    resultado: list[ResultadoPesquisa] = []
    for item in itens:
        item_mmsi = str(item.get("mmsi") or "")
        resultado.append(
            ResultadoPesquisa(
                id=mmsis_cadastrados.get(item_mmsi),
                nome=str(item.get("nome") or "Desconhecido"),
                mmsi=item_mmsi,
                cadastrado=item_mmsi in mmsis_cadastrados,
                vigente=bool(item.get("vigente", True)),
            )
        )

    return resultado


@router.get("/{barco_id}", response_model=BarcoOut)
def obter_barco(barco_id: int, db: Session = Depends(get_db)):
    barco = db.get(Barco, barco_id)
    if not barco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barco não encontrado")
    return barco


@router.get("/{barco_id}/historico", response_model=list[PontoHistorico])
def historico_barco(barco_id: int, dias: int = 5, db: Session = Depends(get_db)):
    if dias not in DIAS_VALIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Parâmetro 'dias' deve ser um dos valores: {DIAS_VALIDOS}",
        )

    barco = db.get(Barco, barco_id)
    if not barco:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barco não encontrado")

    date_init, date_final = gfw.calcular_periodo(dias)

    try:
        pontos = gfw.obter_historico(barco.mmsi, date_init, date_final)
    except gfw.GFWError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao consultar a API externa: {exc}",
        ) from exc

    return [PontoHistorico(lat=p.get("lat"), lon=p.get("lon"), timestamp=p.get("timestamp")) for p in pontos]


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
