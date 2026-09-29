-- schema.sql — Modelo limpo de medicamentos baseado em princípios ativos

CREATE TABLE IF NOT EXISTS classes_terapeuticas (
    id          INTEGER PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    descricao   TEXT
);

CREATE TABLE IF NOT EXISTS principios_ativos (
    id      INTEGER PRIMARY KEY,
    nome    TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS apresentacoes (
    id                  INTEGER PRIMARY KEY,
    principio_ativo_id  INTEGER NOT NULL REFERENCES principios_ativos(id),
    classe_terapeutica_id INTEGER REFERENCES classes_terapeuticas(id),
    concentracao        TEXT,
    forma_farmaceutica  TEXT,
    via_administracao   TEXT
);

CREATE INDEX IF NOT EXISTS idx_principios_ativos_nome ON principios_ativos(nome);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_pa_id    ON apresentacoes(principio_ativo_id);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_classe_id ON apresentacoes(classe_terapeutica_id);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_forma    ON apresentacoes(forma_farmaceutica);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_via      ON apresentacoes(via_administracao);
