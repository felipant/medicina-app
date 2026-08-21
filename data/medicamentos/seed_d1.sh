#!/usr/bin/env bash
# seed_d1.sh — Popula a base D1 com dados de medicamentos
# Uso:
#   ./seed_d1.sh          → popula D1 LOCAL (dev)
#   ./seed_d1.sh --remote → popula D1 REMOTO (produção)
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

echo "📋 1. Criando tabelas (schema.sql)..."
npx wrangler d1 execute "$DB_NAME" --file="$SCRIPT_DIR/schema.sql" $REMOTE_FLAG || echo "   (tabelas podem já existir)"

echo ""
echo "🐍 2. Gerando SQL de seed a partir dos CSVs..."
python3 "$SCRIPT_DIR/generate_seed_sql.py"

SEED_FILE="$SCRIPT_DIR/seed_data.sql"
if [[ ! -f "$SEED_FILE" ]]; then
    echo "❌ Arquivo seed_data.sql não foi gerado."
    exit 1
fi

# Split large SQL file into smaller chunks for D1 (max ~100KB per execution)
echo ""
echo "📦 3. Importando dados para D1 em batches..."

# Use csplit or awk to split by empty lines (between statements)
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Split file: each statement ends with ";\n\n"
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
    if ! npx wrangler d1 execute "$DB_NAME" --file="$batch_file" $REMOTE_FLAG 2>/dev/null; then
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo "⚠️  $ERRORS batches com erros (dados duplicados são ignorados com INSERT OR IGNORE)."
else
    echo "✅ Todos os dados importados com sucesso!"
fi

echo ""
echo "📊 Verificando contagem de registros..."
npx wrangler d1 execute "$DB_NAME" --command="SELECT 'classes_terapeuticas' as tabela, count(*) as total FROM classes_terapeuticas UNION ALL SELECT 'principios_ativos', count(*) FROM principios_ativos UNION ALL SELECT 'produtos', count(*) FROM produtos UNION ALL SELECT 'produto_principio_ativo', count(*) FROM produto_principio_ativo UNION ALL SELECT 'apresentacoes', count(*) FROM apresentacoes;" $REMOTE_FLAG
