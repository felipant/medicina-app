<script lang="ts">
	import {
		isConditionalDetailActive,
		isFieldAlertActive,
		isFieldVisible
	} from '../serialize';
	import type { AnamneseFormState } from '../state.svelte';
	import { detailKey, formatPhoneBR, type FieldSchema } from '../types';
	import CheckboxGroupField from './CheckboxGroupField.svelte';
	import RadioGroupField from './RadioGroupField.svelte';
	import YesNoField from './YesNoField.svelte';

	let {
		field,
		formState
	}: {
		field: FieldSchema;
		formState: AnamneseFormState;
	} = $props();

	let isSuggestionsOpen = $state(false);
	let activeSuggestionIdx = $state(0);

	const visible = $derived(isFieldVisible(field, formState.answers));
	const alertActive = $derived(isFieldAlertActive(field, formState.answers));
	const detailActive = $derived(isConditionalDetailActive(field, formState.answers));

	const currentStringVal = $derived(
		typeof formState.answers[field.id] === 'string'
			? (formState.answers[field.id] as string)
			: formState.answers[field.id] !== undefined && formState.answers[field.id] !== null
				? String(formState.answers[field.id])
				: ''
	);

	const filteredSuggestions = $derived.by(() => {
		const list = field.suggestions;
		if (!list || list.length === 0) return [];
		const q = currentStringVal
			.trim()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		if (!q) return list;
		return list.filter((item) =>
			item
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.includes(q)
		);
	});

	function handleTextInput(e: Event & { currentTarget: HTMLInputElement }) {
		const rawVal = e.currentTarget.value;
		if (field.mask === 'phone') {
			const formatted = formatPhoneBR(rawVal);
			e.currentTarget.value = formatted;
			formState.setAnswer(field.id, formatted);
			return;
		}
		formState.setAnswer(field.id, rawVal);
		if (field.suggestions && field.suggestions.length > 0) {
			isSuggestionsOpen = true;
			activeSuggestionIdx = 0;
		}
	}

	function selectSuggestion(val: string) {
		formState.setAnswer(field.id, val);
		isSuggestionsOpen = false;
	}

	function handleTextKeydown(e: KeyboardEvent) {
		if (!field.suggestions || !isSuggestionsOpen || filteredSuggestions.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeSuggestionIdx = (activeSuggestionIdx + 1) % filteredSuggestions.length;
			return;
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeSuggestionIdx =
				(activeSuggestionIdx - 1 + filteredSuggestions.length) % filteredSuggestions.length;
			return;
		}
		if (e.key === 'Enter') {
			const chosen = filteredSuggestions[activeSuggestionIdx];
			if (chosen) {
				e.preventDefault();
				selectSuggestion(chosen);
			}
			return;
		}
		if (e.key === 'Escape') {
			isSuggestionsOpen = false;
		}
	}

	const currentArrayVal = $derived(
		Array.isArray(formState.answers[field.id])
			? (formState.answers[field.id] as string[])
			: []
	);

	const detailVal = $derived(
		typeof formState.answers[detailKey(field.id)] === 'string'
			? (formState.answers[detailKey(field.id)] as string)
			: ''
	);

	const subField = $derived(field.conditionalDetail?.subField);

	const subArrayVal = $derived(
		subField && Array.isArray(formState.answers[subField.id])
			? (formState.answers[subField.id] as string[])
			: []
	);

	const subStringVal = $derived(
		subField && typeof formState.answers[subField.id] === 'string'
			? (formState.answers[subField.id] as string)
			: ''
	);
</script>

