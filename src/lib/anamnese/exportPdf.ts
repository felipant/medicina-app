import { serializeAnswers } from './serialize';
import type {
	AnamneseAnswers,
	AnamneseSchema,
	SerializedAnamnese,
	SerializeOptions
} from './types';

/**
 * Normaliza o nome do paciente para uso seguro no nome do arquivo:
 * anamnese_<nome-sem-acentos>_<AAAA-MM-DD>.pdf
 */
export function buildPdfFilename(patientName: string, now: Date = new Date()): string {
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	const datePart = `${yyyy}-${mm}-${dd}`;

	const raw = (patientName || 'paciente').trim();
	const slug = raw
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');

	return `anamnese_${slug || 'paciente'}_${datePart}.pdf`;
}

/**
 * Converte string UTF-8 para bytes WinAnsiEncoding (CP1252 / Latin1 estendido)
 * suportado nativamente pelas fontes padrão do PDF 1.4 com /WinAnsiEncoding,
 * garantindo acentuação completa em português do Brasil sem dependências Node.
 */
const WIN_ANSI_MAP: Record<number, number> = {
	0x20ac: 128, // €
	0x201a: 130, // ‚
	0x0192: 131, // ƒ
	0x201e: 132, // „
	0x2026: 133, // …
	0x2020: 134, // †
	0x2021: 135, // ‡
	0x02c6: 136, // ˆ
	0x2030: 137, // ‰
	0x0160: 138, // Š
	0x2039: 139, // ‹
	0x0152: 140, // Œ
	0x017d: 142, // Ž
	0x2018: 145, // ‘
	0x2019: 146, // ’
	0x201c: 147, // “
	0x201d: 148, // ”
	0x2022: 149, // •
	0x2013: 150, // –
	0x2014: 151, // —
	0x02dc: 152, // ˜
	0x2122: 153, // ™
	0x0161: 154, // š
	0x203a: 155, // ›
	0x0153: 156, // œ
	0x017e: 158, // ž
	0x0178: 159 // Ÿ
};

function normalizeSpecialChars(text: string): string {
	return text
		.replace(/₂/g, '2')
		.replace(/≥/g, '>=')
		.replace(/≤/g, '<=');
}

function encodeWinAnsiHex(text: string): string {
	const normalized = normalizeSpecialChars(text);
	let hex = '<';
	for (let i = 0; i < normalized.length; i++) {
		const code = normalized.charCodeAt(i);
		let byte = 63; // '?'
		if (code >= 32 && code <= 126) {
			byte = code;
		} else if (code >= 160 && code <= 255) {
			byte = code;
		} else if (WIN_ANSI_MAP[code] !== undefined) {
			byte = WIN_ANSI_MAP[code];
		}
		hex += byte.toString(16).padStart(2, '0').toUpperCase();
	}
	hex += '>';
	return hex;
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
	const words = normalizeSpecialChars(text).split(/\s+/).filter(Boolean);
	if (words.length === 0) return [''];
	const lines: string[] = [];
	let current = words[0];

	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		if ((current + ' ' + word).length <= maxCharsPerLine) {
			current += ' ' + word;
		} else {
			lines.push(current);
			current = word;
		}
	}
	if (current) lines.push(current);
	return lines;
}

/**
 * Gera os bytes de um documento PDF A4 multipáginas 100% client-side.
 */
