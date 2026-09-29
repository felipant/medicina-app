-- limpeza_d1.sql
-- Script de Limpeza, Deduplicação e Otimização para Cloudflare D1 (medicina-app-db)

-- 1. Excluir tabelas em desuso
DROP TABLE IF EXISTS produto_principio_ativo;
DROP TABLE IF EXISTS principios_ativos;

-- 2. Recriar tabela apresentacoes apenas com colunas essenciais e restrição UNIQUE de deduplicação
CREATE TABLE IF NOT EXISTS apresentacoes_nova (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id            INTEGER NOT NULL REFERENCES produtos(id),
    classe_terapeutica_id INTEGER REFERENCES classes_terapeuticas(id),
    concentracao          TEXT,
    forma_farmaceutica    TEXT,
    via_administracao     TEXT,
    UNIQUE(produto_id, classe_terapeutica_id, concentracao, forma_farmaceutica, via_administracao)
);

-- 3. Copiar apenas registros únicos (deduplicados) tratando espaços
INSERT OR IGNORE INTO apresentacoes_nova (produto_id, classe_terapeutica_id, concentracao, forma_farmaceutica, via_administracao)
SELECT 
    produto_id, 
    classe_terapeutica_id, 
    TRIM(concentracao) as concentracao, 
    TRIM(forma_farmaceutica) as forma_farmaceutica, 
    TRIM(via_administracao) as via_administracao
FROM apresentacoes
GROUP BY 
    produto_id, 
    classe_terapeutica_id, 
    TRIM(concentracao), 
    TRIM(forma_farmaceutica), 
    TRIM(via_administracao);

-- 4. Substituir a tabela antiga pela nova
DROP TABLE apresentacoes;
ALTER TABLE apresentacoes_nova RENAME TO apresentacoes;

-- 5. Recriar índices essenciais para máxima performance
CREATE INDEX IF NOT EXISTS idx_apresentacoes_produto_id ON apresentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_classe_id  ON apresentacoes(classe_terapeutica_id);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_forma      ON apresentacoes(forma_farmaceutica);
CREATE INDEX IF NOT EXISTS idx_apresentacoes_via        ON apresentacoes(via_administracao);
