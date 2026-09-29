<script lang="ts">
	import type { MedicamentoItem } from '$lib/components/MedicamentoModal.svelte';

	interface SearchResponse {
		medicamentos: MedicamentoItem[];
		principios_ativos: { id: number; nome: string }[];
	}

	let {
		value = $bindable(''),
		placeholder = 'Pesquisar princípio ativo ou dose...',
		id = '',
		onSelect
	}: {
		value?: string;
		placeholder?: string;
		id?: string;
		onSelect?: (item: MedicamentoItem) => void;
	} = $props();

	let query = $state('');
	let results = $state<SearchResponse>({ medicamentos: [], principios_ativos: [] });
	let isOpen = $state(false);
	let isLoading = $state(false);
	let selectedIndex = $state(-1);
	let inputEl: HTMLInputElement | undefined = $state(undefined);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	async function searchMedicamentos(searchQuery: string) {
		if (searchQuery.length < 2) {
			results = { medicamentos: [], principios_ativos: [] };
			isOpen = false;
			return;
		}

		isLoading = true;
		try {
			const res = await fetch(`/api/medicamentos?q=${encodeURIComponent(searchQuery)}`);
			if (res.ok) {
				results = await res.json();
				isOpen = results.medicamentos.length > 0;
				selectedIndex = -1;
			}
		} catch (e) {
			console.error('Erro ao buscar medicamentos:', e);
		} finally {
			isLoading = false;
		}
	}

	function handleInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			searchMedicamentos(query);
		}, 250);
	}

	function selectItem(item: MedicamentoItem) {
		const parts: string[] = [item.principio_ativo];
		if (item.concentracao) parts.push(item.concentracao);
		if (item.forma_farmaceutica) parts.push(item.forma_farmaceutica);
		if (item.via_administracao) parts.push(`via ${item.via_administracao}`);

		const label = parts.join(' · ');

		if (value && value.trim()) {
			value = value.trim() + '; ' + label;
		} else {
			value = label;
		}

		query = '';
		isOpen = false;
		results = { medicamentos: [], principios_ativos: [] };

		if (onSelect) onSelect(item);
	}

	function handleKeydown(e: KeyboardEvent) {
		const all = results.medicamentos;
		if (!isOpen || all.length === 0) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % all.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = selectedIndex <= 0 ? all.length - 1 : selectedIndex - 1;
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectItem(all[selectedIndex]);
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.med-search-container')) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="med-search-container">
	<div class="search-input-wrapper">
		<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"/>
			<line x1="21" y1="21" x2="16.65" y2="16.65"/>
		</svg>
		<input
			bind:this={inputEl}
			type="text"
			class="search-input"
			{placeholder}
			{id}
			bind:value={query}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => { if (results.medicamentos.length > 0) isOpen = true; }}
			autocomplete="off"
		/>
		{#if isLoading}
			<div class="spinner"></div>
		{:else if query}
			<button
				type="button"
				class="btn-clear"
				onclick={() => { query = ''; isOpen = false; results = { medicamentos: [], principios_ativos: [] }; }}
			>
				✕
			</button>
		{/if}
	</div>

	{#if isOpen && results.medicamentos.length > 0}
		<div class="dropdown-results">
			<div class="dropdown-header">
				<span>Princípios Ativos Filtrados ({results.medicamentos.length})</span>
			</div>
			<div class="dropdown-list">
				{#each results.medicamentos as med, i (med.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="med-box-item"
						class:selected={i === selectedIndex}
						role="button"
						tabindex="0"
						onclick={() => selectItem(med)}
						onmouseenter={() => (selectedIndex = i)}
					>
						<div class="med-box-top">
							<span class="med-pa-title">{med.principio_ativo}</span>
						</div>
						<div class="med-badges-list">
							{#if med.concentracao}
								<span class="badge badge-dose">{med.concentracao}</span>
							{/if}
							{#if med.forma_farmaceutica}
								<span class="badge badge-forma">{med.forma_farmaceutica}</span>
							{/if}
							{#if med.via_administracao}
								<span class="badge badge-via">{med.via_administracao}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.med-search-container {
		position: relative;
		width: 100%;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: #94a3b8;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 9px 36px 9px 36px;
		font-size: 0.875rem;
		border: 1.5px solid #cbd5e1;
		border-radius: 8px;
		background: #ffffff;
		color: #0f172a;
		outline: none;
		transition: all 0.15s;
	}

	.search-input:focus {
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
	}

	.btn-clear {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: #94a3b8;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.btn-clear:hover {
		color: #475569;
	}

	.spinner {
		position: absolute;
		right: 12px;
		width: 16px;
		height: 16px;
		border: 2px solid #cbd5e1;
		border-top-color: #0284c7;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.dropdown-results {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		border-radius: 12px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
		z-index: 50;
		max-height: 380px;
		overflow-y: auto;
	}

	.dropdown-header {
		padding: 8px 12px;
		font-size: 0.6875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #64748b;
		background: #f8fafc;
		border-bottom: 1px solid #f1f5f9;
	}

	.dropdown-list {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.med-box-item {
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid #f1f5f9;
		cursor: pointer;
		transition: all 0.15s;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.med-box-item:hover, .med-box-item.selected {
		background: #f0f9ff;
		border-color: #7dd3fc;
		transform: translateX(2px);
	}

	.med-pa-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: #0f172a;
	}

	.med-badges-list {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.badge {
		display: inline-flex;
		padding: 2px 7px;
		font-size: 0.75rem;
		font-weight: 600;
		border-radius: 4px;
	}

	.badge-dose {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.badge-forma {
		background: #f8fafc;
		color: #334155;
		border: 1px solid #e2e8f0;
	}

	.badge-via {
		background: #faf5ff;
		color: #7e22ce;
		border: 1px solid #f3e8ff;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
