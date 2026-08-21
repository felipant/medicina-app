/**
 * Helper para preencher todos os campos do formulário com dados fictícios para testes.
 * Para remover esta funcionalidade, basta deletar este arquivo e o botão "Preencher Auto" em +page.svelte.
 */

export interface MockStateUpdate {
	dataConsulta: string;
	dataNascimento: string;
	sexo: string;
	inputPeso: string;
	inputAltura: string;
	inputImc: string;
	inputPc?: string;
	imcManual: boolean;
	medGestacao: string;
	medUsoContinuo: string;
	medPrescricao: string;
	marcosObs: string;
	savedMilestones: Set<string>;
	examesImagem: Array<{
		id: number;
		nome: string;
		data: string;
		medico: string;
		resultado: string;
	}>;
	queixaPrincipal: string;
	hdaPrincipal: string;
	secondaryComplaints: Array<{ id: number; queixa: string; evolucao: string }>;
}

export function getMockFormData(): {
	state: MockStateUpdate;
	fieldMap: Record<string, string>;
	selectMap: Record<string, string>;
	radioMap: Record<string, string>;
	checkboxLabels: string[];
} {
	const today = new Date();
	const yyyy = today.getFullYear();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const dataConsultaStr = `${yyyy}-${mm}-${dd}`;

	// Criança de 2 anos e 3 meses
	const birthDate = new Date(today);
	birthDate.setMonth(birthDate.getMonth() - 27);
	const bYyyy = birthDate.getFullYear();
	const bMm = String(birthDate.getMonth() + 1).padStart(2, '0');
	const bDd = String(birthDate.getDate()).padStart(2, '0');
	const dataNascimentoStr = `${bYyyy}-${bMm}-${bDd}`;

	const state: MockStateUpdate = {
		dataConsulta: dataConsultaStr,
		dataNascimento: dataNascimentoStr,
		sexo: 'M',
		inputPeso: '13.2',
		inputAltura: '89.5',
		inputImc: '16.48',
		inputPc: '48.5',
		imcManual: false,
		medGestacao: 'Sulfato Ferroso 40mg/dia; Ácido Fólico 5mg/dia; Metildopa 250mg 12/12h (2º tri)',
		medUsoContinuo: 'Nega uso contínuo de medicações prévias',
		medPrescricao:
			'1. Dipirona gotas 500mg/mL: 13 gotas VO de 6/6h se T ≥ 37,8°C ou dor;\n' +
			'2. Lavagem nasal com Soro Fisiológico 0,9%: 3 a 5 mL em cada narina de 4/4h;\n' +
			'3. Salbutamol spray 100mcg: 2 jatos com espaçador de 6/6h por 5 dias;\n' +
			'4. Hidratação oral vigorosa (água, soro caseiro, água de coco).',
		marcosObs: 'DNPM adequado para a idade. Fala inteligível, corre, sobe degraus e interage ativamente.',
		queixaPrincipal: 'Febre alta há 3 dias e tosse "cheia" com chiado no peito',
		hdaPrincipal:
			'Mãe relata que a criança iniciou há 3 dias quadro de coriza hialina e espirros, seguido de febre diária (pico axilar de 38,8°C aferido), que cede parcialmente com dipirona. Há 2 dias evoluiu com tosse produtiva e chiado audível sem estetoscópio. Apresenta adinamia e inapetência moderada, mantendo diurese clara.',
		savedMilestones: new Set([
			'marco_0_0', 'marco_0_1', 'marco_0_2', 'marco_0_3', 'marco_0_4', 'marco_0_5',
			'marco_6_16', 'marco_6_17', 'marco_6_19', 'marco_6_21', 'marco_6_23',
			'marco_18_32', 'marco_18_33', 'marco_18_34', 'marco_18_35', 'marco_18_36', 'marco_18_38'
		]),
		examesImagem: [
			{
				id: 1,
				nome: 'Radiografia de Tórax (PA e Perfil)',
				data: dataConsultaStr,
				medico: 'Dr. Roberto M. Castro (CRM/SP 145892)',
				resultado:
					'Hemitóraces simétricos. Trama vascular pulmonar preservada. Discreto espessamento peribroncovascular hilar bilateral, sem consolidações alveolares evidentes ou pneumotórax. Seios costofrênicos livres. Área cardíaca dentro dos limites normais para a idade.'
			}
		],
		secondaryComplaints: [
			{
				id: 2,
				queixa: 'Inapetência e leve recusa de alimentos sólidos',
				evolucao: 'Iniciou junto com a febre há 3 dias; aceita líquidos, água de coco e frutas macias sem náuseas.'
			}
		]
	};

	const fieldMap: Record<string, string> = {
		// Identificação
		'Nome da criança': 'Bernardo Silva Santos',
		'Naturalidade': 'São Paulo – SP',
		'Nome do responsável / acompanhante': 'Mariana Silva Santos (Mãe) — Tel: (11) 98765-4321',

		// Anamnese 01 - QP / HDA
		'Motivo da consulta (em palavras do acompanhante)': 'Febre alta há 3 dias e tosse "cheia" com chiado no peito',
		'Descrição detalhada — início, duração, evolução, fatores de melhora/piora, sintomas associados':
			'Mãe relata que a criança iniciou há 3 dias quadro de coriza hialina e espirros, seguido de febre diária (pico axilar de 38,8°C aferido), que cede parcialmente com dipirona. Há 2 dias evoluiu com tosse produtiva e chiado audível sem estetoscópio. Apresenta adinamia e inapetência moderada, mantendo diurese clara.',

		// Hábitos e Funções
		'Apetite': 'Reduzido para sólidos desde o início da febre; aceita bem líquidos',
		'Sono': 'Interrompido por episódios de tosse noturna',
		'Diurese': 'Presente, clara, 5 a 6 trocas de fralda/dia, sem disúria perceptível',
		'Evacuação / Intestino': 'Fezes pastosas normocoradas 1x/dia, sem sangue ou muco',
		'Humor / Atividade / Disposição': 'Irritado e sonolento nos picos febris; ativo e comunicativo quando afebril',
		'Ciclo menstrual (adolescentes)': 'Não aplicável',
		'Tempo diário de tela': '1.5',
		'Observações sobre tempo de tela': 'Assistência supervisionada de desenhos educativos em TV e tablet',

		// Hist. Gestacional
		'Idade materna na gestação': '29',
		'Gesta / Para / Abortos': 'G1 P1 A0',
		'Número de consultas pré-natal': '9',
		'Intercorrências na gestação': 'Hipertensão gestacional controlada no 3º trimestre; sorologias pré-natais todas negativas',
		'Tabagismo / Álcool / Drogas': 'Nega uso de tabaco, álcool ou drogas ilícitas na gestação',
		'Local do parto': 'Hospital Maternidade Santa Joana',
		'Idade gestacional': '39',
		'APGAR 1\' / 5\'': '9 / 10',
		'Peso ao nascer': '3320',
		'Comprimento ao nascer': '50',
		'Perímetro Cefálico ao nascer': '35',
		'Peso na alta': '3180',
		'Intercorrências neonatais': 'Icterícia fisiológica zona II resolvida espontaneamente sem fototerapia',
		'Observações sobre triagens': 'Teste do Pezinho (ampliado), Olhinho, Orelhinha (PEATE) e Coraçãozinho todos normais',

		// Alimentação
		'Aleitamento materno exclusivo até': '6 meses',
		'Aleitamento materno total até': '18 meses',
		'Início da introdução alimentar': '6 meses',
		'Alimentação habitual / Recordatório alimentar':
			'Dieta da família balanceada: frutas variadas nos lanches, arroz, feijão, legumes cozidos e carnes magras no almoço/jantar. Boa aceitação hídrica.',

		// Vacinação
		'Vacinas pendentes / observações': 'Todas as vacinas do PNI em dia até a dose de 15 meses (incluindo DTP, VOP, Tetra Viral, Meningo C e Hep A)',

		// DNPM
		'Controle esfincteriano / Desfralde': 'Iniciando desfralde diurno com boa colaboração',
		'Audição': 'Normoouvinte, responde prontamente ao chamado em voz baixa',
		'Visão': 'Fixa e acompanha objetos, sem estrabismo',
		'Rendimento / adaptação escolar': 'Frequenta creche período integral há 6 meses com ótima adaptação social',
		'Marcos do desenvolvimento (descreva idades de aquisição)':
			'Sustento cefálico aos 2m, sentou sem apoio aos 6m, engatinhou aos 8m, marcha sem apoio aos 11m, primeiras palavras aos 10m, frases simples aos 20m.',
		'Observações sobre DNPM': 'Desenvolvimento neuropsicomotor global compatível e esperado para a faixa etária',

		// Antecedentes
		'Doenças prévias': '1 episódio de Bronquiolite Viral Aguda aos 7 meses; sem outras morbidades prévias',
		'Internações': 'Nega internações prévias',
		'Cirurgias / procedimentos': 'Nega procedimentos cirúrgicos',
		'Alergias': 'Nega alergias alimentares ou medicamentosas conhecidas',
		'Doenças relevantes na família': 'Mãe com rinite alérgica; Pai com asma intermitente leve; Avó materna com DM2',

		// Socioambiental
		'Número de pessoas na casa': '3',
		'Renda familiar': '4 salários mínimos',
		'Observações adicionais': 'Residência de alvenaria em bairro urbano estruturado, sem umidade aparente ou mofo',

		// Exame Físico - Sinais Vitais
		'FC — Freq. Cardíaca': '118',
		'FR — Freq. Respiratória': '28',
		'Temperatura': '37.8',
		'PA sistólica / diastólica': '92/60',
		'SpO₂ — Saturação O₂': '98',
		'Perfusão periférica': '1.5',
		'Perímetro Cefálico': '48.5',
		'Perímetro Torácico': '49.0',
		'Perímetro Abdominal': '47.5',
		'Escore Z — Peso/Idade': '+0,45',
		'Escore Z — Estatura/Idade': '+0,32',
		'Escore Z — IMC/Idade': '+0,50',

		// Ectoscopia
		'Grau de palidez (1+ a 4+)': 'Ausente',
		'Grau de icterícia (1+ a 4+)': 'Ausente',
		'Zona de Kramer (RN)': 'Ausente',
		'Lesões cutâneas / erupções': 'Pele íntegra, sem exantemas, petéquias ou sufusões hemorrágicas',
		'Alterações vasculares': 'Sem alterações de circulação colateral ou hemangiomas',
		'Unhas': 'Leitos ungueais róseos, sem baqueteamento ou estrias',
		'Cabelos': 'Boa implantação e brilho, sem áreas de alopecia',
		'Edema / outros achados cutâneos': 'Sem edema periférico',

		// Linfonodos
		'Tamanho dos linfonodos alterados': 'Linfonodos submandibulares bilaterais < 1 cm, móveis e indolores',
		'Observações': 'Sem adenomegalias supraclaviculares, axilares ou inguinais patológicas',

		// Cabeça e Pescoço
		'Dimensões e conformação': 'Normocéfalo, proporcional',
		'Suturas': 'Fechadas',
		'Fontanela anterior (bregmática)': 'Fechada',
		'Fontanela posterior': 'Fechada',
		'Couro cabeludo — lesões, ectoparasitoses, distribuição capilar': 'Sem lesões, descamação ou parasitas',
		'Simetria facial': 'Fácies simétrica e expressiva',
		'Movimentos faciais / paralisias': 'Mímica facial preservada bilateralmente',
		'Edema de face / dismorfismos craniofaciais': 'Ausentes',
		'Tamanho / posição dos globos': 'Simétricos, sem enoftalmia ou exoftalmia',
		'Pálpebras': 'Sem ptose, edema ou hiperemia ciliar',
		'Conjuntiva e córnea': 'Conjuntivas normocoradas, sem secreção purulenta',
		'Esclerótica': 'Anictérica e branca',
		'Pupilas (simetria, fotorreatividade, anisocoria)': 'Isocóricas e fotorreativas bilateralmente',
		'Estrabismo / nistagmo / movimentos oculares': 'Ausentes',
		'Tamanho e implantação': 'Implantação auricular tópica e simétrica',
		'Secreção / sensibilidade': 'Sem otorreia ou dor à tração do trago/pavilhão',
		'Otoscopia — conduto auditivo externo': 'Condutos auditivos pérvios, sem cerume obstrutivo',
		'Otoscopia — membrana timpânica': 'Membranas timpânicas íntegras, peroladas e com triângulo luminoso preservado bilateralmente',
		'Mastóide': 'Sem dor ou hiperemia retroauricular',
		'Forma / septo': 'Septo nasal centrado',
		'Mucosa / secreções / epistaxe': 'Mucosa nasal hiperemiada com coriza seromucosa moderada',
		'Pólipos / tumores / seios paranasais': 'Ausentes',
		'Lábios': 'Róseos e úmidos, sem fissuras ou queilites',
		'Boca — odor, salivação, trisma': 'Sem sialorreia ou halitose',
		'Dentes e gengiva': 'Dentição decídua completa para a idade, sem cáries aparentes',
		'Mucosa oral': 'Úmida e íntegra, sem aftas ou placas de monilíase',
		'Língua': 'Papilada e normocorada, sem saburra espessa',
		'Palato': 'Palato duro e mole íntegros',
		'Amígdalas — tamanho e aspecto': 'Amígdalas grau II/IV, hiperemia discreta sem placas purulentas',
		'Faringe posterior': 'Hiperemia difusa moderada sem exsudato membranoso',
		'Laringe — voz / rouquidão / estridor': 'Voz clara, sem estridor em repouso',
		'Forma, simetria, mobilidade': 'Mobilidade cervical preservada em todos os eixos, sem torcicolo',
		'Tireoide': 'Impalpável, sem nódulos',
		'Pulsos carotídeos / sopros': 'Pulsos carotídeos amplos e simétricos, sem sopros',
		'Tumorações / anomalias': 'Ausentes',

		// Tórax
		'Forma e simetria': 'Tórax simétrico e atípico',
		'Desenvolvimento mamário (adolescentes)': 'Tanner M1',
		'Expansibilidade torácica': 'Expansibilidade torácica preservada e simétrica bilateralmente',
		'Frêmito tóraco-vocal': 'Frêmito toracovocal uniformemente distribuído',
		'Localização de alterações percussórias': 'Som claro pulmonar em todos os campos',
		'Observações (broncofonia, pectorilóquia, egofonia, localização…)': 'Sibilos expiratórios esparsos em terço médio bilateral, com roncos de transmissão',

		// Cardiovascular
		'Ictus cordis — localização': 'Ictus cordis palpável no 4º EIC na linha hemiclavicular esquerda',
		'Ictus — extensão / amplitude / frêmito': 'Impulso sistólico normal, sem frêmitos',
		'Sopro — intensidade (Grau I–VI) / foco / irradiação': 'Ausente',
		'Pulsos periféricos — radiais, braquiais, femorais, pediosos': 'Pulsos radiais, femorais e pediosos palpáveis, cheios e simétricos',

		// Abdome
		'Cicatriz umbilical / hérnias': 'Cicatriz umbilical plana e retraída, sem hérnias',
		'Circulação venosa superficial / peristaltismo visível': 'Ausentes',
		'Pele abdominal': 'Íntegra, sem cicatrizes cirúrgicas',
		'Parede abdominal — tensão / resistência': 'Abdome flácido, depressível e indolor à palpação superficial e profunda',
		'Dor à palpação': 'Ausente',
		'Fígado': 'Bordo hepático palpável a 1,0 cm do rebordo costal direito, liso e indolor',
		'Baço': 'Não palpável',
		'Massas / tumorações': 'Ausentes',
		'Punho-percussão lombar (rins)': 'Giordano negativo bilateralmente',

		// Gênito-urinário
		'Pênis — fimose': 'Glande parcialmente retrátil sem anel fibrótico estenótico',
		'Bolsa escrotal — testículos': 'Testículos tópicos em bolsa escrotal bilateralmente, volume e consistência normais',
		'Criptorquidia / testículo retrátil / ectópico': 'Ausente',
		'Mamas (M)': 'M1',
		'Pelos pubianos (P)': 'P1',
		'Genitália masculina (G)': 'G1',
		'Ânus': 'Orifício anal tópico, sem fissuras, assaduras ou fístulas',
		'Prolapso retal / pólipos': 'Ausentes',

		// Locomotor
		'Mobilidade dos quatro membros': 'Mobilidade ativa e passiva amplamente preservada nos 4 membros',
		'Sinais inflamatórios articulares (artrites, miosites)': 'Ausentes em todas as articulações avaliadas',
		'Mobilidade / dor à palpação': 'Coluna móvel e indolor à palpação dos processos espinhosos',
		'Anomalias (cistos, dimple sacral, tufo de pelo, espinha bífida, mielomeningocele)': 'Ausentes',

		// Neurológico
		'Escala de Glasgow': '15 (AO4, RV5, RM6)',
		'Estigmas neurocutâneos (pele)': 'Ausentes',
		'Força muscular': 'Grau 5 globalmente, sem déficits focais',
		'Reflexos osteotendinosos (ROTs)': 'Bicipital, patelar e aquileu presentes e simétricos (2+/4+)',
		'Coordenação e equilíbrio': 'Marcha e equilíbrio preservados, sem ataxia ou dismetria',
		'Sensibilidade superficial e profunda': 'Preservada e simétrica ao estímulo tátil',
		'Pares cranianos': 'Pares cranianos (II a XII) sem alterações aparentes',
		'Reflexos primitivos e posturais (RN/lactentes)': 'Reflexos primitivos integrados conforme esperado para a idade',
		'Se presentes — especificar (Brudzinski, Kernig, Lasègue)': 'Ausentes (rigidez de nuca ausente)',

		// Diagnósticos
		'Diagnóstico Clínico — Hipótese(s) Principal(ais)':
			'1. Infecção Aguda de Vias Aéreas Superiores / Rinofaringite Aguda (CID-10 J00);\n' +
			'2. Broncoespasmo associado a infecção viral / Lactente Sibilante (CID-10 J20.9).',
		'Diagnósticos Diferenciais': 'Bronquiolite Viral Aguda residual, Pneumonia Adquirida na Comunidade (PAC) incipiente.',
		'Observações sobre risco identificado': 'Sem critérios de risco socioambiental ou de maus-tratos identificados.',

		// Conduta
		'Exames complementares solicitados (laboratoriais e/ou de imagem)':
			'Radiografia de tórax realizada em sala com laudo satisfatório. Sem indicação de hemograma ou PCR no momento.',
		'Pareceres / Encaminhamentos especializados':
			'Manter acompanhamento regular de puericultura com a equipe da UBS.',
		'Tratamento Não Farmacológico':
			'Lavagem nasal contínua, oferta hídrica abundante, repouso, dieta fracionada e ambiente livre de fumaça de tabaco.',
		'Orientações ao responsável':
			'Orientada sobre a evolução esperada de quadros virais (5 a 7 dias). Explicados detalhadamente sinais de gravidade que exigem retorno imediato: tiragem intercostal/subcostal, batimento de asas de nariz, gemência, cianose, febre persistente por mais de 72h ou recusa alimentar completa.',
		'Retorno / seguimento':
			'Retorno programado para reavaliação em 5 dias ou antes se surgirem sinais de alarme. Próxima consulta de puericultura aos 30 meses.',
		'Nome completo do médico(a)': 'Dr. Felipe Torres',
		'CRM': 'CRM/SP 198745',
		'Instituição / Serviço': 'Ambulatório Geral de Pediatria — UBS Central'
	};

	const selectMap: Record<string, string> = {
		'Tipo de parto': 'Vaginal (espontâneo)',
		'Denver II — resultado global': 'Normal',
		'Tipo de moradia': 'Casa própria',
		'Consistência': 'Fibroelástica (normal)',
		'Mobilidade / Aderência': 'Móvel',
		'Velocidade de crescimento': 'Dias (agudo)',
		'Distribuição': 'Localizada (1 cadeia)',
		'Tipo respiratório': 'Toracoabdominal',
		'Frequência respiratória — ritmo': 'Eupneico',
		'Murmúrio vesicular': 'Presente, simétrico e bem distribuído',
		'Ritmo cardíaco': 'Rítmico',
		'Bulhas cardíacas': 'B1 e B2 normofonéticas, sem B3 ou B4',
		'Sopro cardíaco': 'Ausente',
		'Forma geral': 'Plano',
		'Ruídos hidroaéreos / borborismos': 'Presentes, normais',
		'Marcha': 'Normal',
		'Nível de consciência': 'Alerta',
		'Tônus muscular': 'Normal (normotônico)'
	};

	const radioMap: Record<string, string> = {
		'prenatal': 'sim',
		'triagem': 'normais',
		'vitD': 'sim',
		'ferro': 'sim',
		'vacina': 'atualizado',
		'escola': 'sim',
		'consang': 'nao',
		'agua': 'sim',
		'esgoto': 'sim',
		'animais': 'nao',
		'tabdom': 'nao',
		'eg': 'bom',
		'facies': 'atipica',
		'atitude': 'ativa-atipica',
		'hidrat': 'hidratado',
		'nutri': 'eutrofico',
		'bater_asas': 'ausente',
		'turgencia': 'ausente',
		'ascite': 'ausente',
		'hipospadias': 'ausente',
		'hidrocele': 'ausente',
		'edema_mmii': 'ausente',
		'ortolani': 'negativa',
		'meningeo': 'ausentes'
	};

	const checkboxLabels = [
		'TV',
		'Tablet',
		'Alerta e interativo',
		'Normocorado',
		'Lágrimas presentes',
		'Mucosas úmidas',
		'Turgor normal',
		'Fontanela normal',
		'Submandibulares',
		'Ausentes',
		'Som claro pulmonar (normal)',
		'Sibilos',
		'Roncos',
		'Timpanismo (normal)',
		'Macicez hepática normal',
		'Normal'
	];

	return {
		state,
		fieldMap,
		selectMap,
		radioMap,
		checkboxLabels
	};
}
