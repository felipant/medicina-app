#!/usr/bin/env python3
"""
Gera arquivos SQL de INSERT a partir dos CSVs de medicamentos.
Produz seed_data.sql com todos os INSERTs em batches.
"""

import csv
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def escape_sql(val: str) -> str:
    """Escape single quotes for SQL strings."""
    if val is None:
        return "NULL"
    return val.replace("'", "''")

def read_csv(filename: str) -> list[dict]:
    filepath = os.path.join(SCRIPT_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def generate_inserts(table: str, rows: list[dict], columns: list[str], batch_size: int = 100) -> list[str]:
    """Generate INSERT statements in batches."""
    statements = []
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        values_parts = []
        for row in batch:
            vals = []
            for col in columns:
                v = row.get(col, '').strip()
                if v == '' or v.lower() == 'null':
                    vals.append('NULL')
                else:
                    try:
                        # Try numeric
                        if '.' in v:
                            float(v)
                            vals.append(v)
                        else:
                            int(v)
                            vals.append(v)
                    except ValueError:
                        vals.append(f"'{escape_sql(v)}'")
            values_parts.append(f"({', '.join(vals)})")
        
        cols_str = ', '.join(columns)
        values_str = ',\n'.join(values_parts)
        stmt = f"INSERT OR IGNORE INTO {table} ({cols_str}) VALUES\n{values_str};"
        statements.append(stmt)
    
    return statements

def main():
    output_file = os.path.join(SCRIPT_DIR, 'seed_data.sql')
    
    all_stmts = []
    
    # 1. Classes terapêuticas
    print("Processando classes_terapeuticas.csv...")
    rows = read_csv('classes_terapeuticas.csv')
    stmts = generate_inserts('classes_terapeuticas', rows, ['id', 'codigo', 'descricao'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows)} linhas, {len(stmts)} batches")
    
    # 2. Princípios ativos
    print("Processando principios_ativos.csv...")
    rows = read_csv('principios_ativos.csv')
    stmts = generate_inserts('principios_ativos', rows, ['id', 'nome'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows)} linhas, {len(stmts)} batches")
    
    # 3. Produtos
    print("Processando produtos.csv...")
    rows = read_csv('produtos.csv')
    stmts = generate_inserts('produtos', rows, ['id', 'nome_comercial', 'substancia_raw', 'tipo_produto'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows)} linhas, {len(stmts)} batches")
    
    # 4. Produto-princípio ativo
    print("Processando produto_principio_ativo.csv...")
    rows = read_csv('produto_principio_ativo.csv')
    stmts = generate_inserts('produto_principio_ativo', rows, ['produto_id', 'principio_ativo_id', 'ordem'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows)} linhas, {len(stmts)} batches")
    
    # 5. Apresentações
    print("Processando apresentacoes.csv...")
    rows = read_csv('apresentacoes.csv')
    cols = [
        'id', 'produto_id', 'classe_terapeutica_id', 'apresentacao_texto',
        'concentracao', 'forma_farmaceutica', 'forma_farmaceutica_sigla',
        'via_administracao', 'quantidade_apresentacao', 'unidade_apresentacao',
        'volume_apresentacao', 'dose_por_aplicacao', 'numero_doses',
        'preco_pmc_23_alc', 'status_parser'
    ]
    stmts = generate_inserts('apresentacoes', rows, cols)
    all_stmts.extend(stmts)
    print(f"  → {len(rows)} linhas, {len(stmts)} batches")
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Seed data for medicamentos tables\n")
        f.write("-- Generated automatically by generate_seed_sql.py\n\n")
        for stmt in all_stmts:
            f.write(stmt + "\n\n")
    
    total_size = os.path.getsize(output_file)
    print(f"\n✅ Gerado: {output_file}")
    print(f"   Tamanho: {total_size / 1024 / 1024:.2f} MB")
    print(f"   Total de batches: {len(all_stmts)}")

if __name__ == '__main__':
    main()
