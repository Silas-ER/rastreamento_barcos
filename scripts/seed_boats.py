"""Popula a tabela `barcos` com a frota inicial. Rodar uma única vez: python -m scripts.seed_boats"""

from app.database import SessionLocal
from app.models import Barco

BARCOS = [
    ("CAMBORI", "710000586"),
    ("DONA ILVA", "710002698"),
    ("IBIZA", "710000959"),
    ("MARIA CLARA", "710019030"),
    ("KOPESCA", "710877298"),
    ("KOWALSKI V", "710809198"),
    ("KR III", "710005245"),
    ("NATAL PESCA VII", "710000799"),
    ("OULED SI MOHAND", "710000136"),
    ("NATAL PESCA IX", "710000812"),
    ("RIO JAPURA", "108000317"),
    ("RIO POTENGI", "710001955"),
    ("TUNASA I", "710000811"),
    ("LEAL SANTOS 7", "710000175"),
    ("MARLIN II", "710000138"),
    ("NETUNO S", "710002915"),
    ("TRANSMAR I", "710000004"),
    ("AZTECA III", "710005123"),
    ("GUADALAJARA", "710714091"),
    ("ROMULO", "710000375"),
    ("FILHO DA PROMESSA", "710003694"),
    ("STA PAULINA", "700000123"),
    ("MARBELLA I", "710199012"),
]


def main():
    db = SessionLocal()
    try:
        criados = 0
        for nome, mmsi in BARCOS:
            if db.query(Barco).filter(Barco.mmsi == mmsi).first():
                print(f"Pulado (MMSI já cadastrado): {nome} ({mmsi})")
                continue
            db.add(Barco(nome=nome, mmsi=mmsi))
            criados += 1
        db.commit()
        print(f"{criados} barcos criados.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
