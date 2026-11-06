<script lang="ts">
	import { getSectionProgress, isFieldVisible } from '../serialize';
	import type { AnamneseFormState } from '../state.svelte';
	import type { SectionSchema } from '../types';
	import FieldRenderer from './FieldRenderer.svelte';

	let {
		section,
		formState
	}: {
		section: SectionSchema;
		formState: AnamneseFormState;
	} = $props();

	const isCollapsed = $derived(Boolean(formState.collapsedSections[section.id]));
	const progress = $derived(getSectionProgress(section, formState.answers));
	const hasYesNoFields = $derived(
		section.fields.some((f) => f.type === 'yesno' && isFieldVisible(f, formState.answers))
	);
</script>

<section class="section-card" id="sec-{section.id}" aria-labelledby="heading-{section.id}">
	<div class="section-header-bar">
		<button
			type="button"
			class="section-toggle-btn"
			aria-expanded={!isCollapsed}
			aria-controls="body-{section.id}"
			onclick={() => formState.toggleSectionCollapse(section.id)}
		>
			<div class="section-title-group">
				<span class="section-num">{String(section.number).padStart(2, '0')}</span>
				<div class="section-title-text">
					<h2 id="heading-{section.id}" class="section-title">{section.title}</h2>
					{#if section.subtitle}
						<span class="section-subtitle">{section.subtitle}</span>
					{/if}
				</div>
			</div>

			<div class="section-meta-right">
				<div class="progress-pill" title="{progress.filled} de {progress.total} campos preenchidos">
					<span class="progress-text">{progress.filled}/{progress.total}</span>
					<div class="progress-track" aria-hidden="true">
						<div class="progress-fill" style="width: {progress.percentage}%"></div>
					</div>
				</div>
				<span class="chevron" class:rotated={isCollapsed} aria-hidden="true">▾</span>
			</div>
		</button>

		{#if !isCollapsed && hasYesNoFields}
			<div class="section-quick-bar">
				<span class="quick-bar-hint">Atalho de preenchimento rápido:</span>
				<button
					type="button"
					class="btn-all-no"
					onclick={() => formState.markSectionAllNo(section)}
				>
					Marcar tudo como Não
				</button>
			</div>
		{/if}
	</div>

	{#if !isCollapsed}
		<div id="body-{section.id}" class="section-body">
			{#each section.fields as field (field.id)}
				<FieldRenderer {field} {formState} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.section-card {
		background: #ffffff;
		border: 1px solid #d4d4d8;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
	}

	.section-header-bar {
		background: #fafafa;
		border-bottom: 1px solid #e4e4e7;
	}

	.section-toggle-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 16px;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
	}

	.section-toggle-btn:hover {
		background: #f4f4f5;
	}

	.section-toggle-btn:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: -2px;
	}

	.section-title-group {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
	}

	.section-num {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
		font-size: 13px;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.section-title-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.section-title {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		color: #09090b;
		line-height: 1.25;
	}

	.section-subtitle {
		font-size: 12px;
		color: #52525b;
		margin-top: 2px;
	}

	.section-meta-right {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-shrink: 0;
	}

	.progress-pill {
		display: flex;
		align-items: center;
		gap: 7px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		padding: 4px 9px;
		border-radius: 999px;
	}

	.progress-text {
		font-size: 11.5px;
		font-weight: 700;
		color: #18181b;
	}

	.progress-track {
		width: 44px;
		height: 6px;
		border-radius: 999px;
		background: #e4e4e7;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #16a34a;
		transition: width 0.2s ease;
	}

	.chevron {
		font-size: 14px;
		color: #3f3f46;
		transition: transform 0.18s ease;
	}

	.chevron.rotated {
		transform: rotate(-90deg);
	}

	.section-quick-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 16px;
		background: #f0fdf4;
		border-top: 1px solid #dcfce7;
		flex-wrap: wrap;
	}

	.quick-bar-hint {
		font-size: 12px;
		font-weight: 600;
		color: #166534;
	}

	.btn-all-no {
		padding: 6px 12px;
		border-radius: 7px;
		border: 1px solid #15803d;
		background: #ffffff;
		color: #15803d;
		font-family: inherit;
		font-size: 12.5px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.12s ease;
		touch-action: manipulation;
	}

	.btn-all-no:hover {
		background: #15803d;
		color: #ffffff;
	}

	.btn-all-no:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.section-body {
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	@media (max-width: 520px) {
		.section-subtitle {
			display: none;
		}
		.progress-track {
			display: none;
		}
	}
</style>

