<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData, ActionData } from './$types';
	import type { MedicationAdminRecord } from '$lib/server/db';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchTerm = $state('');
	let classeFilter = $state('all');
	let formaFilter = $state('all');

	$effect(() => {
		if (data.initialQuery && !searchTerm) {
			searchTerm = data.initialQuery;
		}
	});

	let showCreateModal = $state(false);
	let editingMed = $state<MedicationAdminRecord | null>(null);
	let isSubmitting = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Form state for create/edit
	let formPrincipioAtivo = $state('');
	let formConcentracao = $state('');
	let formFormaFarmaceutica = $state('Comprimido');
	let formFormaCustom = $state('');
	let formViaAdministracao = $state('Oral');
	let formClasseTerapeutica = $state('Anti-hipertensivos');
	let formClasseCustom = $state('');
	let formClasseCodigo = $state('');

	const FORMAS_PADRAO = [
		'Comprimido',
		'Comprimido revestido',
		'Comprimido de liberação prolongada',
		'Cápsula',
		'Gotas / Solução oral',
		'Suspensão oral',
		'Xarope',
		'Injetável',
		'Creme',
		'Pomada',
		'Gel',
		'Spray / Inalatório',
		'Colírio / Solução oftálmica',
		'Adesivo transdérmico',
		'Outra...'
	];

	const VIAS_PADRAO = [
		'Oral',
		'Sublingual',
		'Inalatória',
		'Nasal',
		'Tópica / Dermatológica',
		'Subcutânea',
		'Intramuscular',
		'Intravenosa',
		'Oftálmica',
		'Otológica',
		'Retal / Vaginal'
	];

	const CLASSES_PADRAO = [
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
		'Corticosteroides',
		'Antifúngicos / Antiparasitários',
		'Outra classe...'
	];

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toastMessage = msg;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 3500);
	}

	function openCreateModal() {
		formPrincipioAtivo = '';
		formConcentracao = '';
		formFormaFarmaceutica = 'Comprimido';
		formFormaCustom = '';
		formViaAdministracao = 'Oral';
		formClasseTerapeutica = 'Anti-hipertensivos';
		formClasseCustom = '';
		formClasseCodigo = '';
		showCreateModal = true;
	}

	function openEditModal(med: MedicationAdminRecord) {
		formPrincipioAtivo = med.principioAtivo || '';
		formConcentracao = med.concentracao || '';

		const fMatch = FORMAS_PADRAO.find(
			(f) => f !== 'Outra...' && f.toLowerCase() === (med.formaFarmaceutica || '').toLowerCase()
		);
		if (fMatch) {
			formFormaFarmaceutica = fMatch;
			formFormaCustom = '';
		} else if (med.formaFarmaceutica) {
			formFormaFarmaceutica = 'Outra...';
			formFormaCustom = med.formaFarmaceutica;
		} else {
			formFormaFarmaceutica = 'Comprimido';
			formFormaCustom = '';
		}

		formViaAdministracao = med.viaAdministracao || 'Oral';

		const cMatch = CLASSES_PADRAO.find(
			(c) => c !== 'Outra classe...' && c.toLowerCase() === (med.classeTerapeutica || '').toLowerCase()
		);
		if (cMatch) {
			formClasseTerapeutica = cMatch;
			formClasseCustom = '';
		} else if (med.classeTerapeutica) {
			formClasseTerapeutica = 'Outra classe...';
			formClasseCustom = med.classeTerapeutica;
		} else {
			formClasseTerapeutica = 'Anti-hipertensivos';
			formClasseCustom = '';
		}

		formClasseCodigo = med.classeCodigo || '';
		editingMed = med;
	}

	let uniqueClasses = $derived(
		Array.from(new Set(data.medications.map((m) => m.classeTerapeutica).filter(Boolean))).sort()
	);

	let uniqueFormas = $derived(
		Array.from(new Set(data.medications.map((m) => m.formaFarmaceutica).filter(Boolean))).sort()
	);

	let filteredMedications = $derived(
		data.medications.filter((m) => {
			if (classeFilter !== 'all' && m.classeTerapeutica !== classeFilter) return false;
			if (formaFilter !== 'all' && m.formaFarmaceutica !== formaFilter) return false;

			if (!searchTerm.trim()) return true;
			const q = searchTerm.toLowerCase().trim();
			return (
				m.principioAtivo.toLowerCase().includes(q) ||
				m.concentracao.toLowerCase().includes(q) ||
				m.formaFarmaceutica.toLowerCase().includes(q) ||
				m.classeTerapeutica.toLowerCase().includes(q) ||
				m.classeCodigo.toLowerCase().includes(q)
			);
		})
	);

	function buscarNoServidor() {
		const q = searchTerm.trim();
		if (q) {
			goto(`/admin/medicamentos?q=${encodeURIComponent(q)}`);
		} else {
			goto('/admin/medicamentos');
		}
	}
