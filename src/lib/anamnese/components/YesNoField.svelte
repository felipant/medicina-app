<script lang="ts">
	import type { FieldSchema } from '../types';

	let {
		field,
		value = '',
		isAlert = false,
		onSelect
	}: {
		field: FieldSchema;
		value: string;
		isAlert?: boolean;
		onSelect: (val: string) => void;
	} = $props();

	const options = $derived(
		field.allowNaoSei ? ['Sim', 'Não', 'Não sei'] : ['Sim', 'Não']
	);
</script>

<fieldset class="yesno-fieldset" class:alert-active={isAlert}>
	<div class="yesno-row">
		<div class="yesno-label-wrap">
			<legend class="field-legend">
				{field.label}
				{#if field.alert}
					<span class="alert-indicator" title="Gera ponto de atenção se {Array.isArray(field.alert.triggerValue) ? field.alert.triggerValue.join('/') : (field.alert.triggerValue ?? 'Sim')}">
						⚠
					</span>
				{/if}
			</legend>
			{#if field.hint}
				<span class="field-hint">{field.hint}</span>
			{/if}
		</div>

		<div class="yesno-buttons" role="radiogroup" aria-label={field.label}>
			{#each options as opt}
				{@const selected = value === opt}
				<button
					type="button"
					role="radio"
					aria-checked={selected}
					class="yn-btn"
					class:selected-sim={selected && opt === 'Sim' && !isAlert}
					class:selected-alert={selected && isAlert}
					class:selected-nao={selected && opt === 'Não' && !isAlert}
					class:selected-naosei={selected && opt === 'Não sei'}
					onclick={() => onSelect(opt)}
				>
					{opt}
				</button>
			{/each}
		</div>
	</div>
</fieldset>

<style>
	.yesno-fieldset {
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		padding: 10px 12px;
		margin: 0;
		background: #ffffff;
		transition: border-color 0.15s ease, background-color 0.15s ease;
	}

	.yesno-fieldset.alert-active {
		border-color: #f87171;
		background: #fef2f2;
	}

	.yesno-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.yesno-label-wrap {
		flex: 1;
		min-width: 190px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.field-legend {
		padding: 0;
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #09090b;
		line-height: 1.35;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.alert-indicator {
		font-size: 12px;
		color: #dc2626;
	}

	.field-hint {
		font-size: 12px;
		color: #52525b;
	}

	.yesno-buttons {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.yn-btn {
		min-width: 68px;
		min-height: 40px;
		padding: 8px 14px;
		border-radius: 8px;
		border: 1px solid #d4d4d8;
		background: #f4f4f5;
		color: #18181b;
		font-family: inherit;
		font-size: 13.5px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.12s ease;
		touch-action: manipulation;
	}

	.yn-btn:hover {
		border-color: #a1a1aa;
		background: #e4e4e7;
	}

	.yn-btn:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.yn-btn.selected-sim {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
	}

	.yn-btn.selected-alert {
		background: #dc2626;
		border-color: #b91c1c;
		color: #ffffff;
	}

	.yn-btn.selected-nao {
		background: #18181b;
		border-color: #18181b;
		color: #ffffff;
	}

	.yn-btn.selected-naosei {
		background: #52525b;
		border-color: #3f3f46;
		color: #ffffff;
	}

	@media (max-width: 520px) {
		.yesno-row {
			flex-direction: column;
			align-items: stretch;
		}
		.yesno-buttons {
			width: 100%;
		}
		.yn-btn {
			flex: 1;
		}
	}
</style>

