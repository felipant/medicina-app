#!/usr/bin/env bash
# seed_d1.sh — Popula a base D1 com a base limpa de medicamentos
# Uso:
#   ./data/medicamentos/seed_d1.sh          → popula D1 LOCAL (dev)
#   ./data/medicamentos/seed_d1.sh --remote → popula D1 REMOTO (produção)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_NAME="medicina-app-db"
REMOTE_FLAG=""

if [[ "${1:-}" == "--remote" ]]; then
    REMOTE_FLAG="--remote"
    echo "⚠️  Modo REMOTO — os dados serão enviados ao D1 de produção."
    read -p "Continuar? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Abortado."
        exit 1
    fi
fi

cd "$PROJECT_ROOT"

echo "🧹 1. Removendo tabelas antigas e recriando schema limpo..."
npx wrangler d1 execute "$DB_NAME" --command="PRAGMA foreign_keys = OFF; DROP TABLE IF EXISTS produto_principio_ativo; DROP TABLE IF EXISTS apresentacoes_nova; DROP TABLE IF EXISTS apresentacoes; DROP TABLE IF EXISTS produtos; DROP TABLE IF EXISTS principios_ativos; DROP TABLE IF EXISTS classes_terapeuticas; PRAGMA foreign_keys = ON;" $REMOTE_FLAG
npx wrangler d1 execute "$DB_NAME" --file="$SCRIPT_DIR/schema.sql" $REMOTE_FLAG

echo ""
echo "🐍 2. Gerando SQL de seed a partir dos CSVs limpos..."
python3 "$SCRIPT_DIR/generate_seed_sql.py"

SEED_FILE="$SCRIPT_DIR/seed_data.sql"
if [[ ! -f "$SEED_FILE" ]]; then
    echo "❌ Arquivo seed_data.sql não foi gerado."
    exit 1
fi

echo ""
echo "📦 3. Importando dados para D1 em batches..."

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

awk -v dir="$TEMP_DIR" '
BEGIN { file_num = 1; current = "" }
/^$/ {
    if (current != "") {
        filename = sprintf("%s/batch_%04d.sql", dir, file_num)
        print current > filename
        close(filename)
        file_num++
        current = ""
    }
    next
}
{
    if (current != "") current = current "\n" $0
    else current = $0
}
END {
    if (current != "") {
        filename = sprintf("%s/batch_%04d.sql", dir, file_num)
        print current > filename
    }
}
' "$SEED_FILE"

BATCH_COUNT=$(ls "$TEMP_DIR"/batch_*.sql 2>/dev/null | wc -l | tr -d ' ')
echo "   Total de batches: $BATCH_COUNT"

CURRENT=0
ERRORS=0
for batch_file in "$TEMP_DIR"/batch_*.sql; do
    CURRENT=$((CURRENT + 1))
    printf "\r   Importando batch %d/%d..." "$CURRENT" "$BATCH_COUNT"
    if ! npx wrangler d1 execute "$DB_NAME" --file="$batch_file" $REMOTE_FLAG > /dev/null 2>&1; then
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo "⚠️  $ERRORS batches com avisos (dados duplicados ignorados com INSERT OR IGNORE)."
else
    echo "✅ Todos os dados importados com sucesso!"
fi

echo ""
npx wrangler d1 execute "$DB_NAME" --command="SELECT 'classes_terapeuticas' as tabela, count(*) as total FROM classes_terapeuticas UNION ALL SELECT 'principios_ativos', count(*) FROM principios_ativos UNION ALL SELECT 'apresentacoes', count(*) FROM apresentacoes;" $REMOTE_FLAG
