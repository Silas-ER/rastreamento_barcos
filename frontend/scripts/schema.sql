CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'consulta' CHECK (cargo IN ('admin', 'consulta')),
    criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_usuarios_email ON usuarios (email);

CREATE TABLE IF NOT EXISTS barcos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    mmsi TEXT NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_barcos_nome ON barcos (nome);
CREATE INDEX IF NOT EXISTS ix_barcos_mmsi ON barcos (mmsi);
