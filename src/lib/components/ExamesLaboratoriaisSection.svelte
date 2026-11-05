<script lang="ts" module>
	export interface ExameLaboratorialLancado {
		id: string;
		nome: string;
		pacote: string;
		unidade: string;
		valoresReferencia: string;
		valor: string;
		dataColeta?: string;
	}

	export type ExameLancado = ExameLaboratorialLancado;
</script>

<script lang="ts">
	import { tick } from 'svelte';
	import {
		EXAMES_CATALOGO,
		extrairReferenciaPorSexo,
		type ExameCatalogoItem
	} from '$lib/data/examesCatalogo';

	let {
		exames = $bindable([]),
		dataColetaPadrao = $bindable(''),
		sexoBiologico = ''
	}: {
		exames: ExameLaboratorialLancado[];
		dataColetaPadrao?: string;
		sexoBiologico?: 'M' | 'F' | string;
	} = $props();

	// Initialize default date to today if empty
	$effect(() => {
		if (!dataColetaPadrao) {
			dataColetaPadrao = new Date().toISOString().split('T')[0];
		}
	});

	// Active Draft Row State (for single exam insertion)
	let isAddingRow = $state(false);
	let termoBusca = $state('');
	let exameSelecionado = $state<ExameCatalogoItem | null>(null);
	let valorDigitado = $state('');
	let unidadeDigitada = $state('');
	let refDigitada = $state('');
	let pacoteDigitado = $state('');
	let dataColetaLinha = $state('');
	let sugestaoIndexAtiva = $state(0);
	let isDropdownVisible = $state(false);

	let inputNomeRef: HTMLInputElement | null = null;
	let inputValorRef: HTMLInputElement | null = null;

	// Package Modal State ("Adicionar Pacote")
	let isPackageModalOpen = $state(false);
	let pacoteModalSelecionado = $state('');
	let dataColetaModal = $state('');
	let itensPacoteModal = $state<ExameLaboratorialLancado[]>([]);

	let catalogoDinamico = $state<ExameCatalogoItem[]>(EXAMES_CATALOGO);

	$effect(() => {
		if (typeof window !== 'undefined') {
			fetch('/api/exames-laboratoriais')
				.then((r) => (r.ok ? r.json() : null))
				.then((data: any) => {
					if (data?.exames && Array.isArray(data.exames) && data.exames.length > 0) {
						catalogoDinamico = data.exames.map((item: any) => ({
							material: item.material || 'SANGUE',
							nome: item.nome || '',
							pacote: item.pacote || '',
							unidade: item.unidade || '',
							valoresReferencia: item.valoresReferencia || ''
						}));
					}
				})
				.catch(() => {});
		}
	});

	// Distinct packages from catalog
	let pacotesDisponiveis = $derived.by(() => {
		const vistos = new Set<string>();
		const lista: string[] = [];
		for (const item of catalogoDinamico) {
			const pkg = (item.pacote || '').trim();
			if (pkg && !vistos.has(pkg)) {
				vistos.add(pkg);
				lista.push(pkg);
			}
		}
		return lista;
	});

	function abrirModalPacote() {
		pacoteModalSelecionado = '';
		dataColetaModal = dataColetaPadrao || new Date().toISOString().split('T')[0];
		itensPacoteModal = [];
		isPackageModalOpen = true;
	}

	function fecharModalPacote() {
		isPackageModalOpen = false;
	}

	function carregarExamesDoPacote(nomePacote: string) {
		pacoteModalSelecionado = nomePacote;
		if (!nomePacote) {
			itensPacoteModal = [];
			return;
		}
		const filtrados = catalogoDinamico.filter((item) => item.pacote === nomePacote);
		itensPacoteModal = filtrados.map((item, idx) => ({
			id: `pkg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
			nome: item.nome,
			pacote: item.pacote,
			unidade: item.unidade || '—',
			valoresReferencia: extrairReferenciaPorSexo(item.valoresReferencia, sexoBiologico),
			valor: '',
			dataColeta: dataColetaModal
		}));
	}

	function adicionarLinhaExtraModal() {
		itensPacoteModal = [
			...itensPacoteModal,
			{
				id: `pkg-extra-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
				nome: '',
				pacote: pacoteModalSelecionado || 'Outros Exames',
				unidade: '',
				valoresReferencia: '',
				valor: '',
				dataColeta: dataColetaModal
			}
		];
	}

	function removerLinhaModal(id: string) {
		itensPacoteModal = itensPacoteModal.filter((item) => item.id !== id);
	}

	function salvarPacoteModal() {
		const dataFinal = dataColetaModal || dataColetaPadrao || new Date().toISOString().split('T')[0];
		const validos = itensPacoteModal
			.filter((item) => item.nome.trim() !== '')
			.map((item) => ({
				id: 'lab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
				nome: item.nome.trim(),
				pacote: item.pacote.trim() || pacoteModalSelecionado || 'Outros Exames',
				unidade: item.unidade.trim() || '—',
				valoresReferencia: item.valoresReferencia.trim() || '—',
				valor: item.valor.trim(),
				dataColeta: dataFinal
			}));

		if (validos.length > 0) {
			exames = [...exames, ...validos];
			dataColetaPadrao = dataFinal;
		}
		fecharModalPacote();
	}

	// Computed suggestions
	let sugestoes = $derived.by(() => {
		const q = termoBusca.trim();
		if (!q) return [];
		const norm = q
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase();
		const startsWith: ExameCatalogoItem[] = [];
		const contains: ExameCatalogoItem[] = [];
		for (const item of catalogoDinamico) {
			const nomeNorm = item.nome
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			const pacNorm = item.pacote
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase();
			if (nomeNorm.startsWith(norm)) {
				startsWith.push(item);
			} else if (nomeNorm.includes(norm) || pacNorm.includes(norm)) {
				contains.push(item);
			}
		}
		return [...startsWith, ...contains].slice(0, 8);
	});

	// Nested grouping: Data → Pacote → Exames
	interface GrupoPacote {
		pacote: string;
		itens: ExameLaboratorialLancado[];
	}

	interface GrupoData {
		dataKey: string;
		dataFormatada: string;
		pacotes: GrupoPacote[];
		totalItens: number;
	}

	let examesAgrupadosPorDataEPacote = $derived.by(() => {
		const mapaData: Record<string, Record<string, ExameLaboratorialLancado[]>> = {};

		for (const ex of exames) {
			const dKey = ex.dataColeta ? ex.dataColeta.trim() : 'sem-data';
			const pkg = ex.pacote ? ex.pacote.trim() : 'Outros Exames';

			if (!mapaData[dKey]) mapaData[dKey] = {};
			if (!mapaData[dKey][pkg]) mapaData[dKey][pkg] = [];
			mapaData[dKey][pkg].push(ex);
		}

		// Sort dates descending (newest first, 'sem-data' at end)
		const sortedDateKeys = Object.keys(mapaData).sort((a, b) => {
			if (a === 'sem-data') return 1;
			if (b === 'sem-data') return -1;
			return b.localeCompare(a);
		});

		const resultado: GrupoData[] = [];

		for (const dKey of sortedDateKeys) {
			const pacotesMap = mapaData[dKey];
			const pacotes: GrupoPacote[] = [];
			let countData = 0;

			for (const [pkgNome, itens] of Object.entries(pacotesMap)) {
				pacotes.push({
					pacote: pkgNome,
					itens
				});
				countData += itens.length;
			}

			let dataFormatada = 'Data não especificada';
			if (dKey !== 'sem-data' && dKey.includes('-')) {
				const [ano, mes, dia] = dKey.split('-');
				dataFormatada = `${dia}/${mes}/${ano}`;
			}

			resultado.push({
				dataKey: dKey,
				dataFormatada,
				pacotes,
				totalItens: countData
			});
		}

		return resultado;
	});

	let totalExamesLancados = $derived(exames.length);

	export async function iniciarNovaLinha() {
		isAddingRow = true;
		termoBusca = '';
		exameSelecionado = null;
		valorDigitado = '';
		unidadeDigitada = '';
		refDigitada = '';
		pacoteDigitado = '';
		dataColetaLinha = dataColetaPadrao || new Date().toISOString().split('T')[0];
		sugestaoIndexAtiva = 0;
		isDropdownVisible = false;
		await tick();
		if (inputNomeRef) {
			inputNomeRef.focus();
		}
	}

	function selecionarSugestao(item: ExameCatalogoItem) {
		exameSelecionado = item;
		termoBusca = item.nome;
		pacoteDigitado = item.pacote;
		unidadeDigitada = item.unidade;
		refDigitada = extrairReferenciaPorSexo(item.valoresReferencia, sexoBiologico);
		isDropdownVisible = false;
		tick().then(() => {
			if (inputValorRef) {
				inputValorRef.focus();
			}
		});
	}

	function handleKeydownNome(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (sugestoes.length > 0) {
				sugestaoIndexAtiva = (sugestaoIndexAtiva + 1) % sugestoes.length;
			}
			return;
		}

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (sugestoes.length > 0) {
				sugestaoIndexAtiva = (sugestaoIndexAtiva - 1 + sugestoes.length) % sugestoes.length;
			}
			return;
		}

		if (e.key === 'Tab' || e.key === 'Enter') {
			if (sugestoes.length > 0) {
				e.preventDefault();
				const item = sugestoes[sugestaoIndexAtiva] || sugestoes[0];
				selecionarSugestao(item);
			} else if (termoBusca.trim()) {
				// Custom exam name
				e.preventDefault();
				exameSelecionado = {
					material: 'Outro',
					nome: termoBusca.trim(),
					pacote: pacoteDigitado || 'Outros Exames',
					unidade: unidadeDigitada || '—',
					valoresReferencia: refDigitada || '—'
				};
				pacoteDigitado = pacoteDigitado || 'Outros Exames';
				isDropdownVisible = false;
				tick().then(() => {
					if (inputValorRef) inputValorRef.focus();
				});
			}
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			isAddingRow = false;
			isDropdownVisible = false;
		}
	}

	function handleKeydownValor(e: KeyboardEvent) {
		if (e.key === 'Tab' || e.key === 'Enter') {
			e.preventDefault();
			confirmarEAvancar();
			return;
		}

		if (e.key === 'Escape') {
			e.preventDefault();
			isAddingRow = false;
		}
	}

	function confirmarEAvancar() {
		if (!exameSelecionado && !termoBusca.trim()) {
			isAddingRow = false;
			return;
		}

		const nomeFinal = exameSelecionado ? exameSelecionado.nome : termoBusca.trim();
		const pacoteFinal = pacoteDigitado || (exameSelecionado ? exameSelecionado.pacote : 'Outros Exames');
		const unidadeFinal = unidadeDigitada || (exameSelecionado ? exameSelecionado.unidade : '—');
		const refFinal = refDigitada || (exameSelecionado ? extrairReferenciaPorSexo(exameSelecionado.valoresReferencia, sexoBiologico) : '—');
		const dataFinal = dataColetaLinha || dataColetaPadrao || '';

		if (nomeFinal) {
			const novoItem: ExameLaboratorialLancado = {
				id: 'lab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
				nome: nomeFinal,
				pacote: pacoteFinal,
				unidade: unidadeFinal,
				valoresReferencia: refFinal,
				valor: valorDigitado.trim(),
				dataColeta: dataFinal
			};

			exames = [...exames, novoItem];
		}

		// Spawn new row immediately and focus on name input for seamless typing!
		iniciarNovaLinha();
	}

	function removerExame(id: string) {
		exames = exames.filter(e => e.id !== id);
	}