export function generatePdfBytes(data: SerializedAnamnese): Uint8Array {
	const PAGE_WIDTH = 595.28; // A4 pt
	const PAGE_HEIGHT = 841.89; // A4 pt
	const MARGIN_X = 42;
	const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
	const TOP_START_Y = PAGE_HEIGHT - 46;
	const BOTTOM_LIMIT_Y = 78;

	const pagesCommands: string[][] = [];
	let currentCommands: string[] = [];
	let cursorY = TOP_START_Y;

	function startNewPage() {
		if (currentCommands.length > 0) {
			pagesCommands.push(currentCommands);
		}
		currentCommands = [];
		cursorY = TOP_START_Y;
	}

	function ensureSpace(requiredHeight: number) {
		if (cursorY - requiredHeight < BOTTOM_LIMIT_Y) {
			startNewPage();
		}
	}

	function drawRect(
		x: number,
		yTop: number,
		w: number,
		h: number,
		fillRgb: [number, number, number],
		strokeRgb?: [number, number, number]
	) {
		const yBottom = yTop - h;
		currentCommands.push('q');
		currentCommands.push(`${fillRgb[0]} ${fillRgb[1]} ${fillRgb[2]} rg`);
		if (strokeRgb) {
			currentCommands.push(`${strokeRgb[0]} ${strokeRgb[1]} ${strokeRgb[2]} RG`);
			currentCommands.push('0.8 w');
			currentCommands.push(`${x.toFixed(2)} ${yBottom.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
		} else {
			currentCommands.push(`${x.toFixed(2)} ${yBottom.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
		}
		currentCommands.push('Q');
	}

	function drawLine(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		rgb: [number, number, number] = [0.85, 0.88, 0.86],
		width = 0.7
	) {
		currentCommands.push('q');
		currentCommands.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} RG`);
		currentCommands.push(`${width} w`);
		currentCommands.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
		currentCommands.push('Q');
	}

	function drawText(
		text: string,
		x: number,
		y: number,
		font: 'F1' | 'F2',
		size: number,
		rgb: [number, number, number] = [0.06, 0.09, 0.07]
	) {
		currentCommands.push('BT');
		currentCommands.push(`/${font} ${size} Tf`);
		currentCommands.push(`${rgb[0]} ${rgb[1]} ${rgb[2]} rg`);
		currentCommands.push(`${x.toFixed(2)} ${y.toFixed(2)} Td`);
		currentCommands.push(`${encodeWinAnsiHex(text)} Tj`);
		currentCommands.push('ET');
	}

	// ── CABEÇALHO DO DOCUMENTO ──
	drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, 58, [0.94, 0.99, 0.96], [0.73, 0.93, 0.8]);
	drawText(
		'ANAMNESE RÁPIDA — PEQUENAS CIRURGIAS AMBULATORIAIS',
		MARGIN_X + 12,
		cursorY - 19,
		'F2',
		11.5,
		[0.08, 0.45, 0.22]
	);

	const patientLineParts: string[] = [];
	patientLineParts.push(`Paciente: ${data.patientName || 'Não informado'}`);
	if (data.patientAge) patientLineParts.push(`Idade: ${data.patientAge}`);
	if (data.patientSex) patientLineParts.push(`Sexo: ${data.patientSex}`);

	drawText(
		patientLineParts.join('   |   '),
		MARGIN_X + 12,
		cursorY - 40,
		'F2',
		10,
		[0.05, 0.07, 0.06]
	);

	cursorY -= 72;

	// ── BLOCO PONTOS DE ATENÇÃO ──
	if (data.alerts.length > 0) {
		const wrappedAlerts: string[][] = data.alerts.map((a) =>
			wrapText(`• ${a.formatted}`, 84)
		);
		const totalAlertLines = wrappedAlerts.reduce((acc, l) => acc + l.length, 0);
		const boxHeight = 26 + totalAlertLines * 14 + 8;

		ensureSpace(boxHeight + 12);
		drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, boxHeight, [1.0, 0.95, 0.95], [0.94, 0.55, 0.55]);
		drawText(
			`PONTOS DE ATENÇÃO (${data.alerts.length})`,
			MARGIN_X + 12,
			cursorY - 16,
			'F2',
			10,
			[0.72, 0.11, 0.11]
		);

		let alertLineY = cursorY - 32;
		for (const lines of wrappedAlerts) {
			for (let idx = 0; idx < lines.length; idx++) {
				drawText(
					idx === 0 ? lines[idx] : `   ${lines[idx]}`,
					MARGIN_X + 12,
					alertLineY,
					idx === 0 ? 'F2' : 'F1',
					9.2,
					[0.55, 0.09, 0.09]
				);
				alertLineY -= 14;
			}
		}

		cursorY -= boxHeight + 14;
	}

	// ── SEÇÕES E PERGUNTAS/RESPOSTAS ──
	if (data.sections.length === 0) {
		ensureSpace(40);
		drawText(
			'Nenhuma resposta preenchida para os critérios selecionados.',
			MARGIN_X,
			cursorY - 14,
			'F1',
			10,
			[0.4, 0.4, 0.4]
		);
		cursorY -= 30;
	} else {
		for (const section of data.sections) {
			ensureSpace(44);
			drawRect(MARGIN_X, cursorY, CONTENT_WIDTH, 22, [0.93, 0.97, 0.94]);
			drawText(
				`${section.number}. ${section.title.toUpperCase()}`,
				MARGIN_X + 8,
				cursorY - 15,
				'F2',
				9.5,
				[0.08, 0.42, 0.2]
			);
			cursorY -= 30;

			for (const item of section.items) {
				const extras: string[] = [];
				if (item.subFieldDisplayValue) {
					extras.push(
						item.subFieldLabel
							? `${item.subFieldLabel}: ${item.subFieldDisplayValue}`
							: item.subFieldDisplayValue
					);
				}
				if (item.detailText) {
					extras.push(item.detailText);
				}
				const extraStr = extras.length > 0 ? ` (${extras.join(' | ')})` : '';
				const fullAnswer = `${item.displayValue}${extraStr}`;
				const combinedLine = `${item.label}: ${fullAnswer}`;
				const wrapped = wrapText(combinedLine, 88);
				const itemHeight = wrapped.length * 13.5 + 5;

				ensureSpace(itemHeight);

				for (let i = 0; i < wrapped.length; i++) {
					const lineText = wrapped[i];
					if (i === 0) {
						const colonIdx = lineText.indexOf(':');
						if (colonIdx > 0) {
							const qPart = lineText.slice(0, colonIdx + 1);
							const aPart = lineText.slice(colonIdx + 1);
							drawText(qPart, MARGIN_X + 6, cursorY - 10, 'F2', 9.2, [0.1, 0.12, 0.1]);
							const offsetX = MARGIN_X + 6 + qPart.length * 4.85;
							drawText(
								aPart,
								offsetX,
								cursorY - 10,
								item.isAlert ? 'F2' : 'F1',
								9.2,
								item.isAlert ? [0.72, 0.11, 0.11] : [0.12, 0.15, 0.13]
							);
						} else {
							drawText(lineText, MARGIN_X + 6, cursorY - 10, 'F1', 9.2);
						}
					} else {
						drawText(lineText, MARGIN_X + 14, cursorY - 10, 'F1', 9.2, [0.18, 0.2, 0.19]);
					}
					cursorY -= 13.5;
				}

				drawLine(MARGIN_X + 4, cursorY - 1, PAGE_WIDTH - MARGIN_X - 4, cursorY - 1, [0.93, 0.95, 0.94], 0.5);
				cursorY -= 5;
			}

			cursorY -= 8;
		}
	}

	// ── CAMPO DE ASSINATURA E CARIMBO DO PROFISSIONAL ──
	ensureSpace(92);
	cursorY -= 26;
	const sigCenterX = PAGE_WIDTH / 2;
	drawLine(sigCenterX - 130, cursorY - 22, sigCenterX + 130, cursorY - 22, [0.2, 0.25, 0.22], 0.8);
	drawText(
		'Assinatura e Carimbo do Profissional Responsável',
		sigCenterX - 108,
		cursorY - 35,
		'F1',
		8.8,
		[0.3, 0.35, 0.32]
	);
	drawText(
		`Data: ${data.generatedAtDate}`,
		sigCenterX - 38,
		cursorY - 49,
		'F1',
		8.8,
		[0.3, 0.35, 0.32]
	);

	// Finaliza última página
	pagesCommands.push(currentCommands);

	// ── RODAPÉ COM PAGINAÇÃO EM TODAS AS PÁGINAS ──
	const totalPages = pagesCommands.length;
	for (let p = 0; p < totalPages; p++) {
		const cmds = pagesCommands[p];
		cmds.push('q');
		cmds.push('0.85 0.88 0.86 RG 0.6 w');
		cmds.push(`${MARGIN_X} 48 m ${(PAGE_WIDTH - MARGIN_X).toFixed(2)} 48 l S`);
		cmds.push('Q');

		cmds.push('BT');
		cmds.push('/F1 8 Tf');
		cmds.push('0.42 0.46 0.44 rg');
		cmds.push(`${MARGIN_X} 34 Td`);
		cmds.push(
			`${encodeWinAnsiHex('Cirurgias Ambulatoriais')} Tj`
		);
		cmds.push('ET');

		const pageLabel = `Página ${p + 1} de ${totalPages}`;
		cmds.push('BT');
		cmds.push('/F2 8.2 Tf');
		cmds.push('0.25 0.3 0.27 rg');
		cmds.push(`${(PAGE_WIDTH - MARGIN_X - 65).toFixed(2)} 34 Td`);
		cmds.push(`${encodeWinAnsiHex(pageLabel)} Tj`);
		cmds.push('ET');
	}

	// ── MONTAGEM DO BINÁRIO PDF 1.4 ──
	const objects: string[] = [];
	// Obj 1: Catalog
	objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
	// Obj 2: Pages placeholder (will be filled after knowing page object IDs)
	objects.push('');
	// Obj 3: Font F1 (Helvetica Regular com WinAnsiEncoding)
	objects.push(
		'3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj'
	);
	// Obj 4: Font F2 (Helvetica Bold com WinAnsiEncoding)
	objects.push(
		'4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj'
	);

	const pageObjIds: number[] = [];
	for (let p = 0; p < totalPages; p++) {
		const streamContent = pagesCommands[p].join('\n');
		const contentObjId = objects.length + 1;
		objects.push(
			`${contentObjId} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
		);

		const pageObjId = objects.length + 1;
		pageObjIds.push(pageObjId);
		objects.push(
			`${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj`
		);
	}

	objects[1] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${totalPages} >>\nendobj`;

	let pdfString = '%PDF-1.4\n';
	const offsets: number[] = [0];

	for (const obj of objects) {
		offsets.push(pdfString.length);
		pdfString += obj + '\n';
	}

	const xrefOffset = pdfString.length;
	pdfString += `xref\n0 ${objects.length + 1}\n`;
	pdfString += '0000000000 65535 f \n';
	for (let i = 1; i <= objects.length; i++) {
		pdfString += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
	}
	pdfString += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

	const encoder = new TextEncoder();
	return encoder.encode(pdfString);
}

export function exportAnamnesePdf(
	schema: AnamneseSchema,
	answers: AnamneseAnswers,
	options: SerializeOptions = {}
): { filename: string; bytes: Uint8Array } {
	const now = options.now ?? new Date();
	const serialized = serializeAnswers(schema, answers, { ...options, now });
	const bytes = generatePdfBytes(serialized);
	const filename = buildPdfFilename(serialized.patientName, now);

	if (typeof window !== 'undefined' && typeof document !== 'undefined') {
		const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => URL.revokeObjectURL(url), 3000);
	}

	return { filename, bytes };
}

