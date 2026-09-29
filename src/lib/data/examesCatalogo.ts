export interface ExameCatalogoItem {
	material: string;
	nome: string;
	pacote: string;
	unidade: string;
	valoresReferencia: string;
}

export const EXAMES_CATALOGO: ExameCatalogoItem[] = [
	{ material: "Sangue", nome: "Hemácias", pacote: "Hemograma", unidade: "10⁶/µL", valoresReferencia: "M: 4.5-5.9 | F: 4.0-5.2" },
	{ material: "Sangue", nome: "Hemoglobina", pacote: "Hemograma", unidade: "g/dL", valoresReferencia: "M: 13.5-17.5 | F: 12.0-16.0" },
	{ material: "Sangue", nome: "Hematócrito", pacote: "Hemograma", unidade: "%", valoresReferencia: "M: 41-53 | F: 36-46" },
	{ material: "Sangue", nome: "VCM", pacote: "Hemograma", unidade: "fL", valoresReferencia: "80-100" },
	{ material: "Sangue", nome: "HCM", pacote: "Hemograma", unidade: "pg", valoresReferencia: "26-34" },
	{ material: "Sangue", nome: "CHCM", pacote: "Hemograma", unidade: "g/dL", valoresReferencia: "31-36" },
	{ material: "Sangue", nome: "RDW", pacote: "Hemograma", unidade: "%", valoresReferencia: "11.5-14.5" },
	{ material: "Sangue", nome: "Leucócitos", pacote: "Hemograma", unidade: "/µL", valoresReferencia: "4000-11000" },
	{ material: "Sangue", nome: "Neutrófilos", pacote: "Hemograma", unidade: "%", valoresReferencia: "50-70" },
	{ material: "Sangue", nome: "Linfócitos", pacote: "Hemograma", unidade: "%", valoresReferencia: "20-40" },
	{ material: "Sangue", nome: "Monócitos", pacote: "Hemograma", unidade: "%", valoresReferencia: "2-8" },
	{ material: "Sangue", nome: "Eosinófilos", pacote: "Hemograma", unidade: "%", valoresReferencia: "1-4" },
	{ material: "Sangue", nome: "Basófilos", pacote: "Hemograma", unidade: "%", valoresReferencia: "0-1" },
	{ material: "Sangue", nome: "Plaquetas", pacote: "Hemograma", unidade: "10³/µL", valoresReferencia: "150-400" },
	{ material: "Sangue", nome: "Glicemia de jejum", pacote: "Glicemia", unidade: "mg/dL", valoresReferencia: "70-99" },
	{ material: "Sangue", nome: "Glicemia pós-prandial", pacote: "Glicemia", unidade: "mg/dL", valoresReferencia: "<140" },
	{ material: "Sangue", nome: "HbA1c", pacote: "Glicemia", unidade: "%", valoresReferencia: "<5.7" },
	{ material: "Sangue", nome: "Insulina jejum", pacote: "Glicemia", unidade: "µUI/mL", valoresReferencia: "2.6-24.9" },
	{ material: "Sangue", nome: "Colesterol total", pacote: "Lipidograma", unidade: "mg/dL", valoresReferencia: "<190" },
	{ material: "Sangue", nome: "HDL", pacote: "Lipidograma", unidade: "mg/dL", valoresReferencia: ">40 (M) / >50 (F)" },
	{ material: "Sangue", nome: "LDL", pacote: "Lipidograma", unidade: "mg/dL", valoresReferencia: "<130" },
	{ material: "Sangue", nome: "VLDL", pacote: "Lipidograma", unidade: "mg/dL", valoresReferencia: "<30" },
	{ material: "Sangue", nome: "Triglicerídeos", pacote: "Lipidograma", unidade: "mg/dL", valoresReferencia: "<150" },
	{ material: "Sangue", nome: "Ureia", pacote: "Função renal", unidade: "mg/dL", valoresReferencia: "15-40" },
	{ material: "Sangue", nome: "Creatinina", pacote: "Função renal", unidade: "mg/dL", valoresReferencia: "M: 0.7-1.2 | F: 0.5-1.1" },
	{ material: "Sangue", nome: "Ácido úrico", pacote: "Função renal", unidade: "mg/dL", valoresReferencia: "M: 3.5-7.2 | F: 2.6-6.0" },
	{ material: "Sangue", nome: "Sódio", pacote: "Eletrólitos", unidade: "mEq/L", valoresReferencia: "136-145" },
	{ material: "Sangue", nome: "Potássio", pacote: "Eletrólitos", unidade: "mEq/L", valoresReferencia: "3.5-5.0" },
	{ material: "Sangue", nome: "Cálcio total", pacote: "Eletrólitos", unidade: "mg/dL", valoresReferencia: "8.5-10.5" },
	{ material: "Sangue", nome: "Magnésio", pacote: "Eletrólitos", unidade: "mg/dL", valoresReferencia: "1.6-2.6" },
	{ material: "Sangue", nome: "Fósforo", pacote: "Eletrólitos", unidade: "mg/dL", valoresReferencia: "2.5-4.5" },
	{ material: "Sangue", nome: "TGO (AST)", pacote: "Função hepática", unidade: "U/L", valoresReferencia: "<40" },
	{ material: "Sangue", nome: "TGP (ALT)", pacote: "Função hepática", unidade: "U/L", valoresReferencia: "<41" },
	{ material: "Sangue", nome: "GGT", pacote: "Função hepática", unidade: "U/L", valoresReferencia: "M: 11-50 | F: 7-32" },
	{ material: "Sangue", nome: "Fosfatase alcalina", pacote: "Função hepática", unidade: "U/L", valoresReferencia: "40-129" },
	{ material: "Sangue", nome: "Bilirrubina total", pacote: "Função hepática", unidade: "mg/dL", valoresReferencia: "0.2-1.2" },
	{ material: "Sangue", nome: "Bilirrubina direta", pacote: "Função hepática", unidade: "mg/dL", valoresReferencia: "0.0-0.4" },
	{ material: "Sangue", nome: "Bilirrubina indireta", pacote: "Função hepática", unidade: "mg/dL", valoresReferencia: "0.2-0.8" },
	{ material: "Sangue", nome: "Albumina", pacote: "Função hepática", unidade: "g/dL", valoresReferencia: "3.5-5.0" },
	{ material: "Sangue", nome: "Proteínas totais", pacote: "Função hepática", unidade: "g/dL", valoresReferencia: "6.0-8.0" },
	{ material: "Sangue", nome: "TSH", pacote: "Função tireoidiana", unidade: "µUI/mL", valoresReferencia: "0.4-4.0" },
	{ material: "Sangue", nome: "T4 livre", pacote: "Função tireoidiana", unidade: "ng/dL", valoresReferencia: "0.8-1.8" },
	{ material: "Sangue", nome: "T3 livre", pacote: "Função tireoidiana", unidade: "pg/mL", valoresReferencia: "2.3-4.2" },
	{ material: "Sangue", nome: "Anti-TPO", pacote: "Função tireoidiana", unidade: "UI/mL", valoresReferencia: "<35" },
	{ material: "Sangue", nome: "Anti-Tg", pacote: "Função tireoidiana", unidade: "UI/mL", valoresReferencia: "<115" },
	{ material: "Sangue", nome: "PCR ultrassensível", pacote: "Inflamação", unidade: "mg/L", valoresReferencia: "<1.0" },
	{ material: "Sangue", nome: "VHS", pacote: "Inflamação", unidade: "mm/h", valoresReferencia: "M: <15 | F: <20" },
	{ material: "Sangue", nome: "Ferritina", pacote: "Ferro", unidade: "ng/mL", valoresReferencia: "M: 12-300 | F: 12-150" },
	{ material: "Sangue", nome: "Ferro sérico", pacote: "Ferro", unidade: "µg/dL", valoresReferencia: "M: 65-175 | F: 50-170" },
	{ material: "Sangue", nome: "Transferrina", pacote: "Ferro", unidade: "mg/dL", valoresReferencia: "200-360" },
	{ material: "Sangue", nome: "Saturação de transferrina", pacote: "Ferro", unidade: "%", valoresReferencia: "20-50" },
	{ material: "Sangue", nome: "Vitamina B12", pacote: "Vitaminas", unidade: "pg/mL", valoresReferencia: "190-900" },
	{ material: "Sangue", nome: "Ácido fólico", pacote: "Vitaminas", unidade: "ng/mL", valoresReferencia: ">4.0" },
	{ material: "Sangue", nome: "Vitamina D (25-OH)", pacote: "Vitaminas", unidade: "ng/mL", valoresReferencia: ">30" },
	{ material: "Sangue", nome: "Vitamina B1 (Tiamina)", pacote: "Vitaminas", unidade: "nmol/L", valoresReferencia: "70-180" },
	{ material: "Sangue", nome: "PSA total", pacote: "Marcadores", unidade: "ng/mL", valoresReferencia: "<4.0" },
	{ material: "Sangue", nome: "PSA livre", pacote: "Marcadores", unidade: "ng/mL", valoresReferencia: "—" },
	{ material: "Sangue", nome: "CEA", pacote: "Marcadores", unidade: "ng/mL", valoresReferencia: "<5.0" },
	{ material: "Sangue", nome: "CA 125", pacote: "Marcadores", unidade: "U/mL", valoresReferencia: "<35" },
	{ material: "Sangue", nome: "AFP", pacote: "Marcadores", unidade: "ng/mL", valoresReferencia: "<10" },
	{ material: "Sangue", nome: "Beta-HCG", pacote: "Marcadores", unidade: "mUI/mL", valoresReferencia: "<5" },
	{ material: "Sangue", nome: "Cortisol basal", pacote: "Hormônios", unidade: "µg/dL", valoresReferencia: "5-25" },
	{ material: "Sangue", nome: "ACTH", pacote: "Hormônios", unidade: "pg/mL", valoresReferencia: "7-63" },
	{ material: "Sangue", nome: "LH", pacote: "Hormônios", unidade: "mUI/mL", valoresReferencia: "M: 1.7-8.6 | F (folicular): 2.4-12.6" },
	{ material: "Sangue", nome: "FSH", pacote: "Hormônios", unidade: "mUI/mL", valoresReferencia: "M: 1.5-12.4 | F (folicular): 3.5-12.5" },
	{ material: "Sangue", nome: "Estradiol", pacote: "Hormônios", unidade: "pg/mL", valoresReferencia: "M: 10-40 | F (folicular): 30-120" },
	{ material: "Sangue", nome: "Testosterona total", pacote: "Hormônios", unidade: "ng/dL", valoresReferencia: "M: 300-1000 | F: 15-70" },
	{ material: "Sangue", nome: "Progesterona", pacote: "Hormônios", unidade: "ng/mL", valoresReferencia: "Folicular: 0.2-1.4 | Lútea: 4-25" },
	{ material: "Sangue", nome: "Prolactina", pacote: "Hormônios", unidade: "ng/mL", valoresReferencia: "M: 3-15 | F: 5-25" },
	{ material: "Sangue", nome: "Tempo de protrombina (TP)", pacote: "Coagulação", unidade: "segundos", valoresReferencia: "11-13" },
	{ material: "Sangue", nome: "INR", pacote: "Coagulação", unidade: "—", valoresReferencia: "0.9-1.1" },
	{ material: "Sangue", nome: "TTPA", pacote: "Coagulação", unidade: "segundos", valoresReferencia: "25-35" },
	{ material: "Sangue", nome: "Fibrinogênio", pacote: "Coagulação", unidade: "mg/dL", valoresReferencia: "200-400" },
	{ material: "Sangue", nome: "D-dímero", pacote: "Coagulação", unidade: "ng/mL", valoresReferencia: "<500" },
	{ material: "Sangue", nome: "Proteína C reativa", pacote: "Inflamação", unidade: "mg/L", valoresReferencia: "<5.0" },
	{ material: "Sangue", nome: "Lactato", pacote: "Metabólico", unidade: "mmol/L", valoresReferencia: "0.5-2.2" },
	{ material: "Sangue", nome: "Gasometria arterial pH", pacote: "Gasometria", unidade: "—", valoresReferencia: "7.35-7.45" },
	{ material: "Sangue", nome: "PaO2", pacote: "Gasometria", unidade: "mmHg", valoresReferencia: "80-100" },
	{ material: "Sangue", nome: "PaCO2", pacote: "Gasometria", unidade: "mmHg", valoresReferencia: "35-45" },
	{ material: "Sangue", nome: "HCO3", pacote: "Gasometria", unidade: "mEq/L", valoresReferencia: "22-26" },
	{ material: "Sangue", nome: "BE", pacote: "Gasometria", unidade: "mEq/L", valoresReferencia: "-2 a +2" },
	{ material: "Urina", nome: "Densidade", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "1005-1030" },
	{ material: "Urina", nome: "pH urinário", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "4.5-8.0" },
	{ material: "Urina", nome: "Proteínas", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Glicose urinária", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Cetonas", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Bilirrubina urinária", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Urobilinogênio", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Normal" },
	{ material: "Urina", nome: "Hemoglobina urinária", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Nitrito", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Negativo" },
	{ material: "Urina", nome: "Leucócitos (urina)", pacote: "Urina tipo 1", unidade: "/campo", valoresReferencia: "<5" },
	{ material: "Urina", nome: "Hemácias (urina)", pacote: "Urina tipo 1", unidade: "/campo", valoresReferencia: "<3" },
	{ material: "Urina", nome: "Cilindros", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Ausentes" },
	{ material: "Urina", nome: "Células epiteliais", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Raras" },
	{ material: "Urina", nome: "Bactérias", pacote: "Urina tipo 1", unidade: "—", valoresReferencia: "Ausentes" },
	{ material: "Urina", nome: "Creatinina urinária", pacote: "Função renal urinária", unidade: "mg/dL", valoresReferencia: "—" },
	{ material: "Urina", nome: "Proteinúria 24h", pacote: "Função renal urinária", unidade: "mg/24h", valoresReferencia: "<150" },
	{ material: "Urina", nome: "Microalbuminúria", pacote: "Função renal urinária", unidade: "mg/g creat", valoresReferencia: "<30" },
	{ material: "Urina", nome: "Sódio urinário", pacote: "Eletrólitos urinários", unidade: "mEq/L", valoresReferencia: "—" },
	{ material: "Urina", nome: "Potássio urinário", pacote: "Eletrólitos urinários", unidade: "mEq/L", valoresReferencia: "—" },
	{ material: "Urina", nome: "Urocultura", pacote: "Microbiologia", unidade: "—", valoresReferencia: "Negativo/UFC" }
];

function normalizeText(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

export function buscarExamesCatalogo(termo: string): ExameCatalogoItem[] {
	if (!termo || !termo.trim()) return [];
	const q = normalizeText(termo);
	return EXAMES_CATALOGO.filter((ex) => {
		const nNome = normalizeText(ex.nome);
		const nPacote = normalizeText(ex.pacote);
		return nNome.includes(q) || nPacote.includes(q);
	});
}

export function extrairReferenciaPorSexo(refOriginal: string, sexo: 'M' | 'F' | string): string {
	if (!refOriginal || !sexo) return refOriginal;

	// Formato "M: <val> | F: <val>" ou "M: <val> | F (folicular): <val>"
	if (refOriginal.includes('M:') || refOriginal.includes('F:') || refOriginal.includes('F (')) {
		const parts = refOriginal.split('|').map((p) => p.trim());
		for (const part of parts) {
			if (sexo === 'M' && part.startsWith('M:')) {
				return part.replace(/^M:\s*/, '').trim();
			}
			if (sexo === 'F' && (part.startsWith('F:') || part.startsWith('F ('))) {
				return part.replace(/^F(\s*\([^)]+\))?:\s*/, '').trim();
			}
		}
	}

	// Formato ">40 (M) / >50 (F)"
	if (refOriginal.includes('(M)') || refOriginal.includes('(F)')) {
		const parts = refOriginal.split('/').map((p) => p.trim());
		for (const part of parts) {
			if (sexo === 'M' && part.includes('(M)')) {
				return part.replace(/\(M\)/g, '').trim();
			}
			if (sexo === 'F' && part.includes('(F)')) {
				return part.replace(/\(F\)/g, '').trim();
			}
		}
	}

	return refOriginal;
}
