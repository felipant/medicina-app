import type { AnamneseSchema } from './types';

export const PROCEDIMENTOS_PEQUENAS_CIRURGIAS: string[] = [
	'Exérese de nevos melanocíticos (pintas).',
	'Exérese de acrocórdons (fibromas moles).',
	'Exérese de cistos epidermoides (cistos sebáceos).',
	'Exérese de lipomas superficiais.',
	'Exérese de dermatofibromas.',
	'Biópsia de pele por punch.',
	'Biópsia incisional de lesões cutâneas.',
	'Biópsia excisional de lesões cutâneas.',
	'Shaving (exérese superficial de lesões).',
	'Curetagem de lesões cutâneas selecionadas.',
	'Eletrocoagulação de lesões benignas.',
	'Crioterapia de lesões cutâneas (verrugas, ceratoses actínicas selecionadas).',
	'Drenagem de pequenos abscessos cutâneos.',
	'Cantoplastia para unha encravada.',
	'Avulsão parcial da lâmina ungueal.',
	'Avulsão total da lâmina ungueal.',
	'Matricectomia química ou cirúrgica.',
	'Drenagem de abscesso periungueal (paroníquia).',
	'Biópsia de leito ou matriz ungueal.',
	'Incisão e drenagem de abscessos cutâneos.',
	'Exérese de cistos epidermoides.',
	'Exérese de pequenos tumores benignos de partes moles.',
	'Retirada de corpos estranhos superficiais.',
	'Desbridamento de pequenas feridas.',
	'Sutura de ferimentos simples.',
	'Revisão de cicatrizes selecionadas.',
	'Drenagem de hematomas superficiais selecionados.'
];

