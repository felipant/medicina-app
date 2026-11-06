import {
	detailKey,
	type AnamneseAnswers,
	type AnamneseSchema,
	type FieldSchema,
	type SectionSchema,
	type SerializedAlert,
	type SerializedAnamnese,
	type SerializedFieldItem,
	type SerializedSection,
	type SerializeOptions
} from './types';

function matchesTrigger(value: unknown, trigger: string | string[] = 'Sim'): boolean {
	if (typeof value !== 'string' || !value.trim()) return false;
	if (Array.isArray(trigger)) {
		return trigger.includes(value);
	}
	return value === trigger;
}

export function isFieldVisible(field: FieldSchema, answers: AnamneseAnswers): boolean {
	if (!field.showIf) return true;
	const targetVal = answers[field.showIf.fieldId];
	return matchesTrigger(targetVal, field.showIf.equals);
}

export function isConditionalDetailActive(field: FieldSchema, answers: AnamneseAnswers): boolean {
	if (!field.conditionalDetail) return false;
	if (!isFieldVisible(field, answers)) return false;
	const val = answers[field.id];
	const trigger = field.conditionalDetail.triggerValue ?? 'Sim';
	return matchesTrigger(val, trigger);
}

export function isFieldAlertActive(field: FieldSchema, answers: AnamneseAnswers): boolean {
	if (!field.alert) return false;
	if (!isFieldVisible(field, answers)) return false;
	const val = answers[field.id];
	const trigger = field.alert.triggerValue ?? 'Sim';
	return matchesTrigger(val, trigger);
}

export function isFieldFilled(field: FieldSchema, answers: AnamneseAnswers): boolean {
	if (!isFieldVisible(field, answers)) return false;
	const raw = answers[field.id];
	if (raw === undefined || raw === null) return false;

	if (field.type === 'checkboxGroup') {
		return Array.isArray(raw) && raw.length > 0;
	}

	if (field.type === 'number') {
		if (typeof raw === 'number') return !Number.isNaN(raw);
		if (typeof raw === 'string') {
			const trimmed = raw.trim();
			return trimmed.length > 0 && !Number.isNaN(Number(trimmed));
		}
		return false;
	}

	if (typeof raw === 'string') {
		return raw.trim().length > 0;
	}

	return false;
}

export function getSectionProgress(
	section: SectionSchema,
	answers: AnamneseAnswers
): { filled: number; total: number; percentage: number } {
	const visibleFields = section.fields.filter((f) => isFieldVisible(f, answers));
	const total = visibleFields.length;
	if (total === 0) return { filled: 0, total: 0, percentage: 0 };
	const filled = visibleFields.filter((f) => isFieldFilled(f, answers)).length;
	const percentage = Math.round((filled / total) * 100);
	return { filled, total, percentage };
}

function formatSubFieldValue(field: FieldSchema, answers: AnamneseAnswers): string {
	const sub = field.conditionalDetail?.subField;
	if (!sub) return '';
	const raw = answers[sub.id];
	if (!raw) return '';
	if (sub.type === 'checkboxGroup' && Array.isArray(raw)) {
		return raw.filter((v) => typeof v === 'string' && v.trim()).join(', ');
	}
	if (typeof raw === 'string') {
		return raw.trim();
	}
	return '';
}

function formatFieldDisplayValue(field: FieldSchema, answers: AnamneseAnswers): string {
	const raw = answers[field.id];
	if (raw === undefined || raw === null) return '';

	if (field.type === 'checkboxGroup') {
		if (!Array.isArray(raw)) return '';
		return raw.filter((v) => typeof v === 'string' && v.trim()).join(', ');
	}

	if (field.type === 'number') {
		const strVal = String(raw).trim();
		if (!strVal) return '';
		return field.unit ? `${strVal} ${field.unit}` : strVal;
	}

	return String(raw).trim();
}

