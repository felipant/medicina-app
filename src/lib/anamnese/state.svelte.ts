import { ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA } from './schema';
import { extractActiveAlerts, isFieldVisible, serializeAnswers } from './serialize';
import {
	detailKey,
	type AnamneseAnswers,
	type AnamneseSchema,
	type FieldAnswerValue,
	type SectionSchema
} from './types';

const DRAFT_STORAGE_KEY = 'medhub_pequenas_cirurgias_draft_v1';
const DRAFT_OPTIN_KEY = 'medhub_pequenas_cirurgias_optin_v1';

export class AnamneseFormState {
	schema: AnamneseSchema = ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA;
	answers = $state<AnamneseAnswers>({});
	onlyPositive = $state<boolean>(false);
	saveDraftEnabled = $state<boolean>(true);
	collapsedSections = $state<Record<string, boolean>>({});

	activeAlerts = $derived.by(() => extractActiveAlerts(this.schema, this.answers));

	serialized = $derived.by(() =>
		serializeAnswers(this.schema, this.answers, {
			onlyPositive: this.onlyPositive
		})
	);

	constructor(schema: AnamneseSchema = ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA) {
		this.schema = schema;
	}

	initFromStorage(): void {
		if (typeof window === 'undefined') return;
		try {
			this.saveDraftEnabled = true;
			const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (parsed && typeof parsed === 'object') {
					this.answers = parsed;
				}
			}
		} catch {
			// Ignore storage errors in restricted environments
		}
	}

	persistDraftIfEnabled(): void {
		if (typeof window === 'undefined') return;
		try {
			if (this.saveDraftEnabled) {
				window.localStorage.setItem(DRAFT_OPTIN_KEY, '1');
				window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(this.answers));
			} else {
				window.localStorage.removeItem(DRAFT_OPTIN_KEY);
				window.localStorage.removeItem(DRAFT_STORAGE_KEY);
			}
		} catch {
			// Ignore storage quota errors
		}
	}

	setDraftEnabled(enabled: boolean): void {
		this.saveDraftEnabled = enabled;
		this.persistDraftIfEnabled();
	}

	setAnswer(fieldId: string, value: FieldAnswerValue): void {
		this.answers[fieldId] = value;
		this.persistDraftIfEnabled();
	}

	toggleSingleChoice(fieldId: string, value: string): void {
		const current = this.answers[fieldId];
		if (current === value) {
			this.answers[fieldId] = '';
		} else {
			this.answers[fieldId] = value;
		}
		this.persistDraftIfEnabled();
	}

	toggleCheckboxOption(fieldId: string, optionValue: string, exclusiveOption?: string): void {
		const raw = this.answers[fieldId];
		const currentList: string[] = Array.isArray(raw) ? [...raw] : [];

		if (exclusiveOption && optionValue === exclusiveOption) {
			if (currentList.includes(exclusiveOption)) {
				this.answers[fieldId] = [];
			} else {
				this.answers[fieldId] = [exclusiveOption];
			}
			this.persistDraftIfEnabled();
			return;
		}

		const filtered = exclusiveOption
			? currentList.filter((item) => item !== exclusiveOption)
			: currentList;

		const idx = filtered.indexOf(optionValue);
		if (idx >= 0) {
			filtered.splice(idx, 1);
		} else {
			filtered.push(optionValue);
		}
		this.answers[fieldId] = filtered;
		this.persistDraftIfEnabled();
	}

	/**
	 * Marca "Não" em todos os campos yesno visíveis da seção.
	 * Se houver campos ainda em branco, preenche apenas os em branco com "Não" (preservando eventuais "Sim" já marcados).
	 * Se todos já estiverem preenchidos, define todos como "Não".
	 */
	markSectionAllNo(section: SectionSchema): void {
		const visibleYesNo = section.fields.filter(
			(f) => f.type === 'yesno' && isFieldVisible(f, this.answers)
		);
		const hasUnanswered = visibleYesNo.some((f) => {
			const val = this.answers[f.id];
			return !val || String(val).trim() === '';
		});

		for (const field of visibleYesNo) {
			if (hasUnanswered) {
				const current = this.answers[field.id];
				if (!current || String(current).trim() === '') {
					this.answers[field.id] = 'Não';
				}
			} else {
				this.answers[field.id] = 'Não';
				this.answers[detailKey(field.id)] = '';
				if (field.conditionalDetail?.subField) {
					this.answers[field.conditionalDetail.subField.id] =
						field.conditionalDetail.subField.type === 'checkboxGroup' ? [] : '';
				}
			}
		}
		this.persistDraftIfEnabled();
	}

	toggleSectionCollapse(sectionId: string): void {
		this.collapsedSections[sectionId] = !this.collapsedSections[sectionId];
	}

	clearAll(clearDraftSetting = false): void {
		this.answers = {};
		if (clearDraftSetting) {
			this.saveDraftEnabled = false;
		}
		if (typeof window !== 'undefined') {
			try {
				window.localStorage.removeItem(DRAFT_STORAGE_KEY);
				if (clearDraftSetting) {
					window.localStorage.removeItem(DRAFT_OPTIN_KEY);
				}
			} catch {
				// Ignore
			}
		}
	}
}