export const ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA: AnamneseSchema = [
	{
		id: 'identificacao',
		number: 1,
		title: 'Identificação e indicação',
		subtitle: 'Dados do paciente, topografia da lesão e evolução',
		fields: [
			{
				id: 'nome',
				label: 'Nome do paciente',
				type: 'text',
				placeholder: 'Nome completo ou iniciais',
				excludeFromSectionExport: true
			},
			{
				id: 'idade',
				label: 'Idade',
				type: 'number',
				unit: 'anos',
				min: 0,
				max: 130,
				placeholder: 'Ex.: 54',
				excludeFromSectionExport: true
			},
			{
				id: 'sexo',
				label: 'Sexo',
				type: 'radio',
				excludeFromSectionExport: true,
				options: [
					{ value: 'Feminino', label: 'Feminino' },
					{ value: 'Masculino', label: 'Masculino' },
					{ value: 'Outro', label: 'Outro' },
					{ value: 'Não informado', label: 'Não informado' }
				]
			},
			{
				id: 'contato',
				label: 'Contato (telefone)',
				type: 'text',
				mask: 'phone',
				placeholder: '(XX) XXXXX-XXXX'
			},
			{
				id: 'acompanhante',
				label: 'Vai com acompanhante?',
				type: 'yesno',
				hint: 'Relevante especialmente se houver sedação',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Nome/parentesco do acompanhante (opcional)'
				}
			},
			{
				id: 'sedacao',
				label: 'Haverá sedação no procedimento?',
				type: 'yesno',
				hint: 'Habilita avaliação de via aérea e ausculta no exame físico'
			},
			{
				id: 'procedimento',
				label: 'Procedimento planejado',
				type: 'text',
				placeholder: 'Digite ou selecione o procedimento planejado...',
				suggestions: PROCEDIMENTOS_PEQUENAS_CIRURGIAS
			},
			{
				id: 'local_lesao',
				label: 'Local da lesão',
				type: 'text',
				placeholder: 'Ex.: Região malar, dorso superior, hálux, antebraço...'
			},
			{
				id: 'lateralidade',
				label: 'Lateralidade',
				type: 'radio',
				options: [
					{ value: 'Direita', label: 'Direita' },
					{ value: 'Esquerda', label: 'Esquerda' },
					{ value: 'Central', label: 'Central' },
					{ value: 'Não se aplica', label: 'Não se aplica' }
				]
			},
			{
				id: 'tempo_evolucao',
				label: 'Tempo de evolução da lesão',
				type: 'radio',
				options: [
					{ value: '< 1 mês', label: '< 1 mês' },
					{ value: '1–6 meses', label: '1–6 meses' },
					{ value: '6–12 meses', label: '6–12 meses' },
					{ value: '> 1 ano', label: '> 1 ano' },
					{ value: 'Desde sempre', label: 'Desde sempre' }
				]
			},
			{
				id: 'mudancas_recentes',
				label: 'Mudanças recentes na lesão',
				type: 'checkboxGroup',
				exclusiveOption: 'Nenhuma',
				options: [
					{ value: 'Crescimento', label: 'Crescimento' },
					{ value: 'Sangramento', label: 'Sangramento' },
					{ value: 'Dor', label: 'Dor' },
					{ value: 'Secreção', label: 'Secreção' },
					{ value: 'Mudança de cor', label: 'Mudança de cor' },
					{ value: 'Nenhuma', label: 'Nenhuma' }
				]
			}
		]
	},
	{
		id: 'seguranca_anestesica',
		number: 2,
		title: 'Segurança anestésica e hemostasia',
		subtitle: 'Alergias, medicamentos interferentes na coagulação e histórico anestésico',
		fields: [
			{
				id: 'alergias',
				label: 'Alergias conhecidas?',
				type: 'yesno',
				allowNaoSei: true,
				alert: {
					triggerValue: 'Sim',
					label: 'Alergia relatada'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Especifique o agente ou reação (ex.: lidocaína, dipirona, anafilaxia)...',
					subField: {
						id: 'alergias_categorias',
						label: 'Agentes alergênicos',
						type: 'checkboxGroup',
						options: [
							{ value: 'Anestésico local', label: 'Anestésico local' },
							{ value: 'Látex', label: 'Látex' },
							{ value: 'Antibiótico', label: 'Antibiótico' },
							{ value: 'Iodo', label: 'Iodo' },
							{ value: 'Clorexidina', label: 'Clorexidina' },
							{ value: 'Adesivo', label: 'Adesivo' },
							{ value: 'Outro', label: 'Outro' }
						]
					}
				}
			},
			{
				id: 'anticoagulante',
				label: 'Usa anticoagulante (varfarina, DOACs)?',
				type: 'yesno',
				allowNaoSei: true,
				alert: {
					triggerValue: 'Sim',
					label: 'Anticoagulante em uso',
					note: 'risco hemorrágico aumentado'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual fármaco, dose e última tomada? (ex.: rivaroxabana 20 mg, varfarina...)'
				}
			},
			{
				id: 'antiagregante',
				label: 'Usa antiagregante plaquetário (AAS, clopidogrel)?',
				type: 'yesno',
				allowNaoSei: true,
				alert: {
					triggerValue: 'Sim',
					label: 'Antiagregante plaquetário em uso',
					note: 'atenção à hemostasia local'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual fármaco e motivo de uso? (ex.: AAS 100 mg, stent recente...)'
				}
			},
			{
				id: 'aines',
				label: 'Usa AINEs regularmente?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual anti-inflamatório e frequência? (opcional)'
				}
			},
			{
				id: 'corticoide',
				label: 'Usa corticoide?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Fármaco, dose e tempo de uso (opcional)'
				}
			},
			{
				id: 'imunossupressor',
				label: 'Usa imunossupressor?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual medicamento? (ex.: metotrexato, azatioprina, imunobiológico...)'
				}
			},
			{
				id: 'fitoterapicos',
				label: 'Usa fitoterápicos/suplementos (ginkgo, alho, vitamina E)?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Quais suplementos ou fitoterápicos? (opcional)'
				}
			},
			{
				id: 'hipoglicemiante',
				label: 'Usa hipoglicemiante oral ou insulina?',
				type: 'radio',
				options: [
					{ value: 'Não', label: 'Não' },
					{ value: 'Oral', label: 'Oral' },
					{ value: 'Insulina', label: 'Insulina' },
					{ value: 'Ambos', label: 'Ambos' }
				],
				conditionalDetail: {
					triggerValue: ['Oral', 'Insulina', 'Ambos'],
					placeholder: 'Quais medicamentos e horário da última dose? (opcional)'
				}
			},
			{
				id: 'sangramento_excessivo',
				label: 'Sangramento excessivo pessoal ou hematomas fáceis?',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Histórico de sangramento excessivo / hematomas fáceis'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Detalhes do quadro hemorrágico (opcional)'
				}
			},
			{
				id: 'sangramento_familiar',
				label: 'Sangramento familiar anormal?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual coagulopatia ou parentesco? (opcional)'
				}
			},
			{
				id: 'sangramento_dentario',
				label: 'Sangramento prolongado após extração dentária ou cirurgia?',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Sangramento prolongado pós-extração/cirurgia'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Detalhes do episódio (opcional)'
				}
			},
			{
				id: 'intercorrencia_anestesia',
				label: 'Intercorrência em anestesia ou cirurgia prévia?',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Intercorrência anestésica/cirúrgica prévia'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual intercorrência ocorreu?'
				}
			},
			{
				id: 'hipertermia_maligna',
				label: 'Hipertermia maligna pessoal ou familiar?',
				type: 'yesno',
				allowNaoSei: true,
				alert: {
					triggerValue: 'Sim',
					label: 'Hipertermia maligna (pessoal ou familiar)'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Detalhes (opcional)'
				}
			}
		]
	},
	{
		id: 'comorbidades',
		number: 3,
		title: 'Comorbidades',
		subtitle: 'Condições clínicas de base com impacto cirúrgico ou cicatricial',
		fields: [
			{
				id: 'hipertensao',
				label: 'Hipertensão arterial',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Medicações em uso / controle pressórico (opcional)'
				}
			},
			{
				id: 'cardiopatia',
				label: 'Cardiopatia (DAC, ICC, IAM prévio)',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Especifique a cardiopatia (opcional)'
				}
			},
			{
				id: 'arritmia',
				label: 'Arritmia cardíaca',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Ex.: Fibrilação atrial, extrassístoles... (opcional)'
				}
			},
			{
				id: 'marcapasso_cdi',
				label: 'Marca-passo ou CDI',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Portador de Marca-passo ou CDI',
					note: 'atenção ao eletrocautério (preferir bipolar ou bisturi frio)'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Tipo do dispositivo e indicação (opcional)'
				}
			},
			{
				id: 'valvopatia',
				label: 'Valvopatia ou prótese valvar',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Valvopatia ou prótese valvar',
					note: 'avaliar profilaxia de endocardite infecciosa'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Qual valva/prótese? (opcional)'
				}
			},
			{
				id: 'diabetes',
				label: 'Diabetes mellitus',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Última HbA1c ou observações (opcional)',
					subField: {
						id: 'diabetes_controle',
						label: 'Controle glicêmico atual',
						type: 'radio',
						options: [
							{ value: 'Bom', label: 'Bom' },
							{ value: 'Regular', label: 'Regular' },
							{ value: 'Ruim', label: 'Ruim' },
							{ value: 'Não sabe', label: 'Não sabe' }
						]
					}
				}
			},
			{
				id: 'doenca_renal',
				label: 'Doença renal',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Estágio / diálise / creatinina basal (opcional)'
				}
			},
			{
				id: 'doenca_hepatica',
				label: 'Doença hepática',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Cirrose, hepatite crônica, etc. (opcional)'
				}
			},
			{
				id: 'imunossupressao_hiv',
				label: 'Imunossupressão ou HIV',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'TARV, carga viral / CD4 ou causa da imunossupressão (opcional)'
				}
			},
			{
				id: 'neoplasia',
				label: 'Neoplasia em tratamento',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Sítio primário e tratamento atual (opcional)'
				}
			},
			{
				id: 'radioterapia_area',
				label: 'Radioterapia prévia na área da cirurgia',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Época e região irradiada (opcional)'
				}
			},
			{
				id: 'doenca_pele',
				label: 'Doença de pele relevante',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Ex.: Psoríase, vitiligo, dermatite atópica, hidradenite... (opcional)'
				}
			},
			{
				id: 'queloide',
				label: 'Tendência a queloide ou cicatriz hipertrófica',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Tendência a queloide ou cicatriz hipertrófica'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Local de queloide prévio (opcional)'
				}
			},
			{
				id: 'protese_articular',
				label: 'Prótese articular recente',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Articulação e há quanto tempo (opcional)'
				}
			}
		]
	},
	{
		id: 'habitos',
		number: 4,
		title: 'Hábitos e situações especiais',
		subtitle: 'Estilo de vida, gestação/lactação, capacidade funcional e imunização',
		fields: [
			{
				id: 'tabagismo',
				label: 'Tabagismo',
				type: 'radio',
				options: [
					{ value: 'Nunca', label: 'Nunca' },
					{ value: 'Ex-fumante', label: 'Ex-fumante' },
					{ value: 'Atual', label: 'Atual' }
				]
			},
			{
				id: 'alcool',
				label: 'Consumo de álcool',
				type: 'radio',
				options: [
					{ value: 'Não', label: 'Não' },
					{ value: 'Social', label: 'Social' },
					{ value: 'Frequente', label: 'Frequente' }
				]
			},
			{
				id: 'outras_drogas',
				label: 'Outras drogas / substâncias',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Especifique (opcional)'
				}
			},
			{
				id: 'gestacao',
				label: 'Gestação em curso?',
				type: 'yesno',
				allowNaoSei: true,
				showIf: {
					fieldId: 'sexo',
					equals: 'Feminino'
				},
				alert: {
					triggerValue: 'Sim',
					label: 'Paciente gestante'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Idade gestacional (semanas) / trimestre (opcional)'
				}
			},
			{
				id: 'lactacao',
				label: 'Lactação (amamentando)?',
				type: 'yesno',
				showIf: {
					fieldId: 'sexo',
					equals: 'Feminino'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Observações sobre amamentação (opcional)'
				}
			},
			{
				id: 'capacidade_funcional',
				label: 'Capacidade funcional: sobe dois lances de escada sem parar (≥ 4 METs)?',
				type: 'yesno',
				alert: {
					triggerValue: 'Não',
					label: 'Baixa capacidade funcional (< 4 METs)'
				}
			},
			{
				id: 'vacina_antitetanica',
				label: 'Vacina antitetânica em dia (últimos 10 anos)?',
				type: 'radio',
				options: [
					{ value: 'Sim', label: 'Sim' },
					{ value: 'Não', label: 'Não' },
					{ value: 'Não sabe', label: 'Não sabe' }
				]
			}
		]
	},
	{
		id: 'exame_fisico',
		number: 5,
		title: 'Exame físico direcionado',
		subtitle: 'Sinais vitais, inspeção local, linfonodos e classificação ASA',
		fields: [
			{
				id: 'pa_sistolica',
				label: 'PA sistólica (PAS)',
				type: 'number',
				unit: 'mmHg',
				min: 40,
				max: 300,
				placeholder: 'Ex.: 120'
			},
			{
				id: 'pa_diastolica',
				label: 'PA diastólica (PAD)',
				type: 'number',
				unit: 'mmHg',
				min: 20,
				max: 200,
				placeholder: 'Ex.: 80'
			},
			{
				id: 'fc',
				label: 'Frequência cardíaca (FC)',
				type: 'number',
				unit: 'bpm',
				min: 25,
				max: 250,
				placeholder: 'Ex.: 72'
			},
			{
				id: 'temperatura',
				label: 'Temperatura axilar',
				type: 'number',
				unit: '°C',
				min: 32,
				max: 43,
				step: 0.1,
				placeholder: 'Ex.: 36.5'
			},
			{
				id: 'sato2',
				label: 'Saturação de O₂ (SatO₂)',
				type: 'number',
				unit: '%',
				min: 50,
				max: 100,
				placeholder: 'Ex.: 98'
			},
			{
				id: 'glicemia_capilar',
				label: 'Glicemia capilar (HGT)',
				type: 'number',
				unit: 'mg/dL',
				min: 20,
				max: 600,
				placeholder: 'Ex.: 110',
				showIf: {
					fieldId: 'diabetes',
					equals: 'Sim'
				}
			},
			{
				id: 'sinais_infeccao_lesao',
				label: 'Sinais de infecção na lesão ou pele ao redor?',
				type: 'yesno',
				alert: {
					triggerValue: 'Sim',
					label: 'Sinais de infecção ativa no local da lesão'
				},
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Ex.: Hiperemia, calor local, drenagem purulenta...'
				}
			},
			{
				id: 'linfonodos_regionais',
				label: 'Linfonodos regionais palpáveis',
				type: 'radio',
				options: [
					{ value: 'Não', label: 'Não' },
					{ value: 'Sim', label: 'Sim' },
					{ value: 'Não avaliado', label: 'Não avaliado' }
				],
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Cadeia linfonodal e características (opcional)'
				}
			},
			{
				id: 'via_aerea_ausculta',
				label: 'Via aérea / ausculta cardiopulmonar',
				type: 'radio',
				showIf: {
					fieldId: 'sedacao',
					equals: 'Sim'
				},
				options: [
					{ value: 'Sem alterações', label: 'Sem alterações' },
					{ value: 'Alterada', label: 'Alterada' },
					{ value: 'Não avaliado', label: 'Não avaliado' }
				],
				conditionalDetail: {
					triggerValue: 'Alterada',
					placeholder: 'Descreva a alteração de via aérea ou ausculta'
				}
			},
			{
				id: 'asa',
				label: 'Classificação ASA',
				type: 'radio',
				options: [
					{ value: 'I', label: 'ASA I' },
					{ value: 'II', label: 'ASA II' },
					{ value: 'III', label: 'ASA III' },
					{ value: 'IV', label: 'ASA IV' }
				],
				alert: {
					triggerValue: ['III', 'IV'],
					label: 'Classificação ASA ≥ III',
					note: 'avaliar risco cirúrgico e ambiente adequado'
				}
			}
		]
	},
	{
		id: 'fechamento',
		number: 6,
		title: 'Fechamento',
		subtitle: 'Consentimento, orientações pós-operatórias e anatomopatológico',
		fields: [
			{
				id: 'consentimento_assinado',
				label: 'Consentimento informado assinado?',
				type: 'yesno'
			},
			{
				id: 'orientacoes_pos_op',
				label: 'Orientações de pós-operatório entregues por escrito?',
				type: 'yesno'
			},
			{
				id: 'envio_patologia',
				label: 'Material será enviado à patologia (anatomopatológico)?',
				type: 'yesno',
				conditionalDetail: {
					triggerValue: 'Sim',
					placeholder: 'Número de frascos / identificação das peças (opcional)'
				}
			},
			{
				id: 'observacoes_gerais',
				label: 'Observações gerais',
				type: 'textarea',
				placeholder: 'Anotações complementares da consulta ou do planejamento cirúrgico (opcional)...'
			}
		]
	}
];

