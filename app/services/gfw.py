"""Integração com a API do Global Fishing Watch (GFW).

Substitui a antiga integração ShipDT (nunca funcionou — key sempre retornava erro).
A key de desenvolvedor do GFW (`API_KEY_GFW` no `.env`) é válida e as chamadas abaixo
foram validadas manualmente contra a API real (não é mock).

Base da API: https://gateway.api.globalfishingwatch.org/v3

Descobertas feitas ao integrar (2026-08-30), documentadas aqui porque não são óbvias
a partir da doc pública e foram confirmadas testando a API real:

1. Autenticação: header `Authorization: Bearer <API_KEY_GFW>` (JWT), como esperado.

2. NÃO existe um endpoint público de "vessel track" (trajeto contínuo de posições AIS)
   na API v3 do GFW. Isso foi confirmado tanto empiricamente (todas as variações
   testadas de `GET /v3/vessels/{id}/tracks?datasets[0]=...` retornaram 404/422,
   incluindo com os nomes de dataset "public-global-track:*" que aparecem em exemplos
   antigos da doc) quanto lendo o código-fonte do cliente Python oficial da GFW
   (`gfw-api-python-client` no GitHub), que só implementa os recursos `vessels`,
   `events`, `fourwings`, `insights`, `datasets`, `references` e `bulk_downloads` —
   não existe um recurso `tracks`.

   Por isso, "histórico de posições" e "posição atual" aqui são derivados da
   **Events API** (`POST /v3/events`), que retorna eventos (fishing, encounter,
   loitering, gap, port_visit) cada um com um único ponto `position: {lat, lon}` e
   um timestamp `start`/`end`. Isso é a aproximação mais próxima de um histórico de
   posições disponível publicamente para embarcações de pesca — e é justamente o
   caso de uso (fishing effort) para o qual a licença CC BY-NC do GFW foi pensada.

3. Endpoints REST usados:

   a) `GET /v3/vessels/search` — resolve nome/MMSI em identidade de embarcação.
      Query params: `query` (texto livre — aceita tanto MMSI quanto nome/parte do
      nome), `datasets[0]=public-global-vessel-identity:latest`, `limit`.
      Resposta: `{"entries": [{"selfReportedInfo": [{"id", "ssvid", "shipname", ...}],
      "combinedSourcesInfo": [{"vesselId", "shiptypes": [{"name": "FISHING", ...}]}]}]}`.
      `selfReportedInfo[0].id` é o `vesselId` estável usado nos demais endpoints;
      `ssvid` é o MMSI.

   b) `POST /v3/events` — lista eventos de uma ou mais embarcações num período.
      Body (JSON, camelCase): `{"datasets": [...], "vessels": [vesselId],
      "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}`.
      Query params: `limit`, `offset`, `sort` — deve ser exatamente um dos valores
      `+start`, `-start`, `+end`, `-end` (o sinal `+`/`-` é obrigatório; usar
      apenas `"start"` retorna `422 Unprocessable Entity`, descoberto testando a
      API real). `+start` = mais antigo primeiro, `-start` = mais recente primeiro.
      Datasets válidos para eventos (todos versionados como `:latest`):
      `public-global-fishing-events`, `public-global-encounters-events`,
      `public-global-loitering-events`, `public-global-gaps-events`,
      `public-global-port-visits-events`.
      Resposta: `{"total": N, "entries": [{"start", "end", "type",
      "position": {"lat", "lon"}, "vessel": {"id", "ssvid", "name", ...}, ...}]}`.
      Status HTTP de sucesso observado: `201` (não `200`).

4. Formato de data: string `YYYY-MM-DD` (mesmo formato usado na integração anterior).

5. Paginação: `limit`/`offset` nos query params; resposta traz `total` e
   `nextOffset`. Não há necessidade de paginar aqui pois os `limit`s usados são
   suficientes para os períodos de até 30 dias exigidos pelo contrato do endpoint 2.
"""

import os
from datetime import date, datetime, timedelta
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

