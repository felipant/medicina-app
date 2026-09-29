<script lang="ts">
	import { onMount } from "svelte";
	import MedicamentoModal from "$lib/components/MedicamentoModal.svelte";
	import ExamesLaboratoriaisSection, {
		type ExameLancado,
	} from "$lib/components/ExamesLaboratoriaisSection.svelte";
	import { calculateAllZScores } from "$lib/utils/zscoreCalculator";

	// ── Reactive state ──
	let dataConsulta = $state("");
	let dataNascimento = $state("");
	let idadeCalculada = $state("");
	let sexo = $state("");
	let savedMilestones = $state(new Set<string>());
	let marcosModalOpen = $state(false);
	let marcosObs = $state("");
	let toastMessage = $state("");
	let toastVisible = $state(false);

	// Identificação do Paciente & Sticky Header
	let nomeCrianca = $state("");
	let nomeResponsavel = $state("");
	let naturalidade = $state("");
	let scrolledPastHeader = $state(false);
	let pageHeaderEl: HTMLElement | null = $state(null);

	// Anamnese 01 - QP / HDA / Queixas secundárias
	let queixaPrincipal = $state("");
	let hdaPrincipal = $state("");
	interface QueixaSecundaria {
		id: number;
		queixa: string;
		evolucao: string;
	}
	let secondaryComplaints = $state<QueixaSecundaria[]>([]);
	let nextComplaintId = $state(2);

	// Idade gestacional & Nascimento
	let igSemanas = $state("");
	let igDias = $state("");
	let pesoAoNascer = $state("");

	// Anthropometry & BMI state
	let inputPeso = $state("");
	let inputAltura = $state("");
	let inputImc = $state("");
	let inputPc = $state("");
	let imcManual = $state(false);

	// Z-Scores state
	let zScorePeso = $state("");
	let zScoreEstatura = $state("");
	let zScoreImc = $state("");
	let zScorePc = $state("");

	// Section collapse state
	let collapsedSections = $state(new Set<string>());

	// Exames laboratoriais
	let examesLaboratoriais = $state<ExameLancado[]>([]);
	let dataColetaPadraoLab = $state("");

	// Exames de imagem/funcionais
	interface ExameImagem {
		id: number;
		nome: string;
		data: string;
		medico: string;
		resultado: string;
	}
	let examesImagem = $state<ExameImagem[]>([]);
	let nextExameId = $state(1);

	// Medication search values
	let medGestacao = $state("");
	let medUsoContinuo = $state("");
	let medPrescricao = $state("");

	// HDA summary visibility in Avaliação
	let hdaSummaryVisible = $state(false);

	// ── Default consultation date ──
	onMount(() => {
		const today = new Date();
		const yyyy = today.getFullYear();
		const mm = String(today.getMonth() + 1).padStart(2, "0");
		const dd = String(today.getDate()).padStart(2, "0");
		dataConsulta = `${yyyy}-${mm}-${dd}`;
		loadFormState();
	});

	// ── Auto-calculate age ──
	let idadeEmMeses = $derived.by(() => {
		if (!dataNascimento) return null;
		const nasc = new Date(dataNascimento + "T00:00:00");
		const ref = dataConsulta
			? new Date(dataConsulta + "T00:00:00")
			: new Date();
		if (nasc > ref) return null;
		return (
			(ref.getFullYear() - nasc.getFullYear()) * 12 +
			(ref.getMonth() - nasc.getMonth()) +
			(ref.getDate() >= nasc.getDate() ? 0 : -1)
		);
	});

	$effect(() => {
		if (!dataNascimento) {
			idadeCalculada = "";
			return;
		}
		const nasc = new Date(dataNascimento + "T00:00:00");
		const ref = dataConsulta
			? new Date(dataConsulta + "T00:00:00")
			: new Date();
		if (nasc > ref) {
			idadeCalculada = "Data inválida";
			return;
		}
		let anos = ref.getFullYear() - nasc.getFullYear();
		let meses = ref.getMonth() - nasc.getMonth();
		let dias = ref.getDate() - nasc.getDate();
		if (dias < 0) {
			meses--;
			const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
			dias += prevMonth.getDate();
		}
		if (meses < 0) {
			anos--;
			meses += 12;
		}
		const parts: string[] = [];
		if (anos > 0) parts.push(anos + (anos === 1 ? " ano" : " anos"));
		if (meses > 0) parts.push(meses + (meses === 1 ? " mês" : " meses"));
		if (dias > 0 || parts.length === 0)
			parts.push(dias + (dias === 1 ? " dia" : " dias"));
		idadeCalculada = parts.join(", ");
	});

	// ── Auto-calculate corrected age for pre-term infants (< 37 weeks) ──
	let infoIdadeCorrigida = $derived.by(() => {
		if (
			!dataNascimento ||
			igSemanas === "" ||
			igSemanas === null ||
			igSemanas === undefined
		)
			return null;
		const sem = parseInt(String(igSemanas), 10);
		const dias = parseInt(String(igDias || "0"), 10) || 0;
		if (isNaN(sem) || sem <= 0) return null;

		if (sem >= 37) {
			return {
				isPretermo: false,
				dnCorrigida: "",
				texto: "A termo (não requer correção: ≥ 37 semanas)",
				idadeCorrigidaCurta: "",
			};
		}

		// Pré-termo: data corrigida = data de nascimento + dias faltantes até 40 semanas
		const totalDiasIG = sem * 7 + dias;
		const diasAte40 = 40 * 7 - totalDiasIG; // 280 - totalDiasIG

		const nasc = new Date(dataNascimento + "T00:00:00");
		if (isNaN(nasc.getTime())) return null;

		const dataCorrigida = new Date(
			nasc.getTime() + diasAte40 * 24 * 60 * 60 * 1000,
		);
		const yyyy = dataCorrigida.getFullYear();
		const mm = String(dataCorrigida.getMonth() + 1).padStart(2, "0");
		const dd = String(dataCorrigida.getDate()).padStart(2, "0");
		const dnCorrigidaFmt = `${dd}/${mm}/${yyyy}`;

		const ref = dataConsulta
			? new Date(dataConsulta + "T00:00:00")
			: new Date();

		if (ref < dataCorrigida) {
			// Ainda não atingiu o termo de 40 semanas
			const diasVida = Math.max(
				0,
				Math.floor(
					(ref.getTime() - nasc.getTime()) / (1000 * 60 * 60 * 24),
				),
			);
			const igAtualDias = totalDiasIG + diasVida;
			const semAtual = Math.floor(igAtualDias / 7);
			const diasAtual = igAtualDias % 7;
			const texto = `${semAtual}s${diasAtual}d pós-menstrual (termo previsto: ${dnCorrigidaFmt})`;
			return {
				isPretermo: true,
				dnCorrigida: dnCorrigidaFmt,
				texto,
				idadeCorrigidaCurta: `${semAtual}s${diasAtual}d pós-menstrual`,
			};
		}

		let anos = ref.getFullYear() - dataCorrigida.getFullYear();
		let meses = ref.getMonth() - dataCorrigida.getMonth();
		let d = ref.getDate() - dataCorrigida.getDate();
		if (d < 0) {
			meses--;
			const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
			d += prevMonth.getDate();
		}
		if (meses < 0) {
			anos--;
			meses += 12;
		}
		const parts: string[] = [];
		if (anos > 0) parts.push(anos + (anos === 1 ? " ano" : " anos"));
		if (meses > 0) parts.push(meses + (meses === 1 ? " mês" : " meses"));
		if (d > 0 || parts.length === 0)
			parts.push(d + (d === 1 ? " dia" : " dias"));
		const idadeCorrigidaStr = parts.join(", ");

		return {
			isPretermo: true,
			dnCorrigida: dnCorrigidaFmt,
			texto: `${idadeCorrigidaStr} (DN Corrigida: ${dnCorrigidaFmt})`,
			idadeCorrigidaCurta: idadeCorrigidaStr,
		};
	});

	// ── Classificação da Idade Gestacional ──
	let classificacaoIG = $derived.by(() => {
		if (igSemanas === "" || igSemanas === null || igSemanas === undefined)
			return null;
		const s = parseInt(String(igSemanas), 10);
		const d = parseInt(String(igDias || "0"), 10) || 0;
		if (isNaN(s) || s <= 0) return null;

		if (s < 28) {
			return {
				label: "Pré-termo extremo (< 28 semanas)",
				tipo: "danger",
			};
		} else if (s >= 28 && s <= 31) {
			return {
				label: "Muito pré-termo (28 a 31 semanas e 6 dias)",
				tipo: "warning",
			};
		} else if (s >= 32 && s <= 33) {
			return {
				label: "Pré-termo moderado (32 a 33 semanas e 6 dias)",
				tipo: "warning",
			};
		} else if (s >= 34 && s <= 36) {
			return {
				label: "Pré-termo tardio (34 a 36 semanas e 6 dias)",
				tipo: "warning",
			};
		} else if (s >= 37 && s <= 38) {
			return {
				label: "Termo precoce (37 a 38 semanas e 6 dias)",
				tipo: "info",
			};
		} else if (s >= 39 && s <= 40) {
			return {
				label: "Termo pleno / a termo (39 a 40 semanas e 6 dias)",
				tipo: "success",
			};
		} else if (s === 41) {
			return {
				label: "Termo tardio (41 a 41 semanas e 6 dias)",
				tipo: "info",
			};
		} else {
			return { label: "Pós-termo (≥ 42 semanas)", tipo: "warning" };
		}
	});

	// ── Classificação do Peso ao Nascer ──
	let classificacaoPN = $derived.by(() => {
		if (
			pesoAoNascer === "" ||
			pesoAoNascer === null ||
			pesoAoNascer === undefined
		)
			return null;
		const p = parseFloat(String(pesoAoNascer));
		if (isNaN(p) || p <= 0) return null;

		if (p < 1000) {
			return {
				label: "Extremo baixo peso (< 1.000 g)",
				tipo: "danger",
			};
		} else if (p < 1500) {
			return {
				label: "Muito baixo peso (1.000 g a 1.499 g)",
				tipo: "danger",
			};
		} else if (p < 2500) {
			return {
				label: "Baixo peso (1.500 g a 2.499 g)",
				tipo: "warning",
			};
		} else if (p < 4000) {
			return {
				label: "Peso adequado / normal (2.500 g a 3.999 g)",
				tipo: "success",
			};
		} else {
			return {
				label: "Macrossômico / Peso elevado (≥ 4.000 g)",
				tipo: "warning",
			};
		}
	});

	// ── Formatação de IG para exportação (ex: 39s1d ou 39s) ──
	let igExportString = $derived.by(() => {
		if (igSemanas === "" || igSemanas === null || igSemanas === undefined)
			return "";
		const s = parseInt(String(igSemanas), 10);
		if (isNaN(s) || s <= 0) return "";
		const d = parseInt(String(igDias || ""), 10);
		if (!isNaN(d) && d > 0) {
			return `${s}s${d}d`;
		}
		return `${s}s`;
	});

	// ── BMI auto-calculation ──
	$effect(() => {
		if (imcManual) return;
		const peso = parseFloat(inputPeso);
		const altura = parseFloat(inputAltura);
		if (!isNaN(peso) && !isNaN(altura) && altura > 0) {
			const alturaMetros = altura / 100;
			inputImc = (peso / (alturaMetros * alturaMetros)).toFixed(2);
		} else {
			inputImc = "";
		}
	});

	// ── Auto-calculate WHO Z-Scores (Peso, Estatura, IMC, Perímetro Cefálico) ──
	$effect(() => {
		if (dataNascimento && (sexo === "M" || sexo === "F")) {
			const res = calculateAllZScores({
				sexo,
				dataNascimento,
				dataConsulta,
				pesoKg: inputPeso,
				alturaCm: inputAltura,
				pcCm: inputPc,
				imc: inputImc,
			});
			if (res) {
				zScorePeso = res.zPeso;
				zScoreEstatura = res.zEstatura;
				zScoreImc = res.zImc;
				zScorePc = res.zPc;
			}
		}
	});

	function handleImcInput(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.value === "") {
			imcManual = false;
		} else {
			imcManual = true;
		}
	}

	// ── Toggle section ──
	function toggleSection(id: string) {
		if (collapsedSections.has(id)) {
			collapsedSections.delete(id);
		} else {
			collapsedSections.add(id);
		}
		collapsedSections = new Set(collapsedSections);
	}

	// ── Secondary complaints ──
	function addSecondaryComplaint() {
		secondaryComplaints = [
			...secondaryComplaints,
			{ id: nextComplaintId, queixa: "", evolucao: "" },
		];
		nextComplaintId++;
	}

	function removeSecondaryComplaint(id: number) {
		secondaryComplaints = secondaryComplaints.filter((c) => c.id !== id);
	}

	// ── Exames de imagem ──
	function addExameImagem() {
		examesImagem = [
			...examesImagem,
			{ id: nextExameId, nome: "", data: "", medico: "", resultado: "" },
		];
		nextExameId++;
	}

	function removeExameImagem(id: number) {
		examesImagem = examesImagem.filter((e) => e.id !== id);
	}

	// ── Diagnosis quick fill ──
	function fillDx(elementId: string, text: string) {
		const el = document.getElementById(elementId) as HTMLTextAreaElement;
		if (el) {
			el.value = text;
			el.dispatchEvent(new Event("input", { bubbles: true }));
		}
	}

	// ── Milestones ──
	const MARCOS = [
		{
			nome: "Postura: pernas e braços fletidos, cabeça lateralizada",
			desc: "Deite a criança de costas; observe se braços e pernas ficam flexionados e cabeça lateralizada.",
			minMeses: 0,
			maxMeses: 1,
		},
		{
			nome: "Observa um rosto",
			desc: "Posicione seu rosto a ~30 cm acima do rosto da criança e observe se ela olha para você.",
			minMeses: 0,
			maxMeses: 1,
		},
		{
			nome: "Reage ao som",
			desc: "Bata palmas ou balance chocalho a ~30 cm de cada orelha; observe reação com olhos ou expressão facial.",
			minMeses: 0,
			maxMeses: 1,
		},
		{
			nome: "Eleva a cabeça",
			desc: "De bruços, observe se levanta a cabeça desencostando o queixo da superfície.",
			minMeses: 1,
			maxMeses: 2,
		},
		{
			nome: "Sorri quando estimulada",
			desc: "Sorria e converse com a criança sem tocar sua face. Observe se responde com sorriso.",
			minMeses: 1,
			maxMeses: 2,
		},
		{
			nome: "Abre as mãos",
			desc: "Observe se em alguns momentos a criança abre as mãos espontaneamente.",
			minMeses: 2,
			maxMeses: 3,
		},
		{
			nome: "Emite sons",
			desc: "Observe se emite algum som que não seja choro. Pergunte ao acompanhante se faz em casa.",
			minMeses: 2,
			maxMeses: 4,
		},
		{
			nome: "Movimenta os membros",
			desc: "Observe se movimenta ativamente os membros superiores e inferiores.",
			minMeses: 2,
			maxMeses: 4,
		},
		{
			nome: "Responde ativamente ao contato social",
			desc: "Converse com o bebê; observe se responde com sorriso e emissão de sons.",
			minMeses: 3,
			maxMeses: 4,
		},
		{
			nome: "Segura objetos",
			desc: "Ofereça objeto tocando no dorso da mão; criança deve abrir e segurar por alguns segundos.",
			minMeses: 3,
			maxMeses: 5,
		},
		{
			nome: "Emite sons, ri alto",
			desc: "Converse com a criança; observe se emite sons (gugu, eeee) e ri emitindo sons (gargalhada).",
			minMeses: 4,
			maxMeses: 5,
		},
		{
			nome: "Levanta a cabeça e apoia-se nos antebraços, de bruços",
			desc: "De bruços, chame atenção à frente; observe se levanta cabeça apoiando-se nos antebraços.",
			minMeses: 4,
			maxMeses: 5,
		},
		{
			nome: "Busca ativa de objetos",
			desc: "Coloque objeto ao alcance; observe se tenta alcançá-lo.",
			minMeses: 4,
			maxMeses: 6,
		},
		{
			nome: "Leva objetos à boca",
			desc: "Ofereça objeto na mão e observe se o leva à boca.",
			minMeses: 4,
			maxMeses: 6,
		},
		{
			nome: "Localiza o som",
			desc: "Faça barulho suave próximo à orelha; observe se vira a cabeça em direção ao som.",
			minMeses: 5,
			maxMeses: 6,
		},
		{
			nome: "Muda de posição (rola)",
			desc: "De barriga para cima, incentive a virar para a posição de bruços.",
			minMeses: 5,
			maxMeses: 6,
		},
		{
			nome: "Brinca de esconde-achou",
			desc: "Brinque de aparecer e desaparecer atrás de pano; observe se procura quando desaparece.",
			minMeses: 6,
			maxMeses: 9,
		},
		{
			nome: "Transfere objetos de uma mão para outra",
			desc: "Ofereça objeto e observe se transfere de uma mão para outra.",
			minMeses: 6,
			maxMeses: 9,
		},
		{
			nome: "Duplica sílabas",
			desc: 'Observe se fala "papá", "dadá", "mamã". Pergunte à mãe se faz em casa.',
			minMeses: 7,
			maxMeses: 9,
		},
		{
			nome: "Senta-se sem apoio",
			desc: "Coloque sentada em superfície firme; observe se fica sentada sem apoio das mãos.",
			minMeses: 7,
			maxMeses: 9,
		},
		{
			nome: "Imita gestos",
			desc: "Faça gesto como bater palmas ou dar tchau; observe se imita.",
			minMeses: 9,
			maxMeses: 12,
		},
		{
			nome: "Faz pinça",
			desc: "Coloque objeto pequeno próximo; observe se pega com movimento de pinça (polegar + indicador).",
			minMeses: 9,
			maxMeses: 12,
		},
		{
			nome: 'Produz "jargão"',
			desc: "Observe se produz conversação incompreensível consigo mesma ou com outros.",
			minMeses: 9,
			maxMeses: 12,
		},
		{
			nome: "Anda com apoio",
			desc: "Observe se dá alguns passos com apoio.",
			minMeses: 9,
			maxMeses: 12,
		},
		{
			nome: "Mostra o que quer",
			desc: "Indica o que quer sem choro: apontando, estendendo a mão ou usando palavras/sons.",
			minMeses: 11,
			maxMeses: 14,
		},
		{
			nome: "Coloca blocos na caneca",
			desc: "Estimule a colocar blocos dentro da caneca; observe se coloca pelo menos um e solta.",
			minMeses: 11,
			maxMeses: 14,
		},
		{
			nome: "Diz uma palavra",
			desc: "Observe se diz pelo menos uma palavra (exceto nomes de família ou animais de estimação).",
			minMeses: 12,
			maxMeses: 15,
		},
		{
			nome: "Anda sem apoio",
			desc: "Observe se anda com bom equilíbrio, sem se apoiar.",
			minMeses: 12,
			maxMeses: 15,
		},
		{
			nome: "Usa colher ou garfo",
			desc: "Usa colher ou garfo derramando pouco fora da boca.",
			minMeses: 13,
			maxMeses: 18,
		},
		{
			nome: "Constrói torre de 2 cubos",
			desc: "Observe se coloca um cubo sobre o outro sem cair ao retirar a mão.",
			minMeses: 14,
			maxMeses: 18,
		},
		{
			nome: "Fala 3 palavras",
			desc: "Observe se diz três palavras (exceto nomes de família ou animais de estimação).",
			minMeses: 14,
			maxMeses: 18,
		},
		{
			nome: "Anda para trás",
			desc: "Peça para abrir porta/gaveta; observe se dá dois passos para trás sem cair.",
			minMeses: 16,
			maxMeses: 18,
		},
		{
			nome: "Tira roupa",
			desc: "Observe se é capaz de remover alguma peça de roupa (sapatos, casacos, calças, camisetas).",
			minMeses: 18,
			maxMeses: 24,
		},
		{
			nome: "Constrói torre de 3 cubos",
			desc: "Observe se empilha três cubos sem que caiam ao retirar a mão.",
			minMeses: 18,
			maxMeses: 24,
		},
		{
			nome: "Aponta 2 figuras",
			desc: "Observe se aponta duas de um grupo de cinco figuras.",
			minMeses: 18,
			maxMeses: 24,
		},
		{
			nome: "Chuta bola",
			desc: "Observe se chuta a bola sem apoiar-se em objetos.",
			minMeses: 18,
			maxMeses: 24,
		},
		{
			nome: "Veste-se com supervisão",
			desc: "Pergunte se é capaz de vestir alguma peça de roupa (calcinha, cueca, meias, sapatos, casaco).",
			minMeses: 24,
			maxMeses: 30,
		},
		{
			nome: "Constrói torre de 6 cubos",
			desc: "Observe se empilha seis cubos sem que caiam ao retirar a mão.",
			minMeses: 24,
			maxMeses: 30,
		},
		{
			nome: "Frases com 2 palavras",
			desc: 'Observe se combina duas palavras formando frase com significado ("quer água", "chuta bola").',
			minMeses: 24,
			maxMeses: 30,
		},
		{
			nome: "Pula com ambos os pés",
			desc: "Observe se pula com os dois pés atingindo o chão ao mesmo tempo.",
			minMeses: 24,
			maxMeses: 30,
		},
		{
			nome: "Brinca de fazer de conta com outras crianças",
			desc: "Pergunte se participa de brincadeiras de fazer de conta (casinha, escola) em contexto familiar e escolar.",
			minMeses: 30,
			maxMeses: 36,
		},
		{
			nome: "Imita o desenho de uma linha",
			desc: "Após demonstração, observe se faz uma linha de pelo menos 5 cm.",
			minMeses: 30,
			maxMeses: 36,
		},
		{
			nome: "Reconhece 2 ações",
			desc: 'Observe se aponta figura de acordo com ação ("quem mia?", "quem late?").',
			minMeses: 30,
			maxMeses: 36,
		},
		{
			nome: "Arremessa bola",
			desc: "Observe se arremessa a bola acima do braço.",
			minMeses: 30,
			maxMeses: 36,
		},
		{
			nome: "Veste uma camiseta",
			desc: "Pergunte se é capaz de vestir camiseta e/ou casaco sem botão ou zíper, sem ajuda.",
			minMeses: 36,
			maxMeses: 42,
		},
		{
			nome: "Move o polegar com a mão fechada",
			desc: 'Demonstre e observe se move o polegar em sinal de "OK" com uma ou ambas as mãos.',
			minMeses: 36,
			maxMeses: 42,
		},
		{
			nome: "Compreende 2 adjetivos",
			desc: 'Pergunte: "O que faz quando está com fome/frio/cansado?" — verifique respostas coerentes.',
			minMeses: 36,
			maxMeses: 42,
		},
		{
			nome: "Equilibra-se em cada pé 1 segundo",
			desc: "Após demonstração, verifique se fica em um pé só pelo menos 1 segundo. Repita com o outro.",
			minMeses: 36,
			maxMeses: 42,
		},
		{
			nome: "Emparelha cores",
			desc: "Observe se emparelha objetos da mesma cor (ex.: cubos).",
			minMeses: 42,
			maxMeses: 48,
		},
		{
			nome: "Copia círculos",
			desc: "Mostre figura de círculo; verifique se desenha forma fechada ou quase fechada.",
			minMeses: 42,
			maxMeses: 48,
		},
		{
			nome: "Fala clara e compreensível",
			desc: "Observe a inteligibilidade da fala (articulação e verbalização de ideias em sequência).",
			minMeses: 42,
			maxMeses: 48,
		},
		{
			nome: "Pula em um pé só",
			desc: "Demonstre e verifique se pula em um pé só, duas ou mais vezes, sem apoio.",
			minMeses: 42,
			maxMeses: 48,
		},
		{
			nome: "Veste-se sem ajuda",
			desc: "Pergunte se é capaz de se vestir sem alguma ajuda.",
			minMeses: 48,
			maxMeses: 54,
		},
		{
			nome: "Copia cruz",
			desc: "Mostre figura de cruz; verifique se desenha duas linhas que se cruzem próximo ao ponto médio.",
			minMeses: 48,
			maxMeses: 54,
		},
		{
			nome: "Compreende 4 preposições",
			desc: "Peça para colocar bloco em cima, embaixo, na frente e atrás. Observe se cumpre os 4 comandos.",
			minMeses: 48,
			maxMeses: 54,
		},
		{
			nome: "Equilibra-se em cada pé 3 segundos",
			desc: "Verifique se fica em um pé só por 3 segundos ou mais.",
			minMeses: 48,
			maxMeses: 54,
		},
		{
			nome: "Escova dentes sem ajuda",
			desc: "Pergunte se escova os dentes sem ajuda, inclusive pasta, dentes posteriores e fio dental.",
			minMeses: 54,
			maxMeses: 60,
		},
		{
			nome: "Aponta a linha mais comprida",
			desc: "Mostre ficha com duas linhas paralelas verticais; verifique se aponta a mais comprida (3/3 ou 5/6).",
			minMeses: 54,
			maxMeses: 60,
		},
		{
			nome: "Define 5 palavras",
			desc: 'Pergunte "O que é uma bola?" etc. Deve definir 5 de 7 palavras (uso, forma, material, categoria).',
			minMeses: 54,
			maxMeses: 60,
		},
		{
			nome: "Equilibra-se em um pé 5 segundos",
			desc: "Verifique se fica em um pé só por 5 segundos ou mais.",
			minMeses: 54,
			maxMeses: 60,
		},
		{
			nome: "Brinca de fazer de conta com outras crianças",
			desc: "Pergunte se participa de brincadeiras de fazer de conta (casinha, escola) em contexto familiar e escolar.",
			minMeses: 60,
			maxMeses: 66,
		},
		{
			nome: "Desenha pessoa com 6 partes",
			desc: "Peça para desenhar uma pessoa. Partes em pares contam como uma. Deve ter 6 partes.",
			minMeses: 60,
			maxMeses: 66,
		},
		{
			nome: "Faz analogia",
			desc: 'Pergunte: "Se o cavalo é grande, o rato é…" etc. Deve completar 2 de 3 frases.',
			minMeses: 60,
			maxMeses: 66,
		},
		{
			nome: "Marcha ponta-calcanhar",
			desc: "Demonstre andar em linha reta encostando ponta no calcanhar. Deve dar 4+ passos.",
			minMeses: 60,
			maxMeses: 66,
		},
		{
			nome: "Aceita e segue regras nos jogos de mesa",
			desc: "Pergunte se é capaz de aceitar e seguir regras dos jogos de mesa.",
			minMeses: 66,
			maxMeses: 72,
		},
		{
			nome: "Copia um quadrado",
			desc: "Mostre desenho de quadrado e peça para copiar. Se não conseguir, demonstre desenhando lados opostos.",
			minMeses: 66,
			maxMeses: 72,
		},
		{
			nome: "Define 7 palavras",
			desc: 'Procedimento semelhante a "Define 5 palavras". Agora deve definir 7 palavras.',
			minMeses: 66,
			maxMeses: 72,
		},
		{
			nome: "Equilibra-se em cada pé por 7 segundos",
			desc: "Verifique se fica em um pé só por 7 segundos ou mais.",
			minMeses: 66,
			maxMeses: 72,
		},
	];

	const FAIXAS = [
		{ label: "Nascimento a 6 meses", min: 0, max: 6 },
		{ label: "6 meses a 1 ano e meio", min: 6, max: 18 },
		{ label: "1 ano e meio a 3 anos e meio", min: 18, max: 42 },
		{ label: "3 anos e meio a 5 anos", min: 42, max: 60 },
		{ label: "5 a 6 anos", min: 60, max: 72 },
	];

	let relevantFaixas = $derived.by(() => {
		if (idadeEmMeses === null) return [];
		let faixas = FAIXAS.filter(
			(f) => idadeEmMeses! >= f.min - 3 && idadeEmMeses! < f.max + 6,
		);
		if (faixas.length === 0) {
			faixas =
				idadeEmMeses! < 0 ? [FAIXAS[0]] : [FAIXAS[FAIXAS.length - 1]];
		}
		return faixas;
	});

	let ageBadgeText = $derived.by(() => {
		if (idadeEmMeses === null) return "—";
		const anos = Math.floor(idadeEmMeses / 12);
		const mResto = idadeEmMeses % 12;
		let ageStr = "";
		if (anos > 0) ageStr += anos + (anos === 1 ? " ano" : " anos");
		if (mResto > 0)
			ageStr +=
				(ageStr ? " e " : "") +
				mResto +
				(mResto === 1 ? " mês" : " meses");
		if (!ageStr) ageStr = "Recém-nascido";
		return ageStr;
	});

	function toggleMilestone(key: string, checked: boolean) {
		if (checked) {
			savedMilestones.add(key);
		} else {
			savedMilestones.delete(key);
		}
		savedMilestones = new Set(savedMilestones);
		debouncedSave();
	}

	// ── IntersectionObserver for nav highlighting & Sticky Patient Header ──
	let activeSection = $state("anamnese");
	onMount(() => {
		const anchors = ["anamnese", "exame", "avaliacao", "conduta"];
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						activeSection = e.target.id;
					}
				});
			},
			{ rootMargin: "-52px 0px -80% 0px", threshold: 0 },
		);
		anchors.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});

		let headerObserver: IntersectionObserver | null = null;
		const checkHeaderVisibility = () => {
			const el = pageHeaderEl || document.querySelector(".page-header");
			if (el) {
				const rect = el.getBoundingClientRect();
				scrolledPastHeader = rect.bottom < 56;
			}
		};

		const el = pageHeaderEl || document.querySelector(".page-header");
		if (el) {
			headerObserver = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						scrolledPastHeader = !entry.isIntersecting;
					}
				},
				{ rootMargin: "-56px 0px 0px 0px", threshold: 0 },
			);
			headerObserver.observe(el);
		}

		window.addEventListener("scroll", checkHeaderVisibility, {
			passive: true,
		});

		return () => {
			observer.disconnect();
			if (headerObserver) headerObserver.disconnect();
			window.removeEventListener("scroll", checkHeaderVisibility);
		};
	});

	// ── Toast notification ──
	function showToast(msg: string) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 2500);
	}

	// ── Auto-save debounce ──
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	function debouncedSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveFormState(), 500);
	}

	function saveFormState() {
		const data: any = {
			textValues: [],
			checkboxValues: [],
			radioValues: [],
			imcManual,
			checkedMilestones: Array.from(savedMilestones),
			nomeCrianca,
			nomeResponsavel,
			naturalidade,
			queixaPrincipal,
			hdaPrincipal,
			secondaryComplaints,
			nextComplaintId,
			igSemanas,
			igDias,
			pesoAoNascer,
			medGestacao,
			medUsoContinuo,
			medPrescricao,
			marcosObs,
			examesLaboratoriais,
			dataColetaPadraoLab,
			examesImagem,
			nextExameId,
			sexo,
			inputPeso,
			inputAltura,
			inputImc,
			inputPc,
			zScorePeso,
			zScoreEstatura,
			zScoreImc,
			zScorePc,
			dataConsulta,
			dataNascimento,
		};

		const textElements = document.querySelectorAll(
			'input:not([type="checkbox"]):not([type="radio"]):not(.med-search-input):not(#marcosModal *), select:not(#marcosModal *), textarea:not(#marcosModal *):not(.med-search-input)',
		);
		textElements.forEach((el, index) => {
			data.textValues.push({
				index,
				val: (el as HTMLInputElement).value,
			});
		});

		const checkboxElements = document.querySelectorAll(
			'input[type="checkbox"]:not(#marcosModal *)',
		);
		checkboxElements.forEach((el, index) => {
			data.checkboxValues.push({
				index,
				checked: (el as HTMLInputElement).checked,
			});
		});

		const radioElements = document.querySelectorAll(
			'input[type="radio"]:not(#marcosModal *)',
		);
		radioElements.forEach((el, index) => {
			data.radioValues.push({
				index,
				checked: (el as HTMLInputElement).checked,
			});
		});

		localStorage.setItem("emr_ped_state", JSON.stringify(data));
	}

	function loadFormState() {
		const raw = localStorage.getItem("emr_ped_state");
		if (!raw) return;
		try {
			const data = JSON.parse(raw);
			if (data.dataConsulta) dataConsulta = data.dataConsulta;
			if (data.dataNascimento) dataNascimento = data.dataNascimento;
			if (data.nomeCrianca !== undefined) nomeCrianca = data.nomeCrianca;
			if (data.nomeResponsavel !== undefined)
				nomeResponsavel = data.nomeResponsavel;
			if (data.naturalidade !== undefined)
				naturalidade = data.naturalidade;
			if (data.sexo) sexo = data.sexo;
			if (data.igSemanas !== undefined) igSemanas = data.igSemanas;
			if (data.igDias !== undefined) igDias = data.igDias;
			if (data.pesoAoNascer !== undefined)
				pesoAoNascer = data.pesoAoNascer;
			if (data.inputPeso) inputPeso = data.inputPeso;
			if (data.inputAltura) inputAltura = data.inputAltura;
			if (data.inputImc) inputImc = data.inputImc;
			if (data.inputPc) inputPc = data.inputPc;
			if (data.zScorePeso) zScorePeso = data.zScorePeso;
			if (data.zScoreEstatura) zScoreEstatura = data.zScoreEstatura;
			if (data.zScoreImc) zScoreImc = data.zScoreImc;
			if (data.zScorePc) zScorePc = data.zScorePc;
			if (data.imcManual !== undefined) imcManual = data.imcManual;
			if (data.queixaPrincipal !== undefined)
				queixaPrincipal = data.queixaPrincipal;
			if (data.hdaPrincipal !== undefined)
				hdaPrincipal = data.hdaPrincipal;
			if (data.secondaryComplaints)
				secondaryComplaints = data.secondaryComplaints;
			if (data.nextComplaintId) nextComplaintId = data.nextComplaintId;
			if (data.checkedMilestones)
				savedMilestones = new Set(data.checkedMilestones);
			if (data.medGestacao) medGestacao = data.medGestacao;
			if (data.medUsoContinuo) medUsoContinuo = data.medUsoContinuo;
			if (data.medPrescricao) medPrescricao = data.medPrescricao;
			if (data.marcosObs) marcosObs = data.marcosObs;
			if (data.examesLaboratoriais)
				examesLaboratoriais = data.examesLaboratoriais;
			if (data.dataColetaPadraoLab)
				dataColetaPadraoLab = data.dataColetaPadraoLab;
			if (data.examesImagem) examesImagem = data.examesImagem;
			if (data.nextExameId) nextExameId = data.nextExameId;

			// Defer DOM restoration for unstructured elements
			setTimeout(() => {
				if (data.textValues) {
					const textElements = document.querySelectorAll(
						'input:not([type="checkbox"]):not([type="radio"]):not(.med-search-input):not(#marcosModal *), select:not(#marcosModal *), textarea:not(#marcosModal *):not(.med-search-input)',
					);
					data.textValues.forEach((item: any) => {
						if (textElements[item.index])
							(
								textElements[item.index] as HTMLInputElement
							).value = item.val;
					});
				}
				if (data.checkboxValues) {
					const checkboxElements = document.querySelectorAll(
						'input[type="checkbox"]:not(#marcosModal *)',
					);
					data.checkboxValues.forEach((item: any) => {
						if (checkboxElements[item.index])
							(
								checkboxElements[item.index] as HTMLInputElement
							).checked = item.checked;
					});
				}
				if (data.radioValues) {
					const radioElements = document.querySelectorAll(
						'input[type="radio"]:not(#marcosModal *)',
					);
					data.radioValues.forEach((item: any) => {
						if (radioElements[item.index])
							(
								radioElements[item.index] as HTMLInputElement
							).checked = item.checked;
					});
				}
			}, 50);
		} catch (e) {
			console.error("Error loading form state:", e);
		}
	}

	function resetForm() {
		if (
			!confirm(
				"Tem certeza de que deseja limpar todo o formulário? Todos os dados salvos serão apagados definitivamente.",
			)
		)
			return;
		localStorage.removeItem("emr_ped_state");
		imcManual = false;
		savedMilestones = new Set();
		nomeCrianca = "";
		nomeResponsavel = "";
		naturalidade = "";
		queixaPrincipal = "";
		hdaPrincipal = "";
		igSemanas = "";
		igDias = "";
		pesoAoNascer = "";
		medGestacao = "";
		medUsoContinuo = "";
		medPrescricao = "";
		marcosObs = "";
		examesLaboratoriais = [];
		dataColetaPadraoLab = "";
		examesImagem = [];
		nextExameId = 1;
		secondaryComplaints = [];
		nextComplaintId = 2;
		sexo = "";
		inputPeso = "";
		inputAltura = "";
		inputImc = "";
		inputPc = "";
		zScorePeso = "";
		zScoreEstatura = "";
		zScoreImc = "";
		zScorePc = "";

		const textElements = document.querySelectorAll(
			'input:not([type="checkbox"]):not([type="radio"]):not(.med-search-input):not(#marcosModal *), select:not(#marcosModal *), textarea:not(#marcosModal *):not(.med-search-input)',
		);
		textElements.forEach((el) => {
			const inp = el as HTMLInputElement;
			if (inp.id === "dataConsulta") {
				const today = new Date();
				inp.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
			} else {
				inp.value = "";
			}
		});

		document
			.querySelectorAll('input[type="checkbox"]:not(#marcosModal *)')
			.forEach((el) => ((el as HTMLInputElement).checked = false));
		document
			.querySelectorAll('input[type="radio"]:not(#marcosModal *)')
			.forEach((el) => ((el as HTMLInputElement).checked = false));
		dataNascimento = "";
		showToast("Formulário limpo");
	}

	// ── Helper to extract clean field value from DOM element ──
	function getCleanFieldValue(el: Element): string {
		let val = "";
		let inputs = el.querySelectorAll(
			'input:not([type="checkbox"]):not([type="radio"]):not(.med-search-input), textarea:not(.med-search-input), select',
		);
		if (inputs.length > 0) {
			let vals = Array.from(inputs)
				.map((inp) => {
					let v = (inp as HTMLInputElement).value?.trim();
					if (
						v &&
						inp.nextElementSibling &&
						inp.nextElementSibling.classList.contains("badge-unit")
					) {
						v += " " + inp.nextElementSibling.textContent!.trim();
					}
					return v;
				})
				.filter((v) => Boolean(v));
			if (vals.length > 0) val = vals.join(" ");
		}
		let radios = el.querySelectorAll('input[type="radio"]:checked');
		if (radios.length > 0) {
			let rVals = Array.from(radios).map((r) =>
				r.parentElement!.textContent!.trim(),
			);
			val += (val ? " — " : "") + rVals.join(", ");
		}
		let checks = el.querySelectorAll('input[type="checkbox"]:checked');
		if (checks.length > 0) {
			let cVals = Array.from(checks).map((c) =>
				c.parentElement!.textContent!.trim(),
			);
			val += (val ? " — " : "") + cVals.join(", ");
		}
		return val.trim();
	}

	// ── Helper to get all non-empty fields in a section (including .sub direct options) ──
	function extractSectionData(
		containerId: string,
	): Array<{ label: string; val: string }> {
		const container = document.getElementById(containerId);
		if (!container) return [];
		const result: Array<{ label: string; val: string }> = [];
		const processedInputs = new Set<Element>();

		function extractItem(item: Element) {
			const labelEl =
				item.querySelector("label") ||
				item.querySelector(".risk-group-title");
			const label = labelEl?.textContent?.trim().replace(/:$/, "") || "";
			let val = getCleanFieldValue(item);

			if (item.classList.contains("risk-group")) {
				const checked = item.querySelectorAll(
					'input[type="checkbox"]:checked',
				);
				if (checked.length > 0) {
					val = Array.from(checked)
						.map((c) => c.parentElement!.textContent!.trim())
						.join("; ");
				} else {
					val = "";
				}
			}

			if (val && label) {
				result.push({ label, val });
			}
			item.querySelectorAll("input, textarea, select").forEach((inp) => {
				processedInputs.add(inp);
			});
		}

		function extractSubDirect(subEl: Element) {
			const subTitleEl = subEl.querySelector(".sub-title");
			const subTitle =
				subTitleEl?.textContent?.trim().replace(/:$/, "") || "";

			// Collect all direct option containers (.option-row and .chips) that are NOT inside a .field
			const directGroups = Array.from(
				subEl.querySelectorAll(".option-row, .chips"),
			).filter((el) => !el.closest(".field"));

			const labelMap: Record<
				string,
				{ radios: string[]; checks: string[] }
			> = {};

			directGroups.forEach((group) => {
				let grpLabel = subTitle;
				const prevEl = group.previousElementSibling;
				if (prevEl && prevEl.classList.contains("option-label")) {
					grpLabel =
						prevEl.textContent?.trim().replace(/:$/, "") || subTitle;
				}

				if (!labelMap[grpLabel]) {
					labelMap[grpLabel] = { radios: [], checks: [] };
				}

				const radios = Array.from(
					group.querySelectorAll('input[type="radio"]:checked'),
				).filter((r) => !processedInputs.has(r));

				radios.forEach((r) => {
					processedInputs.add(r);
					const text = r.parentElement?.textContent?.trim();
					if (text) labelMap[grpLabel].radios.push(text);
				});

				const checks = Array.from(
					group.querySelectorAll('input[type="checkbox"]:checked'),
				).filter((c) => !processedInputs.has(c));

				checks.forEach((c) => {
					processedInputs.add(c);
					const text = c.parentElement?.textContent?.trim();
					if (text) labelMap[grpLabel].checks.push(text);
				});
			});

			for (const [grpLabel, data] of Object.entries(labelMap)) {
				const rVal = data.radios.join(", ");
				const cVal = data.checks.join(", ");
				let combinedVal = "";
				if (rVal && cVal) {
					combinedVal = `${rVal} (${cVal})`;
				} else {
					combinedVal = rVal || cVal;
				}
				if (grpLabel && combinedVal) {
					result.push({ label: grpLabel, val: combinedVal });
				}
			}
		}

		const subs = container.querySelectorAll(".sub");
		if (subs.length > 0) {
			subs.forEach((sub) => {
				extractSubDirect(sub);
				const childItems = sub.querySelectorAll(
					".field, .vital-card, .dx-block, .conduta-block, .risk-group",
				);
				childItems.forEach((item) => extractItem(item));
			});
		}

		const rootItems = container.querySelectorAll(
			".field, .vital-card, .dx-block, .conduta-block, .risk-group",
		);
		rootItems.forEach((item) => {
			if (!item.closest(".sub")) {
				extractItem(item);
			}
		});

		const otherChips = Array.from(
			container.querySelectorAll(".chips, .option-row"),
		).filter(
			(el) => !el.closest(".field") && !el.closest(".sub"),
		);
		otherChips.forEach((el) => {
			const checkedRadios = Array.from(
				el.querySelectorAll('input[type="radio"]:checked'),
			).filter((r) => !processedInputs.has(r));
			const checkedChecks = Array.from(
				el.querySelectorAll('input[type="checkbox"]:checked'),
			).filter((c) => !processedInputs.has(c));

			const rVal = checkedRadios
				.map((r) => r.parentElement?.textContent?.trim())
				.filter(Boolean)
				.join(", ");
			const cVal = checkedChecks
				.map((c) => c.parentElement?.textContent?.trim())
				.filter(Boolean)
				.join(", ");
			const val = [rVal, cVal].filter(Boolean).join(", ");

			if (val) {
				const prevLabelEl = el.previousElementSibling?.classList.contains(
					"option-label",
				)
					? el.previousElementSibling
					: el.parentElement?.querySelector(".option-label");
				const label =
					prevLabelEl?.textContent?.trim().replace(/:$/, "") || "Achados";
				result.push({ label, val });
				checkedRadios.forEach((r) => processedInputs.add(r));
				checkedChecks.forEach((c) => processedInputs.add(c));
			}
		});

		return result;
	}

	// ── Acronym mapping for ultra-compact PDF export and clinical summaries ──
	function getAcronymLabel(label: string): string {
		const clean = label.trim().replace(/:$/, "");
		const map: Record<string, string> = {
			"Queixa Principal": "QP",
			"História da Doença Atual (HDA)": "HDA",
			"História da Doença Atual": "HDA",
			"Frequência Cardíaca": "FC",
			"Frequência Respiratória": "FR",
			"Pressão Arterial": "PA",
			"Temperatura Axilar": "Tax",
			Temperatura: "Tax",
			"Saturação O2": "SpO2",
			"Perfusão Periférica": "TEC",
			"Perímetro Cefálico": "PC",
			"Peso atual": "P",
			Peso: "P",
			"Estatura / Comprimento": "Est",
			Estatura: "Est",
			Altura: "Est",
			"Índice de Massa Corporal (IMC)": "IMC",
			IMC: "IMC",
			"Escore Z (Estatura/Idade)": "Z-E/I",
			"Escore Z (Peso/Idade)": "Z-P/I",
			"Escore Z (IMC/Idade)": "Z-IMC/I",
			"Escore Z (PC/Idade)": "Z-PC/I",
			"Idade gestacional ao nascer (IG)": "IG",
			"Tipo de parto": "Parto",
			"Peso ao nascer": "PN",
			"Comprimento ao nascer": "CN",
			"Perímetro cefálico ao nascer": "PCN",
			Apgar: "Apgar",
			"Intercorrências neonatais": "Intercorr Neonat",
			"Triagem neonatal (testes de triagem)": "Testes Triagem",
			"Medicamentos na gestação": "Med Gestação",
			"Uso contínuo de medicamentos": "Med Contínuo",
			"Aleitamento materno": "AM",
			"Aleitamento materno exclusivo": "AME",
			"Fórmula infantil": "FI",
			"Introdução alimentar": "IA",
			"Calendário vacinal": "Vacinação",
			"Marcos atingidos": "Marcos DNPM",
			"Observações gerais sobre marcos do desenvolvimento": "Obs DNPM",
			"Antecedentes pessoais (patológicos/cirúrgicos)": "AP",
			"Alergias conhecidas": "Alergias",
			"Internações anteriores": "Internações",
			"Cirurgias prévias": "Cirurgias",
			"Antecedentes familiares (doenças crônicas, genéticas)": "AF",
			"Condições de moradia e saneamento": "Moradia/San",
			"Renda familiar / Benefícios": "Renda/Benef",
			"Animais de estimação / Tabagismo passivo": "Animais/Tabagismo",
			"Estado Geral": "EG",
			"Estado geral": "EG",
			"Fácies": "Fácies",
			"Se típica — descrever (dor, sindrômica, adenoideana, cushingóide, hipotireoidiana…)":
				"Fácies (desc)",
			"Atitude": "Atitude",
			"Se típica — especificar (ortopneica, opistótono, cócoras…)":
				"Atitude (espec)",
			"Estado Psíquico": "Psíquico",
			"Observações (TEA, TDAH, ansiedade, depressão…)": "Psíquico (obs)",
			"Coloração da Pele e Mucosas": "Pele/Mucosas",
			"Coloração da pele e mucosas": "Pele/Mucosas",
			"Grau de palidez (1+ a 4+)": "Palidez",
			"Grau de icterícia (1+ a 4+)": "Icterícia",
			"Zona de Kramer (RN)": "Zona Kramer",
			"Grau de Hidratação": "Hidratação",
			"Estado Nutricional": "Nutrição",
			"Pele, Anexos e Subcutâneo": "Pele/Anexos",
			"Lesões cutâneas / erupções": "Pele/Lesões",
			"Alterações vasculares": "Pele/Vasculares",
			"Unhas": "Unhas",
			"Cabelos": "Cabelos",
			"Edema / outros achados cutâneos": "Edema/Cutâneo",
			"Cadeias Avaliadas — Marcar as alteradas": "Cadeias alteradas",
			"Sinais de esforço respiratório": "Esforço resp",
			"Status Vacinal": "Status Vacinal",
			"Nível de consciência": "Consciência",
			Hidratação: "Hidratação",
			"Lesões de pele / Exantemas": "Pele/Lesões",
			"Linfonodos cervicais": "Linf Cerv",
			"Linfonodos axilares / inguinais": "Linf Axil/Ing",
			"Fontanela anterior": "Fontanela",
			"Olhos / Reflexo vermelho": "Olhos/Refl Verm",
			"Oroscopia / Faringe": "Oroscopia",
			"Otoscopia bilateral": "Otoscopia",
			"Pescoço / Tireoide": "Pescoço/Tir",
			"Inspeção e padrão respiratório": "Padrão Resp",
			"Ausculta pulmonar / Ruídos adventícios": "AP (Pulmão)",
			"Tiragens / Sinais de desconforto": "Tiragens",
			"Ictus cordis": "Ictus",
			"Ritmo e bulhas cardíacas": "BRNF",
			"Sopros cardíacos": "Sopros",
			"Pulsos periféricos": "Pulsos",
			"Inspeção e forma do abdome": "Abd Insp",
			"Ruídos hidroaéreos (RHA)": "RHA",
			"Palpação (fígado, baço, massas, dor)": "Abd Palp",
			"Sinais de irritação peritoneal": "Sinais Perit",
			"Genitália masculina": "Genit Masc",
			"Genitália feminina": "Genit Fem",
			"Região anal e perineal": "Ânus/Períneo",
			"Estadiamento puberal de Tanner": "Tanner",
			"Coluna e postura": "Coluna",
			"Membros e articulações / Deformidades": "Artic/Membros",
			"Manobras para quadril (Barlow / Ortolani)": "Barlow/Ortolani",
			Marcha: "Marcha",
			"Tônus muscular": "Tônus",
			"Reflexos primitivos": "Refl Primit",
			"Reflexos profundos (ROT)": "ROT",
			"Pares cranianos": "Pares Cran",
			"Hipótese Diagnóstica Principal": "HD Princ",
			"Diagnósticos Diferenciais": "Dx Dif",
			"Diagnóstico Nutricional": "Dx Nutri",
			"Diagnóstico do DNPM": "Dx DNPM",
			"Diagnóstico Vacinal": "Dx Vac",
			"Fatores de Risco / Vulnerabilidade": "Riscos",
			"Exames complementares solicitados (laboratoriais e/ou de imagem)":
				"Exames Solicitados",
			"Pareceres / Encaminhamentos especializados": "Encaminhamentos",
			"Prescrição — Tratamento Farmacológico": "Rx (Farmacol)",
			"Tratamento Não Farmacológico": "Não Farmacol",
			"Orientações ao responsável": "Orientações",
			"Retorno / seguimento": "Retorno",
			Sono: "Sono",
			Diurese: "Diurese",
			Evacuações: "Evacuações",
			"Atividade física": "Ativ Física",
			"Tempo de tela": "Tempo Tela",
			"Exposição solar": "Exp Solar",
		};

		if (map[clean]) return map[clean];
		for (const [k, v] of Object.entries(map)) {
			if (clean.toLowerCase().includes(k.toLowerCase())) return v;
		}
		return clean;
	}

	// ── Generate Compact PDF Document with Acronyms ──
	function generatePDF() {
		let printView = document.getElementById("print-view");
		if (!printView) {
			printView = document.createElement("div");
			printView.id = "print-view";
			document.body.appendChild(printView);
		}
		printView.innerHTML = "";

		// Header & Patient Identification
		const nome =
			(
				document.querySelector(
					'.page-header input[placeholder="Nome completo"]',
				) as HTMLInputElement
			)?.value?.trim() || "Não informado";
		const naturalidade =
			(
				document.querySelector(
					'.page-header input[placeholder="Cidade – UF"]',
				) as HTMLInputElement
			)?.value?.trim() || "";
		const resp =
			(
				document.querySelector(
					'.page-header input[placeholder="Nome e parentesco"]',
				) as HTMLInputElement
			)?.value?.trim() || "";
		const sexoLabel = sexo === "M" ? "M" : sexo === "F" ? "F" : "";

		let html = `
		<div class="print-container">
			<div class="print-header">
				<div class="print-header-top">
					<div class="print-title">ATENDIMENTO CLÍNICO PEDIÁTRICO</div>
					<div class="print-date">Data: <strong>${dataConsulta || "—"}</strong></div>
				</div>
				<div class="print-patient-box">
					<div class="print-patient-grid">
						<div class="print-cell"><strong>Paciente:</strong> ${nome}</div>
						<div class="print-cell"><strong>DN:</strong> ${dataNascimento || "—"} ${idadeCalculada ? `(${idadeCalculada})` : ""}</div>
						<div class="print-cell"><strong>Sexo:</strong> ${sexoLabel || "—"}</div>
						${naturalidade ? `<div class="print-cell"><strong>Nat:</strong> ${naturalidade}</div>` : ""}
						${resp ? `<div class="print-cell print-cell-full"><strong>Acomp/Resp:</strong> ${resp}</div>` : ""}
					</div>
				</div>
			</div>
		`;

		function getSectionFields(
			container: Element,
		): Array<{ label: string; val: string; isWide: boolean }> {
			const fields: Array<{
				label: string;
				val: string;
				isWide: boolean;
			}> = [];
			const rawData = container.id ? extractSectionData(container.id) : [];
			rawData.forEach((item) => {
				const label = getAcronymLabel(item.label);
				const val = item.val;
				if (val && label) {
					const isWide =
						val.length > 50 ||
						val.includes("\n") ||
						val.length > 35;
					fields.push({ label, val, isWide });
				}
			});
			return fields;
		}

		function renderSectionBlock(
			title: string,
			tag: string,
			fields: Array<{ label: string; val: string; isWide: boolean }>,
			customHtml: string = "",
		) {
			if (fields.length === 0 && !customHtml) return "";
			let itemsHtml = fields
				.map((f) => {
					if (f.isWide) {
						return `
						<div class="print-field print-field-full">
							<span class="print-field-label">${f.label}:</span>
							<div class="print-field-val print-field-block">${f.val}</div>
						</div>
					`;
					}
					return `
					<div class="print-field">
						<span class="print-field-label">${f.label}:</span>
						<span class="print-field-val">${f.val}</span>
					</div>
				`;
				})
				.join("");

			return `
				<div class="print-section">
					<div class="print-section-header">
						<span class="print-tag">${tag}</span>
						<span class="print-section-title">${title}</span>
					</div>
					<div class="print-section-body">
						${customHtml}
						${itemsHtml}
					</div>
				</div>
			`;
		}

		// ── I. ANAMNESE ──
		const anamneseSections = [
			{ id: "s1", tag: "S1", title: "QP & HDA" },
			{ id: "s2", tag: "S2", title: "Hábitos / Fisiol" },
			{ id: "s3", tag: "S3", title: "HG / PN" },
			{ id: "s4", tag: "S4", title: "Alim" },
			{ id: "s5", tag: "S5", title: "Vac" },
			{ id: "s6", tag: "S6", title: "DNPM" },
			{ id: "s7", tag: "S7", title: "AP / AF" },
			{ id: "s8", tag: "S8", title: "Socioamb" },
		];

		let anamneseHtml = "";
		anamneseSections.forEach((sec) => {
			const el = document.getElementById(sec.id);
			if (el) {
				const fields = getSectionFields(el);
				anamneseHtml += renderSectionBlock(sec.title, sec.tag, fields);
			}
		});

		if (anamneseHtml) {
			html += `<div class="print-block-title">I. ANAMNESE</div>${anamneseHtml}`;
		}

		// ── II. EXAME FÍSICO ──
		const efSections = [
			{ id: "s9", tag: "EF1", title: "SV & Antropo" },
			{ id: "s10", tag: "EF2", title: "Ecto" },
			{ id: "s11", tag: "EF3", title: "Linfo" },
			{ id: "s12", tag: "EF4", title: "CP" },
			{ id: "s13", tag: "EF5", title: "Resp" },
			{ id: "s14", tag: "EF6", title: "CV" },
			{ id: "s15", tag: "EF7", title: "Abd" },
			{ id: "s16", tag: "EF8", title: "GU" },
			{ id: "s17", tag: "EF9", title: "Locom" },
			{ id: "s18", tag: "EF10", title: "Neuro" },
		];

		let efHtml = "";
		efSections.forEach((sec) => {
			const el = document.getElementById(sec.id);
			if (el) {
				const fields = getSectionFields(el);
				efHtml += renderSectionBlock(sec.title, sec.tag, fields);
			}
		});

		if (efHtml) {
			html += `<div class="print-block-title">II. EXAME FÍSICO</div>${efHtml}`;
		}

		// ── III. EXAMES LABORATORIAIS ──
		if (examesLaboratoriais.length > 0) {
			let labRows = examesLaboratoriais
				.map(
					(e) => `
				<tr style="border-bottom:1px solid #f1f5f9;">
					<td style="padding:6px 8px;"><strong>${e.nome}</strong>${e.pacote ? ` <span style="font-size:10px; color:#64748b;">(${e.pacote})</span>` : ""}</td>
					<td style="padding:6px 8px;">${e.valor || "Pendente"} ${e.unidade || ""}</td>
					<td style="padding:6px 8px; color:#64748b;">${e.valoresReferencia || "-"}</td>
					<td style="padding:6px 8px;">${e.dataColeta || dataColetaPadraoLab || "-"}</td>
				</tr>
			`,
				)
				.join("");

			html += `
				<div class="print-block-title">III. EXAMES LABORATORIAIS</div>
				<div class="print-section">
					<table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
						<thead>
							<tr style="background:#f8fafc; text-align:left; border-bottom:1.5px solid #cbd5e1; font-weight:700; color:#334155;">
								<th style="padding:6px 8px;">Exame</th>
								<th style="padding:6px 8px;">Resultado</th>
								<th style="padding:6px 8px;">Valor de Referência</th>
								<th style="padding:6px 8px;">Data Coleta</th>
							</tr>
						</thead>
						<tbody>
							${labRows}
						</tbody>
					</table>
				</div>
			`;
		}

		// ── IV. EXAMES DE IMAGEM / FUNCIONAIS ──
		const examesValidos = examesImagem.filter(
			(e) => e.nome?.trim() || e.resultado?.trim(),
		);
		if (examesValidos.length > 0) {
			let examesListHtml = examesValidos
				.map(
					(e, idx) => `
				<div class="print-exame-card">
					<div class="print-exame-head">
						<strong>${idx + 1}. ${e.nome || "Exame"}</strong>
						<span>${e.data ? `Data: ${e.data}` : ""} ${e.medico ? `— Dr(a). ${e.medico}` : ""}</span>
					</div>
					${e.resultado ? `<div class="print-exame-res">${e.resultado}</div>` : ""}
				</div>
			`,
				)
				.join("");

			html += `
				<div class="print-block-title">IV. EXAMES DE IMAGEM / FUNCIONAIS</div>
				<div class="print-section">
					<div class="print-section-body">
						${examesListHtml}
					</div>
				</div>
			`;
		}

		// ── IV. AVALIAÇÃO (HIPÓTESES DIAGNÓSTICAS) ──
		const s19 = document.getElementById("s19");
		if (s19) {
			const fields = getSectionFields(s19);
			const avHtml = renderSectionBlock(
				"HD & Riscos",
				"AVALIAÇÃO",
				fields,
			);
			if (avHtml) {
				html += `<div class="print-block-title">IV. AVALIAÇÃO</div>${avHtml}`;
			}
		}

		// ── V. CONDUTA E PLANO TERAPÊUTICO ──
		const s20 = document.getElementById("s20");
		if (s20) {
			const fields = getSectionFields(s20);
			const condutaHtml = renderSectionBlock(
				"Conduta / CD",
				"CONDUTA",
				fields,
			);
			if (condutaHtml) {
				html += `<div class="print-block-title">V. CONDUTA</div>${condutaHtml}`;
			}
		}

		// Medical Signature Box
		const medicoNome =
			(
				document.querySelector(
					'input[placeholder="Dr(a). Nome"]',
				) as HTMLInputElement
			)?.value?.trim() || "";
		const medicoCrm =
			(
				document.querySelector(
					'input[placeholder="CRM/UF 000000"]',
				) as HTMLInputElement
			)?.value?.trim() || "";
		const medicoInst =
			(
				document.querySelector(
					'input[placeholder="Ex: UBS / Ambulatório de Pediatria / Hospital…"]',
				) as HTMLInputElement
			)?.value?.trim() || "";

		html += `
			<div class="print-signature-box">
				<div class="print-sig-line"></div>
				<div class="print-sig-name">${medicoNome || "Assinatura e Carimbo do Médico"}</div>
				<div class="print-sig-details">${medicoCrm ? `CRM: ${medicoCrm}` : ""} ${medicoInst ? `• ${medicoInst}` : ""}</div>
			</div>
		</div>
		`;

		printView.innerHTML = html;
		window.print();
	}

	// ── Clipboard copy helper with universal fallback ──
	async function copyTextToClipboard(text: string): Promise<boolean> {
		if (
			typeof navigator !== "undefined" &&
			navigator.clipboard &&
			typeof navigator.clipboard.writeText === "function"
		) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch (err) {
				console.warn(
					"navigator.clipboard.writeText falhou, tentando fallback textarea:",
					err,
				);
			}
		}

		try {
			const ta = document.createElement("textarea");
			ta.value = text;
			ta.style.position = "fixed";
			ta.style.top = "0";
			ta.style.left = "-9999px";
			ta.style.width = "2em";
			ta.style.height = "2em";
			ta.style.padding = "0";
			ta.style.border = "none";
			ta.style.outline = "none";
			ta.style.boxShadow = "none";
			ta.style.background = "transparent";
			ta.setAttribute("readonly", "");
			document.body.appendChild(ta);
			ta.focus();
			ta.select();
			ta.setSelectionRange(0, ta.value.length);
			const successful = document.execCommand("copy");
			document.body.removeChild(ta);
			return successful;
		} catch (err) {
			console.error("Fallback execCommand falhou:", err);
			return false;
		}
	}

	// ── Concise label mapping for clinical notes (Subjetivo) ──
	function getConciseSubjetivoLabel(label: string): string {
		const l = label.trim().replace(/:$/, "");
		const map: Record<string, string> = {
			// s2 - Hábitos
			"Padrão de sono": "Sono",
			"Hábitos urinários (diurese)": "Diurese",
			"Hábitos intestinais (evacuações)": "Evacuações",
			"Comportamento e humor": "Humor",
			"Atividade física e brincadeiras": "Ativ física",
			"Exposição a telas (tempo diário)": "Telas",

			// s3 - Gestacional e Neonatal
			"Idade materna na gestação": "Idade materna",
			"Gesta / Para / Abortos (G/P/A)": "GPA",
			"Pré-natal realizado?": "Pré-natal",
			"Número de consultas pré-natal": "Consultas PN",
			"Intercorrências na gestação": "Intercorr gestação",
			"Medicamentos na gestação": "Med gestação",
			"Tabagismo / Álcool / Drogas": "Drogas/Tabagismo",
			"Tipo de parto": "Parto",
			"Local do parto": "Local",
			"Apgar (1º e 5º minuto)": "Apgar",
			"Comprimento ao nascer": "CN",
			"Perímetro cefálico ao nascer": "PCN",
			"Peso na alta": "Peso alta",
			"Intercorrências neonatais": "Intercorr neonatal",
			"Triagem neonatal (testes de triagem)": "Triagens",
			"Observações sobre triagem neonatal": "Obs triagens",

			// s4 - Alimentação
			"Aleitamento materno exclusivo (AME)": "AME",
			"Aleitamento materno total": "AM total",
			"Fórmula infantil utilizada": "FI",
			"Introdução alimentar": "IA",
			"Aceitação e apetite": "Apetite",
			"Suplementação vitamínica / ferro": "Suplementação (Fe/Vit)",
			"Consumo de ultraprocessados / açúcar": "Ultraprocessados",
			"Rotina alimentar habitual (recordatório 24h)": "Dieta",

			// s5 - Vacinação
			"Calendário vacinal": "Vacinação",
			"Vacinas em atraso": "Vacinas atraso",
			"Reações vacinais prévias": "Reações vacinais",

			// s6 - DNPM
			"Marcos do desenvolvimento atingidos": "Marcos DNPM",
			"Observações gerais sobre marcos do desenvolvimento": "Obs DNPM",
			"Controle esfincteriano (desfralde)": "Desfralde",
			"Audição e visão (percepção dos pais)": "Audição/Visão",
			"Desempenho escolar / socialização": "Escola/Social",

			// s7 - AP / AF
			"Doenças crônicas / Diagnósticos prévios": "Doenças crônicas",
			"Internações anteriores": "Internações",
			"Cirurgias prévias": "Cirurgias",
			"Alergias conhecidas": "Alergias",
			"Alergias medicamentosas / alimentares": "Alergias",
			"Uso contínuo de medicamentos": "Med contínuo",
			"Antecedentes familiares (doenças crônicas, genéticas)": "AF",

			// s8 - Socioambiental
			"Condições de moradia e saneamento": "Moradia/Saneamento",
			"Renda familiar / Benefícios": "Renda/Benefícios",
			"Animais de estimação / Tabagismo passivo": "Animais/Tabagismo",
			"Frequenta creche / escola": "Creche/Escola",
		};
		return map[l] || l;
	}

	// ── Concise labels for Exame Físico (s10 a s18) in SOAP export ──
	function getConciseEfLabel(label: string): string {
		const l = label.trim().replace(/:$/, "");
		const map: Record<string, string> = {
			// s10 - Ectoscopia
			"Estado Geral": "EG",
			"Estado geral": "EG",
			"Fácies": "Fácies",
			"Se típica — descrever (dor, sindrômica, adenoideana, cushingóide, hipotireoidiana…)":
				"Fácies (detalhe)",
			"Atitude": "Atitude",
			"Se típica — especificar (ortopneica, opistótono, cócoras…)":
				"Atitude (detalhe)",
			"Estado Psíquico": "Psíquico",
			"Observações (TEA, TDAH, ansiedade, depressão…)": "Psíquico (obs)",
			"Coloração da Pele e Mucosas": "Pele/Mucosas",
			"Coloração da pele e mucosas": "Pele/Mucosas",
			"Grau de palidez (1+ a 4+)": "Palidez",
			"Grau de icterícia (1+ a 4+)": "Icterícia",
			"Zona de Kramer (RN)": "Zona Kramer",
			"Grau de Hidratação": "Hidratação",
			"Estado Nutricional": "Nutrição",
			"Lesões cutâneas / erupções": "Lesões cutâneas",
			"Alterações vasculares": "Alt vasculares",
			"Unhas": "Unhas",
			"Cabelos": "Cabelos",
			"Edema / outros achados cutâneos": "Edema/Cutâneo",

			// s11 - Linfonodos
			"Cadeias Avaliadas — Marcar as alteradas": "Cadeias alteradas",
			"Tamanho dos linfonodos alterados": "Tamanho linf",
			"Consistência": "Consistência linf",
			"Mobilidade / Aderência": "Mobilidade linf",
			"Sinais flogísticos": "Sinais flogísticos linf",

			// s12 - CP
			"Dimensões e conformação": "Crânio",
			"Suturas": "Suturas",
			"Fontanela anterior (bregmática)": "Fontanela ant",
			"Fontanela posterior": "Fontanela post",
			"Couro cabeludo — lesões, ectoparasitoses, distribuição capilar":
				"Couro cabeludo",
			"Simetria facial": "Simetria facial",
			"Movimentos faciais / paralisias": "Mov faciais",
			"Edema de face / dismorfismos craniofaciais":
				"Edema/Dismorfismo face",
			"Tamanho / posição dos globos": "Globos oculares",
			"Pálpebras": "Pálpebras",
			"Conjuntiva e córnea": "Conjuntiva/Córnea",
			"Esclerótica": "Esclera",
			"Pupilas (simetria, fotorreatividade, anisocoria)": "Pupilas",
			"Estrabismo / nistagmo / movimentos oculares": "Mov oculares",
			"Tamanho e implantação": "Orelhas",
			"Secreção / sensibilidade": "Orelhas (secreção/dor)",
			"Otoscopia — conduto auditivo externo": "Otoscopia (conduto)",
			"Otoscopia — membrana timpânica": "Otoscopia (MT)",
			"Pirâmide nasal / batimento de asa de nariz": "Nariz/BAN",
			"Rinoscopia anterior": "Rinoscopia",
			"Lábios e comissuras": "Lábios",
			"Gengivas e dentes": "Dentição",
			"Língua e assoalho da boca": "Língua",
			"Palato duro e mole": "Palato",
			"Oroscopia — amígdalas e faringe posterior": "Oroscopia",
			"Mobilidade / torcicolo": "Pescoço (mobilidade)",
			"Massas / cistos cervicais": "Massas cervicais",
			"Tireoide": "Tireoide",

			// s13 - Resp
			"Forma e simetria": "Tórax",
			"Desenvolvimento mamário (adolescentes)": "Mamas (Tanner)",
			"Tipo respiratório": "Padrão resp",
			"Frequência respiratória — ritmo": "Ritmo resp",
			"Sinais de esforço respiratório": "Esforço resp",
			"Expansibilidade torácica": "Expansibilidade",
			"Frêmito tóraco-vocal": "FTV",
			"Som claro pulmonar / Percussão": "Percussão pulmonar",
			"Percussão": "Percussão pulmonar",
			"Localização de alterações percussórias": "Percussão (local)",
			"Murmúrio vesicular": "MV",
			"Ruídos adventícios — estertores finos / creptantes": "Estertores",
			"Ruídos adventícios — roncos e sibilos": "Roncos/Sibilos",
			"Estridor laríngeo": "Estridor",

			// s14 - CV
			"Ictus cordis — localização": "Ictus",
			"Ictus — extensão / impulsividade": "Ictus (caract)",
			"Frêmito cardiovascular": "Frêmito CV",
			"Bulhas cardíacas": "Bulhas",
			"Sopros cardíacos": "Sopros",
			"Cliques / estalidos / atrito pericárdico": "Outros ruídos CV",
			"Pulsos periféricos (radiais, femorais, pediosos)": "Pulsos",
			"Pressão arterial (PA)": "PA",
			"Tempo de enchimento capilar (TEC)": "TEC",

			// s15 - Abd
			"Forma e simetria abdominal": "Forma abdome",
			"Cicatriz umbilical / hérnias": "Cicatriz umb/Hérnia",
			"Circulação colateral / cicatrizes cirúrgicas": "Circ colateral",
			"Ruídos hidroaéreos (RHA)": "RHA",
			"Sopros vasculares abdominais": "Sopros abd",
			"Sensibilidade / dor à palpação": "Dor à palpação",
			"Resistência / defesa abdominal": "Defesa abd",
			"Sinal de Blumberg (descompressão brusca)": "Blumberg",
			"Fígado (hepatimetria / bordo hepático)": "Fígado",
			"Baço (esplenomegalia)": "Baço",
			"Massas / tumorações": "Massas abd",
			"Ascite (sinal do piparote / macicez móvel)": "Ascite",
			"Timpanismo / macicez": "Percussão abd",

			// s16 - GU
			"Desenvolvimento puberal de Tanner — Genitália (G1–G5) / Mamas (M1–M5)":
				"Tanner",
			"Pilosidade pubiana (P1–P5)": "Tanner (pelos)",
			"Genitália externa masculina": "Genitália masc",
			"Fimose / prepúcio retrátil": "Fimose",
			"Hipospádia / epispádia": "Hipospádia",
			"Bolsa escrotal — testículos": "Testículos",
			"Criptorquidia / testículo retrátil / ectópico": "Criptorquidia",
			"Hidrocele / cisto de cordão": "Hidrocele",
			"Genitália externa feminina": "Genitália fem",
			"Grandes e pequenos lábios": "Lábios genitais",
			"Hímen": "Hímen",
			"Secreção vaginal / corrimento": "Corrimento",
			"Sinéquia de pequenos lábios": "Sinéquia",
			"Ânus e períneo": "Ânus/Períneo",
			"Punho-percussão lombar (Sinal de Giordano)": "Giordano",

			// s17 - Locomotor
			"Marcha": "Marcha",
			"Edema de membros inferiores": "Edema MMII",
			"Manobra de Ortolani (RN / lactentes)": "Ortolani",
			"Alinhamento": "Coluna (alinhamento)",
			"Mobilidade / dor à palpação": "Coluna (mobilidade)",
			"Anomalias (cistos, dimple sacral, tufo de pelo, espinha bífida, mielomeningocele)":
				"Coluna (anomalias)",

			// s18 - Neuro
			"Nível de consciência": "Consciência",
			"Escala de Glasgow": "Glasgow",
			"Estigmas neurocutâneos (pele)": "Estigmas neuro",
			"Tônus muscular": "Tônus",
			"Força muscular": "Força muscular",
			"Reflexos osteotendinosos (ROTs)": "ROTs",
			"Coordenação e equilíbrio": "Coordenação",
			"Sensibilidade superficial e profunda": "Sensibilidade",
			"Pares cranianos": "Pares cranianos",
			"Reflexos primitivos e posturais (RN/lactentes)":
				"Reflexos primitivos",
			"Sinais de irritação meníngea": "Sinais meníngeos",
		};
		return map[l] || l;
	}

	// ── Copy SOAP with Patient ID Header, Medical Acronyms and Formatted Sections ──
	async function copySOAP() {
		try {
			// ── IDENTIFICAÇÃO (apenas data da consulta, idade cronológica e acompanhante) ──
			const idLines: string[] = [];
			if (dataConsulta) {
				const parts = dataConsulta.split("-");
				const dtFmt =
					parts.length === 3
						? `${parts[2]}/${parts[1]}/${parts[0]}`
						: dataConsulta;
				idLines.push(`Data: ${dtFmt}`);
			}
			if (idadeCalculada) {
				idLines.push(`Idade: ${idadeCalculada}`);
			}
			const respVal =
				nomeResponsavel?.trim() ||
				(
					document.querySelector(
						'.page-header input[placeholder*="parentesco"]',
					) as HTMLInputElement
				)?.value?.trim() ||
				"";
			if (respVal) {
				idLines.push(`Acompanhante: ${respVal}`);
			}

			const sections: string[] = [];

			if (idLines.length > 0) {
				sections.push(`IDENTIFICAÇÃO:\n${idLines.join("\n")}`);
			}

			// ── SUBJETIVO (S) ──
			const sBlocks: string[] = [];

			if (queixaPrincipal.trim()) {
				sBlocks.push(`QP: ${queixaPrincipal.trim()}`);
			}
			if (hdaPrincipal.trim()) {
				sBlocks.push(`HDA: ${hdaPrincipal.trim()}`);
			}

			// Queixas secundárias
			const validSecs = secondaryComplaints.filter(
				(c) => c.queixa?.trim() || c.evolucao?.trim(),
			);
			if (validSecs.length > 0) {
				const secLines = validSecs.map((c, i) => {
					const text = [c.queixa?.trim(), c.evolucao?.trim()]
						.filter(Boolean)
						.join(" — ");
					return `Queixa ${i + 1}: ${text}`;
				});
				sBlocks.push(secLines.join("\n"));
			}

			// s2: Hábitos e Fisiológico
			const s2Fields = extractSectionData("s2");
			if (s2Fields.length > 0) {
				const lines = s2Fields.map(
					(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
				);
				sBlocks.push(`Hábitos:\n${lines.join("\n")}`);
			}

			// s3: História Gestacional e Neonatal (sem classificação de IG, sem classificação de peso, sem idade corrigida)
			const s3Fields = extractSectionData("s3");
			const s3Lines: string[] = [];
			s3Fields.forEach((f) => {
				const labelLower = (f.label || "").toLowerCase();
				if (
					!labelLower.includes("gestacional") &&
					!labelLower.includes("corrigida") &&
					!labelLower.includes("medicamentos na gestação") &&
					!labelLower.includes("peso ao nascer")
				) {
					s3Lines.push(
						`${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
					);
				}
			});
			if (medGestacao.trim()) {
				s3Lines.unshift(`Med gestação: ${medGestacao.trim()}`);
			}
			if (igExportString) {
				s3Lines.unshift(`IG: ${igExportString}`);
			}
			if (
				pesoAoNascer !== "" &&
				pesoAoNascer !== null &&
				pesoAoNascer !== undefined
			) {
				const pStr = String(pesoAoNascer).trim();
				if (pStr) {
					s3Lines.push(`PN: ${pStr}g`);
				}
			}
			if (s3Lines.length > 0) {
				sBlocks.push(
					`Hist. Gestacional e Neonatal:\n${s3Lines.join("\n")}`,
				);
			}

			// s4: Alimentação
			const s4Fields = extractSectionData("s4");
			if (s4Fields.length > 0) {
				const lines = s4Fields.map(
					(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
				);
				sBlocks.push(`Alimentação:\n${lines.join("\n")}`);
			}

			// s5: Vacinação
			const s5Fields = extractSectionData("s5");
			if (s5Fields.length > 0) {
				const lines = s5Fields.map(
					(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
				);
				sBlocks.push(`Vacinação:\n${lines.join("\n")}`);
			}

			// s6: Desenvolvimento Neuropsicomotor (DNPM)
			const s6Fields = extractSectionData("s6");
			const s6Lines = s6Fields.map(
				(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
			);
			if (marcosObs.trim()) {
				s6Lines.push(`Obs DNPM: ${marcosObs.trim()}`);
			}
			if (s6Lines.length > 0) {
				sBlocks.push(`DNPM:\n${s6Lines.join("\n")}`);
			}

			// s7: Antecedentes Pessoais (AP) e Familiares (AF)
			const s7Fields = extractSectionData("s7");
			const s7Lines = s7Fields.map(
				(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
			);
			if (
				medUsoContinuo.trim() &&
				!s7Lines.some((l) => l.toLowerCase().includes("contínuo"))
			) {
				s7Lines.push(`Med contínuo: ${medUsoContinuo.trim()}`);
			}
			if (s7Lines.length > 0) {
				sBlocks.push(`Antecedentes (AP/AF):\n${s7Lines.join("\n")}`);
			}

			// s8: Condições Socioambientais
			const s8Fields = extractSectionData("s8");
			if (s8Fields.length > 0) {
				const lines = s8Fields.map(
					(f) => `${getConciseSubjetivoLabel(f.label)}: ${f.val}`,
				);
				sBlocks.push(`Socioambiental:\n${lines.join("\n")}`);
			}

			if (sBlocks.length > 0) {
				sections.push(`SUBJETIVO:\n\n${sBlocks.join("\n\n")}`);
			}

			// ── OBJETIVO (O) ──
			const oBlocks: string[] = [];

			// Sinais Vitais (s9)
			const s9Fields = extractSectionData("s9");
			const svLabels = [
				"FC",
				"FR",
				"Temperatura",
				"PA",
				"SpO",
				"Perfusão",
			];
			const svList = s9Fields
				.filter((f) => svLabels.some((l) => f.label.includes(l)))
				.map((f) => `${f.label}: ${f.val}`);
			if (svList.length > 0) {
				oBlocks.push(`Sinais Vitais (SV):\n${svList.join("\n")}`);
			}

			// Antropometria
			const antropoList: string[] = [];
			if (inputPeso)
				antropoList.push(
					`Peso: ${inputPeso} kg${zScorePeso ? ` (Z-P/I: ${zScorePeso})` : ""}`,
				);
			if (inputAltura)
				antropoList.push(
					`Estatura / Comprimento: ${inputAltura} cm${zScoreEstatura ? ` (Z-E/I: ${zScoreEstatura})` : ""}`,
				);
			if (inputImc)
				antropoList.push(
					`IMC: ${inputImc} kg/m²${zScoreImc ? ` (Z-IMC/I: ${zScoreImc})` : ""}`,
				);
			if (inputPc)
				antropoList.push(
					`Perímetro Cefálico (PC): ${inputPc} cm${zScorePc ? ` (Z-PC/I: ${zScorePc})` : ""}`,
				);
			const otherAntropo = s9Fields.filter(
				(f) =>
					!svLabels.some((l) => f.label.includes(l)) &&
					!f.label.includes("Peso") &&
					!f.label.includes("Estatura") &&
					!f.label.includes("Altura") &&
					!f.label.includes("IMC") &&
					!f.label.includes("Perímetro Cefálico") &&
					!f.label.includes("Escore Z"),
			);
			if (otherAntropo.length > 0) {
				antropoList.push(
					...otherAntropo.map((f) => `${f.label}: ${f.val}`),
				);
			}
			if (antropoList.length > 0) {
				oBlocks.push(`Antropometria:\n${antropoList.join("\n")}`);
			}

			// Exame Físico Específico (s10 a s18)
			const efSectionsList = [
				{ id: "s10", title: "Ectoscopia / Estado Geral" },
				{ id: "s11", title: "Linfonodos" },
				{ id: "s12", title: "Cabeça e Pescoço" },
				{ id: "s13", title: "Aparelho Respiratório" },
				{ id: "s14", title: "Aparelho Cardiovascular" },
				{ id: "s15", title: "Abdome" },
				{ id: "s16", title: "Geniturinário" },
				{ id: "s17", title: "Aparelho Locomotor" },
				{ id: "s18", title: "Neurológico" },
			];
			efSectionsList.forEach((item) => {
				const fields = extractSectionData(item.id);
				if (fields.length > 0) {
					oBlocks.push(
						`${item.title}:\n${fields.map((f) => `${getConciseEfLabel(f.label)}: ${f.val}`).join("\n")}`,
					);
				}
			});

			// EXAMES LABORATORIAIS AGRUPADOS POR DATA E DEPOIS POR PACOTE DE EXAMES
			if (examesLaboratoriais && examesLaboratoriais.length > 0) {
				const dateMap: Record<
					string,
					Record<string, ExameLancado[]>
				> = {};
				for (const ex of examesLaboratoriais) {
					if (!ex) continue;
					const dKey =
						ex.dataColeta?.trim() ||
						dataColetaPadraoLab ||
						"Data não informada";
					const pkgKey = ex.pacote?.trim() || "Geral";
					if (!dateMap[dKey]) dateMap[dKey] = {};
					if (!dateMap[dKey][pkgKey]) dateMap[dKey][pkgKey] = [];
					dateMap[dKey][pkgKey].push(ex);
				}

				const labSections: string[] = [];
				const sortedDates = Object.keys(dateMap).sort((a, b) => {
					if (a === "Data não informada") return 1;
					if (b === "Data não informada") return -1;
					return b.localeCompare(a);
				});

				for (const dKey of sortedDates) {
					const pkgMap = dateMap[dKey];
					const dateLines: string[] = [`Data: ${dKey}`];
					for (const pkg of Object.keys(pkgMap)) {
						dateLines.push(`  • ${pkg}:`);
						for (const e of pkgMap[pkg]) {
							const res = e.valor
								? `${e.valor} ${e.unidade || ""}`.trim()
								: "Pendente";
							const ref = e.valoresReferencia
								? ` (Ref: ${e.valoresReferencia})`
								: "";
							dateLines.push(
								`    - ${e.nome || "Exame"}: ${res}${ref}`,
							);
						}
					}
					labSections.push(dateLines.join("\n"));
				}
				if (labSections.length > 0) {
					oBlocks.push(
						`Exames Laboratoriais:\n${labSections.join("\n\n")}`,
					);
				}
			}

			// EXAMES DE IMAGEM / FUNCIONAIS
			const examesValidos = (examesImagem || []).filter(
				(e) => e.nome?.trim() || e.resultado?.trim(),
			);
			if (examesValidos.length > 0) {
				const examesLines = examesValidos.map((e) => {
					const meta = [
						e.nome?.trim(),
						e.data ? `(${e.data})` : "",
						e.medico ? `— Dr(a). ${e.medico}` : "",
					]
						.filter(Boolean)
						.join(" ");
					return `• ${meta}:\n  ${e.resultado?.trim() || "Sem laudo registrado"}`;
				});
				oBlocks.push(
					`Exames de Imagem / Funcionais:\n${examesLines.join("\n\n")}`,
				);
			}

			if (oBlocks.length > 0) {
				sections.push(`OBJETIVO:\n\n${oBlocks.join("\n\n")}`);
			}

			// ── AVALIAÇÃO (A) ──
			const s19Fields = extractSectionData("s19");
			if (s19Fields.length > 0) {
				const aLines = s19Fields.map((f) => {
					let prefix = f.label;
					if (f.label.includes("Principal")) prefix = "HD Principal";
					else if (f.label.includes("Diferenciais"))
						prefix = "Diagnósticos Diferenciais";
					else if (f.label.includes("Nutricional"))
						prefix = "Diagnóstico Nutricional";
					else if (
						f.label.includes("DNPM") ||
						f.label.includes("Neuro")
					)
						prefix = "Diagnóstico do DNPM";
					else if (f.label.includes("Vacinal"))
						prefix = "Diagnóstico Vacinal";
					else if (
						f.label.includes("Risco") ||
						f.label.includes("vulnerabilidade")
					)
						prefix = "Fatores de Risco / Vulnerabilidade";
					return `${prefix}:\n${f.val}`;
				});
				sections.push(`AVALIAÇÃO:\n\n${aLines.join("\n\n")}`);
			}

			// ── PLANO / CONDUTA (P) ──
			const pBlocks: string[] = [];
			if (medPrescricao.trim()) {
				pBlocks.push(
					`Prescrição Farmacológica:\n${medPrescricao.trim()}`,
				);
			}
			const s20Fields = extractSectionData("s20");
			if (s20Fields.length > 0) {
				s20Fields.forEach((f) => {
					if (
						!f.label.includes("Nome completo do médico") &&
						!f.label.includes("CRM") &&
						!f.label.includes("Instituição") &&
						!f.label.includes("Prescrição") &&
						!f.label.includes("Farmacológico")
					) {
						pBlocks.push(`${f.label}:\n${f.val}`);
					}
				});
			}
			if (pBlocks.length > 0) {
				sections.push(`PLANO / CONDUTA:\n\n${pBlocks.join("\n\n")}`);
			}

			// Montagem final do SOAP com 2 quebras de linha entre seções
			const soap = sections.join("\n\n");

			if (!soap.trim()) {
				showToast("Nenhum campo preenchido para copiar");
				return;
			}

			const success = await copyTextToClipboard(soap.trim());
			if (success) {
				showToast("Texto SOAP copiado para a área de transferência!");
			} else {
				showToast("Erro ao copiar para a área de transferência");
			}
		} catch (err) {
			console.error("Erro inesperado ao montar/copiar SOAP:", err);
			showToast("Erro ao processar SOAP");
		}
	}

	// Auto-save on input/change
	function handleFormInput(e: Event) {
		if (
			!(e.target as Element)?.closest("#marcosModal") &&
			!(e.target as Element)?.closest(".med-search-wrapper")
		) {
			debouncedSave();
		}
	}

	// Toggle HDA summary in Avaliação
	function toggleHdaSummary() {
		hdaSummaryVisible = !hdaSummaryVisible;
	}
</script>

<svelte:head>
	<title>Ficha Pediátrica — Anamnese & Exame Físico</title>
	<meta
		name="description"
		content="Prontuário eletrônico pediátrico com anamnese completa, exame físico e plano terapêutico"
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Toast -->
{#if toastVisible}
	<div class="toast" class:visible={toastVisible}>
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"><path d="M20 6L9 17l-5-5" /></svg
		>
		{toastMessage}
	</div>
{/if}

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div oninput={handleFormInput} onchange={handleFormInput}>
	<!-- TOP BAR -->
	<div class="topbar">
		<a href="/" class="topbar-back">← Voltar</a>
		<div class="topbar-brand">Pediatria <span>/ Ficha Clínica</span></div>
		{#if scrolledPastHeader && (nomeCrianca || idadeCalculada || nomeResponsavel)}
			<div class="topbar-patient-card" title="Dados do Paciente">
				{#if nomeCrianca}
					<span class="t-patient-name" title="Nome da criança"
						>👶 {nomeCrianca}</span
					>
				{/if}
				{#if idadeCalculada}
					<span class="t-patient-pill" title="Idade"
						>{idadeCalculada}</span
					>
				{/if}
				{#if nomeResponsavel}
					<span
						class="t-patient-resp"
						title="Responsável / Acompanhante"
						>Resp: {nomeResponsavel}</span
					>
				{/if}
			</div>
		{/if}
		<nav class="topbar-nav">
			<a
				class="nav-pill"
				href="#anamnese"
				class:active={activeSection === "anamnese"}
				><span class="dot"></span>Anamnese</a
			>
			<a
				class="nav-pill"
				href="#exame"
				class:active={activeSection === "exame"}
				><span class="dot"></span>Exame Físico</a
			>
			<a
				class="nav-pill"
				href="#avaliacao"
				class:active={activeSection === "avaliacao"}
				><span class="dot"></span>Avaliação</a
			>
			<a
				class="nav-pill"
				href="#conduta"
				class:active={activeSection === "conduta"}
				><span class="dot"></span>Conduta</a
			>
		</nav>
		<button
			class="btn-action btn-copy"
			type="button"
			onclick={copySOAP}
			style="margin-left: auto;"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path
					d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
				/></svg
			>
			Copiar SOAP
		</button>
		<button class="btn-action btn-pdf" type="button" onclick={generatePDF}>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><polyline points="6 9 6 2 18 2 18 9" /><path
					d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
				/><rect x="6" y="14" width="12" height="8" /></svg
			>
			PDF
		</button>
		<button class="btn-action btn-reset" type="button" onclick={resetForm}>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				><polyline points="1 4 1 10 7 10" /><path
					d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
				/></svg
			>
			Limpar
		</button>
	</div>

	<div class="page-layout">
		<!-- LEFT SIDEBAR -->
		<aside class="sidebar-left" id="sidebarLeft">
			<div class="side-nav-title">Navegação</div>
			<div class="side-nav-group">
				<a href="#anamnese" class="side-nav-group-label"
					><span class="side-dot"></span>Anamnese</a
				>
				<ul class="side-nav-items">
					<li><a href="#s1">01 · Queixa Principal / HDA</a></li>
					<li><a href="#s2">02 · Hábitos e Funções</a></li>
					<li><a href="#s3">03 · Hist. Gestacional</a></li>
					<li><a href="#s4">04 · Alimentação</a></li>
					<li><a href="#s5">05 · Vacinação</a></li>
					<li><a href="#s6">06 · DNPM</a></li>
					<li><a href="#s7">07 · Antec. Pessoais / Fam.</a></li>
					<li><a href="#s8">08 · Hist. Socioambiental</a></li>
				</ul>
			</div>
			<div class="side-nav-group">
				<a href="#exame" class="side-nav-group-label"
					><span class="side-dot"></span>Exame Físico</a
				>
				<ul class="side-nav-items">
					<li><a href="#s9">01 · Sinais Vitais / Antrop.</a></li>
					<li><a href="#s10">02 · Ectoscopia</a></li>
					<li><a href="#s11">03 · Linfonodos</a></li>
					<li><a href="#s12">04 · Cabeça e Pescoço</a></li>
					<li><a href="#s13">05 · Tórax / Respiratório</a></li>
					<li><a href="#s14">06 · Cardiovascular</a></li>
					<li><a href="#s15">07 · Abdome</a></li>
					<li><a href="#s16">08 · Gênito-urinário</a></li>
					<li><a href="#s17">09 · Locomotor</a></li>
					<li><a href="#s18">10 · Neurológico</a></li>
				</ul>
			</div>
			<div class="side-nav-group">
				<a href="#avaliacao" class="side-nav-group-label"
					><span class="side-dot"></span>Avaliação</a
				>
				<ul class="side-nav-items">
					<li><a href="#s19">Hipóteses Diagnósticas</a></li>
				</ul>
			</div>
			<div class="side-nav-group">
				<a href="#s-exames-lab" class="side-nav-group-label"
					><span class="side-dot"></span>Exames</a
				>
				<ul class="side-nav-items">
					<li><a href="#s-exames-lab">Laboratoriais</a></li>
					<li><a href="#s-exames-imagem">Imagem / Funcionais</a></li>
				</ul>
			</div>
			<div class="side-nav-group">
				<a href="#conduta" class="side-nav-group-label"
					><span class="side-dot"></span>Conduta</a
				>
				<ul class="side-nav-items">
					<li><a href="#s20">Plano Terapêutico</a></li>
				</ul>
			</div>
		</aside>

		<div class="wrapper">
			<!-- IDENTIFICAÇÃO -->
			<div class="page-header" bind:this={pageHeaderEl}>
				<div class="hfield">
					<label>Data da consulta</label><input
						type="date"
						id="dataConsulta"
						bind:value={dataConsulta}
					/>
				</div>
				<div class="hfield">
					<label>Nome da criança</label><input
						type="text"
						placeholder="Nome completo"
						bind:value={nomeCrianca}
					/>
				</div>
				<div class="hfield">
					<label>Data de nascimento</label><input
						type="date"
						id="dataNascimento"
						bind:value={dataNascimento}
					/>
				</div>
				<div class="hfield">
					<label>Sexo</label>
					<div class="option-row">
						<label
							><input
								type="radio"
								name="sexo"
								value="M"
								bind:group={sexo}
							/> Masculino</label
						>
						<label
							><input
								type="radio"
								name="sexo"
								value="F"
								bind:group={sexo}
							/> Feminino</label
						>
					</div>
				</div>
				<div class="hfield">
					<label>Idade (calculada)</label><input
						type="text"
						id="idadeCalculada"
						readonly
						value={idadeCalculada
							? infoIdadeCorrigida?.isPretermo &&
								infoIdadeCorrigida.idadeCorrigidaCurta
								? `${idadeCalculada} (Corrigida: ${infoIdadeCorrigida.idadeCorrigidaCurta})`
								: idadeCalculada
							: ""}
						placeholder="Preencha a data de nascimento"
						style="background:var(--accent-light); font-weight:500;"
					/>
				</div>
				<div class="hfield">
					<label>Naturalidade</label><input
						type="text"
						placeholder="Cidade – UF"
						bind:value={naturalidade}
					/>
				</div>
				<div class="hfield hfield-wide">
					<label>Nome do responsável / acompanhante</label><input
						type="text"
						placeholder="Nome e parentesco"
						bind:value={nomeResponsavel}
					/>
				</div>
			</div>

			<!-- ══ BLOCO 1 — ANAMNESE ══ -->
			<div id="anamnese" class="anchor"></div>

			<!-- 1 · Queixa Principal / HDA -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s1")}
				id="s1"
			>
				<div class="section-head" onclick={() => toggleSection("s1")}>
					<span class="section-num">ANAMNESE · 01</span>
					<span class="section-title">Queixa Principal e HDA</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Queixa Principal</div>
						<div class="fields cols-1">
							<div class="field">
								<label
									>Motivo da consulta (em palavras do
									acompanhante)</label
								><textarea
									bind:value={queixaPrincipal}
									placeholder="Ex: 'Ela não consegue falar direito'"
								></textarea>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">
							História da Doença Atual (HDA)
						</div>
						<div class="fields cols-1">
							<div class="field">
								<label
									>Descrição detalhada — início, duração,
									evolução, fatores de melhora/piora, sintomas
									associados</label
								><textarea
									id="hda-principal"
									rows="5"
									bind:value={hdaPrincipal}
									placeholder="Descreva cronologicamente..."
								></textarea>
							</div>
						</div>
					</div>
					{#each secondaryComplaints as complaint (complaint.id)}
						<div class="sub">
							<div
								class="sub-title"
								style="display: flex; justify-content: space-between; align-items: center;"
							>
								Queixa Secundária #{complaint.id}
								<button
									type="button"
									class="btn-dx"
									onclick={() =>
										removeSecondaryComplaint(complaint.id)}
									>✕ Remover</button
								>
							</div>
							<div class="fields cols-1">
								<div class="field">
									<label>Queixa</label><textarea
										bind:value={complaint.queixa}
										placeholder="Descreva a queixa secundária..."
									></textarea>
								</div>
								<div class="field">
									<label>Evolução / HMA resumida</label
									><textarea
										bind:value={complaint.evolucao}
										placeholder="Início, duração, fatores associados..."
									></textarea>
								</div>
							</div>
						</div>
					{/each}
					<div style="margin-top: 10px; margin-bottom: 10px;">
						<button
							type="button"
							class="btn-dx"
							style="padding: 6px 12px; font-size: 13px; cursor: pointer;"
							onclick={addSecondaryComplaint}
							>+ Adicionar Queixa Secundária</button
						>
					</div>
				</div>
			</div>

			<!-- 2 · Hábitos e Funções Fisiológicas -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s2")}
				id="s2"
			>
				<div class="section-head" onclick={() => toggleSection("s2")}>
					<span class="section-num">ANAMNESE · 02</span>
					<span class="section-title"
						>Hábitos e Funções Fisiológicas</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields">
						<div class="field">
							<label>Apetite</label><textarea
								placeholder="Quantidade, preferências, recusas alimentares…"
							></textarea>
						</div>
						<div class="field">
							<label>Sono</label><textarea
								placeholder="Horas/dia, despertares, roncos, parassonias…"
							></textarea>
						</div>
						<div class="field">
							<label>Diurese</label><textarea
								placeholder="Frequência, cor, odor, polaciúria, disúria…"
							></textarea>
						</div>
						<div class="field">
							<label>Evacuação / Intestino</label><textarea
								placeholder="Frequência, consistência, cor, sangue, dor…"
							></textarea>
						</div>
						<div class="field">
							<label>Humor / Atividade / Disposição</label
							><textarea
								placeholder="Interação social, brincadeiras, escola…"
							></textarea>
						</div>
						<div class="field">
							<label>Ciclo menstrual (adolescentes)</label
							><textarea
								placeholder="Regularidade, dismenorreia, data DUM…"
							></textarea>
						</div>
					</div>
					<div class="screen-time-box">
						<div class="sub-title">Tempo de Tela</div>
						<div class="fields cols-3">
							<div class="field">
								<label>Tempo diário de tela</label>
								<div class="input-unit">
									<input
										type="number"
										step="0.5"
										placeholder="0"
										id="tempoTela"
									/><span class="badge-unit">h/dia</span>
								</div>
							</div>
							<div class="field span-2">
								<label>Dispositivos utilizados</label>
								<div class="chips">
									<label class="chip"
										><input type="checkbox" />TV</label
									>
									<label class="chip"
										><input type="checkbox" />Celular</label
									>
									<label class="chip"
										><input type="checkbox" />Tablet</label
									>
									<label class="chip"
										><input
											type="checkbox"
										/>Computador</label
									>
								</div>
							</div>
							<div class="field span-3">
								<label>Observações sobre tempo de tela</label
								><textarea
									placeholder="Tipo de conteúdo, supervisão dos pais, horários, impacto no sono/comportamento…"
								></textarea>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 3 · História Gestacional -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s3")}
				id="s3"
			>
				<div class="section-head" onclick={() => toggleSection("s3")}>
					<span class="section-num">ANAMNESE · 03</span>
					<span class="section-title"
						>História Gestacional e Período Neonatal</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Gestação</div>
						<div class="fields cols-3">
							<div class="field">
								<label>Idade materna na gestação</label><input
									type="number"
									placeholder="anos"
								/>
							</div>
							<div class="field">
								<label>Gesta / Para / Abortos</label><input
									type="text"
									placeholder="G__ P__ A__"
								/>
							</div>
							<div class="field">
								<label>Pré-natal realizado?</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="prenatal"
											value="sim"
										/> Sim</label
									>
									<label
										><input
											type="radio"
											name="prenatal"
											value="nao"
										/> Não</label
									>
								</div>
							</div>
							<div class="field">
								<label>Número de consultas pré-natal</label
								><input type="number" placeholder="0" />
							</div>
							<div class="field span-2">
								<label>Intercorrências na gestação</label><input
									type="text"
									placeholder="Ex: pré-eclâmpsia, ITU, sangramento…"
								/>
							</div>
							<div class="field span-2">
								<label>Medicamentos na gestação</label>
								<textarea
									bind:value={medGestacao}
									placeholder="Ex: metildopa, ácido fólico…"
								></textarea>
								<MedicamentoModal
									bind:value={medGestacao}
									placeholder="+ Adicionar medicamento"
									id="med-gestacao"
									context="gestacao"
								/>
							</div>
							<div class="field">
								<label>Tabagismo / Álcool / Drogas</label><input
									type="text"
									placeholder="Descreva se houver"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Parto e Período Neonatal</div>
						<div class="fields cols-3">
							<div class="field">
								<label>Tipo de parto</label>
								<select>
									<option value="">Selecione…</option>
									<option>Vaginal (espontâneo)</option>
									<option>Vaginal (fórceps)</option>
									<option>Vaginal (vácuo extrator)</option>
									<option>Cesariana eletiva</option>
									<option>Cesariana de emergência</option>
								</select>
							</div>
							<div class="field">
								<label>Local do parto</label><input
									type="text"
									placeholder="Hospital / maternidade"
								/>
							</div>
							<div class="field">
								<label>Idade gestacional ao nascer (IG)</label>
								<div style="display: flex; gap: 6px;">
									<div class="input-unit" style="flex: 1;">
										<input
											type="number"
											min="20"
											max="45"
											placeholder="39"
											bind:value={igSemanas}
										/><span class="badge-unit">sem</span>
									</div>
									<div
										class="input-unit"
										style="width: 75px;"
									>
										<input
											type="number"
											min="0"
											max="6"
											placeholder="0"
											bind:value={igDias}
										/><span class="badge-unit">d</span>
									</div>
								</div>
								{#if classificacaoIG}
									<div
										class="badge-classif {classificacaoIG.tipo}"
									>
										{classificacaoIG.label}
									</div>
								{/if}
							</div>
							<div class="field">
								<label>Correção da Idade Gestacional</label>
								<input
									type="text"
									readonly
									value={infoIdadeCorrigida
										? infoIdadeCorrigida.texto
										: "Aguardando IG e DN"}
									placeholder="Cálculo se IG < 37 semanas"
									style="background: var(--accent-light); font-weight: 500;"
								/>
							</div>
							<div class="field">
								<label>APGAR 1' / 5'</label><input
									type="text"
									placeholder="Ex: 8/9"
								/>
							</div>
							<div class="field">
								<label>Peso ao nascer</label>
								<div class="input-unit">
									<input
										type="number"
										placeholder="0"
										bind:value={pesoAoNascer}
									/><span class="badge-unit">g</span>
								</div>
								{#if classificacaoPN}
									<div
										class="badge-classif {classificacaoPN.tipo}"
									>
										{classificacaoPN.label}
									</div>
								{/if}
							</div>
							<div class="field">
								<label>Comprimento ao nascer</label>
								<div class="input-unit">
									<input type="number" placeholder="0" /><span
										class="badge-unit">cm</span
									>
								</div>
							</div>
							<div class="field">
								<label>Perímetro Cefálico ao nascer</label>
								<div class="input-unit">
									<input type="number" placeholder="0" /><span
										class="badge-unit">cm</span
									>
								</div>
							</div>
							<div class="field">
								<label>Peso na alta</label>
								<div class="input-unit">
									<input type="number" placeholder="0" /><span
										class="badge-unit">g</span
									>
								</div>
							</div>
							<div class="field span-2">
								<label>Intercorrências neonatais</label><input
									type="text"
									placeholder="Ex: hipoglicemia, icterícia, internação UTI…"
								/>
							</div>
							<div class="field">
								<label>Triagens neonatais</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="triagem"
											value="normais"
										/> Normais</label
									>
									<label
										><input
											type="radio"
											name="triagem"
											value="alteradas"
										/> Alteradas</label
									>
								</div>
							</div>
							<div class="field span-2">
								<label>Observações sobre triagens</label><input
									type="text"
									placeholder="Pezinho, orelhinha, olhinho, coraçãozinho…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 4 · Alimentação -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s4")}
				id="s4"
			>
				<div class="section-head" onclick={() => toggleSection("s4")}>
					<span class="section-num">ANAMNESE · 04</span>
					<span class="section-title">Alimentação</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields">
						<div class="field">
							<label>Aleitamento materno exclusivo até</label
							><input
								type="text"
								placeholder="Ex: 6 meses / não amamentou"
							/>
						</div>
						<div class="field">
							<label>Aleitamento materno total até</label><input
								type="text"
								placeholder="Ex: 1 ano e 2 meses"
							/>
						</div>
						<div class="field">
							<label>Início da introdução alimentar</label><input
								type="text"
								placeholder="Idade em meses"
							/>
						</div>
						<div class="field">
							<label>Suplementação de Vitamina D</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="vitD"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="vitD"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field">
							<label>Suplementação de Ferro</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="ferro"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="ferro"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field span-2">
							<label
								>Alimentação habitual / Recordatório alimentar</label
							><textarea
								rows="3"
								placeholder="Descreva as principais refeições e frequência…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- 5 · Vacinação -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s5")}
				id="s5"
			>
				<div class="section-head" onclick={() => toggleSection("s5")}>
					<span class="section-num">ANAMNESE · 05</span>
					<span class="section-title">Vacinação</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Status Vacinal</div>
						<div class="option-row" style="margin-bottom:10px">
							<label
								><input
									type="radio"
									name="vacina"
									value="atualizado"
								/> Calendário vacinal atualizado</label
							>
							<label
								><input
									type="radio"
									name="vacina"
									value="incompleto"
								/> Incompleto</label
							>
							<label
								><input
									type="radio"
									name="vacina"
									value="desconhecido"
								/> Desconhecido</label
							>
						</div>
						<div class="field cols-1">
							<label>Vacinas pendentes / observações</label>
							<textarea
								placeholder="Vacinas em atraso, reações adversas, recusa familiar…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- 6 · DNPM -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s6")}
				id="s6"
			>
				<div class="section-head" onclick={() => toggleSection("s6")}>
					<span class="section-num">ANAMNESE · 06</span>
					<span class="section-title"
						>Desenvolvimento Neuropsicomotor (DNPM)</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields">
						<div class="field">
							<label>Denver II — resultado global</label>
							<select>
								<option value="">Selecione…</option>
								<option>Normal</option>
								<option>Suspeito</option>
								<option>Anormal</option>
								<option>Não aplicável (idade)</option>
								<option>Não realizado</option>
							</select>
						</div>
						<div class="field">
							<label>Controle esfincteriano / Desfralde</label
							><input
								type="text"
								placeholder="Diurno / noturno / idade…"
							/>
						</div>
						<div class="field">
							<label>Audição</label><input
								type="text"
								placeholder="Triagem, avaliação audiológica…"
							/>
						</div>
						<div class="field">
							<label>Visão</label><input
								type="text"
								placeholder="Acuidade, ortóptica…"
							/>
						</div>
						<div class="field">
							<label>Frequenta escola / creche?</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="escola"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="escola"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field">
							<label>Rendimento / adaptação escolar</label><input
								type="text"
								placeholder="Descreva…"
							/>
						</div>
						<div class="field span-2">
							<label
								>Marcos do desenvolvimento (descreva idades de
								aquisição)</label
							><textarea
								placeholder="Sustento de cabeça, sentar, engatinhar, andar, primeiras palavras, frases, leitura/escrita…"
							></textarea>
						</div>
						<div class="field span-2">
							<label>Observações sobre DNPM</label><textarea
								placeholder="Avaliação especializada prévia, terapias em andamento (fonoaudiologia, TO, fisioterapia)…"
							></textarea>
						</div>
						<div class="field span-2">
							<button
								type="button"
								class="btn-marcos"
								onclick={() => {
									marcosModalOpen = true;
								}}
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M9 11l3 3L22 4" /><path
										d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
									/></svg
								>
								Avaliar Marcos do Desenvolvimento
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 7 · Antecedentes Pessoais e Familiares -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s7")}
				id="s7"
			>
				<div class="section-head" onclick={() => toggleSection("s7")}>
					<span class="section-num">ANAMNESE · 07</span>
					<span class="section-title"
						>Antecedentes Pessoais e História Familiar</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Antecedentes Pessoais</div>
						<div class="fields">
							<div class="field">
								<label>Doenças prévias</label><textarea
									placeholder="Pneumonia, asma, otites de repetição…"
								></textarea>
							</div>
							<div class="field">
								<label>Internações</label><textarea
									placeholder="Motivo, local, duração…"
								></textarea>
							</div>
							<div class="field">
								<label>Cirurgias / procedimentos</label
								><textarea placeholder="Tipo e data…"
								></textarea>
							</div>
							<div class="field">
								<label>Alergias</label><textarea
									placeholder="Medicamentos, alimentos, látex — tipo de reação…"
								></textarea>
							</div>
							<div class="field span-2">
								<label>Uso contínuo de medicamentos</label>
								<textarea
									bind:value={medUsoContinuo}
									placeholder="Nome, dose, frequência, indicação…"
								></textarea>
								<MedicamentoModal
									bind:value={medUsoContinuo}
									placeholder="+ Adicionar medicamento"
									id="med-uso-continuo"
									context="uso_continuo"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">História Familiar</div>
						<div class="fields">
							<div class="field span-2">
								<label>Doenças relevantes na família</label
								><textarea
									placeholder="Asma, diabetes, cardiopatias, neoplasias, doenças genéticas, transtornos do neurodesenvolvimento…"
								></textarea>
							</div>
							<div class="field">
								<label>Consanguinidade entre os pais?</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="consang"
											value="sim"
										/> Sim</label
									>
									<label
										><input
											type="radio"
											name="consang"
											value="nao"
										/> Não</label
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 8 · História Socioambiental -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s8")}
				id="s8"
			>
				<div class="section-head" onclick={() => toggleSection("s8")}>
					<span class="section-num">ANAMNESE · 08</span>
					<span class="section-title">História Socioambiental</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields cols-3">
						<div class="field">
							<label>Tipo de moradia</label>
							<select>
								<option value="">Selecione…</option>
								<option>Casa própria</option>
								<option>Casa alugada</option>
								<option>Favela / comunidade</option>
								<option>Área rural</option>
								<option>Abrigo / instituição</option>
							</select>
						</div>
						<div class="field">
							<label>Número de pessoas na casa</label><input
								type="number"
								placeholder="0"
							/>
						</div>
						<div class="field">
							<label>Renda familiar</label><input
								type="text"
								placeholder="Salários mínimos aprox."
							/>
						</div>
						<div class="field">
							<label>Água tratada?</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="agua"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="agua"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field">
							<label>Rede de esgoto?</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="esgoto"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="esgoto"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field">
							<label>Animais domésticos?</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="animais"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="animais"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field">
							<label>Tabagismo domiciliar?</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="tabdom"
										value="sim"
									/> Sim</label
								>
								<label
									><input
										type="radio"
										name="tabdom"
										value="nao"
									/> Não</label
								>
							</div>
						</div>
						<div class="field span-2">
							<label>Observações adicionais</label><textarea
								placeholder="Relações familiares, rede de apoio, situação escolar dos pais…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- ══ BLOCO 2 — EXAME FÍSICO ══ -->
			<div id="exame" class="anchor"></div>

			<!-- EF·1 · Sinais Vitais & Antropometria -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s9")}
				id="s9"
			>
				<div class="section-head" onclick={() => toggleSection("s9")}>
					<span class="section-num ef">EF · 01</span>
					<span class="section-title"
						>Sinais Vitais e Antropometria</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Sinais Vitais</div>
						<div class="vitals-grid">
							<div class="vital-card">
								<label>FC — Freq. Cardíaca</label>
								<div class="input-unit">
									<input type="number" placeholder="0" /><span
										class="badge-unit">bpm</span
									>
								</div>
							</div>
							<div class="vital-card">
								<label>FR — Freq. Respiratória</label>
								<div class="input-unit">
									<input type="number" placeholder="0" /><span
										class="badge-unit">irpm</span
									>
								</div>
							</div>
							<div class="vital-card">
								<label>Temperatura</label>
								<div class="input-unit">
									<input
										type="number"
										step="0.1"
										placeholder="36.5"
									/><span class="badge-unit">°C</span>
								</div>
							</div>
							<div class="vital-card">
								<label>PA sistólica / diastólica</label>
								<div class="input-unit">
									<input
										type="text"
										placeholder="Ex: 100/60"
									/><span class="badge-unit">mmHg</span>
								</div>
							</div>
							<div class="vital-card">
								<label>SpO₂ — Saturação O₂</label>
								<div class="input-unit">
									<input
										type="number"
										placeholder="98"
									/><span class="badge-unit">%</span>
								</div>
							</div>
							<div class="vital-card">
								<label>Perfusão periférica</label>
								<div class="input-unit">
									<input
										type="number"
										step="0.5"
										placeholder="≤2"
									/><span class="badge-unit">seg</span>
								</div>
							</div>
						</div>
					</div>
					<div class="sub">
						<div
							class="sub-title"
							style="display:flex; justify-content:space-between; align-items:center;"
						>
							<span>Antropometria</span>
							{#if zScorePeso || zScoreEstatura || zScoreImc || zScorePc}
								<span
									style="font-size:10px; font-weight:600; background:#f0fdfa; color:#0f766e; border:1px solid #ccfbf1; padding:2px 8px; border-radius:12px;"
								>
									Escore Z OMS Calculado
								</span>
							{/if}
						</div>
						<div class="vitals-grid">
							<div class="vital-card">
								<label>Peso</label>
								<div class="input-unit">
									<input
										type="number"
										id="input-peso"
										step="0.01"
										placeholder="0.00"
										bind:value={inputPeso}
									/><span class="badge-unit">kg</span>
								</div>
							</div>
							<div class="vital-card">
								<label>Comprimento / Estatura</label>
								<div class="input-unit">
									<input
										type="number"
										id="input-altura"
										step="0.1"
										placeholder="0.0"
										bind:value={inputAltura}
									/><span class="badge-unit">cm</span>
								</div>
							</div>
							<div class="vital-card">
								<label>IMC</label>
								<div class="input-unit">
									<input
										type="number"
										id="input-imc"
										step="0.01"
										placeholder="—"
										value={inputImc}
										oninput={handleImcInput}
									/><span class="badge-unit">kg/m²</span>
								</div>
							</div>
							<div class="vital-card">
								<label>Perímetro Cefálico</label>
								<div class="input-unit">
									<input
										type="number"
										id="input-pc"
										step="0.1"
										placeholder="0.0"
										bind:value={inputPc}
									/><span class="badge-unit">cm</span>
								</div>
							</div>
							<div class="vital-card">
								<label>Perímetro Torácico</label>
								<div class="input-unit">
									<input
										type="number"
										step="0.1"
										placeholder="0.0"
									/><span class="badge-unit">cm</span>
								</div>
							</div>
							<div class="vital-card">
								<label>Perímetro Abdominal</label>
								<div class="input-unit">
									<input
										type="number"
										step="0.1"
										placeholder="0.0"
									/><span class="badge-unit">cm</span>
								</div>
							</div>
						</div>
						<div style="margin-top:10px" class="fields cols-4">
							<div class="field">
								<label>Escore Z — Peso/Idade</label><input
									type="text"
									placeholder="Ex: +0,5"
									bind:value={zScorePeso}
								/>
							</div>
							<div class="field">
								<label>Escore Z — Estatura/Idade</label><input
									type="text"
									placeholder="Ex: -1,2"
									bind:value={zScoreEstatura}
								/>
							</div>
							<div class="field">
								<label>Escore Z — IMC/Idade</label><input
									type="text"
									placeholder="Ex: +1,0"
									bind:value={zScoreImc}
								/>
							</div>
							<div class="field">
								<label>Escore Z — PC/Idade</label><input
									type="text"
									placeholder="Ex: +0,2"
									bind:value={zScorePc}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·2 · Ectoscopia -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s10")}
				id="s10"
			>
				<div class="section-head" onclick={() => toggleSection("s10")}>
					<span class="section-num ef">EF · 02</span>
					<span class="section-title"
						>Ectoscopia — Inspeção Geral</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Estado Geral</div>
						<div class="option-row">
							<label
								><input type="radio" name="eg" value="bom" /> Bom</label
							><label
								><input
									type="radio"
									name="eg"
									value="regular"
								/> Regular / levemente comprometido</label
							><label
								><input type="radio" name="eg" value="ruim" /> Ruim
								/ muito comprometido</label
							>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Fácies</div>
						<div class="option-row" style="margin-bottom:6px">
							<label
								><input
									type="radio"
									name="facies"
									value="atipica"
								/> Atípica (normal)</label
							><label
								><input
									type="radio"
									name="facies"
									value="tipica"
								/> Típica</label
							>
						</div>
						<div class="field">
							<label
								>Se típica — descrever (dor, sindrômica,
								adenoideana, cushingóide, hipotireoidiana…)</label
							><input type="text" placeholder="Especificar…" />
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Atitude</div>
						<div class="option-row">
							<label
								><input
									type="radio"
									name="atitude"
									value="ativa-atipica"
								/> Ativa atípica (normal)</label
							><label
								><input
									type="radio"
									name="atitude"
									value="ativa-tipica"
								/> Ativa típica</label
							><label
								><input
									type="radio"
									name="atitude"
									value="passiva"
								/> Passiva</label
							>
						</div>
						<div class="field" style="margin-top:6px">
							<label
								>Se típica — especificar (ortopneica,
								opistótono, cócoras…)</label
							><input type="text" placeholder="Especificar…" />
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Estado Psíquico</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Alerta e interativo</label
							><label class="chip"
								><input type="checkbox" />Irritado</label
							><label class="chip"
								><input type="checkbox" />Letárgico / apático</label
							><label class="chip"
								><input type="checkbox" />Obnubilado</label
							><label class="chip"
								><input type="checkbox" />Sonolento</label
							><label class="chip"
								><input type="checkbox" />Comatoso</label
							><label class="chip"
								><input type="checkbox" />Agitado</label
							>
						</div>
						<div class="field" style="margin-top:8px">
							<label
								>Observações (TEA, TDAH, ansiedade, depressão…)</label
							><input
								type="text"
								placeholder="Descreva alterações relevantes…"
							/>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Coloração da Pele e Mucosas</div>
						<div class="chips" style="margin-bottom:8px">
							<label class="chip"
								><input type="checkbox" />Normocorado</label
							><label class="chip"
								><input type="checkbox" />Pálido</label
							><label class="chip"
								><input type="checkbox" />Cianótico periférico</label
							><label class="chip"
								><input type="checkbox" />Cianótico central</label
							><label class="chip"
								><input type="checkbox" />Ictérico</label
							><label class="chip"
								><input type="checkbox" />Pletórico</label
							>
						</div>
						<div class="fields cols-3">
							<div class="field">
								<label>Grau de palidez (1+ a 4+)</label><input
									type="text"
									placeholder="Ex: 2+"
								/>
							</div>
							<div class="field">
								<label>Grau de icterícia (1+ a 4+)</label><input
									type="text"
									placeholder="Ex: 1+"
								/>
							</div>
							<div class="field">
								<label>Zona de Kramer (RN)</label><input
									type="text"
									placeholder="I–V"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Grau de Hidratação</div>
						<div class="option-row" style="margin-bottom:6px">
							<label
								><input
									type="radio"
									name="hidrat"
									value="hidratado"
								/> Hidratado</label
							><label
								><input
									type="radio"
									name="hidrat"
									value="desid-leve"
								/> Desidratação leve (3–5%)</label
							><label
								><input
									type="radio"
									name="hidrat"
									value="desid-mod"
								/> Desidratação moderada (6–9%)</label
							><label
								><input
									type="radio"
									name="hidrat"
									value="desid-grave"
								/> Desidratação grave (≥10%)</label
							>
						</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Lágrimas presentes</label
							><label class="chip"
								><input type="checkbox" />Mucosas úmidas</label
							><label class="chip"
								><input type="checkbox" />Mucosas ressecadas</label
							><label class="chip"
								><input type="checkbox" />Turgor normal</label
							><label class="chip"
								><input type="checkbox" />Turgor reduzido</label
							><label class="chip"
								><input type="checkbox" />Fontanela normal</label
							><label class="chip"
								><input type="checkbox" />Fontanela deprimida</label
							><label class="chip"
								><input type="checkbox" />Enoftalmia</label
							>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Estado Nutricional</div>
						<div class="option-row">
							<label
								><input
									type="radio"
									name="nutri"
									value="eutrofico"
								/> Eutrófico</label
							><label
								><input
									type="radio"
									name="nutri"
									value="sobrepeso"
								/> Sobrepeso</label
							><label
								><input
									type="radio"
									name="nutri"
									value="obeso"
								/> Obeso</label
							><label
								><input
									type="radio"
									name="nutri"
									value="emagrecido"
								/> Emagrecido</label
							><label
								><input
									type="radio"
									name="nutri"
									value="marasmo"
								/> Marasmo</label
							><label
								><input
									type="radio"
									name="nutri"
									value="kwash"
								/> Kwashiorkor</label
							>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Pele, Anexos e Subcutâneo</div>
						<div class="fields">
							<div class="field">
								<label>Lesões cutâneas / erupções</label
								><textarea
									placeholder="Tipo, localização, distribuição…"
								></textarea>
							</div>
							<div class="field">
								<label>Alterações vasculares</label><textarea
									placeholder="Telangiectasias, hemangiomas, petéquias, equimoses, circulação colateral…"
								></textarea>
							</div>
							<div class="field">
								<label>Unhas</label><input
									type="text"
									placeholder="Cor, cianose, estrias, paroníquia…"
								/>
							</div>
							<div class="field">
								<label>Cabelos</label><input
									type="text"
									placeholder="Distribuição, textura, coloração…"
								/>
							</div>
							<div class="field span-2">
								<label>Edema / outros achados cutâneos</label
								><input
									type="text"
									placeholder="Localização, godet, xantomas, cicatrizes…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·3 · Linfonodos -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s11")}
				id="s11"
			>
				<div class="section-head" onclick={() => toggleSection("s11")}>
					<span class="section-num ef">EF · 03</span>
					<span class="section-title">Exame dos Linfonodos</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">
							Cadeias Avaliadas — Marcar as alteradas
						</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Pré-auriculares</label
							><label class="chip"
								><input
									type="checkbox"
								/>Retroauriculares</label
							><label class="chip"
								><input type="checkbox" />Occipitais</label
							><label class="chip"
								><input type="checkbox" />Ângulo da mandíbula</label
							><label class="chip"
								><input type="checkbox" />Submandibulares</label
							><label class="chip"
								><input type="checkbox" />Submentonianos</label
							><label class="chip"
								><input type="checkbox" />Cervicais anteriores</label
							><label class="chip"
								><input type="checkbox" />Cervicais posteriores</label
							><label class="chip"
								><input
									type="checkbox"
								/>Supraclaviculares</label
							><label class="chip"
								><input type="checkbox" />Axilares</label
							><label class="chip"
								><input type="checkbox" />Epitrocleares</label
							><label class="chip"
								><input type="checkbox" />Inguinais</label
							><label class="chip"
								><input type="checkbox" />Poplíteos</label
							>
						</div>
					</div>
					<div class="fields" style="margin-top:12px">
						<div class="field">
							<label>Tamanho dos linfonodos alterados</label
							><input
								type="text"
								placeholder="Ex: 1,5 cm / >2 cm (patológico)"
							/>
						</div>
						<div class="field">
							<label>Consistência</label><select
								><option value="">Selecione…</option><option
									>Fibroelástica (normal)</option
								><option>Endurecida</option><option
									>Pétrea</option
								><option>Flutuação presente</option></select
							>
						</div>
						<div class="field">
							<label>Mobilidade / Aderência</label><select
								><option value="">Selecione…</option><option
									>Móvel</option
								><option>Aderido aos planos vizinhos</option
								></select
							>
						</div>
						<div class="field">
							<label>Sinais flogísticos</label>
							<div class="option-row">
								<label><input type="checkbox" /> Dor</label
								><label><input type="checkbox" /> Calor</label
								><label
									><input type="checkbox" /> Eritema suprajacente</label
								><label
									><input type="checkbox" /> Flutuação</label
								>
							</div>
						</div>
						<div class="field">
							<label>Velocidade de crescimento</label><select
								><option value="">Selecione…</option><option
									>Dias (agudo)</option
								><option>Semanas</option><option
									>Meses (crônico)</option
								></select
							>
						</div>
						<div class="field">
							<label>Distribuição</label><select
								><option value="">Selecione…</option><option
									>Localizada (1 cadeia)</option
								><option
									>Generalizada (múltiplas cadeias)</option
								></select
							>
						</div>
						<div class="field span-2">
							<label>Observações</label><textarea
								placeholder="Linfadenopatia supraclavicular esquerda (sinal de Virchow), hepatoesplenomegalia associada…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·4 · Cabeça e Pescoço -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s12")}
				id="s12"
			>
				<div class="section-head" onclick={() => toggleSection("s12")}>
					<span class="section-num ef">EF · 04</span>
					<span class="section-title">Cabeça e Pescoço</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Crânio e Couro Cabeludo</div>
						<div class="fields">
							<div class="field">
								<label>Dimensões e conformação</label><input
									type="text"
									placeholder="Normocéfalo, micro, macrocefalia…"
								/>
							</div>
							<div class="field">
								<label>Suturas</label><input
									type="text"
									placeholder="Fechadas, abertas, craniossinostose…"
								/>
							</div>
							<div class="field">
								<label>Fontanela anterior (bregmática)</label
								><input
									type="text"
									placeholder="Dimensão, tensão, fechamento…"
								/>
							</div>
							<div class="field">
								<label>Fontanela posterior</label><input
									type="text"
									placeholder="Aberta / fechada…"
								/>
							</div>
							<div class="field span-2">
								<label
									>Couro cabeludo — lesões, ectoparasitoses,
									distribuição capilar</label
								><input
									type="text"
									placeholder="Normal / pediculose / tinea / seborreia…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Face</div>
						<div class="fields">
							<div class="field">
								<label>Simetria facial</label><input
									type="text"
									placeholder="Simétrica / assimétrica…"
								/>
							</div>
							<div class="field">
								<label>Movimentos faciais / paralisias</label
								><input
									type="text"
									placeholder="Normal / paresia facial…"
								/>
							</div>
							<div class="field span-2">
								<label
									>Edema de face / dismorfismos craniofaciais</label
								><input
									type="text"
									placeholder="Hipertelorismo, epicanto, hipognatismo, baixa implantação de orelhas…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Olhos</div>
						<div class="fields">
							<div class="field">
								<label>Tamanho / posição dos globos</label
								><input
									type="text"
									placeholder="Normal / exoftalmia / enoftalmia…"
								/>
							</div>
							<div class="field">
								<label>Pálpebras</label><input
									type="text"
									placeholder="Ptose, edema, infecções…"
								/>
							</div>
							<div class="field">
								<label>Conjuntiva e córnea</label><input
									type="text"
									placeholder="Hiperemia, secreção, opacidades…"
								/>
							</div>
							<div class="field">
								<label>Esclerótica</label><input
									type="text"
									placeholder="Branca / ictérica / azulada…"
								/>
							</div>
							<div class="field">
								<label
									>Pupilas (simetria, fotorreatividade,
									anisocoria)</label
								><input
									type="text"
									placeholder="Isocóricas, fotorreativas…"
								/>
							</div>
							<div class="field">
								<label
									>Estrabismo / nistagmo / movimentos oculares</label
								><input
									type="text"
									placeholder="Presente / ausente…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Orelhas</div>
						<div class="fields">
							<div class="field">
								<label>Tamanho e implantação</label><input
									type="text"
									placeholder="Normal / baixa implantação / malformação…"
								/>
							</div>
							<div class="field">
								<label>Secreção / sensibilidade</label><input
									type="text"
									placeholder="Otorreia, otalgia…"
								/>
							</div>
							<div class="field">
								<label
									>Otoscopia — conduto auditivo externo</label
								><input
									type="text"
									placeholder="Pérvio, cerume, hiperemia…"
								/>
							</div>
							<div class="field">
								<label>Otoscopia — membrana timpânica</label
								><input
									type="text"
									placeholder="Íntegra, triângulo luminoso, abaulamento, retração…"
								/>
							</div>
							<div class="field">
								<label>Mastóide</label><input
									type="text"
									placeholder="Normal / dor à palpação…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Nariz</div>
						<div class="fields">
							<div class="field">
								<label>Forma / septo</label><input
									type="text"
									placeholder="Normal / desvio de septo…"
								/>
							</div>
							<div class="field">
								<label>Batimento de asas do nariz</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="bater_asas"
											value="ausente"
										/> Ausente</label
									><label
										><input
											type="radio"
											name="bater_asas"
											value="presente"
										/> Presente</label
									>
								</div>
							</div>
							<div class="field">
								<label>Mucosa / secreções / epistaxe</label
								><input
									type="text"
									placeholder="Hiperemia, rinorreia hialina/purulenta…"
								/>
							</div>
							<div class="field">
								<label
									>Pólipos / tumores / seios paranasais</label
								><input
									type="text"
									placeholder="Presente / ausente…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Boca, Dentes e Faringe</div>
						<div class="fields">
							<div class="field">
								<label>Lábios</label><input
									type="text"
									placeholder="Coloração, fissuras, vesículas, edema…"
								/>
							</div>
							<div class="field">
								<label>Boca — odor, salivação, trisma</label
								><input
									type="text"
									placeholder="Normal / fétida / hipossalivação…"
								/>
							</div>
							<div class="field">
								<label>Dentes e gengiva</label><input
									type="text"
									placeholder="N.º dentes, cárie, sangramento gengival…"
								/>
							</div>
							<div class="field">
								<label>Mucosa oral</label><input
									type="text"
									placeholder="Normal / monilíase / petéquias / aftas…"
								/>
							</div>
							<div class="field">
								<label>Língua</label><input
									type="text"
									placeholder="Aspecto (geográfica, framboesa), macroglossia, anquiloglossia…"
								/>
							</div>
							<div class="field">
								<label>Palato</label><input
									type="text"
									placeholder="Íntegro / ogival / fenda palatina…"
								/>
							</div>
							<div class="field">
								<label>Amígdalas — tamanho e aspecto</label
								><input
									type="text"
									placeholder="Grau I–IV, hiperemia, exsudato…"
								/>
							</div>
							<div class="field">
								<label>Faringe posterior</label><input
									type="text"
									placeholder="Normal / hiperemia / secreção retrofaríngea…"
								/>
							</div>
							<div class="field">
								<label
									>Laringe — voz / rouquidão / estridor</label
								><input
									type="text"
									placeholder="Normal / rouca / estridor inspiratório…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Pescoço</div>
						<div class="fields">
							<div class="field">
								<label>Forma, simetria, mobilidade</label><input
									type="text"
									placeholder="Normal / torcicolo / rigidez…"
								/>
							</div>
							<div class="field">
								<label>Tireoide</label><input
									type="text"
									placeholder="Impalpável / bócio / nódulos…"
								/>
							</div>
							<div class="field">
								<label>Turgência jugular</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="turgencia"
											value="ausente"
										/> Ausente</label
									><label
										><input
											type="radio"
											name="turgencia"
											value="presente"
										/> Presente</label
									>
								</div>
							</div>
							<div class="field">
								<label>Pulsos carotídeos / sopros</label><input
									type="text"
									placeholder="Simétricos / sopro carotídeo…"
								/>
							</div>
							<div class="field span-2">
								<label>Tumorações / anomalias</label><input
									type="text"
									placeholder="Cisto branquial, higroma, fístulas…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·5 · Tórax -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s13")}
				id="s13"
			>
				<div class="section-head" onclick={() => toggleSection("s13")}>
					<span class="section-num ef">EF · 05</span>
					<span class="section-title"
						>Tórax e Sistema Respiratório</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Inspeção do Tórax</div>
						<div class="fields">
							<div class="field">
								<label>Forma e simetria</label><input
									type="text"
									placeholder="Simétrico, tórax em quilha, tórax escavado…"
								/>
							</div>
							<div class="field">
								<label
									>Desenvolvimento mamário (adolescentes)</label
								><input
									type="text"
									placeholder="Tanner I–V / ginecomastia…"
								/>
							</div>
							<div class="field">
								<label>Tipo respiratório</label><select
									><option value="">Selecione…</option><option
										>Abdominal (lactentes)</option
									><option>Torácico</option><option
										>Toracoabdominal</option
									><option>Nasal</option><option>Bucal</option
									></select
								>
							</div>
							<div class="field">
								<label>Frequência respiratória — ritmo</label
								><select
									><option value="">Selecione…</option><option
										>Eupneico</option
									><option>Taquipneico</option><option
										>Bradipneico</option
									><option>Kussmaul</option><option
										>Cheyne-Stokes</option
									><option>Biot</option></select
								>
							</div>
						</div>
						<div class="option-label" style="margin-top:8px">
							Sinais de esforço respiratório:
						</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Ausentes</label
							><label class="chip"
								><input type="checkbox" />Tiragem intercostal</label
							><label class="chip"
								><input type="checkbox" />Tiragem subcostal</label
							><label class="chip"
								><input type="checkbox" />Retração esternal</label
							><label class="chip"
								><input type="checkbox" />Retração de fúrcula</label
							><label class="chip"
								><input type="checkbox" />Hiperpneia</label
							><label class="chip"
								><input type="checkbox" />Uso de musculatura
								acessória</label
							>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Palpação</div>
						<div class="fields">
							<div class="field">
								<label>Expansibilidade torácica</label><input
									type="text"
									placeholder="Simétrica / assimétrica / reduzida…"
								/>
							</div>
							<div class="field">
								<label>Frêmito tóraco-vocal</label><input
									type="text"
									placeholder="Normal / aumentado / abolido…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Percussão</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Som claro pulmonar
								(normal)</label
							><label class="chip"
								><input type="checkbox" />Hipersonoridade /
								timpanismo</label
							><label class="chip"
								><input type="checkbox" />Submacicez</label
							><label class="chip"
								><input type="checkbox" />Macicez</label
							>
						</div>
						<div class="field" style="margin-top:8px">
							<label>Localização de alterações percussórias</label
							><input
								type="text"
								placeholder="Ex: macicez base direita…"
							/>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Ausculta Pulmonar</div>
						<div class="fields">
							<div class="field">
								<label>Murmúrio vesicular</label><select
									><option value="">Selecione…</option><option
										>Presente, simétrico e bem distribuído</option
									><option>Diminuído globalmente</option
									><option
										>Diminuído / abolido à direita</option
									><option
										>Diminuído / abolido à esquerda</option
									></select
								>
							</div>
							<div class="field">
								<label>Ruídos adventícios</label>
								<div class="chips">
									<label class="chip"
										><input
											type="checkbox"
										/>Ausentes</label
									><label class="chip"
										><input type="checkbox" />Roncos</label
									><label class="chip"
										><input type="checkbox" />Sibilos</label
									><label class="chip"
										><input type="checkbox" />Estertores
										finos</label
									><label class="chip"
										><input type="checkbox" />Estertores
										grossos</label
									><label class="chip"
										><input type="checkbox" />Sopro tubário</label
									><label class="chip"
										><input type="checkbox" />Atrito pleural</label
									>
								</div>
							</div>
							<div class="field span-2">
								<label
									>Observações (broncofonia, pectorilóquia,
									egofonia, localização…)</label
								><input type="text" placeholder="Descreva…" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·6 · Cardiovascular -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s14")}
				id="s14"
			>
				<div class="section-head" onclick={() => toggleSection("s14")}>
					<span class="section-num ef">EF · 06</span>
					<span class="section-title">Sistema Cardiovascular</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields">
						<div class="field">
							<label>Ictus cordis — localização</label><input
								type="text"
								placeholder="Ex: 5.º EIC linha hemiclavicular esquerda"
							/>
						</div>
						<div class="field">
							<label>Ictus — extensão / amplitude / frêmito</label
							><input
								type="text"
								placeholder="Normal / propulsivo / frêmito sistólico…"
							/>
						</div>
						<div class="field">
							<label>Ritmo cardíaco</label><select
								><option value="">Selecione…</option><option
									>Rítmico</option
								><option>Arrítmico</option><option
									>Irregular</option
								></select
							>
						</div>
						<div class="field">
							<label>Bulhas cardíacas</label><select
								><option value="">Selecione…</option><option
									>B1 e B2 normofonéticas, sem B3 ou B4</option
								><option>B1 hiperfonética</option><option
									>B1 hipofonética</option
								><option>B2 hiperfonética</option><option
									>B2 hipofonética</option
								><option>B3 presente</option><option
									>B4 presente</option
								></select
							>
						</div>
						<div class="field">
							<label>Sopro cardíaco</label><select
								><option value="">Selecione…</option><option
									>Ausente</option
								><option>Sistólico</option><option
									>Diastólico</option
								><option>Contínuo</option><option
									>Inocente / funcional</option
								></select
							>
						</div>
						<div class="field">
							<label
								>Sopro — intensidade (Grau I–VI) / foco /
								irradiação</label
							><input
								type="text"
								placeholder="Ex: Grau II/VI, foco pulmonar, sem irradiação…"
							/>
						</div>
						<div class="field span-2">
							<label
								>Pulsos periféricos — radiais, braquiais,
								femorais, pediosos</label
							><textarea
								placeholder="Simétricos, cheios, normais / pulso femoral diminuído (coarctação) / pulso em martelo d'água…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·7 · Abdome -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s15")}
				id="s15"
			>
				<div class="section-head" onclick={() => toggleSection("s15")}>
					<span class="section-num ef">EF · 07</span>
					<span class="section-title">Abdome</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Inspeção</div>
						<div class="fields">
							<div class="field">
								<label>Forma geral</label><select
									><option value="">Selecione…</option><option
										>Plano</option
									><option>Escavado</option><option
										>Globoso</option
									><option>Distendido</option></select
								>
							</div>
							<div class="field">
								<label>Cicatriz umbilical / hérnias</label
								><input
									type="text"
									placeholder="Normal / hérnia umbilical / hérnia epigástrica…"
								/>
							</div>
							<div class="field">
								<label
									>Circulação venosa superficial /
									peristaltismo visível</label
								><input
									type="text"
									placeholder="Ausente / presente…"
								/>
							</div>
							<div class="field">
								<label>Pele abdominal</label><input
									type="text"
									placeholder="Coloração, brilho, enrugamento, estrias, cicatrizes…"
								/>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Ausculta</div>
						<div class="fields">
							<div class="field">
								<label>Ruídos hidroaéreos / borborismos</label
								><select
									><option value="">Selecione…</option><option
										>Presentes, normais</option
									><option
										>Aumentados (hiperperistaltismo)</option
									><option>Diminuídos</option><option
										>Ausentes (silêncio abdominal)</option
									></select
								>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Percussão</div>
						<div class="chips">
							<label class="chip"
								><input type="checkbox" />Timpanismo (normal)</label
							><label class="chip"
								><input type="checkbox" />Macicez hepática
								normal</label
							><label class="chip"
								><input type="checkbox" />Macicez esplênica
								normal</label
							><label class="chip"
								><input type="checkbox" />Macicez em flancos
								(ascite)</label
							><label class="chip"
								><input type="checkbox" />Timpanismo
								generalizado</label
							>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Palpação</div>
						<div class="fields">
							<div class="field">
								<label
									>Parede abdominal — tensão / resistência</label
								><input
									type="text"
									placeholder="Flácida, depressível / defesa / rigidez…"
								/>
							</div>
							<div class="field">
								<label>Dor à palpação</label><input
									type="text"
									placeholder="Ausente / localização e caráter…"
								/>
							</div>
							<div class="field">
								<label>Fígado</label><input
									type="text"
									placeholder="Não palpável / hepatomegalia X cm abaixo do RCD…"
								/>
							</div>
							<div class="field">
								<label>Baço</label><input
									type="text"
									placeholder="Não palpável / esplenomegalia…"
								/>
							</div>
							<div class="field">
								<label>Massas / tumorações</label><input
									type="text"
									placeholder="Ausentes / localização, tamanho, consistência…"
								/>
							</div>
							<div class="field">
								<label
									>Ascite (sinal do piparote / macicez móvel)</label
								>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="ascite"
											value="ausente"
										/> Ausente</label
									><label
										><input
											type="radio"
											name="ascite"
											value="presente"
										/> Presente</label
									>
								</div>
							</div>
							<div class="field span-2">
								<label>Punho-percussão lombar (rins)</label
								><input
									type="text"
									placeholder="Negativa bilateral / positiva direita / positiva esquerda…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·8 · Gênito-urinário (Personalizado por Sexo) -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s16")}
				id="s16"
			>
				<div class="section-head" onclick={() => toggleSection("s16")}>
					<span class="section-num ef">EF · 08</span>
					<span class="section-title">
						Gênito-urinário e Região Perineal
						{#if sexo === "M"}
							<span class="sexo-indicator male">♂ Masculino</span
							>
						{:else if sexo === "F"}
							<span class="sexo-indicator female"
								>♀ Feminino</span
							>
						{/if}
					</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					{#if !sexo}
						<div class="sexo-hint-box">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								><circle cx="12" cy="12" r="10" /><line
									x1="12"
									y1="16"
									x2="12"
									y2="12"
								/><line x1="12" y1="8" x2="12.01" y2="8" /></svg
							>
							<span
								>Selecione o sexo do paciente na Identificação
								para filtrar automaticamente o exame genital.</span
							>
						</div>
					{/if}

					<!-- Genitália Masculina (exibe se M ou se não selecionado) -->
					{#if sexo === "M" || !sexo}
						<div class="sub">
							<div class="sub-title">
								Genitália Masculina
								{#if !sexo}<span
										style="font-size:10px; color:#64748b; font-weight:normal;"
										>(Meninos)</span
									>{/if}
							</div>
							<div class="fields">
								<div class="field">
									<label>Pênis — fimose</label><input
										type="text"
										placeholder="Grau de exposição da glande, prepúcio retrátil…"
									/>
								</div>
								<div class="field">
									<label>Hipospádia / epispádia</label>
									<div class="option-row">
										<label
											><input
												type="radio"
												name="hipospadias"
												value="ausente"
											/> Ausente</label
										>
										<label
											><input
												type="radio"
												name="hipospadias"
												value="presente"
											/> Presente</label
										>
									</div>
								</div>
								<div class="field">
									<label>Bolsa escrotal — testículos</label
									><input
										type="text"
										placeholder="Bilateralmente tópicos, consistência, volume…"
									/>
								</div>
								<div class="field">
									<label
										>Criptorquidia / testículo retrátil /
										ectópico</label
									><input
										type="text"
										placeholder="Ausente / presente — localização…"
									/>
								</div>
								<div class="field">
									<label>Hidrocele / cisto de cordão</label>
									<div class="option-row">
										<label
											><input
												type="radio"
												name="hidrocele"
												value="ausente"
											/> Ausente</label
										>
										<label
											><input
												type="radio"
												name="hidrocele"
												value="presente"
											/> Presente</label
										>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Genitália Feminina (exibe se F ou se não selecionado) -->
					{#if sexo === "F" || !sexo}
						<div class="sub">
							<div class="sub-title">
								Genitália Feminina
								{#if !sexo}<span
										style="font-size:10px; color:#64748b; font-weight:normal;"
										>(Meninas)</span
									>{/if}
							</div>
							<div class="fields">
								<div class="field">
									<label>Clitóris</label><input
										type="text"
										placeholder="Tamanho e características…"
									/>
								</div>
								<div class="field">
									<label>Lábios maiores e menores</label
									><input
										type="text"
										placeholder="Normal / sinéquia de pequenos lábios…"
									/>
								</div>
								<div class="field">
									<label
										>Sinais inflamatórios / corrimento
										vaginal</label
									><input
										type="text"
										placeholder="Ausente / tipo de corrimento…"
									/>
								</div>
								<div class="field">
									<label
										>Aspecto do hímen / anomalias congênitas</label
									><input
										type="text"
										placeholder="Normal / imperfurado…"
									/>
								</div>
							</div>
						</div>
					{/if}

					<!-- Estadiamento de Tanner -->
					<div class="sub">
						<div class="sub-title">
							Estadiamento de Tanner (adolescentes)
						</div>
						<div class="fields cols-3">
							{#if sexo === "F" || !sexo}
								<div class="field">
									<label>Mamas (M)</label><input
										type="text"
										placeholder="M1–M5"
									/>
								</div>
							{/if}
							<div class="field">
								<label>Pelos pubianos (P)</label><input
									type="text"
									placeholder="P1–P5"
								/>
							</div>
							{#if sexo === "M" || !sexo}
								<div class="field">
									<label>Genitália masculina (G)</label><input
										type="text"
										placeholder="G1–G5"
									/>
								</div>
							{/if}
						</div>
					</div>

					<!-- Região Anal e Perineal -->
					<div class="sub">
						<div class="sub-title">Região Anal e Perineal</div>
						<div class="fields">
							<div class="field">
								<label>Ânus</label><input
									type="text"
									placeholder="Normal / fissuras / fístulas / abscesso / anomalias anorretais…"
								/>
							</div>
							<div class="field">
								<label>Prolapso retal / pólipos</label><input
									type="text"
									placeholder="Ausente / presente…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·9 · Locomotor -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s17")}
				id="s17"
			>
				<div class="section-head" onclick={() => toggleSection("s17")}>
					<span class="section-num ef">EF · 09</span>
					<span class="section-title">Sistema Locomotor</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="sub">
						<div class="sub-title">Extremidades</div>
						<div class="fields">
							<div class="field">
								<label>Mobilidade dos quatro membros</label
								><input
									type="text"
									placeholder="Preservada / limitada — especificar…"
								/>
							</div>
							<div class="field">
								<label
									>Sinais inflamatórios articulares (artrites,
									miosites)</label
								><input
									type="text"
									placeholder="Ausentes / articulação acometida…"
								/>
							</div>
							<div class="field">
								<label>Deformidades</label>
								<div class="chips">
									<label class="chip"
										><input
											type="checkbox"
										/>Ausentes</label
									><label class="chip"
										><input type="checkbox" />Genu varo</label
									><label class="chip"
										><input type="checkbox" />Genu valgo</label
									><label class="chip"
										><input type="checkbox" />Pé plano</label
									><label class="chip"
										><input
											type="checkbox"
										/>Polidactilia</label
									><label class="chip"
										><input
											type="checkbox"
										/>Sindactilia</label
									>
								</div>
							</div>
							<div class="field">
								<label>Marcha</label><select
									><option value="">Selecione…</option><option
										>Normal</option
									><option>Atáxica</option><option
										>Claudicante</option
									><option>Espástica</option><option
										>Em tesoura</option
									><option>Escarvante</option></select
								>
							</div>
							<div class="field">
								<label>Edema de membros inferiores</label>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="edema_mmii"
											value="ausente"
										/> Ausente</label
									><label
										><input
											type="radio"
											name="edema_mmii"
											value="presente"
										/> Presente</label
									>
								</div>
							</div>
							<div class="field">
								<label
									>Manobra de Ortolani (RN / lactentes)</label
								>
								<div class="option-row">
									<label
										><input
											type="radio"
											name="ortolani"
											value="negativa"
										/> Negativa</label
									><label
										><input
											type="radio"
											name="ortolani"
											value="positiva"
										/> Positiva</label
									><label
										><input
											type="radio"
											name="ortolani"
											value="na"
										/> N/A</label
									>
								</div>
							</div>
						</div>
					</div>
					<div class="sub">
						<div class="sub-title">Coluna Vertebral</div>
						<div class="fields">
							<div class="field">
								<label>Alinhamento</label>
								<div class="chips">
									<label class="chip"
										><input type="checkbox" />Normal</label
									><label class="chip"
										><input
											type="checkbox"
										/>Escoliose</label
									><label class="chip"
										><input type="checkbox" />Cifose</label
									><label class="chip"
										><input type="checkbox" />Lordose
										acentuada</label
									><label class="chip"
										><input
											type="checkbox"
										/>Opistótono</label
									>
								</div>
							</div>
							<div class="field">
								<label>Mobilidade / dor à palpação</label><input
									type="text"
									placeholder="Normal / limitada / ponto de dor…"
								/>
							</div>
							<div class="field span-2">
								<label
									>Anomalias (cistos, dimple sacral, tufo de
									pelo, espinha bífida, mielomeningocele)</label
								><input
									type="text"
									placeholder="Ausentes / presente — descrever…"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- EF·10 · Neurológico -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s18")}
				id="s18"
			>
				<div class="section-head" onclick={() => toggleSection("s18")}>
					<span class="section-num ef">EF · 10</span>
					<span class="section-title">Exame Neurológico</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="fields">
						<div class="field">
							<label>Nível de consciência</label><select
								><option value="">Selecione…</option><option
									>Alerta</option
								><option>Obnubilado</option><option
									>Sonolento</option
								><option>Estupor</option><option>Coma</option
								></select
							>
						</div>
						<div class="field">
							<label>Escala de Glasgow</label><input
								type="text"
								placeholder="Ex: 15 (AO4, RV5, RM6)"
							/>
						</div>
						<div class="field">
							<label>Estigmas neurocutâneos (pele)</label><input
								type="text"
								placeholder="Manchas café-com-leite, hipocromias, adenomas sebáceos…"
							/>
						</div>
						<div class="field">
							<label>Tônus muscular</label><select
								><option value="">Selecione…</option><option
									>Normal (normotônico)</option
								><option>Hipotônico</option><option
									>Hipertônico / espástico</option
								><option>Hipertônico / rígido</option></select
							>
						</div>
						<div class="field">
							<label>Força muscular</label><input
								type="text"
								placeholder="Preservada / paresia / plegia — localização…"
							/>
						</div>
						<div class="field">
							<label>Reflexos osteotendinosos (ROTs)</label><input
								type="text"
								placeholder="Presentes e simétricos / hiporreflexia / hiper-reflexia…"
							/>
						</div>
						<div class="field">
							<label>Coordenação e equilíbrio</label><input
								type="text"
								placeholder="Normal / dismetria / ataxia…"
							/>
						</div>
						<div class="field">
							<label>Sensibilidade superficial e profunda</label
							><input
								type="text"
								placeholder="Normal / hipoestesia / parestesia…"
							/>
						</div>
						<div class="field">
							<label>Pares cranianos</label><input
								type="text"
								placeholder="Sem alterações / especificar par acometido…"
							/>
						</div>
						<div class="field">
							<label
								>Reflexos primitivos e posturais (RN/lactentes)</label
							><textarea
								placeholder="Sucção, Moro, Preensão palmar/plantar, Galant, Marcha reflexa…"
							></textarea>
						</div>
						<div class="field">
							<label>Sinais de irritação meníngea</label>
							<div class="option-row">
								<label
									><input
										type="radio"
										name="meningeo"
										value="ausentes"
									/> Ausentes</label
								><label
									><input
										type="radio"
										name="meningeo"
										value="presentes"
									/> Presentes</label
								>
							</div>
						</div>
						<div class="field">
							<label
								>Se presentes — especificar (Brudzinski, Kernig,
								Lasègue)</label
							><input type="text" placeholder="Descreva…" />
						</div>
					</div>
				</div>
			</div>

			<!-- ══ BLOCO 3 — AVALIAÇÃO ══ -->
			<div id="avaliacao" class="anchor"></div>

			<div
				class="section"
				class:collapsed={collapsedSections.has("s19")}
				id="s19"
			>
				<div class="section-head" onclick={() => toggleSection("s19")}>
					<span class="section-num av">AVALIAÇÃO</span>
					<span class="section-title">Hipóteses Diagnósticas</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="dx-block">
						<div class="dx-header">
							<label>Diagnóstico Vacinal</label>
							<div class="dx-actions">
								<button
									type="button"
									class="btn-dx"
									onclick={() =>
										fillDx(
											"dx-vacinal",
											"Calendário vacinal atualizado para a idade.",
										)}>Normal</button
								>
							</div>
						</div>
						<textarea
							id="dx-vacinal"
							rows="2"
							placeholder="Ex: Calendário vacinal atualizado / vacinas X e Y em atraso."
						></textarea>
					</div>
					<div class="dx-block">
						<div class="dx-header">
							<label>Diagnóstico Neuropsicomotor</label>
							<div class="dx-actions">
								<button
									type="button"
									class="btn-dx"
									onclick={() =>
										fillDx(
											"dx-neuro",
											"DNPM adequado para a idade. Marcos do desenvolvimento dentro do esperado.",
										)}>Normal</button
								><button
									type="button"
									class="btn-dx"
									onclick={() =>
										fillDx(
											"dx-neuro",
											"Alerta para atraso no desenvolvimento — necessita reavaliação.",
										)}>Alerta</button
								><button
									type="button"
									class="btn-dx"
									onclick={() =>
										fillDx(
											"dx-neuro",
											"Atraso no desenvolvimento neuropsicomotor.",
										)}>Atraso</button
								>
							</div>
						</div>
						<textarea
							id="dx-neuro"
							rows="2"
							placeholder="Ex: Atraso no desenvolvimento da linguagem. Denver II suspeito na área pessoal-social."
						></textarea>
					</div>
					<div class="dx-block">
						<div class="dx-header">
							<label>Diagnóstico Nutricional</label>
							<div class="dx-actions">
								<button
									type="button"
									class="btn-dx"
									onclick={() =>
										fillDx(
											"dx-nutricional",
											"Eutrófico para a idade.",
										)}>Normal</button
								>
							</div>
						</div>
						<textarea
							id="dx-nutricional"
							rows="2"
							placeholder="Ex: Eutrófico para idade. IMC no percentil 50."
						></textarea>
					</div>
					<div class="dx-block">
						<label
							>Diagnóstico Clínico — Hipótese(s) Principal(ais)</label
						><textarea
							rows="3"
							placeholder="Ex: Transtorno do Espectro Autista (F84.0); Atraso na aquisição da linguagem…"
						></textarea>
					</div>

					<!-- Card de Consulta Rápida: QP, HMA e Queixas Secundárias posicionado logo abaixo do Diagnóstico Clínico -->
					<div class="hda-review-container">
						<button
							type="button"
							class="hda-review-header"
							onclick={toggleHdaSummary}
						>
							<div class="hda-review-title">
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									><path
										d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
									/><polyline points="14 2 14 8 20 8" /><line
										x1="16"
										y1="13"
										x2="8"
										y2="13"
									/><line
										x1="16"
										y1="17"
										x2="8"
										y2="17"
									/><polyline points="10 9 9 9 8 9" /></svg
								>
								<span
									>Revisar QP, HDA e Queixas Secundárias</span
								>
							</div>
							<div
								style="display:flex; align-items:center; gap:8px;"
							>
								<span class="hda-badge">
									{queixaPrincipal ||
									hdaPrincipal ||
									secondaryComplaints.length > 0
										? "Preenchido"
										: "Vazio"}
								</span>
								<svg
									viewBox="0 0 24 24"
									width="14"
									height="14"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									style="transform: {hdaSummaryVisible
										? 'rotate(180deg)'
										: 'rotate(0)'}; transition: transform .2s;"
									><polyline points="6 9 12 15 18 9" /></svg
								>
							</div>
						</button>
						{#if hdaSummaryVisible}
							<div class="hda-review-body">
								{#if queixaPrincipal.trim() || hdaPrincipal.trim() || secondaryComplaints.some((c) => c.queixa.trim() || c.evolucao.trim())}
									{#if queixaPrincipal.trim()}
										<div class="hda-summary-item">
											<div class="hda-summary-label">
												Queixa Principal (QP):
											</div>
											<div class="hda-summary-text qp">
												{queixaPrincipal.trim()}
											</div>
										</div>
									{/if}
									{#if hdaPrincipal.trim()}
										<div class="hda-summary-item">
											<div class="hda-summary-label">
												História da Doença Atual (HDA):
											</div>
											<div class="hda-summary-text">
												{hdaPrincipal.trim()}
											</div>
										</div>
									{/if}
									{#each secondaryComplaints as sec, idx}
										{#if sec.queixa.trim() || sec.evolucao.trim()}
											<div class="hda-summary-item">
												<div class="hda-summary-label">
													Queixa Secundária #{idx +
														1}: {sec.queixa.trim()}
												</div>
												{#if sec.evolucao.trim()}
													<div
														class="hda-summary-text"
													>
														{sec.evolucao.trim()}
													</div>
												{/if}
											</div>
										{/if}
									{/each}
								{:else}
									<div class="hda-summary-empty">
										<em
											>Nenhuma informação preenchida em
											Queixa Principal ou HDA. Preencha a
											Seção 01 da Anamnese para consultar
											aqui.</em
										>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<div class="dx-block">
						<label>Diagnósticos Diferenciais</label><textarea
							rows="3"
							placeholder="Liste as hipóteses alternativas em ordem de probabilidade…"
						></textarea>
					</div>

					<div
						style="background:var(--accent-light); border:1px solid var(--border); border-radius:8px; padding:12px 14px; margin-bottom:10px"
					>
						<div
							style="font-size:12px; font-weight:600; color:#333; margin-bottom:10px"
						>
							Diagnóstico de Risco — marcar se aplicável
						</div>
						<div class="risk-group">
							<div class="risk-group-title">
								1 · Evidência ou suspeita de violência
							</div>
							<div class="risk-items">
								<label class="risk-item"
									><input type="checkbox" /> Negligência / Abandono</label
								><label class="risk-item"
									><input type="checkbox" /> Abuso e maus-tratos
									na família e nas instituições</label
								><label class="risk-item"
									><input type="checkbox" /> Exploração e abuso
									sexual</label
								><label class="risk-item"
									><input type="checkbox" /> Trabalho abusivo e
									explorador</label
								><label class="risk-item"
									><input type="checkbox" /> Tráfico de crianças
									e adolescentes</label
								><label class="risk-item"
									><input type="checkbox" /> Uso e tráfico de drogas</label
								><label class="risk-item"
									><input type="checkbox" /> Conflito com a lei</label
								>
							</div>
						</div>
						<div class="risk-group">
							<div class="risk-group-title">
								2 · Risco pelo período perinatal
							</div>
							<div class="risk-items">
								<label class="risk-item"
									><input type="checkbox" /> Peso ao nascer &lt;
									2.500 g (baixo peso)</label
								><label class="risk-item"
									><input type="checkbox" /> Prematuridade</label
								><label class="risk-item"
									><input type="checkbox" /> Asfixia (Apgar &lt;
									7 no 5.º minuto)</label
								><label class="risk-item"
									><input type="checkbox" /> Internação do RN em
									UI/UTI após alta materna</label
								><label class="risk-item"
									><input type="checkbox" /> Criança manifestamente
									indesejada</label
								><label class="risk-item"
									><input type="checkbox" /> Não comparecimento
									para o Teste do Pezinho</label
								><label class="risk-item"
									><input type="checkbox" /> Falha em triagem neonatal
									sem acompanhamento</label
								>
							</div>
						</div>
						<div class="risk-group">
							<div class="risk-group-title">
								3 · Falha no acompanhamento de puericultura
							</div>
							<div class="risk-items">
								<label class="risk-item"
									><input type="checkbox" /> Vacinas em atraso</label
								><label class="risk-item"
									><input type="checkbox" /> Menor de 6 meses não
									amamenta no peito</label
								><label class="risk-item"
									><input type="checkbox" /> Menor de 1 ano sem
									acompanhamento pediátrico</label
								><label class="risk-item"
									><input type="checkbox" /> Criança desnutrida</label
								>
							</div>
						</div>
						<div class="risk-group">
							<div class="risk-group-title">
								4 · Evidência de risco por patologias prévias
							</div>
							<div class="risk-items">
								<label class="risk-item"
									><input type="checkbox" /> Grande frequência
									em serviços de urgência</label
								><label class="risk-item"
									><input type="checkbox" /> Criança hospitalizada
									mais de 1 vez/ano</label
								><label class="risk-item"
									><input type="checkbox" /> Egresso de internação
									hospitalar recente</label
								><label class="risk-item"
									><input type="checkbox" /> História de desnutrição
									em outros filhos da família</label
								><label class="risk-item"
									><input type="checkbox" /> Criança com anemia
									ou sinais de hipovitaminose</label
								><label class="risk-item"
									><input type="checkbox" /> Criança com sobrepeso
									/ obesidade</label
								><label class="risk-item"
									><input type="checkbox" /> Criança com diarreia
									persistente ou recorrente</label
								><label class="risk-item"
									><input type="checkbox" /> Criança com asma sem
									acompanhamento</label
								>
							</div>
						</div>
						<div class="risk-group">
							<div class="risk-group-title">
								5 · Risco familiar e socioambiental
							</div>
							<div class="risk-items">
								<label class="risk-item"
									><input type="checkbox" /> Mãe adolescente abaixo
									de 16 anos</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe analfabeta ou
									com baixa instrução (&lt; 4 anos de escola)</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe sem suporte ou
									apoio familiar</label
								><label class="risk-item"
									><input type="checkbox" /> Família sem fonte
									de renda mínima regular</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe com deficiência
									que impossibilite o cuidado da criança</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe ou pai com história
									de problemas psiquiátricos</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe ou pai dependentes
									de álcool ou drogas ilícitas</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe residente em área
									sem saneamento básico</label
								><label class="risk-item"
									><input type="checkbox" /> Mãe residente em área
									social de risco</label
								><label class="risk-item"
									><input type="checkbox" /> História de migração
									da família há menos de 2 anos</label
								><label class="risk-item"
									><input type="checkbox" /> Morte de irmão menor
									de 5 anos</label
								>
							</div>
						</div>
						<div class="field" style="margin-top:10px">
							<label
								style="font-size:12px; color:#333; font-weight:600"
								>Observações sobre risco identificado</label
							><textarea
								style="border:1px solid var(--border); border-radius:6px; padding:6px 8px; font-family:var(--font); font-size:13px; width:100%; min-height:52px; resize:vertical; background:#fff;"
								placeholder="Descreva achados, encaminhamentos ao CRAS, CREAS, conselho tutelar…"
							></textarea>
						</div>
					</div>
				</div>
			</div>

			<!-- ══ EXAMES LABORATORIAIS ══ -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s-exames-lab")}
				id="s-exames-lab"
			>
				<div
					class="section-head"
					onclick={() => toggleSection("s-exames-lab")}
				>
					<span class="section-num ex">LAB</span>
					<span class="section-title">Exames Laboratoriais</span>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				{#if !collapsedSections.has("s-exames-lab")}
					<div class="section-body">
						<ExamesLaboratoriaisSection
							bind:exames={examesLaboratoriais}
							bind:dataColetaPadrao={dataColetaPadraoLab}
							sexoBiologico={sexo === "F" ? "F" : "M"}
						/>
					</div>
				{/if}
			</div>

			<!-- ══ EXAMES DE IMAGEM/FUNCIONAIS ══ -->
			<div
				class="section"
				class:collapsed={collapsedSections.has("s-exames-imagem")}
				id="s-exames-imagem"
			>
				<div
					class="section-head"
					onclick={() => toggleSection("s-exames-imagem")}
				>
					<span class="section-num ex">IMAGEM</span>
					<span class="section-title"
						>Resultados de Exames de Imagem / Funcionais</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					{#each examesImagem as exame, i (exame.id)}
						<div class="exame-card">
							<div class="exame-card-header">
								<span class="exame-card-num"
									>Exame #{i + 1}</span
								>
								<button
									type="button"
									class="btn-dx"
									onclick={() => removeExameImagem(exame.id)}
									>✕ Remover</button
								>
							</div>
							<div class="fields cols-3">
								<div class="field span-2">
									<label>Nome do exame</label><input
										type="text"
										bind:value={exame.nome}
										placeholder="Ex: Radiografia de tórax PA, USG abdominal…"
									/>
								</div>
								<div class="field">
									<label>Data</label><input
										type="date"
										bind:value={exame.data}
									/>
								</div>
								<div class="field">
									<label>Nome do médico (laudador)</label
									><input
										type="text"
										bind:value={exame.medico}
										placeholder="Dr(a). Nome"
									/>
								</div>
								<div class="field span-2">
									<label>Resultado</label><textarea
										bind:value={exame.resultado}
										rows="3"
										placeholder="Descreva os achados do exame…"
									></textarea>
								</div>
							</div>
						</div>
					{/each}
					<button
						type="button"
						class="btn-add-exame"
						onclick={addExameImagem}
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							><line x1="12" y1="5" x2="12" y2="19" /><line
								x1="5"
								y1="12"
								x2="19"
								y2="12"
							/></svg
						>
						Adicionar Exame
					</button>
				</div>
			</div>

			<!-- ══ BLOCO 4 — CONDUTA ══ -->
			<div id="conduta" class="anchor"></div>

			<div
				class="section"
				class:collapsed={collapsedSections.has("s20")}
				id="s20"
			>
				<div class="section-head" onclick={() => toggleSection("s20")}>
					<span class="section-num cd">CONDUTA</span>
					<span class="section-title"
						>Plano Terapêutico e Orientações</span
					>
					<svg
						class="chevron"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						><polyline points="6 9 12 15 18 9" /></svg
					>
				</div>
				<div class="section-body">
					<div class="conduta-block">
						<label
							>Exames complementares solicitados (laboratoriais
							e/ou de imagem)</label
						><textarea
							rows="3"
							placeholder="Ex: Hemograma completo, PCR, Rx tórax PA…&#10;Avaliação audiológica (BERA)…"
						></textarea>
					</div>
					<div class="conduta-block">
						<label>Pareceres / Encaminhamentos especializados</label
						><textarea
							rows="3"
							placeholder="Ex: Fonoaudiologia, Neurologia Pediátrica, Psicologia, Fisioterapia…"
						></textarea>
					</div>
					<div class="conduta-block">
						<div class="conduta-label-row">
							<label>Prescrição — Tratamento Farmacológico</label>
							<a
								href="/prescricao"
								target="_blank"
								rel="noopener noreferrer"
								class="btn-prescricao-link"
								title="Abrir o módulo de emissão e impressão de receitas em nova aba"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10 9 9 9 8 9"></polyline>
								</svg>
								<span>Abrir Módulo de Prescrição ↗</span>
							</a>
						</div>
						<textarea
							bind:value={medPrescricao}
							rows="4"
							placeholder="Medicamento — dose — frequência — duração — via&#10;Ex: Amoxicilina 50 mg/kg/dia VO 8/8h por 7 dias"
						></textarea>
						<div class="conduta-actions-row">
							<MedicamentoModal
								bind:value={medPrescricao}
								placeholder="+ Adicionar medicamento"
								id="med-prescricao"
								context="prescricao"
							/>
						</div>
					</div>
					<div class="conduta-block">
						<label>Tratamento Não Farmacológico</label><textarea
							rows="3"
							placeholder="Ex: Estimulação da linguagem, terapia ocupacional, dieta modificada…"
						></textarea>
					</div>
					<div class="conduta-block">
						<label>Orientações ao responsável</label><textarea
							rows="4"
							placeholder="Orientações sobre a doença, sinais de alerta para retorno, cuidados em casa, alimentação, higiene, vacinação pendente…"
						></textarea>
					</div>
					<div class="conduta-block">
						<label>Retorno / seguimento</label><textarea
							rows="2"
							placeholder="Ex: Retorno em 15 dias ou antes se piora clínica. Próxima puericultura em…"
						></textarea>
					</div>

					<div
						style="margin-top:10px; border:1px solid var(--border-light); border-radius:8px; padding:12px 14px;"
					>
						<div
							style="font-size:12px; font-weight:600; color:var(--text-secondary); margin-bottom:8px; text-transform:uppercase; letter-spacing:.05em"
						>
							Assinatura e Identificação do Médico
						</div>
						<div class="fields cols-3">
							<div class="field span-2">
								<label>Nome completo do médico(a)</label><input
									type="text"
									placeholder="Dr(a). Nome"
								/>
							</div>
							<div class="field">
								<label>CRM</label><input
									type="text"
									placeholder="CRM/UF 000000"
								/>
							</div>
							<div class="field">
								<label>Data</label><input type="date" />
							</div>
							<div class="field">
								<label>Instituição / Serviço</label><input
									type="text"
									placeholder="Ex: UBS / Ambulatório de Pediatria / Hospital…"
								/>
							</div>
							<div class="field"></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Rodapé do Prontuário Pediátrico -->
			<footer class="prontuario-footer">
				<div class="prontuario-footer-inner">
					<span
						>MedicinaHub • Prontuário Pediátrico (100% Client-Side)</span
					>
					<a
						href="/politica-de-privacidade"
						target="_blank"
						class="footer-privacy-link"
						>Política de Privacidade & LGPD</a
					>
				</div>
			</footer>
		</div>
		<!-- /wrapper -->

		<!-- RIGHT SIDEBAR -->
		<aside class="sidebar-right" id="sidebarRight">
			<div class="side-panel-title">Referências e Manuais</div>
			<div class="ref-group">
				<div class="ref-group-label">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
						/><path
							d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
						/></svg
					>Cadernetas da Criança
				</div>
				<a
					href="https://drive.google.com/file/d/1YanA23b0CmvhvTV_ce73QEQEtTHt4FqS/view?usp=share_link"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Menina</a
				>
				<a
					href="https://bvsms.saude.gov.br/bvs/publicacoes/caderneta_crianca_menino_passaporte_cidadania_7ed.pdf"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Menino</a
				>
			</div>
			<hr class="ref-divider" />
			<div class="ref-group">
				<div class="ref-group-label">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
						/><circle cx="9" cy="7" r="4" /><path
							d="M23 21v-2a4 4 0 0 0-3-3.87"
						/><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg
					>Cadernetas do Adolescente
				</div>
				<a
					href="https://bvsms.saude.gov.br/bvs/publicacoes/caderneta_saude_adolescente_feminina_4ed1rempr.pdf"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Menina</a
				>
				<a
					href="https://bvsms.saude.gov.br/bvs/publicacoes/caderneta_saude_adolescente_masculino_4ed1rempr.pdf"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Menino</a
				>
			</div>
			<hr class="ref-divider" />
			<div class="ref-group">
				<div class="ref-group-label">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
						/><polyline points="14 2 14 8 20 8" /><line
							x1="16"
							y1="13"
							x2="8"
							y2="13"
						/><line x1="16" y1="17" x2="8" y2="17" /><polyline
							points="10 9 9 9 8 9"
						/></svg
					>Ferramentas e Escalas
				</div>
				<a
					href="https://mchatscreen.com/wp-content/uploads/2020/09/M-CHAT-R_F_Brazilian_Portuguese_v2.pdf"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>M-CHAT-R/F (Autismo)</a
				>
				<a
					href="https://www.sbp.com.br/departamentos/endocrinologia/graficos-de-crescimento/"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Curvas de crescimento</a
				>
				<a
					href="https://drive.google.com/file/d/1zxt2KOnQPyhLKHsMG6iOJDmdtoqrSJqO/view?usp=share_link"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Crescimento gestacional</a
				>
				<a
					href="https://www.sbp.com.br/fileadmin/user_upload/21635c-MO_-_Hipertensao_Arterial_Infanc_e_Adolesc.pdf"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Pressão arterial</a
				>
				<a
					href="https://sbim.org.br/calendario-de-vacinacao"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>SBIm</a
				>
				<a
					href="https://www.gov.br/saude/pt-br/vacinacao/calendario"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Calendário vacinal SUS</a
				>
				<a
					href="https://www.e-lactancia.org"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>e-Lactancia</a
				>
				<a
					href="https://uticalc.pitt.edu"
					target="_blank"
					class="ref-link"
					><svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
						/><polyline points="15 3 21 3 21 9" /><line
							x1="10"
							y1="14"
							x2="21"
							y2="3"
						/></svg
					>Calculadora de risco de ITU</a
				>
			</div>
		</aside>
	</div>
	<!-- /page-layout -->

	<!-- MODAL: Marcos do Desenvolvimento -->
	{#if marcosModalOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="modal-overlay"
			id="marcosModal"
			onclick={(e) => {
				if (e.target === e.currentTarget) marcosModalOpen = false;
			}}
		>
			<div class="modal-box">
				<div class="modal-header">
					<div style="display:flex; align-items:center; gap:10px;">
						<h2>Marcos do Desenvolvimento</h2>
						<span class="modal-age-badge">{ageBadgeText}</span>
					</div>
					<button
						class="modal-close"
						onclick={() => {
							marcosModalOpen = false;
						}}>×</button
					>
				</div>
				<div class="modal-body">
					{#if idadeEmMeses === null}
						<div class="modal-no-milestones">
							Preencha a data de nascimento para visualizar os
							marcos esperados.
						</div>
					{:else if relevantFaixas.length === 0}
						<div class="modal-no-milestones">
							Idade fora da faixa de marcos disponíveis (0–72
							meses).
						</div>
					{:else}
						{#each relevantFaixas as faixa}
							{@const marcosGrupo = MARCOS.filter(
								(m) =>
									m.minMeses >= faixa.min &&
									m.minMeses < faixa.max,
							)}
							{#if marcosGrupo.length > 0}
								<div class="milestone-group">
									<div class="milestone-group-title">
										{faixa.label}
										<span class="age-range"
											>{faixa.min}–{faixa.max} meses</span
										>
									</div>
									{#each marcosGrupo as m, i}
										{@const key = `marco_${faixa.min}_${i}`}
										{@const isExpected =
											idadeEmMeses !== null &&
											idadeEmMeses >= m.minMeses}
										<div
											class="milestone-item"
											style:opacity={isExpected
												? "1"
												: ".55"}
										>
											<input
												type="checkbox"
												id={key}
												checked={savedMilestones.has(
													key,
												)}
												onchange={(e) =>
													toggleMilestone(
														key,
														(
															e.target as HTMLInputElement
														).checked,
													)}
											/>
											<label
												for={key}
												class="milestone-item-content"
											>
												<div
													class="milestone-item-name"
												>
													{m.nome}{#if !isExpected}
														<span
															style="font-size:10px;color:#999"
															>(ainda não
															esperado)</span
														>{/if}
												</div>
												<div
													class="milestone-item-desc"
												>
													{m.desc}
												</div>
											</label>
										</div>
									{/each}
								</div>
							{/if}
						{/each}
					{/if}
				</div>
				<div style="padding:0 20px 16px;">
					<div class="milestone-obs">
						<label for="marcosObsInput"
							>Observações gerais sobre marcos do desenvolvimento</label
						>
						<textarea
							id="marcosObsInput"
							bind:value={marcosObs}
							placeholder="Registre achados relevantes, marcos ausentes, necessidade de encaminhamento…"
						></textarea>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap");

	:root {
		--bg: #f0f4f8;
		--surface: #ffffff;
		--border: #d1d9e0;
		--border-light: #e2e8f0;
		--text: #0f172a;
		--text-secondary: #64748b;
		--accent: #0f766e;
		--accent-light: #f0fdfa;
		--accent-mid: #0d9488;
		--accent-teal: #0d9488;
		--red: #dc2626;
		--red-light: #fef2f2;
		--green: #16a34a;
		--green-light: #f0fdf4;
		--yellow-light: #fffbeb;
		--yellow-border: #fcd34d;
		--section-1: #0f766e;
		--section-2: #0e7490;
		--section-3: #7c3aed;
		--section-4: #c2410c;
		--radius: 10px;
		--shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
		--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.08),
			0 1px 3px rgba(0, 0, 0, 0.04);
		--font: "Inter", system-ui, -apple-system, sans-serif;
		--mono: "IBM Plex Mono", monospace;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}
	:global(body) {
		font-family: var(--font);
		background: var(--bg);
		color: var(--text);
		font-size: 13.5px;
		line-height: 1.6;
	}

	/* ── TOAST ── */
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

	/* ── TOP BAR ── */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(15, 23, 42, 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		color: #fff;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 20px;
		height: 56px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
	}
	.topbar-back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: rgba(255, 255, 255, 0.85);
		text-decoration: none;
		font-weight: 600;
		font-size: 12.5px;
		background: rgba(255, 255, 255, 0.1);
		padding: 5px 12px;
		border-radius: 8px;
		margin-right: 8px;
		transition: background 0.15s;
	}
	.topbar-back:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	.topbar-brand {
		font-weight: 700;
		font-size: 14px;
		letter-spacing: -0.01em;
		margin-right: 8px;
		white-space: nowrap;
	}
	.topbar-brand span {
		font-weight: 300;
		opacity: 0.65;
	}
	.topbar-patient-card {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid rgba(56, 189, 248, 0.4);
		border-radius: 8px;
		padding: 4px 10px;
		font-size: 12px;
		color: #fff;
		margin-right: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		max-width: 480px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		animation: slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		flex-shrink: 0;
	}
	@keyframes slideDownFade {
		from {
			opacity: 0;
			transform: translateY(-5px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	.t-patient-name {
		font-weight: 700;
		color: #38bdf8;
		max-width: 170px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.t-patient-pill {
		background: rgba(56, 189, 248, 0.2);
		color: #e0f2fe;
		padding: 2px 7px;
		border-radius: 5px;
		font-size: 11px;
		font-weight: 600;
		border: 1px solid rgba(56, 189, 248, 0.35);
	}
	.t-patient-resp {
		color: #cbd5e1;
		font-size: 11.5px;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.topbar-nav {
		display: flex;
		gap: 3px;
		flex: 1;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.topbar-nav::-webkit-scrollbar {
		display: none;
	}
	.nav-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 24px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-size: 12.5px;
		font-weight: 500;
		white-space: nowrap;
		transition: all 0.2s;
	}
	.nav-pill:hover,
	.nav-pill.active {
		background: rgba(255, 255, 255, 0.15);
		color: #fff;
	}
	.nav-pill .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.6;
	}

	.btn-action {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 8px;
		font-family: var(--font);
		font-size: 12px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.btn-action svg {
		flex-shrink: 0;
	}
	.btn-copy {
		background: linear-gradient(135deg, #0d9488, #0f766e);
		color: #fff;
	}
	.btn-copy:hover {
		background: linear-gradient(135deg, #14b8a6, #0d9488);
		box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
	}
	.btn-pdf {
		background: #fff;
		color: var(--accent);
	}
	.btn-pdf:hover {
		background: #f0fdfa;
	}
	.btn-reset {
		background: transparent;
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.25) !important;
	}
	.btn-reset:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5) !important;
	}

	/* ── LAYOUT ── */
	.page-layout {
		display: grid;
		grid-template-columns: 220px 1fr 220px;
		gap: 0;
		min-height: calc(100vh - 56px);
	}
	.wrapper {
		max-width: 880px;
		width: 100%;
		margin: 0 auto;
		padding: 28px 20px 60px;
		min-width: 0;
	}

	/* ── LEFT SIDEBAR ── */
	.sidebar-left {
		position: sticky;
		top: 56px;
		height: calc(100vh - 56px);
		overflow-y: auto;
		padding: 16px 0 24px 16px;
		border-right: 1px solid var(--border-light);
		background: #fff;
		scrollbar-width: thin;
		scrollbar-color: #ddd transparent;
	}
	.sidebar-left::-webkit-scrollbar {
		width: 4px;
	}
	.sidebar-left::-webkit-scrollbar-thumb {
		background: #ddd;
		border-radius: 2px;
	}
	.sidebar-left .side-nav-title {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #94a3b8;
		padding: 0 12px;
		margin-bottom: 12px;
	}
	.side-nav-group {
		margin-bottom: 14px;
	}
	.side-nav-group-label {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
		border-radius: 6px 0 0 6px;
		transition: all 0.15s;
	}
	.side-nav-group-label:hover {
		background: var(--accent-light);
		color: var(--accent);
	}
	.side-nav-group-label .side-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #cbd5e1;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.side-nav-group-label:hover .side-dot {
		background: var(--accent);
	}
	.side-nav-items {
		list-style: none;
		padding: 2px 0 0 24px;
	}
	.side-nav-items li a {
		display: block;
		padding: 3px 10px;
		font-size: 11.5px;
		color: #64748b;
		text-decoration: none;
		border-radius: 4px;
		transition: all 0.12s;
		line-height: 1.4;
	}
	.side-nav-items li a:hover {
		color: var(--accent);
		background: var(--accent-light);
	}

	/* ── RIGHT SIDEBAR ── */
	.sidebar-right {
		position: sticky;
		top: 56px;
		height: calc(100vh - 56px);
		overflow-y: auto;
		padding: 16px 16px 24px 0;
		border-left: 1px solid var(--border-light);
		background: #fff;
		scrollbar-width: thin;
		scrollbar-color: #ddd transparent;
	}
	.sidebar-right::-webkit-scrollbar {
		width: 4px;
	}
	.sidebar-right::-webkit-scrollbar-thumb {
		background: #ddd;
		border-radius: 2px;
	}
	.sidebar-right .side-panel-title {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #94a3b8;
		padding: 0 12px;
		margin-bottom: 12px;
	}
	.ref-group {
		margin-bottom: 14px;
		padding: 0 12px;
	}
	.ref-group-label {
		font-size: 11px;
		font-weight: 600;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.ref-group-label svg {
		flex-shrink: 0;
		color: #94a3b8;
	}
	.ref-link {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 8px;
		font-size: 11.5px;
		color: #64748b;
		text-decoration: none;
		border-radius: 6px;
		transition: all 0.15s;
		line-height: 1.35;
	}
	.ref-link:hover {
		background: var(--accent-light);
		color: var(--accent);
	}
	.ref-link svg {
		flex-shrink: 0;
		color: #94a3b8;
	}
	.ref-divider {
		border: none;
		border-top: 1px solid #f1f5f9;
		margin: 10px 12px;
	}

	/* ── PAGE HEADER ── */
	.page-header {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 20px 24px;
		margin-bottom: 20px;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
		box-shadow: var(--shadow);
	}
	.page-header .hfield {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.page-header label {
		font-size: 10.5px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}
	.page-header input[type="text"],
	.page-header input[type="date"] {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		font-family: var(--font);
		font-size: 13px;
		color: var(--text);
		background: #f8fafc;
		transition: all 0.15s;
	}
	.page-header input:focus {
		outline: none;
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
		background: #fff;
	}
	.hfield-wide {
		grid-column: 1 / -1;
	}
	.anchor {
		scroll-margin-top: 64px;
	}

	/* ── SECTION ── */
	.section {
		margin-bottom: 16px;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface);
		overflow: hidden;
		box-shadow: var(--shadow);
		transition: box-shadow 0.2s;
	}
	.section:hover {
		box-shadow: var(--shadow-lg);
	}
	.section-head {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 18px;
		cursor: pointer;
		user-select: none;
		border-bottom: 1px solid var(--border-light);
		transition: background 0.15s;
	}
	.section-head:hover {
		background: #f8fafc;
	}
	.section-num {
		font-family: var(--mono);
		font-size: 10px;
		font-weight: 600;
		color: #fff;
		background: var(--accent);
		padding: 3px 8px;
		border-radius: 5px;
		letter-spacing: 0.04em;
	}
	.section-num.ef {
		background: var(--section-2);
	}
	.section-num.av {
		background: var(--section-3);
	}
	.section-num.ex {
		background: #d97706;
	}
	.section-num.cd {
		background: var(--section-4);
	}
	.section-title {
		font-weight: 600;
		font-size: 14px;
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.chevron {
		width: 18px;
		height: 18px;
		color: var(--text-secondary);
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.section.collapsed .chevron {
		transform: rotate(-90deg);
	}
	.section-body {
		padding: 16px 18px 20px;
	}
	.section.collapsed .section-body {
		display: none;
	}

	/* ── SEXO BADGE IN SECTION TITLE ── */
	.sexo-indicator {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 12px;
	}
	.sexo-indicator.male {
		background: #e0f2fe;
		color: #0369a1;
	}
	.sexo-indicator.female {
		background: #fce7f3;
		color: #be185d;
	}
	.sexo-hint-box {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #f8fafc;
		border: 1px dashed #cbd5e1;
		border-radius: 8px;
		padding: 8px 12px;
		font-size: 12px;
		color: #64748b;
		margin-bottom: 14px;
	}
	.sexo-hint-box svg {
		color: #0d9488;
		flex-shrink: 0;
	}

	/* ── SUBSECTION ── */
	.sub {
		margin-bottom: 18px;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--border-light);
	}
	.sub:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}
	.sub-title {
		font-size: 11px;
		font-weight: 700;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.sub-title::after {
		content: "";
		flex: 1;
		height: 1px;
		background: linear-gradient(to right, var(--border-light), transparent);
	}

	/* ── FIELDS ── */
	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px 16px;
	}
	.fields.cols-3 {
		grid-template-columns: 1fr 1fr 1fr;
	}
	.fields.cols-1 {
		grid-template-columns: 1fr;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.field.span-2 {
		grid-column: span 2;
	}
	.field.span-3 {
		grid-column: 1 / -1;
	}
	.field label {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.field input[type="text"],
	.field input[type="number"],
	.field input[type="date"],
	.field select,
	.field textarea {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 7px 10px;
		font-family: var(--font);
		font-size: 13px;
		color: var(--text);
		background: #f8fafc;
		width: 100%;
		transition: all 0.15s;
	}
	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
		background: #fff;
	}
	.field textarea {
		resize: vertical;
		min-height: 56px;
	}

	/* ── INLINE UNIT FIELD ── */
	.input-unit {
		display: flex;
		align-items: center;
		gap: 0;
	}
	.input-unit input {
		border-radius: 6px 0 0 6px !important;
		flex: 1;
	}
	.input-unit .badge-unit {
		background: #e2e8f0;
		border: 1px solid var(--border);
		border-left: none;
		border-radius: 0 6px 6px 0;
		padding: 7px 10px;
		font-size: 11px;
		color: var(--text-secondary);
		white-space: nowrap;
		font-family: var(--mono);
		font-weight: 500;
	}

	.badge-classif {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 6px;
		margin-top: 5px;
		line-height: 1.3;
	}
	.badge-classif.success {
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}
	.badge-classif.warning {
		background: #fffbeb;
		color: #92400e;
		border: 1px solid #fde68a;
	}
	.badge-classif.danger {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}
	.badge-classif.info {
		background: #eff6ff;
		color: #1e40af;
		border: 1px solid #bfdbfe;
	}

	/* ── RADIOS / CHECKBOXES ── */
	.option-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		margin-top: 3px;
	}
	.option-row label {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		font-size: 13px;
	}
	.option-row input[type="radio"],
	.option-row input[type="checkbox"] {
		accent-color: var(--accent);
		width: 14px;
		height: 14px;
		cursor: pointer;
	}
	.option-label {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}

	/* ── CHIPS ── */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12.5px;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.15s;
		background: #f8fafc;
	}
	.chip:hover {
		border-color: var(--accent-mid);
		background: var(--accent-light);
	}
	.chip:has(input:checked) {
		background: var(--accent-light);
		border-color: var(--accent-mid);
		color: var(--accent);
		font-weight: 500;
	}
	.chip input {
		accent-color: var(--accent);
		width: 12px;
		height: 12px;
		cursor: pointer;
	}

	/* ── VITALS GRID ── */
	.vitals-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	.vital-card {
		background: #f8fafc;
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 10px 12px;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.vital-card:hover {
		border-color: var(--accent-mid);
		box-shadow: 0 2px 8px rgba(13, 148, 136, 0.08);
	}
	.vital-card label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary);
		display: block;
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	/* ── SCREEN TIME BOX ── */
	.screen-time-box {
		margin-top: 16px;
		background: var(--yellow-light);
		border: 1px solid var(--yellow-border);
		border-radius: 8px;
		padding: 12px 14px;
	}

	/* ── CONDUTA ── */
	.conduta-block {
		margin-bottom: 12px;
	}
	.conduta-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 4px;
		flex-wrap: wrap;
	}
	.conduta-label-row label {
		margin-bottom: 0;
	}
	.btn-prescricao-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #bfdbfe;
		padding: 3px 9px;
		border-radius: 6px;
		font-size: 11.5px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.15s ease;
		box-shadow: 0 1px 2px rgba(37, 99, 235, 0.05);
	}
	.btn-prescricao-link:hover {
		background: #dbeafe;
		border-color: #93c5fd;
		color: #1d4ed8;
		transform: translateY(-1px);
		box-shadow: 0 2px 5px rgba(37, 99, 235, 0.15);
	}
	.conduta-actions-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 6px;
		flex-wrap: wrap;
	}
	.conduta-block label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.conduta-block textarea {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 10px;
		font-family: var(--font);
		font-size: 13px;
		width: 100%;
		resize: vertical;
		min-height: 56px;
		background: #f8fafc;
		transition: all 0.15s;
	}
	.conduta-block textarea:focus {
		outline: none;
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
		background: #fff;
	}

	/* ── DIAGNOSIS ── */
	.dx-block {
		margin-bottom: 12px;
		padding: 10px 12px;
		border: 1px solid var(--border-light);
		border-radius: 8px;
		background: #fafbfc;
	}
	.dx-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}
	.dx-header label {
		margin-bottom: 0 !important;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.dx-actions {
		display: flex;
		gap: 4px;
	}
	.btn-dx {
		background: #fff;
		border: 1px solid var(--border);
		color: var(--text);
		padding: 3px 10px;
		font-size: 11px;
		font-weight: 500;
		border-radius: 5px;
		cursor: pointer;
		font-family: var(--font);
		transition: all 0.15s;
	}
	.btn-dx:hover {
		background: var(--accent-light);
		border-color: var(--accent-mid);
		color: var(--accent);
	}
	.dx-block textarea {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		font-family: var(--font);
		font-size: 13px;
		width: 100%;
		min-height: 48px;
		resize: vertical;
		background: #fff;
		transition: all 0.15s;
	}
	.dx-block textarea:focus {
		outline: none;
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
	}

	/* ── HDA REVIEW CONTAINER IN AVALIAÇÃO ── */
	.hda-review-container {
		margin-bottom: 14px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		overflow: hidden;
		background: #fff;
	}
	.hda-review-header {
		width: 100%;
		background: #f1f5f9;
		padding: 8px 12px;
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: background 0.15s;
		font-family: var(--font);
	}
	.hda-review-header:hover {
		background: #e2e8f0;
	}
	.hda-review-title {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.hda-review-title svg {
		color: var(--accent);
		flex-shrink: 0;
	}
	.hda-badge {
		font-size: 10px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 12px;
		background: #e0f2fe;
		color: #0284c7;
	}
	.hda-review-body {
		padding: 12px 14px;
		background: #ffffff;
		border-top: 1px solid #e2e8f0;
		max-height: 280px;
		overflow-y: auto;
		font-size: 12.5px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.hda-summary-item {
		border-left: 3px solid var(--accent);
		padding-left: 10px;
	}
	.hda-summary-label {
		font-size: 10.5px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		margin-bottom: 2px;
	}
	.hda-summary-text {
		color: #1e293b;
		white-space: pre-wrap;
		line-height: 1.45;
	}
	.hda-summary-text.qp {
		font-weight: 600;
		color: #0f172a;
	}
	.hda-summary-empty {
		padding: 12px 0;
		color: #94a3b8;
		text-align: center;
	}

	/* ── RISK ── */
	.risk-group {
		margin-bottom: 12px;
	}
	.risk-group-title {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--text);
		margin-bottom: 6px;
	}
	.risk-items {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
	}
	.risk-item {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12.5px;
		cursor: pointer;
	}
	.risk-item input {
		accent-color: var(--red);
		width: 13px;
		height: 13px;
	}

	/* ── EXAMES DE IMAGEM ── */
	.exame-card {
		border: 1px solid var(--border-light);
		border-radius: 8px;
		padding: 12px 14px;
		margin-bottom: 12px;
		background: #fafbfc;
		transition: border-color 0.15s;
	}
	.exame-card:hover {
		border-color: var(--accent-mid);
	}
	.exame-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	.exame-card-num {
		font-size: 11px;
		font-weight: 700;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.btn-add-exame {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		background: linear-gradient(135deg, #d97706, #b45309);
		color: #fff;
		font-family: var(--font);
		font-size: 12.5px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-add-exame:hover {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
	}

	/* ── MARCOS BUTTON ── */
	.btn-marcos {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		background: linear-gradient(135deg, var(--accent), var(--accent-mid));
		color: #fff;
		font-family: var(--font);
		font-size: 12.5px;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 10px;
	}
	.btn-marcos:hover {
		box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
	}

	/* ── MODAL ── */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 500;
		animation: fadeIn 0.2s;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.modal-box {
		background: #fff;
		border-radius: 16px;
		width: 90%;
		max-width: 640px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
		animation: slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		max-height: 85vh;
		display: flex;
		flex-direction: column;
	}
	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-light);
		flex-shrink: 0;
	}
	.modal-header h2 {
		font-size: 15px;
		font-weight: 700;
		color: var(--text);
	}
	.modal-header .modal-age-badge {
		font-size: 11px;
		background: var(--accent);
		color: #fff;
		padding: 3px 10px;
		border-radius: 20px;
		font-weight: 600;
	}
	.modal-close {
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 18px;
		color: #64748b;
		transition: all 0.15s;
	}
	.modal-close:hover {
		background: #f1f5f9;
		color: var(--text);
	}
	.modal-body {
		padding: 16px 20px 20px;
		overflow-y: auto;
		flex: 1;
	}
	.modal-body::-webkit-scrollbar {
		width: 6px;
	}
	.modal-body::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;
	}
	.modal-no-milestones {
		text-align: center;
		padding: 32px 20px;
		color: #94a3b8;
		font-size: 13px;
	}
	.milestone-group {
		margin-bottom: 18px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--border-light);
	}
	.milestone-group:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}
	.milestone-group-title {
		font-size: 11.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text);
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.milestone-group-title .age-range {
		font-family: var(--mono);
		font-size: 10px;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
		color: #64748b;
	}
	.milestone-item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 6px 0;
	}
	.milestone-item input[type="checkbox"] {
		accent-color: var(--accent);
		width: 15px;
		height: 15px;
		margin-top: 2px;
		cursor: pointer;
		flex-shrink: 0;
	}
	.milestone-item-content {
		flex: 1;
		cursor: pointer;
	}
	.milestone-item-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text);
	}
	.milestone-item-desc {
		font-size: 11.5px;
		color: #94a3b8;
		margin-top: 2px;
		line-height: 1.45;
	}
	.milestone-obs {
		margin-top: 12px;
	}
	.milestone-obs label {
		font-size: 11.5px;
		font-weight: 600;
		color: #64748b;
		display: block;
		margin-bottom: 4px;
	}
	.milestone-obs textarea {
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 10px;
		font-family: var(--font);
		font-size: 13px;
		width: 100%;
		resize: vertical;
		min-height: 52px;
		background: #f8fafc;
		transition: all 0.15s;
	}
	.milestone-obs textarea:focus {
		outline: none;
		border-color: var(--accent-teal);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
		background: #fff;
	}

	/* ── COMPACT PRINT LAYOUT (PDF) ── */
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
			grid-template-columns: 1.5fr 1fr 0.8fr 1fr !important;
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
			margin-top: 20px !important;
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
			font-size: 8.5px !important;
			color: #475569 !important;
		}

		@page {
			size: A4 portrait;
			margin: 10mm 12mm;
		}
	}

	/* ── RESPONSIVE ── */
	@media (max-width: 1200px) {
		.sidebar-right {
			display: none;
		}
		.page-layout {
			grid-template-columns: 200px 1fr;
		}
	}
	@media (max-width: 900px) {
		.sidebar-left {
			display: none;
		}
		.page-layout {
			grid-template-columns: 1fr;
		}
		.topbar {
			padding: 0 12px;
			height: 48px;
		}
		.topbar-brand {
			font-size: 12px;
			margin-right: 6px;
		}
		.topbar-back {
			font-size: 11px;
			padding: 4px 8px;
		}
		.btn-action {
			padding: 5px 10px;
			font-size: 11px;
		}
		.page-header {
			grid-template-columns: 1fr 1fr;
		}
		.fields.cols-3 {
			grid-template-columns: 1fr 1fr;
		}
		.vitals-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 600px) {
		.page-header {
			grid-template-columns: 1fr;
		}
		.fields {
			grid-template-columns: 1fr;
		}
		.fields.cols-3 {
			grid-template-columns: 1fr;
		}
		.field.span-2,
		.field.span-3 {
			grid-column: span 1;
		}
		.vitals-grid {
			grid-template-columns: 1fr;
		}
		.topbar-nav {
			display: none;
		}
	}

	.prontuario-footer {
		margin-top: 32px;
		padding: 16px 0 8px;
		border-top: 1px solid #e2e8f0;
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
</style>
