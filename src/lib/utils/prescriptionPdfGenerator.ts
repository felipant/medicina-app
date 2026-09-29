export interface HealthUnitData {
	name: string;
	phone: string;
	address: string;
	cep: string;
	neighborhood: string;
	city: string;
	state: string;
	email?: string | null;
	businessHours: string;
}

export interface PatientData {
	name: string;
	birthDate?: string;
	cpf?: string;
	address?: string;
}

export interface DoctorData {
	name?: string;
	crm?: string;
	rqe?: string;
}

export interface PrescriptionMedItem {
	id: string;
	name: string;
	concentration?: string;
	form?: string;
	route: string; // e.g. "oral", "topica", "inalatoria", "oftalmica", "otologica", "parenteral", "retal", "vaginal", "sublingual", "nasal"
	dosage: string;
	frequency: string;
	duration?: string;
	quantity: string;
	instructions?: string;
}

export interface PrescriptionPayload {
	healthUnit: HealthUnitData;
	patient: PatientData;
	doctor: DoctorData;
	medications: PrescriptionMedItem[];
	date?: string;
	customInstructions?: string;
}

/**
 * Cleans DDR, RVI and other telecom suffix strings from phone numbers
 */
export function cleanPhone(phone: string): string {
	if (!phone) return '';
	return phone
		.replace(/\s*-\s*DDR/gi, '')
		.replace(/\s*DDR/gi, '')
		.replace(/\s*-\s*RVI/gi, '')
		.replace(/\s*RVI/gi, '')
		.trim();
}

/**
 * Normalizes route of administration for grouping
 */
export function normalizeRouteLabel(route: string): string {
	const r = (route || 'oral').toLowerCase().trim();
	if (r.includes('oral')) return 'USO ORAL';
	if (r.includes('top') || r.includes('tóp')) return 'USO TÓPICO';
	if (r.includes('inalat') || r.includes('inal')) return 'USO INALATÓRIO';
	if (r.includes('oftal') || r.includes('olho')) return 'USO OFTÁLMICO';
	if (r.includes('otol') || r.includes('ouvid')) return 'USO OTOLÓGICO';
	if (r.includes('nasal') || r.includes('nariz')) return 'USO NASAL';
	if (r.includes('parenteral') || r.includes('injet') || r.includes('im') || r.includes('iv') || r.includes('sc')) return 'USO PARENTERAL';
	if (r.includes('sublingual') || r.includes('sl')) return 'USO SUBLINGUAL';
	if (r.includes('retal')) return 'USO RETAL';
	if (r.includes('vagin')) return 'USO VAGINAL';
	return `USO ${r.toUpperCase()}`;
}

/**
 * Determines clinical prescription verb based on route and pharmaceutical form
 */
export function getPrescriptionVerb(form: string = '', route: string = ''): string {
	const f = (form || '').toLowerCase().trim();
	const r = (route || '').toLowerCase().trim();

	// Injetáveis / Parenteral
	if (
		r.includes('parenteral') ||
		r.includes('injet') ||
		r.includes('intramuscular') ||
		r.includes('intravenosa') ||
		r.includes('subcut') ||
		f.includes('injet') ||
		f.includes('infusão') ||
		f.includes('ampola')
	) {
		return 'Injetar';
	}

	// Oftálmico
	if (r.includes('oftálm') || r.includes('oftalm') || r.includes('ocular')) {
		if (f.includes('pomada') || f.includes('gel')) return 'Aplicar';
		return 'Pingar';
	}

	// Otológico
	if (r.includes('otológ') || r.includes('otolog') || r.includes('auricular') || r.includes('ouvid')) {
		return 'Pingar';
	}

	// Nasal
	if (r.includes('nasal') || f.includes('nasal')) {
		if (f.includes('spray') || f.includes('aerossol') || f.includes('jato') || f.includes('borrif')) return 'Aplicar';
		if (f.includes('gotas')) return 'Pingar';
		return 'Aplicar';
	}

	// Inalatório
	if (r.includes('inalat') || r.includes('respirat') || f.includes('inala') || f.includes('aerossol') || f.includes('spray')) {
		return 'Inalar';
	}

	// Tópico / Dérmico / Cutâneo
	if (
		r.includes('tópic') ||
		r.includes('topic') ||
		r.includes('cutân') ||
		r.includes('dermat') ||
		f.includes('creme') ||
		f.includes('pomada') ||
		f.includes('gel') ||
		f.includes('loção') ||
		f.includes('locao') ||
		f.includes('pasta') ||
		f.includes('adesivo') ||
		f.includes('shampoo') ||
		f.includes('sabonete') ||
		f.includes('emplastro')
	) {
		return 'Aplicar';
	}

	// Retal
	if (r.includes('retal') || f.includes('supositório') || f.includes('supositorio') || f.includes('enema')) {
		if (f.includes('pomada') || f.includes('creme') || f.includes('gel')) return 'Aplicar';
		return 'Introduzir';
	}

	// Vaginal
	if (r.includes('vagin') || f.includes('óvulo') || f.includes('ovulo') || f.includes('comprimido vaginal')) {
		if (f.includes('creme') || f.includes('gel')) return 'Aplicar';
		return 'Introduzir';
	}

	// Padrão Oral (VO)
	return 'Tomar';
}

