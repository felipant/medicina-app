#!/usr/bin/env python3
"""
Gera arquivos SQL de INSERT a partir dos CSVs de medicamentos.
Produz seed_data.sql com todos os INSERTs em batches.
"""

import csv
import os
import sys
import sqlite3

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
                v = row.get(col, '')
                if v is None or v == '' or v.lower() == 'null' or v == '<NA>':
                    vals.append('NULL')
                else:
                    v = str(v).strip()
                    try:
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
    db_file = os.path.join(SCRIPT_DIR, 'medicamentos.db')
    schema_file = os.path.join(SCRIPT_DIR, 'schema.sql')
    
    all_stmts = []
    
    # 1. Classes terapêuticas
    print("Processando classes_terapeuticas.csv...")
    rows_class = read_csv('classes_terapeuticas.csv')
    stmts = generate_inserts('classes_terapeuticas', rows_class, ['id', 'codigo', 'descricao'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows_class)} linhas, {len(stmts)} batches")
    
    # 2. Princípios ativos
    print("Processando principios_ativos.csv...")
    rows_pa = read_csv('principios_ativos.csv')
    stmts = generate_inserts('principios_ativos', rows_pa, ['id', 'nome'])
    all_stmts.extend(stmts)
    print(f"  → {len(rows_pa)} linhas, {len(stmts)} batches")
    
    # 3. Apresentações
    print("Processando apresentacoes.csv...")
    rows_apr = read_csv('apresentacoes.csv')
    cols_apr = ['id', 'principio_ativo_id', 'classe_terapeutica_id', 'concentracao', 'forma_farmaceutica', 'via_administracao']
    stmts = generate_inserts('apresentacoes', rows_apr, cols_apr)
    all_stmts.extend(stmts)
    print(f"  → {len(rows_apr)} linhas, {len(stmts)} batches")
    
    # Escrever seed_data.sql
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- Seed data para medicina-app-db\n\n")
        for stmt in all_stmts:
            f.write(stmt + "\n\n")
    print(f"✅ {output_file} gerado com {len(all_stmts)} batches.")
    
    # Atualizar SQLite local (medicamentos.db)
    if os.path.exists(db_file):
        os.remove(db_file)
    
    conn = sqlite3.connect(db_file)
    with open(schema_file, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    
    with open(output_file, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print(f"✅ {db_file} recriado com sucesso.")

if __name__ == '__main__':
    main()
