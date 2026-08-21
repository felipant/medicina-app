#!/usr/bin/env python3
"""
Gera src/lib/utils/zscoreCalculator.ts contendo as tabelas LMS da OMS (WHO)
para 0 a 5 anos (por dia) e 5 a 19 anos (por mês), com cálculo automático de Z-score.
"""

import csv
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '../..'))
OUT_FILE = os.path.join(PROJECT_ROOT, 'src/lib/utils/zscoreCalculator.ts')

def read_lms_csv(filepath, key_col):
    res = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            l = float(row['L'])
            m = float(row['M'])
            s = float(row['S'])
            res.append([round(l, 4), round(m, 4), round(s, 5)])
    return res

# 0-5 anos (dias 0 a 1856)
wfa_m = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/wfa-boys-zscore-expanded-tables.csv'), 'Day')
wfa_f = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/wfa-girls-zscore-expanded-tables.csv'), 'Day')
lhfa_m = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/lhfa-boys-zscore-expanded-tables.csv'), 'Day')
lhfa_f = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/lhfa-girls-zscore-expanded-tables.csv'), 'Day')
hcfa_m = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/hcfa-boys-zscore-expanded-tables.csv'), 'Day')
hcfa_f = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/hcfa-girls-zscore-expanded-tables.csv'), 'Day')
bfa_m = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/bfa-boys-zscore-expanded-tables.csv'), 'Day')
bfa_f = read_lms_csv(os.path.join(SCRIPT_DIR, '0a5csv/bfa-girls-zscore-expanded-tables.csv'), 'Day')

# 5-19 anos (meses 61 a 228)
hfa5_m = read_lms_csv(os.path.join(SCRIPT_DIR, '5a19csv/hfa-boys-z-who-2007-exp.csv'), 'Month')
hfa5_f = read_lms_csv(os.path.join(SCRIPT_DIR, '5a19csv/hfa-girls-z-who-2007-exp.csv'), 'Month')
bmi5_m = read_lms_csv(os.path.join(SCRIPT_DIR, '5a19csv/bmi-boys-z-who-2007-exp.csv'), 'Month')
bmi5_f = read_lms_csv(os.path.join(SCRIPT_DIR, '5a19csv/bmi-girls-z-who-2007-exp.csv'), 'Month')

