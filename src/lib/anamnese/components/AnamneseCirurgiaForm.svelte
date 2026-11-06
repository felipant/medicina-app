<script lang="ts">
	import { onMount } from 'svelte';
	import { exportAnamnesePdf } from '../exportPdf';
	import { copyTextToClipboard, formatSerializedText } from '../exportText';
	import { ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA } from '../schema';
	import { serializeAnswers } from '../serialize';
	import { AnamneseFormState } from '../state.svelte';
	import AlertPanel from './AlertPanel.svelte';
	import SectionCard from './SectionCard.svelte';

	let {
		showBackToHub = true
	}: {
		showBackToHub?: boolean;
	} = $props();

	const formState = new AnamneseFormState(ANAMNESE_PEQUENAS_CIRURGIAS_SCHEMA);

	let copyFeedback = $state('');
	let exportWarning = $state('');
	let isClearConfirmOpen = $state(false);
	let isPreviewModalOpen = $state(false);

	onMount(() => {
		formState.initFromStorage();
	});

	const patientFirstName = $derived.by(() => {
		const raw = formState.answers['nome'];
		if (typeof raw !== 'string' || !raw.trim()) return '';
		return raw.trim().split(/\s+/)[0];
	});

	const patientAge = $derived.by(() => {
		const raw = formState.answers['idade'];
		if (raw === undefined || raw === null || String(raw).trim() === '') return '';
		return `${String(raw).trim()} anos`;
	});

	const previewText = $derived(formatSerializedText(formState.serialized));

	function checkPatientNameNotice(): void {
		const raw = formState.answers['nome'];
		if (typeof raw !== 'string' || !raw.trim()) {
			exportWarning = 'Aviso: o nome do paciente não foi preenchido (exportado mesmo assim).';
			setTimeout(() => {
				exportWarning = '';
			}, 4500);
		} else {
			exportWarning = '';
		}
	}

	async function handleCopyText() {
		checkPatientNameNotice();
		const serialized = serializeAnswers(formState.schema, formState.answers, {
			onlyPositive: formState.onlyPositive,
			now: new Date()
		});
		const text = formatSerializedText(serialized);
		const ok = await copyTextToClipboard(text);
		copyFeedback = ok ? 'Copiado!' : 'Erro ao copiar';
		setTimeout(() => {
			copyFeedback = '';
		}, 2800);
	}

	function handleExportPdf() {
		checkPatientNameNotice();
		exportAnamnesePdf(formState.schema, formState.answers, {
			onlyPositive: formState.onlyPositive,
			now: new Date()
		});
	}

	function confirmClearAll() {
		formState.clearAll(false);
		isClearConfirmOpen = false;
		copyFeedback = 'Dados limpos';
		setTimeout(() => {
			copyFeedback = '';
		}, 2200);
	}
</script>

