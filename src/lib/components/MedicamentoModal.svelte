<script lang="ts">
	import { getPrescriptionVerb } from '$lib/utils/prescriptionPdfGenerator';

	export interface MedicamentoItem {
		id: number;
		principio_ativo_id: number;
		principio_ativo: string;
		concentracao: string;
		forma_farmaceutica: string;
		via_administracao: string;
		classe_terapeutica?: string;
	}

	export interface PrincipioAtivoItem {
		id: number;
		nome: string;
	}

	export interface StructuredMedication {
		name: string;
		concentration: string;
		form: string;
		route: string;
		dosage: string;
		frequency: string;
		duration: string;
		quantity: string;
		instructions: string;
		rawText: string;
	}

	interface SearchResponse {
		medicamentos: MedicamentoItem[];
		principios_ativos: PrincipioAtivoItem[];
	}

	let {
		value = $bindable(''),
		placeholder = '+ Adicionar medicamento',
		id = '',
		context = 'prescricao',
		onSelectStructured = undefined
	}: {
		value?: string;
		placeholder?: string;
		id?: string;
		context?: 'prescricao' | 'gestacao' | 'uso_continuo';
		onSelectStructured?: (med: StructuredMedication) => void;
	} = $props();

	// Modal state
	let isModalOpen = $state(false);
	let activeTab = $state<'catalogo' | 'manual'>('catalogo');
	let step = $state<1 | 2>(1); // 1 = Seleção / Busca, 2 = Parâmetros Completos

	// Step 1: Search & Filter
	let query = $state('');
	let searchResults = $state<SearchResponse>({ medicamentos: [], principios_ativos: [] });
	let isSearching = $state(false);
	let selectedPaFilter = $state<string | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Prescription Parameters (Full Clinical Form)
	let medNome = $state('');
	let medConcentracao = $state('');
	let medForma = $state('comprimido');
	let medVia = $state('oral');
	let medDoseUnit = $state('1 comprimido');
	let medFrequencia = $state('');
	let medFrequenciaCustom = $state('');
	let medDuracao = $state('');
	let medDuracaoCustom = $state('');
	let medQuantidadeTotal = $state('');
	let medOrientacoes = $state('');
	let customPreviewOverride = $state<string | null>(null);

	// Quick chips presets
	const FORMAS_COMUNS = [
		'comprimido',
		'comprimido revestido',
		'cápsula',
		'solução oral (gotas)',
		'xarope',
		'suspensão oral',
		'creme',
		'pomada',
		'gel',
		'solução injetável',
		'spray / inalatório',
		'solução oftálmica (colírio)',
		'supositório'
	];

	const VIAS_COMUNS = [
		{ label: 'Oral (VO)', value: 'oral' },
		{ label: 'Tópica', value: 'tópica' },
		{ label: 'Intravenosa (IV)', value: 'intravenosa' },
		{ label: 'Intramuscular (IM)', value: 'intramuscular' },
		{ label: 'Subcutânea (SC)', value: 'subcutânea' },
		{ label: 'Sublingual (SL)', value: 'sublingual' },
		{ label: 'Inalatória', value: 'inalatória' },
		{ label: 'Oftálmica', value: 'oftálmica' },
		{ label: 'Nasal', value: 'nasal' },
		{ label: 'Retal', value: 'retal' },
		{ label: 'Vaginal', value: 'vaginal' }
	];

	const DOSES_UNITARIAS_COMUNS = [
		'1 comprimido',
		'2 comprimidos',
		'1/2 comprimido',
		'1 cápsula',
		'20 gotas',
		'30 gotas',
		'40 gotas',
		'1 colher de chá (5 mL)',
		'1 colher de sopa (15 mL)',
		'1 ampola',
		'1 aplicação fina',
		'2 borrifadas / jatos'
	];

	const FREQUENCIAS_PRESCRICAO = [
		{ label: '1×/dia (24/24h)', value: '1x/dia (24/24h)' },
		{ label: '2×/dia (12/12h)', value: '2x/dia (12/12h)' },
		{ label: '3×/dia (8/8h)', value: '3x/dia (8/8h)' },
		{ label: '4×/dia (6/6h)', value: '4x/dia (6/6h)' },
		{ label: '6×/dia (4/4h)', value: '6x/dia (4/4h)' },
		{ label: 'Dose única (DU)', value: 'dose única' },
		{ label: 'SOS (se dor/febre)', value: 'SOS (se dor ou febre)' },
		{ label: '1× por semana', value: '1x/semana' },
		{ label: 'Em jejum (pela manhã)', value: 'em jejum pela manhã' },
		{ label: 'Ao deitar (à noite)', value: 'ao deitar (à noite)' },
		{ label: 'Dias alternados', value: 'em dias alternados' }
	];

	const FREQUENCIAS_GESTACAO = [
		{ label: '1×/dia', value: '1x/dia' },
		{ label: '2×/dia', value: '2x/dia' },
		{ label: '3×/dia', value: '3x/dia' },
		{ label: 'Dose única', value: 'dose única' },
		{ label: 'Uso contínuo', value: 'uso contínuo' }
	];

	const FREQUENCIAS_CONTINUO = [
		{ label: '1×/dia pela manhã', value: '1x/dia pela manhã' },
		{ label: '1×/dia à noite', value: '1x/dia à noite' },
		{ label: '2×/dia (12/12h)', value: '2x/dia (12/12h)' },
		{ label: '3×/dia (8/8h)', value: '3x/dia (8/8h)' },
		{ label: 'Uso contínuo', value: 'uso contínuo' }
	];

	const DURACOES_COMUNS = [
		'por 3 dias',
		'por 5 dias',
		'por 7 dias',
		'por 10 dias',
		'por 14 dias',
		'por 21 dias',
		'por 30 dias',
		'uso contínuo',
		'até melhora dos sintomas'
	];

	const EMBALAGENS_COMUNS = [
		'30 comprimidos',
		'60 comprimidos',
		'1 caixa',
		'2 caixas',
		'3 caixas',
		'1 frasco',
		'2 frascos',
		'1 tubo / bisnaga',
		'5 ampolas',
		'10 ampolas',
		'1 spray / frasco'
	];

	const ORIENTACOES_RAPIDAS = [
		'Tomar após as refeições',
		'Tomar em jejum com água abundante',
		'Evitar consumo de bebidas alcoólicas',
		'Não interromper sem orientação médica',
		'Agitar o frasco antes de usar',
		'Uso exclusivamente tópico / externo',
		'Manter sob refrigeração (2 a 8°C)'
	];

	function getFrequencies() {
		if (context === 'gestacao') return FREQUENCIAS_GESTACAO;
		if (context === 'uso_continuo') return FREQUENCIAS_CONTINUO;
		return FREQUENCIAS_PRESCRICAO;
	}

	function openModal() {
		isModalOpen = true;
		step = 1;
		activeTab = 'catalogo';
		query = '';
		searchResults = { medicamentos: [], principios_ativos: [] };
		selectedPaFilter = null;
		resetForm();
	}

	function resetForm() {
		medNome = '';
		medConcentracao = '';
		medForma = 'comprimido';
		medVia = 'oral';
		medDoseUnit = '1 comprimido';
		medFrequencia = '';
		medFrequenciaCustom = '';
		medDuracao = '';
		medDuracaoCustom = '';
		medQuantidadeTotal = '';
		medOrientacoes = '';
		customPreviewOverride = null;
	}

	function closeModal() {
		isModalOpen = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('med-modal-backdrop')) {
			closeModal();
		}
	}

	function handleKeydownEsc(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}

	// ── Busca de Medicamentos no Catálogo ──
	async function searchMedicamentos(searchQuery: string) {
		if (searchQuery.length < 2) {
			searchResults = { medicamentos: [], principios_ativos: [] };
			selectedPaFilter = null;
			return;
		}
		isSearching = true;
		try {
			const res = await fetch(`/api/medicamentos?q=${encodeURIComponent(searchQuery)}`);
			if (res.ok) {
				searchResults = await res.json();
			}
		} catch (e) {
			console.error('Erro na busca de medicamentos:', e);
		} finally {
			isSearching = false;
		}
	}

	function handleSearchInput() {
		selectedPaFilter = null;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => searchMedicamentos(query), 200);
	}

	let filteredMedicamentos = $derived(() => {
		if (!selectedPaFilter) return searchResults.medicamentos;
		return searchResults.medicamentos.filter((m) => m.principio_ativo === selectedPaFilter);
	});

	function selectMedicationBox(med: MedicamentoItem) {
		medNome = med.principio_ativo;
		medConcentracao = med.concentracao || '';
		medForma = med.forma_farmaceutica || 'comprimido';
		medVia = med.via_administracao || 'oral';

		const f = medForma.toLowerCase();
		const r = medVia.toLowerCase();

		// Ajustar dose unitária padrão conforme forma farmacêutica e via
		if (f.includes('solução oral') || f.includes('gotas oral') || (f.includes('gotas') && r.includes('oral'))) {
			medDoseUnit = '20 gotas';
		} else if (f.includes('oftálm') || r.includes('oftálm') || f.includes('colírio') || f.includes('colirio')) {
			medDoseUnit = f.includes('pomada') || f.includes('gel') ? '1 aplicação fina' : '1 gota';
		} else if (f.includes('otológ') || r.includes('otológ')) {
			medDoseUnit = '3 gotas';
		} else if (f.includes('nasal') || r.includes('nasal')) {
			medDoseUnit = f.includes('gotas') ? '2 gotas em cada narina' : '1 borrifada em cada narina';
		} else if (f.includes('spray') || f.includes('inalat') || r.includes('inalat') || f.includes('aerossol')) {
			medDoseUnit = '2 jatos';
		} else if (f.includes('xarope') || f.includes('suspensão')) {
			medDoseUnit = '1 colher de sopa (15 mL)';
		} else if (f.includes('cápsula')) {
			medDoseUnit = '1 cápsula';
		} else if (f.includes('injetável') || f.includes('ampola') || r.includes('parenteral') || r.includes('intramuscular') || r.includes('intravenosa')) {
			medDoseUnit = '1 ampola';
		} else if (f.includes('creme') || f.includes('pomada') || f.includes('gel') || f.includes('loção') || r.includes('tópica')) {
			medDoseUnit = '1 aplicação fina';
		} else if (f.includes('supositório')) {
			medDoseUnit = '1 supositório';
		} else if (f.includes('óvulo')) {
			medDoseUnit = '1 óvulo';
		} else {
			medDoseUnit = '1 comprimido';
		}

		step = 2;
	}

	function switchToManual() {
		activeTab = 'manual';
		step = 2;
		if (query && !medNome) {
			medNome = query.toUpperCase();
		}
	}

	function addOrientacao(ori: string) {
		if (medOrientacoes.includes(ori)) return;
		if (medOrientacoes.trim()) {
			medOrientacoes = medOrientacoes.trim() + '; ' + ori;
		} else {
			medOrientacoes = ori;
		}
	}

	// ── Formatação da Linha de Prescrição Médica ──
	function generatePrescriptionText(): string {
		if (customPreviewOverride !== null) return customPreviewOverride;

		const parts: string[] = [];

		// 1. Identificação do Medicamento + Concentração
		let title = (medNome || 'Medicamento').trim();
		if (medConcentracao.trim()) {
			title += ` ${medConcentracao.trim()}`;
		}
		parts.push(title);

		// 2. Forma & Via
		const details: string[] = [];
		if (medForma.trim()) details.push(medForma.trim());
		if (medVia.trim()) details.push(`via ${medVia.trim()}`);
		if (details.length > 0) {
			parts.push(details.join(', '));
		}

		// 3. Posologia: [Verbo Adequado] [dose unitária] [frequência] [duração]
		const posoParts: string[] = [];
		if (medDoseUnit.trim()) {
			const d = medDoseUnit.trim();
			const firstWord = d.split(/\s+/)[0]?.toLowerCase();
			const knownVerbs = [
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
			if (knownVerbs.includes(firstWord)) {
				posoParts.push(d);
			} else {
				const verb = getPrescriptionVerb(medForma, medVia);
				posoParts.push(`${verb} ${d}`);
			}
		}
		const freq = medFrequencia === '__custom__' ? medFrequenciaCustom.trim() : medFrequencia.trim();
		if (freq) {
			posoParts.push(freq);
		}
		const dur = medDuracao === '__custom__' ? medDuracaoCustom.trim() : medDuracao.trim();
		if (dur) {
			posoParts.push(dur);
		}
		if (posoParts.length > 0) {
			parts.push(posoParts.join(' '));
		}

		// 4. Quantidade total a dispensar
		if (medQuantidadeTotal.trim()) {
			parts.push(`Dispensar: ${medQuantidadeTotal.trim()}`);
		}

		// 5. Orientações adicionais
		if (medOrientacoes.trim()) {
			parts.push(`Obs: ${medOrientacoes.trim()}`);
		}

		return parts.join(' · ');
	}

	function confirmAndInsert() {
		const entry = generatePrescriptionText();
		if (entry) {
			if (value && value.trim()) {
				value = value.trim() + '\n' + entry;
			} else {
				value = entry;
			}
		}

		if (onSelectStructured) {
			const freq = medFrequencia === '__custom__' ? medFrequenciaCustom.trim() : medFrequencia.trim();
			const dur = medDuracao === '__custom__' ? medDuracaoCustom.trim() : medDuracao.trim();
			onSelectStructured({
				name: medNome.trim(),
				concentration: medConcentracao.trim(),
				form: medForma.trim(),
				route: medVia.trim() || 'oral',
				dosage: medDoseUnit.trim(),
				frequency: freq,
				duration: dur,
				quantity: medQuantidadeTotal.trim(),
				instructions: medOrientacoes.trim(),
				rawText: entry
			});
		}

		closeModal();
	}
</script>

<svelte:window onkeydown={handleKeydownEsc} />

<div class="med-modal-trigger-wrapper">
	<button type="button" class="med-modal-trigger" onclick={openModal} {id}>
		<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"/>
			<line x1="21" y1="21" x2="16.65" y2="16.65"/>
		</svg>
		<span>{placeholder}</span>
	</button>
</div>

{#if isModalOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="med-modal-backdrop" onclick={handleBackdropClick}>
		<div class="med-modal-container" role="dialog" aria-modal="true">
			<!-- Top Header -->
			<div class="med-modal-header">
				<div class="header-left">
					<div class="header-badge-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
							<path d="m8.5 8.5 7 7"/>
						</svg>
					</div>
					<div>
						<div class="modal-pre-title">MÓDULO DE PRESCRIÇÃO CLÍNICA</div>
						<h2 class="modal-title">
							{#if step === 1}
								Selecionar Medicamento / Princípio Ativo
							{:else}
								Parâmetros Completos da Prescrição
							{/if}
						</h2>
					</div>
				</div>

				<div class="header-right-actions">
					<!-- Mode Switch Tabs -->
					<div class="mode-tabs">
						<button
							type="button"
							class="mode-tab-btn"
							class:active={activeTab === 'catalogo' && step === 1}
							onclick={() => { activeTab = 'catalogo'; step = 1; }}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
							<span>Catálogo da Base</span>
						</button>
						<button
							type="button"
							class="mode-tab-btn"
							class:active={activeTab === 'manual' || step === 2}
							onclick={switchToManual}
						>
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
							<span>Digitar Manualmente</span>
						</button>
					</div>

					<button type="button" class="btn-close" onclick={closeModal} aria-label="Fechar">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
					</button>
				</div>
			</div>

			<!-- Main Scrollable Body -->
			<div class="med-modal-body">
				<!-- ════ STEP 1: Catálogo com Busca em Tempo Real ════ -->
				{#if step === 1 && activeTab === 'catalogo'}
					<div class="search-panel">
						<div class="search-input-wrapper">
							<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="11" cy="11" r="8"/>
								<line x1="21" y1="21" x2="16.65" y2="16.65"/>
							</svg>
							<input
								type="text"
								class="med-search-input"
								placeholder="Digite o princípio ativo, dose ou formulação (ex: Dipirona, Amoxicilina 500, Paracetamol gotas, Losartana...)"
								bind:value={query}
								oninput={handleSearchInput}
							/>
							{#if isSearching}
								<div class="spinner"></div>
							{:else if query}
								<button type="button" class="btn-clear-query" onclick={() => { query = ''; searchResults = { medicamentos: [], principios_ativos: [] }; selectedPaFilter = null; }}>
									✕
								</button>
							{/if}
						</div>

						<div class="search-sub-bar">
							<span class="search-hint-text">
								{searchResults.medicamentos.length > 0 ? `${searchResults.medicamentos.length} formulações clínicas encontradas` : 'Busca instantânea por princípio ativo, concentração ou via'}
							</span>
							<button type="button" class="btn-link-manual" onclick={switchToManual}>
								✍️ Não encontrou? Clique para digitar manualmente
							</button>
						</div>
					</div>

					<!-- Filtro de Substâncias Específicas -->
					{#if searchResults.principios_ativos.length > 1}
						<div class="pa-filter-pills">
							<span class="pa-filter-label">Substâncias:</span>
							<button 
								type="button" 
								class="pa-pill" 
								class:active={selectedPaFilter === null}
								onclick={() => (selectedPaFilter = null)}
							>
								Todas as Apresentações ({searchResults.medicamentos.length})
							</button>
							{#each searchResults.principios_ativos as pa}
								<button 
									type="button" 
									class="pa-pill" 
									class:active={selectedPaFilter === pa.nome}
									onclick={() => (selectedPaFilter = pa.nome)}
								>
									{pa.nome}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Grid de Boxes de Medicamentos -->
					<div class="med-boxes-container">
						{#if query.trim().length >= 2}
							{#if filteredMedicamentos().length > 0}
								<div class="med-boxes-grid">
									{#each filteredMedicamentos() as med (med.id)}
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<div 
											class="med-card-box" 
											role="button" 
											tabindex="0"
											onclick={() => selectMedicationBox(med)}
										>
											<div class="med-card-top">
												<div class="med-card-title-group">
													<div class="med-card-icon">
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
															<path d="m8.5 8.5 7 7"/>
														</svg>
													</div>
													<div class="med-card-title-text">
														<span class="med-pa-name">{med.principio_ativo}</span>
													</div>
												</div>
												<span class="btn-select-box">
													Prescrever
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
												</span>
											</div>

											<!-- Badges de Dose, Forma e Via -->
											<div class="med-badges-row">
												{#if med.concentracao}
													<div class="med-badge badge-dose" title="Dose / Concentração">
														<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
														<span>{med.concentracao}</span>
													</div>
												{/if}

												{#if med.forma_farmaceutica}
													<div class="med-badge badge-forma" title="Forma Farmacêutica">
														<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/></svg>
														<span>{med.forma_farmaceutica}</span>
													</div>
												{/if}

												{#if med.via_administracao}
													<div class="med-badge badge-via" title="Via de Administração">
														<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
														<span>{med.via_administracao}</span>
													</div>
												{/if}
											</div>

											{#if med.classe_terapeutica}
												<div class="med-card-footer">
													<span class="med-classe-tag">{med.classe_terapeutica}</span>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{:else if !isSearching}
								<div class="empty-state">
									<div class="empty-icon-wrap">
										<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
											<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
										</svg>
									</div>
									<h4 class="empty-title">Nenhum medicamento encontrado para "{query}"</h4>
									<p class="empty-desc">Você pode prescrever livremente digitando o nome e as especificações de forma manual.</p>
									<button type="button" class="btn-manual-cta" onclick={switchToManual}>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
										<span>Digitar "{query}" Manualmente</span>
									</button>
								</div>
							{/if}
						{:else}
							<div class="initial-search-hint">
								<div class="hint-icon">
									<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
										<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
										<path d="M6 6h10M6 10h10M6 14h6"/>
									</svg>
								</div>
								<h4>Catálogo Completo de Princípios Ativos</h4>
								<p>Digite o nome do medicamento para filtrar instantaneamente os boxes com <strong>Dose/Concentração</strong>, <strong>Forma Farmacêutica</strong> e <strong>Via</strong>.</p>
								
								<div class="quick-examples">
									<span>Atalhos rápidos:</span>
									<button type="button" class="example-chip" onclick={() => { query = 'Dipirona'; searchMedicamentos('Dipirona'); }}>Dipirona</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Amoxicilina'; searchMedicamentos('Amoxicilina'); }}>Amoxicilina</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Paracetamol'; searchMedicamentos('Paracetamol'); }}>Paracetamol</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Ibuprofeno'; searchMedicamentos('Ibuprofeno'); }}>Ibuprofeno</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Losartana'; searchMedicamentos('Losartana'); }}>Losartana</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Omeprazol'; searchMedicamentos('Omeprazol'); }}>Omeprazol</button>
									<button type="button" class="example-chip" onclick={() => { query = 'Salbutamol'; searchMedicamentos('Salbutamol'); }}>Salbutamol</button>
								</div>
							</div>
						{/if}
					</div>

				<!-- ════ STEP 2 / MODO MANUAL: Painel Amplo de Parâmetros Clínicos ════ -->
				{:else}
					<div class="full-params-container">
						<!-- Linha Superior de Identificação do Medicamento -->
						<div class="params-header-card">
							<div class="params-row-3">
								<div class="form-group flex-2">
									<label class="param-label" for="med-nome">
										Nome do Medicamento / Princípio Ativo <span class="req">*</span>
									</label>
									<div class="input-with-icon">
										<svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/></svg>
										<input
											id="med-nome"
											type="text"
											class="param-input bold-input"
											placeholder="Ex: AMOXICILINA, DIPIRONA, PARACETAMOL, DORFLEX..."
											bind:value={medNome}
										/>
									</div>
								</div>

								<div class="form-group flex-1">
									<label class="param-label" for="med-conc">
										Dose / Concentração
									</label>
									<input
										id="med-conc"
										type="text"
										class="param-input"
										placeholder="Ex: 500 MG, 50 MG/ML, 1 G, 20%"
										bind:value={medConcentracao}
									/>
								</div>

								<div class="form-group flex-1">
									<label class="param-label" for="med-qtd-total">
										Quantidade Total / Embalagens
									</label>
									<input
										id="med-qtd-total"
										type="text"
										class="param-input"
										placeholder="Ex: 1 caixa, 2 frascos, 1 tubo"
										bind:value={medQuantidadeTotal}
									/>
								</div>
							</div>

							<!-- Chips de Embalagens Rápidas -->
							<div class="quick-chips-row">
								<span class="chips-label">Embalagem rápida:</span>
								{#each EMBALAGENS_COMUNS as emb}
									<button type="button" class="mini-chip" class:selected={medQuantidadeTotal === emb} onclick={() => (medQuantidadeTotal = emb)}>
										{emb}
									</button>
								{/each}
							</div>
						</div>

						<!-- Grid de Seções de Parâmetros -->
						<div class="params-sections-grid">
							<!-- Coluna 1: Forma, Via e Posologia Unitária -->
							<div class="param-section-box">
								<div class="section-box-header">
									<span class="box-num">1</span>
									<h4>Forma Farmacêutica & Via</h4>
								</div>

								<!-- Forma Farmacêutica -->
								<div class="form-group">
									<label class="param-label" for="med-forma">Forma Farmacêutica</label>
									<input
										id="med-forma"
										type="text"
										class="param-input"
										placeholder="Ex: comprimido, xarope, gotas, pomada..."
										bind:value={medForma}
									/>
									<div class="chips-flow">
										{#each FORMAS_COMUNS as f}
											<button type="button" class="micro-chip" class:selected={medForma === f} onclick={() => (medForma = f)}>
												{f}
											</button>
										{/each}
									</div>
								</div>

								<!-- Via de Administração -->
								<div class="form-group" style="margin-top: 14px;">
									<label class="param-label" for="med-via">Via de Administração</label>
									<div class="vias-chips-grid" id="med-via">
										{#each VIAS_COMUNS as v}
											<button type="button" class="via-chip" class:selected={medVia === v.value} onclick={() => (medVia = v.value)}>
												{v.label}
											</button>
										{/each}
									</div>
								</div>

								<!-- Quantidade por Tomada / Dose Unitária -->
								<div class="form-group" style="margin-top: 14px;">
									<label class="param-label" for="med-dose-unit">Quantidade por Tomada / Dose Unitária</label>
									<input
										id="med-dose-unit"
										type="text"
										class="param-input"
										placeholder="Ex: 1 comprimido, 20 gotas, 1 colher de sopa (15 mL)..."
										bind:value={medDoseUnit}
									/>
									<div class="chips-flow">
										{#each DOSES_UNITARIAS_COMUNS as d}
											<button type="button" class="micro-chip" class:selected={medDoseUnit === d} onclick={() => (medDoseUnit = d)}>
												{d}
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Coluna 2: Frequência, Duração & Orientações -->
							<div class="param-section-box">
								<div class="section-box-header">
									<span class="box-num">2</span>
									<h4>Posologia, Horários & Duração</h4>
								</div>

								<!-- Frequência / Intervalo -->
								<div class="form-group">
									<label class="param-label" for="freq-list">Frequência / Intervalo de Horário</label>
									<div class="freq-chips-grid" id="freq-list">
										{#each getFrequencies() as freq}
											<button
												type="button"
												class="freq-chip-btn"
												class:selected={medFrequencia === freq.value}
												onclick={() => (medFrequencia = freq.value)}
											>
												{freq.label}
											</button>
										{/each}
										<button
											type="button"
											class="freq-chip-btn"
											class:selected={medFrequencia === '__custom__'}
											onclick={() => (medFrequencia = '__custom__')}
										>
											Outro Horário…
										</button>
									</div>

									{#if medFrequencia === '__custom__'}
										<input
											type="text"
											class="param-input"
											style="margin-top: 6px;"
											placeholder="Ex: 1 comprimido às 8h e 1 comprimido às 20h"
											bind:value={medFrequenciaCustom}
										/>
									{/if}
								</div>

								<!-- Duração do Tratamento -->
								<div class="form-group" style="margin-top: 14px;">
									<label class="param-label" for="dur-chips">Duração do Tratamento</label>
									<div class="duration-chips-flow" id="dur-chips">
										{#each DURACOES_COMUNS as dur}
											<button
												type="button"
												class="micro-chip"
												class:selected={medDuracao === dur}
												onclick={() => (medDuracao = medDuracao === dur ? '' : dur)}
											>
												{dur}
											</button>
										{/each}
									</div>
									<input
										type="text"
										class="param-input"
										style="margin-top: 6px;"
										placeholder="Ou digite a duração personalizada (ex: por 12 semanas)"
										bind:value={medDuracaoCustom}
										oninput={() => { if (medDuracaoCustom) medDuracao = '__custom__'; }}
									/>
								</div>

								<!-- Orientações ao Paciente -->
								<div class="form-group" style="margin-top: 14px;">
									<label class="param-label" for="med-ori">Orientações & Recomendações Adicionais</label>
									<input
										id="med-ori"
										type="text"
										class="param-input"
										placeholder="Ex: Tomar após o almoço; não ingerir com leite; evitar sol..."
										bind:value={medOrientacoes}
									/>
									<div class="chips-flow">
										{#each ORIENTACOES_RAPIDAS as ori}
											<button type="button" class="micro-chip" onclick={() => addOrientacao(ori)}>
												+ {ori}
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- Caixa de Prévia em Tempo Real da Prescrição -->
						<div class="live-preview-box">
							<div class="preview-header">
								<div class="preview-title-wrap">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
									<span>Prévia da Inserção no Prontuário</span>
								</div>
								<span class="preview-tag">Linha Formatada</span>
							</div>
							<div class="preview-content-box">
								{generatePrescriptionText()}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Bottom Footer Bar -->
			<div class="med-modal-footer">
				<div class="footer-left">
					{#if step === 2 && activeTab === 'catalogo'}
						<button type="button" class="btn-secondary" onclick={() => (step = 1)}>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
							<span>Voltar ao Catálogo</span>
						</button>
					{/if}
				</div>

				<div class="footer-right">
					<button type="button" class="btn-cancel" onclick={closeModal}>
						Cancelar
					</button>

					{#if step === 2}
						<button 
							type="button" 
							class="btn-confirm" 
							onclick={confirmAndInsert}
							disabled={!medNome.trim()}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
							<span>Confirmar e Inserir na Prescrição</span>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ── Trigger Button ── */
	.med-modal-trigger-wrapper {
		margin-top: 6px;
	}

	.med-modal-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 16px;
		font-size: 0.84375rem;
		font-weight: 600;
		color: #0284c7;
		background: #f0f9ff;
		border: 1.5px solid #bae6fd;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.med-modal-trigger:hover {
		background: #e0f2fe;
		border-color: #7dd3fc;
		color: #0369a1;
		box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15);
		transform: translateY(-1px);
	}

	/* ── Backdrop & Modal Container ── */
	.med-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.7);
		backdrop-filter: blur(6px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		animation: fadeIn 0.2s ease-out;
	}

	/* Janela ampla para comportar todos os parâmetros */
	.med-modal-container {
		background: #ffffff;
		border-radius: 18px;
		box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.35);
		width: 100%;
		max-width: 1120px;
		height: 90vh;
		max-height: 900px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid #cbd5e1;
		animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	/* ── Header ── */
	.med-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 28px;
		border-bottom: 1.5px solid #e2e8f0;
		background: #ffffff;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.header-badge-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: #e0f2fe;
		color: #0284c7;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.modal-pre-title {
		font-size: 0.6875rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #0284c7;
		margin-bottom: 2px;
	}

	.modal-title {
		font-size: 1.1875rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0;
		line-height: 1.2;
	}

	.header-right-actions {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.mode-tabs {
		display: flex;
		background: #f1f5f9;
		padding: 3px;
		border-radius: 10px;
		border: 1px solid #e2e8f0;
		gap: 2px;
	}

	.mode-tab-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #64748b;
		background: none;
		border: none;
		border-radius: 7px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-tab-btn.active {
		background: #ffffff;
		color: #0284c7;
		font-weight: 700;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	}

	.btn-close {
		width: 36px;
		height: 36px;
		border-radius: 9px;
		border: none;
		background: #f8fafc;
		color: #64748b;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.btn-close:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	/* ── Body ── */
	.med-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 22px 28px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		background: #f8fafc;
	}

	/* ── Painel de Busca ── */
	.search-panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 16px;
		color: #94a3b8;
		pointer-events: none;
	}

	.med-search-input {
		width: 100%;
		padding: 14px 44px 14px 48px;
		font-size: 1rem;
		font-weight: 500;
		border: 2px solid #cbd5e1;
		border-radius: 14px;
		background: #ffffff;
		color: #0f172a;
		outline: none;
		transition: all 0.2s;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
	}

	.med-search-input:focus {
		border-color: #0284c7;
		box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.15);
	}

	.btn-clear-query {
		position: absolute;
		right: 16px;
		background: none;
		border: none;
		font-size: 1.125rem;
		color: #94a3b8;
		cursor: pointer;
		padding: 4px;
	}

	.spinner {
		position: absolute;
		right: 16px;
		width: 20px;
		height: 20px;
		border: 2px solid #cbd5e1;
		border-top-color: #0284c7;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	.search-sub-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 4px;
	}

	.search-hint-text {
		font-size: 0.78125rem;
		font-weight: 600;
		color: #64748b;
	}

	.btn-link-manual {
		background: none;
		border: none;
		font-size: 0.8125rem;
		font-weight: 700;
		color: #0284c7;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 4px;
		transition: all 0.15s;
	}

	.btn-link-manual:hover {
		text-decoration: underline;
		color: #0369a1;
	}

	/* ── PA Filter Pills ── */
	.pa-filter-pills {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		padding: 4px 0;
	}

	.pa-filter-label {
		font-size: 0.71875rem;
		font-weight: 800;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.pa-pill {
		padding: 6px 13px;
		font-size: 0.78125rem;
		font-weight: 600;
		color: #334155;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 20px;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s;
	}

	.pa-pill:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.pa-pill.active {
		background: #0284c7;
		color: #ffffff;
		border-color: #0284c7;
	}

	/* ── Med Boxes Grid ── */
	.med-boxes-container {
		flex: 1;
		min-height: 320px;
	}

	.med-boxes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
		gap: 14px;
	}

	.med-card-box {
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		border-radius: 14px;
		padding: 16px 18px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.med-card-box:hover {
		border-color: #38bdf8;
		box-shadow: 0 8px 20px rgba(2, 132, 199, 0.14);
		transform: translateY(-2px);
		background: #f0f9ff;
	}

	.med-card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.med-card-title-group {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
	}

	.med-card-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: #f0fdf4;
		color: #16a34a;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.med-card-box:hover .med-card-icon {
		background: #0284c7;
		color: #ffffff;
	}

	.med-pa-name {
		font-size: 0.96875rem;
		font-weight: 800;
		color: #0f172a;
		line-height: 1.3;
	}

	.btn-select-box {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.78125rem;
		font-weight: 700;
		color: #0284c7;
		padding: 5px 10px;
		border-radius: 7px;
		background: #e0f2fe;
		opacity: 0.85;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.med-card-box:hover .btn-select-box {
		opacity: 1;
		background: #0284c7;
		color: #ffffff;
	}

	/* ── Badges Row ── */
	.med-badges-row {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.med-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 7px;
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.badge-dose {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.badge-forma {
		background: #f8fafc;
		color: #334155;
		border: 1px solid #cbd5e1;
	}

	.badge-via {
		background: #faf5ff;
		color: #7e22ce;
		border: 1px solid #f3e8ff;
	}

	.med-card-footer {
		border-top: 1px dashed #e2e8f0;
		padding-top: 8px;
	}

	.med-classe-tag {
		font-size: 0.71875rem;
		color: #64748b;
		font-weight: 600;
	}

	/* ── Empty & Initial States ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 48px 24px;
		background: #ffffff;
		border-radius: 14px;
		border: 1.5px dashed #cbd5e1;
	}

	.empty-icon-wrap {
		width: 60px;
		height: 60px;
		border-radius: 14px;
		background: #f1f5f9;
		color: #94a3b8;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.empty-title {
		font-size: 1.0625rem;
		font-weight: 800;
		color: #1e293b;
		margin: 0 0 6px 0;
	}

	.empty-desc {
		font-size: 0.84375rem;
		color: #64748b;
		max-width: 440px;
		margin: 0 0 18px 0;
	}

	.btn-manual-cta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		font-size: 0.875rem;
		font-weight: 700;
		color: #ffffff;
		background: #0284c7;
		border: none;
		border-radius: 9px;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
		transition: all 0.15s;
	}

	.btn-manual-cta:hover {
		background: #0369a1;
	}

	.initial-search-hint {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 40px 24px;
		background: #ffffff;
		border: 1.5px dashed #cbd5e1;
		border-radius: 16px;
	}

	.hint-icon {
		width: 56px;
		height: 56px;
		border-radius: 14px;
		background: #e0f2fe;
		color: #0284c7;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 12px;
	}

	.initial-search-hint h4 {
		font-size: 1.125rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 6px 0;
	}

	.initial-search-hint p {
		font-size: 0.875rem;
		color: #64748b;
		max-width: 520px;
		margin: 0 0 18px 0;
		line-height: 1.45;
	}

	.quick-examples {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.quick-examples span {
		font-size: 0.75rem;
		font-weight: 800;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.example-chip {
		background: #f8fafc;
		border: 1px solid #cbd5e1;
		border-radius: 7px;
		padding: 5px 12px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0284c7;
		cursor: pointer;
		transition: all 0.15s;
	}

	.example-chip:hover {
		border-color: #0284c7;
		background: #e0f2fe;
	}

	/* ════ FULL CLINICAL PARAMETERS STEP ════ */
	.full-params-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.params-header-card {
		background: #ffffff;
		border: 1.5px solid #cbd5e1;
		border-radius: 14px;
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
	}

	.params-row-3 {
		display: flex;
		gap: 14px;
	}

	.flex-1 { flex: 1; }
	.flex-2 { flex: 2; }

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.param-label {
		font-size: 0.78125rem;
		font-weight: 800;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.param-label .req {
		color: #e11d48;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.field-icon {
		position: absolute;
		left: 12px;
		color: #0284c7;
		pointer-events: none;
	}

	.param-input {
		width: 100%;
		padding: 10px 14px;
		font-size: 0.875rem;
		border: 1.5px solid #cbd5e1;
		border-radius: 8px;
		background: #ffffff;
		color: #0f172a;
		outline: none;
		transition: all 0.15s;
	}

	.input-with-icon .param-input {
		padding-left: 36px;
	}

	.param-input.bold-input {
		font-weight: 700;
		color: #0f172a;
		font-size: 0.9375rem;
	}

	.param-input:focus {
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
	}

	.quick-chips-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.chips-label {
		font-size: 0.71875rem;
		font-weight: 700;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.mini-chip {
		padding: 3px 8px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		color: #475569;
		cursor: pointer;
		transition: all 0.12s;
	}

	.mini-chip:hover {
		background: #e2e8f0;
		color: #1e293b;
	}

	.mini-chip.selected {
		background: #0284c7;
		color: #ffffff;
		border-color: #0284c7;
	}

	/* ── 2 Columns Parameters Grid ── */
	.params-sections-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.param-section-box {
		background: #ffffff;
		border: 1.5px solid #cbd5e1;
		border-radius: 14px;
		padding: 18px 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
	}

	.section-box-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding-bottom: 8px;
		border-bottom: 1.5px solid #f1f5f9;
	}

	.box-num {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #0284c7;
		color: #ffffff;
		font-size: 0.75rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-box-header h4 {
		font-size: 0.9375rem;
		font-weight: 800;
		color: #1e293b;
		margin: 0;
	}

	.chips-flow {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 4px;
	}

	.micro-chip {
		padding: 4px 8px;
		font-size: 0.75rem;
		font-weight: 600;
		background: #f8fafc;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		color: #475569;
		cursor: pointer;
		transition: all 0.12s;
	}

	.micro-chip:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.micro-chip.selected {
		background: #0284c7;
		color: #ffffff;
		border-color: #0284c7;
	}

	.vias-chips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 6px;
	}

	.via-chip {
		padding: 6px 8px;
		font-size: 0.78125rem;
		font-weight: 600;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		color: #334155;
		cursor: pointer;
		text-align: center;
		transition: all 0.12s;
	}

	.via-chip:hover {
		border-color: #0284c7;
		background: #f0f9ff;
	}

	.via-chip.selected {
		background: #7e22ce;
		color: #ffffff;
		border-color: #7e22ce;
		font-weight: 700;
	}

	.freq-chips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 6px;
	}

	.freq-chip-btn {
		padding: 7px 10px;
		font-size: 0.78125rem;
		font-weight: 600;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 7px;
		color: #334155;
		cursor: pointer;
		text-align: left;
		transition: all 0.12s;
	}

	.freq-chip-btn:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}

	.freq-chip-btn.selected {
		background: #0284c7;
		color: #ffffff;
		border-color: #0284c7;
		font-weight: 700;
	}

	.duration-chips-flow {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	/* ── Live Preview Box ── */
	.live-preview-box {
		background: #ffffff;
		border: 1.5px solid #bae6fd;
		border-left: 5px solid #0284c7;
		border-radius: 12px;
		padding: 14px 18px;
		box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.preview-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #0284c7;
	}

	.preview-tag {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #64748b;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.preview-content-box {
		font-size: 0.96875rem;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.45;
	}

	/* ── Footer ── */
	.med-modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 28px;
		border-top: 1.5px solid #e2e8f0;
		background: #ffffff;
	}

	.footer-left, .footer-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 16px;
		font-size: 0.84375rem;
		font-weight: 700;
		color: #475569;
		background: #ffffff;
		border: 1.5px solid #cbd5e1;
		border-radius: 9px;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-secondary:hover {
		background: #f1f5f9;
		color: #0f172a;
		border-color: #94a3b8;
	}

	.btn-cancel {
		padding: 9px 18px;
		font-size: 0.84375rem;
		font-weight: 600;
		color: #64748b;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: 9px;
		transition: all 0.15s;
	}

	.btn-cancel:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.btn-confirm {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 22px;
		font-size: 0.90625rem;
		font-weight: 700;
		color: #ffffff;
		background: #0284c7;
		border: none;
		border-radius: 9px;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
		transition: all 0.15s;
	}

	.btn-confirm:hover {
		background: #0369a1;
		box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
		transform: translateY(-1px);
	}

	.btn-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(16px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 900px) {
		.params-sections-grid {
			grid-template-columns: 1fr;
		}
		.params-row-3 {
			flex-direction: column;
		}
		.med-boxes-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