export function extractActiveAlerts(
	schema: AnamneseSchema,
	answers: AnamneseAnswers
): SerializedAlert[] {
	const alerts: SerializedAlert[] = [];

	for (const section of schema) {
		for (const field of section.fields) {
			if (!isFieldAlertActive(field, answers)) continue;
			const alertCfg = field.alert!;
			const answerDisplay = formatFieldDisplayValue(field, answers);
			const detailRaw = answers[detailKey(field.id)];
			const detailStr = typeof detailRaw === 'string' ? detailRaw.trim() : '';
			const subStr = formatSubFieldValue(field, answers);

			const extras: string[] = [];
			if (subStr) extras.push(subStr);
			if (detailStr) extras.push(detailStr);
			if (alertCfg.note) extras.push(alertCfg.note);

			const extraSuffix = extras.length > 0 ? ` (${extras.join(' — ')})` : '';
			const formatted = `${alertCfg.label}: ${answerDisplay}${extraSuffix}`;

			alerts.push({
				fieldId: field.id,
				label: alertCfg.label,
				answerDisplay,
				detail: [subStr, detailStr].filter(Boolean).join(' — ') || undefined,
				note: alertCfg.note,
				formatted
			});
		}
	}

	return alerts;
}

export function serializeAnswers(
	schema: AnamneseSchema,
	answers: AnamneseAnswers,
	options: SerializeOptions = {}
): SerializedAnamnese {
	const { onlyPositive = false, now = new Date() } = options;

	const dd = String(now.getDate()).padStart(2, '0');
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const yyyy = now.getFullYear();
	const hh = String(now.getHours()).padStart(2, '0');
	const min = String(now.getMinutes()).padStart(2, '0');

	const generatedAtDate = `${dd}/${mm}/${yyyy}`;
	const generatedAtTime = `${hh}:${min}`;

	const rawName = answers['nome'];
	const patientName = typeof rawName === 'string' ? rawName.trim() : '';

	const rawAge = answers['idade'];
	const patientAge =
		rawAge !== undefined && rawAge !== null && String(rawAge).trim() !== ''
			? `${String(rawAge).trim()} anos`
			: '';

	const rawSex = answers['sexo'];
	const patientSex = typeof rawSex === 'string' ? rawSex.trim() : '';

	const alerts = extractActiveAlerts(schema, answers);
	const serializedSections: SerializedSection[] = [];

	for (const section of schema) {
		const items: SerializedFieldItem[] = [];

		for (const field of section.fields) {
			if (field.excludeFromSectionExport) continue;
			if (!isFieldVisible(field, answers)) continue;
			if (!isFieldFilled(field, answers)) continue;

			const rawVal = answers[field.id];

			// When onlyPositive is true, omit "Não" responses
			if (onlyPositive && rawVal === 'Não') {
				continue;
			}

			const displayValue = formatFieldDisplayValue(field, answers);
			if (!displayValue) continue;

			let detailText: string | undefined;
			let subFieldLabel: string | undefined;
			let subFieldDisplayValue: string | undefined;

			if (isConditionalDetailActive(field, answers)) {
				const rawDetail = answers[detailKey(field.id)];
				if (typeof rawDetail === 'string' && rawDetail.trim()) {
					detailText = rawDetail.trim();
				}
				const subVal = formatSubFieldValue(field, answers);
				if (subVal && field.conditionalDetail?.subField) {
					subFieldLabel = field.conditionalDetail.subField.label;
					subFieldDisplayValue = subVal;
				}
			}

			items.push({
				id: field.id,
				label: field.label,
				displayValue,
				rawValue: rawVal,
				detailText,
				subFieldLabel,
				subFieldDisplayValue,
				isAlert: isFieldAlertActive(field, answers)
			});
		}

		if (items.length > 0) {
			serializedSections.push({
				id: section.id,
				number: section.number,
				title: section.title,
				items
			});
		}
	}

	return {
		generatedAtDate,
		generatedAtTime,
		patientName,
		patientAge,
		patientSex,
		alerts,
		sections: serializedSections
	};
}