const KNOWN_VERBS = [
	'tomar',
	'aplicar',
	'injetar',
	'pingar',
	'instilar',
	'inalar',
	'introduzir',
	'borrifar',
	'administrar',
	'mastigar',
	'dissolver',
	'ingerir',
	'usar'
];

/**
 * Formats posology line 2: verbo dinâmico + dose unitária + frequência + duração (com ponto antes de "Uso contínuo")
 */
export function formatPrescriptionPosology(
	dosage?: string,
	frequency?: string,
	duration?: string,
	form?: string,
	route?: string
): string {
	const parts: string[] = [];
	const d = (dosage || '').trim();
	if (d) {
		const firstWord = d.split(/\s+/)[0]?.toLowerCase();
		if (KNOWN_VERBS.includes(firstWord)) {
			parts.push(d);
		} else {
			const verb = getPrescriptionVerb(form, route);
			parts.push(`${verb} ${d}`);
		}
	}

	if (frequency?.trim()) parts.push(frequency.trim());

	let base = parts.join(' ');
	const dur = (duration || '').trim();
	if (dur) {
		const isContinuo = dur.toLowerCase().includes('contínuo') || dur.toLowerCase().includes('continuo');
		if (isContinuo) {
			if (base.endsWith('.')) {
				base += ` ${dur}`;
			} else if (base) {
				base += `. ${dur}`;
			} else {
				base = dur;
			}
		} else {
			base = base ? `${base} ${dur}` : dur;
		}
	}
	return base;
}

/**
 * Calculates patient age from YYYY-MM-DD
 */
export function calculateAge(birthDateStr: string): number | null {
	if (!birthDateStr) return null;
	const birth = new Date(birthDateStr);
	if (isNaN(birth.getTime())) return null;
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const m = today.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age >= 0 ? age : null;
}

/**
 * Formats a Date into Brazilian localized date string
 */
export function formatPrescriptionDate(date?: Date | string): string {
	const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
	const day = d.getDate();
	const months = [
		'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
		'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
	];
	const month = months[d.getMonth()];
	const year = d.getFullYear();
	return `${day} de ${month} de ${year}`;
}

/**
 * Generates an isolated HTML document string for landscape 2-column prescription
 */