{#if visible}
	<div class="field-block" id="field-{field.id}">
		{#if field.type === 'yesno'}
			<YesNoField
				{field}
				value={currentStringVal}
				isAlert={alertActive}
				onSelect={(val) => formState.toggleSingleChoice(field.id, val)}
			/>
		{:else if field.type === 'radio'}
			<RadioGroupField
				{field}
				value={currentStringVal}
				isAlert={alertActive}
				onSelect={(val) => formState.toggleSingleChoice(field.id, val)}
			/>
		{:else if field.type === 'checkboxGroup'}
			<CheckboxGroupField
				{field}
				values={currentArrayVal}
				onToggle={(opt) =>
					formState.toggleCheckboxOption(field.id, opt, field.exclusiveOption)}
			/>
		{:else if field.type === 'text' || field.type === 'date'}
			<div class="input-card">
				<label for="input-{field.id}" class="input-label">{field.label}</label>
				{#if field.hint}
					<span class="input-hint">{field.hint}</span>
				{/if}
				<div class="autocomplete-wrap">
					<input
						id="input-{field.id}"
						type={field.type === 'date' ? 'date' : field.mask === 'phone' ? 'tel' : 'text'}
						inputmode={field.mask === 'phone' ? 'numeric' : undefined}
						maxlength={field.mask === 'phone' ? 15 : undefined}
						autocomplete="off"
						class="text-input"
						placeholder={field.placeholder ?? ''}
						value={currentStringVal}
						oninput={handleTextInput}
						onfocus={() => {
							if (field.suggestions && field.suggestions.length > 0) {
								isSuggestionsOpen = true;
								activeSuggestionIdx = 0;
							}
						}}
						onblur={() => {
							setTimeout(() => {
								isSuggestionsOpen = false;
							}, 150);
						}}
						onkeydown={handleTextKeydown}
					/>

					{#if field.suggestions && isSuggestionsOpen && filteredSuggestions.length > 0}
						<ul class="suggestions-list" role="listbox" aria-label="Sugestões para {field.label}">
							{#each filteredSuggestions as item, idx}
								<li role="option" aria-selected={idx === activeSuggestionIdx}>
									<button
										type="button"
										class="suggestion-item"
										class:active={idx === activeSuggestionIdx}
										onmousedown={(e) => {
											e.preventDefault();
											selectSuggestion(item);
										}}
									>
										{item}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{:else if field.type === 'number'}
			<div class="input-card">
				<label for="input-{field.id}" class="input-label">
					{field.label}
					{#if field.unit}
						<span class="unit-badge">({field.unit})</span>
					{/if}
				</label>
				<div class="number-input-wrap">
					<input
						id="input-{field.id}"
						type="number"
						inputmode="decimal"
						class="text-input number-input"
						min={field.min}
						max={field.max}
						step={field.step ?? 1}
						placeholder={field.placeholder ?? ''}
						value={currentStringVal}
						oninput={(e) => formState.setAnswer(field.id, e.currentTarget.value)}
					/>
					{#if field.unit}
						<span class="unit-suffix">{field.unit}</span>
					{/if}
				</div>
			</div>
		{:else if field.type === 'textarea'}
			<div class="input-card">
				<label for="input-{field.id}" class="input-label">{field.label}</label>
				<textarea
					id="input-{field.id}"
					class="textarea-input"
					rows="3"
					placeholder={field.placeholder ?? ''}
					value={currentStringVal}
					oninput={(e) => formState.setAnswer(field.id, e.currentTarget.value)}
				></textarea>
			</div>
		{/if}

		<!-- Complemento Condicional (aparece quando a resposta aciona triggerValue, ex.: "Sim") -->
		{#if detailActive && field.conditionalDetail}
			<div class="conditional-box">
				{#if subField}
					<fieldset class="sub-fieldset">
						<legend class="sub-legend">{subField.label}</legend>
						<div class="sub-options">
							{#if subField.type === 'checkboxGroup'}
								{#each subField.options as opt}
									{@const checked = subArrayVal.includes(opt.value)}
									<button
										type="button"
										role="checkbox"
										aria-checked={checked}
										class="sub-btn"
										class:active={checked}
										onclick={() => formState.toggleCheckboxOption(subField.id, opt.value)}
									>
										<span>{checked ? '✓' : '+'}</span>
										<span>{opt.label}</span>
									</button>
								{/each}
							{:else}
								{#each subField.options as opt}
									{@const selected = subStringVal === opt.value}
									<button
										type="button"
										role="radio"
										aria-checked={selected}
										class="sub-btn"
										class:active={selected}
										onclick={() => formState.toggleSingleChoice(subField.id, opt.value)}
									>
										{opt.label}
									</button>
								{/each}
							{/if}
						</div>
					</fieldset>
				{/if}

				{#if field.conditionalDetail.allowText !== false}
					<div class="detail-input-row">
						<label for="detail-{field.id}" class="sr-only">
							{field.conditionalDetail.label ?? `Detalhes de ${field.label}`}
						</label>
						<input
							id="detail-{field.id}"
							type="text"
							class="detail-input"
							placeholder={field.conditionalDetail.placeholder ?? 'Complemento / detalhes (opcional)...'}
							value={detailVal}
							oninput={(e) => formState.setAnswer(detailKey(field.id), e.currentTarget.value)}
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.field-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-card {
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		padding: 10px 12px;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.input-label {
		font-size: 14px;
		font-weight: 600;
		color: #09090b;
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.unit-badge {
		font-size: 12px;
		font-weight: 500;
		color: #52525b;
	}

	.input-hint {
		font-size: 12px;
		color: #52525b;
		margin-top: -3px;
	}

	.autocomplete-wrap {
		position: relative;
		width: 100%;
	}

	.suggestions-list {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 80;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: #ffffff;
		border: 1px solid #86efac;
		border-radius: 10px;
		box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.14);
		max-height: 240px;
		overflow-y: auto;
	}

	.suggestion-item {
		width: 100%;
		text-align: left;
		padding: 9px 11px;
		border: none;
		border-radius: 7px;
		background: transparent;
		color: #09090b;
		font-family: inherit;
		font-size: 13.5px;
		font-weight: 500;
		cursor: pointer;
	}

	.suggestion-item:hover,
	.suggestion-item.active {
		background: #f0fdf4;
		color: #14532d;
		font-weight: 700;
	}

	.text-input,
	.textarea-input {
		width: 100%;
		padding: 9px 12px;
		border-radius: 8px;
		border: 1px solid #d4d4d8;
		background: #fafafa;
		color: #09090b;
		font-family: inherit;
		font-size: 14px;
		box-sizing: border-box;
		transition: border-color 0.15s ease, background-color 0.15s ease;
	}

	.text-input {
		min-height: 40px;
	}

	.text-input:focus,
	.textarea-input:focus {
		outline: none;
		border-color: #15803d;
		background: #ffffff;
		box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
	}

	.number-input-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 220px;
	}

	.unit-suffix {
		font-size: 13px;
		font-weight: 600;
		color: #3f3f46;
		white-space: nowrap;
	}

	.conditional-box {
		margin-left: 10px;
		padding: 10px 12px;
		border-left: 3px solid #16a34a;
		background: #f0fdf4;
		border-radius: 0 8px 8px 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.sub-fieldset {
		border: none;
		padding: 0;
		margin: 0;
	}

	.sub-legend {
		font-size: 12.5px;
		font-weight: 700;
		color: #14532d;
		margin-bottom: 6px;
		padding: 0;
	}

	.sub-options {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.sub-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-height: 34px;
		padding: 5px 11px;
		border-radius: 7px;
		border: 1px solid #bbf7d0;
		background: #ffffff;
		color: #18181b;
		font-family: inherit;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		touch-action: manipulation;
	}

	.sub-btn:focus-visible {
		outline: 2px solid #15803d;
		outline-offset: 2px;
	}

	.sub-btn.active {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
	}

	.detail-input {
		width: 100%;
		min-height: 36px;
		padding: 7px 10px;
		border-radius: 7px;
		border: 1px solid #bbf7d0;
		background: #ffffff;
		color: #09090b;
		font-family: inherit;
		font-size: 13.5px;
		box-sizing: border-box;
	}

	.detail-input:focus {
		outline: none;
		border-color: #15803d;
		box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
	}

	.sr-only {
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
</style>
