export type FieldType =
	| 'yesno'
	| 'radio'
	| 'checkboxGroup'
	| 'text'
	| 'textarea'
	| 'number'
	| 'date';

export type YesNoValue = 'Sim' | 'Não' | 'Não sei' | '';

export interface FieldOption {
	value: string;
	label: string;
}

export interface ConditionalSubField {
	id: string;
	label: string;
	type: 'checkboxGroup' | 'radio';
	options: FieldOption[];
}

export interface ConditionalDetailConfig {
	/** Valor(es) que ativam o complemento. Padrão: 'Sim' */
	triggerValue?: string | string[];
	/** Rótulo opcional do campo de texto complementar */
	label?: string;
	/** Placeholder do campo de texto complementar */
	placeholder?: string;
	/** Se false, não exibe o input de texto livre (apenas o subField, se houver). Padrão: true */
	allowText?: boolean;
	/** Sub-campo estruturado (ex.: tipos de alergia ou controle do diabetes) */
	subField?: ConditionalSubField;
}

export interface AlertConfig {
	/** Valor(es) que disparam o ponto de atenção. Padrão: 'Sim' */
	triggerValue?: string | string[];
	/** Rótulo curto para o painel de pontos de atenção */
	label: string;
	/** Nota clínica adicional (ex.: "atenção ao eletrocautério") */
	note?: string;
}

export interface ShowIfRule {
	fieldId: string;
	equals: string | string[];
}

export interface FieldSchema {
	id: string;
	label: string;
	type: FieldType;
	options?: FieldOption[];
	/** Para campos yesno: exibe também a opção "Não sei" */
	allowNaoSei?: boolean;
	/** Para campos checkboxGroup: valor que desmarca os demais (ex.: "Nenhuma") */
	exclusiveOption?: string;
	placeholder?: string;
	unit?: string;
	min?: number;
	max?: number;
	step?: number;
	/** Nota auxiliar exibida abaixo do rótulo */
	hint?: string;
	/** Máscara de entrada automática (ex.: telefone no formato (XX) XXXXX-XXXX) */
	mask?: 'phone';
	/** Sugestões de preenchimento automático (autocomplete) para campos text */
	suggestions?: string[];
	/** Quando true, o campo é exibido apenas no cabeçalho da exportação (PDF/Texto) e não é repetido dentro da seção */
	excludeFromSectionExport?: boolean;
	/** Complemento condicional quando a resposta atinge triggerValue (padrão 'Sim') */
	conditionalDetail?: ConditionalDetailConfig;
	/** Regra declarativa de visibilidade condicional */
	showIf?: ShowIfRule;
	/** Configuração de alerta para o painel "Pontos de atenção" */
	alert?: AlertConfig;
}

export interface SectionSchema {
	id: string;
	number: number;
	title: string;
	subtitle?: string;
	fields: FieldSchema[];
}

export type AnamneseSchema = SectionSchema[];

export type FieldAnswerValue = string | number | string[] | undefined | null;

export type AnamneseAnswers = Record<string, FieldAnswerValue>;

export interface SerializeOptions {
	/** Quando true, omite respostas iguais a "Não" */
	onlyPositive?: boolean;
	/** Data/hora de referência para cabeçalho */
	now?: Date;
}

export interface SerializedFieldItem {
	id: string;
	label: string;
	displayValue: string;
	rawValue: FieldAnswerValue;
	detailText?: string;
	subFieldLabel?: string;
	subFieldDisplayValue?: string;
	isAlert: boolean;
}

export interface SerializedSection {
	id: string;
	number: number;
	title: string;
	items: SerializedFieldItem[];
}

export interface SerializedAlert {
	fieldId: string;
	label: string;
	answerDisplay: string;
	detail?: string;
	note?: string;
	formatted: string;
}

export interface SerializedAnamnese {
	generatedAtDate: string;
	generatedAtTime: string;
	patientName: string;
	patientAge: string;
	patientSex: string;
	alerts: SerializedAlert[];
	sections: SerializedSection[];
}

export function detailKey(fieldId: string): string {
	return `${fieldId}__detalhe`;
}

/**
 * Aceita apenas dígitos e formata automaticamente no padrão brasileiro:
 * (XX) XXXXX-XXXX (ou (XX) XXXX-XXXX para 10 dígitos)
 */
export function formatPhoneBR(raw: string): string {
	const digits = raw.replace(/\D/g, '').slice(0, 11);
	if (digits.length === 0) return '';
	if (digits.length <= 2) return `(${digits}`;
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}