export function generatePrescriptionHtml(payload: PrescriptionPayload): string {
	const { healthUnit, patient, doctor, medications, customInstructions } = payload;
	const dateFormatted = formatPrescriptionDate(payload.date);
	const age = patient.birthDate ? calculateAge(patient.birthDate) : null;
	const cleanPhoneNum = cleanPhone(healthUnit.phone);

	// Group medications by normalized route
	const groupedMeds: { [route: string]: PrescriptionMedItem[] } = {};
	for (const med of medications) {
		const label = normalizeRouteLabel(med.route);
		if (!groupedMeds[label]) groupedMeds[label] = [];
		groupedMeds[label].push(med);
	}

	// Build the items HTML according to exact standard:
	// Linha 1: Nome do medicamento + Concentração + linha tracejada contínua + Quantidade no final
	// Linha 2: Dose unitária + Frequência + Duração (com ponto antes de "Uso contínuo")
	// Linha 3: Observações
	let medsHtml = '';
	for (const [routeLabel, items] of Object.entries(groupedMeds)) {
		let itemIndex = 1; // Contagem reinicia a cada modo de uso
		medsHtml += `
			<div class="route-group">
				<div class="route-header">${routeLabel}</div>
				<div class="route-items">
		`;
		for (const item of items) {
			const medTitle = `${item.name} ${item.concentration || ''}`.trim();
			const posologyText = formatPrescriptionPosology(item.dosage, item.frequency, item.duration, item.form, item.route);

			medsHtml += `
				<div class="med-item">
					<!-- Linha 1: Nome + Concentração + Linha tracejada longa + Quantidade à direita -->
					<div class="med-line-1">
						<span class="med-left"><span class="med-num">${itemIndex}.</span> <span class="med-name">${medTitle}</span></span>
						${item.quantity ? `<span class="med-fill-line"></span><span class="med-qty">${item.quantity.trim()}</span>` : ''}
					</div>
					<!-- Linha 2: Dose + Frequência + Duração -->
					${posologyText ? `<div class="med-line-2">${posologyText}</div>` : ''}
					<!-- Linha 3: Observações -->
					${item.instructions ? `<div class="med-line-3">Obs: ${item.instructions.trim()}</div>` : ''}
				</div>
			`;
			itemIndex++;
		}
		medsHtml += `
				</div>
			</div>
		`;
	}

	// Format patient sub-header details
	let patientDetails = '';
	if (patient.birthDate) {
		const [y, m, d] = patient.birthDate.split('-');
		const dobFormatted = (y && m && d) ? `${d}/${m}/${y}` : patient.birthDate;
		patientDetails += `<span>Data Nasc.: <strong>${dobFormatted}</strong> ${age !== null ? `(${age} anos)` : ''}</span>`;
	}
	if (patient.cpf) {
		patientDetails += `<span>CPF: <strong>${patient.cpf}</strong></span>`;
	}
	if (patient.address) {
		patientDetails += `<span>Endereço: <strong>${patient.address}</strong></span>`;
	}

	// Single Prescription Column Template (rendered twice per landscape page)
	const renderPrescriptionColumn = (viaLabel: string) => `
		<div class="prescription-column">
			<!-- Via Watermark/Label -->
			<div class="via-badge">${viaLabel}</div>

			<!-- Health Unit Header -->
			<header class="unit-header">
				<h1 class="unit-name">${healthUnit.name.toUpperCase()}</h1>
				<div class="unit-address">${healthUnit.address}, ${healthUnit.neighborhood} - CEP ${healthUnit.cep}</div>
				<div class="unit-city">${healthUnit.city} - ${healthUnit.state} • Tel: ${cleanPhoneNum}</div>
				<div class="unit-hours">Horário de Atendimento: ${healthUnit.businessHours}</div>
			</header>

			<!-- Patient Sub-header -->
			<section class="patient-section">
				<div class="patient-name-line">
					<span class="label">PACIENTE:</span>
					<strong class="patient-name">${patient.name.toUpperCase()}</strong>
				</div>
				${patientDetails ? `<div class="patient-details-grid">${patientDetails}</div>` : ''}
			</section>

			<!-- Medications Body -->
			<main class="medications-body">
				${medsHtml}

				${customInstructions ? `
					<div class="custom-instructions">
						<strong>Orientações Gerais:</strong>
						<p>${customInstructions}</p>
					</div>
				` : ''}
			</main>

			<!-- Doctor Footer & Signature (Signature first, City/Date at the very bottom, no gray border line) -->
			<footer class="prescription-footer">
				<div class="signature-box">
					<div class="signature-line"></div>
					${doctor.name ? `<strong class="doctor-name">${doctor.name}</strong>` : ''}
					${doctor.crm ? `<div class="doctor-crm">CRM: ${doctor.crm}${doctor.rqe ? ` • RQE: ${doctor.rqe}` : ''}</div>` : ''}
				</div>
				<div class="city-date">
					${healthUnit.city} - ${healthUnit.state}, ${dateFormatted}
				</div>
			</footer>
		</div>
	`;

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Receituário Médico - ${patient.name}</title>
	<style>
		@page {
			size: landscape;
			margin: 4mm 6mm;
		}

		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
			-webkit-print-color-adjust: exact !important;
			print-color-adjust: exact !important;
		}

		html, body {
			width: 100%;
			height: 100%;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
			background: #ffffff;
			color: #111827;
			line-height: 1.25;
		}

		/* Landscape Two-Column Grid */
		.prescription-sheet {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 10px minmax(0, 1fr);
			width: 100%;
			max-width: 100%;
			height: 100%;
			max-height: 198mm;
			box-sizing: border-box;
			overflow: hidden;
			page-break-inside: avoid;
			page-break-after: avoid;
		}

		/* Vertical Center Cutting Line */
		.cut-line-separator {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: space-between;
			border-left: 1.2px dashed #94a3b8;
			margin: 0 auto;
			padding: 6px 0;
			position: relative;
		}

		.cut-scissors {
			font-size: 11px;
			color: #64748b;
			background: #fff;
			padding: 2px;
			transform: rotate(90deg);
		}

		/* Column Layout */
		.prescription-column {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			padding: 4px 10px;
			position: relative;
			height: 100%;
			width: 100%;
			max-width: 100%;
			box-sizing: border-box;
			overflow: hidden;
		}

		.via-badge {
			position: absolute;
			top: 2px;
			right: 10px;
			font-size: 7.5pt;
			font-weight: 700;
			text-transform: uppercase;
			color: #475569;
			background: #f1f5f9;
			border: 1px solid #cbd5e1;
			border-radius: 3px;
			padding: 1px 5px;
			letter-spacing: 0.04em;
		}

		/* Health Unit Header */
		.unit-header {
			text-align: center;
			border-bottom: 1.5px solid #0f172a;
			padding-bottom: 3px;
			margin-bottom: 5px;
		}

		.unit-name {
			font-size: 11.5pt;
			font-weight: 800;
			color: #0f172a;
			letter-spacing: -0.01em;
			margin-bottom: 1px;
		}

		.unit-address, .unit-city, .unit-hours {
			font-size: 8pt;
			color: #334155;
			line-height: 1.2;
		}

		/* Patient Sub-header */
		.patient-section {
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-radius: 5px;
			padding: 4px 8px;
			margin-bottom: 6px;
		}

		.patient-name-line {
			display: flex;
			align-items: baseline;
			gap: 5px;
		}

		.patient-section .label {
			font-size: 8pt;
			font-weight: 700;
			color: #475569;
		}

		.patient-name {
			font-size: 10pt;
			color: #0f172a;
			font-weight: 800;
		}

		.patient-details-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-top: 2px;
			font-size: 8pt;
			color: #334155;
			border-top: 1px dashed #cbd5e1;
			padding-top: 2px;
		}

		/* Medications Body */
		.medications-body {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 6px;
			width: 100%;
			max-width: 100%;
			overflow: hidden;
		}

		.route-group {
			margin-bottom: 4px;
			width: 100%;
			max-width: 100%;
		}

		/* Modo de uso: Fonte 12 */
		.route-header {
			font-size: 12pt;
			font-weight: 800;
			color: #0f172a;
			border-bottom: 1.2px solid #0f172a;
			padding-bottom: 1px;
			margin-bottom: 4px;
			letter-spacing: 0.02em;
			text-transform: uppercase;
		}

		.route-items {
			display: flex;
			flex-direction: column;
			gap: 5px;
			width: 100%;
			max-width: 100%;
		}

		.med-item {
			padding-left: 2px;
			page-break-inside: avoid;
			width: 100%;
			max-width: 100%;
		}

		/* Linha 1: Nome do medicamento + Concentração + linha tracejada contínua + Quantidade: Fonte 11 */
		.med-line-1 {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			width: 100%;
			max-width: 100%;
			font-size: 11pt;
			font-weight: 700;
			color: #0f172a;
			row-gap: 2px;
		}

		.med-left {
			display: inline-flex;
			align-items: baseline;
			gap: 4px;
			flex: 0 1 auto;
			max-width: 100%;
			white-space: normal;
			word-break: break-word;
			overflow-wrap: break-word;
		}

		.med-num {
			font-weight: 700;
			color: #0f172a;
			font-size: 11pt;
			flex-shrink: 0;
		}

		.med-name {
			font-size: 11pt;
			font-weight: 700;
			color: #0f172a;
			white-space: normal;
			word-break: break-word;
			overflow-wrap: break-word;
		}

		.med-fill-line {
			flex: 1 1 20px;
			border-bottom: 1px dashed #64748b;
			margin: 0 6px 3px 6px;
			min-width: 15px;
		}

		.med-qty {
			font-size: 11pt;
			font-weight: 700;
			color: #0f172a;
			white-space: nowrap;
			margin-left: auto;
			flex-shrink: 0;
		}

		/* Linha 2: Posologia, horário e duração: Fonte 10 */
		.med-line-2 {
			font-size: 10pt;
			color: #1e293b;
			margin-top: 1px;
			padding-left: 14px;
			line-height: 1.25;
		}

		/* Linha 3: Observações: Fonte 9 */
		.med-line-3 {
			font-size: 9pt;
			color: #475569;
			font-style: italic;
			margin-top: 1px;
			padding-left: 14px;
			line-height: 1.2;
		}

		.custom-instructions {
			background: #f1f5f9;
			border-left: 2.5px solid #0284c7;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 9pt;
			margin-top: 5px;
		}

		.custom-instructions strong {
			color: #0f172a;
		}

		.custom-instructions p {
			margin-top: 1px;
			color: #334155;
		}

		/* Doctor Footer (sem traçado cinza claro acima) */
		.prescription-footer {
			margin-top: 14px;
			padding-top: 0;
			border-top: none;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
			page-break-inside: avoid;
		}

		.signature-box {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 75%;
			min-height: 38px;
			justify-content: flex-end;
		}

		.signature-line {
			width: 100%;
			border-top: 1px solid #0f172a;
			margin-bottom: 2px;
		}

		.doctor-name {
			font-size: 10pt;
			color: #0f172a;
			font-weight: 700;
		}

		.doctor-crm {
			font-size: 8.5pt;
			color: #475569;
		}

		.city-date {
			font-size: 8.5pt;
			color: #475569;
			margin-top: 8px;
			font-weight: 500;
		}

		@media print {
			html, body {
				width: 100%;
				height: 100%;
				margin: 0 !important;
				padding: 0 !important;
			}
			.prescription-sheet {
				max-height: 198mm;
				page-break-inside: avoid;
				page-break-after: avoid;
			}
		}
	</style>