</script>

<div class="lab-section-wrapper">
	<!-- Top Action Bar -->
	<div class="lab-box-header">
		<div class="lab-box-title-wrap">
			<span class="lab-icon">🧪</span>
			<div>
				<div class="lab-title-row">
					<span class="lab-box-title">Exames Laboratoriais Estruturados</span>
					{#if sexoBiologico}
						<span class="gender-ref-badge" title="Valores de referência ajustados automaticamente para o sexo biológico do paciente">
							Ref: {sexoBiologico === 'M' ? 'M Masculino' : 'F Feminino'}
						</span>
					{/if}
				</div>
				<span class="lab-box-subtitle">Agrupados por Data da Coleta → Pacote com referências e unidades adaptáveis</span>
			</div>
		</div>

		<div class="lab-header-actions">
			<div class="coleta-date-wrap">
				<label for="data-coleta-lab" class="coleta-label">Data da Coleta:</label>
				<input
					id="data-coleta-lab"
					type="date"
					class="coleta-date-input"
					bind:value={dataColetaPadrao}
				/>
			</div>

			<button
				type="button"
				class="btn-add-pkg"
				onclick={abrirModalPacote}
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
					<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
					<line x1="12" y1="22.08" x2="12" y2="12"></line>
				</svg>
				<span>Adicionar Pacote</span>
			</button>

			<button
				type="button"
				class="btn-add-lab"
				onclick={iniciarNovaLinha}
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				<span>Adicionar Exame</span>
			</button>
		</div>
	</div>

	<!-- Interactive Input Bar: 2 Linhas estruturadas -->
	{#if isAddingRow}
		<div class="lab-draft-card fade-in">
			<!-- Header do Box de Inserção -->
			<div class="draft-card-header">
				<div class="draft-badge-row">
					<span class="draft-badge">⚡ Novo Exame</span>
					{#if sexoBiologico}
						<span class="draft-gender-pill">
							Ref: {sexoBiologico === 'M' ? 'M Homem' : 'F Mulher'}
						</span>
					{/if}
				</div>
				<div class="draft-header-right">
					<span class="draft-hint">Digite o exame → <strong>Tab</strong> (preenche dados e pula para o resultado) → Digite o valor → <strong>Tab</strong> (salva)</span>
					<button type="button" class="btn-cancel-draft" onclick={() => isAddingRow = false} title="Fechar inserção">✕</button>
				</div>
			</div>

			<!-- LINHA 1: Nome do Exame + Pacote + Unidade -->
			<div class="draft-line line-1">
				<!-- 1. Nome do Exame -->
				<div class="draft-field field-name">
					<label for="input-draft-nome" class="draft-label">
						1. Nome do Exame
						<span class="label-subhint">(digite e tecle Tab)</span>
					</label>
					<div class="autocomplete-container">
						<input
							id="input-draft-nome"
							bind:this={inputNomeRef}
							type="text"
							class="draft-input input-name"
							placeholder="Ex: Hemoglobina, Glicemia, Creatinina, TSH, Sódio..."
							bind:value={termoBusca}
							oninput={() => {
								isDropdownVisible = true;
								sugestaoIndexAtiva = 0;
								exameSelecionado = null;
							}}
							onfocus={() => {
								if (termoBusca.trim()) isDropdownVisible = true;
							}}
							onkeydown={handleKeydownNome}
						/>

						{#if isDropdownVisible && sugestoes.length > 0}
							<div class="suggestions-dropdown">
								{#each sugestoes as s, idx}
									<button
										type="button"
										class="suggestion-item"
										class:active={idx === sugestaoIndexAtiva}
										onmousedown={() => selecionarSugestao(s)}
									>
										<div class="sug-left">
											<span class="sug-name">{s.nome}</span>
											<span class="sug-pkg">{s.pacote} · {s.material}</span>
										</div>
										<div class="sug-right">
											<span class="sug-unit">{s.unidade}</span>
											<span class="sug-ref">
												Ref: {extrairReferenciaPorSexo(s.valoresReferencia, sexoBiologico)}
											</span>
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Pacote -->
				<div class="draft-field field-pkg">
					<label for="input-draft-pkg" class="draft-label">Pacote</label>
					<input
						id="input-draft-pkg"
						type="text"
						class="draft-input input-param"
						placeholder="Ex: Hemograma, Glicemia..."
						bind:value={pacoteDigitado}
					/>
				</div>

				<!-- Unidade -->
				<div class="draft-field field-unit">
					<label for="input-draft-unit" class="draft-label">Unidade</label>
					<input
						id="input-draft-unit"
						type="text"
						class="draft-input input-param unit-mono"
						placeholder="Ex: mg/dL, g/dL, %..."
						bind:value={unidadeDigitada}
					/>
				</div>
			</div>

			<!-- LINHA 2: Data + Valores de Referência + Resultado / Valor + Botão Salvar -->
			<div class="draft-line line-2">
				<!-- Data da Coleta -->
				<div class="draft-field field-date">
					<label for="input-draft-date" class="draft-label">Data</label>
					<input
						id="input-draft-date"
						type="date"
						class="draft-input input-date"
						bind:value={dataColetaLinha}
					/>
				</div>

				<!-- Valores de Referência -->
				<div class="draft-field field-ref">
					<label for="input-draft-ref" class="draft-label">
						Valores de Referência
						<span class="label-subhint">(laboratório)</span>
					</label>
					<input
						id="input-draft-ref"
						type="text"
						class="draft-input input-param ref-mono"
						placeholder="Ex: 70-99, 13.5-17.5..."
						bind:value={refDigitada}
					/>
				</div>

				<!-- 2. Resultado / Valor -->
				<div class="draft-field field-val">
					<label for="input-draft-valor" class="draft-label highlight-label">
						2. Resultado / Valor
					</label>
					<input
						id="input-draft-valor"
						bind:this={inputValorRef}
						type="text"
						class="draft-input input-valor"
						placeholder="Ex: 14.2"
						bind:value={valorDigitado}
						onkeydown={handleKeydownValor}
					/>
				</div>

				<!-- Botão Salvar -->
				<div class="draft-field field-btn">
					<button
						type="button"
						class="btn-confirm-row"
						onclick={confirmarEAvancar}
						title="Salvar exame e adicionar próximo (ou tecle Tab no resultado)"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>Salvar &amp; +</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Results List (Exibição Comprimida: Data → Pacote) -->
	{#if totalExamesLancados === 0 && !isAddingRow}
		<div class="lab-empty-state">
			<div class="lab-empty-icon">🧪</div>
			<h4>Nenhum exame laboratorial lançado</h4>
			<p>
				Clique em <strong>"Adicionar Pacote"</strong> para lançar um pacote completo em tabela ou em <strong>"Adicionar Exame"</strong> para lançamento individual.
			</p>
		</div>
	{:else}
		<div class="dates-hierarchy-container">
			{#each examesAgrupadosPorDataEPacote as gData (gData.dataKey)}
				<!-- Bloco por Data de Coleta (Comprimido) -->
				<div class="date-hierarchy-card fade-in">
					<div class="date-hierarchy-header">
						<div class="date-header-left">
							<span class="date-calendar-icon">📅</span>
							<span class="date-prefix">Coleta:</span>
							<h3 class="date-title">{gData.dataFormatada}</h3>
						</div>
						<span class="date-items-count">{gData.totalItens} {gData.totalItens === 1 ? 'exame' : 'exames'}</span>
					</div>

					<div class="date-packages-body">
						{#each gData.pacotes as gPkg (gPkg.pacote)}
							<!-- Sub-bloco por Pacote (Comprimido em Tabela Densa) -->
							<div class="package-card">
								<div class="package-header">
									<div class="package-title-wrap">
										<span class="package-dot"></span>
										<span class="package-badge">{gPkg.pacote}</span>
										<span class="package-count">({gPkg.itens.length})</span>
									</div>
								</div>

								<div class="package-table-wrapper">
									<table class="package-table">
										<thead>
											<tr>
												<th class="th-nome">Nome</th>
												<th class="th-pkg">Pacote</th>
												<th class="th-unidade">Unidade</th>
												<th class="th-ref">Valores de Referência</th>
												<th class="th-valor">Resultado</th>
												<th class="th-acoes"></th>
											</tr>
										</thead>
										<tbody>
											{#each gPkg.itens as ex (ex.id)}
												<tr class="lab-row">
													<td class="td-nome">
														<input
															type="text"
															class="inline-name-input"
															bind:value={ex.nome}
															title="Clique para editar o nome do exame"
															placeholder="Nome do exame"
														/>
													</td>
													<td class="td-pkg">
														<input
															type="text"
															class="inline-pkg-input"
															bind:value={ex.pacote}
															title="Clique para editar o pacote"
															placeholder="Pacote"
														/>
													</td>
													<td class="td-unidade">
														<input
															type="text"
															class="inline-unit-input"
															bind:value={ex.unidade}
															title="Clique para editar a unidade"
															placeholder="—"
														/>
													</td>
													<td class="td-ref">
														<input
															type="text"
															class="inline-ref-input"
															bind:value={ex.valoresReferencia}
															title="Clique para editar o valor de referência"
															placeholder="—"
														/>
													</td>
													<td class="td-valor">
														<input
															type="text"
															class="inline-val-input"
															bind:value={ex.valor}
															placeholder="—"
														/>
													</td>
													<td class="td-acoes">
														<button
															type="button"
															class="btn-delete-row"
															onclick={() => removerExame(ex.id)}
															title="Remover exame"
														>
															✕
														</button>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ═══════════════════════════════════════════════════════════════════
     POP-UP (MODAL): ADICIONAR PACOTE DE EXAMES LABORATORIAIS
     ═══════════════════════════════════════════════════════════════════ -->
{#if isPackageModalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="pkg-modal-backdrop" onclick={fecharModalPacote}>
		<div
			class="pkg-modal-dialog"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="pkg-modal-header">
				<div class="pkg-modal-title-wrap">
					<span class="pkg-modal-icon">📦</span>
					<div>
						<h3 class="pkg-modal-title">Adicionar Pacote de Exames</h3>
						<p class="pkg-modal-subtitle">
							Selecione o pacote e a data da coleta para editar e lançar os resultados em tabela.
						</p>
					</div>
				</div>
				<button
					type="button"
					class="pkg-modal-close"
					onclick={fecharModalPacote}
					aria-label="Fechar modal"
				>
					✕
				</button>
			</div>

			<div class="pkg-modal-body">
				<!-- Passo 1: Seleção do Pacote e Data -->
				<div class="pkg-selection-bar">
					<div class="pkg-select-field">
						<label for="pkg-modal-select" class="pkg-field-label">
							Pacote de Exames
						</label>
						<select
							id="pkg-modal-select"
							class="pkg-select-input"
							value={pacoteModalSelecionado}
							onchange={(e) => carregarExamesDoPacote(e.currentTarget.value)}
						>
							<option value="">Selecione um pacote...</option>
							{#each pacotesDisponiveis as pkg}
								<option value={pkg}>{pkg}</option>
							{/each}
						</select>
					</div>

					<div class="pkg-date-field">
						<label for="pkg-modal-date" class="pkg-field-label">
							Data da Coleta
						</label>
						<input
							id="pkg-modal-date"
							type="date"
							class="pkg-date-input"
							bind:value={dataColetaModal}
						/>
					</div>
				</div>

				<!-- Atalhos rápidos de pacotes -->
				<div class="pkg-quick-chips">
					{#each pacotesDisponiveis as pkg}
						<button
							type="button"
							class="pkg-chip-btn"
							class:active={pacoteModalSelecionado === pkg}
							onclick={() => carregarExamesDoPacote(pkg)}
						>
							{pkg}
						</button>
					{/each}
				</div>

				<!-- Passo 2: Tabela Editável com todos os exames do pacote -->
				{#if !pacoteModalSelecionado}
					<div class="pkg-empty-prompt">
						<p>Selecione um pacote acima para carregar os exames na tabela.</p>
					</div>
				{:else}
					<div class="pkg-table-container">
						<table class="pkg-modal-table">
							<thead>
								<tr>
									<th class="col-nome">Nome</th>
									<th class="col-pacote">Pacote</th>
									<th class="col-unidade">Unidade</th>
									<th class="col-ref">Valores de Referência</th>
									<th class="col-resultado">Resultado</th>
									<th class="col-del"></th>
								</tr>
							</thead>
							<tbody>
								{#each itensPacoteModal as item (item.id)}
									<tr>
										<td>
											<input
												type="text"
												class="pkg-cell-input font-semibold"
												bind:value={item.nome}
												placeholder="Nome do exame"
											/>
										</td>
										<td>
											<input
												type="text"
												class="pkg-cell-input"
												bind:value={item.pacote}
												placeholder="Pacote"
											/>
										</td>
										<td>
											<input
												type="text"
												class="pkg-cell-input mono-cell"
												bind:value={item.unidade}
												placeholder="Unidade"
											/>
										</td>
										<td>
											<input
												type="text"
												class="pkg-cell-input mono-cell"
												bind:value={item.valoresReferencia}
												placeholder="Referência"
											/>
										</td>
										<td>
											<input
												type="text"
												class="pkg-cell-input result-cell"
												bind:value={item.valor}
												placeholder="Resultado..."
											/>
										</td>
										<td class="cell-del">
											<button
												type="button"
												class="btn-del-pkg-row"
												onclick={() => removerLinhaModal(item.id)}
												title="Remover exame do pacote"
											>
												✕
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="pkg-table-actions">
						<button
							type="button"
							class="btn-add-extra-row"
							onclick={adicionarLinhaExtraModal}
						>
							+ Adicionar linha ao pacote
						</button>
					</div>
				{/if}
			</div>

			<div class="pkg-modal-footer">
				<button
					type="button"
					class="btn-pkg-cancel"
					onclick={fecharModalPacote}
				>
					Cancelar
				</button>
				<button
					type="button"
					class="btn-pkg-confirm"
					disabled={!pacoteModalSelecionado || itensPacoteModal.length === 0}
					onclick={salvarPacoteModal}
				>
					Salvar Pacote ({itensPacoteModal.length} {itensPacoteModal.length === 1 ? 'exame' : 'exames'})
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.lab-section-wrapper {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.lab-box-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #f8fafc;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		gap: 12px;
		flex-wrap: wrap;
	}

	.lab-box-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.lab-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.lab-icon {
		font-size: 20px;
	}

	.lab-box-title {
		font-size: 13.5px;
		font-weight: 700;
		color: #0f172a;
		display: block;
	}

	.gender-ref-badge {
		font-size: 10.5px;
		font-weight: 700;
		color: #0369a1;
		background: #e0f2fe;
		border: 1px solid #bae6fd;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.lab-box-subtitle {
		font-size: 11.5px;
		color: #64748b;
		display: block;
	}

	.lab-header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.coleta-date-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.coleta-label {
		font-size: 11.5px;
		font-weight: 600;
		color: #475569;
	}

	.coleta-date-input {
		height: 32px;
		padding: 3px 6px;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		background: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: #0f172a;
	}

	.btn-add-pkg {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid #15803d;
		background: #15803d;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-pkg:hover {
		background: #166534;
		border-color: #166534;
	}

	.btn-add-lab {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid #a7f3d0;
		background: #ecfdf5;
		color: #059669;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-add-lab:hover {
		background: #059669;
		color: #ffffff;
		border-color: #059669;
	}

	/* ── Box de Inserção Estruturado ── */
	.lab-draft-card {
		background: #ffffff;
		border: 2px solid #059669;
		border-radius: var(--radius-md);
		padding: 12px 14px;
		box-shadow: 0 4px 14px rgba(5, 150, 105, 0.12);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.draft-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
		padding-bottom: 6px;
		border-bottom: 1px solid #f1f5f9;
	}

	.draft-badge-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.draft-badge {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 11.5px;
		font-weight: 700;
		color: #059669;
		background: #ecfdf5;
		padding: 2px 7px;
		border-radius: 4px;
		border: 1px solid #a7f3d0;
	}

	.draft-gender-pill {
		font-size: 10.5px;
		font-weight: 600;
		color: #0369a1;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		padding: 2px 5px;
		border-radius: 4px;
	}

	.draft-header-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.draft-hint {
		font-size: 11px;
		color: #64748b;
	}

	.btn-cancel-draft {
		width: 22px;
		height: 22px;
		border-radius: 4px;
		border: 1px solid #e2e8f0;
		background: #f8fafc;
		color: #64748b;
		cursor: pointer;
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-cancel-draft:hover {
		background: #fee2e2;
		color: #dc2626;
	}

	.draft-line.line-1 {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 10px;
		align-items: end;
	}

	.draft-line.line-2 {
		display: grid;
		grid-template-columns: 125px 2fr 1.2fr auto;
		gap: 10px;
		align-items: end;
		background: #f8fafc;
		padding: 8px 10px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}

	.draft-field {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.draft-label {
		font-size: 11px;
		font-weight: 700;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.highlight-label {
		color: #0284c7;
	}

	.label-subhint {
		font-size: 10px;
		font-weight: 400;
		color: #94a3b8;
	}

	.draft-input {
		height: 36px;
		padding: 5px 8px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		color: #0f172a;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.draft-input:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
	}

	.input-name {
		font-weight: 600;
	}

	.input-date {
		font-size: 12px;
	}

	.input-valor {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 700;
		font-size: 13.5px;
		color: #0369a1;
		background: #ffffff;
		border-color: #7dd3fc;
	}

	.input-valor:focus {
		border-color: #0284c7;
		box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
	}

	.unit-mono, .ref-mono {
		font-family: 'IBM Plex Mono', monospace;
	}

	.btn-confirm-row {
		height: 36px;
		padding: 0 16px;
		border-radius: 6px;
		border: none;
		background: #059669;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		gap: 6px;
		justify-content: center;
		white-space: nowrap;
	}

	.btn-confirm-row:hover {
		background: #047857;
	}

	/* Autocomplete dropdown */
	.autocomplete-container {
		position: relative;
		width: 100%;
	}

	.suggestions-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 200;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
		max-height: 250px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.suggestion-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 7px 10px;
		border: none;
		background: #ffffff;
		border-bottom: 1px solid #f1f5f9;
		cursor: pointer;
		text-align: left;
		transition: background 0.12s ease;
		gap: 10px;
	}

	.suggestion-item:last-child {
		border-bottom: none;
	}

	.suggestion-item:hover,
	.suggestion-item.active {
		background: #ecfdf5;
	}

	.sug-left {
		display: flex;
		flex-direction: column;
	}

	.sug-name {
		font-size: 12.5px;
		font-weight: 700;
		color: #0f172a;
	}

	.sug-pkg {
		font-size: 10.5px;
		color: #64748b;
	}

	.sug-right {
		display: flex;
		flex-direction: column;
		text-align: right;
	}

	.sug-unit {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 700;
		color: #059669;
	}

	.sug-ref {
		font-size: 10px;
		color: #94a3b8;
	}

	/* ── Visualização Comprimida (Data → Pacote) ── */
	.dates-hierarchy-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.date-hierarchy-card {
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.date-hierarchy-header {
		padding: 8px 12px;
		background: #f1f5f9;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.date-header-left {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.date-calendar-icon {
		font-size: 14px;
	}

	.date-prefix {
		font-size: 11px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.date-title {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 13px;
		font-weight: 800;
		color: #0f172a;
		margin: 0;
	}

	.date-items-count {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 10.5px;
		font-weight: 700;
		color: #0369a1;
		background: #e0f2fe;
		padding: 1px 6px;
		border-radius: 9999px;
		border: 1px solid #bae6fd;
	}

	.date-packages-body {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: #fafbfc;
	}

	.package-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		overflow: hidden;
	}

	.package-header {
		padding: 5px 10px;
		background: #f8fafc;
		border-bottom: 1px solid #eef2f6;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.package-title-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.package-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #059669;
	}

	.package-badge {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 11.5px;
		font-weight: 700;
		color: #1e293b;
	}

	.package-count {
		font-size: 10.5px;
		color: #94a3b8;
	}

	.package-table-wrapper {
		overflow-x: auto;
	}

	.package-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}

	.package-table th {
		text-align: left;
		padding: 5px 10px;
		background: #fafbfc;
		font-size: 10px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		border-bottom: 1px solid #eef2f6;
	}

	.package-table td {
		padding: 4px 8px;
		border-bottom: 1px solid #f8fafc;
		vertical-align: middle;
	}

	.package-table tr:last-child td {
		border-bottom: none;
	}

	.package-table tr:hover td {
		background: #fafbfc;
	}

	.th-nome { width: 26%; }
	.th-pkg { width: 16%; }
	.th-unidade { width: 12%; }
	.th-ref { width: 26%; }
	.th-valor { width: 16%; }
	.th-acoes { width: 4%; text-align: right; }

	.inline-name-input,
	.inline-pkg-input {
		height: 24px;
		width: 100%;
		padding: 1px 6px;
		border: 1px solid transparent;
		border-radius: 4px;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: #0f172a;
		background: transparent;
		box-sizing: border-box;
		transition: all 0.12s ease;
	}

	.inline-name-input {
		font-weight: 600;
	}

	.inline-pkg-input {
		font-size: 11px;
		color: #475569;
	}

	.inline-name-input:hover,
	.inline-pkg-input:hover {
		border-color: #e2e8f0;
		background: #f8fafc;
	}

	.inline-name-input:focus,
	.inline-pkg-input:focus {
		outline: none;
		border-color: #059669;
		background: #ffffff;
	}

	.inline-val-input {
		height: 26px;
		width: 100%;
		max-width: 120px;
		padding: 2px 6px;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: #0369a1;
		background: #ffffff;
		box-sizing: border-box;
		transition: all 0.12s ease;
	}

	.inline-val-input:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.15);
	}

	.inline-unit-input {
		height: 24px;
		width: 100%;
		max-width: 90px;
		padding: 1px 5px;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		color: #475569;
		background: #f8fafc;
		box-sizing: border-box;
		transition: all 0.12s ease;
	}

	.inline-unit-input:focus {
		outline: none;
		border-color: #059669;
		background: #ffffff;
	}

	.inline-ref-input {
		height: 24px;
		width: 100%;
		padding: 1px 5px;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		color: #334155;
		background: #f8fafc;
		box-sizing: border-box;
		transition: all 0.12s ease;
	}

	.inline-ref-input:focus {
		outline: none;
		border-color: #059669;
		background: #ffffff;
	}

	.td-acoes {
		text-align: right;
	}

	.btn-delete-row {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid #fee2e2;
		background: #fff5f5;
		color: #ef4444;
		cursor: pointer;
		font-size: 9px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: all 0.12s ease;
	}

	.btn-delete-row:hover {
		background: #ef4444;
		color: #ffffff;
		border-color: #ef4444;
	}

	/* Empty state */
	.lab-empty-state {
		padding: 28px 16px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
	}

	.lab-empty-icon {
		font-size: 28px;
		margin-bottom: 6px;
	}

	.lab-empty-state h4 {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 13.5px;
		font-weight: 700;
		color: var(--text-main);
		margin: 0 0 3px;
	}

	.lab-empty-state p {
		font-size: 12px;
		color: var(--text-muted);
		max-width: 480px;
		margin: 0;
		line-height: 1.4;
	}

	/* ═════════════════════════════════════════════════════════
	   ESTILOS DO POP-UP (MODAL) ADICIONAR PACOTE
	   ═════════════════════════════════════════════════════════ */
	.pkg-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1200;
		background: rgba(15, 23, 42, 0.55);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.pkg-modal-dialog {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 14px;
		width: 100%;
		max-width: 960px;
		max-height: 88vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
		overflow: hidden;
	}

	.pkg-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.pkg-modal-title-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.pkg-modal-icon {
		font-size: 22px;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pkg-modal-title {
		margin: 0;
		font-size: 16px;
		font-weight: 800;
		color: #0f172a;
	}

	.pkg-modal-subtitle {
		margin: 2px 0 0;
		font-size: 12px;
		color: #64748b;
	}

	.pkg-modal-close {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #475569;
		font-size: 14px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pkg-modal-close:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.pkg-modal-body {
		padding: 18px 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 14px;
		flex: 1;
	}

	.pkg-selection-bar {
		display: grid;
		grid-template-columns: 1fr 200px;
		gap: 14px;
		background: #f8fafc;
		padding: 12px 14px;
		border-radius: 10px;
		border: 1px solid #e2e8f0;
	}

	.pkg-select-field,
	.pkg-date-field {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.pkg-field-label {
		font-size: 11.5px;
		font-weight: 700;
		color: #1e293b;
	}

	.pkg-select-input,
	.pkg-date-input {
		height: 38px;
		padding: 0 10px;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
	}

	.pkg-select-input:focus,
	.pkg-date-input:focus {
		outline: none;
		border-color: #15803d;
		box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.15);
	}

	.pkg-quick-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.pkg-chip-btn {
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid #e2e8f0;
		background: #ffffff;
		color: #334155;
		font-size: 11.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.pkg-chip-btn:hover {
		border-color: #86efac;
		background: #f0fdf4;
		color: #166534;
	}

	.pkg-chip-btn.active {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
	}

	.pkg-empty-prompt {
		padding: 36px 20px;
		text-align: center;
		border: 1px dashed #cbd5e1;
		border-radius: 10px;
		color: #64748b;
		font-size: 13px;
	}

	.pkg-table-container {
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		overflow-x: auto;
	}

	.pkg-modal-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12.5px;
	}

	.pkg-modal-table th {
		background: #f1f5f9;
		color: #334155;
		font-size: 11px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		text-align: left;
		padding: 9px 10px;
		border-bottom: 1px solid #e2e8f0;
	}

	.pkg-modal-table td {
		padding: 6px 8px;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}

	.pkg-modal-table tr:last-child td {
		border-bottom: none;
	}

	.col-nome { width: 25%; }
	.col-pacote { width: 17%; }
	.col-unidade { width: 13%; }
	.col-ref { width: 24%; }
	.col-resultado { width: 17%; }
	.col-del { width: 4%; }

	.pkg-cell-input {
		width: 100%;
		height: 32px;
		padding: 4px 8px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-size: 12.5px;
		color: #0f172a;
		background: #ffffff;
		box-sizing: border-box;
	}

	.pkg-cell-input:focus {
		outline: none;
		border-color: #15803d;
		box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.14);
	}

	.pkg-cell-input.font-semibold {
		font-weight: 600;
	}

	.pkg-cell-input.mono-cell {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11.5px;
	}

	.pkg-cell-input.result-cell {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 700;
		border-color: #86efac;
		background: #f0fdf4;
		color: #14532d;
	}

	.pkg-cell-input.result-cell:focus {
		background: #ffffff;
		border-color: #15803d;
	}

	.cell-del {
		text-align: center;
	}

	.btn-del-pkg-row {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 1px solid #fee2e2;
		background: #fff5f5;
		color: #dc2626;
		font-size: 11px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn-del-pkg-row:hover {
		background: #dc2626;
		color: #ffffff;
	}

	.pkg-table-actions {
		display: flex;
		justify-content: flex-start;
	}

	.btn-add-extra-row {
		padding: 6px 12px;
		border-radius: 7px;
		border: 1px dashed #94a3b8;
		background: #f8fafc;
		color: #334155;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-add-extra-row:hover {
		border-color: #15803d;
		color: #15803d;
		background: #f0fdf4;
	}

	.pkg-modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.btn-pkg-cancel {
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		color: #334155;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-pkg-cancel:hover {
		background: #f1f5f9;
	}

	.btn-pkg-confirm {
		padding: 8px 18px;
		border-radius: 8px;
		border: 1px solid #15803d;
		background: #15803d;
		color: #ffffff;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-pkg-confirm:hover:not(:disabled) {
		background: #166534;
	}

	.btn-pkg-confirm:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.fade-in {
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-3px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 768px) {
		.draft-line.line-1 {
			grid-template-columns: 1fr;
		}
		.draft-line.line-2 {
			grid-template-columns: 1fr 1fr;
		}
		.field-ref {
			grid-column: span 2;
		}
		.pkg-selection-bar {
			grid-template-columns: 1fr;
		}
	}
</style>
