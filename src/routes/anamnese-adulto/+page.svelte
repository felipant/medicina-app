<script lang="ts">
	import MedicamentoUsoModal, {
		type MedicamentoEmUso,
	} from "$lib/components/MedicamentoUsoModal.svelte";
	import FagerstromModal from "$lib/components/FagerstromModal.svelte";
	import TimeClockPicker from "$lib/components/TimeClockPicker.svelte";
	import ExameModal, { type ItemExame } from "$lib/components/ExameModal.svelte";
	import ExamesLaboratoriaisSection, {
		type ExameLaboratorialLancado,
	} from "$lib/components/ExamesLaboratoriaisSection.svelte";

	// ── Active tab state ──
	type TabType = "subjetivo" | "objetivo" | "avaliacao" | "plano";
	let activeTab = $state<TabType>("subjetivo");

	const tabs: {
		id: TabType;
		label: string;
		letter: string;
		colorVar: string;
	}[] = [
		{
			id: "subjetivo",
			label: "Subjetivo",
			letter: "S",
			colorVar: "--tab-sub",
		},
		{
			id: "objetivo",
			label: "Objetivo",
			letter: "O",
			colorVar: "--tab-obj",
		},
		{
			id: "avaliacao",
			label: "Avaliação",
			letter: "A",
			colorVar: "--tab-aval",
		},
		{ id: "plano", label: "Plano", letter: "P", colorVar: "--tab-plan" },
	];

	// ── Sub-sections definition per tab ──
	interface NavSection {
		id: string;
		num: string;
		label: string;
	}

	let activeSubSection = $state("sec-identificacao");

	// ── Dynamic Sub-sections per tab (with conditional Sexo Biológico) ──
	let currentSubSections = $derived.by(() => {
		if (activeTab === "subjetivo") {
			let secIndex = 1;
			const list: NavSection[] = [
				{
					id: "sec-identificacao",
					num: String(secIndex++).padStart(2, "0"),
					label: "Identificação",
				},
				{
					id: "sec-queixa-principal",
					num: String(secIndex++).padStart(2, "0"),
					label: "Queixa Principal",
				},
				{
					id: "sec-hma",
					num: String(secIndex++).padStart(2, "0"),
					label: "História da Moléstia Atual",
				},
				{
					id: "sec-revisao-sistemas",
					num: String(secIndex++).padStart(2, "0"),
					label: "Revisão de Sistemas",
				},
			];
			if (sexoBiologico === "F") {
				list.push({
					id: "sec-hg",
					num: String(secIndex++).padStart(2, "0"),
					label: "História Ginecológica",
				});
			}
			list.push({
				id: "sec-hpp",
				num: String(secIndex++).padStart(2, "0"),
				label: "História Patológica Pregressa",
			});
			list.push({
				id: "sec-hf",
				num: String(secIndex++).padStart(2, "0"),
				label: "História Familiar",
			});
			list.push({
				id: "sec-ho",
				num: String(secIndex++).padStart(2, "0"),
				label: "História Ocupacional",
			});
			list.push({
				id: "sec-hps",
				num: String(secIndex++).padStart(2, "0"),
				label: "História Psicossocial",
			});
			list.push({
				id: "sec-hv",
				num: String(secIndex++).padStart(2, "0"),
				label: "Hábitos de Vida",
			});
			return list;
		}
		if (activeTab === "objetivo") {
			let secIndex = 1;
			const list: NavSection[] = [
				{
					id: "sec-exames-imagem",
					num: String(secIndex++).padStart(2, "0"),
					label: "Exames de Imagem e Funcionais",
				},
				{
					id: "sec-exames-lab",
					num: String(secIndex++).padStart(2, "0"),
					label: "Exames Laboratoriais",
				},
				{
					id: "sec-sinais-vitais",
					num: String(secIndex++).padStart(2, "0"),
					label: "Sinais Vitais",
				},
				{
					id: "sec-antropometria",
					num: String(secIndex++).padStart(2, "0"),
					label: "Antropometria",
				},
				{
					id: "sec-ef-geral",
					num: String(secIndex++).padStart(2, "0"),
					label: "Exame Físico Geral",
				},
			];
			if (sexoBiologico === "F") {
				list.push({
					id: "sec-exame-ginecologico",
					num: String(secIndex++).padStart(2, "0"),
					label: "Exame Ginecológico",
				});
			}
			list.push({
				id: "sec-exame-aparelhos",
				num: String(secIndex++).padStart(2, "0"),
				label: "Exame por Aparelhos",
			});
			return list;
		}
		return [];
	});

	// ── Collapsed sections state ──
	let collapsedSections = $state(new Set<string>(["sec-sub-acompanhante"]));

	function toggleSection(id: string) {
		if (collapsedSections.has(id)) {
			collapsedSections.delete(id);
		} else {
			collapsedSections.add(id);
		}
		collapsedSections = new Set(collapsedSections);
	}

	function scrollToSection(id: string) {
		activeSubSection = id;
		const el = document.getElementById(id);
		if (el) {
			// If collapsed, expand it first
			if (collapsedSections.has(id)) {
				collapsedSections.delete(id);
				collapsedSections = new Set(collapsedSections);
			}
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 01 · Identificação (Form State)
	// ══════════════════════════════════════════════════════════════
	let nomePaciente = $state("");
	let ocupacao = $state("");
	let naturalidade = $state("");
	let sexoBiologico = $state<"M" | "F" | "">("");
	let genero = $state("");
	let generoOutro = $state("");
	let raca = $state("");
	let racaOutro = $state("");
	let estadoCivil = $state("");
	let estadoCivilOutro = $state("");
	let escolaridade = $state("");
	let escolaridadeOutro = $state("");
	let religiao = $state("");
	let religiaoOutro = $state("");

	// Acompanhante
	let nomeAcompanhante = $state("");
	let parentescoAcompanhante = $state("");
	let parentescoOutro = $state("");

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 02 · Queixa Principal (Form State)
	// ══════════════════════════════════════════════════════════════
	let queixaPrincipal = $state("");

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 03 · História da Moléstia Atual - HMA (Form State)
	// ══════════════════════════════════════════════════════════════
	let hma = $state("");
	let showSocratesGuide = $state(false);

	// Queixas Secundárias
	interface QueixaSecundariaItem {
		id: string;
		queixa: string;
		historiaClinica: string;
	}

	let queixasSecundarias = $state<QueixaSecundariaItem[]>([]);

	function adicionarQueixaSecundaria() {
		queixasSecundarias = [
			...queixasSecundarias,
			{
				id: Math.random().toString(36).substring(2, 9),
				queixa: "",
				historiaClinica: ""
			}
		];
	}

	function removerQueixaSecundaria(id: string) {
		queixasSecundarias = queixasSecundarias.filter((q) => q.id !== id);
	}

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 04 · Revisão de Sistemas - RS (Form State)
	// ══════════════════════════════════════════════════════════════
	let revisaoSistemas = $state("");

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 05 · História Ginecológica - HG (Form State - )
	// ══════════════════════════════════════════════════════════════
	let hgG = $state<number | "">("");
	let hgP = $state<number | "">("");
	let hgN = $state<number | "">("");
	let hgC = $state<number | "">("");
	let hgA = $state<number | "">("");
	let hgE = $state<number | "">("");
	let hgDum = $state("");
	let hgMac = $state("");
	let hgMacDescricao = $state("");
	let hgOutrasInfo = $state("");

	// DUM Time Calculation
	let tempoDesdeDum = $derived.by(() => {
		if (!hgDum) return "";
		const dumDate = new Date(hgDum + "T00:00:00");
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (isNaN(dumDate.getTime())) return "";
		const diffMs = today.getTime() - dumDate.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays < 0) return "Data no futuro";
		if (diffDays === 0) return "Hoje (0 dias)";
		if (diffDays === 1) return "1 dia atrás";
		if (diffDays < 7) return `${diffDays} dias atrás`;
		const semanas = Math.floor(diffDays / 7);
		const diasRestantes = diffDays % 7;
		if (diffDays < 30) {
			return `${diffDays} dias atrás (${semanas} sem${diasRestantes > 0 ? ` + ${diasRestantes}d` : ""})`;
		}
		const meses = Math.floor(diffDays / 30);
		return `${diffDays} dias atrás (~${semanas} sem / ~${meses} mês${meses > 1 ? "es" : ""})`;
	});

	// GPNCAE summary
	let gpncaeSummary = $derived.by(() => {
		const parts = [];
		if (hgG !== "") parts.push(`G${hgG}`);
		if (hgP !== "") parts.push(`P${hgP}`);
		if (hgN !== "") parts.push(`N${hgN}`);
		if (hgC !== "") parts.push(`C${hgC}`);
		if (hgA !== "") parts.push(`A${hgA}`);
		if (hgE !== "") parts.push(`E${hgE}`);
		return parts.length > 0 ? parts.join("") : "";
	});

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 06 · História Patológica Pregressa - HPP (Form State)
	// ══════════════════════════════════════════════════════════════
	let hppAlergias = $state("");
	let hppCirurgias = $state("");
	let hppInternacoes = $state("");
	let hppTraumas = $state("");
	let hppDoencasCronicas = $state("");
	let medicamentosEmUso = $state<MedicamentoEmUso[]>([]);
	let modalMedUsoOpen = $state(false);

	function adicionarMedicamento(med: MedicamentoEmUso) {
		medicamentosEmUso = [...medicamentosEmUso, med];
	}

	function removerMedicamento(id: string) {
		medicamentosEmUso = medicamentosEmUso.filter((m) => m.id !== id);
	}

	let medicamentosPorClasse = $derived.by(() => {
		const groups: Record<string, MedicamentoEmUso[]> = {};
		for (const med of medicamentosEmUso) {
			const cls = med.classeFarmaceutica || "Outros / Não classificado";
			if (!groups[cls]) groups[cls] = [];
			groups[cls].push(med);
		}
		return groups;
	});

	let totalMedicamentos = $derived(medicamentosEmUso.length);

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — 07 · História Familiar - HF (Form State)
	// ══════════════════════════════════════════════════════════════
	interface ItemHistoriaFamiliar {
		id: string;
		doenca: string;
		parentes: string[];
		outroParente?: string;
	}

	let itensHistoriaFamiliar = $state<ItemHistoriaFamiliar[]>([
		{ id: "hf-1", doenca: "", parentes: [] },
	]);
	let hfObservacoes = $state("");

	const sugestoesDoencasFamiliares = [
		"IAM",
		"AVE",
		"dislipidemia",
		"DM1",
		"DM2",
		"HAS",
		"DAC",
		"Colelitíase",
		"Câncer de pulmão",
		"Câncer de próstata",
		"Câncer de mama",
		"Câncer de intestino",
		"Câncer de pele",
	];

	const OPCOES_PARENTES = [
		"mãe",
		"pai",
		"irmão",
		"irmã",
		"filho",
		"filha",
		"avó materna",
		"avó paterna",
		"avô materno",
		"avô paterno",
		"tia materna",
		"tia paterna",
		"tio materno",
		"tio paterno",
		"outro",
	];

	function adicionarItemHF() {
		itensHistoriaFamiliar = [
			...itensHistoriaFamiliar,
			{
				id:
					"hf-" +
					Date.now() +
					"-" +
					Math.random().toString(36).substring(2, 6),
				doenca: "",
				parentes: [],
			},
		];
	}

	function removerItemHF(id: string) {
		if (itensHistoriaFamiliar.length === 1) {
			itensHistoriaFamiliar = [
				{ id: "hf-" + Date.now(), doenca: "", parentes: [] },
			];
		} else {
			itensHistoriaFamiliar = itensHistoriaFamiliar.filter(
				(item) => item.id !== id,
			);
		}
	}

	function toggleParenteNoItem(item: ItemHistoriaFamiliar, parente: string) {
		if (item.parentes.includes(parente)) {
			item.parentes = item.parentes.filter((p) => p !== parente);
		} else {
			item.parentes = [...item.parentes, parente];
		}
	}

	let totalHfValidos = $derived(
		itensHistoriaFamiliar.filter(
			(i) => i.doenca.trim().length > 0 && i.parentes.length > 0,
		).length,
	);

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — História Ocupacional - HO (Form State)
	// ══════════════════════════════════════════════════════════════
	let historiaOcupacional = $state("");

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — História Psicossocial - HPS (Form State)
	// ══════════════════════════════════════════════════════════════
	let historiaPsicossocial = $state("");

	// ══════════════════════════════════════════════════════════════
	//  SUBJETIVO — Hábitos de Vida - HV (Form State)
	// ══════════════════════════════════════════════════════════════
	// 1. Tabagismo
	let tabagismoStatus = $state<"nao" | "sim" | "ex">("nao");
	let tabagismoMacosDia = $state<number | "">("");
	let tabagismoAnos = $state<number | "">("");
	let modalFagerstromOpen = $state(false);
	let fagerstromScore = $state<number | null>(null);
	let fagerstromGrau = $state("");
	let fagerstromResumo = $state("");

	let cargaTabagica = $derived.by(() => {
		if (tabagismoStatus === "nao") return "";
		if (
			typeof tabagismoMacosDia === "number" &&
			typeof tabagismoAnos === "number" &&
			tabagismoMacosDia > 0 &&
			tabagismoAnos > 0
		) {
			const ct = Math.round(tabagismoMacosDia * tabagismoAnos * 10) / 10;
			return `${ct} maços-ano`;
		}
		return "";
	});

	function salvarFagerstrom(res: {
		score: number;
		grau: string;
		resumo: string;
	}) {
		fagerstromScore = res.score;
		fagerstromGrau = res.grau;
		fagerstromResumo = res.resumo;
	}

	// 2. Etilismo
	let etilismoStatus = $state<"nao" | "sim" | "ex">("nao");
	let etilismoDosesSemana = $state<number | "">("");

	// 3. Drogas Ilícitas
	let drogasStatus = $state<"nao" | "sim" | "ex">("nao");
	let drogasDescricao = $state("");

	// 4. Recordatório Alimentar
	let alimentarCafeManha = $state("");
	let alimentarLancheManha = $state("");
	let alimentarAlmoco = $state("");
	let alimentarLancheTarde = $state("");
	let alimentarCafeTarde = $state("");
	let alimentarJantar = $state("");
	let alimentarCeia = $state("");

	// 5. Sono
	let sonoHoraDormir = $state("");
	let sonoHoraAcordar = $state("");
	let sonoDescricao = $state("");

	let tempoSonoCalculado = $derived.by(() => {
		if (!sonoHoraDormir || !sonoHoraAcordar) return "";
		const [h1, m1] = sonoHoraDormir.split(":").map(Number);
		const [h2, m2] = sonoHoraAcordar.split(":").map(Number);
		if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return "";

		let minDormir = h1 * 60 + m1;
		let minAcordar = h2 * 60 + m2;
		if (minAcordar <= minDormir) {
			minAcordar += 24 * 60; // dia seguinte
		}
		const diffMin = minAcordar - minDormir;
		const horas = Math.floor(diffMin / 60);
		const minutos = diffMin % 60;
		if (minutos === 0) return `${horas} horas por noite`;
		return `${horas}h ${minutos}min por noite`;
	});

	// 6. Atividade Física
	const OPCOES_ATIVIDADE_FISICA = [
		"Academia / Musculação",
		"Esportes coletivos",
		"Caminhada",
		"Corrida",
		"Pilates",
		"Ciclismo",
		"Crossfit",
		"Outros",
	];
	let atividadesSelecionadas = $state<string[]>([]);
	let atividadeOutro = $state("");
	let atividadeFrequencia = $state("");
	let atividadeDuracao = $state("");

	function toggleAtividade(atv: string) {
		if (atividadesSelecionadas.includes(atv)) {
			atividadesSelecionadas = atividadesSelecionadas.filter(
				(a) => a !== atv,
			);
		} else {
			atividadesSelecionadas = [...atividadesSelecionadas, atv];
		}
	}

	// ── Suggestions Datalist ──
	const sugestoesOcupacao = [
		"Aposentado(a)",
		"Autônomo(a)",
		"Estudante",
		"Do lar / Trabalho doméstico",
		"Comerciante / Vendedor(a)",
		"Servidor(a) Público(a)",
		"Professor(a) / Educador(a)",
		"Agricultor(a) / Produtor(a) Rural",
		"Motorista / Entregador(a)",
		"Pedreiro(a) / Construção Civil",
		"Auxiliar Administrativo",
		"Técnico(a) em Enfermagem / Enfermeiro(a)",
		"Desempregado(a)",
		"Empresário(a)",
	];

	const sugestoesNaturalidade = [
		"Divinópolis - MG",
		"Belo Horizonte - MG",
		"Nova Serrana - MG",
		"Itaúna - MG",
		"Pará de Minas - MG",
		"Carmo do Cajuru - MG",
		"Cláudio - MG",
		"São Gonçalo do Pará - MG",
		"Formiga - MG",
		"Oliveira - MG",
		"Santo Antônio do Monte - MG",
		"Bom Despacho - MG",
		"Arcos - MG",
		"Pitangui - MG",
		"Lagoa da Prata - MG",
	];

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 01 · Exames de Imagem e Funcionais (Form State)
	// ══════════════════════════════════════════════════════════════
	let examesImagem = $state<ItemExame[]>([]);
	let modalExameOpen = $state(false);
	let exameSelecionadoParaEditar = $state<ItemExame | null>(null);

	function abrirModalAdicionarExame() {
		exameSelecionadoParaEditar = null;
		modalExameOpen = true;
	}

	function abrirModalEditarExame(exame: ItemExame) {
		exameSelecionadoParaEditar = exame;
		modalExameOpen = true;
	}

	function salvarExame(exame: ItemExame) {
		const index = examesImagem.findIndex((e) => e.id === exame.id);
		if (index >= 0) {
			examesImagem[index] = exame;
		} else {
			examesImagem = [...examesImagem, exame];
		}
	}

	function removerExame(id: string) {
		examesImagem = examesImagem.filter((e) => e.id !== id);
	}

	let totalExames = $derived(examesImagem.length);

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 02 · Exames Laboratoriais (Form State)
	// ══════════════════════════════════════════════════════════════
	let examesLaboratoriais = $state<ExameLaboratorialLancado[]>([]);
	let dataColetaPadraoLab = $state('');
	let totalExamesLab = $derived(examesLaboratoriais.length);

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 03 · Sinais Vitais (Form State)
	// ══════════════════════════════════════════════════════════════
	let pas = $state(''); // Pressão Arterial Sistólica (mmHg)
	let pad = $state(''); // Pressão Arterial Diastólica (mmHg)
	let temperatura = $state(''); // Temperatura Axilar (°C)
	let frequenciaCardiaca = $state(''); // FC (bpm)
	let frequenciaRespiratoria = $state(''); // FR (ipm)
	let spo2 = $state(''); // SpO2 (%)

	// PAM Calculada
	let pamCalculada = $derived.by(() => {
		const s = parseFloat(pas);
		const d = parseFloat(pad);
		if (!isNaN(s) && !isNaN(d) && s > 0 && d > 0) {
			return ((s + 2 * d) / 3).toFixed(1);
		}
		return '';
	});

	// Classificação PA
	let classificacaoPA = $derived.by(() => {
		const s = parseFloat(pas);
		const d = parseFloat(pad);
		if (isNaN(s) || isNaN(d) || s <= 0 || d <= 0) return null;

		if (s < 90 || d < 60) return { label: 'Hipotensão', type: 'warning' };
		if (s < 120 && d < 80) return { label: 'Ótima', type: 'success' };
		if (s <= 129 && d <= 84) return { label: 'Normal', type: 'success' };
		if ((s >= 130 && s <= 139) || (d >= 85 && d <= 89)) return { label: 'Pré-hipertensão', type: 'warning' };
		if ((s >= 140 && s <= 159) || (d >= 90 && d <= 99)) return { label: 'HAS Estágio 1', type: 'danger' };
		if ((s >= 160 && s <= 179) || (d >= 100 && d <= 109)) return { label: 'HAS Estágio 2', type: 'danger' };
		if (s >= 180 || d >= 110) return { label: 'HAS Estágio 3 / Crise', type: 'critical' };
		return null;
	});

	// Classificação FC
	let classificacaoFC = $derived.by(() => {
		const fc = parseFloat(frequenciaCardiaca);
		if (isNaN(fc) || fc <= 0) return null;
		if (fc < 60) return { label: 'Bradicardia (<60 bpm)', type: 'info' };
		if (fc <= 100) return { label: 'Normocárdico (60-100 bpm)', type: 'success' };
		return { label: 'Taquicardia (>100 bpm)', type: 'danger' };
	});

	// Classificação FR
	let classificacaoFR = $derived.by(() => {
		const fr = parseFloat(frequenciaRespiratoria);
		if (isNaN(fr) || fr <= 0) return null;
		if (fr < 12) return { label: 'Bradipneia (<12 ipm)', type: 'info' };
		if (fr <= 20) return { label: 'Eupneico (12-20 ipm)', type: 'success' };
		return { label: 'Taquipneia (>20 ipm)', type: 'danger' };
	});

	// Classificação Temperatura
	let classificacaoTemperatura = $derived.by(() => {
		const temp = parseFloat(temperatura);
		if (isNaN(temp) || temp <= 0) return null;
		if (temp < 35.5) return { label: 'Hipotermia (<35.5°C)', type: 'info' };
		if (temp <= 37.2) return { label: 'Afebril (≤37.2°C)', type: 'success' };
		if (temp <= 37.7) return { label: 'Estado Subfebril (37.3-37.7°C)', type: 'warning' };
		if (temp <= 39.0) return { label: 'Febre (37.8-39.0°C)', type: 'danger' };
		return { label: 'Hipertermia (>39.0°C)', type: 'critical' };
	});

	// Classificação SpO2
	let classificacaoSpO2 = $derived.by(() => {
		const sat = parseFloat(spo2);
		if (isNaN(sat) || sat <= 0) return null;
		if (sat >= 95) return { label: 'Normal (≥95%)', type: 'success' };
		if (sat >= 91) return { label: 'Hipoxemia Leve (91-94%)', type: 'warning' };
		if (sat >= 86) return { label: 'Hipoxemia Moderada (86-90%)', type: 'danger' };
		return { label: 'Hipoxemia Grave (≤85%)', type: 'critical' };
	});

	let totalSinaisPreenchidos = $derived.by(() => {
		let c = 0;
		if (pas && pad) c++;
		if (temperatura) c++;
		if (frequenciaCardiaca) c++;
		if (frequenciaRespiratoria) c++;
		if (spo2) c++;
		return c;
	});

	let resumoSinaisBadge = $derived.by(() => {
		const partes: string[] = [];
		if (pas && pad) partes.push(`PA ${pas}/${pad} mmHg`);
		if (frequenciaCardiaca) partes.push(`FC ${frequenciaCardiaca} bpm`);
		if (spo2) partes.push(`SpO2 ${spo2}%`);
		if (temperatura) partes.push(`Tax ${temperatura}°C`);
		if (partes.length > 0) return partes.join(' · ');
		return 'Não preenchido';
	});

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 04 · Antropometria (Form State)
	// ══════════════════════════════════════════════════════════════
	let pesoAtual = $state(''); // kg
	let altura = $state(''); // cm ou m
	let imcCustomizado = $state(''); // editável manualmente (ex: amputações)
	let imcFoiEditadoManualmente = $state(false);
	let circunferenciaAbdominal = $state(''); // cm
	let circunferenciaQuadril = $state(''); // cm
	let circunferenciaPanturrilha = $state(''); // cm
	let observacoesAntropometria = $state(''); // ex: amputação transtibial, prótese, etc.

	// Auto calculate IMC when peso and altura change, unless user manually edited it
	$effect(() => {
		const p = parseFloat(pesoAtual.replace(',', '.'));
		let a = parseFloat(altura.replace(',', '.'));
		if (!isNaN(p) && !isNaN(a) && p > 0 && a > 0) {
			if (a > 3) a = a / 100; // cm to m
			const imcCalc = (p / (a * a)).toFixed(1);
			if (!imcFoiEditadoManualmente) {
				imcCustomizado = imcCalc;
			}
		} else if (!imcFoiEditadoManualmente) {
			imcCustomizado = '';
		}
	});

	function recalcularImcAutomatico() {
		imcFoiEditadoManualmente = false;
		const p = parseFloat(pesoAtual.replace(',', '.'));
		let a = parseFloat(altura.replace(',', '.'));
		if (!isNaN(p) && !isNaN(a) && p > 0 && a > 0) {
			if (a > 3) a = a / 100;
			imcCustomizado = (p / (a * a)).toFixed(1);
		} else {
			imcCustomizado = '';
		}
	}

	// Classificação IMC
	let classificacaoIMC = $derived.by(() => {
		const imc = parseFloat(imcCustomizado.replace(',', '.'));
		if (isNaN(imc) || imc <= 0) return null;

		if (imc < 18.5) return { label: 'Baixo Peso (<18.5)', type: 'info' };
		if (imc <= 24.9) return { label: 'Eutrofia / Normal (18.5–24.9)', type: 'success' };
		if (imc <= 29.9) return { label: 'Sobrepeso (25.0–29.9)', type: 'warning' };
		if (imc <= 34.9) return { label: 'Obesidade Grau I (30.0–34.9)', type: 'danger' };
		if (imc <= 39.9) return { label: 'Obesidade Grau II (35.0–39.9)', type: 'danger' };
		return { label: 'Obesidade Grau III Mórbida (≥40.0)', type: 'critical' };
	});

	// Relação Cintura-Quadril (RCQ)
	let rcqCalculada = $derived.by(() => {
		const c = parseFloat(circunferenciaAbdominal.replace(',', '.'));
		const q = parseFloat(circunferenciaQuadril.replace(',', '.'));
		if (!isNaN(c) && !isNaN(q) && c > 0 && q > 0) {
			return (c / q).toFixed(2);
		}
		return '';
	});

	let riscoCircunferenciaAbdominal = $derived.by(() => {
		const ca = parseFloat(circunferenciaAbdominal.replace(',', '.'));
		if (isNaN(ca) || ca <= 0) return null;
		if (sexoBiologico === 'M') {
			if (ca >= 102) return { label: 'Risco Muito Aumentado (≥102 cm)', type: 'danger' };
			if (ca >= 94) return { label: 'Risco Aumentado (≥94 cm)', type: 'warning' };
			return { label: 'Adequada (<94 cm)', type: 'success' };
		} else if (sexoBiologico === 'F') {
			if (ca >= 88) return { label: 'Risco Muito Aumentado (≥88 cm)', type: 'danger' };
			if (ca >= 80) return { label: 'Risco Aumentado (≥80 cm)', type: 'warning' };
			return { label: 'Adequada (<80 cm)', type: 'success' };
		}
		return null;
	});

	let resumoAntropometriaBadge = $derived.by(() => {
		const partes: string[] = [];
		if (pesoAtual) partes.push(`${pesoAtual} kg`);
		if (altura) partes.push(`${altura} cm`);
		if (imcCustomizado) partes.push(`IMC ${imcCustomizado}`);
		if (partes.length > 0) return partes.join(' · ');
		return 'Não preenchido';
	});

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 05 · Exame Físico Geral (Form State)
	// ══════════════════════════════════════════════════════════════
	let exameFisicoGeral = $state('');

	function preencherTemplateExameFisicoGeral() {
		if (sexoBiologico === 'F') {
			exameFisicoGeral =
				'Bom estado geral, corada, hidratada, acianótica, anictérica, afebril. Ativa, cooperativa, orientada em tempo e espaço. Marcha e fala sem alterações estruturais aparentes. Fácies atípica.';
		} else {
			exameFisicoGeral =
				'Bom estado geral, corado, hidratado, acianótico, anictérico, afebril. Ativo, cooperativo, orientado em tempo e espaço. Marcha e fala sem alterações estruturais aparentes. Fácies atípica.';
		}
	}

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — 06 · Exame Ginecológico (Form State - )
	// ══════════════════════════════════════════════════════════════
	// 1. Mamas - Inspeção Estática
	let mamasPosicao = $state<'tópicas' | 'ptóticas' | ''>('');
	let mamasSimetria = $state<'simétricas' | 'assimétricas' | ''>('');
	let mamasVolume = $state<'eutróficas' | 'hipotróficas' | 'hipertróficas' | ''>('');
	let mamasMamilos = $state<'proeminentes' | 'planos' | 'invertidos' | ''>('');
	let mamasInspecaoEstaticaSemAbaulamentos = $state(false);
	let mamasInspecaoEstaticaObs = $state('');

	// 2. Mamas - Inspeção Dinâmica
	let mamasInspecaoDinamicaSemAbaulamentos = $state(false);
	let mamasInspecaoDinamicaObs = $state('');

	// 3. Mamas - Palpação das Mamas e Linfonodos
	let mamasPalpacaoLinfonodos = $state('');

	function preencherExemploPalpacaoMamas() {
		mamasPalpacaoLinfonodos =
			'Glândulas mamárias com tecido glandular denso, ausência de nódulos palpáveis bilateralmente, sem áreas de espessamento localizado. Cadeias linfáticas axilares e infra e supraclaviculares livres.';
	}

	// 4. Mamas - Expressão Mamilar
	let mamasExpressaoMamilar = $state<'positiva' | 'negativa' | ''>('');
	let mamasExpressaoMamilarObs = $state('');

	// Genitália - 1. Genitália Externa
	let genitaliaExterna = $state('');

	function preencherExemploGenitaliaExterna() {
		genitaliaExterna =
			'Vulva sem lesões elementares, hiperemias ou ulcerações. Distribuição de pilificação ginoide normal. Grandes e pequenos lábios sem alterações estruturais. Meato uretral e hímen sem particularidades.';
	}

	// Genitália - 2. Genitália Interna (Exame Especular)
	let genitaliaInterna = $state('');

	function preencherExemploGenitaliaInterna() {
		genitaliaInterna =
			'Paredes vaginais com coloração e trofismo preservados, ausência de abaulamentos ou lesões. Conteúdo vaginal fisiológico. Colo uterino centralizado, epitélio escamoso original intacto, orifício externo fechado, sem sinais de sangramento ativo.';
	}

	// Genitália - 3. Palpação Bimanual (Toque Combinado)
	let palpacaoBimanual = $state('');

	function preencherExemploPalpacaoBimanual() {
		palpacaoBimanual =
			'Útero em anteroversoflexão (AVF), volume e consistência normais, móvel e indolor à palpação e à mobilização do colo uterino. Regiões anexiais livres, sem massas palpáveis ou dor bilateralmente. Fundo de saco de Douglas livre e indolor.';
	}

	let resumoExameGinecologicoBadge = $derived.by(() => {
		let preenchido = false;
		if (mamasPosicao || mamasSimetria || mamasVolume || mamasMamilos || mamasInspecaoEstaticaSemAbaulamentos || mamasInspecaoEstaticaObs) preenchido = true;
		if (mamasInspecaoDinamicaSemAbaulamentos || mamasInspecaoDinamicaObs) preenchido = true;
		if (mamasPalpacaoLinfonodos.trim()) preenchido = true;
		if (mamasExpressaoMamilar || mamasExpressaoMamilarObs.trim()) preenchido = true;
		if (genitaliaExterna.trim() || genitaliaInterna.trim() || palpacaoBimanual.trim()) preenchido = true;
		return preenchido ? 'Preenchido' : 'Não preenchido';
	});

	// ══════════════════════════════════════════════════════════════
	//  OBJETIVO — Exame por Aparelhos / Segmentar (Form State)
	// ══════════════════════════════════════════════════════════════
	let exameNeurologico = $state('');
	let exameRespSuperior = $state('');
	let exameRespInferior = $state('');
	let exameCardiovascular = $state('');
	let exameDigestorio = $state('');
	let exameGenitourinario = $state('');
	let exameDermatologico = $state('');

	// Todos os aparelhos colapsados por padrão
	let collapsedAparelhos = $state(
		new Set<string>([
			'aparelho-neuro',
			'aparelho-resp-sup',
			'aparelho-resp-inf',
			'aparelho-cardio',
			'aparelho-digest',
			'aparelho-genitouro',
			'aparelho-dermato'
		])
	);

	function toggleAparelho(id: string) {
		if (collapsedAparelhos.has(id)) {
			collapsedAparelhos.delete(id);
		} else {
			collapsedAparelhos.add(id);
		}
		collapsedAparelhos = new Set(collapsedAparelhos);
	}

	function expandirTodosAparelhos() {
		collapsedAparelhos = new Set();
	}

	function recolherTodosAparelhos() {
		collapsedAparelhos = new Set([
			'aparelho-neuro',
			'aparelho-resp-sup',
			'aparelho-resp-inf',
			'aparelho-cardio',
			'aparelho-digest',
			'aparelho-genitouro',
			'aparelho-dermato'
		]);
	}

	function preencherExemploNeurologico() {
		collapsedAparelhos.delete('aparelho-neuro');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameNeurologico =
			'Lúcido e orientado (escala de coma de Glasgow 15). Pupilas isocóricas e fotorreativas. Ausência de déficits motores ou sensitivos focais. Coordenação motora preservada (teste índex-nariz normal). Ausência de sinais de irritação meníngea (rigidez de nuca ausente). Reflexos osteotendíneos normais e simétricos.';
	}

	function preencherExemploRespSuperior() {
		collapsedAparelhos.delete('aparelho-resp-sup');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameRespSuperior =
			'Narinas desobstruídas, mucosa nasal corada e sem secreções. Orofaringe sem hiperemia, amígdalas normotróficas, ausência de placas ou exsudatos. Condutos auditivos externos livres, membranas timpânicas íntegras, translúcidas e com reflexo luminoso presente.';
	}

	function preencherExemploRespInferior() {
		collapsedAparelhos.delete('aparelho-resp-inf');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameRespInferior =
			'Tórax simétrico, expansibilidade preservada bilateralmente. Frêmito tóraco-vocal simétrico e normal. Murmúrio vesicular universalmente audível, sem ruídos adventícios (estertores, sibilos ou roncos). Som claro pulmonar à percussão.';
	}

	function preencherExemploCardiovascular() {
		collapsedAparelhos.delete('aparelho-cardio');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameCardiovascular =
			'Ictus cordis não visível, palpável no 5º espaço intercostal esquerdo na linha hemiclavicular, sem frêmitos. Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas, sem sopros ou estalidos. Pulsos periféricos simétricos, cheios e de amplitude normal. Tempo de enchimento capilar menor que 2 segundos.';
	}

	function preencherExemploDigestorio() {
		collapsedAparelhos.delete('aparelho-digest');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameDigestorio =
			'Abdome plano, simétrico, sem circulação colateral ou cicatrizes patológicas. Ruídos hidroaéreos presentes e normais em todos os quadrantes. Abdome flácido, indolor à palpação superficial e profunda. Ausência de massas ou visceromegalias (fígado e baço não palpáveis). Timpanismo preservado.';
	}

	function preencherExemploGenitourinario() {
		collapsedAparelhos.delete('aparelho-genitouro');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameGenitourinario =
			'Genitália sem alterações aparentes. Loja renal indolor à palpação bimanual, punho-percussão lombar negativa (sinal de Giordano ausente bilateralmente). Ausência de dor ou massas em topografia vesical.';
	}

	function preencherExemploDermatologico() {
		collapsedAparelhos.delete('aparelho-dermato');
		collapsedAparelhos = new Set(collapsedAparelhos);
		exameDermatologico =
			'Pele de coloração normal para a etnia, hidratada, íntegra, com turgor e elasticidade preservados. Ausência de lesões elementares ativas, máculas suspeitas, discromias, petéquias ou cicatrizes anômalas. Fâneros sem alterações tróficas evidentes.';
	}

	let resumoExameAparelhosBadge = $derived.by(() => {
		let c = 0;
		if (exameNeurologico.trim()) c++;
		if (exameRespSuperior.trim()) c++;
		if (exameRespInferior.trim()) c++;
		if (exameCardiovascular.trim()) c++;
		if (exameDigestorio.trim()) c++;
		if (exameGenitourinario.trim()) c++;
		if (exameDermatologico.trim()) c++;
		if (c === 0) return 'Não preenchido';
		return `${c} / 7 preenchidos`;
	});

	// ══════════════════════════════════════════════════════════════
	//  AVALIAÇÃO — Avaliação / Raciocínio Clínico (Form State)
	// ══════════════════════════════════════════════════════════════
	let avaliacaoTexto = $state('');

	// Escores Clínicos — links para calculadoras externas
	const escoresClinicos = [
		{ nome: 'TFG (CKD-EPI)', descricao: 'Taxa de Filtração Glomerular', url: 'https://www.mdcalc.com/calc/3939/ckd-epi-equations-glomerular-filtration-rate-gfr', cor: '#059669' },
		{ nome: 'FIB-4', descricao: 'Índice de Fibrose Hepática', url: 'https://www.mdcalc.com/calc/2200/fibrosis-4-fib-4-index-hepatic-fibrosis', cor: '#d97706' },
		{ nome: 'MELD', descricao: 'Model for End-Stage Liver Disease', url: 'https://www.mdcalc.com/calc/78/meld-score-model-end-stage-liver-disease-12-older', cor: '#dc2626' },
		{ nome: 'CHA₂DS₂-VASc', descricao: 'Risco Tromboembólico na FA', url: 'https://www.mdcalc.com/calc/801/cha2ds2-vasc-score-atrial-fibrillation-stroke-risk', cor: '#7c3aed' },
		{ nome: 'HAS-BLED', descricao: 'Risco de Sangramento', url: 'https://www.mdcalc.com/calc/807/has-bled-score-major-bleeding-risk', cor: '#be185d' },
		{ nome: 'Wells (TEP)', descricao: 'Probabilidade de TEP', url: 'https://www.mdcalc.com/calc/115/wells-criteria-pulmonary-embolism', cor: '#0284c7' },
		{ nome: 'CURB-65', descricao: 'Gravidade da Pneumonia', url: 'https://www.mdcalc.com/calc/324/curb-65-score-pneumonia-severity', cor: '#ea580c' },
		{ nome: 'Framingham', descricao: 'Risco Cardiovascular 10a', url: 'https://www.mdcalc.com/calc/38/framingham-risk-score-hard-coronary-heart-disease', cor: '#b91c1c' },
		{ nome: 'HEART Score', descricao: 'Risco em Dor Torácica', url: 'https://www.mdcalc.com/calc/1752/heart-score-major-cardiac-events', cor: '#dc2626' },
		{ nome: 'Child-Pugh', descricao: 'Classificação Cirrose', url: 'https://www.mdcalc.com/calc/340/child-pugh-score-cirrhosis-mortality', cor: '#92400e' },
		{ nome: 'SOFA', descricao: 'Disfunção Orgânica', url: 'https://www.mdcalc.com/calc/691/sequential-organ-failure-assessment-sofa-score', cor: '#991b1b' },
		{ nome: 'qSOFA', descricao: 'Triagem Rápida Sepse', url: 'https://www.mdcalc.com/calc/2654/qsofa-quick-sofa-score-sepsis', cor: '#9f1239' },
	];

	// ══════════════════════════════════════════════════════════════
	//  PLANO — Prescrição Medicamentosa (Form State)
	// ══════════════════════════════════════════════════════════════
	let prescricaoMedicamentos = $state<MedicamentoEmUso[]>([]);
	let modalPrescricaoOpen = $state(false);
	let condutaTexto = $state('');

	function adicionarPrescricao(med: MedicamentoEmUso) {
		prescricaoMedicamentos = [...prescricaoMedicamentos, med];
	}

	function removerPrescricao(id: string) {
		prescricaoMedicamentos = prescricaoMedicamentos.filter((m) => m.id !== id);
	}

	let prescricaoPorClasse = $derived.by(() => {
		const groups: Record<string, MedicamentoEmUso[]> = {};
		for (const med of prescricaoMedicamentos) {
			const cls = med.classeFarmaceutica || 'Outros / Não classificado';
			if (!groups[cls]) groups[cls] = [];
			groups[cls].push(med);
		}
		return groups;
	});

	let totalPrescricao = $derived(prescricaoMedicamentos.length);

	// ══════════════════════════════════════════════════════════════
	//  SALVAMENTO LOCAL (localStorage) — Auto-save & Status
	// ══════════════════════════════════════════════════════════════
	const STORAGE_KEY = 'anamnese-adulto-v1';
	let saveStatus = $state<'ok' | 'error' | 'idle'>('idle');
	let saveTimestamp = $state('');
	let saveDebounce: ReturnType<typeof setTimeout> | undefined;

	function getFormData() {
		return {
			// Identificação
			nomePaciente, ocupacao, naturalidade, sexoBiologico, genero, generoOutro,
			raca, racaOutro, estadoCivil, estadoCivilOutro, escolaridade, escolaridadeOutro,
			religiao, religiaoOutro, nomeAcompanhante, parentescoAcompanhante, parentescoOutro,
			// Queixa Principal & HMA
			queixaPrincipal, hma, queixasSecundarias,
			// Revisão de Sistemas
			revisaoSistemas,
			// Historia Ginecológica
			hgG, hgP, hgN, hgC, hgA, hgE, hgDum, hgMac, hgMacDescricao, hgOutrasInfo,
			// HPP
			hppAlergias, hppCirurgias, hppInternacoes, hppTraumas, hppDoencasCronicas,
			medicamentosEmUso,
			// HF
			itensHistoriaFamiliar, hfObservacoes,
			// HO, HPS
			historiaOcupacional, historiaPsicossocial,
			// Hábitos de vida
			tabagismoStatus, tabagismoMacosDia, tabagismoAnos,
			fagerstromScore, fagerstromGrau, fagerstromResumo,
			etilismoStatus, etilismoDosesSemana,
			drogasStatus, drogasDescricao,
			alimentarCafeManha, alimentarLancheManha, alimentarAlmoco, alimentarLancheTarde,
			alimentarCafeTarde, alimentarJantar, alimentarCeia,
			sonoHoraDormir, sonoHoraAcordar, sonoDescricao,
			atividadesSelecionadas, atividadeOutro, atividadeFrequencia, atividadeDuracao,
			// Objetivo
			examesImagem, examesLaboratoriais, dataColetaPadraoLab,
			pas, pad, temperatura, frequenciaCardiaca, frequenciaRespiratoria, spo2,
			pesoAtual, altura, imcCustomizado, imcFoiEditadoManualmente,
			circunferenciaAbdominal, circunferenciaQuadril, circunferenciaPanturrilha,
			observacoesAntropometria, exameFisicoGeral,
			// Ginecológico
			mamasPosicao, mamasSimetria, mamasVolume, mamasMamilos,
			mamasInspecaoEstaticaSemAbaulamentos, mamasInspecaoEstaticaObs,
			mamasInspecaoDinamicaSemAbaulamentos, mamasInspecaoDinamicaObs,
			mamasPalpacaoLinfonodos, mamasExpressaoMamilar, mamasExpressaoMamilarObs,
			genitaliaExterna, genitaliaInterna, palpacaoBimanual,
			// Exame por aparelhos
			exameNeurologico, exameRespSuperior, exameRespInferior,
			exameCardiovascular, exameDigestorio, exameGenitourinario, exameDermatologico,
			// Avaliação
			avaliacaoTexto,
			// Plano
			prescricaoMedicamentos, condutaTexto,
		};
	}

	function salvarLocal() {
		try {
			const data = getFormData();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			saveStatus = 'ok';
			saveTimestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		} catch (e) {
			saveStatus = 'error';
			console.error('Erro ao salvar no localStorage:', e);
		}
	}

	function carregarLocal() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const d = JSON.parse(raw);
			// Identificação
			if (d.nomePaciente !== undefined) nomePaciente = d.nomePaciente;
			if (d.ocupacao !== undefined) ocupacao = d.ocupacao;
			if (d.naturalidade !== undefined) naturalidade = d.naturalidade;
			if (d.sexoBiologico !== undefined) sexoBiologico = d.sexoBiologico;
			if (d.genero !== undefined) genero = d.genero;
			if (d.generoOutro !== undefined) generoOutro = d.generoOutro;
			if (d.raca !== undefined) raca = d.raca;
			if (d.racaOutro !== undefined) racaOutro = d.racaOutro;
			if (d.estadoCivil !== undefined) estadoCivil = d.estadoCivil;
			if (d.estadoCivilOutro !== undefined) estadoCivilOutro = d.estadoCivilOutro;
			if (d.escolaridade !== undefined) escolaridade = d.escolaridade;
			if (d.escolaridadeOutro !== undefined) escolaridadeOutro = d.escolaridadeOutro;
			if (d.religiao !== undefined) religiao = d.religiao;
			if (d.religiaoOutro !== undefined) religiaoOutro = d.religiaoOutro;
			if (d.nomeAcompanhante !== undefined) nomeAcompanhante = d.nomeAcompanhante;
			if (d.parentescoAcompanhante !== undefined) parentescoAcompanhante = d.parentescoAcompanhante;
			if (d.parentescoOutro !== undefined) parentescoOutro = d.parentescoOutro;
			// Queixa & HMA
			if (d.queixaPrincipal !== undefined) queixaPrincipal = d.queixaPrincipal;
			if (d.hma !== undefined) hma = d.hma;
			if (d.queixasSecundarias !== undefined) queixasSecundarias = d.queixasSecundarias;
			// Revisão de Sistemas
			if (d.revisaoSistemas !== undefined) revisaoSistemas = d.revisaoSistemas;
			// HG
			if (d.hgG !== undefined) hgG = d.hgG;
			if (d.hgP !== undefined) hgP = d.hgP;
			if (d.hgN !== undefined) hgN = d.hgN;
			if (d.hgC !== undefined) hgC = d.hgC;
			if (d.hgA !== undefined) hgA = d.hgA;
			if (d.hgE !== undefined) hgE = d.hgE;
			if (d.hgDum !== undefined) hgDum = d.hgDum;
			if (d.hgMac !== undefined) hgMac = d.hgMac;
			if (d.hgMacDescricao !== undefined) hgMacDescricao = d.hgMacDescricao;
			if (d.hgOutrasInfo !== undefined) hgOutrasInfo = d.hgOutrasInfo;
			// HPP
			if (d.hppAlergias !== undefined) hppAlergias = d.hppAlergias;
			if (d.hppCirurgias !== undefined) hppCirurgias = d.hppCirurgias;
			if (d.hppInternacoes !== undefined) hppInternacoes = d.hppInternacoes;
			if (d.hppTraumas !== undefined) hppTraumas = d.hppTraumas;
			if (d.hppDoencasCronicas !== undefined) hppDoencasCronicas = d.hppDoencasCronicas;
			if (d.medicamentosEmUso !== undefined) medicamentosEmUso = d.medicamentosEmUso;
			// HF
			if (d.itensHistoriaFamiliar !== undefined) itensHistoriaFamiliar = d.itensHistoriaFamiliar;
			if (d.hfObservacoes !== undefined) hfObservacoes = d.hfObservacoes;
			// HO, HPS
			if (d.historiaOcupacional !== undefined) historiaOcupacional = d.historiaOcupacional;
			if (d.historiaPsicossocial !== undefined) historiaPsicossocial = d.historiaPsicossocial;
			// Hábitos
			if (d.tabagismoStatus !== undefined) tabagismoStatus = d.tabagismoStatus;
			if (d.tabagismoMacosDia !== undefined) tabagismoMacosDia = d.tabagismoMacosDia;
			if (d.tabagismoAnos !== undefined) tabagismoAnos = d.tabagismoAnos;
			if (d.fagerstromScore !== undefined) fagerstromScore = d.fagerstromScore;
			if (d.fagerstromGrau !== undefined) fagerstromGrau = d.fagerstromGrau;
			if (d.fagerstromResumo !== undefined) fagerstromResumo = d.fagerstromResumo;
			if (d.etilismoStatus !== undefined) etilismoStatus = d.etilismoStatus;
			if (d.etilismoDosesSemana !== undefined) etilismoDosesSemana = d.etilismoDosesSemana;
			if (d.drogasStatus !== undefined) drogasStatus = d.drogasStatus;
			if (d.drogasDescricao !== undefined) drogasDescricao = d.drogasDescricao;
			if (d.alimentarCafeManha !== undefined) alimentarCafeManha = d.alimentarCafeManha;
			if (d.alimentarLancheManha !== undefined) alimentarLancheManha = d.alimentarLancheManha;
			if (d.alimentarAlmoco !== undefined) alimentarAlmoco = d.alimentarAlmoco;
			if (d.alimentarLancheTarde !== undefined) alimentarLancheTarde = d.alimentarLancheTarde;
			if (d.alimentarCafeTarde !== undefined) alimentarCafeTarde = d.alimentarCafeTarde;
			if (d.alimentarJantar !== undefined) alimentarJantar = d.alimentarJantar;
			if (d.alimentarCeia !== undefined) alimentarCeia = d.alimentarCeia;
			if (d.sonoHoraDormir !== undefined) sonoHoraDormir = d.sonoHoraDormir;
			if (d.sonoHoraAcordar !== undefined) sonoHoraAcordar = d.sonoHoraAcordar;
			if (d.sonoDescricao !== undefined) sonoDescricao = d.sonoDescricao;
			if (d.atividadesSelecionadas !== undefined) atividadesSelecionadas = d.atividadesSelecionadas;
			if (d.atividadeOutro !== undefined) atividadeOutro = d.atividadeOutro;
			if (d.atividadeFrequencia !== undefined) atividadeFrequencia = d.atividadeFrequencia;
			if (d.atividadeDuracao !== undefined) atividadeDuracao = d.atividadeDuracao;
			// Objetivo
			if (d.examesImagem !== undefined) examesImagem = d.examesImagem;
			if (d.examesLaboratoriais !== undefined) examesLaboratoriais = d.examesLaboratoriais;
			if (d.dataColetaPadraoLab !== undefined) dataColetaPadraoLab = d.dataColetaPadraoLab;
			if (d.pas !== undefined) pas = d.pas;
			if (d.pad !== undefined) pad = d.pad;
			if (d.temperatura !== undefined) temperatura = d.temperatura;
			if (d.frequenciaCardiaca !== undefined) frequenciaCardiaca = d.frequenciaCardiaca;
			if (d.frequenciaRespiratoria !== undefined) frequenciaRespiratoria = d.frequenciaRespiratoria;
			if (d.spo2 !== undefined) spo2 = d.spo2;
			if (d.pesoAtual !== undefined) pesoAtual = d.pesoAtual;
			if (d.altura !== undefined) altura = d.altura;
			if (d.imcCustomizado !== undefined) imcCustomizado = d.imcCustomizado;
			if (d.imcFoiEditadoManualmente !== undefined) imcFoiEditadoManualmente = d.imcFoiEditadoManualmente;
			if (d.circunferenciaAbdominal !== undefined) circunferenciaAbdominal = d.circunferenciaAbdominal;
			if (d.circunferenciaQuadril !== undefined) circunferenciaQuadril = d.circunferenciaQuadril;
			if (d.circunferenciaPanturrilha !== undefined) circunferenciaPanturrilha = d.circunferenciaPanturrilha;
			if (d.observacoesAntropometria !== undefined) observacoesAntropometria = d.observacoesAntropometria;
			if (d.exameFisicoGeral !== undefined) exameFisicoGeral = d.exameFisicoGeral;
			// Ginecológico
			if (d.mamasPosicao !== undefined) mamasPosicao = d.mamasPosicao;
			if (d.mamasSimetria !== undefined) mamasSimetria = d.mamasSimetria;
			if (d.mamasVolume !== undefined) mamasVolume = d.mamasVolume;
			if (d.mamasMamilos !== undefined) mamasMamilos = d.mamasMamilos;
			if (d.mamasInspecaoEstaticaSemAbaulamentos !== undefined) mamasInspecaoEstaticaSemAbaulamentos = d.mamasInspecaoEstaticaSemAbaulamentos;
			if (d.mamasInspecaoEstaticaObs !== undefined) mamasInspecaoEstaticaObs = d.mamasInspecaoEstaticaObs;
			if (d.mamasInspecaoDinamicaSemAbaulamentos !== undefined) mamasInspecaoDinamicaSemAbaulamentos = d.mamasInspecaoDinamicaSemAbaulamentos;
			if (d.mamasInspecaoDinamicaObs !== undefined) mamasInspecaoDinamicaObs = d.mamasInspecaoDinamicaObs;
			if (d.mamasPalpacaoLinfonodos !== undefined) mamasPalpacaoLinfonodos = d.mamasPalpacaoLinfonodos;
			if (d.mamasExpressaoMamilar !== undefined) mamasExpressaoMamilar = d.mamasExpressaoMamilar;
			if (d.mamasExpressaoMamilarObs !== undefined) mamasExpressaoMamilarObs = d.mamasExpressaoMamilarObs;
			if (d.genitaliaExterna !== undefined) genitaliaExterna = d.genitaliaExterna;
			if (d.genitaliaInterna !== undefined) genitaliaInterna = d.genitaliaInterna;
			if (d.palpacaoBimanual !== undefined) palpacaoBimanual = d.palpacaoBimanual;
			// Exame por aparelhos
			if (d.exameNeurologico !== undefined) exameNeurologico = d.exameNeurologico;
			if (d.exameRespSuperior !== undefined) exameRespSuperior = d.exameRespSuperior;
			if (d.exameRespInferior !== undefined) exameRespInferior = d.exameRespInferior;
			if (d.exameCardiovascular !== undefined) exameCardiovascular = d.exameCardiovascular;
			if (d.exameDigestorio !== undefined) exameDigestorio = d.exameDigestorio;
			if (d.exameGenitourinario !== undefined) exameGenitourinario = d.exameGenitourinario;
			if (d.exameDermatologico !== undefined) exameDermatologico = d.exameDermatologico;
			// Avaliação
			if (d.avaliacaoTexto !== undefined) avaliacaoTexto = d.avaliacaoTexto;
			// Plano
			if (d.prescricaoMedicamentos !== undefined) prescricaoMedicamentos = d.prescricaoMedicamentos;
			if (d.condutaTexto !== undefined) condutaTexto = d.condutaTexto;

			saveStatus = 'ok';
			saveTimestamp = 'Restaurado';
		} catch (e) {
			console.error('Erro ao carregar do localStorage:', e);
		}
	}

	function limparConsulta() {
		if (!confirm('Tem certeza que deseja limpar TODA a consulta? Esta ação não pode ser desfeita.')) return;
		localStorage.removeItem(STORAGE_KEY);
		// Reset all state
		nomePaciente = ''; ocupacao = ''; naturalidade = ''; sexoBiologico = ''; genero = '';
		generoOutro = ''; raca = ''; racaOutro = ''; estadoCivil = ''; estadoCivilOutro = '';
		escolaridade = ''; escolaridadeOutro = ''; religiao = ''; religiaoOutro = '';
		nomeAcompanhante = ''; parentescoAcompanhante = ''; parentescoOutro = '';
		queixaPrincipal = ''; hma = ''; queixasSecundarias = [];
		revisaoSistemas = '';
		hgG = ''; hgP = ''; hgN = ''; hgC = ''; hgA = ''; hgE = '';
		hgDum = ''; hgMac = ''; hgMacDescricao = ''; hgOutrasInfo = '';
		hppAlergias = ''; hppCirurgias = ''; hppInternacoes = ''; hppTraumas = '';
		hppDoencasCronicas = ''; medicamentosEmUso = [];
		itensHistoriaFamiliar = [{ id: 'hf-1', doenca: '', parentes: [] }];
		hfObservacoes = '';
		historiaOcupacional = ''; historiaPsicossocial = '';
		tabagismoStatus = 'nao'; tabagismoMacosDia = ''; tabagismoAnos = '';
		fagerstromScore = null; fagerstromGrau = ''; fagerstromResumo = '';
		etilismoStatus = 'nao'; etilismoDosesSemana = '';
		drogasStatus = 'nao'; drogasDescricao = '';
		alimentarCafeManha = ''; alimentarLancheManha = ''; alimentarAlmoco = '';
		alimentarLancheTarde = ''; alimentarCafeTarde = ''; alimentarJantar = ''; alimentarCeia = '';
		sonoHoraDormir = ''; sonoHoraAcordar = ''; sonoDescricao = '';
		atividadesSelecionadas = []; atividadeOutro = ''; atividadeFrequencia = ''; atividadeDuracao = '';
		examesImagem = []; examesLaboratoriais = []; dataColetaPadraoLab = '';
		pas = ''; pad = ''; temperatura = ''; frequenciaCardiaca = ''; frequenciaRespiratoria = ''; spo2 = '';
		pesoAtual = ''; altura = ''; imcCustomizado = ''; imcFoiEditadoManualmente = false;
		circunferenciaAbdominal = ''; circunferenciaQuadril = ''; circunferenciaPanturrilha = '';
		observacoesAntropometria = ''; exameFisicoGeral = '';
		mamasPosicao = ''; mamasSimetria = ''; mamasVolume = ''; mamasMamilos = '';
		mamasInspecaoEstaticaSemAbaulamentos = false; mamasInspecaoEstaticaObs = '';
		mamasInspecaoDinamicaSemAbaulamentos = false; mamasInspecaoDinamicaObs = '';
		mamasPalpacaoLinfonodos = ''; mamasExpressaoMamilar = ''; mamasExpressaoMamilarObs = '';
		genitaliaExterna = ''; genitaliaInterna = ''; palpacaoBimanual = '';
		exameNeurologico = ''; exameRespSuperior = ''; exameRespInferior = '';
		exameCardiovascular = ''; exameDigestorio = ''; exameGenitourinario = ''; exameDermatologico = '';
		avaliacaoTexto = '';
		prescricaoMedicamentos = []; condutaTexto = '';
		saveStatus = 'idle'; saveTimestamp = '';
		activeTab = 'subjetivo';
	}

	function preencherAnamnesieFicticia() {
		nomePaciente = 'Maria José da Silva';
		ocupacao = 'Aposentado(a)';
		naturalidade = 'Divinópolis - MG';
		sexoBiologico = 'F';
		genero = 'Feminino';
		raca = 'Parda';
		estadoCivil = 'Casado(a)';
		escolaridade = 'Ensino Médio Completo';
		religiao = 'Católica';
		nomeAcompanhante = 'Ana Paula da Silva';
		parentescoAcompanhante = 'filha';

		queixaPrincipal = 'Dor de cabeça forte há 3 dias';
		hma = 'Paciente relata cefaleia holocraniana, de caráter pulsátil, intensidade 7/10, com início há 3 dias, de forma gradual. Refere piora com esforço físico e exposição à luz (fotofobia). Nega febre, vômitos ou alteração visual. Fez uso de paracetamol 750mg com melhora parcial e temporária. Nega trauma craniano recente. Relata episódios semelhantes no passado, cerca de 2-3 vezes por mês, há aproximadamente 2 anos.';
		queixasSecundarias = [
			{ id: 'qs-1', queixa: 'Insônia há 2 semanas', historiaClinica: 'Dificuldade para iniciar o sono, acorda várias vezes à noite. Nega uso de eletrônicos antes de dormir. Relaciona com preocupações familiares.' },
			{ id: 'qs-2', queixa: 'Dor lombar crônica', historiaClinica: 'Lombalgia em região lombar baixa, sem irradiação para MMII, piora ao final do dia e melhora com repouso. Há cerca de 1 ano. Já fez fisioterapia com melhora parcial.' }
		];

		revisaoSistemas = 'Nega febre, emagrecimento, astenia. Nega dispneia, dor torácica, palpitações. Refere obstipação intestinal ocasional. Nega disúria, hematúria. Nega artralgia ou edema articular.';

		hppAlergias = 'Dipirona (rash cutâneo)';
		hppCirurgias = 'Cesariana (2005), colecistectomia videolaparoscópica (2018)';
		hppInternacoes = 'Internação por pneumonia em 2019 (7 dias)';
		hppTraumas = 'Nega';
		hppDoencasCronicas = 'Hipertensão Arterial Sistêmica diagnosticada há 8 anos. Diabetes Mellitus tipo 2 há 5 anos, em uso de metformina. Dislipidemia em tratamento.';

		medicamentosEmUso = [
			{ id: 'med-1', principioAtivo: 'Losartana Potássica', concentracao: '50 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Anti-hipertensivos', tipoPosologia: 'xyz', horarioX: 1, horarioY: 0, horarioZ: 1, posologiaTexto: '1-0-1', observacoes: '' },
			{ id: 'med-2', principioAtivo: 'Metformina', concentracao: '850 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Antidiabéticos / Hipoglicemiantes', tipoPosologia: 'xyz', horarioX: 1, horarioY: 1, horarioZ: 0, posologiaTexto: '1-1-0', observacoes: 'Tomar após as refeições' },
			{ id: 'med-3', principioAtivo: 'Sinvastatina', concentracao: '20 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Hipolipemiantes / Estatinas', tipoPosologia: 'xyz', horarioX: 0, horarioY: 0, horarioZ: 1, posologiaTexto: '0-0-1', observacoes: 'Tomar à noite' },
		];

		itensHistoriaFamiliar = [
			{ id: 'hf-mock-1', doenca: 'HAS', parentes: ['mãe', 'pai'] },
			{ id: 'hf-mock-2', doenca: 'DM2', parentes: ['mãe'] },
			{ id: 'hf-mock-3', doenca: 'IAM', parentes: ['pai'] },
			{ id: 'hf-mock-4', doenca: 'Câncer de mama', parentes: ['avó materna'] },
		];
		hfObservacoes = 'Pai faleceu por IAM aos 62 anos.';
		historiaOcupacional = 'Trabalhou como costureira por 25 anos em fábrica têxtil. Aposentada desde 2020. Exposição prolongada a poeira e ruído no ambiente de trabalho.';
		historiaPsicossocial = 'Mora com o marido em casa própria. Tem 2 filhos. Boa rede de apoio familiar. Participa de grupo de idosos na igreja. Nega conflitos familiares significativos.';

		tabagismoStatus = 'ex';
		tabagismoMacosDia = 1;
		tabagismoAnos = 15;

		etilismoStatus = 'nao';
		drogasStatus = 'nao';

		alimentarCafeManha = 'Café com leite, pão com margarina';
		alimentarAlmoco = 'Arroz, feijão, carne, salada';
		alimentarJantar = 'Sopa de legumes ou lanche';

		sonoHoraDormir = '22:30';
		sonoHoraAcordar = '06:00';
		sonoDescricao = 'Relata dificuldade para iniciar o sono. Acorda 2-3x durante a noite.';

		atividadesSelecionadas = ['Caminhada'];
		atividadeFrequencia = '3x por semana';
		atividadeDuracao = '30 minutos';

		// Objetivo
		pas = '148';
		pad = '92';
		temperatura = '36.5';
		frequenciaCardiaca = '78';
		frequenciaRespiratoria = '16';
		spo2 = '97';

		pesoAtual = '72';
		altura = '158';
		circunferenciaAbdominal = '96';
		circunferenciaQuadril = '104';

		exameFisicoGeral = 'Bom estado geral, corada, hidratada, acianótica, anictérica, afebril. Ativa, cooperativa, orientada em tempo e espaço. Marcha e fala sem alterações estruturais aparentes. Fácies atípica.';

		exameNeurologico = 'Lúcida e orientada (escala de coma de Glasgow 15). Pupilas isocóricas e fotorreativas. Ausência de déficits motores ou sensitivos focais. Coordenação motora preservada. Ausência de sinais de irritação meníngea. Reflexos osteotendíneos normais e simétricos.';
		exameCardiovascular = 'Ritmo cardíaco regular em 2 tempos, bulhas normofonéticas, sem sopros ou estalidos. Pulsos periféricos simétricos.';
		exameRespInferior = 'Tórax simétrico, expansibilidade preservada bilateralmente. Murmúrio vesicular universalmente audível, sem ruídos adventícios.';

		// Avaliação
		avaliacaoTexto = 'Paciente de 62 anos, sexo feminino, com quadro de cefaleia crônica recorrente com características migranosas (pulsátil, fotofobia, piora com esforço), com frequência aumentada nas últimas semanas. Antecedentes de HAS, DM2 e Dislipidemia em tratamento. PA no momento elevada (148x92 mmHg), pode estar contribuindo para piora da cefaleia.\n\nHipóteses diagnósticas:\n1. Migrânea sem aura — principal\n2. Cefaleia tensional crônica — diferencial\n3. Cefaleia secundária a HAS mal controlada — a investigar\n\nInsônia possivelmente relacionada ao quadro álgico crônico e preocupações familiares.';

		// Plano
		condutaTexto = '1. Ajuste anti-hipertensivo: aumentar Losartana para 100 mg/dia (50 mg 12/12h)\n2. Profilaxia de migrânea: iniciar Amitriptilina 25 mg à noite (benefício duplo: cefaleia + insônia)\n3. Solicitar exames: hemograma, glicemia de jejum, HbA1c, perfil lipídico, creatinina, TFG, fundoscopia\n4. Encaminhamento para Neurologia se não houver melhora em 30 dias\n5. Orientações sobre higiene do sono\n6. Retorno em 30 dias com exames';

		prescricaoMedicamentos = [
			{ id: 'presc-1', principioAtivo: 'Losartana Potássica', concentracao: '50 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Anti-hipertensivos', tipoPosologia: 'xyz', horarioX: 1, horarioY: 0, horarioZ: 1, posologiaTexto: '1-0-1', observacoes: 'Aumento de dose — era 50mg 1x/dia' },
			{ id: 'presc-2', principioAtivo: 'Amitriptilina', concentracao: '25 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Antidepressivos Tricíclicos', tipoPosologia: 'xyz', horarioX: 0, horarioY: 0, horarioZ: 1, posologiaTexto: '0-0-1', observacoes: 'Profilaxia de migrânea + insônia. Tomar 1-2h antes de dormir.' },
			{ id: 'presc-3', principioAtivo: 'Metformina', concentracao: '850 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Antidiabéticos / Hipoglicemiantes', tipoPosologia: 'xyz', horarioX: 1, horarioY: 1, horarioZ: 0, posologiaTexto: '1-1-0', observacoes: 'Manter — tomar após as refeições' },
			{ id: 'presc-4', principioAtivo: 'Sinvastatina', concentracao: '20 mg', formaFarmaceutica: 'Comprimido', classeFarmaceutica: 'Hipolipemiantes / Estatinas', tipoPosologia: 'xyz', horarioX: 0, horarioY: 0, horarioZ: 1, posologiaTexto: '0-0-1', observacoes: 'Manter — tomar à noite' },
		];

		// Expand some aparelhos that were filled
		collapsedAparelhos.delete('aparelho-neuro');
		collapsedAparelhos.delete('aparelho-cardio');
		collapsedAparelhos.delete('aparelho-resp-inf');
		collapsedAparelhos = new Set(collapsedAparelhos);

		// Save to localStorage
		salvarLocal();
	}

	// Auto-save on any form change (debounced)
	$effect(() => {
		// Touch all reactive state to track dependencies
		const _trigger = JSON.stringify(getFormData());
		if (saveDebounce) clearTimeout(saveDebounce);
		saveDebounce = setTimeout(() => {
			if (typeof localStorage !== 'undefined') {
				salvarLocal();
			}
		}, 1500);
	});

	// ══════════════════════════════════════════════════════════════
	//  TOAST & CLIPBOARD HELPER
	// ══════════════════════════════════════════════════════════════
	let toastVisible = $state(false);
	let toastMessage = $state('');

	function showToast(msg: string) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 2500);
	}

	async function copyTextToClipboard(text: string): Promise<boolean> {
		if (
			typeof navigator !== 'undefined' &&
			navigator.clipboard &&
			typeof navigator.clipboard.writeText === 'function'
		) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch (err) {
				console.warn('navigator.clipboard.writeText falhou, tentando fallback textarea:', err);
			}
		}

		try {
			const ta = document.createElement('textarea');
			ta.value = text;
			ta.style.position = 'fixed';
			ta.style.top = '0';
			ta.style.left = '-9999px';
			ta.style.width = '2em';
			ta.style.height = '2em';
			ta.style.padding = '0';
			ta.style.border = 'none';
			ta.style.outline = 'none';
			ta.style.boxShadow = 'none';
			ta.style.background = 'transparent';
			ta.setAttribute('readonly', '');
			document.body.appendChild(ta);
			ta.focus();
			ta.select();
			ta.setSelectionRange(0, ta.value.length);
			const successful = document.execCommand('copy');
			document.body.removeChild(ta);
			return successful;
		} catch (err) {
			console.error('Fallback execCommand falhou:', err);
			return false;
		}
	}

	function escapeHtml(str: string): string {
		if (!str) return '';
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// ══════════════════════════════════════════════════════════════
	//  EXPORTAÇÃO PARA CLIPBOARD (SOAP CONCISO, MÍNIMO DE CARACTERES)
	// ══════════════════════════════════════════════════════════════
	async function copySOAP() {
		try {
			const sections: string[] = [];

			// ── S: SUBJETIVO ──
			const sBlocks: string[] = [];

			const idParts: string[] = [];
			if (nomePaciente.trim()) idParts.push(`Pct: ${nomePaciente.trim()}`);
			if (sexoBiologico) idParts.push(`Sexo: ${sexoBiologico}${genero && genero !== sexoBiologico ? ` (${genero})` : ''}`);
			if (ocupacao.trim()) idParts.push(`Ocup: ${ocupacao.trim()}`);
			if (naturalidade.trim()) idParts.push(`Nat: ${naturalidade.trim()}`);
			const ec = estadoCivil === 'Outro' ? estadoCivilOutro : estadoCivil;
			if (ec?.trim()) idParts.push(`Est. Civil: ${ec.trim()}`);
			const esc = escolaridade === 'Outro' ? escolaridadeOutro : escolaridade;
			if (esc?.trim()) idParts.push(`Escolaridade: ${esc.trim()}`);
			if (nomeAcompanhante.trim()) {
				const paren = parentescoAcompanhante === 'outro' ? parentescoOutro : parentescoAcompanhante;
				idParts.push(`Acomp: ${nomeAcompanhante.trim()}${paren ? ` (${paren})` : ''}`);
			}
			if (idParts.length > 0) {
				sBlocks.push(`Identificação: ${idParts.join(' | ')}`);
			}

			if (queixaPrincipal.trim()) sBlocks.push(`QP: ${queixaPrincipal.trim()}`);
			if (hma.trim()) sBlocks.push(`HMA: ${hma.trim()}`);

			const validSecs = queixasSecundarias.filter(q => q.queixa?.trim() || q.historiaClinica?.trim());
			if (validSecs.length > 0) {
				const qLines = validSecs.map((q, i) => {
					const desc = [q.queixa?.trim(), q.historiaClinica?.trim()].filter(Boolean).join(' — ');
					return `  • Queixa ${i + 1}: ${desc}`;
				});
				sBlocks.push(`Queixas 2ªs:\n${qLines.join('\n')}`);
			}

			if (revisaoSistemas.trim()) sBlocks.push(`RS: ${revisaoSistemas.trim()}`);

			if (sexoBiologico === 'F') {
				const hgParts: string[] = [];
				if (gpncaeSummary) hgParts.push(gpncaeSummary);
				if (hgDum.trim()) hgParts.push(`DUM: ${hgDum}${tempoDesdeDum ? ` (${tempoDesdeDum})` : ''}`);
				if (hgMac.trim()) hgParts.push(`MAC: ${hgMac}${hgMacDescricao.trim() ? ` (${hgMacDescricao.trim()})` : ''}`);
				if (hgOutrasInfo.trim()) hgParts.push(`Obs: ${hgOutrasInfo.trim()}`);
				if (hgParts.length > 0) sBlocks.push(`HG: ${hgParts.join(' | ')}`);
			}

			const hppParts: string[] = [];
			if (hppAlergias.trim()) hppParts.push(`Alergias: ${hppAlergias.trim()}`);
			if (hppCirurgias.trim()) hppParts.push(`Cirurgias: ${hppCirurgias.trim()}`);
			if (hppInternacoes.trim()) hppParts.push(`Internações: ${hppInternacoes.trim()}`);
			if (hppTraumas.trim()) hppParts.push(`Traumas: ${hppTraumas.trim()}`);
			if (hppDoencasCronicas.trim()) hppParts.push(`D. Crônicas: ${hppDoencasCronicas.trim()}`);
			if (hppParts.length > 0) sBlocks.push(`HPP: ${hppParts.join(' | ')}`);

			if (medicamentosEmUso.length > 0) {
				const medLines = medicamentosEmUso.map(m => {
					const nome = [m.principioAtivo, m.concentracao, m.formaFarmaceutica].filter(Boolean).join(' ');
					const pos = m.posologiaTexto ? ` - ${m.posologiaTexto}` : '';
					const obs = m.observacoes ? ` (${m.observacoes})` : '';
					return `  • ${nome}${pos}${obs}`;
				});
				sBlocks.push(`Med em uso:\n${medLines.join('\n')}`);
			}

			const hfValid = itensHistoriaFamiliar.filter(item => item.doenca?.trim() || (item.parentes && item.parentes.length > 0));
			if (hfValid.length > 0 || hfObservacoes.trim()) {
				const hfItems = hfValid.map(item => `${item.doenca || 'Doença'}${item.parentes?.length ? ` (${item.parentes.join(', ')})` : ''}`);
				if (hfObservacoes.trim()) hfItems.push(`Obs: ${hfObservacoes.trim()}`);
				sBlocks.push(`HF: ${hfItems.join('; ')}`);
			}

			if (historiaOcupacional.trim()) sBlocks.push(`HO: ${historiaOcupacional.trim()}`);
			if (historiaPsicossocial.trim()) sBlocks.push(`HPS: ${historiaPsicossocial.trim()}`);

			const hvParts: string[] = [];
			if (tabagismoStatus === 'sim') {
				let tabDesc = 'Tabagista ativo';
				if (tabagismoMacosDia || tabagismoAnos) tabDesc += ` (${tabagismoMacosDia || 0} mçs/d x ${tabagismoAnos || 0}a = ${cargaTabagica} mçs-ano)`;
				if (fagerstromScore !== null) tabDesc += ` [Fagerström: ${fagerstromScore}p - ${fagerstromGrau}]`;
				hvParts.push(tabDesc);
			} else if (tabagismoStatus === 'ex') {
				let tabDesc = 'Ex-tabagista';
				if (tabagismoMacosDia || tabagismoAnos) tabDesc += ` (${tabagismoMacosDia || 0} mçs/d x ${tabagismoAnos || 0}a = ${cargaTabagica} mçs-ano)`;
				hvParts.push(tabDesc);
			}
			if (etilismoStatus !== 'nao') {
				hvParts.push(`Etilismo: ${etilismoStatus}${etilismoDosesSemana ? ` (${etilismoDosesSemana} doses/sem)` : ''}`);
			}
			if (drogasStatus === 'sim' || drogasDescricao.trim()) {
				hvParts.push(`Drogas: ${drogasStatus === 'sim' ? 'Uso ativo' : drogasStatus === 'ex' ? 'Ex-usuário' : ''}${drogasDescricao.trim() ? ` - ${drogasDescricao.trim()}` : ''}`);
			}
			const dietParts: string[] = [];
			if (alimentarCafeManha.trim()) dietParts.push(`Café: ${alimentarCafeManha.trim()}`);
			if (alimentarAlmoco.trim()) dietParts.push(`Almoço: ${alimentarAlmoco.trim()}`);
			if (alimentarJantar.trim()) dietParts.push(`Jantar: ${alimentarJantar.trim()}`);
			if (dietParts.length > 0) hvParts.push(`Dieta: ${dietParts.join(' | ')}`);
			if (sonoHoraDormir || sonoHoraAcordar || sonoDescricao.trim()) {
				const sonoHor = (sonoHoraDormir && sonoHoraAcordar) ? `${sonoHoraDormir} às ${sonoHoraAcordar}` : '';
				hvParts.push(`Sono: ${tempoSonoCalculado ? `${tempoSonoCalculado} ` : ''}${sonoHor ? `(${sonoHor}) ` : ''}${sonoDescricao.trim()}`.trim());
			}
			if (atividadesSelecionadas.length > 0 || atividadeOutro.trim()) {
				const ativs = [...atividadesSelecionadas, ...(atividadeOutro.trim() ? [atividadeOutro.trim()] : [])].join(', ');
				const det = [atividadeFrequencia, atividadeDuracao].filter(Boolean).join(' - ');
				hvParts.push(`Ativ física: ${ativs}${det ? ` (${det})` : ''}`);
			}
			if (hvParts.length > 0) sBlocks.push(`Hábitos:\n${hvParts.map(h => `  • ${h}`).join('\n')}`);

			if (sBlocks.length > 0) {
				sections.push(`SUBJETIVO:\n\n${sBlocks.join('\n\n')}`);
			}

			// ── O: OBJETIVO ──
			const oBlocks: string[] = [];

			const svParts: string[] = [];
			if (pas || pad) svParts.push(`PA: ${pas || '—'}x${pad || '—'} mmHg${classificacaoPA?.label ? ` (${classificacaoPA.label})` : ''}${pamCalculada ? ` [PAM: ${pamCalculada}]` : ''}`);
			if (frequenciaCardiaca) svParts.push(`FC: ${frequenciaCardiaca} bpm`);
			if (frequenciaRespiratoria) svParts.push(`FR: ${frequenciaRespiratoria} ipm`);
			if (temperatura) svParts.push(`Tax: ${temperatura}°C`);
			if (spo2) svParts.push(`SpO2: ${spo2}%`);
			if (svParts.length > 0) oBlocks.push(`SV: ${svParts.join(' | ')}`);

			const antParts: string[] = [];
			if (pesoAtual) antParts.push(`Peso: ${pesoAtual} kg`);
			if (altura) antParts.push(`Est: ${altura} cm`);
			if (imcCustomizado) antParts.push(`IMC: ${imcCustomizado} kg/m²${classificacaoIMC?.label ? ` (${classificacaoIMC.label})` : ''}`);
			if (circunferenciaAbdominal) antParts.push(`CA: ${circunferenciaAbdominal} cm`);
			if (circunferenciaQuadril) antParts.push(`CQ: ${circunferenciaQuadril} cm`);
			if (rcqCalculada) antParts.push(`RCQ: ${rcqCalculada}`);
			if (circunferenciaPanturrilha) antParts.push(`CP: ${circunferenciaPanturrilha} cm`);
			if (observacoesAntropometria.trim()) antParts.push(`Obs: ${observacoesAntropometria.trim()}`);
			if (antParts.length > 0) oBlocks.push(`Antropometria: ${antParts.join(' | ')}`);

			if (exameFisicoGeral.trim()) oBlocks.push(`EF Geral:\n${exameFisicoGeral.trim()}`);

			if (sexoBiologico === 'F') {
				const ginParts: string[] = [];
				const mamasParts: string[] = [];
				if (mamasPosicao || mamasSimetria || mamasVolume || mamasMamilos) {
					mamasParts.push([mamasPosicao, mamasSimetria, mamasVolume, mamasMamilos].filter(Boolean).join(', '));
				}
				if (mamasInspecaoEstaticaSemAbaulamentos) mamasParts.push('Estática s/ alterações');
				if (mamasInspecaoEstaticaObs.trim()) mamasParts.push(mamasInspecaoEstaticaObs.trim());
				if (mamasInspecaoDinamicaSemAbaulamentos) mamasParts.push('Dinâmica s/ alterações');
				if (mamasInspecaoDinamicaObs.trim()) mamasParts.push(mamasInspecaoDinamicaObs.trim());
				if (mamasPalpacaoLinfonodos.trim()) mamasParts.push(`Linfonodos: ${mamasPalpacaoLinfonodos.trim()}`);
				if (mamasExpressaoMamilar.trim() || mamasExpressaoMamilarObs.trim()) mamasParts.push(`Expressão: ${[mamasExpressaoMamilar, mamasExpressaoMamilarObs].filter(Boolean).join(' - ')}`);
				if (mamasParts.length > 0) ginParts.push(`Mamas: ${mamasParts.join('; ')}`);
				if (genitaliaExterna.trim()) ginParts.push(`Genitália Ext: ${genitaliaExterna.trim()}`);
				if (genitaliaInterna.trim()) ginParts.push(`Especular: ${genitaliaInterna.trim()}`);
				if (palpacaoBimanual.trim()) ginParts.push(`Toque: ${palpacaoBimanual.trim()}`);
				if (ginParts.length > 0) oBlocks.push(`Ginecológico:\n${ginParts.map(g => `  • ${g}`).join('\n')}`);
			}

			const apList: { nome: string; texto: string }[] = [
				{ nome: 'Neuro', texto: exameNeurologico.trim() },
				{ nome: 'Resp Sup', texto: exameRespSuperior.trim() },
				{ nome: 'Resp Inf', texto: exameRespInferior.trim() },
				{ nome: 'CV', texto: exameCardiovascular.trim() },
				{ nome: 'Digestório', texto: exameDigestorio.trim() },
				{ nome: 'GU', texto: exameGenitourinario.trim() },
				{ nome: 'Dermato', texto: exameDermatologico.trim() },
			];
			const apFilled = apList.filter(a => a.texto);
			if (apFilled.length > 0) {
				const apLines = apFilled.map(a => `  • ${a.nome}: ${a.texto}`);
				oBlocks.push(`Exame por Aparelhos:\n${apLines.join('\n')}`);
			}

			if (examesLaboratoriais.length > 0) {
				const labLines = examesLaboratoriais.map(l => {
					const val = l.valor ? `${l.valor} ${l.unidade || ''}`.trim() : 'Pendente';
					const ref = l.valoresReferencia ? ` (Ref: ${l.valoresReferencia})` : '';
					const dt = l.dataColeta ? ` [${l.dataColeta}]` : '';
					return `  • ${l.nome}: ${val}${ref}${dt}`;
				});
				oBlocks.push(`Exames Laboratoriais:\n${labLines.join('\n')}`);
			}

			const imgValidos = examesImagem.filter(e => e.nomeExame?.trim() || e.resultado?.trim());
			if (imgValidos.length > 0) {
				const imgLines = imgValidos.map(e => {
					const meta = [e.nomeExame?.trim(), e.dataRealizacao ? `(${e.dataRealizacao})` : '', e.nomeMedico ? `— Dr(a). ${e.nomeMedico}` : ''].filter(Boolean).join(' ');
					return `  • ${meta}:\n    ${e.resultado?.trim() || 'Sem laudo'}`;
				});
				oBlocks.push(`Exames de Imagem / Funcionais:\n${imgLines.join('\n')}`);
			}

			if (oBlocks.length > 0) {
				sections.push(`OBJETIVO:\n\n${oBlocks.join('\n\n')}`);
			}

			// ── A: AVALIAÇÃO ──
			if (avaliacaoTexto.trim()) {
				sections.push(`AVALIAÇÃO:\n\n${avaliacaoTexto.trim()}`);
			}

			// ── P: PLANO ──
			const pBlocks: string[] = [];
			if (prescricaoMedicamentos.length > 0) {
				const rxLines = prescricaoMedicamentos.map((m, idx) => {
					const nome = [m.principioAtivo, m.concentracao, m.formaFarmaceutica].filter(Boolean).join(' ');
					const pos = m.posologiaTexto ? ` — ${m.posologiaTexto}` : '';
					const obs = m.observacoes ? ` (${m.observacoes})` : '';
					return `  ${idx + 1}. ${nome}${pos}${obs}`;
				});
				pBlocks.push(`Prescrição:\n${rxLines.join('\n')}`);
			}
			if (condutaTexto.trim()) {
				pBlocks.push(`Conduta:\n${condutaTexto.trim()}`);
			}

			if (pBlocks.length > 0) {
				sections.push(`PLANO:\n\n${pBlocks.join('\n\n')}`);
			}

			const soap = sections.join('\n\n');

			if (!soap.trim()) {
				showToast('Nenhum campo preenchido para copiar');
				return;
			}

			const ok = await copyTextToClipboard(soap.trim());
			if (ok) {
				showToast('Texto SOAP copiado para a área de transferência!');
			} else {
				showToast('Erro ao copiar para a área de transferência');
			}
		} catch (err) {
			console.error('Erro ao gerar SOAP:', err);
			showToast('Erro ao processar SOAP');
		}
	}

	// ══════════════════════════════════════════════════════════════
	//  EXPORTAÇÃO EM PDF (ESTILO IMPRESSÃO / APENAS CAMPOS PREENCHIDOS)
	// ══════════════════════════════════════════════════════════════
	function generatePDF() {
		let printView = document.getElementById('print-view');
		if (!printView) {
			printView = document.createElement('div');
			printView.id = 'print-view';
			document.body.appendChild(printView);
		}
		printView.innerHTML = '';

		const dataHoje = new Date().toLocaleDateString('pt-BR');
		let html = `
		<div class="print-container">
			<div class="print-header">
				<div class="print-header-top">
					<div class="print-title">ATENDIMENTO CLÍNICO — ANAMNESE DO ADULTO</div>
					<div class="print-date">Data: <strong>${dataHoje}</strong></div>
				</div>
		`;

		const patientCells: string[] = [];
		if (nomePaciente.trim()) patientCells.push(`<div class="print-cell print-cell-full"><strong>Paciente:</strong> ${escapeHtml(nomePaciente.trim())}</div>`);
		if (sexoBiologico) {
			const sLabel = sexoBiologico === 'M' ? 'Masculino' : sexoBiologico === 'F' ? 'Feminino' : sexoBiologico;
			const gLabel = genero && genero !== sexoBiologico ? ` (${escapeHtml(genero)})` : '';
			patientCells.push(`<div class="print-cell"><strong>Sexo:</strong> ${sLabel}${gLabel}</div>`);
		}
		if (naturalidade.trim()) patientCells.push(`<div class="print-cell"><strong>Nat:</strong> ${escapeHtml(naturalidade.trim())}</div>`);
		if (ocupacao.trim()) patientCells.push(`<div class="print-cell"><strong>Ocupação:</strong> ${escapeHtml(ocupacao.trim())}</div>`);
		const ec = estadoCivil === 'Outro' ? estadoCivilOutro : estadoCivil;
		if (ec?.trim()) patientCells.push(`<div class="print-cell"><strong>Est. Civil:</strong> ${escapeHtml(ec.trim())}</div>`);
		const esc = escolaridade === 'Outro' ? escolaridadeOutro : escolaridade;
		if (esc?.trim()) patientCells.push(`<div class="print-cell"><strong>Escolaridade:</strong> ${escapeHtml(esc.trim())}</div>`);
		const rc = raca === 'Outro' ? racaOutro : raca;
		if (rc?.trim()) patientCells.push(`<div class="print-cell"><strong>Raça/Cor:</strong> ${escapeHtml(rc.trim())}</div>`);
		const rel = religiao === 'Outro' ? religiaoOutro : religiao;
		if (rel?.trim()) patientCells.push(`<div class="print-cell"><strong>Religião:</strong> ${escapeHtml(rel.trim())}</div>`);
		if (nomeAcompanhante.trim()) {
			const paren = parentescoAcompanhante === 'outro' ? parentescoOutro : parentescoAcompanhante;
			patientCells.push(`<div class="print-cell print-cell-full"><strong>Acompanhante:</strong> ${escapeHtml(nomeAcompanhante.trim())}${paren ? ` (${escapeHtml(paren)})` : ''}</div>`);
		}

		if (patientCells.length > 0) {
			html += `
				<div class="print-patient-box">
					<div class="print-patient-grid">
						${patientCells.join('')}
					</div>
				</div>
			`;
		}
		html += `</div>`; // closes print-header

		function renderSection(title: string, tag: string, fields: Array<{ label: string; val: string; isBlock?: boolean }>, customHtml = ''): string {
			if (fields.length === 0 && !customHtml) return '';
			const fieldsHtml = fields.map(f => {
				if (f.isBlock) {
					return `
						<div class="print-field print-field-full">
							<span class="print-field-label">${escapeHtml(f.label)}:</span>
							<div class="print-field-val print-field-block">${escapeHtml(f.val)}</div>
						</div>
					`;
				}
				return `
					<div class="print-field">
						<span class="print-field-label">${escapeHtml(f.label)}:</span>
						<span class="print-field-val">${escapeHtml(f.val)}</span>
					</div>
				`;
			}).join('');

			return `
				<div class="print-section">
					<div class="print-section-header">
						<span class="print-tag">${tag}</span>
						<span class="print-section-title">${title}</span>
					</div>
					<div class="print-section-body">
						${customHtml}
						${fieldsHtml}
					</div>
				</div>
			`;
		}

		// ── I. SUBJETIVO ──
		let sHtml = '';

		// QP & HMA
		const qpHmaFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (queixaPrincipal.trim()) qpHmaFields.push({ label: 'Queixa Principal (QP)', val: queixaPrincipal.trim() });
		if (hma.trim()) qpHmaFields.push({ label: 'História da Moléstia Atual (HMA)', val: hma.trim(), isBlock: true });
		sHtml += renderSection('Queixa Principal & HMA', 'S1', qpHmaFields);

		// Queixas secundárias
		const validSecs = queixasSecundarias.filter(q => q.queixa?.trim() || q.historiaClinica?.trim());
		if (validSecs.length > 0) {
			const qSecFields = validSecs.map((q, i) => ({
				label: `Queixa Secundária ${i + 1}`,
				val: [q.queixa?.trim(), q.historiaClinica?.trim()].filter(Boolean).join(' — '),
				isBlock: true
			}));
			sHtml += renderSection('Queixas Secundárias', 'S2', qSecFields);
		}

		// Revisão de sistemas
		if (revisaoSistemas.trim()) {
			sHtml += renderSection('Revisão de Sistemas', 'S3', [{ label: 'Revisão de Sistemas', val: revisaoSistemas.trim(), isBlock: true }]);
		}

		// História Ginecológica
		if (sexoBiologico === 'F') {
			const hgFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
			if (gpncaeSummary) hgFields.push({ label: 'Gestações / Partos (GPA)', val: gpncaeSummary });
			if (hgDum.trim()) hgFields.push({ label: 'DUM', val: `${hgDum.trim()}${tempoDesdeDum ? ` (${tempoDesdeDum})` : ''}` });
			if (hgMac.trim()) hgFields.push({ label: 'Método Anticoncepcional', val: `${hgMac.trim()}${hgMacDescricao.trim() ? ` (${hgMacDescricao.trim()})` : ''}` });
			if (hgOutrasInfo.trim()) hgFields.push({ label: 'Outras Informações Ginecológicas', val: hgOutrasInfo.trim(), isBlock: true });
			sHtml += renderSection('História Ginecológica', 'S4', hgFields);
		}

		// HPP
		const hppFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (hppAlergias.trim()) hppFields.push({ label: 'Alergias', val: hppAlergias.trim() });
		if (hppCirurgias.trim()) hppFields.push({ label: 'Cirurgias Prévias', val: hppCirurgias.trim() });
		if (hppInternacoes.trim()) hppFields.push({ label: 'Internações Anteriores', val: hppInternacoes.trim() });
		if (hppTraumas.trim()) hppFields.push({ label: 'Traumas', val: hppTraumas.trim() });
		if (hppDoencasCronicas.trim()) hppFields.push({ label: 'Doenças Crônicas', val: hppDoencasCronicas.trim(), isBlock: true });
		sHtml += renderSection('História Patológica Pregressa (HPP)', 'S5', hppFields);

		// Medicamentos em Uso
		if (medicamentosEmUso.length > 0) {
			const medRows = medicamentosEmUso.map(m => `
				<tr>
					<td><strong>${escapeHtml(m.principioAtivo)}</strong> ${m.concentracao ? `<span style="color:#64748b;">${escapeHtml(m.concentracao)}</span>` : ''}</td>
					<td>${escapeHtml(m.formaFarmaceutica || '—')}</td>
					<td><strong>${escapeHtml(m.posologiaTexto || '—')}</strong></td>
					<td>${escapeHtml(m.observacoes || '—')}</td>
				</tr>
			`).join('');
			const medTableHtml = `
				<table class="print-table">
					<thead>
						<tr>
							<th>Medicamento</th>
							<th>Forma</th>
							<th>Posologia / Horários</th>
							<th>Observações</th>
						</tr>
					</thead>
					<tbody>${medRows}</tbody>
				</table>
			`;
			sHtml += renderSection('Medicamentos em Uso', 'S6', [], medTableHtml);
		}

		// História Familiar
		const hfValid = itensHistoriaFamiliar.filter(item => item.doenca?.trim() || (item.parentes && item.parentes.length > 0));
		if (hfValid.length > 0 || hfObservacoes.trim()) {
			const hfFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
			if (hfValid.length > 0) {
				hfFields.push({
					label: 'Doenças Familiares',
					val: hfValid.map(item => `${item.doenca || 'Doença'}${item.parentes?.length ? ` (${item.parentes.join(', ')})` : ''}`).join('; '),
					isBlock: true
				});
			}
			if (hfObservacoes.trim()) {
				hfFields.push({ label: 'Observações HF', val: hfObservacoes.trim(), isBlock: true });
			}
			sHtml += renderSection('História Familiar', 'S7', hfFields);
		}

		// História Ocupacional & Psicossocial
		const hoHpsFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (historiaOcupacional.trim()) hoHpsFields.push({ label: 'História Ocupacional', val: historiaOcupacional.trim(), isBlock: true });
		if (historiaPsicossocial.trim()) hoHpsFields.push({ label: 'História Psicossocial', val: historiaPsicossocial.trim(), isBlock: true });
		sHtml += renderSection('História Ocupacional & Psicossocial', 'S8', hoHpsFields);

		// Hábitos de Vida
		const hvFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (tabagismoStatus === 'sim') {
			let tabVal = 'Tabagista ativo';
			if (tabagismoMacosDia || tabagismoAnos) tabVal += ` (${tabagismoMacosDia || 0} maços/dia por ${tabagismoAnos || 0} anos = ${cargaTabagica} maços-ano)`;
			if (fagerstromScore !== null) tabVal += ` [Fagerström: ${fagerstromScore} pts - ${fagerstromGrau}]`;
			hvFields.push({ label: 'Tabagismo', val: tabVal });
		} else if (tabagismoStatus === 'ex') {
			let tabVal = 'Ex-tabagista';
			if (tabagismoMacosDia || tabagismoAnos) tabVal += ` (${tabagismoMacosDia || 0} maços/dia por ${tabagismoAnos || 0} anos = ${cargaTabagica} maços-ano)`;
			hvFields.push({ label: 'Tabagismo', val: tabVal });
		}
		if (etilismoStatus !== 'nao') {
			hvFields.push({ label: 'Etilismo', val: `${etilismoStatus}${etilismoDosesSemana ? ` (${etilismoDosesSemana} doses/semana)` : ''}` });
		}
		if (drogasStatus === 'sim' || drogasDescricao.trim()) {
			hvFields.push({ label: 'Drogas / Substâncias', val: `${drogasStatus === 'sim' ? 'Uso ativo' : drogasStatus === 'ex' ? 'Ex-usuário' : ''}${drogasDescricao.trim() ? ` — ${drogasDescricao.trim()}` : ''}` });
		}
		// Refeições
		const meals: string[] = [];
		if (alimentarCafeManha.trim()) meals.push(`Café da manhã: ${alimentarCafeManha.trim()}`);
		if (alimentarLancheManha.trim()) meals.push(`Lanche manhã: ${alimentarLancheManha.trim()}`);
		if (alimentarAlmoco.trim()) meals.push(`Almoço: ${alimentarAlmoco.trim()}`);
		if (alimentarLancheTarde.trim() || alimentarCafeTarde.trim()) meals.push(`Café/Lanche tarde: ${[alimentarLancheTarde, alimentarCafeTarde].filter(Boolean).join('; ')}`);
		if (alimentarJantar.trim()) meals.push(`Jantar: ${alimentarJantar.trim()}`);
		if (alimentarCeia.trim()) meals.push(`Ceia: ${alimentarCeia.trim()}`);
		if (meals.length > 0) hvFields.push({ label: 'Alimentação', val: meals.join(' | '), isBlock: true });
		// Sono
		if (sonoHoraDormir || sonoHoraAcordar || sonoDescricao.trim()) {
			const sHor = (sonoHoraDormir && sonoHoraAcordar) ? `${sonoHoraDormir} às ${sonoHoraAcordar}` : '';
			hvFields.push({ label: 'Sono', val: `${tempoSonoCalculado ? `${tempoSonoCalculado} ` : ''}${sHor ? `(${sHor}) ` : ''}${sonoDescricao.trim()}`.trim() });
		}
		// Atividade Física
		if (atividadesSelecionadas.length > 0 || atividadeOutro.trim()) {
			const ativs = [...atividadesSelecionadas, ...(atividadeOutro.trim() ? [atividadeOutro.trim()] : [])].join(', ');
			const det = [atividadeFrequencia, atividadeDuracao].filter(Boolean).join(' — ');
			hvFields.push({ label: 'Atividade Física', val: `${ativs}${det ? ` (${det})` : ''}` });
		}
		sHtml += renderSection('Hábitos de Vida', 'S9', hvFields);

		if (sHtml) {
			html += `<div class="print-block-title">I. SUBJETIVO</div>${sHtml}`;
		}

		// ── II. OBJETIVO ──
		let oHtml = '';

		// Sinais Vitais
		const svFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (pas || pad) svFields.push({ label: 'Pressão Arterial', val: `${pas || '—'}x${pad || '—'} mmHg${classificacaoPA?.label ? ` (${classificacaoPA.label})` : ''}${pamCalculada ? ` [PAM: ${pamCalculada} mmHg]` : ''}` });
		if (frequenciaCardiaca) svFields.push({ label: 'Freq. Cardíaca', val: `${frequenciaCardiaca} bpm` });
		if (frequenciaRespiratoria) svFields.push({ label: 'Freq. Respiratória', val: `${frequenciaRespiratoria} ipm` });
		if (temperatura) svFields.push({ label: 'Temperatura', val: `${temperatura} °C` });
		if (spo2) svFields.push({ label: 'Saturação O₂', val: `${spo2} %` });
		oHtml += renderSection('Sinais Vitais', 'EF1', svFields);

		// Antropometria
		const antFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (pesoAtual) antFields.push({ label: 'Peso Atual', val: `${pesoAtual} kg` });
		if (altura) antFields.push({ label: 'Estatura', val: `${altura} cm` });
		if (imcCustomizado) antFields.push({ label: 'IMC', val: `${imcCustomizado} kg/m²${classificacaoIMC?.label ? ` (${classificacaoIMC.label})` : ''}` });
		if (circunferenciaAbdominal) antFields.push({ label: 'Circunf. Abdominal', val: `${circunferenciaAbdominal} cm` });
		if (circunferenciaQuadril) antFields.push({ label: 'Circunf. Quadril', val: `${circunferenciaQuadril} cm` });
		if (rcqCalculada) antFields.push({ label: 'Relação Cintura/Quadril (RCQ)', val: rcqCalculada });
		if (circunferenciaPanturrilha) antFields.push({ label: 'Circunf. Panturrilha', val: `${circunferenciaPanturrilha} cm` });
		if (observacoesAntropometria.trim()) antFields.push({ label: 'Observações Antropometria', val: observacoesAntropometria.trim(), isBlock: true });
		oHtml += renderSection('Antropometria', 'EF2', antFields);

		// Exame Físico Geral
		if (exameFisicoGeral.trim()) {
			oHtml += renderSection('Exame Físico Geral', 'EF3', [{ label: 'Exame Físico Geral / Ectoscopia', val: exameFisicoGeral.trim(), isBlock: true }]);
		}

		// Exame Ginecológico
		if (sexoBiologico === 'F') {
			const ginFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
			const mamasParts: string[] = [];
			if (mamasPosicao || mamasSimetria || mamasVolume || mamasMamilos) {
				mamasParts.push([mamasPosicao, mamasSimetria, mamasVolume, mamasMamilos].filter(Boolean).join(', '));
			}
			if (mamasInspecaoEstaticaSemAbaulamentos) mamasParts.push('Estática sem retrações/abaulamentos');
			if (mamasInspecaoEstaticaObs.trim()) mamasParts.push(mamasInspecaoEstaticaObs.trim());
			if (mamasInspecaoDinamicaSemAbaulamentos) mamasParts.push('Dinâmica sem alterações');
			if (mamasInspecaoDinamicaObs.trim()) mamasParts.push(mamasInspecaoDinamicaObs.trim());
			if (mamasPalpacaoLinfonodos.trim()) mamasParts.push(`Linfonodos: ${mamasPalpacaoLinfonodos.trim()}`);
			if (mamasExpressaoMamilar.trim() || mamasExpressaoMamilarObs.trim()) mamasParts.push(`Expressão: ${[mamasExpressaoMamilar, mamasExpressaoMamilarObs].filter(Boolean).join(' - ')}`);
			if (mamasParts.length > 0) ginFields.push({ label: 'Mamas', val: mamasParts.join('; '), isBlock: true });
			if (genitaliaExterna.trim()) ginFields.push({ label: 'Genitália Externa', val: genitaliaExterna.trim(), isBlock: true });
			if (genitaliaInterna.trim()) ginFields.push({ label: 'Genitália Interna (Especular)', val: genitaliaInterna.trim(), isBlock: true });
			if (palpacaoBimanual.trim()) ginFields.push({ label: 'Palpação Bimanual / Toque', val: palpacaoBimanual.trim(), isBlock: true });
			oHtml += renderSection('Exame Ginecológico', 'EF4', ginFields);
		}

		// Exame por aparelhos
		const apFields: Array<{ label: string; val: string; isBlock?: boolean }> = [];
		if (exameNeurologico.trim()) apFields.push({ label: 'Neurológico', val: exameNeurologico.trim(), isBlock: true });
		if (exameRespSuperior.trim()) apFields.push({ label: 'Respiratório Superior', val: exameRespSuperior.trim(), isBlock: true });
		if (exameRespInferior.trim()) apFields.push({ label: 'Respiratório Inferior', val: exameRespInferior.trim(), isBlock: true });
		if (exameCardiovascular.trim()) apFields.push({ label: 'Cardiovascular', val: exameCardiovascular.trim(), isBlock: true });
		if (exameDigestorio.trim()) apFields.push({ label: 'Digestório / Abdome', val: exameDigestorio.trim(), isBlock: true });
		if (exameGenitourinario.trim()) apFields.push({ label: 'Genitourinário', val: exameGenitourinario.trim(), isBlock: true });
		if (exameDermatologico.trim()) apFields.push({ label: 'Dermatológico / Tegumento', val: exameDermatologico.trim(), isBlock: true });
		oHtml += renderSection('Exame por Aparelhos e Sistemas', 'EF5', apFields);

		// Exames Laboratoriais
		if (examesLaboratoriais.length > 0) {
			const labRows = examesLaboratoriais.map(l => `
				<tr>
					<td><strong>${escapeHtml(l.nome)}</strong> ${l.pacote ? `<span style="font-size:8px; color:#64748b;">(${escapeHtml(l.pacote)})</span>` : ''}</td>
					<td><strong>${escapeHtml(l.valor || 'Pendente')}</strong> ${escapeHtml(l.unidade || '')}</td>
					<td>${escapeHtml(l.valoresReferencia || '—')}</td>
					<td>${escapeHtml(l.dataColeta || dataColetaPadraoLab || '—')}</td>
				</tr>
			`).join('');
			const labTableHtml = `
				<table class="print-table">
					<thead>
						<tr>
							<th>Exame</th>
							<th>Resultado</th>
							<th>Valor de Referência</th>
							<th>Data Coleta</th>
						</tr>
					</thead>
					<tbody>${labRows}</tbody>
				</table>
			`;
			oHtml += renderSection('Exames Laboratoriais', 'EF6', [], labTableHtml);
		}

		// Exames de imagem
		const imgValidos = examesImagem.filter(e => e.nomeExame?.trim() || e.resultado?.trim());
		if (imgValidos.length > 0) {
			const imgCardsHtml = imgValidos.map((e, idx) => `
				<div class="print-exame-card">
					<div class="print-exame-head">
						<strong>${idx + 1}. ${escapeHtml(e.nomeExame || 'Exame')}</strong>
						<span>${e.dataRealizacao ? `Data: ${escapeHtml(e.dataRealizacao)}` : ''} ${e.nomeMedico ? `— Dr(a). ${escapeHtml(e.nomeMedico)}` : ''}</span>
					</div>
					${e.resultado ? `<div class="print-exame-res">${escapeHtml(e.resultado)}</div>` : ''}
				</div>
			`).join('');
			oHtml += renderSection('Exames de Imagem e Funcionais', 'EF7', [], imgCardsHtml);
		}

		if (oHtml) {
			html += `<div class="print-block-title">II. OBJETIVO</div>${oHtml}`;
		}

		// ── III. AVALIAÇÃO ──
		if (avaliacaoTexto.trim()) {
			html += `
				<div class="print-block-title">III. AVALIAÇÃO</div>
				${renderSection('Avaliação Clínica & Hipóteses Diagnósticas', 'A1', [{ label: 'Avaliação / Raciocínio Clínico', val: avaliacaoTexto.trim(), isBlock: true }])}
			`;
		}

		// ── IV. PLANO E CONDUTA ──
		let pHtml = '';
		if (prescricaoMedicamentos.length > 0) {
			const rxRows = prescricaoMedicamentos.map(m => `
				<tr>
					<td><strong>${escapeHtml(m.principioAtivo)}</strong> ${m.concentracao ? `<span style="color:#64748b;">${escapeHtml(m.concentracao)}</span>` : ''}</td>
					<td>${escapeHtml(m.formaFarmaceutica || '—')}</td>
					<td><strong>${escapeHtml(m.posologiaTexto || '—')}</strong></td>
					<td>${escapeHtml(m.observacoes || '—')}</td>
				</tr>
			`).join('');
			const rxTableHtml = `
				<table class="print-table">
					<thead>
						<tr>
							<th>Medicamento Prescrito</th>
							<th>Forma</th>
							<th>Posologia</th>
							<th>Orientações / Observações</th>
						</tr>
					</thead>
					<tbody>${rxRows}</tbody>
				</table>
			`;
			pHtml += renderSection('Prescrição Medicamentosa', 'P1', [], rxTableHtml);
		}

		if (condutaTexto.trim()) {
			pHtml += renderSection('Conduta & Recomendações', 'P2', [{ label: 'Conduta Clínica / Orientações / Encaminhamentos', val: condutaTexto.trim(), isBlock: true }]);
		}

		if (pHtml) {
			html += `<div class="print-block-title">IV. PLANO E CONDUTA</div>${pHtml}`;
		}

		// Signature Box
		html += `
			<div class="print-signature-box">
				<div class="print-sig-line"></div>
				<div class="print-sig-name">Assinatura e Carimbo do Médico</div>
				<div class="print-sig-details">CRM / UF</div>
			</div>
		</div>
		`;

		if (!patientCells.length && !sHtml && !oHtml && !avaliacaoTexto.trim() && !pHtml) {
			showToast('Nenhum campo preenchido para exportar em PDF');
			return;
		}

		printView.innerHTML = html;
		window.print();
	}

	// Load on mount
	import { onMount } from 'svelte';
	onMount(() => {
		carregarLocal();
	});
</script>

<svelte:head>
	<title>Anamnese do Adulto — SOAP</title>
	<meta
		name="description"
		content="Prontuário estruturado e anamnese do adulto no formato SOAP"
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Datalists for Autocomplete -->
<datalist id="ocupacoes-datalist">
	{#each sugestoesOcupacao as o}
		<option value={o}></option>
	{/each}
</datalist>

<datalist id="naturalidades-datalist">
	{#each sugestoesNaturalidade as n}
		<option value={n}></option>
	{/each}
</datalist>

<!-- Toast Notification -->
{#if toastVisible}
	<div class="toast" class:visible={toastVisible}>
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" /></svg>
		{toastMessage}
	</div>
{/if}

<div class="soap-app">
	<!-- ═══ HEADER / TOPBAR ═══ -->
	<header class="topbar">
		<div class="topbar-left">
			<a href="/" class="btn-back" title="Voltar ao Hub">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="19" y1="12" x2="5" y2="12"></line>
					<polyline points="12 19 5 12 12 5"></polyline>
				</svg>
				<span>Voltar</span>
			</a>
			<div class="brand">
				<span class="brand-title">Anamnese Adulto</span>
				<span class="brand-badge">SOAP</span>
			</div>
		</div>

		<!-- Main 4 Tabs Navigation -->
		<nav class="tabs-nav" aria-label="Abas SOAP">
			{#each tabs as tab}
				<button
					type="button"
					class="tab-btn"
					class:active={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					<span class="tab-letter {tab.id}">{tab.letter}</span>
					<span class="tab-label">{tab.label}</span>
				</button>
			{/each}
		</nav>

		<div class="topbar-right">
			<button type="button" class="btn-topbar-action btn-copy-soap" title="Copiar anamnese formatada em SOAP (mínimo de caracteres)" onclick={copySOAP}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
				<span>Copiar SOAP</span>
			</button>
			<button type="button" class="btn-topbar-action btn-pdf" title="Exportar atendimento completo em PDF" onclick={generatePDF}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
				<span>PDF</span>
			</button>
			<button type="button" class="btn-topbar-action btn-clear" title="Limpar toda a consulta" onclick={() => limparConsulta()}>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
				<span>Limpar</span>
			</button>
			<span class="status-indicator" title={saveStatus === 'ok' ? `Salvo às ${saveTimestamp}` : saveStatus === 'error' ? 'Erro ao salvar' : 'Aguardando edição'}>
				<span class="status-dot" class:status-ok={saveStatus === 'ok'} class:status-error={saveStatus === 'error'} class:status-idle={saveStatus === 'idle'}></span>
				<span class="status-text">
					{#if saveStatus === 'ok'}
						Salvo {saveTimestamp}
					{:else if saveStatus === 'error'}
						Erro ao salvar
					{:else}
						Aguardando
					{/if}
				</span>
			</span>
		</div>
	</header>

	<!-- ═══ MAIN LAYOUT (Sidebar + Content) ═══ -->
	<div class="layout-body">
		<!-- ── SIDEBAR NAVEGAÇÃO LATERAL (Somente da aba em edição) ── -->
		<aside class="sidebar-nav">
			<div class="sidebar-header">
				<span class="sidebar-tag {activeTab}"
					>{tabs.find((t) => t.id === activeTab)?.letter}</span
				>
				<span class="sidebar-title"
					>Seções de {tabs.find((t) => t.id === activeTab)
						?.label}</span
				>
			</div>

			<nav class="sidebar-links">
				{#if currentSubSections.length > 0}
					{#each currentSubSections as sec}
						<button
							type="button"
							class="nav-link"
							class:active={activeSubSection === sec.id}
							onclick={() => scrollToSection(sec.id)}
						>
							<span class="nav-num">{sec.num}</span>
							<span class="nav-text">{sec.label}</span>
						</button>
					{/each}
				{:else}
					<div class="sidebar-empty">
						<span>Nenhuma seção adicionada ainda nesta aba.</span>
					</div>
				{/if}
			</nav>
		</aside>

		<!-- ── CONTEÚDO PRINCIPAL ── -->
		<main class="main-content">
			<!-- ═══════════════════════════════════════════════════ -->
			<!-- ═══ ABA 1: SUBJETIVO ═══ -->
			<!-- ═══════════════════════════════════════════════════ -->
			{#if activeTab === "subjetivo"}
				<div class="tab-pane fade-in">
					<div class="tab-header sub-header">
						<div class="tab-badge sub">S</div>
						<div>
							<h1 class="tab-title">Subjetivo</h1>
							<p class="tab-subtitle">
								História clínica, queixas, identificação e dados
								relatados pelo paciente.
							</p>
						</div>
					</div>

					<!-- ── SEÇÃO 01 · IDENTIFICAÇÃO (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-identificacao"
						class:collapsed={collapsedSections.has(
							"sec-identificacao",
						)}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-identificacao")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-identificacao");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub">01</span>
								<h2 class="section-title">Identificação</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{nomePaciente
										? nomePaciente
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-identificacao")}
							<div class="section-body">
								<div class="form-grid">
									<!-- 1. Nome -->
									<div class="form-group span-2">
										<label
											for="id-nome"
											class="form-label required"
											>1. Nome completo</label
										>
										<input
											id="id-nome"
											type="text"
											class="form-control"
											placeholder="Digite o nome completo do paciente..."
											bind:value={nomePaciente}
										/>
									</div>

									<!-- 2. Ocupação -->
									<div class="form-group">
										<label
											for="id-ocupacao"
											class="form-label"
										>
											2. Ocupação
											<span class="label-hint"
												>(com sugestões)</span
											>
										</label>
										<input
											id="id-ocupacao"
											type="text"
											class="form-control"
											list="ocupacoes-datalist"
											placeholder="Selecione ou digite a ocupação..."
											bind:value={ocupacao}
										/>
									</div>

									<!-- 3. Naturalidade -->
									<div class="form-group">
										<label
											for="id-naturalidade"
											class="form-label"
										>
											3. Naturalidade
											<span class="label-hint"
												>(com sugestões)</span
											>
										</label>
										<input
											id="id-naturalidade"
											type="text"
											class="form-control"
											list="naturalidades-datalist"
											placeholder="Selecione ou digite a cidade..."
											bind:value={naturalidade}
										/>
									</div>

									<!-- 4. Sexo biológico -->
									<div class="form-group">
										<span class="form-label required"
											>4. Sexo biológico</span
										>
										<div class="radio-cards-row">
											<label
												class="radio-card"
												class:checked={sexoBiologico ===
													"M"}
											>
												<input
													type="radio"
													name="sexoBiologico"
													value="M"
													bind:group={sexoBiologico}
												/>
												<span class="radio-custom"
												></span>
												<span class="radio-card-text">
													<strong>M</strong> · Masculino
												</span>
											</label>

											<label
												class="radio-card"
												class:checked={sexoBiologico ===
													"F"}
											>
												<input
													type="radio"
													name="sexoBiologico"
													value="F"
													bind:group={sexoBiologico}
												/>
												<span class="radio-custom"
												></span>
												<span class="radio-card-text">
													<strong>F</strong> · Feminino
												</span>
											</label>
										</div>
									</div>

									<!-- 5. Gênero -->
									<div class="form-group">
										<label
											for="id-genero"
											class="form-label"
											>5. Identidade de gênero</label
										>
										<select
											id="id-genero"
											class="form-select"
											bind:value={genero}
										>
											<option value=""
												>Selecione...</option
											>
											<option value="cis"
												>Cisgênero / Cis</option
											>
											<option value="trans"
												>Transgênero / Trans</option
											>
											<option value="nao_binario"
												>Não binário</option
											>
											<option value="outros"
												>Outros</option
											>
										</select>
										{#if genero === "outros"}
											<input
												type="text"
												class="form-control sub-input"
												placeholder="Especifique a identidade de gênero..."
												bind:value={generoOutro}
											/>
										{/if}
									</div>

									<!-- 6. Raça / Cor -->
									<div class="form-group">
										<label for="id-raca" class="form-label"
											>6. Raça / Cor</label
										>
										<select
											id="id-raca"
											class="form-select"
											bind:value={raca}
										>
											<option value=""
												>Selecione...</option
											>
											<option value="branca"
												>Branca</option
											>
											<option value="parda">Parda</option>
											<option value="preta">Preta</option>
											<option value="indigena"
												>Indígena</option
											>
											<option value="amarela"
												>Amarela</option
											>
											<option value="outros"
												>Outros</option
											>
										</select>
										{#if raca === "outros"}
											<input
												type="text"
												class="form-control sub-input"
												placeholder="Especifique a raça / cor..."
												bind:value={racaOutro}
											/>
										{/if}
									</div>

									<!-- 7. Estado civil -->
									<div class="form-group">
										<label
											for="id-estadocivil"
											class="form-label"
											>7. Estado civil</label
										>
										<select
											id="id-estadocivil"
											class="form-select"
											bind:value={estadoCivil}
										>
											<option value=""
												>Selecione...</option
											>
											<option value="solteiro"
												>Solteiro(a)</option
											>
											<option value="casado"
												>Casado(a)</option
											>
											<option value="uniao_estavel"
												>União estável</option
											>
											<option value="divorciado"
												>Divorciado(a)</option
											>
											<option value="viuvo"
												>Viúvo(a)</option
											>
											<option value="outros"
												>Outros</option
											>
										</select>
										{#if estadoCivil === "outros"}
											<input
												type="text"
												class="form-control sub-input"
												placeholder="Especifique o estado civil..."
												bind:value={estadoCivilOutro}
											/>
										{/if}
									</div>

									<!-- 8. Escolaridade -->
									<div class="form-group">
										<label
											for="id-escolaridade"
											class="form-label"
											>8. Escolaridade</label
										>
										<select
											id="id-escolaridade"
											class="form-select"
											bind:value={escolaridade}
										>
											<option value=""
												>Selecione...</option
											>
											<option value="sem_escolaridade"
												>Sem escolaridade</option
											>
											<option
												value="fundamental_incompleto"
												>Fundamental incompleto</option
											>
											<option value="fundamental_completo"
												>Fundamental completo</option
											>
											<option value="medio_incompleto"
												>Médio incompleto</option
											>
											<option value="medio_completo"
												>Médio completo</option
											>
											<option value="superior_incompleto"
												>Superior incompleto</option
											>
											<option value="superior_completo"
												>Superior completo</option
											>
											<option value="pos_graduacao"
												>Pós-graduação</option
											>
											<option value="outros"
												>Outros</option
											>
										</select>
										{#if escolaridade === "outros"}
											<input
												type="text"
												class="form-control sub-input"
												placeholder="Especifique a escolaridade..."
												bind:value={escolaridadeOutro}
											/>
										{/if}
									</div>

									<!-- 9. Religião -->
									<div class="form-group">
										<label
											for="id-religiao"
											class="form-label"
											>9. Religião</label
										>
										<select
											id="id-religiao"
											class="form-select"
											bind:value={religiao}
										>
											<option value=""
												>Selecione...</option
											>
											<option value="catolica"
												>Católica</option
											>
											<option value="evangelica"
												>Evangélica</option
											>
											<option value="espirita"
												>Espírita</option
											>
											<option value="sem_religiao"
												>Sem religião</option
											>
											<option value="outros"
												>Outros</option
											>
										</select>
										{#if religiao === "outros"}
											<input
												type="text"
												class="form-control sub-input"
												placeholder="Especifique a religião..."
												bind:value={religiaoOutro}
											/>
										{/if}
									</div>
								</div>

								<!-- ── ACOMPANHANTE (SUB-BLOCO COLAPSÁVEL) ── -->
								<div class="sub-section-box">
									<button
										type="button"
										class="sub-section-toggle"
										onclick={() =>
											toggleSection(
												"sec-sub-acompanhante",
											)}
									>
										<div class="sub-toggle-left">
											<svg
												width="15"
												height="15"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path
													d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
												></path>
												<circle cx="9" cy="7" r="4"
												></circle>
												<path
													d="M23 21v-2a4 4 0 0 0-3-3.87"
												></path>
												<path
													d="M16 3.13a4 4 0 0 1 0 7.75"
												></path>
											</svg>
											<span class="sub-toggle-title"
												>Identificação do Acompanhante</span
											>
											{#if nomeAcompanhante.trim()}
												<span class="sub-badge active"
													>{nomeAcompanhante.trim()}
													{parentescoAcompanhante
														? `(${parentescoAcompanhante})`
														: ""}</span
												>
											{:else}
												<span class="sub-badge"
													>Opcional</span
												>
											{/if}
										</div>
										<svg
											class="sub-chevron"
											class:rotated={!collapsedSections.has(
												"sec-sub-acompanhante",
											)}
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<polyline points="6 9 12 15 18 9"
											></polyline>
										</svg>
									</button>

									{#if !collapsedSections.has("sec-sub-acompanhante")}
										<div class="sub-section-content">
											<div class="form-grid">
												<div class="form-group">
													<label
														for="id-nome-acomp"
														class="form-label"
														>Nome do acompanhante</label
													>
													<input
														id="id-nome-acomp"
														type="text"
														class="form-control"
														placeholder="Nome completo do acompanhante..."
														bind:value={
															nomeAcompanhante
														}
													/>
												</div>
												<div class="form-group">
													<label
														for="id-parentesco-acomp"
														class="form-label"
														>Parentesco / Vínculo</label
													>
													<select
														id="id-parentesco-acomp"
														class="form-select"
														bind:value={
															parentescoAcompanhante
														}
													>
														<option value=""
															>Selecione o
															parentesco...</option
														>
														<option
															value="Cônjuge / Esposo(a)"
															>Cônjuge / Esposo(a)
															/ Companheiro(a)</option
														>
														<option value="Filho(a)"
															>Filho(a)</option
														>
														<option
															value="Pai / Mãe"
															>Pai / Mãe</option
														>
														<option
															value="Irmão / Irmã"
															>Irmão / Irmã</option
														>
														<option
															value="Cuidador(a)"
															>Cuidador(a)</option
														>
														<option
															value="Amigo(a) / Vizinho(a)"
															>Amigo(a) /
															Vizinho(a)</option
														>
														<option value="Neto(a)"
															>Neto(a)</option
														>
														<option value="Outro"
															>Outro</option
														>
													</select>
													{#if parentescoAcompanhante === "Outro"}
														<input
															type="text"
															class="form-control sub-input"
															placeholder="Especifique o parentesco / vínculo..."
															bind:value={
																parentescoOutro
															}
														/>
													{/if}
												</div>
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 02 · QUEIXA PRINCIPAL (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-queixa-principal"
						class:collapsed={collapsedSections.has(
							"sec-queixa-principal",
						)}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() =>
								toggleSection("sec-queixa-principal")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-queixa-principal");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub">02</span>
								<h2 class="section-title">
									Queixa Principal (QP)
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{queixaPrincipal.trim()
										? queixaPrincipal.trim()
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-queixa-principal")}
							<div class="section-body">
								<div class="form-grid">
									<div class="form-group span-2">
										<label
											for="id-qp"
											class="form-label required"
										>
											Queixa principal / Motivo da
											consulta
											<span class="label-hint"
												>(escrita livre nas palavras do
												paciente)</span
											>
										</label>
										<textarea
											id="id-qp"
											class="form-textarea"
											rows="3"
											placeholder="Ex: 'Dor no peito que piora ao respirar fundo há 2 dias', 'Cansaço fácil e fraqueza há cerca de 1 mês'..."
											bind:value={queixaPrincipal}
										></textarea>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 03 · HISTÓRIA DA MOLÉSTIA ATUAL - HMA (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-hma"
						class:collapsed={collapsedSections.has("sec-hma")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-hma")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-hma");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub">03</span>
								<h2 class="section-title">
									História da Moléstia Atual (HMA)
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{hma.trim()
										? `${hma.trim().slice(0, 26)}...`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-hma")}
							<div class="section-body">
								<div class="field-header-row">
									<label
										for="id-hma"
										class="form-label required"
									>
										Descrição cronológica e detalhada da
										evolução clínica
										<span class="label-hint"
											>(início, sintomas, evolução e
											tratamentos prévios)</span
										>
									</label>
									<button
										type="button"
										class="btn-guide-toggle"
										class:active={showSocratesGuide}
										onclick={() =>
											(showSocratesGuide =
												!showSocratesGuide)}
										title={showSocratesGuide
											? "Ocultar guia SOCRATES"
											: "Exibir guia SOCRATES"}
									>
										<span class="guide-toggle-icon">
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M9 18h6"></path>
												<path d="M10 22h4"></path>
												<path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
											</svg>
										</span>
										<span class="guide-toggle-text"
											>{showSocratesGuide
												? "Ocultar SOCRATES"
												: "Guia SOCRATES"}</span
										>
									</button>
								</div>

								<div
									class="hma-container"
									class:with-guide={showSocratesGuide}
								>
									<!-- Left: Textarea Editor -->
									<div class="hma-editor-area">
										<textarea
											id="id-hma"
											class="form-textarea hma-textarea"
											rows="9"
											placeholder="Descreva a história detalhada da moléstia atual..."
											bind:value={hma}
										></textarea>
									</div>

									<!-- Right: Socrates Guide Box (Visível pelo Toggle) -->
									{#if showSocratesGuide}
										<aside
											class="socrates-guide-box fade-in"
										>
											<div class="socrates-guide-header">
												<div class="socrates-badge">
													SOCRATES
												</div>
												<span class="socrates-title"
													>Roteiro Clínico</span
												>
											</div>

											<ul class="socrates-list">
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>S</span
													>
													<div class="socrates-info">
														<strong>Site</strong>
														<span
															>Localização exata</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>O</span
													>
													<div class="socrates-info">
														<strong>Onset</strong>
														<span
															>Início (súbito /
															insidioso)</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>C</span
													>
													<div class="socrates-info">
														<strong
															>Character</strong
														>
														<span
															>Tipo / Caráter da
															queixa</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>R</span
													>
													<div class="socrates-info">
														<strong
															>Radiation</strong
														>
														<span>Irradiação</span>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>A</span
													>
													<div class="socrates-info">
														<strong
															>Associated</strong
														>
														<span
															>Sintomas associados</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>T</span
													>
													<div class="socrates-info">
														<strong>Timing</strong>
														<span
															>Duração e
															periodicidade</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>E</span
													>
													<div class="socrates-info">
														<strong
															>Exacerbating</strong
														>
														<span
															>Fatores de piora /
															alívio</span
														>
													</div>
												</li>
												<li class="socrates-item">
													<span
														class="socrates-letter"
														>S</span
													>
													<div class="socrates-info">
														<strong>Severity</strong
														>
														<span
															>Intensidade (0 a
															10)</span
														>
													</div>
												</li>
											</ul>
										</aside>
									{/if}
								</div>

								<!-- ── QUEIXAS SECUNDÁRIAS (ABAIXO DO HMA) ── -->
								<div class="queixas-secundarias-container">
									<div class="queixas-secundarias-header">
										<div class="queixas-secundarias-title-wrap">
											<h3 class="queixas-secundarias-title">
												Queixas Secundárias
											</h3>
											<span class="label-hint">
												(adicione outras queixas relatadas com sua respectiva história clínica)
											</span>
										</div>
										<button
											type="button"
											class="btn-add-queixa-secundaria"
											onclick={adicionarQueixaSecundaria}
										>
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
												<line x1="12" y1="5" x2="12" y2="19"></line>
												<line x1="5" y1="12" x2="19" y2="12"></line>
											</svg>
											<span>Adicionar queixa secundária</span>
										</button>
									</div>

									{#if queixasSecundarias.length === 0}
										<div class="queixas-secundarias-empty">
											<span>Nenhuma queixa secundária registrada. Se o paciente relatar outros sintomas ou queixas adicionais, clique em "+ Adicionar queixa secundária".</span>
										</div>
									{:else}
										<div class="queixas-secundarias-list">
											{#each queixasSecundarias as q, index (q.id)}
												<div class="queixa-secundaria-card fade-in">
													<div class="queixa-secundaria-card-header">
														<div class="queixa-card-title-wrap">
															<span class="queixa-card-badge">#{index + 1}</span>
															<span class="queixa-card-title">Queixa Secundária</span>
														</div>
														<button
															type="button"
															class="btn-remove-queixa"
															onclick={() => removerQueixaSecundaria(q.id)}
															title="Remover esta queixa secundária"
														>
															<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																<polyline points="3 6 5 6 21 6"></polyline>
																<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
															</svg>
															<span>Remover</span>
														</button>
													</div>

													<div class="queixa-secundaria-fields">
														<div class="form-group">
															<label class="form-label" for={`id-qs-queixa-${q.id}`}>
																Queixa / Sintoma
																<span class="label-hint">(ex: Cefaleia holocraniana, Dor lombar, Tontura...)</span>
															</label>
															<input
																type="text"
																id={`id-qs-queixa-${q.id}`}
																class="form-input"
																placeholder="Nome ou síntese da queixa secundária..."
																bind:value={q.queixa}
															/>
														</div>

														<div class="form-group">
															<label class="form-label" for={`id-qs-historia-${q.id}`}>
																História Clínica e Detalhamento
																<span class="label-hint">(início, evolução cronológica, fatores de piora/alívio, tratamentos...)</span>
															</label>
															<textarea
																id={`id-qs-historia-${q.id}`}
																class="form-textarea"
																rows="3"
																placeholder="Descreva detalhadamente a história clínica e evolução desta queixa secundária..."
																bind:value={q.historiaClinica}
															></textarea>
														</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 04 · REVISÃO DE SISTEMAS - RS (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-revisao-sistemas"
						class:collapsed={collapsedSections.has(
							"sec-revisao-sistemas",
						)}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() =>
								toggleSection("sec-revisao-sistemas")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-revisao-sistemas");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub">04</span>
								<h2 class="section-title">
									Revisão de Sistemas (RS)
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{revisaoSistemas.trim()
										? `${revisaoSistemas.trim().slice(0, 26)}...`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-revisao-sistemas")}
							<div class="section-body">
								<div class="form-grid">
									<div class="form-group span-2">
										<label for="id-rs" class="form-label">
											Interrogatório sistemático sobre os
											diversos aparelhos
											<span class="label-hint"
												>(sintomas gerais,
												cabeça/pescoço, respiratório,
												cardiovascular, digestório,
												urinário, osteomuscular,
												neurológico...)</span
											>
										</label>
										<textarea
											id="id-rs"
											class="form-textarea"
											rows="5"
											placeholder="Ex: Nega febre, astenia ou perda ponderal. Aparelho respiratório: nega tosse ou dispneia. Cardiovascular: nega palpitações ou dor precordial. TGI: hábito intestinal regular, nega náuseas ou pirose. Genitourinário: nega disúria ou polaciúria..."
											bind:value={revisaoSistemas}
										></textarea>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 05 · HISTÓRIA GINECOLÓGICA - HG (CONDICIONAL: ) ── -->
					{#if sexoBiologico === "F"}
						<section
							class="section-card"
							id="sec-hg"
							class:collapsed={collapsedSections.has("sec-hg")}
						>
							<!-- Section Header / Toggle -->
							<div
								class="section-header"
								role="button"
								tabindex="0"
								onclick={() => toggleSection("sec-hg")}
								onkeydown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										toggleSection("sec-hg");
									}
								}}
							>
								<div class="section-title-wrap">
									<span class="section-num sub">05</span>
									<h2 class="section-title">
										História Ginecológica (HG)
										<span class="gender-pill"
											> Feminino</span
										>
									</h2>
								</div>
								<div class="section-actions">
									<span class="section-status-badge">
										{gpncaeSummary || hgDum
											? `${gpncaeSummary ? gpncaeSummary + " " : ""}${hgDum ? "DUM: " + hgDum : ""}`
											: "Não preenchido"}
									</span>
									<svg
										class="chevron-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="6 9 12 15 18 9"
										></polyline>
									</svg>
								</div>
							</div>

							<!-- Section Body -->
							{#if !collapsedSections.has("sec-hg")}
								<div class="section-body">
									<!-- 1. Box GPNCAE -->
									<div class="gpncae-wrapper">
										<div class="gpncae-header">
											<span class="gpncae-label"
												>Histórico Obstétrico (GPNCAE)</span
											>
											{#if gpncaeSummary}
												<span class="gpncae-badge"
													>{gpncaeSummary}</span
												>
											{/if}
										</div>

										<div class="gpncae-grid">
											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>G</span
												>
												<span class="gpncae-desc"
													>Gestações</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgG}
												/>
											</div>

											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>P</span
												>
												<span class="gpncae-desc"
													>Partos</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgP}
												/>
											</div>

											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>N</span
												>
												<span class="gpncae-desc"
													>Normais</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgN}
												/>
											</div>

											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>C</span
												>
												<span class="gpncae-desc"
													>Cesáreas</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgC}
												/>
											</div>

											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>A</span
												>
												<span class="gpncae-desc"
													>Abortos</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgA}
												/>
											</div>

											<div class="gpncae-cell">
												<span class="gpncae-letter"
													>E</span
												>
												<span class="gpncae-desc"
													>Ectópicas</span
												>
												<input
													type="number"
													min="0"
													max="30"
													class="gpncae-input"
													placeholder="0"
													bind:value={hgE}
												/>
											</div>
										</div>
									</div>

									<div
										class="form-grid"
										style="margin-top: 18px;"
									>
										<!-- 2. Data da Última Menstruação (DUM) -->
										<div class="form-group">
											<label
												for="id-dum"
												class="form-label"
											>
												Data da Última Menstruação (DUM)
											</label>
											<div class="input-with-calc">
												<input
													id="id-dum"
													type="date"
													class="form-control"
													bind:value={hgDum}
												/>
												{#if tempoDesdeDum}
													<div
														class="calc-tag"
														title="Tempo decorrido até hoje"
													>
														<svg
															width="13"
															height="13"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<circle
																cx="12"
																cy="12"
																r="10"
															></circle>
															<polyline
																points="12 6 12 12 16 14"
															></polyline>
														</svg>
														<span
															>{tempoDesdeDum}</span
														>
													</div>
												{/if}
											</div>
										</div>

										<!-- 3. Método Anticoncepcional (MAC) -->
										<div class="form-group">
											<label
												for="id-mac"
												class="form-label"
												>Método Anticoncepcional (MAC)</label
											>
											<select
												id="id-mac"
												class="form-select"
												bind:value={hgMac}
											>
												<option value=""
													>Selecione o método...</option
												>
												<option
													value="ACO (Anticoncepcional Oral)"
													>ACO (Anticoncepcional Oral)</option
												>
												<option value="DIU de Cobre"
													>DIU de Cobre</option
												>
												<option
													value="DIU Hormonal (Mirena/Kyleena)"
													>DIU Hormonal
													(Mirena/Kyleena)</option
												>
												<option
													value="Implante subdérmico"
													>Implante subdérmico</option
												>
												<option value="Laqueadura"
													>Laqueadura</option
												>
												<option value="Vasectomia"
													>Vasectomia (parceiro)</option
												>
												<option value="Anel vaginal"
													>Anel vaginal</option
												>
												<option value="Camisinha"
													>Camisinha / Preservativo</option
												>
												<option value="Injetáveis"
													>Injetáveis (mensal /
													trimestral)</option
												>
												<option value="Nenhum"
													>Nenhum</option
												>
												<option value="Outros"
													>Outros</option
												>
											</select>
										</div>

										<!-- 3.1 Descrição do Método Anticoncepcional -->
										<div class="form-group span-2">
											<label
												for="id-mac-desc"
												class="form-label"
											>
												Detalhes do método
												anticoncepcional
												<span class="label-hint"
													>(nome comercial, tempo de
													uso, tolerância,
													esquecimentos...)</span
												>
											</label>
											<input
												id="id-mac-desc"
												type="text"
												class="form-control"
												placeholder="Ex: Levonorgestrel + Etinilestradiol há 2 anos, sem queixas de efeitos adversos..."
												bind:value={hgMacDescricao}
											/>
										</div>

										<!-- 4. Outras informações ginecológicas -->
										<div class="form-group span-2">
											<label
												for="id-hg-outras"
												class="form-label"
											>
												Outras informações ginecológicas
												<span class="label-hint"
													>(menarca, ciclos,
													preventivo/Papanicolau,
													mamografia, cirurgias
													ginecológicas, menopausa...)</span
												>
											</label>
											<textarea
												id="id-hg-outras"
												class="form-textarea"
												rows="3"
												placeholder="Ex: Menarca aos 12 anos, ciclos regulares 28/4 dias com dismenorreia leve. Último preventivo há 8 meses normal. Nega cirurgias prévias..."
												bind:value={hgOutrasInfo}
											></textarea>
										</div>
									</div>
								</div>
							{/if}
						</section>
					{/if}

					<!-- ── SEÇÃO HPP · HISTÓRIA PATOLÓGICA PREGRESSA (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-hpp"
						class:collapsed={collapsedSections.has("sec-hpp")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-hpp")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-hpp");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub"
									>{sexoBiologico === "F" ? "06" : "05"}</span
								>
								<h2 class="section-title">
									História Patológica Pregressa (HPP)
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{totalMedicamentos > 0
										? `${totalMedicamentos} med(s)`
										: hppDoencasCronicas.trim()
											? `${hppDoencasCronicas.trim().slice(0, 24)}...`
											: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-hpp")}
							<div class="section-body">
								<!-- 1. Grid 2x2: Alergias, Cirurgias, Internações, Traumatismos -->
								<div class="hpp-antecedentes-box">
									<div class="hpp-box-title">
										Antecedentes Clínicos e Cirúrgicos
									</div>
									<div class="form-grid">
										<!-- Linha 1: Alergias & Cirurgias -->
										<div class="form-group">
											<label
												for="id-hpp-alergias"
												class="form-label"
											>
												Alergias
												<span class="label-hint"
													>(medicamentosas,
													alimentares, ambientais)</span
												>
											</label>
											<textarea
												id="id-hpp-alergias"
												class="form-textarea"
												rows="2"
												placeholder="Ex: Nega alergias medicamentosas conhecidas (NKDA), Alergia a Dipirona (urticária)..."
												bind:value={hppAlergias}
											></textarea>
										</div>

										<div class="form-group">
											<label
												for="id-hpp-cirurgias"
												class="form-label"
											>
												Cirurgias prévias
												<span class="label-hint"
													>(procedimento e ano
													estimado)</span
												>
											</label>
											<textarea
												id="id-hpp-cirurgias"
												class="form-textarea"
												rows="2"
												placeholder="Ex: Apendicectomia (2015), Colecistectomia videolaparoscópica (2020)..."
												bind:value={hppCirurgias}
											></textarea>
										</div>

										<!-- Linha 2: Internações & Traumatismos/Fraturas -->
										<div class="form-group">
											<label
												for="id-hpp-internacoes"
												class="form-label"
											>
												Internações prévias
												<span class="label-hint"
													>(motivo, ano e duração)</span
												>
											</label>
											<textarea
												id="id-hpp-internacoes"
												class="form-textarea"
												rows="2"
												placeholder="Ex: Internação por pneumonia em 2018 (5 dias em enfermaria)..."
												bind:value={hppInternacoes}
											></textarea>
										</div>

										<div class="form-group">
											<label
												for="id-hpp-traumas"
												class="form-label"
											>
												Traumatismos e Fraturas
												<span class="label-hint"
													>(acidentes, fraturas e
													sequelas)</span
												>
											</label>
											<textarea
												id="id-hpp-traumas"
												class="form-textarea"
												rows="2"
												placeholder="Ex: Fratura de rádio distal esquerdo tratada conservadoramente em 2010..."
												bind:value={hppTraumas}
											></textarea>
										</div>
									</div>
								</div>

								<!-- 2. Doenças Crônicas e Condições Médicas -->
								<div
									class="form-group"
									style="margin-top: 18px;"
								>
									<label
										for="id-hpp-doencas"
										class="form-label"
									>
										Doenças crônicas e condições médicas
										relevantes
										<span class="label-hint"
											>(HAS, DM, Dislipidemia, Asma,
											Doença Renal, Psiquiátrica...)</span
										>
									</label>
									<textarea
										id="id-hpp-doencas"
										class="form-textarea"
										rows="3"
										placeholder="Ex: Hipertensão arterial sistêmica diagnosticada há 5 anos, Diabetes Mellitus tipo 2 há 3 anos, Dislipidemia em tratamento..."
										bind:value={hppDoencasCronicas}
									></textarea>
								</div>

								<!-- 3. Medicamentos em Uso (Agrupados por Classe Farmacêutica) -->
								<div class="meds-box-wrapper">
									<div class="meds-box-header">
										<div class="meds-box-title-wrap">
											<svg class="meds-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>
											<div>
												<span class="meds-box-title"
													>Medicamentos em Uso
													Contínuo</span
												>
												<span class="meds-box-subtitle"
													>Organizados por classe
													farmacêutica / terapêutica</span
												>
											</div>
										</div>
										<button
											type="button"
											class="btn-add-med"
											onclick={() =>
												(modalMedUsoOpen = true)}
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<line
													x1="12"
													y1="5"
													x2="12"
													y2="19"
												></line>
												<line
													x1="5"
													y1="12"
													x2="19"
													y2="12"
												></line>
											</svg>
											<span>Adicionar Medicamento</span>
										</button>
									</div>

									{#if totalMedicamentos === 0}
										<div class="meds-empty-state">
											<div class="meds-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg></div>
											<h4>
												Nenhum medicamento de uso
												contínuo adicionado
											</h4>
											<p>
												Clique no botão <strong
													>"+ Adicionar Medicamento"</strong
												> para buscar o princípio ativo e
												definir o horário de uso (x, y, z).
											</p>
										</div>
									{:else}
										<div class="meds-groups-list">
											{#each Object.entries(medicamentosPorClasse) as [classe, lista]}
												<div class="med-class-group">
													<div
														class="med-class-header"
													>
														<span
															class="med-class-tag"
															>{classe}</span
														>
														<span
															class="med-class-count"
															>{lista.length}
															{lista.length === 1
																? "medicamento"
																: "medicamentos"}</span
														>
													</div>

													<div class="med-items-grid">
														{#each lista as m (m.id)}
															<div
																class="med-card-item"
															>
																<div
																	class="med-card-main"
																>
																	<div
																		class="med-card-name-row"
																	>
																		<span
																			class="med-name"
																			>{m.principioAtivo}</span
																		>
																		{#if m.concentracao}
																			<span
																				class="med-conc"
																				>{m.concentracao}</span
																			>
																		{/if}
																	</div>
																	<div
																		class="med-card-details"
																	>
																		<span
																			class="med-forma"
																			>{m.formaFarmaceutica}</span
																		>
																		<span
																			class="med-pos-pill"
																			title="Posologia / Horário de uso"
																		>
																			{m.posologiaTexto}
																		</span>
																	</div>
																	{#if m.observacoes}
																		<div
																			class="med-card-obs"
																		>
																			<em
																				>{m.observacoes}</em
																			>
																		</div>
																	{/if}
																</div>

																<button
																	type="button"
																	class="btn-remove-med"
																	onclick={() =>
																		removerMedicamento(
																			m.id,
																		)}
																	title="Remover medicamento"
																>
																	<svg
																		width="15"
																		height="15"
																		viewBox="0 0 24 24"
																		fill="none"
																		stroke="currentColor"
																		stroke-width="2"
																		stroke-linecap="round"
																		stroke-linejoin="round"
																	>
																		<polyline
																			points="3 6 5 6 21 6"

																		></polyline>
																		<path
																			d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
																		></path>
																	</svg>
																</button>
															</div>
														{/each}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO HF · HISTÓRIA FAMILIAR (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-hf"
						class:collapsed={collapsedSections.has("sec-hf")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-hf")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-hf");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub"
									>{sexoBiologico === "F" ? "07" : "06"}</span
								>
								<h2 class="section-title">
									História Familiar (HF)
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{totalHfValidos > 0
										? `${totalHfValidos} condição(ões)`
										: hfObservacoes.trim()
											? `${hfObservacoes.trim().slice(0, 24)}...`
											: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-hf")}
							<div class="section-body">
								<!-- Tabela / Lista de Doenças e Familiares -->
								<div class="hf-table-wrapper">
									<div class="hf-table-header">
										<div class="hf-col-title col-doenca">
											Doença / Condição Familiar
										</div>
										<div class="hf-col-title col-parentes">
											Familiar(es) Afetado(s)
										</div>
										<div
											class="hf-col-title col-acoes"
										></div>
									</div>

									<div class="hf-table-body">
										{#each itensHistoriaFamiliar as item, idx (item.id)}
											<div class="hf-row">
												<!-- Coluna 1: Doença com Datalist e escrita livre -->
												<div
													class="hf-cell cell-doenca"
												>
													<input
														type="text"
														class="form-control hf-doenca-input"
														list="datalist-doencas-hf"
														placeholder="Ex: HAS, DM2, IAM, Câncer de mama..."
														bind:value={item.doenca}
													/>
												</div>

												<!-- Coluna 2: Familiar com Chips multiselect -->
												<div
													class="hf-cell cell-parentes"
												>
													<div
														class="parentes-chips-list"
													>
														{#each OPCOES_PARENTES as par}
															<button
																type="button"
																class="chip-parente-btn"
																class:selected={item.parentes.includes(
																	par,
																)}
																onclick={() =>
																	toggleParenteNoItem(
																		item,
																		par,
																	)}
															>
																{par}
															</button>
														{/each}
													</div>

													{#if item.parentes.includes("outro")}
														<input
															type="text"
															class="form-control sub-input hf-outro-input"
															placeholder="Especifique o familiar (ex: primo materno, sobrinho...)"
															bind:value={
																item.outroParente
															}
														/>
													{/if}
												</div>

												<!-- Coluna 3: Ação Remover -->
												<div class="hf-cell cell-acoes">
													<button
														type="button"
														class="btn-remove-hf"
														onclick={() =>
															removerItemHF(
																item.id,
															)}
														title="Remover linha"
													>
														<svg
															width="15"
															height="15"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															stroke-linecap="round"
															stroke-linejoin="round"
														>
															<polyline
																points="3 6 5 6 21 6"
															></polyline>
															<path
																d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
															></path>
														</svg>
													</button>
												</div>
											</div>
										{/each}
									</div>

									<div class="hf-table-footer">
										<button
											type="button"
											class="btn-add-hf-row"
											onclick={adicionarItemHF}
										>
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<line
													x1="12"
													y1="5"
													x2="12"
													y2="19"
												></line>
												<line
													x1="5"
													y1="12"
													x2="19"
													y2="12"
												></line>
											</svg>
											<span>Adicionar Outra Doença</span>
										</button>
									</div>
								</div>

								<!-- Datalist de sugestões de doenças familiares -->
								<datalist id="datalist-doencas-hf">
									{#each sugestoesDoencasFamiliares as s}
										<option value={s}></option>
									{/each}
								</datalist>

								<!-- Observações adicionais sobre histórico familiar -->
								<div
									class="form-group"
									style="margin-top: 18px;"
								>
									<label for="id-hf-obs" class="form-label">
										Observações sobre histórico familiar
										<span class="label-hint"
											>(consanguinidade, idade precoce de
											óbito cardiovascular / neoplásico,
											causas de morte...)</span
										>
									</label>
									<textarea
										id="id-hf-obs"
										class="form-textarea"
										rows="2"
										placeholder="Ex: Pai falecido aos 52 anos por IAM. Mãe viva com HAS e DM2 bem controlados. Nega consanguinidade entre os pais..."
										bind:value={hfObservacoes}
									></textarea>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO HO · HISTÓRIA OCUPACIONAL (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-ho"
						class:collapsed={collapsedSections.has("sec-ho")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-ho")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-ho");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub"
									>{sexoBiologico === "F" ? "08" : "07"}</span
								>
								<h2 class="section-title">
									História Ocupacional
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{historiaOcupacional.trim()
										? `${historiaOcupacional.trim().slice(0, 26)}...`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-ho")}
							<div class="section-body">
								<div class="form-grid">
									<div class="form-group span-2">
										<label for="id-ho" class="form-label">
											Histórico e condições do ambiente de
											trabalho
											<span class="label-hint"
												>(ocupação atual e anteriores,
												jornada, esforço físico,
												ergonomia, estresse laboral,
												exposição a poeiras, ruídos,
												químicos ou radiação)</span
											>
										</label>
										<textarea
											id="id-ho"
											class="form-textarea"
											rows="4"
											placeholder="Ex: Trabalha como auxiliar administrativo há 8 anos, 8h/dia em escritório climatizado com esforço repetitivo de digitação. Nega exposição a poeiras minerais ou agentes químicos tóxicos. Trabalhou anteriormente na lavoura por 5 anos na juventude..."
											bind:value={historiaOcupacional}
										></textarea>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO HPS · HISTÓRIA PSICOSSOCIAL (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-hps"
						class:collapsed={collapsedSections.has("sec-hps")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-hps")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-hps");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub"
									>{sexoBiologico === "F" ? "09" : "08"}</span
								>
								<h2 class="section-title">
									História Psicossocial
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{historiaPsicossocial.trim()
										? `${historiaPsicossocial.trim().slice(0, 26)}...`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-hps")}
							<div class="section-body">
								<div class="form-grid">
									<div class="form-group span-2">
										<label for="id-hps" class="form-label">
											Dinâmica social, suporte familiar e
											condições de vida
											<span class="label-hint"
												>(suporte sociofamiliar,
												dinâmica conjugal/familiar,
												estresse e saúde mental,
												religiosidade/crenças, moradia e
												saneamento básico)</span
											>
										</label>
										<textarea
											id="id-hps"
											class="form-textarea"
											rows="4"
											placeholder="Ex: Reside em casa própria de alvenaria com saneamento básico completo e água tratada. Convive com cônjuge e 2 filhos, refere boa relação conjugal e suporte familiar acolhedor. Nega estresse financeiro severo. Pratica sua religiosidade semanalmente..."
											bind:value={historiaPsicossocial}
										></textarea>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO HV · HÁBITOS DE VIDA (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-hv"
						class:collapsed={collapsedSections.has("sec-hv")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-hv")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-hv");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num sub"
									>{sexoBiologico === "F" ? "10" : "09"}</span
								>
								<h2 class="section-title">Hábitos de Vida</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{tabagismoStatus !== "nao" ||
									etilismoStatus !== "nao" ||
									atividadesSelecionadas.length > 0
										? "Preenchido"
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"
									></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-hv")}
							<div class="section-body">
								<div class="hv-blocks-container">
									<!-- 1. TABAGISMO -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>1. Tabagismo</span
													>
													<span class="hv-sub-desc"
														>Uso de cigarros
														convencionais,
														palheiros, eletrônicos</span
													>
												</div>
											</div>
											{#if cargaTabagica}
												<span class="hv-tag-badge"
													>{cargaTabagica}</span
												>
											{/if}
										</div>

										<div class="hv-card-sub-body">
											<!-- Status Selector -->
											<div class="status-options-row">
												<label
													class="status-radio-card"
													class:checked={tabagismoStatus ===
														"nao"}
												>
													<input
														type="radio"
														name="tab-status"
														value="nao"
														bind:group={
															tabagismoStatus
														}
													/>
													<span>Não fumante</span>
												</label>
												<label
													class="status-radio-card"
													class:checked={tabagismoStatus ===
														"sim"}
												>
													<input
														type="radio"
														name="tab-status"
														value="sim"
														bind:group={
															tabagismoStatus
														}
													/>
													<span>Fumante ativo</span>
												</label>
												<label
													class="status-radio-card"
													class:checked={tabagismoStatus ===
														"ex"}
												>
													<input
														type="radio"
														name="tab-status"
														value="ex"
														bind:group={
															tabagismoStatus
														}
													/>
													<span>Ex-tabagista</span>
												</label>
											</div>

											<!-- Detalhes do Tabagismo (se Sim ou Ex) -->
											{#if tabagismoStatus !== "nao"}
												<div
													class="sub-fields-grid fade-in"
												>
													<div class="form-group">
														<label
															for="id-tab-macos"
															class="form-label"
															>Maços / dia</label
														>
														<input
															id="id-tab-macos"
															type="number"
															step="0.1"
															min="0.1"
															max="20"
															class="form-control"
															placeholder="Ex: 1 (20 cigarros)"
															bind:value={
																tabagismoMacosDia
															}
														/>
													</div>

													<div class="form-group">
														<label
															for="id-tab-anos"
															class="form-label"
															>Anos de uso</label
														>
														<input
															id="id-tab-anos"
															type="number"
															min="1"
															max="80"
															class="form-control"
															placeholder="Ex: 15"
															bind:value={
																tabagismoAnos
															}
														/>
													</div>

													<div class="form-group">
														<span class="form-label"
															>Carga Tabágica</span
														>
														<div
															class="calc-box-display"
														>
															{#if cargaTabagica}
																<strong
																	>{cargaTabagica}</strong
																>
															{:else}
																<span
																	class="muted-calc"
																	>Preencha
																	maços e anos</span
																>
															{/if}
														</div>
													</div>

													<div
														class="form-group fag-btn-group"
													>
														<span class="form-label"
															>Avaliação de
															Dependência</span
														>
														<button
															type="button"
															class="btn-fagerstrom"
															onclick={() =>
																(modalFagerstromOpen = true)}
														>
															<svg
																width="15"
																height="15"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path
																	d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
																></path>
																<polyline
																	points="14 2 14 8 20 8"
																></polyline>
																<line
																	x1="16"
																	y1="13"
																	x2="8"
																	y2="13"
																></line>
																<line
																	x1="16"
																	y1="17"
																	x2="8"
																	y2="17"
																></line>
																<polyline
																	points="10 9 9 9 8 9"
																></polyline>
															</svg>
															<span
																>{fagerstromScore !==
																null
																	? "Refazer Teste de Fagerström"
																	: "Teste de Fagerström"}</span
															>
														</button>
													</div>
												</div>

												{#if fagerstromResumo}
													<div
														class="fag-score-tag fade-in"
													>
														<span
															> {fagerstromResumo}</span
														>
													</div>
												{/if}
											{/if}
										</div>
									</div>

									<!-- 2. ETILISMO -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>2. Etilismo</span
													>
													<span class="hv-sub-desc"
														>Consumo de bebidas
														alcoólicas</span
													>
												</div>
											</div>
										</div>

										<div class="hv-card-sub-body">
											<div class="status-options-row">
												<label
													class="status-radio-card"
													class:checked={etilismoStatus ===
														"nao"}
												>
													<input
														type="radio"
														name="et-status"
														value="nao"
														bind:group={
															etilismoStatus
														}
													/>
													<span>Não consome</span>
												</label>
												<label
													class="status-radio-card"
													class:checked={etilismoStatus ===
														"sim"}
												>
													<input
														type="radio"
														name="et-status"
														value="sim"
														bind:group={
															etilismoStatus
														}
													/>
													<span
														>Consome atualmente</span
													>
												</label>
												<label
													class="status-radio-card"
													class:checked={etilismoStatus ===
														"ex"}
												>
													<input
														type="radio"
														name="et-status"
														value="ex"
														bind:group={
															etilismoStatus
														}
													/>
													<span>Ex-etilista</span>
												</label>
											</div>

											{#if etilismoStatus !== "nao"}
												<div
													class="sub-fields-grid single-col fade-in"
												>
													<div class="form-group">
														<label
															for="id-et-doses"
															class="form-label"
														>
															Doses por semana
															<span
																class="label-hint"
																>(1 dose = 1
																lata de cerveja
																/ 1 taça de
																vinho / 1 dose
																de destilado
																40mL)</span
															>
														</label>
														<input
															id="id-et-doses"
															type="number"
															min="1"
															max="100"
															class="form-control"
															placeholder="Ex: 4 doses aos finais de semana"
															bind:value={
																etilismoDosesSemana
															}
														/>
													</div>
												</div>
											{/if}
										</div>
									</div>

									<!-- 3. DROGAS ILÍCITAS -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>3. Drogas Ilícitas /
														Substâncias Psicoativas</span
													>
													<span class="hv-sub-desc"
														>Histórico de uso de
														outras substâncias</span
													>
												</div>
											</div>
										</div>

										<div class="hv-card-sub-body">
											<div class="status-options-row">
												<label
													class="status-radio-card"
													class:checked={drogasStatus ===
														"nao"}
												>
													<input
														type="radio"
														name="drg-status"
														value="nao"
														bind:group={
															drogasStatus
														}
													/>
													<span>Nega uso</span>
												</label>
												<label
													class="status-radio-card"
													class:checked={drogasStatus ===
														"sim"}
												>
													<input
														type="radio"
														name="drg-status"
														value="sim"
														bind:group={
															drogasStatus
														}
													/>
													<span>Usuário atual</span>
												</label>
												<label
													class="status-radio-card"
													class:checked={drogasStatus ===
														"ex"}
												>
													<input
														type="radio"
														name="drg-status"
														value="ex"
														bind:group={
															drogasStatus
														}
													/>
													<span>Ex-usuário</span>
												</label>
											</div>

											{#if drogasStatus !== "nao"}
												<div
													class="sub-fields-grid single-col fade-in"
												>
													<div class="form-group">
														<label
															for="id-drg-desc"
															class="form-label"
															>Substâncias
															utilizadas e padrão
															de uso</label
														>
														<input
															id="id-drg-desc"
															type="text"
															class="form-control"
															placeholder="Ex: Canabis (maconha) uso eventual nos fins de semana..."
															bind:value={
																drogasDescricao
															}
														/>
													</div>
												</div>
											{/if}
										</div>
									</div>

									<!-- 4. RECORDATÓRIO ALIMENTAR -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>4. Recordatório
														Alimentar</span
													>
													<span class="hv-sub-desc"
														>Descrição habitual do
														consumo por refeição</span
													>
												</div>
											</div>
										</div>

										<div class="hv-card-sub-body">
											<div class="refeicoes-grid">
												<div class="refeicao-item">
													<label
														for="id-rec-cafe"
														class="refeicao-label"
														> Café da manhã</label
													>
													<input
														id="id-rec-cafe"
														type="text"
														class="form-control"
														placeholder="Ex: Café com leite sem açúcar, 1 pão francês com queijo branco..."
														bind:value={
															alimentarCafeManha
														}
													/>
												</div>

												<div class="refeicao-item">
													<label
														for="id-rec-lanche-m"
														class="refeicao-label"
														> Lanche da manhã</label
													>
													<input
														id="id-rec-lanche-m"
														type="text"
														class="form-control"
														placeholder="Ex: 1 maçã ou castanhas..."
														bind:value={
															alimentarLancheManha
														}
													/>
												</div>

												<div class="refeicao-item">
													<label
														for="id-rec-almoco"
														class="refeicao-label"
														> Almoço</label
													>
													<input
														id="id-rec-almoco"
														type="text"
														class="form-control"
														placeholder="Ex: Arroz, feijão, frango grelhado e salada variada..."
														bind:value={
															alimentarAlmoco
														}
													/>
												</div>

												<div class="refeicao-item">
													<label
														for="id-rec-lanche-t"
														class="refeicao-label"
														> Lanche da tarde</label
													>
													<input
														id="id-rec-lanche-t"
														type="text"
														class="form-control"
														placeholder="Ex: Iogurte natural com aveia..."
														bind:value={
															alimentarLancheTarde
														}
													/>
												</div>

												<div class="refeicao-item">
													<label
														for="id-rec-cafe-t"
														class="refeicao-label"
														> Café da tarde</label
													>
													<input
														id="id-rec-cafe-t"
														type="text"
														class="form-control"
														placeholder="Ex: Café preto e biscoito de polvilho..."
														bind:value={
															alimentarCafeTarde
														}
													/>
												</div>

												<div class="refeicao-item">
													<label
														for="id-rec-jantar"
														class="refeicao-label"
														> Jantar</label
													>
													<input
														id="id-rec-jantar"
														type="text"
														class="form-control"
														placeholder="Ex: Sopa de legumes com carne ou mesmo do almoço..."
														bind:value={
															alimentarJantar
														}
													/>
												</div>

												<div
													class="refeicao-item span-2-ref"
												>
													<label
														for="id-rec-ceia"
														class="refeicao-label"
														> Lanche antes de
														dormir (Ceia)</label
													>
													<input
														id="id-rec-ceia"
														type="text"
														class="form-control"
														placeholder="Ex: Chá de camomila ou 1 fruta..."
														bind:value={
															alimentarCeia
														}
													/>
												</div>
											</div>
										</div>
									</div>

									<!-- 5. SONO -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>5. Padrão de Sono</span
													>
													<span class="hv-sub-desc"
														>Horários, duração e
														qualidade do repouso</span
													>
												</div>
											</div>
											{#if tempoSonoCalculado}
												<span class="hv-tag-badge"
													>{tempoSonoCalculado}</span
												>
											{/if}
										</div>

										<div class="hv-card-sub-body">
											<div class="form-grid">
												<div class="form-group">
													<TimeClockPicker
														label="Hora de dormir"
														type="dormir"
														bind:value={
															sonoHoraDormir
														}
													/>
												</div>

												<div class="form-group">
													<TimeClockPicker
														label="Hora de acordar"
														type="acordar"
														bind:value={
															sonoHoraAcordar
														}
													/>
												</div>

												<div class="form-group span-2">
													<label
														for="id-sono-desc"
														class="form-label"
													>
														Qualidade do sono e
														observações
														<span class="label-hint"
															>(despertares
															noturnos, latência
															para adormecer, sono
															reparador,
															roncos/apneia, uso
															de telas...)</span
														>
													</label>
													<textarea
														id="id-sono-desc"
														class="form-textarea"
														rows="2"
														placeholder="Ex: Sono reparador, adormece em ~15 min. Nega despertares noturnos frequentes ou roncos. Faz higiene do sono adequada..."
														bind:value={
															sonoDescricao
														}
													></textarea>
												</div>
											</div>
										</div>
									</div>

									<!-- 6. ATIVIDADE FÍSICA -->
									<div class="hv-card-sub">
										<div class="hv-card-sub-header">
											<div class="hv-card-title-wrap">
												<span class="hv-sub-icon"
													></span
												>
												<div>
													<span class="hv-sub-title"
														>6. Atividade Física</span
													>
													<span class="hv-sub-desc"
														>Prática de exercícios,
														frequência e duração</span
													>
												</div>
											</div>
										</div>

										<div class="hv-card-sub-body">
											<!-- Modalidades (Chips de seleção múltipla) -->
											<div class="form-group">
												<span class="form-label"
													>Modalidades praticadas</span
												>
												<div
													class="parentes-chips-list"
												>
													{#each OPCOES_ATIVIDADE_FISICA as atv}
														<button
															type="button"
															class="chip-parente-btn"
															class:selected={atividadesSelecionadas.includes(
																atv,
															)}
															onclick={() =>
																toggleAtividade(
																	atv,
																)}
														>
															{atv}
														</button>
													{/each}
												</div>

												{#if atividadesSelecionadas.includes("Outros")}
													<input
														type="text"
														class="form-control sub-input"
														placeholder="Especifique a modalidade (ex: natação, dança, luta)..."
														bind:value={
															atividadeOutro
														}
													/>
												{/if}
											</div>

											<div
												class="form-grid"
												style="margin-top: 10px;"
											>
												<div class="form-group">
													<label
														for="id-atv-freq"
														class="form-label"
														>Frequência semanal</label
													>
													<input
														id="id-atv-freq"
														type="text"
														class="form-control"
														placeholder="Ex: 3x por semana, 5 dias/semana..."
														bind:value={
															atividadeFrequencia
														}
													/>
												</div>

												<div class="form-group">
													<label
														for="id-atv-dur"
														class="form-label"
														>Duração média por
														sessão</label
													>
													<input
														id="id-atv-dur"
														type="text"
														class="form-control"
														placeholder="Ex: 45 a 60 minutos..."
														bind:value={
															atividadeDuracao
														}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</section>
				</div>
			{/if}

			<!-- ═══════════════════════════════════════════════════ -->
			<!-- ═══ ABA 2: OBJETIVO ═══ -->
			<!-- ═══════════════════════════════════════════════════ -->
			{#if activeTab === "objetivo"}
				<div class="tab-pane fade-in">
					<div class="tab-header obj-header">
						<div class="tab-badge obj">O</div>
						<div>
							<h1 class="tab-title">Objetivo</h1>
							<p class="tab-subtitle">
								Dados mensuráveis, sinais vitais, antropometria,
								exame físico e resultados de exames
								complementares.
							</p>
						</div>
					</div>

					<!-- ── SEÇÃO 01 · EXAMES DE IMAGEM E FUNCIONAIS (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-exames-imagem"
						class:collapsed={collapsedSections.has("sec-exames-imagem")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-exames-imagem")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-exames-imagem");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">01</span>
								<h2 class="section-title">
									Exames de Imagem e Funcionais
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{totalExames > 0
										? `${totalExames} exame(s) lançado(s)`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-exames-imagem")}
							<div class="section-body">
								<div class="exames-box-header">
									<div class="exames-box-title-wrap">
										<span class="exames-icon">🩻</span>
										<div>
											<span class="exames-box-title">Resultados de Exames de Imagem e Funcionais</span>
											<span class="exames-box-subtitle">Radiografias, Tomografias, USG, ECG, Ecocardiograma, EDA, Espirometria e outros</span>
										</div>
									</div>
									<button
										type="button"
										class="btn-add-exame"
										onclick={abrirModalAdicionarExame}
									>
										<svg
											width="15"
											height="15"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<line x1="12" y1="5" x2="12" y2="19"></line>
											<line x1="5" y1="12" x2="19" y2="12"></line>
										</svg>
										<span>Adicionar Exame</span>
									</button>
								</div>

								{#if totalExames === 0}
									<div class="exames-empty-state">
										<div class="exames-empty-icon">🩻</div>
										<h4>Nenhum exame de imagem ou funcional lançado</h4>
										<p>
											Clique no botão <strong>"+ Adicionar Exame"</strong> para cadastrar laudos de exames realizados pelo paciente.
										</p>
									</div>
								{:else}
									<div class="exames-list">
										{#each examesImagem as ex (ex.id)}
											<div class="exame-card-item">
												<div class="exame-card-header">
													<div class="exame-card-main-info">
														<span class="exame-title">{ex.nomeExame}</span>
														<div class="exame-meta-row">
															{#if ex.dataRealizacao}
																<span class="exame-date-tag">
																	{ex.dataRealizacao.split('-').reverse().join('/')}
																</span>
															{/if}
															{#if ex.nomeMedico}
																<span class="exame-medico-tag">
																	{ex.nomeMedico}
																</span>
															{/if}
														</div>
													</div>

													<div class="exame-card-actions">
														<button
															type="button"
															class="btn-action-exame btn-edit-exame"
															onclick={() => abrirModalEditarExame(ex)}
															title="Editar exame"
														>
															<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
																<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
															</svg>
															<span>Editar</span>
														</button>
														<button
															type="button"
															class="btn-action-exame btn-delete-exame"
															onclick={() => removerExame(ex.id)}
															title="Remover exame"
														>
															<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
																<polyline points="3 6 5 6 21 6"></polyline>
																<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
															</svg>
														</button>
													</div>
												</div>

												<!-- Laudo / Resultado Content -->
												<div class="exame-laudo-box">
													<span class="exame-laudo-header">Laudo / Resultado:</span>
													<p class="exame-laudo-text">{ex.resultado}</p>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 02 · EXAMES LABORATORIAIS (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-exames-lab"
						class:collapsed={collapsedSections.has("sec-exames-lab")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-exames-lab")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-exames-lab");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">02</span>
								<h2 class="section-title">
									Exames Laboratoriais
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{totalExamesLab > 0
										? `${totalExamesLab} exame(s) lançado(s)`
										: "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-exames-lab")}
							<div class="section-body">
								<ExamesLaboratoriaisSection
									bind:exames={examesLaboratoriais}
									bind:dataColetaPadrao={dataColetaPadraoLab}
									{sexoBiologico}
								/>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 03 · SINAIS VITAIS (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-sinais-vitais"
						class:collapsed={collapsedSections.has("sec-sinais-vitais")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-sinais-vitais")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-sinais-vitais");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">03</span>
								<h2 class="section-title">
									Sinais Vitais
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{resumoSinaisBadge}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-sinais-vitais")}
							<div class="section-body">
								<div class="vitals-grid">
									<!-- CARD 1: Pressão Arterial (PAS x PAD) + PAM -->
									<div class="vital-card pa-card">
										<div class="vital-card-header">
											<div class="vital-title-wrap">
												<span class="vital-icon pa-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg></span>
												<div>
													<span class="vital-card-title">Pressão Arterial (PA)</span>
													<span class="vital-card-subtitle">PAS / PAD em mmHg</span>
												</div>
											</div>
											{#if classificacaoPA}
												<span class="vital-eval-badge {classificacaoPA.type}">
													{classificacaoPA.label}
												</span>
											{/if}
										</div>

										<div class="vital-inputs-row">
											<div class="vital-input-group">
												<label for="input-pas" class="vital-micro-label">PAS (Sistólica)</label>
												<div class="vital-input-wrap">
													<input
														id="input-pas"
														type="number"
														class="vital-input"
														placeholder="120"
														min="40"
														max="300"
														bind:value={pas}
													/>
													<span class="vital-unit">mmHg</span>
												</div>
											</div>

											<span class="pa-divider">×</span>

											<div class="vital-input-group">
												<label for="input-pad" class="vital-micro-label">PAD (Diastólica)</label>
												<div class="vital-input-wrap">
													<input
														id="input-pad"
														type="number"
														class="vital-input"
														placeholder="80"
														min="20"
														max="200"
														bind:value={pad}
													/>
													<span class="vital-unit">mmHg</span>
												</div>
											</div>
										</div>

										{#if pamCalculada}
											<div class="vital-extra-info">
												<span class="pam-tag">
													PAM calculada: <strong>{pamCalculada} mmHg</strong>
												</span>
											</div>
										{/if}
									</div>

									<!-- CARD 2: Frequência Cardíaca (FC) -->
									<div class="vital-card">
										<div class="vital-card-header">
											<div class="vital-title-wrap">
												<span class="vital-icon fc-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg></span>
												<div>
													<span class="vital-card-title">Frequência Cardíaca</span>
													<span class="vital-card-subtitle">FC / Pulso</span>
												</div>
											</div>
											{#if classificacaoFC}
												<span class="vital-eval-badge {classificacaoFC.type}">
													{classificacaoFC.label}
												</span>
											{/if}
										</div>

										<div class="vital-input-group">
											<label for="input-fc" class="vital-micro-label">Batimentos por Minuto</label>
											<div class="vital-input-wrap">
												<input
													id="input-fc"
													type="number"
													class="vital-input"
													placeholder="Ex: 75"
													min="20"
													max="300"
													bind:value={frequenciaCardiaca}
												/>
												<span class="vital-unit">bpm</span>
											</div>
										</div>
									</div>

									<!-- CARD 3: Frequência Respiratória (FR) -->
									<div class="vital-card">
										<div class="vital-card-header">
											<div class="vital-title-wrap">
												<span class="vital-icon fr-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"></path><path d="M6 8h12"></path><path d="M6 16h12"></path></svg></span>
												<div>
													<span class="vital-card-title">Frequência Respiratória</span>
													<span class="vital-card-subtitle">FR / Incursões</span>
												</div>
											</div>
											{#if classificacaoFR}
												<span class="vital-eval-badge {classificacaoFR.type}">
													{classificacaoFR.label}
												</span>
											{/if}
										</div>

										<div class="vital-input-group">
											<label for="input-fr" class="vital-micro-label">Incursões por Minuto</label>
											<div class="vital-input-wrap">
												<input
													id="input-fr"
													type="number"
													class="vital-input"
													placeholder="Ex: 16"
													min="4"
													max="80"
													bind:value={frequenciaRespiratoria}
												/>
												<span class="vital-unit">ipm</span>
											</div>
										</div>
									</div>

									<!-- CARD 4: Temperatura Axilar -->
									<div class="vital-card">
										<div class="vital-card-header">
											<div class="vital-title-wrap">
												<span class="vital-icon temp-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path></svg></span>
												<div>
													<span class="vital-card-title">Temperatura Corporal</span>
													<span class="vital-card-subtitle">Taxilar</span>
												</div>
											</div>
											{#if classificacaoTemperatura}
												<span class="vital-eval-badge {classificacaoTemperatura.type}">
													{classificacaoTemperatura.label}
												</span>
											{/if}
										</div>

										<div class="vital-input-group">
											<label for="input-temp" class="vital-micro-label">Graus Celsius</label>
											<div class="vital-input-wrap">
												<input
													id="input-temp"
													type="number"
													step="0.1"
													class="vital-input"
													placeholder="Ex: 36.5"
													min="30"
													max="45"
													bind:value={temperatura}
												/>
												<span class="vital-unit">°C</span>
											</div>
										</div>
									</div>

									<!-- CARD 5: Saturação de Oxigênio (SpO2) -->
									<div class="vital-card">
										<div class="vital-card-header">
											<div class="vital-title-wrap">
												<span class="vital-icon spo2-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path><path d="m14.83 9.17 4.24-4.24"></path><path d="m14.83 14.83 4.24 4.24"></path><path d="m9.17 14.83-4.24 4.24"></path></svg></span>
												<div>
													<span class="vital-card-title">Saturação de Oxigênio</span>
													<span class="vital-card-subtitle">SpO2 periférica</span>
												</div>
											</div>
											{#if classificacaoSpO2}
												<span class="vital-eval-badge {classificacaoSpO2.type}">
													{classificacaoSpO2.label}
												</span>
											{/if}
										</div>

										<div class="vital-input-group">
											<label for="input-spo2" class="vital-micro-label">Porcentagem O2</label>
											<div class="vital-input-wrap">
												<input
													id="input-spo2"
													type="number"
													class="vital-input"
													placeholder="Ex: 98"
													min="50"
													max="100"
													bind:value={spo2}
												/>
												<span class="vital-unit">%</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 04 · ANTROPOMETRIA (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-antropometria"
						class:collapsed={collapsedSections.has("sec-antropometria")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-antropometria")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-antropometria");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">04</span>
								<h2 class="section-title">
									Antropometria
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{resumoAntropometriaBadge}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-antropometria")}
							<div class="section-body">
								<!-- Main Metrics Grid: Peso + Altura + IMC (com recálculo e edição por amputação) -->
								<div class="antropo-main-grid">
									<!-- Peso Atual -->
									<div class="antropo-card">
										<div class="antropo-card-header">
											<div class="antropo-title-wrap">
												<span class="antropo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg></span>
												<div>
													<span class="antropo-card-title">Peso Atual</span>
													<span class="antropo-card-subtitle">Massa corporal</span>
												</div>
											</div>
										</div>
										<div class="antropo-input-wrap">
											<input
												type="text"
												class="antropo-input"
												placeholder="Ex: 72.5"
												bind:value={pesoAtual}
											/>
											<span class="antropo-unit">kg</span>
										</div>
									</div>

									<!-- Altura -->
									<div class="antropo-card">
										<div class="antropo-card-header">
											<div class="antropo-title-wrap">
												<span class="antropo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="m17 7-5-5-5 5"></path><path d="m17 17-5 5-5-5"></path></svg></span>
												<div>
													<span class="antropo-card-title">Estatura / Altura</span>
													<span class="antropo-card-subtitle">Em cm ou metros</span>
												</div>
											</div>
										</div>
										<div class="antropo-input-wrap">
											<input
												type="text"
												class="antropo-input"
												placeholder="Ex: 175 (ou 1.75)"
												bind:value={altura}
											/>
											<span class="antropo-unit">cm</span>
										</div>
									</div>

									<!-- IMC (Calculado e Editável para Amputações / Massa livre) -->
									<div class="antropo-card imc-card">
										<div class="antropo-card-header">
											<div class="antropo-title-wrap">
												<span class="antropo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg></span>
												<div>
													<span class="antropo-card-title">IMC</span>
													<span class="antropo-card-subtitle">Calculado (editável p/ amputação)</span>
												</div>
											</div>
											{#if classificacaoIMC}
												<span class="vital-eval-badge {classificacaoIMC.type}">
													{classificacaoIMC.label}
												</span>
											{/if}
										</div>

										<div class="antropo-imc-input-row">
											<div class="antropo-input-wrap imc-input-wrap">
												<input
													type="text"
													class="antropo-input imc-input"
													placeholder="—"
													bind:value={imcCustomizado}
													oninput={() => imcFoiEditadoManualmente = true}
												/>
												<span class="antropo-unit">kg/m²</span>
											</div>

											{#if imcFoiEditadoManualmente}
												<button
													type="button"
													class="btn-recalc-imc"
													onclick={recalcularImcAutomatico}
													title="Restaurar cálculo automático padrão: Peso / Altura²"
												>
													Recalcular padrão
												</button>
											{/if}
										</div>

										{#if imcFoiEditadoManualmente}
											<span class="imc-custom-hint">
												IMC ajustado manualmente (ex: amputação ou composição corporal)
											</span>
										{/if}
									</div>
								</div>

								<!-- Circunferências Adicionais e Relação Cintura/Quadril -->
								<div class="antropo-secondary-grid">
									<!-- Circunferência Abdominal -->
									<div class="antropo-sub-card">
										<div class="antropo-sub-header">
											<label for="input-circ-abd" class="antropo-sub-label">Circunf. Abdominal (Cintura)</label>
											{#if riscoCircunferenciaAbdominal}
												<span class="vital-eval-badge {riscoCircunferenciaAbdominal.type}">
													{riscoCircunferenciaAbdominal.label}
												</span>
											{/if}
										</div>
										<div class="antropo-input-wrap small">
											<input
												id="input-circ-abd"
												type="text"
												class="antropo-input"
												placeholder="Ex: 88"
												bind:value={circunferenciaAbdominal}
											/>
											<span class="antropo-unit">cm</span>
										</div>
									</div>

									<!-- Circunferência do Quadril -->
									<div class="antropo-sub-card">
										<div class="antropo-sub-header">
											<label for="input-circ-quad" class="antropo-sub-label">Circunferência do Quadril</label>
											{#if rcqCalculada}
												<span class="vital-eval-badge info">
													RCQ: {rcqCalculada}
												</span>
											{/if}
										</div>
										<div class="antropo-input-wrap small">
											<input
												id="input-circ-quad"
												type="text"
												class="antropo-input"
												placeholder="Ex: 102"
												bind:value={circunferenciaQuadril}
											/>
											<span class="antropo-unit">cm</span>
										</div>
									</div>

									<!-- Circunferência da Panturrilha (Sarcopenia / Idosos) -->
									<div class="antropo-sub-card">
										<div class="antropo-sub-header">
											<label for="input-circ-pant" class="antropo-sub-label">Circunf. Panturrilha</label>
											<span class="label-hint">(sarcopenia)</span>
										</div>
										<div class="antropo-input-wrap small">
											<input
												id="input-circ-pant"
												type="text"
												class="antropo-input"
												placeholder="Ex: 34"
												bind:value={circunferenciaPanturrilha}
											/>
											<span class="antropo-unit">cm</span>
										</div>
									</div>
								</div>

								<!-- Observações e Justificativas (ex: amputação, próteses, edema) -->
								<div class="antropo-obs-group">
									<label for="input-antropo-obs" class="antropo-sub-label">
										Observações Antropométricas / Amputações / Biotipo
										<span class="label-hint">(opcional — registre amputações, tipo de prótese ou justificativa de IMC manual)</span>
									</label>
									<input
										id="input-antropo-obs"
										type="text"
										class="antropo-obs-input"
										placeholder="Ex: Amputação transfemoral direita. Peso corrigido (+16%) ou cálculo de peso estimado segundo fórmula de Chumlea."
										bind:value={observacoesAntropometria}
									/>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 05 · EXAME FÍSICO GERAL (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-ef-geral"
						class:collapsed={collapsedSections.has("sec-ef-geral")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-ef-geral")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-ef-geral");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">05</span>
								<h2 class="section-title">
									Exame Físico Geral
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{exameFisicoGeral.trim() ? "Preenchido" : "Não preenchido"}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-ef-geral")}
							<div class="section-body">
								<div class="form-grid">
									<div class="form-group span-2">
										<div class="field-header-row">
											<label for="id-ef-geral" class="form-label">
												Ectoscopia / Estado Geral
												<span class="label-hint">(estado geral, hidratação, mucosas, fácies, atitude, orientação, marcha, fala)</span>
											</label>
											<button
												type="button"
												class="btn-template-action"
												onclick={preencherTemplateExameFisicoGeral}
												title="Preencher com o modelo padrão normal"
											>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
													<polyline points="14 2 14 8 20 8"></polyline>
													<line x1="16" y1="13" x2="8" y2="13"></line>
													<line x1="16" y1="17" x2="8" y2="17"></line>
													<polyline points="10 9 9 9 8 9"></polyline>
												</svg>
												<span>Template</span>
											</button>
										</div>
										<textarea
											id="id-ef-geral"
											class="form-textarea"
											rows="5"
											placeholder="Ex: Bom estado geral, corado, hidratado, acianótico, anictérico, afebril. Ativo, cooperativo, orientado em tempo e espaço. Marcha e fala sem alterações estruturais aparentes. Fácies atípica."
											bind:value={exameFisicoGeral}
										></textarea>
									</div>
								</div>
							</div>
						{/if}
					</section>

					<!-- ── SEÇÃO 06 · EXAME GINECOLÓGICO (CONDICIONAL: ) ── -->
					{#if sexoBiologico === "F"}
						<section
							class="section-card"
							id="sec-exame-ginecologico"
							class:collapsed={collapsedSections.has("sec-exame-ginecologico")}
						>
							<!-- Section Header / Toggle -->
							<div
								class="section-header"
								role="button"
								tabindex="0"
								onclick={() => toggleSection("sec-exame-ginecologico")}
								onkeydown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										toggleSection("sec-exame-ginecologico");
									}
								}}
							>
								<div class="section-title-wrap">
									<span class="section-num obj">06</span>
									<h2 class="section-title">
										Exame Ginecológico
									</h2>
								</div>
								<div class="section-actions">
									<span class="section-status-badge">
										{resumoExameGinecologicoBadge}
									</span>
									<svg
										class="chevron-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="6 9 12 15 18 9"></polyline>
									</svg>
								</div>
							</div>

							<!-- Section Body -->
							{#if !collapsedSections.has("sec-exame-ginecologico")}
								<div class="section-body">
									<!-- BLOC 1: EXAME DAS MAMAS -->
									<div class="gyn-block">
										<div class="gyn-block-header">
											<span class="gyn-block-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 2a4 4 0 0 0-4 4c0 3 4 6 4 6s4-3 4-6a4 4 0 0 0-4-4Z"></path></svg></span>
											<div>
												<h3 class="gyn-block-title">i. Exame das Mamas</h3>
												<span class="gyn-block-subtitle">Inspeção estática, dinâmica, palpação e expressão mamilar</span>
											</div>
										</div>

										<div class="gyn-block-body">
											<!-- 1. Inspeção Estática -->
											<div class="gyn-subcard">
												<div class="gyn-subcard-header">
													<span class="gyn-subcard-num">1</span>
													<h4 class="gyn-subcard-title">Inspeção Estática</h4>
												</div>

												<div class="gyn-static-options-grid">
													<!-- Posição -->
													<div class="gyn-choice-group">
														<span class="gyn-choice-label">Posição:</span>
														<div class="gyn-pills-row">
															{#each ["tópicas", "ptóticas"] as opt}
																<button
																	type="button"
																	class="gyn-pill-btn"
																	class:selected={mamasPosicao === opt}
																	onclick={() => (mamasPosicao = mamasPosicao === opt ? "" : (opt as any))}
																>
																	{opt.charAt(0).toUpperCase() + opt.slice(1)}
																</button>
															{/each}
														</div>
													</div>

													<!-- Simetria -->
													<div class="gyn-choice-group">
														<span class="gyn-choice-label">Simetria:</span>
														<div class="gyn-pills-row">
															{#each ["simétricas", "assimétricas"] as opt}
																<button
																	type="button"
																	class="gyn-pill-btn"
																	class:selected={mamasSimetria === opt}
																	onclick={() => (mamasSimetria = mamasSimetria === opt ? "" : (opt as any))}
																>
																	{opt.charAt(0).toUpperCase() + opt.slice(1)}
																</button>
															{/each}
														</div>
													</div>

													<!-- Volume -->
													<div class="gyn-choice-group">
														<span class="gyn-choice-label">Volume:</span>
														<div class="gyn-pills-row">
															{#each ["eutróficas", "hipotróficas", "hipertróficas"] as opt}
																<button
																	type="button"
																	class="gyn-pill-btn"
																	class:selected={mamasVolume === opt}
																	onclick={() => (mamasVolume = mamasVolume === opt ? "" : (opt as any))}
																>
																	{opt.charAt(0).toUpperCase() + opt.slice(1)}
																</button>
															{/each}
														</div>
													</div>

													<!-- Mamilos -->
													<div class="gyn-choice-group">
														<span class="gyn-choice-label">Mamilos:</span>
														<div class="gyn-pills-row">
															{#each ["proeminentes", "planos", "invertidos"] as opt}
																<button
																	type="button"
																	class="gyn-pill-btn"
																	class:selected={mamasMamilos === opt}
																	onclick={() => (mamasMamilos = mamasMamilos === opt ? "" : (opt as any))}
																>
																	{opt.charAt(0).toUpperCase() + opt.slice(1)}
																</button>
															{/each}
														</div>
													</div>
												</div>

												<!-- Checkbox Ausência de abaulamentos e retrações -->
												<div class="gyn-checkbox-wrap">
													<label class="gyn-checkbox-label">
														<input
															type="checkbox"
															class="gyn-checkbox"
															bind:checked={mamasInspecaoEstaticaSemAbaulamentos}
														/>
														<span>Ausência de abaulamentos e retrações</span>
													</label>
												</div>

												<!-- Observações -->
												<div class="gyn-obs-wrap">
													<input
														type="text"
														class="gyn-input-text"
														placeholder="Observações da inspeção estática (opcional)..."
														bind:value={mamasInspecaoEstaticaObs}
													/>
												</div>
											</div>

											<!-- 2. Inspeção Dinâmica -->
											<div class="gyn-subcard">
												<div class="gyn-subcard-header">
													<span class="gyn-subcard-num">2</span>
													<h4 class="gyn-subcard-title">Inspeção Dinâmica</h4>
												</div>

												<!-- Checkbox Ausência de abaulamentos e retrações -->
												<div class="gyn-checkbox-wrap">
													<label class="gyn-checkbox-label">
														<input
															type="checkbox"
															class="gyn-checkbox"
															bind:checked={mamasInspecaoDinamicaSemAbaulamentos}
														/>
														<span>Ausência de abaulamentos e retrações (manobra de contração e elevação dos MMSS)</span>
													</label>
												</div>

												<!-- Observações -->
												<div class="gyn-obs-wrap">
													<input
														type="text"
														class="gyn-input-text"
														placeholder="Observações da inspeção dinâmica (opcional)..."
														bind:value={mamasInspecaoDinamicaObs}
													/>
												</div>
											</div>

											<!-- 3. Palpação das Mamas e Linfonodos -->
											<div class="gyn-subcard gyn-subcard-full">
												<div class="gyn-subcard-header with-action">
													<div class="gyn-subcard-title-wrap">
														<span class="gyn-subcard-num">3</span>
														<h4 class="gyn-subcard-title">Palpação das Mamas e Linfonodos</h4>
													</div>
													<button
														type="button"
														class="btn-template-action"
														onclick={preencherExemploPalpacaoMamas}
														title="Preencher com o modelo padrão"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
															<polyline points="14 2 14 8 20 8"></polyline>
															<line x1="16" y1="13" x2="8" y2="13"></line>
															<line x1="16" y1="17" x2="8" y2="17"></line>
															<polyline points="10 9 9 9 8 9"></polyline>
														</svg>
														<span>Exemplo</span>
													</button>
												</div>

												<div class="gyn-textarea-wrap full-width">
													<textarea
														class="form-textarea gyn-textarea-expanded"
														rows="4"
														placeholder="Descreva a palpação das mamas e cadeias linfáticas..."
														bind:value={mamasPalpacaoLinfonodos}
													></textarea>
												</div>
											</div>

											<!-- 4. Expressão Mamilar -->
											<div class="gyn-subcard">
												<div class="gyn-subcard-header">
													<span class="gyn-subcard-num">4</span>
													<h4 class="gyn-subcard-title">Expressão Mamilar</h4>
												</div>

												<div class="gyn-radio-row">
													<label class="gyn-radio-label">
														<input
															type="radio"
															name="exp-mamilar"
															value="negativa"
															bind:group={mamasExpressaoMamilar}
														/>
														<span>Negativa (sem descarga papilar)</span>
													</label>
													<label class="gyn-radio-label">
														<input
															type="radio"
															name="exp-mamilar"
															value="positiva"
															bind:group={mamasExpressaoMamilar}
														/>
														<span>Positiva (descarga papilar presente)</span>
													</label>
												</div>

												<!-- Observações -->
												<div class="gyn-obs-wrap">
													<input
														type="text"
														class="gyn-input-text"
														placeholder="Observações da expressão mamilar (aspecto da secreção: serosa, hemática, láctea, ductos acometidos)..."
														bind:value={mamasExpressaoMamilarObs}
													/>
												</div>
											</div>
										</div>
									</div>

									<!-- BLOC 2: EXAME DA GENITÁLIA -->
									<div class="gyn-block">
										<div class="gyn-block-header">
											<span class="gyn-block-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg></span>
											<div>
												<h3 class="gyn-block-title">ii. Exame da Genitália</h3>
												<span class="gyn-block-subtitle">Inspeção da genitália externa, exame especular (genitália interna) e palpação bimanual</span>
											</div>
										</div>

										<div class="gyn-block-body">
											<!-- 1. Genitália Externa -->
											<div class="gyn-subcard gyn-subcard-full">
												<div class="gyn-subcard-header with-action">
													<div class="gyn-subcard-title-wrap">
														<span class="gyn-subcard-num">1</span>
														<h4 class="gyn-subcard-title">Genitália Externa</h4>
													</div>
													<button
														type="button"
														class="btn-template-action"
														onclick={preencherExemploGenitaliaExterna}
														title="Preencher com o modelo padrão"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
															<polyline points="14 2 14 8 20 8"></polyline>
															<line x1="16" y1="13" x2="8" y2="13"></line>
															<line x1="16" y1="17" x2="8" y2="17"></line>
															<polyline points="10 9 9 9 8 9"></polyline>
														</svg>
														<span>Exemplo</span>
													</button>
												</div>

												<div class="gyn-textarea-wrap full-width">
													<textarea
														class="form-textarea gyn-textarea-expanded"
														rows="4"
														placeholder="Descreva a genitália externa (vulva, trofismo, pilificação, lesões)..."
														bind:value={genitaliaExterna}
													></textarea>
												</div>
											</div>

											<!-- 2. Genitália Interna (Exame Especular) -->
											<div class="gyn-subcard gyn-subcard-full">
												<div class="gyn-subcard-header with-action">
													<div class="gyn-subcard-title-wrap">
														<span class="gyn-subcard-num">2</span>
														<h4 class="gyn-subcard-title">Genitália Interna (Exame Especular)</h4>
													</div>
													<button
														type="button"
														class="btn-template-action"
														onclick={preencherExemploGenitaliaInterna}
														title="Preencher com o modelo padrão"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
															<polyline points="14 2 14 8 20 8"></polyline>
															<line x1="16" y1="13" x2="8" y2="13"></line>
															<line x1="16" y1="17" x2="8" y2="17"></line>
															<polyline points="10 9 9 9 8 9"></polyline>
														</svg>
														<span>Exemplo</span>
													</button>
												</div>

												<div class="gyn-textarea-wrap full-width">
													<textarea
														class="form-textarea gyn-textarea-expanded"
														rows="4"
														placeholder="Descreva o exame especular (paredes vaginais, conteúdo, colo uterino, orifício externo)..."
														bind:value={genitaliaInterna}
													></textarea>
												</div>
											</div>

											<!-- 3. Palpação Bimanual (Toque Combinado) -->
											<div class="gyn-subcard gyn-subcard-full">
												<div class="gyn-subcard-header with-action">
													<div class="gyn-subcard-title-wrap">
														<span class="gyn-subcard-num">3</span>
														<h4 class="gyn-subcard-title">Palpação Bimanual (Toque Combinado)</h4>
													</div>
													<button
														type="button"
														class="btn-template-action"
														onclick={preencherExemploPalpacaoBimanual}
														title="Preencher com o modelo padrão"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
															<polyline points="14 2 14 8 20 8"></polyline>
															<line x1="16" y1="13" x2="8" y2="13"></line>
															<line x1="16" y1="17" x2="8" y2="17"></line>
															<polyline points="10 9 9 9 8 9"></polyline>
														</svg>
														<span>Exemplo</span>
													</button>
												</div>

												<div class="gyn-textarea-wrap full-width">
													<textarea
														class="form-textarea gyn-textarea-expanded"
														rows="4"
														placeholder="Descreva a palpação bimanual (útero, consistência, mobilidade, dor à mobilização, regiões anexiais)..."
														bind:value={palpacaoBimanual}
													></textarea>
												</div>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</section>
					{/if}

					<!-- ── SEÇÃO EXAME POR APARELHOS (COLAPSÁVEL) ── -->
					<section
						class="section-card"
						id="sec-exame-aparelhos"
						class:collapsed={collapsedSections.has("sec-exame-aparelhos")}
					>
						<!-- Section Header / Toggle -->
						<div
							class="section-header"
							role="button"
							tabindex="0"
							onclick={() => toggleSection("sec-exame-aparelhos")}
							onkeydown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									toggleSection("sec-exame-aparelhos");
								}
							}}
						>
							<div class="section-title-wrap">
								<span class="section-num obj">{sexoBiologico === 'F' ? '07' : '06'}</span>
								<h2 class="section-title">
									Exame Físico por Aparelhos
								</h2>
							</div>
							<div class="section-actions">
								<span class="section-status-badge">
									{resumoExameAparelhosBadge}
								</span>
								<svg
									class="chevron-icon"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
						</div>

						<!-- Section Body -->
						{#if !collapsedSections.has("sec-exame-aparelhos")}
							<div class="section-body">
								<!-- Controls bar: Expandir / Recolher todos -->
								<div class="aparelhos-controls-bar">
									<span class="aparelhos-hint-text">
										Selecione um aparelho para expandir e descrever, ou use os botões de exemplo rápido:
									</span>
									<div class="aparelhos-buttons-row">
										<button
											type="button"
											class="btn-aparelho-toggle-all"
											onclick={expandirTodosAparelhos}
										>
											Expandir todos
										</button>
										<button
											type="button"
											class="btn-aparelho-toggle-all"
											onclick={recolherTodosAparelhos}
										>
											Recolher todos
										</button>
									</div>
								</div>

								<div class="aparelhos-grid">
									<!-- a. Exame neurológico -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-neuro")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-neuro")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-neuro");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">a</span>
												<div>
													<span class="aparelho-title-text">Exame Neurológico</span>
													<span class="label-hint">(Glasgow, pupilas, déficits, coordenação, meninges, reflexos)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameNeurologico.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploNeurologico();
													}}
													title="Preencher com o modelo padrão de exame neurológico normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-neuro")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-neuro")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-neuro"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame neurológico..."
													bind:value={exameNeurologico}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- b. Exame do aparelho respiratório superior -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-resp-sup")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-resp-sup")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-resp-sup");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">b</span>
												<div>
													<span class="aparelho-title-text">Aparelho Respiratório Superior</span>
													<span class="label-hint">(narinas, mucosa nasal, orofaringe, amígdalas, condutos e tímpanos)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameRespSuperior.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploRespSuperior();
													}}
													title="Preencher com o modelo padrão de respiratório superior normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-resp-sup")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-resp-sup")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-resp-sup"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame do aparelho respiratório superior..."
													bind:value={exameRespSuperior}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- c. Exame do aparelho respiratório inferior -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-resp-inf")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-resp-inf")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-resp-inf");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">c</span>
												<div>
													<span class="aparelho-title-text">Aparelho Respiratório Inferior</span>
													<span class="label-hint">(tórax, expansibilidade, FTV, murmúrio vesicular, ruídos adventícios, percussão)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameRespInferior.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploRespInferior();
													}}
													title="Preencher com o modelo padrão de respiratório inferior normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-resp-inf")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-resp-inf")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-resp-inf"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame do aparelho respiratório inferior..."
													bind:value={exameRespInferior}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- d. Exame cardiovascular -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-cardio")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-cardio")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-cardio");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">d</span>
												<div>
													<span class="aparelho-title-text">Aparelho Cardiovascular</span>
													<span class="label-hint">(ictus cordis, ritmo, bulhas, sopros, pulsos periféricos, TEC)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameCardiovascular.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploCardiovascular();
													}}
													title="Preencher com o modelo padrão de cardiovascular normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-cardio")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-cardio")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-cardio"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame cardiovascular..."
													bind:value={exameCardiovascular}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- e. Aparelho digestório -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-digest")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-digest")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-digest");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">e</span>
												<div>
													<span class="aparelho-title-text">Aparelho Digestório (Abdome)</span>
													<span class="label-hint">(inspeção, RHA, palpação superficial/profunda, visceromegalias, percussão)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameDigestorio.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploDigestorio();
													}}
													title="Preencher com o modelo padrão de abdome normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-digest")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-digest")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-digest"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame do abdome e aparelho digestório..."
													bind:value={exameDigestorio}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- f. Aparelho genitourinário -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-genitouro")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-genitouro")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-genitouro");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">f</span>
												<div>
													<span class="aparelho-title-text">Aparelho Genitourinário</span>
													<span class="label-hint">(inspeção, loja renal, punho-percussão/Giordano, topografia vesical)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameGenitourinario.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploGenitourinario();
													}}
													title="Preencher com o modelo padrão de genitourinário normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-genitouro")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-genitouro")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-genitouro"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame do aparelho genitourinário..."
													bind:value={exameGenitourinario}
												></textarea>
											</div>
										{/if}
									</div>

									<!-- g. Exame dermatológico (Pele, Mucosas e Fâneros) -->
									<div
										class="aparelho-accordion-card"
										class:is-collapsed={collapsedAparelhos.has("aparelho-dermato")}
									>
										<div
											class="aparelho-accordion-header"
											role="button"
											tabindex="0"
											onclick={() => toggleAparelho("aparelho-dermato")}
											onkeydown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													toggleAparelho("aparelho-dermato");
												}
											}}
										>
											<div class="aparelho-title-wrap">
												<span class="aparelho-letter">g</span>
												<div>
													<span class="aparelho-title-text">Exame Dermatológico</span>
													<span class="label-hint">(pele, mucosas, turgor, elasticidade, lesões elementares, máculas, cicatrizes, fâneros)</span>
												</div>
											</div>

											<div class="aparelho-header-actions">
												{#if exameDermatologico.trim()}
													<span class="aparelho-status-tag filled">Preenchido</span>
												{:else}
													<span class="aparelho-status-tag empty">Não preenchido</span>
												{/if}
												<button
													type="button"
													class="btn-template-action"
													onclick={(e) => {
														e.stopPropagation();
														preencherExemploDermatologico();
													}}
													title="Preencher com o modelo padrão de dermatológico normal"
												>
													<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
														<line x1="16" y1="13" x2="8" y2="13"></line>
														<line x1="16" y1="17" x2="8" y2="17"></line>
													</svg>
													<span>Exemplo</span>
												</button>
												<svg
													class="aparelho-chevron"
													class:rotated={!collapsedAparelhos.has("aparelho-dermato")}
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="6 9 12 15 18 9"></polyline>
												</svg>
											</div>
										</div>

										{#if !collapsedAparelhos.has("aparelho-dermato")}
											<div class="aparelho-accordion-body">
												<textarea
													id="id-exame-dermatologico"
													class="form-textarea gyn-textarea-expanded"
													rows="4"
													placeholder="Descreva o exame dermatológico (pele, mucosas e fâneros)..."
													bind:value={exameDermatologico}
												></textarea>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</section>
				</div>
			{/if}

			<!-- ═══════════════════════════════════════════════════ -->
			<!-- ═══ ABA 3: AVALIAÇÃO ═══ -->
			<!-- ═══════════════════════════════════════════════════ -->
			{#if activeTab === "avaliacao"}
				<div class="tab-pane fade-in">
					<div class="tab-header aval-header">
						<div class="tab-badge aval">A</div>
						<div>
							<h1 class="tab-title">Avaliação</h1>
							<p class="tab-subtitle">
								Raciocínio clínico, hipóteses diagnósticas
								(principais e diferenciais) e estratificação de
								risco.
							</p>
						</div>
					</div>

					<!-- Escores Clínicos -->
					<section class="form-section">
						<div class="section-header-row">
							<div class="section-icon aval-accent">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
							</div>
							<div>
								<h2 class="section-title">Escores Clínicos</h2>
								<p class="section-desc">Calculadoras de escores e estratificação de risco — links externos (MDCalc)</p>
							</div>
						</div>

						<div class="escores-grid">
							{#each escoresClinicos as escore}
								<a
									href={escore.url}
									target="_blank"
									rel="noopener noreferrer"
									class="escore-card"
									style="--escore-color: {escore.cor}"
								>
									<div class="escore-card-icon">
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
									</div>
									<div class="escore-card-info">
										<span class="escore-nome">{escore.nome}</span>
										<span class="escore-desc">{escore.descricao}</span>
									</div>
									<svg class="escore-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
								</a>
							{/each}
						</div>
					</section>

					<!-- Avaliação — Texto + Queixas Sidebar -->
					<section class="form-section">
						<div class="section-header-row">
							<div class="section-icon aval-accent">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
							</div>
							<div>
								<h2 class="section-title">Avaliação Clínica</h2>
								<p class="section-desc">Raciocínio clínico, hipóteses diagnósticas principais e diferenciais</p>
							</div>
						</div>

						<div class="avaliacao-layout">
							<div class="avaliacao-editor">
								<label for="id-avaliacao-texto" class="form-label">Avaliação / Raciocínio Clínico</label>
								<textarea
									id="id-avaliacao-texto"
									class="form-textarea avaliacao-textarea"
									rows="14"
									placeholder="Descreva sua avaliação clínica: síntese do caso, hipóteses diagnósticas principais e diferenciais, estratificação de risco, correlação clínico-laboratorial..."
									bind:value={avaliacaoTexto}
								></textarea>
							</div>

							<aside class="queixas-sidebar">
								<div class="queixas-sidebar-header">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
									<span>Queixas do Paciente</span>
								</div>

								<div class="queixa-item-sidebar">
									<span class="queixa-label-sidebar">Queixa Principal</span>
									{#if queixaPrincipal.trim()}
										<p class="queixa-text-sidebar">{queixaPrincipal}</p>
									{:else}
										<p class="queixa-text-sidebar queixa-empty">Não preenchida</p>
									{/if}
								</div>

								{#if queixasSecundarias.length > 0}
									<div class="queixa-divider"></div>
									<span class="queixa-label-sidebar">Queixas Secundárias</span>
									{#each queixasSecundarias as qs}
										{#if qs.queixa.trim()}
											<div class="queixa-item-sidebar queixa-sec">
												<span class="queixa-sec-bullet">•</span>
												<p class="queixa-text-sidebar">{qs.queixa}</p>
											</div>
										{/if}
									{/each}
									{#if queixasSecundarias.filter(q => q.queixa.trim()).length === 0}
										<p class="queixa-text-sidebar queixa-empty">Nenhuma preenchida</p>
									{/if}
								{:else}
									<div class="queixa-divider"></div>
									<span class="queixa-label-sidebar">Queixas Secundárias</span>
									<p class="queixa-text-sidebar queixa-empty">Nenhuma adicionada</p>
								{/if}
							</aside>
						</div>
					</section>
				</div>
			{/if}

			<!-- ═══════════════════════════════════════════════════ -->
			<!-- ═══ ABA 4: PLANO ═══ -->
			<!-- ═══════════════════════════════════════════════════ -->
			{#if activeTab === "plano"}
				<div class="tab-pane fade-in">
					<div class="tab-header plan-header">
						<div class="tab-badge plan">P</div>
						<div>
							<h1 class="tab-title">Plano</h1>
							<p class="tab-subtitle">
								Conduta terapêutica, prescrição medicamentosa,
								solicitações de exames, encaminhamentos e
								seguimento.
							</p>
						</div>
					</div>

					<!-- Prescrição Medicamentosa -->
					<section class="form-section">
						<div class="meds-box-wrapper plan-meds-wrapper">
							<div class="meds-box-header">
								<div class="meds-box-title-wrap">
									<svg class="meds-icon-svg plan-med-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>
									<div>
										<span class="meds-box-title">Prescrição Medicamentosa</span>
										<span class="meds-box-subtitle">Medicamentos prescritos nesta consulta — organizados por classe</span>
									</div>
								</div>
								<button
									type="button"
									class="btn-add-med btn-add-presc"
									onclick={() => (modalPrescricaoOpen = true)}
								>
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
									<span>Prescrever Medicamento</span>
								</button>
							</div>

							{#if totalPrescricao === 0}
								<div class="meds-empty-state">
									<div class="meds-empty-icon plan-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg></div>
									<h4>Nenhum medicamento prescrito ainda</h4>
									<p>Clique no botão <strong>"+ Prescrever Medicamento"</strong> para buscar e adicionar à prescrição.</p>
								</div>
							{:else}
								<div class="meds-groups-list">
									{#each Object.entries(prescricaoPorClasse) as [classe, lista]}
										<div class="med-class-group">
											<div class="med-class-header">
												<span class="med-class-tag presc-tag">{classe}</span>
												<span class="med-class-count">{lista.length} {lista.length === 1 ? 'medicamento' : 'medicamentos'}</span>
											</div>
											<div class="med-items-grid">
												{#each lista as m (m.id)}
													<div class="med-card-item presc-card">
														<div class="med-card-main">
															<div class="med-card-name-row">
																<span class="med-name">{m.principioAtivo}</span>
																{#if m.concentracao}
																	<span class="med-conc">{m.concentracao}</span>
																{/if}
															</div>
															<div class="med-card-details">
																<span class="med-forma">{m.formaFarmaceutica}</span>
																<span class="med-pos-pill presc-pos" title="Posologia">{m.posologiaTexto}</span>
															</div>
															{#if m.observacoes}
																<div class="med-card-obs"><em>{m.observacoes}</em></div>
															{/if}
														</div>
														<button
															type="button"
															class="btn-remove-med"
															onclick={() => removerPrescricao(m.id)}
															title="Remover da prescrição"
														>
															<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
														</button>
													</div>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</section>

					<!-- Conduta -->
					<section class="form-section">
						<div class="section-header-row">
							<div class="section-icon plan-accent">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
							</div>
							<div>
								<h2 class="section-title">Conduta</h2>
								<p class="section-desc">Orientações gerais, exames solicitados, encaminhamentos, retorno e demais condutas</p>
							</div>
						</div>

						<div class="form-group">
							<label for="id-conduta" class="form-label">Plano de Conduta</label>
							<textarea
								id="id-conduta"
								class="form-textarea conduta-textarea"
								rows="10"
								placeholder={"Ex: 1. Solicitar exames laboratoriais (hemograma, glicemia jejum, HbA1c, perfil lipídico, creatinina/TFG, TSH)\n2. Ajuste de medicação...\n3. Encaminhamento para especialista...\n4. Orientações sobre dieta e atividade física\n5. Retorno em 30 dias com exames"}
								bind:value={condutaTexto}
							></textarea>
						</div>
					</section>
				</div>
			{/if}

			<!-- Rodapé do Prontuário Adulto -->
			<footer class="prontuario-footer">
				<div class="prontuario-footer-inner">
					<span>MedicinaHub • Prontuário do Adulto (100% Client-Side)</span>
					<a href="/politica-de-privacidade" target="_blank" class="footer-privacy-link">Política de Privacidade & LGPD</a>
				</div>
			</footer>
		</main>
	</div>
</div>

<!-- Modais da Anamnese -->
<MedicamentoUsoModal
	bind:open={modalMedUsoOpen}
	onsave={adicionarMedicamento}
/>
<MedicamentoUsoModal
	bind:open={modalPrescricaoOpen}
	onsave={adicionarPrescricao}
/>
<FagerstromModal bind:open={modalFagerstromOpen} onsave={salvarFagerstrom} />
<ExameModal
	bind:open={modalExameOpen}
	exameParaEditar={exameSelecionadoParaEditar}
	onsave={salvarExame}
/>

<style>
	:root {
		--bg-app: #f8fafc;
		--bg-surface: #ffffff;
		--border-color: #e2e8f0;
		--border-light: #edf2f7;
		--border-focus: #2563eb;

		--text-main: #0f172a;
		--text-muted: #64748b;
		--text-subtle: #94a3b8;

		--tab-sub: #2563eb;
		--tab-sub-bg: #eff6ff;
		--tab-obj: #059669;
		--tab-obj-bg: #ecfdf5;
		--tab-aval: #d97706;
		--tab-aval-bg: #fffbeb;
		--tab-plan: #7c3aed;
		--tab-plan-bg: #f5f3ff;

		--radius-sm: 6px;
		--radius-md: 10px;
		--radius-lg: 14px;
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04),
			0 1px 2px rgba(0, 0, 0, 0.02);
		--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05),
			0 1px 3px rgba(0, 0, 0, 0.02);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--bg-app);
		color: var(--text-main);
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	.soap-app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-app);
	}

	/* ═══ TOPBAR ═══ */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 100;
		height: 60px;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
		gap: 16px;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 13px;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
		background: #ffffff;
		transition: all 0.15s ease;
	}

	.btn-back:hover {
		color: var(--text-main);
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.brand-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-weight: 800;
		font-size: 16px;
		color: var(--text-main);
		letter-spacing: -0.02em;
	}

	.brand-badge {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		background: #0f172a;
		color: #ffffff;
		padding: 2px 7px;
		border-radius: 4px;
		letter-spacing: 0.05em;
	}

	/* Tabs Navigation */
	.tabs-nav {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #f1f5f9;
		padding: 4px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-family: "Inter", sans-serif;
		font-size: 13px;
		font-weight: 600;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.18s ease;
	}

	.tab-btn:hover {
		color: var(--text-main);
		background: rgba(255, 255, 255, 0.6);
	}

	.tab-btn.active {
		background: #ffffff;
		color: var(--text-main);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.tab-letter {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		color: #ffffff;
	}

	.tab-letter.subjetivo {
		background: var(--tab-sub);
	}
	.tab-letter.objetivo {
		background: var(--tab-obj);
	}
	.tab-letter.avaliacao {
		background: var(--tab-aval);
	}
	.tab-letter.plano {
		background: var(--tab-plan);
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--text-muted);
		background: #f8fafc;
		border: 1px solid var(--border-color);
		padding: 4px 10px;
		border-radius: 9999px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #94a3b8;
		transition: background 0.3s ease;
	}

	.status-dot.status-ok {
		background: #10b981;
		box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
	}

	.status-dot.status-error {
		background: #ef4444;
		box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
		animation: pulseError 1.5s infinite;
	}

	.status-dot.status-idle {
		background: #94a3b8;
	}

	@keyframes pulseError {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	/* ═══ LAYOUT BODY (Sidebar + Main) ═══ */
	.layout-body {
		flex: 1;
		display: grid;
		grid-template-columns: 240px 1fr;
		min-height: calc(100vh - 60px);
	}

	/* ── SIDEBAR NAV ── */
	.sidebar-nav {
		position: sticky;
		top: 60px;
		height: calc(100vh - 60px);
		background: #ffffff;
		border-right: 1px solid var(--border-color);
		padding: 20px 14px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 6px 10px;
		border-bottom: 1px solid var(--border-light);
	}

	.sidebar-tag {
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		font-family: "IBM Plex Mono", monospace;
		font-size: 10px;
		font-weight: 700;
		color: #ffffff;
	}

	.sidebar-tag.subjetivo {
		background: var(--tab-sub);
	}
	.sidebar-tag.objetivo {
		background: var(--tab-obj);
	}
	.sidebar-tag.avaliacao {
		background: var(--tab-aval);
	}
	.sidebar-tag.plano {
		background: var(--tab-plan);
	}

	.sidebar-title {
		font-size: 11.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.sidebar-links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 8px 12px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		font-family: "Inter", sans-serif;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.nav-link:hover {
		background: #f8fafc;
		color: var(--text-main);
	}

	.nav-link.active {
		background: var(--tab-sub-bg);
		color: var(--tab-sub);
		border-color: #bfdbfe;
		font-weight: 600;
	}

	.nav-num {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		opacity: 0.75;
	}

	.sidebar-empty {
		padding: 20px 8px;
		font-size: 12px;
		color: var(--text-subtle);
		line-height: 1.4;
		font-style: italic;
	}

	/* ── MAIN CONTENT ── */
	.main-content {
		padding: 28px 32px 64px;
		max-width: 920px;
		width: 100%;
		box-sizing: border-box;
	}

	/* Tab Header */
	.tab-header {
		display: flex;
		align-items: center;
		gap: 16px;
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: 18px 24px;
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
	}

	.tab-badge {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		font-family: "IBM Plex Mono", monospace;
		font-size: 20px;
		font-weight: 800;
		color: #ffffff;
		flex-shrink: 0;
	}

	.tab-badge.sub {
		background: var(--tab-sub);
	}
	.tab-badge.obj {
		background: var(--tab-obj);
	}
	.tab-badge.aval {
		background: var(--tab-aval);
	}
	.tab-badge.plan {
		background: var(--tab-plan);
	}

	.tab-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 19px;
		font-weight: 800;
		color: var(--text-main);
		margin: 0 0 2px;
		letter-spacing: -0.02em;
	}

	.tab-subtitle {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	/* ── SECTION CARD (Colapsável) ── */
	.section-card {
		background: var(--bg-surface);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		margin-bottom: 20px;
		box-shadow: var(--shadow-sm);
		overflow: hidden;
		transition:
			border-color 0.2s,
			box-shadow 0.2s;
	}

	.section-card:hover {
		border-color: #cbd5e1;
		box-shadow: var(--shadow-md);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		background: #ffffff;
		cursor: pointer;
		user-select: none;
		border-bottom: 1px solid transparent;
		transition: background 0.15s ease;
	}

	.section-card:not(.collapsed) .section-header {
		border-bottom-color: var(--border-color);
		background: #fafbfc;
	}

	.section-header:hover {
		background: #f8fafc;
	}

	.section-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		color: #ffffff;
	}

	.section-num.sub {
		background: var(--tab-sub);
	}

	.section-num.obj {
		background: var(--tab-obj);
	}

	.section-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 15px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.section-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.section-status-badge {
		font-size: 12px;
		color: var(--text-muted);
		background: #f1f5f9;
		padding: 3px 9px;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron-icon {
		width: 18px;
		height: 18px;
		color: var(--text-muted);
		transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.section-card.collapsed .chevron-icon {
		transform: rotate(-90deg);
	}

	.section-body {
		padding: 20px 24px 24px;
		background: #ffffff;
	}

	/* ── FORM GRID & CONTROLS ── */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group.span-2 {
		grid-column: 1 / -1;
	}

	.form-label {
		font-size: 12.5px;
		font-weight: 600;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.form-label.required::after {
		content: "*";
		color: #e11d48;
		font-weight: 700;
	}

	.label-hint {
		font-size: 11px;
		font-weight: 400;
		color: var(--text-subtle);
	}

	.field-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.btn-template-action {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid #bfdbfe;
		background: #eff6ff;
		color: #2563eb;
		font-family: "Inter", sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-template-action:hover {
		background: #2563eb;
		color: #ffffff;
		border-color: #2563eb;
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
	}

	.form-control,
	.form-select {
		height: 40px;
		padding: 8px 12px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #ffffff;
		font-family: "Inter", sans-serif;
		font-size: 13.5px;
		color: var(--text-main);
		box-sizing: border-box;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-textarea {
		min-height: 90px;
		padding: 10px 12px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #ffffff;
		font-family: "Inter", sans-serif;
		font-size: 13.5px;
		color: var(--text-main);
		line-height: 1.5;
		resize: vertical;
		box-sizing: border-box;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.form-control:focus,
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.form-control::placeholder,
	.form-textarea::placeholder {
		color: #94a3b8;
		font-size: 13px;
	}

	.sub-input {
		margin-top: 6px;
		border-color: #cbd5e1;
		background: #f8fafc;
	}

	/* Radio Cards Row (Sexo Biológico) */
	.radio-cards-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.radio-card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 12px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #ffffff;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.radio-card:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.radio-card.checked {
		border-color: var(--tab-sub);
		background: var(--tab-sub-bg);
	}

	.radio-card input[type="radio"] {
		display: none;
	}

	.radio-custom {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1.5px solid #94a3b8;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.radio-card.checked .radio-custom {
		border-color: var(--tab-sub);
		background: var(--tab-sub);
		box-shadow: inset 0 0 0 3px #ffffff;
	}

	.radio-card-text {
		font-size: 13px;
		color: #334155;
	}

	.radio-card.checked .radio-card-text {
		color: var(--tab-sub);
		font-weight: 600;
	}

	/* ── ACOMPANHANTE SUB-BLOCO COLAPSÁVEL ── */
	.sub-section-box {
		margin-top: 18px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #fafbfc;
		overflow: hidden;
	}

	.sub-section-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: "Inter", sans-serif;
		text-align: left;
		transition: background 0.15s ease;
	}

	.sub-section-toggle:hover {
		background: #f1f5f9;
	}

	.sub-toggle-left {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #334155;
		font-size: 13px;
		font-weight: 600;
	}

	.sub-toggle-left svg {
		color: #64748b;
	}

	.sub-badge {
		font-size: 11px;
		font-weight: 500;
		color: #64748b;
		background: #e2e8f0;
		padding: 2px 7px;
		border-radius: 9999px;
	}

	.sub-badge.active {
		background: var(--tab-sub-bg);
		color: var(--tab-sub);
		border: 1px solid #bfdbfe;
		font-weight: 600;
	}

	.sub-chevron {
		color: #94a3b8;
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.sub-chevron.rotated {
		transform: rotate(180deg);
	}

	.sub-section-content {
		padding: 14px 16px 18px;
		background: #ffffff;
		border-top: 1px solid var(--border-color);
	}

	/* ── FIELD HEADER ROW COM BOTÃO TOGGLE ── */
	.field-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}

	.btn-guide-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 9999px;
		border: 1px solid var(--border-color);
		background: #ffffff;
		color: #475569;
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.btn-guide-toggle:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
		color: #0f172a;
	}

	.btn-guide-toggle.active {
		background: var(--tab-sub-bg);
		border-color: #93c5fd;
		color: var(--tab-sub);
	}

	.guide-toggle-icon {
		font-size: 13px;
		line-height: 1;
	}

	/* ── HMA LAYOUT & SOCRATES GUIDE ── */
	.hma-container {
		display: block;
		transition: all 0.2s ease;
	}

	.hma-container.with-guide {
		display: grid;
		grid-template-columns: 1fr 240px;
		gap: 20px;
		align-items: start;
	}

	.hma-editor-area {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.hma-textarea {
		min-height: 200px;
		line-height: 1.6;
	}

	.socrates-guide-box {
		background: #ffffff;
		border: 1px solid #bfdbfe;
		border-radius: var(--radius-md);
		padding: 14px;
		box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
		animation: fadeIn 0.2s ease-out;
	}

	.socrates-guide-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid #edf2f7;
	}

	.socrates-badge {
		font-family: "IBM Plex Mono", monospace;
		font-size: 10.5px;
		font-weight: 800;
		background: var(--tab-sub);
		color: #ffffff;
		padding: 2px 6px;
		border-radius: 4px;
		letter-spacing: 0.04em;
	}

	.socrates-title {
		font-size: 12px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.socrates-desc {
		font-size: 11.5px;
		color: #64748b;
		margin: 0 0 10px;
		line-height: 1.35;
	}

	.socrates-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.socrates-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 6px;
		border-radius: 4px;
		background: #f8fafc;
		border: 1px solid #f1f5f9;
		transition: background 0.15s ease;
	}

	.socrates-item:hover {
		background: var(--tab-sub-bg);
		border-color: #dbeafe;
	}

	.socrates-letter {
		width: 18px;
		height: 18px;
		border-radius: 4px;
		background: #e2e8f0;
		color: #1e293b;
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.socrates-item:hover .socrates-letter {
		background: var(--tab-sub);
		color: #ffffff;
	}

	.socrates-info {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}

	.socrates-info strong {
		font-size: 11.5px;
		color: #0f172a;
	}

	.socrates-info span {
		font-size: 10px;
		color: #64748b;
	}

	/* ── QUEIXAS SECUNDÁRIAS (HMA) ── */
	.queixas-secundarias-container {
		margin-top: 24px;
		padding-top: 18px;
		border-top: 1.5px dashed #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.queixas-secundarias-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.queixas-secundarias-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.queixas-secundarias-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13.5px;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.btn-add-queixa-secundaria {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 600;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-queixa-secundaria:hover {
		background: #dcfce7;
		border-color: #86efac;
		color: #166534;
		box-shadow: 0 2px 4px rgba(22, 101, 52, 0.1);
	}

	.queixas-secundarias-empty {
		background: #f8fafc;
		border: 1px dashed #cbd5e1;
		border-radius: var(--radius-sm);
		padding: 14px 16px;
		color: #64748b;
		font-size: 12px;
		line-height: 1.4;
		text-align: center;
	}

	.queixas-secundarias-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.queixa-secundaria-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: var(--shadow-sm);
		transition: border-color 0.15s ease;
	}

	.queixa-secundaria-card:hover {
		border-color: #cbd5e1;
	}

	.queixa-secundaria-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid #f1f5f9;
	}

	.queixa-card-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.queixa-card-badge {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		background: #e0e7ff;
		color: #4338ca;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.queixa-card-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13px;
		font-weight: 700;
		color: #334155;
	}

	.btn-remove-queixa {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 8px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		font-family: "Inter", sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-remove-queixa:hover {
		background: #fee2e2;
		border-color: #fca5a5;
		color: #b91c1c;
	}

	.queixa-secundaria-fields {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	/* ── HISTÓRIA GINECOLÓGICA (HG) STYLES ── */
	.gender-pill {
		font-size: 11px;
		font-weight: 700;
		color: #db2777;
		background: #fdf2f8;
		border: 1px solid #fbcfe8;
		padding: 2px 8px;
		border-radius: 9999px;
		margin-left: 6px;
		letter-spacing: 0.02em;
	}

	/* GPNCAE Box */
	.gpncae-wrapper {
		background: #fafbfc;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 16px;
	}

	.gpncae-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.gpncae-label {
		font-size: 12.5px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.gpncae-badge {
		font-family: "IBM Plex Mono", monospace;
		font-size: 12px;
		font-weight: 700;
		color: #db2777;
		background: #fdf2f8;
		border: 1px solid #fbcfe8;
		padding: 2px 8px;
		border-radius: 6px;
		letter-spacing: 0.05em;
	}

	.gpncae-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 10px;
	}

	.gpncae-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 8px 4px 10px;
		transition: all 0.15s ease;
	}

	.gpncae-cell:hover,
	.gpncae-cell:focus-within {
		border-color: #f472b6;
		box-shadow: 0 2px 8px rgba(219, 39, 119, 0.08);
	}

	.gpncae-letter {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #fdf2f8;
		color: #db2777;
		border: 1.5px solid #fbcfe8;
		font-family: "IBM Plex Mono", monospace;
		font-size: 12px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 4px;
	}

	.gpncae-desc {
		font-size: 10px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: 6px;
	}

	.gpncae-input {
		width: 48px;
		height: 36px;
		text-align: center;
		font-family: "IBM Plex Mono", monospace;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #f8fafc;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.gpncae-input:focus {
		outline: none;
		border-color: #db2777;
		background: #ffffff;
		box-shadow: 0 0 0 3px rgba(219, 39, 119, 0.12);
	}

	/* DUM with auto-calc tag */
	.input-with-calc {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.calc-tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		font-weight: 600;
		color: #0f766e;
		background: #f0fdfa;
		border: 1px solid #ccfbf1;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		width: fit-content;
		animation: fadeIn 0.2s ease-out;
	}

	/* ── HISTÓRIA PATOLÓGICA PREGRESSA (HPP) STYLES ── */
	.hpp-antecedentes-box {
		background: #fafbfc;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 16px;
	}

	.hpp-box-title {
		font-size: 12.5px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 12px;
	}

	/* Meds in Use Wrapper */
	.meds-box-wrapper {
		margin-top: 20px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		background: #ffffff;
		overflow: hidden;
	}

	.meds-box-header {
		padding: 14px 18px;
		background: #f8fafc;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.meds-box-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.meds-icon {
		font-size: 20px;
	}

	.meds-box-title {
		font-size: 13.5px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.meds-box-subtitle {
		font-size: 11.5px;
		color: #64748b;
		display: block;
	}

	.btn-add-med {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		border: 1px solid #bfdbfe;
		background: #eff6ff;
		color: var(--tab-sub);
		font-family: "Inter", sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-med:hover {
		background: var(--tab-sub);
		color: #ffffff;
		border-color: var(--tab-sub);
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
	}

	/* Empty State */
	.meds-empty-state {
		padding: 36px 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
	}

	.meds-empty-icon {
		font-size: 32px;
		margin-bottom: 8px;
		opacity: 0.7;
	}

	.meds-empty-state h4 {
		font-size: 14px;
		font-weight: 600;
		color: #334155;
		margin: 0 0 4px;
	}

	.meds-empty-state p {
		font-size: 12.5px;
		color: #64748b;
		margin: 0;
		max-width: 440px;
		line-height: 1.4;
	}

	/* Grouped Meds List */
	.meds-groups-list {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.med-class-group {
		background: #f8fafc;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
	}

	.med-class-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
		padding-bottom: 6px;
		border-bottom: 1px dashed #cbd5e1;
	}

	.med-class-tag {
		font-size: 12px;
		font-weight: 700;
		color: #1e293b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.med-class-tag::before {
		content: "";
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--tab-sub);
	}

	.med-class-count {
		font-size: 11px;
		font-weight: 600;
		color: #64748b;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		padding: 2px 7px;
		border-radius: 9999px;
	}

	.med-items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 10px;
	}

	.med-card-item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 10px 12px;
		gap: 8px;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.med-card-item:hover {
		border-color: #93c5fd;
		box-shadow: 0 2px 6px rgba(37, 99, 235, 0.06);
	}

	.med-card-main {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.med-card-name-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.med-name {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
	}

	.med-conc {
		font-size: 11.5px;
		font-weight: 700;
		color: var(--tab-sub);
		background: var(--tab-sub-bg);
		padding: 1px 6px;
		border-radius: 4px;
	}

	.med-card-details {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.med-forma {
		font-size: 11.5px;
		color: #64748b;
	}

	.med-pos-pill {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11.5px;
		font-weight: 700;
		color: #0369a1;
		background: #e0f2fe;
		border: 1px solid #bae6fd;
		padding: 1px 7px;
		border-radius: 4px;
	}

	.med-card-obs {
		font-size: 11px;
		color: #64748b;
		margin-top: 2px;
	}

	.btn-remove-med {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid #fee2e2;
		background: #fff5f5;
		color: #ef4444;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.btn-remove-med:hover {
		background: #ef4444;
		color: #ffffff;
		border-color: #ef4444;
	}

	/* ── HISTÓRIA FAMILIAR (HF) STYLES ── */
	.hf-table-wrapper {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.hf-table-header {
		display: grid;
		grid-template-columns: 260px 1fr 44px;
		background: #f8fafc;
		border-bottom: 1px solid var(--border-color);
		padding: 10px 16px;
		gap: 16px;
	}

	.hf-col-title {
		font-size: 11.5px;
		font-weight: 700;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.hf-table-body {
		display: flex;
		flex-direction: column;
	}

	.hf-row {
		display: grid;
		grid-template-columns: 260px 1fr 44px;
		padding: 14px 16px;
		gap: 16px;
		align-items: start;
		border-bottom: 1px solid #f1f5f9;
		transition: background 0.12s ease;
	}

	.hf-row:hover {
		background: #fafbfc;
	}

	.hf-row:last-child {
		border-bottom: none;
	}

	.cell-doenca {
		display: flex;
		flex-direction: column;
	}

	.hf-doenca-input {
		font-weight: 600;
	}

	.cell-parentes {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.parentes-chips-list {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip-parente-btn {
		padding: 4px 10px;
		border-radius: 9999px;
		border: 1px solid #cbd5e1;
		background: #f8fafc;
		color: #334155;
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.chip-parente-btn:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		color: var(--tab-sub);
	}

	.chip-parente-btn.selected {
		background: var(--tab-sub);
		color: #ffffff;
		border-color: var(--tab-sub);
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
	}

	.hf-outro-input {
		max-width: 320px;
	}

	.cell-acoes {
		display: flex;
		justify-content: flex-end;
		padding-top: 5px;
	}

	.btn-remove-hf {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid #fee2e2;
		background: #fff5f5;
		color: #ef4444;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-remove-hf:hover {
		background: #ef4444;
		color: #ffffff;
		border-color: #ef4444;
	}

	.hf-table-footer {
		padding: 10px 16px;
		background: #fafbfc;
		border-top: 1px solid var(--border-color);
	}

	.btn-add-hf-row {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px dashed #93c5fd;
		background: #eff6ff;
		color: var(--tab-sub);
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-hf-row:hover {
		background: #dbeafe;
		border-color: var(--tab-sub);
	}

	/* ── HÁBITOS DE VIDA (HV) STYLES ── */
	.hv-blocks-container {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.hv-card-sub {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color 0.15s ease;
	}

	.hv-card-sub:hover {
		border-color: #cbd5e1;
	}

	.hv-card-sub-header {
		padding: 12px 16px;
		background: #f8fafc;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.hv-card-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.hv-sub-icon {
		font-size: 18px;
	}

	.hv-sub-title {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.hv-sub-desc {
		font-size: 11px;
		color: #64748b;
		display: block;
	}

	.hv-tag-badge {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11.5px;
		font-weight: 700;
		color: #0369a1;
		background: #e0f2fe;
		border: 1px solid #bae6fd;
		padding: 2px 8px;
		border-radius: 9999px;
	}

	.hv-card-sub-body {
		padding: 16px;
	}

	/* Status Options Row (Radio Pills) */
	.status-options-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.status-radio-card {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: #f8fafc;
		font-size: 12.5px;
		font-weight: 500;
		color: #334155;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
		text-align: center;
	}

	.status-radio-card:hover {
		background: #eff6ff;
		border-color: #bfdbfe;
		color: var(--tab-sub);
	}

	.status-radio-card.checked {
		background: var(--tab-sub);
		border-color: var(--tab-sub);
		color: #ffffff;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
	}

	.status-radio-card input[type="radio"] {
		display: none;
	}

	/* Sub-fields grid */
	.sub-fields-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 14px;
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px dashed #e2e8f0;
		align-items: end;
	}

	.sub-fields-grid.single-col {
		grid-template-columns: 1fr;
	}

	.calc-box-display {
		height: 38px;
		padding: 7px 12px;
		border: 1px solid #bfdbfe;
		border-radius: var(--radius-sm);
		background: var(--tab-sub-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.calc-box-display strong {
		font-family: "IBM Plex Mono", monospace;
		font-size: 13px;
		color: var(--tab-sub);
	}

	.muted-calc {
		font-size: 11px;
		color: #94a3b8;
	}

	.fag-btn-group {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.btn-fagerstrom {
		height: 38px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 0 14px;
		border-radius: var(--radius-sm);
		border: 1px solid #fca5a5;
		background: #fff5f5;
		color: #dc2626;
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		box-sizing: border-box;
	}

	.btn-fagerstrom:hover {
		background: #dc2626;
		color: #ffffff;
		border-color: #dc2626;
	}

	.fag-score-tag {
		margin-top: 10px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		color: #b91c1c;
		width: fit-content;
	}

	/* Recordatório Alimentar Grid */
	.refeicoes-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.refeicao-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.refeicao-item.span-2-ref {
		grid-column: 1 / -1;
	}

	.refeicao-label {
		font-size: 12px;
		font-weight: 600;
		color: #334155;
	}

	/* ── EXAMES DE IMAGEM E FUNCIONAIS (OBJETIVO) ── */
	.exames-box-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		background: #f8fafc;
		border-bottom: 1px solid var(--border-color);
		gap: 12px;
	}

	.exames-box-title-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.exames-icon {
		font-size: 22px;
	}

	.exames-box-title {
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.exames-box-subtitle {
		font-size: 12px;
		color: #64748b;
		display: block;
	}

	.btn-add-exame {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		border: 1px solid #a7f3d0;
		background: #ecfdf5;
		color: var(--tab-obj);
		font-family: "Inter", sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-exame:hover {
		background: var(--tab-obj);
		color: #ffffff;
		border-color: var(--tab-obj);
		box-shadow: 0 2px 6px rgba(5, 150, 105, 0.2);
	}

	.exames-empty-state {
		padding: 36px 20px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
	}

	.exames-empty-icon {
		font-size: 32px;
		margin-bottom: 8px;
	}

	.exames-empty-state h4 {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0 0 4px;
	}

	.exames-empty-state p {
		font-size: 12.5px;
		color: var(--text-muted);
		max-width: 480px;
		margin: 0;
		line-height: 1.4;
	}

	.exames-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
	}

	.exame-card-item {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		box-shadow: var(--shadow-sm);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.exame-card-item:hover {
		border-color: #cbd5e1;
		box-shadow: var(--shadow-md);
	}

	.exame-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.exame-card-main-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.exame-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
	}

	.exame-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.exame-date-tag {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		color: #059669;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		padding: 1px 7px;
		border-radius: 4px;
	}

	.exame-medico-tag {
		font-size: 11.5px;
		color: #475569;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		padding: 1px 7px;
		border-radius: 4px;
	}

	.exame-card-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.btn-action-exame {
		height: 28px;
		border-radius: 6px;
		cursor: pointer;
		font-family: "Inter", sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 0 8px;
		transition: all 0.15s ease;
	}

	.btn-edit-exame {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
	}

	.btn-edit-exame:hover {
		background: #2563eb;
		color: #ffffff;
		border-color: #2563eb;
	}

	.btn-delete-exame {
		width: 28px;
		padding: 0;
		background: #fff5f5;
		color: #ef4444;
		border: 1px solid #fee2e2;
	}

	.btn-delete-exame:hover {
		background: #ef4444;
		color: #ffffff;
		border-color: #ef4444;
	}

	.exame-laudo-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 10px 12px;
	}

	.exame-laudo-header {
		display: block;
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: 4px;
	}

	.exame-laudo-text {
		font-size: 13px;
		color: #1e293b;
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
	}

	/* ── SINAIS VITAIS (OBJETIVO) ── */
	.vitals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 14px;
	}

	.vital-card {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}

	.vital-card:hover {
		border-color: #cbd5e1;
		box-shadow: var(--shadow-md);
	}

	.vital-card.pa-card {
		grid-column: span 2;
	}

	.vital-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.vital-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.vital-icon {
		font-size: 20px;
	}

	.vital-card-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13.5px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.vital-card-subtitle {
		font-size: 11px;
		color: #64748b;
		display: block;
	}

	.vital-eval-badge {
		font-size: 11px;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		white-space: nowrap;
	}

	.vital-eval-badge.success {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}

	.vital-eval-badge.warning {
		background: #fffbeb;
		color: #b45309;
		border: 1px solid #fde68a;
	}

	.vital-eval-badge.danger {
		background: #fff1f2;
		color: #e11d48;
		border: 1px solid #fecdd3;
	}

	.vital-eval-badge.critical {
		background: #881337;
		color: #ffffff;
	}

	.vital-eval-badge.info {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
	}

	.vital-inputs-row {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}

	.pa-divider {
		font-size: 18px;
		font-weight: 700;
		color: #94a3b8;
		margin-bottom: 6px;
	}

	.vital-input-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.vital-micro-label {
		font-size: 11px;
		font-weight: 600;
		color: #475569;
	}

	.vital-input-wrap {
		display: flex;
		align-items: center;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		overflow: hidden;
		transition: all 0.15s ease;
	}

	.vital-input-wrap:focus-within {
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
	}

	.vital-input {
		height: 36px;
		width: 100%;
		border: none;
		padding: 0 10px;
		font-family: "IBM Plex Mono", monospace;
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
		box-sizing: border-box;
		background: transparent;
	}

	.vital-input:focus {
		outline: none;
	}

	.vital-unit {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11.5px;
		font-weight: 600;
		color: #64748b;
		padding-right: 10px;
		background: transparent;
		white-space: nowrap;
	}

	.vital-extra-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: -2px;
	}

	.pam-tag {
		font-size: 11.5px;
		color: #475569;
		background: #f1f5f9;
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
	}

	.pam-tag strong {
		color: #0f172a;
		font-family: "IBM Plex Mono", monospace;
	}

	@media (max-width: 768px) {
		.vital-card.pa-card {
			grid-column: span 1;
		}
	}

	/* ── ANTROPOMETRIA (OBJETIVO) ── */
	.antropo-main-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1.5fr;
		gap: 14px;
		margin-bottom: 14px;
	}

	.antropo-card {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}

	.antropo-card:hover {
		border-color: #cbd5e1;
		box-shadow: var(--shadow-md);
	}

	.antropo-card.imc-card {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.antropo-card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
	}

	.antropo-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.antropo-icon {
		font-size: 20px;
	}

	.antropo-card-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13.5px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.antropo-card-subtitle {
		font-size: 11px;
		color: #64748b;
		display: block;
	}

	.antropo-input-wrap {
		display: flex;
		align-items: center;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		overflow: hidden;
		transition: all 0.15s ease;
	}

	.antropo-input-wrap:focus-within {
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
	}

	.antropo-input-wrap.small {
		height: 32px;
	}

	.antropo-input {
		height: 36px;
		width: 100%;
		border: none;
		padding: 0 10px;
		font-family: "IBM Plex Mono", monospace;
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
		box-sizing: border-box;
		background: transparent;
	}

	.antropo-input-wrap.small .antropo-input {
		height: 32px;
		font-size: 12.5px;
	}

	.antropo-input:focus {
		outline: none;
	}

	.antropo-unit {
		font-family: "IBM Plex Mono", monospace;
		font-size: 11.5px;
		font-weight: 600;
		color: #64748b;
		padding-right: 10px;
		background: transparent;
		white-space: nowrap;
	}

	.antropo-imc-input-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.imc-input-wrap {
		flex: 1;
		background: #ffffff;
	}

	.imc-input {
		color: #0369a1;
		font-size: 15px;
	}

	.btn-recalc-imc {
		padding: 6px 10px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #475569;
		font-family: "Inter", sans-serif;
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.btn-recalc-imc:hover {
		background: #f1f5f9;
		color: #0f172a;
		border-color: #94a3b8;
	}

	.imc-custom-hint {
		font-size: 10.5px;
		color: #b45309;
		background: #fffbeb;
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid #fde68a;
		display: block;
		margin-top: 2px;
	}

	.antropo-secondary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 14px;
	}

	.antropo-sub-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.antropo-sub-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
	}

	.antropo-sub-label {
		font-size: 11.5px;
		font-weight: 700;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.antropo-obs-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.antropo-obs-input {
		height: 38px;
		padding: 6px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		font-family: "Inter", sans-serif;
		font-size: 12.5px;
		color: #0f172a;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.antropo-obs-input:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
	}

	@media (max-width: 860px) {
		.antropo-main-grid {
			grid-template-columns: 1fr;
		}
		.antropo-secondary-grid {
			grid-template-columns: 1fr;
		}
	}

	/* ── EXAME GINECOLÓGICO (OBJETIVO - ) ── */
	.gyn-block {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		margin-bottom: 16px;
		box-shadow: var(--shadow-sm);
	}

	.gyn-block:last-child {
		margin-bottom: 0;
	}

	.gyn-block-header {
		padding: 12px 16px;
		background: #fdf2f8;
		border-bottom: 1px solid #fbcfe8;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.gyn-block-icon {
		font-size: 20px;
	}

	.gyn-block-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 14px;
		font-weight: 700;
		color: #9d174d;
		margin: 0 0 2px;
	}

	.gyn-block-subtitle {
		font-size: 11.5px;
		color: #be185d;
		display: block;
	}

	.gyn-block-body {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		background: #fafbfc;
	}

	.gyn-subcard {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.gyn-subcard-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.gyn-subcard-header.with-action {
		justify-content: space-between;
	}

	.gyn-subcard-title-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.gyn-subcard-num {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fce7f3;
		color: #db2777;
		font-family: "IBM Plex Mono", monospace;
		font-size: 11px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gyn-subcard-title {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13px;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.gyn-static-options-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 10px;
	}

	.gyn-choice-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.gyn-choice-label {
		font-size: 11px;
		font-weight: 700;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.gyn-pills-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.gyn-pill-btn {
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #334155;
		font-family: "Inter", sans-serif;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.gyn-pill-btn:hover {
		background: #fdf2f8;
		border-color: #f472b6;
		color: #be185d;
	}

	.gyn-pill-btn.selected {
		background: #db2777;
		color: #ffffff;
		border-color: #db2777;
		font-weight: 600;
		box-shadow: 0 2px 5px rgba(219, 39, 119, 0.25);
	}

	.gyn-checkbox-wrap {
		display: flex;
		align-items: center;
		padding: 6px 0;
	}

	.gyn-checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12.5px;
		font-weight: 600;
		color: #1e293b;
		cursor: pointer;
	}

	.gyn-checkbox {
		width: 16px;
		height: 16px;
		accent-color: #db2777;
		cursor: pointer;
	}

	.gyn-radio-row {
		display: flex;
		align-items: center;
		gap: 18px;
		padding: 4px 0;
		flex-wrap: wrap;
	}

	.gyn-radio-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
	}

	.gyn-radio-label input[type="radio"] {
		accent-color: #db2777;
		cursor: pointer;
	}

	.gyn-input-text {
		height: 34px;
		width: 100%;
		padding: 4px 10px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		font-family: "Inter", sans-serif;
		font-size: 12.5px;
		color: #0f172a;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.gyn-input-text:focus {
		outline: none;
		border-color: #db2777;
		box-shadow: 0 0 0 2px rgba(219, 39, 119, 0.15);
	}

	.gyn-subcard-full {
		width: 100%;
		box-sizing: border-box;
	}

	.gyn-textarea-wrap {
		width: 100%;
	}

	.gyn-textarea-wrap.full-width {
		width: 100%;
	}

	.gyn-textarea-wrap textarea,
	.gyn-textarea-expanded {
		width: 100%;
		min-height: 85px;
		box-sizing: border-box;
	}

	/* ── EXAME FÍSICO POR APARELHOS (OBJETIVO) ── */
	.aparelhos-controls-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 14px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-sm);
		margin-bottom: 14px;
		flex-wrap: wrap;
	}

	.aparelhos-hint-text {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
	}

	.aparelhos-buttons-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.btn-aparelho-toggle-all {
		padding: 4px 10px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #334155;
		font-family: "Inter", sans-serif;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-aparelho-toggle-all:hover {
		background: #f1f5f9;
		color: #0f172a;
		border-color: #94a3b8;
	}

	.aparelhos-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.aparelho-accordion-card {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: all 0.15s ease;
	}

	.aparelho-accordion-card:hover {
		border-color: #cbd5e1;
		box-shadow: var(--shadow-md);
	}

	.aparelho-accordion-card.is-collapsed {
		background: #ffffff;
	}

	.aparelho-accordion-header {
		padding: 12px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		cursor: pointer;
		background: #ffffff;
		transition: background 0.15s ease;
		user-select: none;
	}

	.aparelho-accordion-header:hover {
		background: #f8fafc;
	}

	.aparelho-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
		min-width: 0;
	}

	.aparelho-letter {
		width: 22px;
		height: 22px;
		border-radius: 6px;
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
		font-family: "IBM Plex Mono", monospace;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		text-transform: lowercase;
		flex-shrink: 0;
	}

	.aparelho-title-text {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 13.5px;
		font-weight: 700;
		color: #0f172a;
		display: inline-block;
		margin-right: 6px;
	}

	.aparelho-header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.aparelho-status-tag {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 4px;
		white-space: nowrap;
	}

	.aparelho-status-tag.filled {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}

	.aparelho-status-tag.empty {
		background: #f1f5f9;
		color: #64748b;
		border: 1px solid #e2e8f0;
	}

	.aparelho-chevron {
		width: 18px;
		height: 18px;
		color: #94a3b8;
		transition: transform 0.2s ease;
	}

	.aparelho-chevron.rotated {
		transform: rotate(180deg);
		color: #059669;
	}

	.aparelho-accordion-body {
		padding: 0 16px 14px 16px;
		border-top: 1px solid #f1f5f9;
		background: #fafbfc;
		padding-top: 12px;
	}

	/* ── Placeholder Card ── */
	.placeholder-card {
		background: var(--bg-surface);
		border: 1.5px dashed #cbd5e1;
		border-radius: var(--radius-lg);
		padding: 48px 24px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.placeholder-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}

	.obj-icon {
		background: var(--tab-obj-bg);
		color: var(--tab-obj);
	}
	.aval-icon {
		background: var(--tab-aval-bg);
		color: var(--tab-aval);
	}
	.plan-icon {
		background: var(--tab-plan-bg);
		color: var(--tab-plan);
	}

	.placeholder-card h3 {
		font-family: "Plus Jakarta Sans", sans-serif;
		font-size: 16px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0 0 6px;
	}

	.placeholder-card p {
		font-size: 13px;
		color: var(--text-muted);
		max-width: 500px;
		margin: 0;
		line-height: 1.5;
	}

	/* Animations */
	.fade-in {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 860px) {
		.layout-body {
			grid-template-columns: 1fr;
		}

		.sidebar-nav {
			display: none;
		}

		.main-content {
			padding: 20px 16px 48px;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.hma-container {
			grid-template-columns: 1fr;
		}

		.gpncae-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.hf-table-header {
			display: none;
		}

		.hf-row {
			grid-template-columns: 1fr;
			gap: 10px;
		}

		.status-options-row {
			grid-template-columns: 1fr;
		}

		.refeicoes-grid {
			grid-template-columns: 1fr;
		}
	}

	.prontuario-footer {
		margin-top: 40px;
		padding: 20px 0 10px;
		border-top: 1px solid var(--border-color, #e2e8f0);
	}

	.prontuario-footer-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #64748b;
		flex-wrap: wrap;
		gap: 10px;
	}

	.footer-privacy-link {
		color: #0284c7;
		font-weight: 600;
		text-decoration: none;
	}

	.footer-privacy-link:hover {
		text-decoration: underline;
	}

	/* ═══ TOPBAR ACTION BUTTONS ═══ */
	.btn-topbar-action {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-surface);
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-topbar-action:hover {
		background: #f1f5f9;
		color: var(--text-main);
		border-color: #cbd5e1;
	}

	.btn-clear {
		color: #dc2626;
		border-color: #fca5a5;
	}

	.btn-clear:hover {
		background: #fef2f2;
		color: #b91c1c;
		border-color: #f87171;
	}

	.btn-copy-soap {
		background: linear-gradient(135deg, #0d9488, #0f766e);
		color: #fff;
		border-color: #0d9488;
	}

	.btn-copy-soap:hover {
		background: linear-gradient(135deg, #14b8a6, #0d9488);
		box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
		color: #fff;
	}

	.btn-pdf {
		color: #0284c7;
		border-color: #bae6fd;
		background: #f0f9ff;
	}

	.btn-pdf:hover {
		background: #e0f2fe;
		color: #0369a1;
		border-color: #7dd3fc;
	}


	/* ═══ ESCORES CLÍNICOS GRID ═══ */
	.escores-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 10px;
		margin-top: 12px;
	}

	.escore-card {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		background: var(--bg-surface);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--text-main);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.escore-card:hover {
		border-color: var(--escore-color, #d97706);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		transform: translateY(-1px);
	}

	.escore-card-icon {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--escore-color, #d97706) 12%, transparent);
		color: var(--escore-color, #d97706);
		flex-shrink: 0;
	}

	.escore-card-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
		flex: 1;
	}

	.escore-nome {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 13px;
		font-weight: 700;
		color: var(--text-main);
	}

	.escore-desc {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.escore-arrow {
		color: var(--text-subtle);
		flex-shrink: 0;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.escore-card:hover .escore-arrow {
		opacity: 1;
		color: var(--escore-color, #d97706);
	}

	/* ═══ AVALIAÇÃO LAYOUT (Editor + Queixas Sidebar) ═══ */
	.avaliacao-layout {
		display: grid;
		grid-template-columns: 1fr 280px;
		gap: 20px;
		margin-top: 12px;
	}

	.avaliacao-editor {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.avaliacao-textarea {
		min-height: 300px;
		resize: vertical;
	}

	.queixas-sidebar {
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
		border: 1px solid #fde68a;
		border-radius: var(--radius-md);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		position: sticky;
		top: 80px;
		align-self: start;
	}

	.queixas-sidebar-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 13px;
		font-weight: 700;
		color: #92400e;
		padding-bottom: 8px;
		border-bottom: 1px solid rgba(146, 64, 14, 0.15);
	}

	.queixa-label-sidebar {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #b45309;
	}

	.queixa-text-sidebar {
		font-size: 13px;
		color: #78350f;
		line-height: 1.5;
		margin: 4px 0 0;
	}

	.queixa-empty {
		font-style: italic;
		color: #a3785e;
		opacity: 0.7;
	}

	.queixa-divider {
		height: 1px;
		background: rgba(146, 64, 14, 0.12);
		margin: 4px 0;
	}

	.queixa-item-sidebar.queixa-sec {
		display: flex;
		gap: 6px;
		align-items: baseline;
		margin-top: 4px;
	}

	.queixa-sec-bullet {
		color: #b45309;
		font-weight: 700;
		flex-shrink: 0;
	}

	/* ═══ PLANO — PRESCRIÇÃO STYLES ═══ */
	.plan-meds-wrapper {
		border-color: #c4b5fd;
	}

	.plan-med-icon {
		color: var(--tab-plan);
	}

	.plan-empty-icon {
		background: var(--tab-plan-bg) !important;
		color: var(--tab-plan) !important;
	}

	.btn-add-presc {
		background: linear-gradient(135deg, var(--tab-plan) 0%, #6d28d9 100%) !important;
	}

	.btn-add-presc:hover {
		background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%) !important;
	}

	.presc-tag {
		background: #ede9fe !important;
		color: #6d28d9 !important;
	}

	.presc-card {
		border-left-color: var(--tab-plan) !important;
	}

	.presc-pos {
		background: #ede9fe !important;
		color: #6d28d9 !important;
	}

	/* ═══ SECTION ACCENTS ═══ */
	.aval-accent {
		background: var(--tab-aval-bg);
		color: var(--tab-aval);
	}

	.plan-accent {
		background: var(--tab-plan-bg);
		color: var(--tab-plan);
	}

	/* ═══ CONDUTA TEXTAREA ═══ */
	.conduta-textarea {
		min-height: 220px;
		resize: vertical;
	}

	/* ═══ RESPONSIVE — Avaliação Layout ═══ */
	@media (max-width: 860px) {
		.avaliacao-layout {
			grid-template-columns: 1fr;
		}

		.queixas-sidebar {
			position: static;
		}

		.escores-grid {
			grid-template-columns: 1fr;
		}

		.btn-topbar-action span {
			display: none;
		}

		.btn-topbar-action {
			padding: 5px 8px;
		}
	}

	/* ═══ TOAST NOTIFICATION ═══ */
	.toast {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%) translateY(20px);
		background: #0f766e;
		color: #fff;
		padding: 10px 20px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 1000;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		opacity: 0;
		transition:
			opacity 0.3s,
			transform 0.3s;
		pointer-events: none;
	}

	.toast.visible {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	/* ═══ COMPACT PRINT LAYOUT (PDF) ═══ */
	:global(#print-view) {
		display: none;
	}

	@media print {
		:global(body > *:not(#print-view)) {
			display: none !important;
		}

		:global(#print-view) {
			display: block !important;
			font-family:
				"Inter",
				-apple-system,
				BlinkMacSystemFont,
				"Segoe UI",
				Roboto,
				sans-serif !important;
			font-size: 10px !important;
			line-height: 1.35 !important;
			color: #0f172a !important;
			background: #ffffff !important;
			padding: 0 !important;
			margin: 0 !important;
		}

		:global(.print-container) {
			max-width: 100% !important;
			margin: 0 auto !important;
		}

		:global(.print-header) {
			border-bottom: 2px solid #0f766e !important;
			padding-bottom: 8px !important;
			margin-bottom: 10px !important;
		}

		:global(.print-header-top) {
			display: flex !important;
			justify-content: space-between !important;
			align-items: center !important;
			margin-bottom: 6px !important;
		}

		:global(.print-title) {
			font-size: 14px !important;
			font-weight: 800 !important;
			color: #0f766e !important;
			letter-spacing: 0.03em !important;
			text-transform: uppercase !important;
		}

		:global(.print-date) {
			font-size: 10px !important;
			color: #475569 !important;
		}

		:global(.print-patient-box) {
			background: #f8fafc !important;
			border: 1px solid #cbd5e1 !important;
			border-radius: 4px !important;
			padding: 6px 10px !important;
		}

		:global(.print-patient-grid) {
			display: grid !important;
			grid-template-columns: repeat(4, 1fr) !important;
			gap: 4px 10px !important;
			font-size: 9.5px !important;
		}

		:global(.print-cell) {
			color: #1e293b !important;
		}

		:global(.print-cell strong) {
			color: #475569 !important;
			font-weight: 600 !important;
		}

		:global(.print-cell-full) {
			grid-column: 1 / -1 !important;
		}

		:global(.print-block-title) {
			font-size: 10.5px !important;
			font-weight: 800 !important;
			text-transform: uppercase !important;
			color: #0f766e !important;
			background: #f0fdfa !important;
			border-left: 3px solid #0f766e !important;
			padding: 3px 6px !important;
			margin-top: 10px !important;
			margin-bottom: 4px !important;
			letter-spacing: 0.04em !important;
			break-after: avoid !important;
		}

		:global(.print-section) {
			border: 1px solid #e2e8f0 !important;
			border-radius: 4px !important;
			margin-bottom: 6px !important;
			break-inside: avoid !important;
			background: #ffffff !important;
		}

		:global(.print-section-header) {
			display: flex !important;
			align-items: center !important;
			gap: 6px !important;
			background: #f8fafc !important;
			border-bottom: 1px solid #e2e8f0 !important;
			padding: 3px 8px !important;
		}

		:global(.print-tag) {
			font-size: 8px !important;
			font-weight: 700 !important;
			background: #e2e8f0 !important;
			color: #334155 !important;
			padding: 1px 4px !important;
			border-radius: 2px !important;
			font-family: "IBM Plex Mono", monospace !important;
		}

		:global(.print-section-title) {
			font-size: 9.5px !important;
			font-weight: 700 !important;
			color: #0f172a !important;
		}

		:global(.print-section-body) {
			padding: 6px 8px !important;
			display: flex !important;
			flex-wrap: wrap !important;
			gap: 3px 12px !important;
		}

		:global(.print-field) {
			font-size: 9.5px !important;
			flex: 1 1 200px !important;
			min-width: 140px !important;
			line-height: 1.35 !important;
			margin-bottom: 2px !important;
		}

		:global(.print-field-full) {
			flex: 1 1 100% !important;
			width: 100% !important;
		}

		:global(.print-field-label) {
			font-weight: 600 !important;
			color: #475569 !important;
			margin-right: 4px !important;
		}

		:global(.print-field-val) {
			color: #0f172a !important;
		}

		:global(.print-field-block) {
			margin-top: 2px !important;
			padding-left: 6px !important;
			border-left: 2px solid #cbd5e1 !important;
			white-space: pre-wrap !important;
			color: #1e293b !important;
		}

		:global(.print-table) {
			width: 100% !important;
			border-collapse: collapse !important;
			font-size: 9px !important;
			margin-top: 4px !important;
			margin-bottom: 6px !important;
		}

		:global(.print-table th) {
			background: #f8fafc !important;
			border-bottom: 1.5px solid #cbd5e1 !important;
			padding: 4px 6px !important;
			text-align: left !important;
			font-weight: 700 !important;
			color: #334155 !important;
		}

		:global(.print-table td) {
			border-bottom: 1px solid #f1f5f9 !important;
			padding: 4px 6px !important;
			color: #1e293b !important;
		}

		:global(.print-exame-card) {
			border: 1px solid #cbd5e1 !important;
			border-radius: 4px !important;
			padding: 4px 8px !important;
			width: 100% !important;
			margin-bottom: 4px !important;
			background: #fafbfc !important;
		}

		:global(.print-exame-head) {
			display: flex !important;
			justify-content: space-between !important;
			font-size: 9.5px !important;
			margin-bottom: 2px !important;
		}

		:global(.print-exame-res) {
			font-size: 9px !important;
			color: #1e293b !important;
			white-space: pre-wrap !important;
		}

		:global(.print-signature-box) {
			margin-top: 24px !important;
			padding-top: 10px !important;
			text-align: center !important;
			break-inside: avoid !important;
			width: 260px !important;
			margin-left: auto !important;
			margin-right: auto !important;
		}

		:global(.print-sig-line) {
			border-top: 1px solid #0f172a !important;
			margin-bottom: 4px !important;
		}

		:global(.print-sig-name) {
			font-size: 10px !important;
			font-weight: 700 !important;
			color: #0f172a !important;
		}

		:global(.print-sig-details) {
			font-size: 9px !important;
			color: #64748b !important;
		}
	}
</style>