</script>

<svelte:head>
	<title>Gestão de Medicamentos — Prontuário Médico</title>
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<div class="header-inner">
			<div class="brand-group">
				<a href="/" class="back-btn">← Voltar ao Hub</a>
				<div class="title-block">
					<span class="admin-badge">Gestão Clínica</span>
					<h1>Catálogo de Medicamentos</h1>
				</div>
			</div>

			<div class="user-info">
				<a href="/admin/unidades-saude" class="nav-link-btn">🏥 ESFs</a>
				<a href="/admin/exames-laboratoriais" class="nav-link-btn">🧪 Exames Lab</a>
				<a href="/admin/monitoramento" class="nav-link-btn">📊 Monitoramento</a>
				<span class="admin-name">{data.user.name || data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="btn-logout">Sair</button>
				</form>
			</div>
		</div>
	</header>

	{#if toastMessage}
		<div class="toast-banner" class:error={toastType === 'error'}>
			<span>{toastType === 'error' ? '⚠️' : '✅'} {toastMessage}</span>
		</div>
	{/if}

	{#if form?.message}
		<div class="error-banner">
			<span>⚠️ {form.message}</span>
		</div>
	{/if}

	<main class="admin-main">
		<!-- Metrics Summary -->
		<section class="metrics-grid">
			<div class="metric-card">
				<span class="metric-label">Total no Banco de Dados</span>
				<strong class="metric-value">{data.totalCount}</strong>
				<span class="metric-sub">Apresentações farmacêuticas</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Exibidos na Lista</span>
				<strong class="metric-value text-emerald">{filteredMedications.length}</strong>
				<span class="metric-sub">Disponíveis para prescrição e uso</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Classes Terapêuticas</span>
				<strong class="metric-value text-sky">{uniqueClasses.length}</strong>
				<span class="metric-sub">Agrupamentos farmacológicos</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Formas Farmacêuticas</span>
				<strong class="metric-value">{uniqueFormas.length}</strong>
				<span class="metric-sub">Comprimidos, cápsulas, injetáveis...</span>
			</div>
		</section>

		<!-- Action & Filter Bar -->
		<section class="table-section">
			<div class="table-header">
				<div>
					<h2>Medicamentos e Apresentações ({filteredMedications.length})</h2>
					<p class="table-subtitle">
						Adicione ou edite princípios ativos, concentrações, formas farmacêuticas e classes terapêuticas utilizados na Anamnese e Prescrição.
					</p>
				</div>

				<div class="controls-row">
					<div class="search-wrap">
						<input
							type="search"
							placeholder="Buscar princípio ativo, dose ou classe..."
							bind:value={searchTerm}
							onkeydown={(e) => {
								if (e.key === 'Enter') buscarNoServidor();
							}}
							class="search-input"
						/>
						<button type="button" class="btn-search-db" onclick={buscarNoServidor} title="Pesquisar em todo o banco">
							🔍 Buscar no BD
						</button>
					</div>

					<select bind:value={classeFilter} class="filter-select">
						<option value="all">Todas as classes</option>
						{#each uniqueClasses as cls}
							<option value={cls}>{cls}</option>
						{/each}
					</select>

					<select bind:value={formaFilter} class="filter-select">
						<option value="all">Todas as formas</option>
						{#each uniqueFormas as frm}
							<option value={frm}>{frm}</option>
						{/each}
					</select>

					<button type="button" class="btn-primary" onclick={openCreateModal}>
						+ Novo Medicamento
					</button>
				</div>
			</div>

			<div class="table-wrapper">
				<table class="units-table">
					<thead>
						<tr>
							<th>ID</th>
							<th>Princípio Ativo / Medicamento</th>
							<th>Dose / Concentração</th>
							<th>Forma Farmacêutica & Via</th>
							<th>Classe Terapêutica</th>
							<th>Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if filteredMedications.length === 0}
							<tr>
								<td colspan="6" class="empty-cell">
									Nenhum medicamento encontrado para os filtros informados. Clique em "🔍 Buscar no BD" para pesquisar em toda a base ou "+ Novo Medicamento" para cadastrar.
								</td>
							</tr>
						{:else}
							{#each filteredMedications as med (med.id)}
								<tr>
									<td class="id-col">#{med.id}</td>
									<td>
										<div class="unit-name-cell">
											<strong>{med.principioAtivo}</strong>
										</div>
									</td>
									<td>
										{#if med.concentracao}
											<span class="conc-badge">{med.concentracao}</span>
										{:else}
											<span class="sub-text">—</span>
										{/if}
									</td>
									<td>
										<div class="forma-cell">
											<span>{med.formaFarmaceutica || 'Não informada'}</span>
											{#if med.viaAdministracao}
												<span class="sub-text">Via: {med.viaAdministracao}</span>
											{/if}
										</div>
									</td>
									<td>
										<div class="classe-cell">
											<span class="neighborhood-badge">{med.classeTerapeutica || 'Sem classe'}</span>
											{#if med.classeCodigo}
												<span class="sub-text">Código: {med.classeCodigo}</span>
											{/if}
										</div>
									</td>
									<td>
										<div class="actions-cell">
											<button
												type="button"
												class="btn-action edit"
												onclick={() => openEditModal(med)}
											>
												✏️ Editar
											</button>

											<form
												method="POST"
												action="?/delete"
												use:enhance={({ cancel }) => {
													if (!confirm(`Tem certeza que deseja excluir "${med.principioAtivo} ${med.concentracao}"?`)) {
														cancel();
													}
													return async ({ result, update }) => {
														await update();
														if (result.type === 'success') {
															showToast('Medicamento removido com sucesso.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={med.id} />
												<button type="submit" class="btn-action delete" title="Excluir medicamento">
													🗑️
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</section>
	</main>
</div>

<!-- Modal: Create Medication -->
{#if showCreateModal}
	<div class="modal-backdrop" role="presentation" onclick={() => (showCreateModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-card" role="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Cadastrar Novo Medicamento</h3>
				<button type="button" class="close-btn" onclick={() => (showCreateModal = false)}>✕</button>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						await update();
						if (result.type === 'success') {
							showCreateModal = false;
							showToast('Medicamento cadastrado com sucesso!');
						}
					};
				}}
				class="modal-form"
			>
				<div class="form-grid">
					<div class="form-group full">
						<label for="create-pa">Princípio Ativo / Nome do Medicamento *</label>
						<input
							id="create-pa"
							type="text"
							name="principioAtivo"
							required
							bind:value={formPrincipioAtivo}
							placeholder="Ex: Losartana Potássica"
						/>
					</div>

					<div class="form-group">
						<label for="create-conc">Dose / Concentração</label>
						<input
							id="create-conc"
							type="text"
							name="concentracao"
							bind:value={formConcentracao}
							placeholder="Ex: 50 mg, 850 mg, 20 mg/mL"
						/>
					</div>

					<div class="form-group">
						<label for="create-via">Via de Administração</label>
						<select id="create-via" name="viaAdministracao" bind:value={formViaAdministracao}>
							{#each VIAS_PADRAO as via}
								<option value={via}>{via}</option>
							{/each}
						</select>
					</div>

					<div class="form-group full">
						<label for="create-forma-sel">Forma Farmacêutica</label>
						<select id="create-forma-sel" bind:value={formFormaFarmaceutica}>
							{#each FORMAS_PADRAO as f}
								<option value={f}>{f}</option>
							{/each}
						</select>
						{#if formFormaFarmaceutica === 'Outra...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formFormaCustom}
								placeholder="Digite a forma farmacêutica personalizada..."
							/>
						{/if}
						<input
							type="hidden"
							name="formaFarmaceutica"
							value={formFormaFarmaceutica === 'Outra...' ? formFormaCustom : formFormaFarmaceutica}
						/>
					</div>

					<div class="form-group full">
						<label for="create-classe-sel">Classe Terapêutica / Farmacológica *</label>
						<select id="create-classe-sel" bind:value={formClasseTerapeutica}>
							{#each CLASSES_PADRAO as c}
								<option value={c}>{c}</option>
							{/each}
						</select>
						{#if formClasseTerapeutica === 'Outra classe...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formClasseCustom}
								placeholder="Digite a classe terapêutica..."
							/>
						{/if}
						<input
							type="hidden"
							name="classeTerapeutica"
							value={formClasseTerapeutica === 'Outra classe...' ? formClasseCustom : formClasseTerapeutica}
						/>
					</div>

					<div class="form-group full">
						<label for="create-atc">Código ATC / Código da Classe (opcional)</label>
						<input
							id="create-atc"
							type="text"
							name="classeCodigo"
							bind:value={formClasseCodigo}
							placeholder="Ex: C09CA01 (gerado automaticamente se vazio)"
						/>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={() => (showCreateModal = false)}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar Medicamento'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Edit Medication -->
{#if editingMed}
	<div class="modal-backdrop" role="presentation" onclick={() => (editingMed = null)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-card" role="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Editar Medicamento #{editingMed.id}</h3>
				<button type="button" class="close-btn" onclick={() => (editingMed = null)}>✕</button>
			</div>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						await update();
						if (result.type === 'success') {
							editingMed = null;
							showToast('Medicamento atualizado com sucesso!');
						}
					};
				}}
				class="modal-form"
			>
				<input type="hidden" name="id" value={editingMed.id} />

				<div class="form-grid">
					<div class="form-group full">
						<label for="edit-pa">Princípio Ativo / Nome do Medicamento *</label>
						<input
							id="edit-pa"
							type="text"
							name="principioAtivo"
							required
							bind:value={formPrincipioAtivo}
						/>
					</div>

					<div class="form-group">
						<label for="edit-conc">Dose / Concentração</label>
						<input
							id="edit-conc"
							type="text"
							name="concentracao"
							bind:value={formConcentracao}
						/>
					</div>

					<div class="form-group">
						<label for="edit-via">Via de Administração</label>
						<select id="edit-via" name="viaAdministracao" bind:value={formViaAdministracao}>
							{#each VIAS_PADRAO as via}
								<option value={via}>{via}</option>
							{/each}
						</select>
					</div>

					<div class="form-group full">
						<label for="edit-forma-sel">Forma Farmacêutica</label>
						<select id="edit-forma-sel" bind:value={formFormaFarmaceutica}>
							{#each FORMAS_PADRAO as f}
								<option value={f}>{f}</option>
							{/each}
						</select>
						{#if formFormaFarmaceutica === 'Outra...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formFormaCustom}
								placeholder="Digite a forma farmacêutica personalizada..."
							/>
						{/if}
						<input
							type="hidden"
							name="formaFarmaceutica"
							value={formFormaFarmaceutica === 'Outra...' ? formFormaCustom : formFormaFarmaceutica}
						/>
					</div>

					<div class="form-group full">
						<label for="edit-classe-sel">Classe Terapêutica / Farmacológica *</label>
						<select id="edit-classe-sel" bind:value={formClasseTerapeutica}>
							{#each CLASSES_PADRAO as c}
								<option value={c}>{c}</option>
							{/each}
						</select>
						{#if formClasseTerapeutica === 'Outra classe...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formClasseCustom}
								placeholder="Digite a classe terapêutica..."
							/>
						{/if}
						<input
							type="hidden"
							name="classeTerapeutica"
							value={formClasseTerapeutica === 'Outra classe...' ? formClasseCustom : formClasseTerapeutica}
						/>
					</div>

					<div class="form-group full">
						<label for="edit-atc">Código ATC / Código da Classe</label>
						<input
							id="edit-atc"
							type="text"
							name="classeCodigo"
							bind:value={formClasseCodigo}
						/>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={() => (editingMed = null)}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.admin-shell {
		min-height: 100vh;
		background: #0f172a;
		color: #f8fafc;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	}

	.admin-header {
		background: rgba(30, 41, 59, 0.85);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		position: sticky;
		top: 0;
		z-index: 20;
	}

	.header-inner {
		max-width: 1320px;
		margin: 0 auto;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.brand-group {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.back-btn {
		color: #94a3b8;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.5rem 0.85rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.15s;
	}

	.back-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
	}

	.title-block h1 {
		margin: 0.15rem 0 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: #f8fafc;
	}

	.admin-badge {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #38bdf8;
		background: rgba(56, 189, 248, 0.12);
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.nav-link-btn {
		color: #cbd5e1;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.15s;
	}

	.nav-link-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: #fff;
	}

	.admin-name {
		font-size: 0.875rem;
		color: #cbd5e1;
	}

	.btn-logout {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
		border: 1px solid rgba(239, 68, 68, 0.3);
		padding: 0.45rem 0.9rem;
		border-radius: 0.5rem;
		font-size: 0.825rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-logout:hover {
		background: rgba(239, 68, 68, 0.25);
	}

	.toast-banner {
		max-width: 1320px;
		margin: 1rem auto 0;
		padding: 0.85rem 1.25rem;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.35);
		border-radius: 0.75rem;
		color: #6ee7b7;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.toast-banner.error,
	.error-banner {
		max-width: 1320px;
		margin: 1rem auto 0;
		padding: 0.85rem 1.25rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		border-radius: 0.75rem;
		color: #fca5a5;
		font-size: 0.9rem;
	}

	.admin-main {
		max-width: 1320px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1rem;
		padding: 1.35rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.metric-label {
		font-size: 0.8rem;
		color: #94a3b8;
		font-weight: 500;
	}

	.metric-value {
		font-size: 2rem;
		font-weight: 800;
		color: #f8fafc;
		letter-spacing: -0.02em;
	}

	.metric-value.text-emerald {
		color: #34d399;
	}

	.metric-value.text-sky {
		color: #38bdf8;
	}

	.metric-sub {
		font-size: 0.75rem;
		color: #64748b;
	}

	.table-section {
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 1rem;
		overflow: hidden;
	}

	.table-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.table-header h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		color: #f8fafc;
	}

	.table-subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.search-wrap {
		flex: 1;
		min-width: 280px;
		display: flex;
		gap: 0.5rem;
	}

	.search-input {
		flex: 1;
		padding: 0.65rem 1rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: #0f172a;
		color: #f8fafc;
		font-size: 0.875rem;
		outline: none;
	}

	.search-input:focus {
		border-color: #38bdf8;
	}

	.btn-search-db {
		background: rgba(56, 189, 248, 0.14);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.3);
		padding: 0.65rem 0.95rem;
		border-radius: 0.6rem;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.btn-search-db:hover {
		background: rgba(56, 189, 248, 0.24);
	}

	.filter-select {
		padding: 0.65rem 0.9rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: #0f172a;
		color: #f8fafc;
		font-size: 0.85rem;
		outline: none;
		max-width: 240px;
	}

	.btn-primary {
		background: linear-gradient(135deg, #0284c7, #2563eb);
		color: #fff;
		border: none;
		padding: 0.65rem 1.15rem;
		border-radius: 0.6rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
		white-space: nowrap;
	}

	.btn-primary:hover {
		opacity: 0.92;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.65rem 1.15rem;
		border-radius: 0.6rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.units-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.875rem;
	}

	.units-table th {
		background: rgba(15, 23, 42, 0.6);
		color: #94a3b8;
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.9rem 1.15rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.units-table td {
		padding: 0.95rem 1.15rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		color: #e2e8f0;
		vertical-align: middle;
	}

	.units-table tbody tr:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.id-col {
		color: #64748b;
		font-family: monospace;
		font-size: 0.8rem;
	}

	.unit-name-cell {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.unit-name-cell strong {
		color: #f8fafc;
		font-size: 0.92rem;
	}

	.conc-badge {
		display: inline-block;
		background: rgba(16, 185, 129, 0.14);
		color: #6ee7b7;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.forma-cell,
	.classe-cell {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.sub-text {
		font-size: 0.76rem;
		color: #94a3b8;
	}

	.neighborhood-badge {
		display: inline-block;
		background: rgba(56, 189, 248, 0.12);
		color: #7dd3fc;
		padding: 0.2rem 0.55rem;
		border-radius: 0.375rem;
		font-size: 0.78rem;
		font-weight: 600;
		width: fit-content;
	}

	.actions-cell {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.btn-action {
		padding: 0.35rem 0.65rem;
		border-radius: 0.45rem;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		color: #e2e8f0;
		transition: all 0.15s;
	}

	.btn-action:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.btn-action.delete {
		color: #fca5a5;
		border-color: rgba(239, 68, 68, 0.25);
	}

	.btn-action.delete:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	.empty-cell {
		text-align: center;
		padding: 3rem !important;
		color: #64748b !important;
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 6, 23, 0.75);
		backdrop-filter: blur(4px);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal-card {
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1rem;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
	}

	.modal-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 700;
		color: #f8fafc;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: #94a3b8;
		font-size: 1.1rem;
		cursor: pointer;
	}

	.modal-form {
		padding: 1.5rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-group.full {
		grid-column: 1 / -1;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #cbd5e1;
	}

	.form-group input,
	.form-group select {
		padding: 0.65rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: #0f172a;
		color: #f8fafc;
		font-size: 0.875rem;
		outline: none;
	}

	.form-group input:focus,
	.form-group select:focus {
		border-color: #38bdf8;
	}

	.mt-input {
		margin-top: 0.45rem;
	}

	.modal-footer {
		margin-top: 1.5rem;
		padding-top: 1.15rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

