"""
organizar_base_medicamentos.py
--------------------------------
ETL que lê a base bruta de medicamentos (formato CMED/ANVISA: uma linha por
apresentação/embalagem comercial) e a reorganiza em um esquema relacional
normalizado, pronto para subir em um banco SQL.

MODELO DE DADOS GERADO
-----------------------
principios_ativos            -> um registro por substância/princípio ativo
classes_terapeuticas         -> um registro por classe terapêutica (código + descrição)
produtos                     -> um registro por produto/nome comercial registrado
produto_principio_ativo      -> tabela de associação N:N (resolve medicamentos
                                 combinados, ex.: "DEXAMETASONA;CLOTRIMAZOL")
apresentacoes                -> um registro por embalagem/apresentação comercial
                                 (dose, forma farmacêutica, via, preço, etc.)

Uma view (vw_principio_ativo_completo) já entrega, para cada princípio ativo,
suas doses, apresentações, classe terapêutica, nomes comerciais e preços,
tudo em uma única consulta.

SAÍDAS
------
1. medicamentos.db      -> banco SQLite pronto para uso/consulta imediata
2. schema.sql           -> DDL portável (CREATE TABLE) para recriar o esquema
                            em PostgreSQL/MySQL/SQL Server
3. csv/*.csv            -> exportação de cada tabela normalizada, para import
                            via COPY (Postgres), LOAD DATA (MySQL) etc.

USO
---
    python organizar_base_medicamentos.py caminho/para/meds_normalized_v3.csv
"""

from __future__ import annotations

import re
import sqlite3
import sys
from pathlib import Path

import pandas as pd

# --------------------------------------------------------------------------- #
# Configuração
# --------------------------------------------------------------------------- #

COLUNAS_ORIGINAIS = {
    "SUBSTÂNCIA": "substancia",
    "PRODUTO": "produto",
    "APRESENTAÇÃO": "apresentacao_texto",
    "CLASSE TERAPÊUTICA": "classe_terapeutica",
    "TIPO DE PRODUTO (STATUS DO PRODUTO)": "tipo_produto",
    "PMC 23 %  ALC": "preco_pmc_23_alc",
    "concentracao": "concentracao",
    "forma_farmaceutica": "forma_farmaceutica",
    "forma_farmaceutica_original": "forma_farmaceutica_sigla",
    "via_administracao": "via_administracao",
    "quantidade_apresentacao": "quantidade_apresentacao",
    "unidade_apresentacao": "unidade_apresentacao",
    "volume_apresentacao": "volume_apresentacao",
    "dose_por_aplicacao": "dose_por_aplicacao",
    "numero_doses": "numero_doses",
    "status_parser": "status_parser",
}


def log(msg: str) -> None:
    print(f"[ETL] {msg}")


# --------------------------------------------------------------------------- #
# 1. Leitura e limpeza básica
# --------------------------------------------------------------------------- #

def ler_csv(caminho: Path) -> pd.DataFrame:
    log(f"Lendo {caminho} ...")
    df = pd.read_csv(caminho, encoding="utf-8-sig", dtype=str)
    df = df.rename(columns=COLUNAS_ORIGINAIS)

    faltando = set(COLUNAS_ORIGINAIS.values()) - set(df.columns)
    if faltando:
        raise ValueError(f"Colunas esperadas não encontradas no CSV: {faltando}")

    log(f"{len(df)} linhas lidas.")
    return df


def limpar_texto(serie: pd.Series) -> pd.Series:
    """Remove espaços duplicados e nas bordas; mantém NaN como NaN."""
    return (
        serie.astype("string")
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
        .replace({"": pd.NA, "-": pd.NA})
    )


def parse_preco_br(serie: pd.Series) -> pd.Series:
    """Converte string em formato BR ('1.234,56' ou '49,26') para float."""
    limpo = (
        serie.astype("string")
        .str.strip()
        .str.replace(".", "", regex=False)   # separador de milhar
        .str.replace(",", ".", regex=False)  # separador decimal
    )
    return pd.to_numeric(limpo, errors="coerce")


def limpar_base(df: pd.DataFrame) -> pd.DataFrame:
    log("Limpando texto e tipos numéricos ...")
    colunas_texto = [
        "substancia", "produto", "apresentacao_texto", "classe_terapeutica",
        "tipo_produto", "concentracao", "forma_farmaceutica",
        "forma_farmaceutica_sigla", "via_administracao", "unidade_apresentacao",
        "volume_apresentacao", "dose_por_aplicacao", "status_parser",
    ]
    for col in colunas_texto:
        df[col] = limpar_texto(df[col])

    df["preco_pmc_23_alc"] = parse_preco_br(df["preco_pmc_23_alc"])
    df["quantidade_apresentacao"] = pd.to_numeric(
        df["quantidade_apresentacao"], errors="coerce"
    )
    df["numero_doses"] = pd.to_numeric(df["numero_doses"], errors="coerce")

    # "-" usado como marcador de "não informado" em tipo_produto
    df["tipo_produto"] = df["tipo_produto"].replace({"-": pd.NA})

    antes = len(df)
    df = df.drop_duplicates()
    log(f"{antes - len(df)} linhas 100% duplicadas removidas ({len(df)} restantes).")

    # linhas sem substância ou sem produto não são aproveitáveis
    df = df.dropna(subset=["substancia", "produto"])
    df = df.reset_index(drop=True)
    return df