ts_code = f"""/**
 * Calculadora de Escore Z da OMS (WHO Child Growth Standards 0-5 anos & WHO Growth Reference 5-19 anos)
 * Gerado automaticamente a partir das tabelas oficiais LMS em data/zscore_csv.
 */

// Tipo [L, M, S]
export type LMS = [number, number, number];

// Tabelas 0 a 5 anos (índice = idade em dias, de 0 a 1856)
const WFA_M: LMS[] = {json.dumps(wfa_m)};
const WFA_F: LMS[] = {json.dumps(wfa_f)};

const LHFA_M: LMS[] = {json.dumps(lhfa_m)};
const LHFA_F: LMS[] = {json.dumps(lhfa_f)};

const HCFA_M: LMS[] = {json.dumps(hcfa_m)};
const HCFA_F: LMS[] = {json.dumps(hcfa_f)};

const BFA_M: LMS[] = {json.dumps(bfa_m)};
const BFA_F: LMS[] = {json.dumps(bfa_f)};

// Tabelas 5 a 19 anos (índice 0 = mês 61, índice 167 = mês 228)
const HFA5_M: LMS[] = {json.dumps(hfa5_m)};
const HFA5_F: LMS[] = {json.dumps(hfa5_f)};

const BMI5_M: LMS[] = {json.dumps(bmi5_m)};
const BMI5_F: LMS[] = {json.dumps(bmi5_f)};

/**
 * Fórmula Box-Cox LMS da OMS com ajuste de caudas restrito (|Z| > 3).
 */
export function calculateLMSZScore(val: number, l: number, m: number, s: number): number | null {{
	if (val <= 0 || m <= 0 || s <= 0 || isNaN(val)) return null;

	let z: number;
	if (Math.abs(l) > 0.0001) {{
		z = (Math.pow(val / m, l) - 1.0) / (l * s);
	}} else {{
		z = Math.log(val / m) / s;
	}}

	// Ajuste de cauda da OMS para valores extremos
	if (z > 3.0) {{
		const sd3pos = m * Math.pow(1.0 + l * s * 3.0, 1.0 / l);
		const sd2pos = m * Math.pow(1.0 + l * s * 2.0, 1.0 / l);
		const sd23pos = sd3pos - sd2pos;
		if (sd23pos > 0) {{
			z = 3.0 + (val - sd3pos) / sd23pos;
		}}
	}} else if (z < -3.0) {{
		const sd3neg = m * Math.pow(1.0 + l * s * -3.0, 1.0 / l);
		const sd2neg = m * Math.pow(1.0 + l * s * -2.0, 1.0 / l);
		const sd23neg = sd2neg - sd3neg;
		if (sd23neg > 0) {{
			z = -3.0 + (val - sd3neg) / sd23neg;
		}}
	}}

	return isNaN(z) ? null : z;
}}

/**
 * Formata o valor de escore Z para padrão clínico brasileiro (ex: "+0,45", "-1,20", "0,00").
 */
export function formatZScore(z: number | null): string {{
	if (z === null || isNaN(z)) return '';
	const rounded = Math.round(z * 100) / 100;
	const sign = rounded > 0 ? '+' : '';
	return `${{sign}}${{rounded.toFixed(2).replace('.', ',')}}`;
}}

/**
 * Calcula a idade em dias e meses exatos entre nascimento e consulta.
 */
export function calculateAgeInDays(birthDateStr: string, consultDateStr?: string): {{ days: number; months: number; years: number }} | null {{
	if (!birthDateStr) return null;
	const birth = new Date(birthDateStr + 'T00:00:00');
	const consult = consultDateStr ? new Date(consultDateStr + 'T00:00:00') : new Date();

	if (isNaN(birth.getTime()) || isNaN(consult.getTime())) return null;

	const diffTime = consult.getTime() - birth.getTime();
	if (diffTime < 0) return null;

	const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	const months = days / 30.4375;
	const years = days / 365.25;

	return {{ days, months, years }};
}}

export interface ZScoreInput {{
	sexo: string; // 'M' ou 'F'
	dataNascimento: string;
	dataConsulta?: string;
	pesoKg?: number | string;
	alturaCm?: number | string;
	pcCm?: number | string;
	imc?: number | string;
}}

export interface ZScoreResult {{
	zPeso: string;
	zEstatura: string;
	zImc: string;
	zPc: string;
	rawZPeso: number | null;
	rawZEstatura: number | null;
	rawZImc: number | null;
	rawZPc: number | null;
	idadeDias: number;
	idadeMeses: number;
}}

/**
 * Calcula automaticamente todos os 4 escores Z (Peso, Estatura, IMC, Perímetro Cefálico).
 */
export function calculateAllZScores(input: ZScoreInput): ZScoreResult | null {{
	const age = calculateAgeInDays(input.dataNascimento, input.dataConsulta);
	if (!age) return null;

	const isMale = input.sexo?.toUpperCase() === 'M';
	const isFemale = input.sexo?.toUpperCase() === 'F';
	if (!isMale && !isFemale) return null;

	const days = Math.min(Math.max(0, age.days), 1856);
	const monthInt = Math.floor(age.months);

	const peso = typeof input.pesoKg === 'string' ? parseFloat(input.pesoKg.replace(',', '.')) : (input.pesoKg || 0);
	const altura = typeof input.alturaCm === 'string' ? parseFloat(input.alturaCm.replace(',', '.')) : (input.alturaCm || 0);
	const pc = typeof input.pcCm === 'string' ? parseFloat(input.pcCm.replace(',', '.')) : (input.pcCm || 0);
	let imc = typeof input.imc === 'string' ? parseFloat(input.imc.replace(',', '.')) : (input.imc || 0);

	if ((!imc || imc <= 0) && peso > 0 && altura > 0) {{
		const hM = altura / 100;
		imc = peso / (hM * hM);
	}}

	let rawZPeso: number | null = null;
	let rawZEstatura: number | null = null;
	let rawZImc: number | null = null;
	let rawZPc: number | null = null;

	// ── 0 a 5 anos (0 a 1856 dias) ──
	if (age.days <= 1856) {{
		const wTable = isMale ? WFA_M : WFA_F;
		const hTable = isMale ? LHFA_M : LHFA_F;
		const pcTable = isMale ? HCFA_M : HCFA_F;
		const bTable = isMale ? BFA_M : BFA_F;

		if (peso > 0 && wTable[days]) {{
			const [l, m, s] = wTable[days];
			rawZPeso = calculateLMSZScore(peso, l, m, s);
		}}

		if (altura > 0 && hTable[days]) {{
			const [l, m, s] = hTable[days];
			rawZEstatura = calculateLMSZScore(altura, l, m, s);
		}}

		if (pc > 0 && pcTable[days]) {{
			const [l, m, s] = pcTable[days];
			rawZPc = calculateLMSZScore(pc, l, m, s);
		}}

		if (imc > 0 && bTable[days]) {{
			const [l, m, s] = bTable[days];
			rawZImc = calculateLMSZScore(imc, l, m, s);
		}}
	}} else if (monthInt >= 61 && monthInt <= 228) {{
		// ── 5 a 19 anos (61 a 228 meses) ──
		const mIdx = Math.min(Math.max(0, monthInt - 61), 167);
		const h5Table = isMale ? HFA5_M : HFA5_F;
		const bmi5Table = isMale ? BMI5_M : BMI5_F;

		if (altura > 0 && h5Table[mIdx]) {{
			const [l, m, s] = h5Table[mIdx];
			rawZEstatura = calculateLMSZScore(altura, l, m, s);
		}}

		if (imc > 0 && bmi5Table[mIdx]) {{
			const [l, m, s] = bmi5Table[mIdx];
			rawZImc = calculateLMSZScore(imc, l, m, s);
		}}
	}}

	return {{
		zPeso: formatZScore(rawZPeso),
		zEstatura: formatZScore(rawZEstatura),
		zImc: formatZScore(rawZImc),
		zPc: formatZScore(rawZPc),
		rawZPeso,
		rawZEstatura,
		rawZImc,
		rawZPc,
		idadeDias: age.days,
		idadeMeses: age.months
	}};
}}
"""

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write(ts_code)

print(f"✅ Gerado com sucesso: {OUT_FILE}")
print(f"   Tamanho: {os.path.getsize(OUT_FILE) / 1024:.1f} KB")