</head>
<body>
	<div class="prescription-sheet">
		${renderPrescriptionColumn('1ª Via — Paciente')}
		<div class="cut-line-separator">
			<span class="cut-scissors">✂</span>
			<span class="cut-scissors">✂</span>
			<span class="cut-scissors">✂</span>
		</div>
		${renderPrescriptionColumn('2ª Via — Farmácia / Controle')}
	</div>

	<script>
		window.onload = function() {
			window.print();
		};
	</script>
</body>
</html>`;
}

/**
 * Triggers native browser print preview for the duplicated prescription
 */
export function printPrescriptionPdf(payload: PrescriptionPayload): void {
	const html = generatePrescriptionHtml(payload);
	const printWindow = window.open('', '_blank');
	if (printWindow) {
		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();
	} else {
		// Fallback to iframe printing if popups are blocked
		let iframe = document.getElementById('prescription-print-frame') as HTMLIFrameElement;
		if (!iframe) {
			iframe = document.createElement('iframe');
			iframe.id = 'prescription-print-frame';
			iframe.style.position = 'fixed';
			iframe.style.right = '0';
			iframe.style.bottom = '0';
			iframe.style.width = '0';
			iframe.style.height = '0';
			iframe.style.border = '0';
			document.body.appendChild(iframe);
		}
		const doc = iframe.contentWindow?.document;
		if (doc) {
			doc.open();
			doc.write(html);
			doc.close();
			setTimeout(() => {
				iframe.contentWindow?.focus();
				iframe.contentWindow?.print();
			}, 300);
		}
	}
}
