import { serializeAnswers } from './serialize';
import type {
	AnamneseAnswers,
	AnamneseSchema,
	SerializedAnamnese,
	SerializeOptions
} from './types';

export function formatSerializedText(data: SerializedAnamnese): string {
	const lines: string[] = [];

	lines.push(`ANAMNESE — ${data.generatedAtDate} ${data.generatedAtTime}`);

	const patientParts: string[] = [];
	if (data.patientName) patientParts.push(data.patientName);
	if (data.patientAge) patientParts.push(data.patientAge);
	if (data.patientSex) patientParts.push(data.patientSex);

	if (patientParts.length > 0) {
		lines.push(`Paciente: ${patientParts.join(', ')}`);
	} else {
		lines.push('Paciente: Não informado');
	}

	if (data.alerts.length > 0) {
		lines.push('');
		lines.push('PONTOS DE ATENÇÃO');
		for (const alert of data.alerts) {
			lines.push(`- ${alert.formatted}`);
		}
	}

	for (const section of data.sections) {
		lines.push('');
		lines.push(`${section.number}. ${section.title.toUpperCase()}`);
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
			const suffix = extras.length > 0 ? ` (${extras.join(' | ')})` : '';
			lines.push(`${item.label}: ${item.displayValue}${suffix}`);
		}
	}

	return lines.join('\n').trim();
}

export function generateAnamneseText(
	schema: AnamneseSchema,
	answers: AnamneseAnswers,
	options: SerializeOptions = {}
): string {
	const serialized = serializeAnswers(schema, answers, options);
	return formatSerializedText(serialized);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
	if (typeof window === 'undefined') return false;

	if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			// Fallback to execCommand below
		}
	}

	try {
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', 'true');
		textarea.style.position = 'fixed';
		textarea.style.top = '-9999px';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		const ok = document.execCommand('copy');
		document.body.removeChild(textarea);
		return ok;
	} catch {
		return false;
	}
}

