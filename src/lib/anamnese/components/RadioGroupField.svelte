<script lang="ts">
	import type { FieldOption, FieldSchema } from '../types';

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

	const options = $derived<FieldOption[]>(field.options ?? []);
</script>

<fieldset class="radio-fieldset" class:alert-active={isAlert}>
	<legend class="field-legend">
		{field.label}
		{#if field.alert}
			<span class="alert-indicator" title="Pode gerar ponto de atenção">⚠</span>
		{/if}
	</legend>
	{#if field.hint}
		<p class="field-hint">{field.hint}</p>
	{/if}

	<div class="radio-options" role="radiogroup" aria-label={field.label}>
		{#each options as opt}
			{@const selected = value === opt.value}
			<button
				type="button"
				role="radio"
				aria-checked={selected}
				class="radio-btn"
				class:selected={selected && !isAlert}
				class:selected-alert={selected && isAlert}
				onclick={() => onSelect(opt.value)}
			>
				{opt.label}
			</button>
		{/each}
	</div>
</fieldset>

<style>
	.radio-fieldset {
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		padding: 10px 12px;
		margin: 0;
		background: #ffffff;
	}

	.radio-fieldset.alert-active {
		border-color: #f87171;
		background: #fef2f2;
	}

	.field-legend {
		padding: 0;
		margin: 0 0 8px;
		font-size: 14px;
		font-weight: 600;
		color: #09090b;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.alert-indicator {
		font-size: 12px;
		color: #dc2626;
	}

	.field-hint {
		margin: -4px 0 8px;
		font-size: 12px;
		color: #52525b;
	}

	.radio-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.radio-btn {
		min-height: 40px;
		padding: 8px 14px;
		border-radius: 8px;
		border: 1px solid #d4d4d8;
		background: #f4f4f5;
		color: #18181b;
		font-family: inherit;
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.12s ease;
		touch-action: manipulation;
	}

	.radio-btn:hover {
		border-color: #a1a1aa;
		background: #e4e4e7;
	}

	.radio-btn:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.radio-btn.selected {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
		font-weight: 700;
	}

	.radio-btn.selected-alert {
		background: #dc2626;
		border-color: #b91c1c;
		color: #ffffff;
		font-weight: 700;
	}
</style>

