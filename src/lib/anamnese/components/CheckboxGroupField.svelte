<script lang="ts">
	import type { FieldOption, FieldSchema } from '../types';

	let {
		field,
		values = [],
		onToggle
	}: {
		field: FieldSchema;
		values: string[];
		onToggle: (optionValue: string) => void;
	} = $props();

	const options = $derived<FieldOption[]>(field.options ?? []);
</script>

<fieldset class="checkbox-fieldset">
	<legend class="field-legend">{field.label}</legend>
	{#if field.hint}
		<p class="field-hint">{field.hint}</p>
	{/if}

	<div class="checkbox-options" role="group" aria-label={field.label}>
		{#each options as opt}
			{@const checked = values.includes(opt.value)}
			<button
				type="button"
				role="checkbox"
				aria-checked={checked}
				class="cb-btn"
				class:checked
				onclick={() => onToggle(opt.value)}
			>
				<span class="cb-box" aria-hidden="true">{checked ? '✓' : ''}</span>
				<span>{opt.label}</span>
			</button>
		{/each}
	</div>
</fieldset>

<style>
	.checkbox-fieldset {
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		padding: 10px 12px;
		margin: 0;
		background: #ffffff;
	}

	.field-legend {
		padding: 0;
		margin: 0 0 8px;
		font-size: 14px;
		font-weight: 600;
		color: #09090b;
	}

	.field-hint {
		margin: -4px 0 8px;
		font-size: 12px;
		color: #52525b;
	}

	.checkbox-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.cb-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 40px;
		padding: 8px 13px;
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

	.cb-btn:hover {
		border-color: #a1a1aa;
		background: #e4e4e7;
	}

	.cb-btn:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.cb-box {
		width: 17px;
		height: 17px;
		border-radius: 4px;
		border: 1.5px solid #71717a;
		background: #ffffff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 800;
		color: #15803d;
	}

	.cb-btn.checked {
		background: #f0fdf4;
		border-color: #16a34a;
		color: #14532d;
		font-weight: 700;
	}

	.cb-btn.checked .cb-box {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
	}
</style>