# --------------------------------------------------------------------------- #
# 2. Construção das tabelas normalizadas
# --------------------------------------------------------------------------- #

def montar_classes_terapeuticas(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Separa 'CÓDIGO - Descrição' em duas colunas e gera dimensão única."""
    log("Construindo dimensão classes_terapeuticas ...")
    partes = df["classe_terapeutica"].str.split(" - ", n=1, expand=True)
    codigo = partes[0].str.strip()
    descricao = partes[1].str.strip() if partes.shape[1] > 1 else pd.Series(pd.NA, index=df.index)

    dim = (
        pd.DataFrame({"codigo": codigo, "descricao": descricao})
        .dropna(subset=["codigo"])
        .drop_duplicates(subset=["codigo"])
        .sort_values("codigo")
        .reset_index(drop=True)
    )
    dim.insert(0, "id", range(1, len(dim) + 1))

    # chave de junção auxiliar (não vai para o banco)
    chave_join = codigo
    return dim, chave_join


def montar_principios_ativos(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Explode SUBSTÂNCIA (separada por ';' em combinações) em uma dimensão única."""
    log("Construindo dimensão principios_ativos ...")
    lista_ativos = df["substancia"].str.split(";")
    todos = sorted({a.strip() for sub in lista_ativos for a in sub if a.strip()})

    dim = pd.DataFrame({"nome": todos})
    dim.insert(0, "id", range(1, len(dim) + 1))
    return dim, lista_ativos


def montar_produtos(df: pd.DataFrame) -> pd.DataFrame:
    """
    Um 'produto' é a combinação (nome comercial + composição + tipo de registro).
    Isso é necessário porque, nesta base, o mesmo nome comercial por vezes é
    reutilizado para composições diferentes (ex.: nomes genéricos = nome da
    substância) — agrupar só por nome geraria falsas fusões de produtos.
    """
    log("Construindo dimensão produtos ...")
    dim = (
        df[["produto", "substancia", "tipo_produto"]]
        .drop_duplicates()
        .rename(columns={"produto": "nome_comercial", "substancia": "substancia_raw"})
        .sort_values(["nome_comercial", "substancia_raw"])
        .reset_index(drop=True)
    )
    dim.insert(0, "id", range(1, len(dim) + 1))
    return dim


def montar_produto_principio_ativo(
    produtos: pd.DataFrame, principios: pd.DataFrame
) -> pd.DataFrame:
    """Tabela de associação N:N entre produtos e princípios ativos (resolve combos)."""
    log("Construindo tabela de associação produto_principio_ativo ...")
    mapa_ativo_id = dict(zip(principios["nome"], principios["id"]))

    linhas = []
    for produto_id, substancia_raw in zip(produtos["id"], produtos["substancia_raw"]):
        for ordem, nome_ativo in enumerate(substancia_raw.split(";"), start=1):
            nome_ativo = nome_ativo.strip()
            if not nome_ativo:
                continue
            linhas.append(
                {
                    "produto_id": produto_id,
                    "principio_ativo_id": mapa_ativo_id[nome_ativo],
                    "ordem": ordem,
                }
            )
    return pd.DataFrame(linhas)


def montar_apresentacoes(
    df: pd.DataFrame, produtos: pd.DataFrame, classes: pd.DataFrame, classe_codigo_por_linha: pd.Series
) -> pd.DataFrame:
    """Uma linha por embalagem/apresentação comercial (nível de preço)."""
    log("Construindo fato apresentacoes ...")

    chave_produto = df[["produto", "substancia", "tipo_produto"]].rename(
        columns={"produto": "nome_comercial", "substancia": "substancia_raw"}
    )
    produto_id = chave_produto.merge(
        produtos[["id", "nome_comercial", "substancia_raw", "tipo_produto"]],
        on=["nome_comercial", "substancia_raw", "tipo_produto"],
        how="left",
    )["id"]

    classe_id = classe_codigo_por_linha.map(
        dict(zip(classes["codigo"], classes["id"]))
    )

    fato = pd.DataFrame(
        {
            "produto_id": produto_id,
            "classe_terapeutica_id": classe_id,
            "apresentacao_texto": df["apresentacao_texto"],
            "concentracao": df["concentracao"],
            "forma_farmaceutica": df["forma_farmaceutica"],
            "forma_farmaceutica_sigla": df["forma_farmaceutica_sigla"],
            "via_administracao": df["via_administracao"],
            "quantidade_apresentacao": df["quantidade_apresentacao"],
            "unidade_apresentacao": df["unidade_apresentacao"],
            "volume_apresentacao": df["volume_apresentacao"],
            "dose_por_aplicacao": df["dose_por_aplicacao"],
            "numero_doses": df["numero_doses"],
            "preco_pmc_23_alc": df["preco_pmc_23_alc"],
            "status_parser": df["status_parser"],
        }
    ).reset_index(drop=True)
    fato.insert(0, "id", range(1, len(fato) + 1))

    if fato["produto_id"].isna().any():
        n = fato["produto_id"].isna().sum()
        raise RuntimeError(f"{n} apresentações não foram associadas a um produto (bug de junção).")

    return fato


# --------------------------------------------------------------------------- #
# 3. Persistência em SQL
# --------------------------------------------------------------------------- #

DDL = """
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

-- View de conveniência: para cada princípio ativo, já traz dose, apresentação,
-- classe terapêutica, nome comercial e preço em uma única linha.
CREATE VIEW vw_principio_ativo_completo AS
SELECT
    pa.id                    AS principio_ativo_id,
    pa.nome                  AS principio_ativo,
    p.id                     AS produto_id,
    p.nome_comercial,
    p.tipo_produto,
    ct.codigo                AS classe_codigo,
    ct.descricao             AS classe_descricao,
    a.id                     AS apresentacao_id,
    a.apresentacao_texto,
    a.concentracao,
    a.forma_farmaceutica,
    a.via_administracao,
    a.quantidade_apresentacao,
    a.unidade_apresentacao,
    a.volume_apresentacao,
    a.dose_por_aplicacao,
    a.numero_doses,
    a.preco_pmc_23_alc
FROM principios_ativos pa
JOIN produto_principio_ativo ppa ON ppa.principio_ativo_id = pa.id
JOIN produtos p                  ON p.id = ppa.produto_id
JOIN apresentacoes a             ON a.produto_id = p.id
LEFT JOIN classes_terapeuticas ct ON ct.id = a.classe_terapeutica_id;
"""


def gravar_sqlite(caminho_db: Path, tabelas: dict[str, pd.DataFrame]) -> None:
    log(f"Gravando banco SQLite em {caminho_db} ...")
    if caminho_db.exists():
        caminho_db.unlink()

    conn = sqlite3.connect(caminho_db)
    try:
        conn.executescript(DDL)
        for nome, df in tabelas.items():
            df.to_sql(nome, conn, if_exists="append", index=False)
        conn.commit()
    finally:
        conn.close()
    log("Banco SQLite gravado com sucesso.")


def gravar_schema_sql(caminho: Path) -> None:
    """DDL portável (sem a sintaxe de VIEW específica do SQLite) para outros SGBDs."""
    ddl_portavel = DDL.split("-- View de conveniência")[0].strip() + "\n"
    caminho.write_text(ddl_portavel, encoding="utf-8")
    log(f"schema.sql gravado em {caminho}")


def gravar_csvs(pasta: Path, tabelas: dict[str, pd.DataFrame]) -> None:
    pasta.mkdir(parents=True, exist_ok=True)
    for nome, df in tabelas.items():
        caminho = pasta / f"{nome}.csv"
        df.to_csv(caminho, index=False, encoding="utf-8")
        log(f"  {caminho.name}: {len(df)} linhas")


# --------------------------------------------------------------------------- #
# 4. Orquestração
# --------------------------------------------------------------------------- #

def executar(caminho_csv: Path, pasta_saida: Path) -> None:
    pasta_saida.mkdir(parents=True, exist_ok=True)

    df = ler_csv(caminho_csv)
    df = limpar_base(df)

    classes, classe_codigo_por_linha = montar_classes_terapeuticas(df)
    principios, _ = montar_principios_ativos(df)
    produtos = montar_produtos(df)
    ppa = montar_produto_principio_ativo(produtos, principios)
    apresentacoes = montar_apresentacoes(df, produtos, classes, classe_codigo_por_linha)

    tabelas = {
        "classes_terapeuticas": classes,
        "principios_ativos": principios,
        "produtos": produtos,
        "produto_principio_ativo": ppa,
        "apresentacoes": apresentacoes,
    }

    log("Resumo das tabelas geradas:")
    for nome, tab in tabelas.items():
        log(f"  {nome}: {len(tab)} linhas")

    gravar_sqlite(pasta_saida / "medicamentos.db", tabelas)
    gravar_schema_sql(pasta_saida / "schema.sql")
    gravar_csvs(pasta_saida / "csv", tabelas)

    log("Concluído.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python organizar_base_medicamentos.py <caminho_para_csv>")
        sys.exit(1)

    caminho_csv = Path(sys.argv[1])
    pasta_saida = Path("saida_sql")
    executar(caminho_csv, pasta_saida)
