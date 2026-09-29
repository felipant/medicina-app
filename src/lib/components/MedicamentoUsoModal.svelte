<script lang="ts">
	export interface MedicamentoEmUso {
		id: string;
		principioAtivo: string;
		concentracao: string;
		formaFarmaceutica: string;
		classeFarmaceutica: string;
		tipoPosologia: 'xyz' | 'predefinido' | 'outro';
		horarioX?: number | string;
		horarioY?: number | string;
		horarioZ?: number | string;
		posologiaTexto: string;
		observacoes?: string;
	}

	let {
		open = $bindable(false),
		onsave,
		onclose
	}: {
		open: boolean;
		onsave?: (med: MedicamentoEmUso) => void;
		onclose?: () => void;
	} = $props();

	// Modal State
	let buscaQuery = $state('');
	let resultadosBusca = $state<any[]>([]);
	let isBuscando = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Form fields
	let principioAtivo = $state('');
	let concentracao = $state('');
	let formaFarmaceutica = $state('Comprimido');
	let classeFarmaceutica = $state('Anti-hipertensivos');
	let classePersonalizada = $state('');

	// Posologia Mode
	let modoPosologia = $state<'xyz' | 'predefinido' | 'outro'>('xyz');
	let doseManha = $state<number | string>(1);
	let doseTarde = $state<number | string>(0);
	let doseNoite = $state<number | string>(0);
	let intervaloPredefinido = $state('1x ao dia');
	let posologiaPersonalizada = $state('');
	let observacoes = $state('');

	const CLASSES_COMUNS = [
		'Anti-hipertensivos',
		'Antidiabéticos / Hipoglicemiantes',
		'Hipolipemiantes / Estatinas',
		'Analgésicos / Anti-inflamatórios (AINEs)',
		'Psicotrópicos / Antidepressivos / Ansiolíticos',
		'Protetores Gástricos / IBP',
		'Anticoagulantes / Antiagregantes',
		'Hormônios / Tireoide',
		'Broncodilatadores / Respiratórios',
		'Antibióticos / Antimicrobianos',
		'Antialérgicos / Anti-histamínicos',
		'Suplementos / Vitaminas',
		'Outra classe...'
	];

	const FORMAS_COMUNS = [
		'Comprimido',
		'Comprimido revestido',
		'Cápsula',
		'Gotas / Solução oral',
		'Xarope',
		'Injetável',
		'Creme',
		'Pomada',
		'Gel',
		'Spray / Inalatório',
		'Adesivo transdérmico',
		'Outra...'
	];

	const INTERVALOS_PREDEFINIDOS = [
		'1x ao dia',
		'12/12h',
		'8/8h',
		'6/6h',
		'1x por semana',
		'Uso contínuo (SOS / Se dor)'
	];

	// Search API
	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		buscaQuery = val;
		if (debounceTimer) clearTimeout(debounceTimer);

		if (val.trim().length < 2) {
			resultadosBusca = [];
			isBuscando = false;
			return;
		}

		isBuscando = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/medicamentos?q=${encodeURIComponent(val.trim())}`);
				if (res.ok) {
					const data = (await res.json()) as { medicamentos?: any[]; principios_ativos?: any[] };
					resultadosBusca = data.medicamentos || [];
				}
			} catch (err) {
				console.error('Erro na busca de medicamentos:', err);
			} finally {
				isBuscando = false;
			}
		}, 220);
	}

	function selecionarMedicamento(item: any) {
		principioAtivo = item.principio_ativo || '';
		concentracao = item.concentracao || '';
		if (item.forma_farmaceutica) {
			const formaMatch = FORMAS_COMUNS.find(f => f.toLowerCase().includes(item.forma_farmaceutica.toLowerCase()));
			formaFarmaceutica = formaMatch || item.forma_farmaceutica;
		}
		if (item.classe_terapeutica) {
			const classeMatch = CLASSES_COMUNS.find(c => c.toLowerCase().includes(item.classe_terapeutica.toLowerCase()));
			if (classeMatch) {
				classeFarmaceutica = classeMatch;
			} else {
				classeFarmaceutica = 'Outra classe...';
				classePersonalizada = item.classe_terapeutica;
			}
		}
		buscaQuery = '';
		resultadosBusca = [];
	}

	// Posologia Formatted String
	let posologiaFormatada = $derived.by(() => {
		if (modoPosologia === 'xyz') {
			const m = doseManha === '' ? 0 : doseManha;
			const t = doseTarde === '' ? 0 : doseTarde;
			const n = doseNoite === '' ? 0 : doseNoite;
			return `(${m}, ${t}, ${n})`;
		}
		if (modoPosologia === 'predefinido') {
			return intervaloPredefinido;
		}
		return posologiaPersonalizada.trim() || 'Posologia a definir';
	});

	let classeFinal = $derived.by(() => {
		if (classeFarmaceutica === 'Outra classe...') {
			return classePersonalizada.trim() || 'Outros / Não classificado';
		}
		return classeFarmaceutica;
	});

	function handleSalvar() {
		if (!principioAtivo.trim()) {
			alert('Por favor, informe o princípio ativo do medicamento.');
			return;
		}

		const novoMed: MedicamentoEmUso = {
			id: 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
			principioAtivo: principioAtivo.trim(),
			concentracao: concentracao.trim(),
			formaFarmaceutica: formaFarmaceutica,
			classeFarmaceutica: classeFinal,
			tipoPosologia: modoPosologia,
			horarioX: doseManha,
			horarioY: doseTarde,
			horarioZ: doseNoite,
			posologiaTexto: posologiaFormatada,
			observacoes: observacoes.trim()
		};

		if (onsave) onsave(novoMed);
		fecharModal();
	}

	function fecharModal() {
		open = false;
		if (onclose) onclose();
		// Reset form
		buscaQuery = '';
		resultadosBusca = [];
		principioAtivo = '';
		concentracao = '';
		formaFarmaceutica = 'Comprimido';
		classeFarmaceutica = 'Anti-hipertensivos';
		classePersonalizada = '';
		modoPosologia = 'xyz';
		doseManha = 1;
		doseTarde = 0;
		doseNoite = 0;
		intervaloPredefinido = '1x ao dia';
		posologiaPersonalizada = '';
		observacoes = '';
	}
</script>

{#if open}
	<!-- Modal Backdrop -->
	<div
		class="modal-backdrop fade-in"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) fecharModal(); }}
		onkeydown={(e) => { if (e.key === 'Escape') fecharModal(); }}
	>
		<div class="modal-card">
			<!-- Modal Header -->
			<div class="modal-header">
				<div class="modal-title-wrap">
					<div class="modal-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
							<path d="m8.5 8.5 7 7"></path>
						</svg>
					</div>
					<div>
						<h2 class="modal-title">Adicionar Medicamento em Uso</h2>
						<p class="modal-subtitle">Preencha o princípio ativo, posologia e classe terapêutica</p>
					</div>
				</div>
				<button type="button" class="btn-close" onclick={fecharModal} title="Fechar">✕</button>
			</div>

			<!-- Modal Body -->
			<div class="modal-body">
				<!-- Search Section -->
				<div class="search-box-wrap">
					<label for="modal-busca-med" class="form-label">
						Buscar princípio ativo / medicamento
						<span class="label-hint">(digite para buscar no catálogo)</span>
					</label>
					<div class="search-input-group">
						<input
							id="modal-busca-med"
							type="text"
							class="form-control search-input"
							placeholder="Ex: Losartana, Metformina, Hidroclorotiazida..."
							value={buscaQuery}
							oninput={handleSearchInput}
						/>
						{#if isBuscando}
							<div class="search-spinner"></div>
						{/if}
					</div>

					<!-- Search Results Dropdown -->
					{#if resultadosBusca.length > 0}
						<div class="search-dropdown fade-in">
							<div class="search-dropdown-header">Resultados encontrados ({resultadosBusca.length}):</div>
							<div class="search-dropdown-list">
								{#each resultadosBusca as r}
									<button
										type="button"
										class="search-item-btn"
										onclick={() => selecionarMedicamento(r)}
									>
										<div class="search-item-main">
											<span class="item-name">{r.principio_ativo}</span>
											{#if r.concentracao}
												<span class="item-conc">{r.concentracao}</span>
											{/if}
										</div>
										<div class="search-item-sub">
											<span class="item-forma">{r.forma_farmaceutica || 'Forma não esp.'}</span>
											{#if r.classe_terapeutica}
												<span class="item-classe">{r.classe_terapeutica}</span>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="form-divider">
					<span>Ou preencha / ajuste os dados abaixo</span>
				</div>

				<!-- Form Inputs Grid -->
				<div class="form-grid">
					<!-- Princípio Ativo -->
					<div class="form-group span-2">
						<label for="modal-pa" class="form-label required">Princípio Ativo / Nome do Medicamento</label>
						<input
							id="modal-pa"
							type="text"
							class="form-control"
							placeholder="Ex: Losartana Potássica"
							bind:value={principioAtivo}
						/>
					</div>

					<!-- Dose / Concentração -->
					<div class="form-group">
						<label for="modal-conc" class="form-label">Dose / Concentração</label>
						<input
							id="modal-conc"
							type="text"
							class="form-control"
							placeholder="Ex: 50 mg, 850 mg, 20 mg/mL"
							bind:value={concentracao}
						/>
					</div>

					<!-- Forma Farmacêutica -->
					<div class="form-group">
						<label for="modal-forma" class="form-label">Forma Farmacêutica</label>
						<select id="modal-forma" class="form-select" bind:value={formaFarmaceutica}>
							{#each FORMAS_COMUNS as f}
								<option value={f}>{f}</option>
							{/each}
						</select>
					</div>

					<!-- Classe Farmacêutica (Agrupamento) -->
					<div class="form-group span-2">
						<label for="modal-classe" class="form-label required">
							Classe Farmacêutica / Terapêutica
							<span class="label-hint">(define o agrupamento visual)</span>
						</label>
						<select id="modal-classe" class="form-select" bind:value={classeFarmaceutica}>
							{#each CLASSES_COMUNS as c}
								<option value={c}>{c}</option>
							{/each}
						</select>
						{#if classeFarmaceutica === 'Outra classe...'}
							<input
								type="text"
								class="form-control sub-input"
								placeholder="Digite a classe farmacêutica personalizada..."
								bind:value={classePersonalizada}
							/>
						{/if}
					</div>

					<!-- Horário de Uso / Posologia (SELETOR DE FORMATO) -->
					<div class="form-group span-2 posologia-section">
						<span class="form-label required">Horário de Uso / Posologia</span>

						<!-- Posologia Mode Tabs -->
						<div class="posologia-tabs">
							<button
								type="button"
								class="posologia-tab-btn"
								class:active={modoPosologia === 'xyz'}
								onclick={() => modoPosologia = 'xyz'}
							>
								<strong>Formato (x, y, z)</strong>
								<small>Manhã / Tarde / Noite</small>
							</button>

							<button
								type="button"
								class="posologia-tab-btn"
								class:active={modoPosologia === 'predefinido'}
								onclick={() => modoPosologia = 'predefinido'}
							>
								<strong>Intervalo Fixo</strong>
								<small>6/6h, 8/8h, 12/12h, 1x/dia...</small>
							</button>

							<button
								type="button"
								class="posologia-tab-btn"
								class:active={modoPosologia === 'outro'}
								onclick={() => modoPosologia = 'outro'}
							>
								<strong>Personalizado</strong>
								<small>Texto livre</small>
							</button>
						</div>

						<!-- Posologia Input Controls based on Mode -->
						<div class="posologia-content-card">
							{#if modoPosologia === 'xyz'}
								<div class="xyz-container">
									<p class="xyz-hint">Informe o número de comprimidos ou dose para cada período:</p>
									<div class="xyz-grid">
										<div class="xyz-box">
											<div class="xyz-label">
												<span class="period-icon">🌅</span>
												<span>Manhã (x)</span>
											</div>
											<input
												type="number"
												step="0.5"
												min="0"
												max="20"
												class="xyz-input"
												bind:value={doseManha}
											/>
										</div>

										<div class="xyz-box">
											<div class="xyz-label">
												<span class="period-icon">☀️</span>
												<span>Tarde (y)</span>
											</div>
											<input
												type="number"
												step="0.5"
												min="0"
												max="20"
												class="xyz-input"
												bind:value={doseTarde}
											/>
										</div>

										<div class="xyz-box">
											<div class="xyz-label">
												<span class="period-icon">🌙</span>
												<span>Noite (z)</span>
											</div>
											<input
												type="number"
												step="0.5"
												min="0"
												max="20"
												class="xyz-input"
												bind:value={doseNoite}
											/>
										</div>
									</div>

									<div class="xyz-result-badge">
										<span>Representação gerada:</span>
										<strong>{posologiaFormatada}</strong>
									</div>
								</div>
							{/if}

							{#if modoPosologia === 'predefinido'}
								<div class="chips-grid">
									{#each INTERVALOS_PREDEFINIDOS as ip}
										<button
											type="button"
											class="chip-btn"
											class:selected={intervaloPredefinido === ip}
											onclick={() => intervaloPredefinido = ip}
										>
											{ip}
										</button>
									{/each}
								</div>
							{/if}

							{#if modoPosologia === 'outro'}
								<input
									type="text"
									class="form-control"
									placeholder="Ex: 1 comprimido em dias alternados pela manhã, Em jejum..."
									bind:value={posologiaPersonalizada}
								/>
							{/if}
						</div>
					</div>

					<!-- Observações adicionais -->
					<div class="form-group span-2">
						<label for="modal-obs" class="form-label">Observações adicionais (opcional)</label>
						<input
							id="modal-obs"
							type="text"
							class="form-control"
							placeholder="Ex: Refere boa adesão, Tomar após o almoço..."
							bind:value={observacoes}
						/>
					</div>
				</div>

				<!-- Live Preview Box -->
				{#if principioAtivo.trim()}
					<div class="preview-box">
						<span class="preview-label">Prévia do registro:</span>
						<div class="preview-text">
							<strong>{principioAtivo}</strong>
							{#if concentracao.trim()}<span>{concentracao}</span>{/if}
							— <span class="preview-forma">{formaFarmaceutica}</span>
							— <span class="preview-pos">{posologiaFormatada}</span>
							<span class="preview-classe">[{classeFinal}]</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Modal Footer -->
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick={fecharModal}>Cancelar</button>
				<button type="button" class="btn-save" onclick={handleSalvar}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Adicionar Medicamento</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(15, 23, 42, 0.65);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		box-sizing: border-box;
	}

	.modal-card {
		background: #ffffff;
		border-radius: 16px;
		max-width: 620px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.modal-header {
		padding: 18px 24px;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fafbfc;
	}

	.modal-title-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.modal-icon {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: #eff6ff;
		color: #2563eb;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.modal-title {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 2px;
	}

	.modal-subtitle {
		font-size: 12px;
		color: #64748b;
		margin: 0;
	}

	.btn-close {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		background: #ffffff;
		color: #64748b;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		transition: all 0.15s ease;
	}

	.btn-close:hover {
		background: #fee2e2;
		color: #dc2626;
		border-color: #fca5a5;
	}

	.modal-body {
		padding: 20px 24px;
		overflow-y: auto;
		flex: 1;
	}

	/* Search Box */
	.search-box-wrap {
		position: relative;
		margin-bottom: 16px;
	}

	.search-input-group {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.search-input:focus {
		background: #ffffff;
	}

	.search-spinner {
		position: absolute;
		right: 12px;
		width: 16px;
		height: 16px;
		border: 2px solid #e2e8f0;
		border-top-color: #2563eb;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.search-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 50;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 10px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		max-height: 220px;
		overflow-y: auto;
	}

	.search-dropdown-header {
		padding: 6px 12px;
		background: #f8fafc;
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		border-bottom: 1px solid #e2e8f0;
	}

	.search-dropdown-list {
		padding: 4px;
	}

	.search-item-btn {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.12s ease;
	}

	.search-item-btn:hover {
		background: #eff6ff;
	}

	.search-item-main {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.item-name {
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
	}

	.item-conc {
		font-size: 12px;
		font-weight: 600;
		color: #2563eb;
		background: #dbeafe;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.search-item-sub {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11.5px;
		color: #64748b;
	}

	.item-classe {
		color: #0f766e;
		background: #ccfbf1;
		padding: 0 5px;
		border-radius: 3px;
	}

	.form-divider {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 18px 0;
		color: #94a3b8;
		font-size: 11.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.form-divider::before, .form-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e2e8f0;
	}

	/* Form Grid */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group.span-2 {
		grid-column: 1 / -1;
	}

	.form-label {
		font-size: 12px;
		font-weight: 600;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.form-label.required::after {
		content: '*';
		color: #e11d48;
		font-weight: 700;
	}

	.label-hint {
		font-size: 11px;
		font-weight: 400;
		color: #94a3b8;
	}

	.form-control, .form-select {
		height: 38px;
		padding: 7px 11px;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: #0f172a;
		box-sizing: border-box;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.form-control:focus, .form-select:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.sub-input {
		margin-top: 6px;
	}

	/* Posologia Section */
	.posologia-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px;
		margin-bottom: 10px;
	}

	.posologia-tab-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 8px 6px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		background: #f8fafc;
		cursor: pointer;
		transition: all 0.15s ease;
		text-align: center;
	}

	.posologia-tab-btn:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.posologia-tab-btn.active {
		background: #eff6ff;
		border-color: #2563eb;
		box-shadow: 0 0 0 1px #2563eb;
	}

	.posologia-tab-btn strong {
		font-size: 12px;
		color: #0f172a;
	}

	.posologia-tab-btn.active strong {
		color: #2563eb;
	}

	.posologia-tab-btn small {
		font-size: 10px;
		color: #64748b;
	}

	.posologia-content-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 12px;
	}

	/* XYZ Container */
	.xyz-hint {
		font-size: 11.5px;
		color: #64748b;
		margin: 0 0 8px;
	}

	.xyz-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
		margin-bottom: 10px;
	}

	.xyz-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 8px;
	}

	.xyz-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11.5px;
		font-weight: 600;
		color: #334155;
		margin-bottom: 6px;
	}

	.xyz-input {
		width: 56px;
		height: 36px;
		text-align: center;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		background: #f8fafc;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.xyz-input:focus {
		outline: none;
		border-color: #2563eb;
		background: #ffffff;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
	}

	.xyz-result-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 12px;
		color: #334155;
		background: #ffffff;
		border: 1px dashed #93c5fd;
		padding: 5px 10px;
		border-radius: 6px;
	}

	.xyz-result-badge strong {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
		color: #2563eb;
		background: #dbeafe;
		padding: 1px 6px;
		border-radius: 4px;
	}

	/* Chips Grid */
	.chips-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip-btn {
		padding: 6px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 9999px;
		background: #ffffff;
		color: #334155;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.chip-btn:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.chip-btn.selected {
		background: #2563eb;
		color: #ffffff;
		border-color: #2563eb;
		font-weight: 600;
	}

	/* Preview Box */
	.preview-box {
		margin-top: 16px;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		padding: 10px 14px;
	}

	.preview-label {
		display: block;
		font-size: 11px;
		font-weight: 700;
		color: #1d4ed8;
		text-transform: uppercase;
		margin-bottom: 2px;
	}

	.preview-text {
		font-size: 13px;
		color: #1e3a8a;
		line-height: 1.4;
	}

	.preview-pos {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		background: #dbeafe;
		padding: 1px 5px;
		border-radius: 3px;
	}

	.preview-classe {
		font-size: 11.5px;
		color: #047857;
		font-weight: 600;
	}

	/* Modal Footer */
	.modal-footer {
		padding: 14px 24px;
		border-top: 1px solid #e2e8f0;
		background: #fafbfc;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
	}

	.btn-cancel {
		padding: 8px 16px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		background: #ffffff;
		color: #475569;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-cancel:hover {
		background: #f1f5f9;
		color: #0f172a;
	}

	.btn-save {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 18px;
		border: none;
		border-radius: 8px;
		background: #2563eb;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.btn-save:hover {
		background: #1d4ed8;
	}

	.fade-in {
		animation: fadeIn 0.18s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.98); }
		to { opacity: 1; transform: scale(1); }
	}

	@media (max-width: 600px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.posologia-tabs {
			grid-template-columns: 1fr;
		}
	}
</style>
