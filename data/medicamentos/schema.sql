CREATE TABLE classes_terapeuticas (
    id          INTEGER PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,
    descricao   TEXT
);

CREATE TABLE principios_ativos (
    id      INTEGER PRIMARY KEY,
    nome    TEXT NOT NULL UNIQUE
);

CREATE TABLE produtos (
    id              INTEGER PRIMARY KEY,
    nome_comercial  TEXT NOT NULL,
    substancia_raw  TEXT NOT NULL,   -- texto original da coluna SUBSTÂNCIA (auditoria)
    tipo_produto    TEXT,            -- Genérico / Similar / Novo / Biológico / etc.
    UNIQUE (nome_comercial, substancia_raw, tipo_produto)
);

CREATE TABLE produto_principio_ativo (
    produto_id          INTEGER NOT NULL REFERENCES produtos(id),
    principio_ativo_id  INTEGER NOT NULL REFERENCES principios_ativos(id),
    ordem               INTEGER NOT NULL,  -- posição do ativo na combinação
    PRIMARY KEY (produto_id, principio_ativo_id)
);

CREATE TABLE apresentacoes (
    id                          INTEGER PRIMARY KEY,
    produto_id                  INTEGER NOT NULL REFERENCES produtos(id),
    classe_terapeutica_id       INTEGER REFERENCES classes_terapeuticas(id),
    apresentacao_texto          TEXT,     -- descrição completa da embalagem
    concentracao                TEXT,     -- dose por unidade/mL, ex.: "500 MG"
    forma_farmaceutica          TEXT,     -- ex.: comprimido revestido
    forma_farmaceutica_sigla    TEXT,     -- ex.: COM REV
    via_administracao           TEXT,     -- oral, tópica, intravenosa, ...
    quantidade_apresentacao     REAL,     -- nº de unidades na embalagem
    unidade_apresentacao        TEXT,     -- frasco-ampola, ampola, seringa, ...
    volume_apresentacao         TEXT,     -- ex.: "120 ML"
    dose_por_aplicacao          TEXT,     -- ex.: "50 MCG/DOSE" (sprays/inaláveis)
    numero_doses                REAL,     -- nº de doses na embalagem
    preco_pmc_23_alc            REAL,     -- preço máx. ao consumidor (23% ICMS)
    status_parser                TEXT     -- qualidade do parsing original
);

CREATE INDEX idx_principios_ativos_nome        ON principios_ativos(nome);
CREATE INDEX idx_produtos_nome_comercial       ON produtos(nome_comercial);
CREATE INDEX idx_apresentacoes_produto_id      ON apresentacoes(produto_id);
CREATE INDEX idx_apresentacoes_classe_id       ON apresentacoes(classe_terapeutica_id);
CREATE INDEX idx_ppa_principio_ativo_id        ON produto_principio_ativo(principio_ativo_id);
CREATE INDEX idx_ppa_produto_id                ON produto_principio_ativo(produto_id);