_API_KEY = os.environ.get("API_KEY_GFW", "").strip()
_BASE_URL = "https://gateway.api.globalfishingwatch.org/v3"
_TIMEOUT = 15.0

_VESSEL_IDENTITY_DATASET = "public-global-vessel-identity:latest"
_EVENT_DATASETS = [
    "public-global-fishing-events:latest",
    "public-global-encounters-events:latest",
    "public-global-loitering-events:latest",
    "public-global-gaps-events:latest",
    "public-global-port-visits-events:latest",
]


class GFWError(Exception):
    """Erro ao comunicar com a API externa do Global Fishing Watch."""


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {_API_KEY}"}


def _get(path: str, params: dict[str, Any]) -> dict[str, Any]:
    try:
        resposta = httpx.get(f"{_BASE_URL}{path}", headers=_headers(), params=params, timeout=_TIMEOUT)
        resposta.raise_for_status()
    except httpx.TimeoutException as exc:
        raise GFWError("Tempo limite excedido ao consultar a API do GFW") from exc
    except httpx.HTTPStatusError as exc:
        raise GFWError(f"GFW retornou erro {exc.response.status_code}: {exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise GFWError(f"Falha ao consultar a API do GFW: {exc}") from exc

    try:
        return resposta.json()
    except ValueError as exc:
        raise GFWError("Resposta inválida (não-JSON) da API do GFW") from exc


def _post(path: str, params: dict[str, Any], body: dict[str, Any]) -> dict[str, Any]:
    try:
        resposta = httpx.post(
            f"{_BASE_URL}{path}", headers=_headers(), params=params, json=body, timeout=_TIMEOUT
        )
        resposta.raise_for_status()
    except httpx.TimeoutException as exc:
        raise GFWError("Tempo limite excedido ao consultar a API do GFW") from exc
    except httpx.HTTPStatusError as exc:
        raise GFWError(f"GFW retornou erro {exc.response.status_code}: {exc.response.text}") from exc
    except httpx.HTTPError as exc:
        raise GFWError(f"Falha ao consultar a API do GFW: {exc}") from exc

    try:
        return resposta.json()
    except ValueError as exc:
        raise GFWError("Resposta inválida (não-JSON) da API do GFW") from exc


def calcular_periodo(dias: int) -> tuple[str, str]:
    """Retorna (date_init, date_final) no formato YYYY-MM-DD, de hoje menos `dias` até hoje."""
    hoje = date.today()
    inicio = hoje - timedelta(days=dias)
    return inicio.isoformat(), hoje.isoformat()


def _buscar_entradas(query: str, limit: int = 10) -> list[dict[str, Any]]:
    payload = _get(
        "/vessels/search",
        {"query": query, "datasets[0]": _VESSEL_IDENTITY_DATASET, "limit": limit},
    )
    return payload.get("entries", []) or []


def _parse_transmission_date_to(info: dict[str, Any]) -> datetime:
    """Converte `transmissionDateTo` (ISO 8601, ex: '2026-08-13T12:27:54Z') em `datetime`.

    Esse é o campo retornado por `selfReportedInfo` em `/v3/vessels/search` que indica
    a data final da faixa de transmissões AIS daquele registro de identidade — usado
    para decidir qual registro é o "vigente" quando um mesmo MMSI tem múltiplos
    registros de identidade (nomes/IMO diferentes ao longo do tempo).
    """
    valor = info.get("transmissionDateTo")
    if not valor:
        return datetime.min
    try:
        return datetime.fromisoformat(str(valor).replace("Z", "+00:00"))
    except ValueError:
        return datetime.min


def _selfreported_infos_do_mmsi(mmsi: str, entradas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Achata todos os `selfReportedInfo` de todas as entradas que casam com o MMSI."""
    infos: list[dict[str, Any]] = []
    for entrada in entradas:
        for info in entrada.get("selfReportedInfo", []) or []:
            if str(info.get("ssvid") or "") == str(mmsi):
                infos.append(info)
    return infos


def resolver_vessel_id(mmsi: str) -> str | None:
    """Resolve o `vesselId` (identidade GFW) correspondente a um MMSI.

    Um mesmo MMSI pode ter múltiplos registros de identidade no GFW (`selfReportedInfo`),
    cada um cobrindo um período diferente de transmissões AIS (nome/IMO podem mudar ao
    longo do tempo). Para posição atual e histórico, o registro correto é sempre o mais
    recente, isto é, o de maior `transmissionDateTo` — caso contrário eventos poderiam
    ser buscados contra um `vesselId` de um registro antigo/inativo.
    """
    entradas = _buscar_entradas(mmsi, limit=10)
    infos = _selfreported_infos_do_mmsi(mmsi, entradas)
    if not infos:
        return None
    mais_recente = max(infos, key=_parse_transmission_date_to)
    return mais_recente.get("id")


def _eventos(vessel_id: str, date_init: str, date_final: str, limit: int, sort: str) -> list[dict[str, Any]]:
    body = {
        "datasets": _EVENT_DATASETS,
        "vessels": [vessel_id],
        "startDate": date_init,
        "endDate": date_final,
    }
    payload = _post("/events", {"limit": limit, "offset": 0, "sort": sort}, body)
    return payload.get("entries", []) or []


def _normalizar_evento(evento: dict[str, Any]) -> dict[str, Any]:
    posicao = evento.get("position") or {}
    return {
        "lat": posicao.get("lat"),
        "lon": posicao.get("lon"),
        "timestamp": evento.get("start"),
    }


def obter_status_atual(mmsi: str, janela_dias: int = 90) -> dict[str, Any] | None:
    """Posição mais recente conhecida (via eventos) de um MMSI, ou None se indisponível."""
    vessel_id = resolver_vessel_id(mmsi)
    if not vessel_id:
        return None

    date_init, date_final = calcular_periodo(janela_dias)
    eventos = _eventos(vessel_id, date_init, date_final, limit=1, sort="-start")
    if not eventos:
        return None

    return _normalizar_evento(eventos[0])


def obter_historico(mmsi: str, date_init: str, date_final: str) -> list[dict[str, Any]]:
    """Histórico de posições (via eventos) de um MMSI entre duas datas (formato YYYY-MM-DD)."""
    vessel_id = resolver_vessel_id(mmsi)
    if not vessel_id:
        return []

    eventos = _eventos(vessel_id, date_init, date_final, limit=1000, sort="+start")
    return [_normalizar_evento(evento) for evento in eventos]


def buscar(nome: str | None = None, mmsi: str | None = None) -> list[dict[str, Any]]:
    """Busca embarcações diretamente na API do GFW, por nome ou MMSI.

    Um mesmo MMSI pode ter vários registros de identidade no GFW (nomes/IMO diferentes
    ao longo do tempo, cada um cobrindo um período de transmissões AIS). Em vez de
    descartar as duplicatas, elas são mantidas (para não esconder o histórico de nomes
    do barco) mas ordenadas com o registro mais recente primeiro (maior
    `transmissionDateTo`) e marcadas com `vigente`: apenas o registro mais recente de
    cada MMSI tem `vigente=True`, os demais `vigente=False` — assim o usuário identifica
    rapidamente qual é o registro atual do barco.
    """
    query = mmsi if mmsi else nome
    entradas = _buscar_entradas(query or "", limit=25)

    infos_por_entrada: list[dict[str, Any]] = []
    for entrada in entradas:
        infos = entrada.get("selfReportedInfo", []) or []
        if infos:
            infos_por_entrada.append(infos[0])

    infos_por_entrada.sort(key=_parse_transmission_date_to, reverse=True)

    mmsis_ja_vistos: set[str] = set()
    resultado: list[dict[str, Any]] = []
    for info in infos_por_entrada:
        item_mmsi = str(info.get("ssvid") or "")
        vigente = item_mmsi not in mmsis_ja_vistos
        mmsis_ja_vistos.add(item_mmsi)
        resultado.append(
            {
                "mmsi": item_mmsi,
                "nome": info.get("shipname") or "Desconhecido",
                "vigente": vigente,
            }
        )
    return resultado