<div class="anamnese-shell">
	<!-- Cabeçalho Fixo -->
	<header class="topbar">
		<div class="topbar-inner">
			<div class="topbar-left">
				{#if showBackToHub}
					<a href="/" class="btn-back" title="Voltar ao Hub">
						← Hub
					</a>
				{/if}
				<div class="title-block">
					<h1 class="app-title">Pequenas Cirurgias Ambulatoriais</h1>
					<span class="app-subtitle">Anamnese Rápida Pré-Procedimento · 100% Local (LGPD)</span>
				</div>
				{#if patientFirstName || patientAge}
					<div class="patient-pill" aria-label="Identificação rápida do paciente">
						<strong>{patientFirstName || 'Paciente'}</strong>
						{#if patientAge}
							<span>· {patientAge}</span>
						{/if}
					</div>
				{/if}
			</div>

			<div class="topbar-actions">
				<button
					type="button"
					class="btn-action btn-preview"
					onclick={() => (isPreviewModalOpen = true)}
				>
					Prévia
				</button>

				<button
					type="button"
					class="btn-action btn-copy"
					onclick={handleCopyText}
				>
					{copyFeedback || 'Copiar texto'}
				</button>

				<button
					type="button"
					class="btn-action btn-pdf"
					onclick={handleExportPdf}
				>
					Exportar PDF
				</button>

				<button
					type="button"
					class="btn-action btn-clear"
					onclick={() => (isClearConfirmOpen = true)}
				>
					Limpar todos os dados
				</button>
			</div>
		</div>
	</header>

	<!-- Região acessível para feedback de cópia e avisos -->
	<div class="sr-live-region" aria-live="polite" aria-atomic="true">
		{copyFeedback}
		{exportWarning}
	</div>

	{#if exportWarning}
		<div class="warning-banner" role="status">
			<span>{exportWarning}</span>
		</div>
	{/if}

	<main class="main-container">
		<!-- Barra de Opções de Privacidade e Exportação -->
		<section class="controls-strip" aria-label="Opções de exportação e privacidade">
			<label class="toggle-control">
				<input
					type="checkbox"
					checked={formState.onlyPositive}
					onchange={(e) => (formState.onlyPositive = e.currentTarget.checked)}
				/>
				<span>Exportar somente respostas positivas (Sim)</span>
			</label>

			<div class="autosave-badge" role="status">
				<span class="autosave-dot" aria-hidden="true"></span>
				<span>Salvo automaticamente no navegador</span>
			</div>
		</section>

		<!-- Painel em Tempo Real: Pontos de Atenção -->
		<AlertPanel alerts={formState.activeAlerts} />

		<!-- Navegação Rápida por Seções -->
		<nav class="section-jumps" aria-label="Atalhos para as seções do formulário">
			{#each formState.schema as sec (sec.id)}
				<a href="#sec-{sec.id}" class="jump-pill">
					<span class="jump-num">{sec.number}</span>
					<span>{sec.title}</span>
				</a>
			{/each}
		</nav>

		<!-- Lista de Seções Geradas a partir do Schema -->
		<div class="sections-stack">
			{#each formState.schema as section (section.id)}
				<SectionCard {section} {formState} />
			{/each}
		</div>

		<!-- Barra Inferior de Ações (Mobile-First) -->
		<section class="bottom-action-bar" aria-label="Ações de finalização">
			<button type="button" class="btn-bottom btn-copy" onclick={handleCopyText}>
				{copyFeedback || 'Copiar texto para prontuário'}
			</button>
			<button type="button" class="btn-bottom btn-pdf" onclick={handleExportPdf}>
				Exportar PDF
			</button>
		</section>
	</main>
</div>

<!-- Modal de Confirmação para Limpar Dados -->
{#if isClearConfirmOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => (isClearConfirmOpen = false)}>
		<div
			class="modal-dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="clear-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<h2 id="clear-modal-title" class="modal-title">Limpar todos os dados?</h2>
			<p class="modal-desc">
				Todas as respostas preenchidas neste atendimento e o rascunho salvo no navegador serão apagados permanentemente.
			</p>
			<div class="modal-actions">
				<button
					type="button"
					class="btn-modal-cancel"
					onclick={() => (isClearConfirmOpen = false)}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-modal-danger"
					onclick={confirmClearAll}
				>
					Sim, limpar tudo
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal de Pré-visualização do Texto -->
{#if isPreviewModalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => (isPreviewModalOpen = false)}>
		<div
			class="modal-dialog modal-preview"
			role="dialog"
			aria-modal="true"
			aria-labelledby="preview-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="preview-header">
				<h2 id="preview-modal-title" class="modal-title">Prévia do Texto Estruturado</h2>
				<button
					type="button"
					class="btn-close-preview"
					onclick={() => (isPreviewModalOpen = false)}
					aria-label="Fechar prévia"
				>
					✕
				</button>
			</div>
			<pre class="preview-code">{previewText}</pre>
			<div class="modal-actions">
				<button
					type="button"
					class="btn-modal-cancel"
					onclick={() => (isPreviewModalOpen = false)}
				>
					Fechar
				</button>
				<button
					type="button"
					class="btn-action btn-copy"
					onclick={handleCopyText}
				>
					{copyFeedback || 'Copiar texto'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.anamnese-shell {
		min-height: 100vh;
		background: #ffffff;
		color: #09090b;
		font-family:
			'Plus Jakarta Sans',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid #e4e4e7;
	}

	.topbar-inner {
		max-width: 980px;
		margin: 0 auto;
		padding: 10px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.btn-back {
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid #d4d4d8;
		background: #ffffff;
		color: #09090b;
		text-decoration: none;
		font-size: 12.5px;
		font-weight: 700;
	}

	.btn-back:hover {
		background: #f0fdf4;
		border-color: #86efac;
		color: #14532d;
	}

	.title-block {
		display: flex;
		flex-direction: column;
	}

	.app-title {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		color: #09090b;
		line-height: 1.2;
	}

	.app-subtitle {
		font-size: 11px;
		color: #52525b;
		font-weight: 500;
	}

	.patient-pill {
		background: #f0fdf4;
		border: 1px solid #86efac;
		color: #14532d;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 12.5px;
	}

	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn-action {
		min-height: 36px;
		padding: 6px 12px;
		border-radius: 8px;
		font-family: inherit;
		font-size: 12.5px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.12s ease;
		touch-action: manipulation;
	}

	.btn-action:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.btn-preview {
		background: #ffffff;
		border: 1px solid #d4d4d8;
		color: #18181b;
	}

	.btn-preview:hover {
		background: #f4f4f5;
	}

	.btn-copy {
		background: #f0fdf4;
		border: 1px solid #16a34a;
		color: #14532d;
	}

	.btn-copy:hover {
		background: #dcfce7;
	}

	.btn-pdf {
		background: #15803d;
		border: 1px solid #15803d;
		color: #ffffff;
	}

	.btn-pdf:hover {
		background: #166534;
	}

	.btn-clear {
		background: #ffffff;
		border: 1px solid #fca5a5;
		color: #b91c1c;
	}

	.btn-clear:hover {
		background: #fef2f2;
	}

	.warning-banner {
		max-width: 980px;
		margin: 10px auto 0;
		padding: 8px 14px;
		border-radius: 8px;
		background: #fefce8;
		border: 1px solid #fde047;
		color: #713f12;
		font-size: 13px;
		font-weight: 600;
	}

	.main-container {
		max-width: 980px;
		margin: 0 auto;
		padding: 16px 16px 64px;
	}

	.controls-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding: 10px 14px;
		background: #fafafa;
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		margin-bottom: 12px;
	}

	.toggle-control {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #18181b;
		cursor: pointer;
	}

	.toggle-control input {
		width: 17px;
		height: 17px;
		accent-color: #15803d;
	}

	.autosave-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 700;
		color: #166534;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		padding: 4px 10px;
		border-radius: 999px;
	}

	.autosave-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #16a34a;
	}

	.section-jumps {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		padding-bottom: 6px;
		margin-bottom: 14px;
	}

	.jump-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 11px;
		border-radius: 999px;
		border: 1px solid #e4e4e7;
		background: #ffffff;
		color: #18181b;
		text-decoration: none;
		font-size: 12px;
		font-weight: 700;
		white-space: nowrap;
	}

	.jump-pill:hover {
		border-color: #86efac;
		background: #f0fdf4;
		color: #14532d;
	}

	.jump-num {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #f0fdf4;
		color: #15803d;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 800;
	}

	.sections-stack {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.bottom-action-bar {
		margin-top: 24px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.btn-bottom {
		min-height: 46px;
		border-radius: 10px;
		font-family: inherit;
		font-size: 14px;
		font-weight: 800;
		cursor: pointer;
	}

	/* Modais */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(9, 9, 11, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}

	.modal-dialog {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 14px;
		padding: 20px;
		max-width: 440px;
		width: 100%;
		box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.2);
	}

	.modal-preview {
		max-width: 680px;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.btn-close-preview {
		border: 1px solid #e4e4e7;
		background: #ffffff;
		border-radius: 6px;
		width: 30px;
		height: 30px;
		cursor: pointer;
	}

	.preview-code {
		background: #fafafa;
		border: 1px solid #e4e4e7;
		border-radius: 8px;
		padding: 12px;
		font-size: 12.5px;
		line-height: 1.5;
		max-height: 55vh;
		overflow-y: auto;
		white-space: pre-wrap;
		color: #09090b;
	}

	.modal-title {
		margin: 0 0 8px;
		font-size: 17px;
		font-weight: 800;
		color: #09090b;
	}

	.modal-desc {
		margin: 0 0 18px;
		font-size: 13.5px;
		color: #3f3f46;
		line-height: 1.45;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.btn-modal-cancel {
		padding: 8px 14px;
		border-radius: 8px;
		border: 1px solid #d4d4d8;
		background: #ffffff;
		color: #18181b;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-modal-danger {
		padding: 8px 14px;
		border-radius: 8px;
		border: 1px solid #dc2626;
		background: #dc2626;
		color: #ffffff;
		font-weight: 700;
		cursor: pointer;
	}

	.sr-live-region {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 600px) {
		.bottom-action-bar {
			grid-template-columns: 1fr;
		}
	}
</style>

