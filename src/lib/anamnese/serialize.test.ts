import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA } from './schema';
import { serializeAnswers } from './serialize';
import { detailKey, formatPhoneBR, type AnamneseAnswers } from './types';
import { formatSerializedText } from './exportText';
import { buildPdfFilename, generatePdfBytes } from './exportPdf';

describe('serializeAnswers — Anamnese Rápida (Pequenas Cirurgias)', () => {
	const fixedNow = new Date(2026, 10, 5, 14, 30); // 05/11/2026 14:30

	it('1. Omite campos vazios e seções sem nenhuma resposta preenchida', () => {
		const answers: AnamneseAnswers = {
			nome: '   ',
			procedimento: '',
			mudancas_recentes: []
		};

		const result = serializeAnswers(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA, answers, {
			now: fixedNow
		});

		assert.equal(result.sections.length, 0);
		assert.equal(result.alerts.length, 0);
	});

	it('2. Inclui respostas "Não" e "Não sei" por padrão e mantém nome/idade/sexo apenas no cabeçalho', () => {
		const answers: AnamneseAnswers = {
			nome: 'Maria Silva',
			idade: 54,
			sexo: 'Feminino',
			procedimento: 'Biópsia de pele por punch.',
			anticoagulante: 'Não',
			antiagregante: 'Não sei'
		};

		const result = serializeAnswers(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA, answers, {
			now: fixedNow
		});

		// Nome, idade e sexo ficam no cabeçalho
		assert.equal(result.patientName, 'Maria Silva');
		assert.equal(result.patientAge, '54 anos');
		assert.equal(result.patientSex, 'Feminino');

		// E não são repetidos dentro dos itens da seção 1
		const secIdent = result.sections.find((s) => s.id === 'identificacao');
		assert.ok(secIdent);
		assert.equal(secIdent.items.length, 1);
		assert.equal(secIdent.items[0].id, 'procedimento');

		// "Não" e "Não sei" são considerados preenchidos
		const secSeguranca = result.sections.find((s) => s.id === 'seguranca_anestesica');
		assert.ok(secSeguranca);
		assert.equal(secSeguranca.items.length, 2);
		assert.equal(secSeguranca.items[0].id, 'anticoagulante');
		assert.equal(secSeguranca.items[0].displayValue, 'Não');
		assert.equal(secSeguranca.items[1].id, 'antiagregante');
		assert.equal(secSeguranca.items[1].displayValue, 'Não sei');
	});

	it('3. Respeita o toggle onlyPositive (omite "Não" quando ativado, mantendo "Sim" e demais respostas)', () => {
		const answers: AnamneseAnswers = {
			nome: 'Carlos Souza',
			anticoagulante: 'Sim',
			[detailKey('anticoagulante')]: 'varfarina 5mg',
			antiagregante: 'Não',
			aines: 'Não',
			hipertensao: 'Não'
		};

		const result = serializeAnswers(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA, answers, {
			onlyPositive: true,
			now: fixedNow
		});

		// Seção 3 (comorbidades) tinha apenas "Não", portanto deve ser omitida por inteiro
		assert.equal(
			result.sections.some((s) => s.id === 'comorbidades'),
			false
		);

		// Seção 2 deve conter apenas anticoagulante = Sim
		const secSeg = result.sections.find((s) => s.id === 'seguranca_anestesica');
		assert.ok(secSeg);
		assert.equal(secSeg.items.length, 1);
		assert.equal(secSeg.items[0].id, 'anticoagulante');
		assert.equal(secSeg.items[0].displayValue, 'Sim');
		assert.equal(secSeg.items[0].detailText, 'varfarina 5mg');
	});

	it('4. Nunca exporta campos ocultos por regra condicional (showIf)', () => {
		const answers: AnamneseAnswers = {
			nome: 'João Pereira',
			sexo: 'Masculino',
			// Gestação e lactação só devem aparecer se sexo === 'Feminino'
			gestacao: 'Sim',
			lactacao: 'Sim',
			// Glicemia capilar só deve aparecer se diabetes === 'Sim'
			diabetes: 'Não',
			glicemia_capilar: 118,
			// Via aérea só deve aparecer se sedacao === 'Sim'
			sedacao: 'Não',
			via_aerea_ausculta: 'Alterada'
		};

		const result = serializeAnswers(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA, answers, {
			now: fixedNow
		});

		const allExportedFieldIds = result.sections.flatMap((s) => s.items.map((i) => i.id));
		assert.equal(allExportedFieldIds.includes('gestacao'), false);
		assert.equal(allExportedFieldIds.includes('lactacao'), false);
		assert.equal(allExportedFieldIds.includes('glicemia_capilar'), false);
		assert.equal(allExportedFieldIds.includes('via_aerea_ausculta'), false);

		// Também não deve gerar alerta para campo oculto (gestacao = Sim mas sexo = Masculino)
		assert.equal(
			result.alerts.some((a) => a.fieldId === 'gestacao'),
			false
		);
	});

	it('5. Preserva a ordem declarada das seções, extrai alertas e formata telefone (XX) XXXXX-XXXX', () => {
		const answers: AnamneseAnswers = {
			observacoes_gerais: 'Paciente tranquilo.',
			nome: 'Fulano de Tal',
			idade: 54,
			procedimento: 'Cantoplastia para unha encravada.',
			anticoagulante: 'Sim',
			[detailKey('anticoagulante')]: 'varfarina',
			marcapasso_cdi: 'Sim',
			asa: 'III'
		};

		const result = serializeAnswers(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA, answers, {
			now: fixedNow
		});

		const sectionNumbers = result.sections.map((s) => s.number);
		assert.deepEqual(sectionNumbers, [1, 2, 3, 5, 6]);

		// Verifica alertas extraídos
		assert.equal(result.alerts.length, 3);
		assert.ok(result.alerts[0].formatted.includes('Anticoagulante em uso: Sim'));
		assert.ok(result.alerts[0].formatted.includes('varfarina'));

		// Verifica formatação de texto e PDF
		const txt = formatSerializedText(result);
		assert.ok(txt.includes('ANAMNESE — 05/11/2026 14:30'));
		assert.ok(txt.includes('Paciente: Fulano de Tal, 54 anos'));
		assert.ok(!txt.includes('Nome do paciente:'));
		assert.ok(txt.includes('PONTOS DE ATENÇÃO'));

		// Verifica máscara de telefone
		assert.equal(formatPhoneBR('32999887766'), '(32) 99988-7766');
		assert.equal(formatPhoneBR('abc3233711234xyz'), '(32) 3371-1234');

		const filename = buildPdfFilename('José Ávila Conceição', fixedNow);
		assert.equal(filename, 'anamnese_jose_avila_conceicao_2026-11-05.pdf');

		const pdfBytes = generatePdfBytes(result);
		assert.ok(pdfBytes.byteLength > 500);
	});
});
