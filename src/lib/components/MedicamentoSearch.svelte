<script lang="ts">
	interface MedicamentoResult {
		id: number;
		nome: string;
		tipo: 'produto' | 'principio_ativo';
		tipo_produto?: string;
		substancia?: string;
	}

	interface SearchResponse {
		produtos: MedicamentoResult[];
		principios_ativos: MedicamentoResult[];
	}

	let {
		value = $bindable(''),
		placeholder = 'Pesquisar medicamento...',
		id = '',
		onSelect
	}: {
		value?: string;
		placeholder?: string;
		id?: string;
		onSelect?: (item: MedicamentoResult) => void;
	} = $props();

	let query = $state('');
	let results = $state<SearchResponse>({ produtos: [], principios_ativos: [] });
	let isOpen = $state(false);
	let isLoading = $state(false);
	let selectedIndex = $state(-1);
	let inputEl: HTMLInputElement | undefined = $state(undefined);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function getAllResults(): MedicamentoResult[] {
		return [...results.produtos, ...results.principios_ativos];
	}

	async function searchMedicamentos(searchQuery: string) {
		if (searchQuery.length < 2) {
			results = { produtos: [], principios_ativos: [] };
			isOpen = false;
			return;
		}

		isLoading = true;
		try {
			const res = await fetch(`/api/medicamentos?q=${encodeURIComponent(searchQuery)}`);
			if (res.ok) {
				results = await res.json();
				isOpen = results.produtos.length > 0 || results.principios_ativos.length > 0;
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
		}, 300);
	}

	function selectItem(item: MedicamentoResult) {
		const label = item.tipo === 'produto'
			? `${item.nome}${item.tipo_produto ? ` (${item.tipo_produto})` : ''}`
			: item.nome;

		if (value && value.trim()) {
			value = value.trim() + '; ' + label;
		} else {
			value = label;
		}

		query = '';
		isOpen = false;
		results = { produtos: [], principios_ativos: [] };

		if (onSelect) onSelect(item);
	}

	function handleKeydown(e: KeyboardEvent) {
		const all = getAllResults();
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

	function handleBlur() {
		// Delay to allow click on dropdown item
		setTimeout(() => {
			isOpen = false;
		}, 200);
	}
</script>

<div class="med-search-wrapper">
	<div class="med-search-input-row">
		<input
			bind:this={inputEl}
			bind:value={query}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => { if (getAllResults().length > 0) isOpen = true; }}
			onblur={handleBlur}
			type="text"
			{placeholder}
			{id}
			class="med-search-input"
			autocomplete="off"
		/>
		{#if isLoading}
			<div class="med-search-spinner"></div>
		{/if}
		{#if query.length > 0}
			<button
				type="button"
				class="med-search-clear"
				onclick={() => { query = ''; isOpen = false; results = { produtos: [], principios_ativos: [] }; }}
			>×</button>
		{/if}
	</div>

	{#if isOpen}
		<div class="med-search-dropdown">
			{#if results.produtos.length > 0}
				<div class="med-search-group-label">Produtos</div>
				{#each results.produtos as item, i}
					<button
						type="button"
						class="med-search-item"
						class:selected={selectedIndex === i}
						onmousedown={(e) => { e.preventDefault(); selectItem(item); }}
					>
						<span class="med-item-name">{item.nome}</span>
						{#if item.tipo_produto}
							<span class="med-item-badge">{item.tipo_produto}</span>
						{/if}
						{#if item.substancia}
							<span class="med-item-sub">{item.substancia}</span>
						{/if}
					</button>
				{/each}
			{/if}
			{#if results.principios_ativos.length > 0}
				<div class="med-search-group-label">Princípios Ativos</div>
				{#each results.principios_ativos as item, j}
					{@const idx = results.produtos.length + j}
					<button
						type="button"
						class="med-search-item"
						class:selected={selectedIndex === idx}
						onmousedown={(e) => { e.preventDefault(); selectItem(item); }}
					>
						<span class="med-item-name">{item.nome}</span>
						<span class="med-item-badge pa">Princípio Ativo</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>

<style>
	.med-search-wrapper {
		position: relative;
		width: 100%;
	}

	.med-search-input-row {
		position: relative;
		display: flex;
		align-items: center;
	}

	.med-search-input {
		width: 100%;
		border: 1px solid var(--border, #ccc);
		border-radius: 6px;
		padding: 7px 32px 7px 10px;
		font-family: var(--font, 'IBM Plex Sans', sans-serif);
		font-size: 12.5px;
		color: var(--text, #111);
		background: var(--surface, #fff);
		transition: border-color 0.15s, box-shadow 0.15s;
	}

	.med-search-input:focus {
		outline: none;
		border-color: var(--accent-teal, #0d9488);
		box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
	}

	.med-search-input::placeholder {
		color: #aaa;
		font-size: 12px;
	}

	.med-search-spinner {
		position: absolute;
		right: 10px;
		width: 14px;
		height: 14px;
		border: 2px solid #ddd;
		border-top-color: var(--accent-teal, #0d9488);
		border-radius: 50%;
		animation: med-spin 0.6s linear infinite;
	}

	@keyframes med-spin {
		to { transform: rotate(360deg); }
	}

	.med-search-clear {
		position: absolute;
		right: 8px;
		background: none;
		border: none;
		font-size: 16px;
		color: #999;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.med-search-clear:hover {
		color: #333;
	}

	.med-search-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
		border: 1px solid var(--border, #ccc);
		border-radius: 8px;
		margin-top: 4px;
		max-height: 260px;
		overflow-y: auto;
		z-index: 200;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
	}

	.med-search-group-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #888;
		padding: 8px 12px 4px;
		border-top: 1px solid #f0f0f0;
	}

	.med-search-group-label:first-child {
		border-top: none;
	}

	.med-search-item {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		width: 100%;
		text-align: left;
		padding: 8px 12px;
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--font, 'IBM Plex Sans', sans-serif);
		font-size: 12.5px;
		color: #333;
		transition: background 0.1s;
	}

	.med-search-item:hover,
	.med-search-item.selected {
		background: #f0fdf4;
	}

	.med-item-name {
		font-weight: 500;
	}

	.med-item-badge {
		font-size: 9.5px;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 3px;
		background: #e8e8e8;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.med-item-badge.pa {
		background: #dbeafe;
		color: #1e40af;
	}

	.med-item-sub {
		font-size: 11px;
		color: #999;
		flex-basis: 100%;
		padding-left: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
