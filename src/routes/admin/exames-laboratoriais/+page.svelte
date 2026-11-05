<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { LabExamRecord } from '$lib/server/db';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchTerm = $state('');
	let pacoteFilter = $state('all');
	let materialFilter = $state('all');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');

	let showCreateModal = $state(false);
	let editingExam = $state<LabExamRecord | null>(null);
	let isSubmitting = $state(false);
	let toastMessage = $state<string | null>(null);
	let toastType = $state<'success' | 'error'>('success');

	// Form state for create/edit
	let formNome = $state('');
	let formMaterial = $state('SANGUE');
	let formPacote = $state('Bioquímica');
	let formPacoteCustom = $state('');
	let formUnidade = $state('');
	let formValoresReferencia = $state('');
	let formActive = $state('1');

	const MATERIAIS_PADRAO = [
		'SANGUE',
		'URINA',
		'FEZES',
		'LÍQUOR',
		'ESCARRO / SECREÇÃO',
		'SWAB / RASPADO',
		'LÍQUIDO CAVITÁRIO',
		'OUTRO'
	];

	const PACOTES_PADRAO = [
		'Hemograma',
		'Glicemia / Diabetes',
		'Lipidograma',
		'Função Renal',
		'Eletrólitos',
		'Função Hepática',
		'Tireoide',
		'Coagulação',
		'Marcadores Inflamatórios',
		'Marcadores Cardíacos',
		'Metabolismo do Ferro',
		'Vitaminas e Minerais',
		'Hormônios',
		'Sorologias / Infecciosas',
		'Reumatologia / Autoimune',
		'Urinálise',
		'Parasitológico / Fezes',
		'Gasometria',
		'Bioquímica Geral',
		'Outro pacote...'
	];

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		toastMessage = msg;
		toastType = type;
		setTimeout(() => {
			toastMessage = null;
		}, 3500);
	}

	function openCreateModal() {
		formNome = '';
		formMaterial = 'SANGUE';
		formPacote = 'Hemograma';
		formPacoteCustom = '';
		formUnidade = '';
		formValoresReferencia = '';
		formActive = '1';
		showCreateModal = true;
	}

	function openEditModal(exam: LabExamRecord) {
		formNome = exam.nome || '';
		formMaterial = exam.material || 'SANGUE';

		const pMatch = PACOTES_PADRAO.find(
			(p) => p !== 'Outro pacote...' && p.toLowerCase() === (exam.pacote || '').toLowerCase()
		);
		if (pMatch) {
			formPacote = pMatch;
			formPacoteCustom = '';
		} else if (exam.pacote) {
			formPacote = 'Outro pacote...';
			formPacoteCustom = exam.pacote;
		} else {
			formPacote = 'Bioquímica Geral';
			formPacoteCustom = '';
		}

		formUnidade = exam.unidade || '';
		formValoresReferencia = exam.valoresReferencia || '';
		formActive = String(exam.active ?? 1);
		editingExam = exam;
	}

	let uniquePacotes = $derived(
		Array.from(new Set(data.exams.map((e) => e.pacote).filter(Boolean))).sort()
	);

	let uniqueMateriais = $derived(
		Array.from(new Set(data.exams.map((e) => e.material).filter(Boolean))).sort()
	);

	let filteredExams = $derived(
		data.exams.filter((e) => {
			if (statusFilter === 'active' && e.active !== 1) return false;
			if (statusFilter === 'inactive' && e.active !== 0) return false;
			if (pacoteFilter !== 'all' && e.pacote !== pacoteFilter) return false;
			if (materialFilter !== 'all' && e.material !== materialFilter) return false;

			if (!searchTerm.trim()) return true;
			const q = searchTerm.toLowerCase().trim();
			return (
				e.nome.toLowerCase().includes(q) ||
				(e.pacote && e.pacote.toLowerCase().includes(q)) ||
				(e.material && e.material.toLowerCase().includes(q)) ||
				(e.unidade && e.unidade.toLowerCase().includes(q)) ||
				(e.valoresReferencia && e.valoresReferencia.toLowerCase().includes(q))
			);
		})
	);

	let totalActive = $derived(data.exams.filter((e) => e.active === 1).length);
</script>

<svelte:head>
	<title>Gestão de Exames Laboratoriais — Prontuário Médico</title>
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<div class="header-inner">
			<div class="brand-group">
				<a href="/" class="back-btn">← Voltar ao Hub</a>
				<div class="title-block">
					<span class="admin-badge">Gestão Clínica</span>
					<h1>Catálogo de Exames Laboratoriais</h1>
				</div>
			</div>

			<div class="user-info">
				<a href="/admin/medicamentos" class="nav-link-btn">💊 Medicamentos</a>
				<a href="/admin/unidades-saude" class="nav-link-btn">🏥 ESFs</a>
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
				<span class="metric-label">Total de Exames</span>
				<strong class="metric-value">{data.exams.length}</strong>
				<span class="metric-sub">Cadastrados no sistema</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Exames Ativos</span>
				<strong class="metric-value text-emerald">{totalActive}</strong>
				<span class="metric-sub">Disponíveis no autopreenchimento</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Pacotes / Grupos</span>
				<strong class="metric-value text-sky">{uniquePacotes.length}</strong>
				<span class="metric-sub">Hemograma, Função Renal, Tireoide...</span>
			</div>

			<div class="metric-card">
				<span class="metric-label">Materiais Biológicos</span>
				<strong class="metric-value">{uniqueMateriais.length}</strong>
				<span class="metric-sub">Sangue, Urina, Fezes...</span>
			</div>
		</section>

		<!-- Action & Filter Bar -->
		<section class="table-section">
			<div class="table-header">
				<div>
					<h2>Exames Laboratoriais ({filteredExams.length})</h2>
					<p class="table-subtitle">
						Gerencie nomes, pacotes de agrupamento, unidades de medida e valores de referência (inclusive por sexo M/F) usados no prontuário.
					</p>
				</div>

				<div class="controls-row">
					<div class="search-wrap">
						<input
							type="search"
							placeholder="Buscar por nome do exame, pacote, unidade ou referência..."
							bind:value={searchTerm}
							class="search-input"
						/>
					</div>

					<select bind:value={pacoteFilter} class="filter-select">
						<option value="all">Todos os pacotes</option>
						{#each uniquePacotes as pkg}
							<option value={pkg}>{pkg}</option>
						{/each}
					</select>

					<select bind:value={materialFilter} class="filter-select">
						<option value="all">Todos os materiais</option>
						{#each uniqueMateriais as mat}
							<option value={mat}>{mat}</option>
						{/each}
					</select>

					<select bind:value={statusFilter} class="filter-select">
						<option value="all">Todos os status</option>
						<option value="active">Somente ativos</option>
						<option value="inactive">Somente inativos</option>
					</select>

					<button type="button" class="btn-primary" onclick={openCreateModal}>
						+ Novo Exame Laboratorial
					</button>
				</div>
			</div>

			<div class="table-wrapper">
				<table class="units-table">
					<thead>
						<tr>
							<th>Status</th>
							<th>Exame Laboratorial</th>
							<th>Pacote / Grupo</th>
							<th>Unidade</th>
							<th>Valores de Referência</th>
							<th>Ações</th>
						</tr>
					</thead>
					<tbody>
						{#if filteredExams.length === 0}
							<tr>
								<td colspan="6" class="empty-cell">
									Nenhum exame laboratorial encontrado para os filtros informados.
								</td>
							</tr>
						{:else}
							{#each filteredExams as exam (exam.id)}
								<tr class:inactive-row={exam.active === 0}>
									<td>
										<span class="status-pill" class:active={exam.active === 1}>
											{exam.active === 1 ? 'Ativo' : 'Inativo'}
										</span>
									</td>
									<td>
										<div class="unit-name-cell">
											<strong>{exam.nome}</strong>
											<span class="material-chip">{exam.material || 'SANGUE'}</span>
										</div>
									</td>
									<td>
										{#if exam.pacote}
											<span class="neighborhood-badge">{exam.pacote}</span>
										{:else}
											<span class="sub-text">Outros Exames</span>
										{/if}
									</td>
									<td>
										{#if exam.unidade}
											<span class="unit-badge">{exam.unidade}</span>
										{:else}
											<span class="sub-text">—</span>
										{/if}
									</td>
									<td class="ref-col">
										{#if exam.valoresReferencia}
											<span class="ref-text">{exam.valoresReferencia}</span>
										{:else}
											<span class="sub-text">Não especificado</span>
										{/if}
									</td>
									<td>
										<div class="actions-cell">
											<button
												type="button"
												class="btn-action edit"
												onclick={() => openEditModal(exam)}
											>
												✏️ Editar
											</button>

											<form
												method="POST"
												action="?/toggleActive"
												use:enhance={() => {
													return async ({ result, update }) => {
														await update();
														if (result.type === 'success') {
															showToast(
																exam.active === 1
																	? 'Exame desativado.'
																	: 'Exame ativado com sucesso!'
															);
														}
													};
												}}
											>
												<input type="hidden" name="id" value={exam.id} />
												<input type="hidden" name="active" value={exam.active === 1 ? '0' : '1'} />
												<button
													type="submit"
													class="btn-action toggle"
													title={exam.active === 1 ? 'Desativar exame' : 'Ativar exame'}
												>
													{exam.active === 1 ? '⏸️' : '▶️'}
												</button>
											</form>

											<form
												method="POST"
												action="?/delete"
												use:enhance={({ cancel }) => {
													if (!confirm(`Tem certeza que deseja excluir o exame "${exam.nome}"?`)) {
														cancel();
													}
													return async ({ result, update }) => {
														await update();
														if (result.type === 'success') {
															showToast('Exame laboratorial removido com sucesso.');
														}
													};
												}}
											>
												<input type="hidden" name="id" value={exam.id} />
												<button type="submit" class="btn-action delete" title="Excluir exame">
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

<!-- Modal: Create Lab Exam -->
{#if showCreateModal}
	<div class="modal-backdrop" role="presentation" onclick={() => (showCreateModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-card" role="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Cadastrar Novo Exame Laboratorial</h3>
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
							showToast('Exame laboratorial cadastrado com sucesso!');
						}
					};
				}}
				class="modal-form"
			>
				<div class="form-grid">
					<div class="form-group full">
						<label for="create-nome">Nome do Exame Laboratorial *</label>
						<input
							id="create-nome"
							type="text"
							name="nome"
							required
							bind:value={formNome}
							placeholder="Ex: Hemoglobina Glicada (HbA1c), Ferritina Sérica..."
						/>
					</div>

					<div class="form-group">
						<label for="create-mat">Material Biológico</label>
						<select id="create-mat" name="material" bind:value={formMaterial}>
							{#each MATERIAIS_PADRAO as mat}
								<option value={mat}>{mat}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="create-uni">Unidade de Medida</label>
						<input
							id="create-uni"
							type="text"
							name="unidade"
							bind:value={formUnidade}
							placeholder="Ex: mg/dL, g/dL, mUI/L, %..."
						/>
					</div>

					<div class="form-group full">
						<label for="create-pkg">Pacote / Grupo Clínico</label>
						<select id="create-pkg" bind:value={formPacote}>
							{#each PACOTES_PADRAO as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
						{#if formPacote === 'Outro pacote...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formPacoteCustom}
								placeholder="Digite o nome do pacote / grupo..."
							/>
						{/if}
						<input
							type="hidden"
							name="pacote"
							value={formPacote === 'Outro pacote...' ? formPacoteCustom : formPacote}
						/>
					</div>

					<div class="form-group full">
						<label for="create-ref">
							Valores de Referência
							<span class="label-hint">(Dica: use "Homens: X | Mulheres: Y" para filtro por sexo)</span>
						</label>
						<textarea
							id="create-ref"
							name="valoresReferencia"
							rows="3"
							bind:value={formValoresReferencia}
							placeholder="Ex: Homens: 13,5 a 17,5 g/dL | Mulheres: 12,0 a 15,5 g/dL (ou 70 a 99 mg/dL)"
						></textarea>
					</div>

					<div class="form-group">
						<label for="create-active">Status Inicial</label>
						<select id="create-active" name="active" bind:value={formActive}>
							<option value="1">Ativo (Visível na Anamnese)</option>
							<option value="0">Inativo</option>
						</select>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={() => (showCreateModal = false)}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Salvando...' : 'Salvar Exame'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Edit Lab Exam -->
{#if editingExam}
	<div class="modal-backdrop" role="presentation" onclick={() => (editingExam = null)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-card" role="dialog" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Editar Exame Laboratorial #{editingExam.id}</h3>
				<button type="button" class="close-btn" onclick={() => (editingExam = null)}>✕</button>
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
							editingExam = null;
							showToast('Exame laboratorial atualizado com sucesso!');
						}
					};
				}}
				class="modal-form"
			>
				<input type="hidden" name="id" value={editingExam.id} />

				<div class="form-grid">
					<div class="form-group full">
						<label for="edit-nome">Nome do Exame Laboratorial *</label>
						<input
							id="edit-nome"
							type="text"
							name="nome"
							required
							bind:value={formNome}
						/>
					</div>

					<div class="form-group">
						<label for="edit-mat">Material Biológico</label>
						<select id="edit-mat" name="material" bind:value={formMaterial}>
							{#each MATERIAIS_PADRAO as mat}
								<option value={mat}>{mat}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="edit-uni">Unidade de Medida</label>
						<input
							id="edit-uni"
							type="text"
							name="unidade"
							bind:value={formUnidade}
						/>
					</div>

					<div class="form-group full">
						<label for="edit-pkg">Pacote / Grupo Clínico</label>
						<select id="edit-pkg" bind:value={formPacote}>
							{#each PACOTES_PADRAO as p}
								<option value={p}>{p}</option>
							{/each}
						</select>
						{#if formPacote === 'Outro pacote...'}
							<input
								type="text"
								class="mt-input"
								bind:value={formPacoteCustom}
								placeholder="Digite o nome do pacote / grupo..."
							/>
						{/if}
						<input
							type="hidden"
							name="pacote"
							value={formPacote === 'Outro pacote...' ? formPacoteCustom : formPacote}
						/>
					</div>

					<div class="form-group full">
						<label for="edit-ref">
							Valores de Referência
							<span class="label-hint">(Dica: use "Homens: X | Mulheres: Y" para filtro por sexo)</span>
						</label>
						<textarea
							id="edit-ref"
							name="valoresReferencia"
							rows="3"
							bind:value={formValoresReferencia}
						></textarea>
					</div>

					<div class="form-group">
						<label for="edit-active">Status</label>
						<select id="edit-active" name="active" bind:value={formActive}>
							<option value="1">Ativo (Visível na Anamnese)</option>
							<option value="0">Inativo</option>
						</select>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={() => (editingExam = null)}>
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
		min-width: 240px;
	}

	.search-input {
		width: 100%;
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

	.filter-select {
		padding: 0.65rem 0.9rem;
		border-radius: 0.6rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: #0f172a;
		color: #f8fafc;
		font-size: 0.85rem;
		outline: none;
		max-width: 210px;
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

	.inactive-row {
		opacity: 0.55;
	}

	.status-pill {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		background: rgba(245, 158, 11, 0.15);
		color: #fcd34d;
	}

	.status-pill.active {
		background: rgba(16, 185, 129, 0.15);
		color: #6ee7b7;
	}

	.unit-name-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.unit-name-cell strong {
		color: #f8fafc;
		font-size: 0.92rem;
	}

	.material-chip {
		display: inline-block;
		font-size: 0.68rem;
		font-weight: 700;
		color: #94a3b8;
		background: rgba(255, 255, 255, 0.06);
		padding: 0.1rem 0.45rem;
		border-radius: 4px;
		width: fit-content;
	}

	.neighborhood-badge {
		display: inline-block;
		background: rgba(56, 189, 248, 0.12);
		color: #7dd3fc;
		padding: 0.2rem 0.55rem;
		border-radius: 0.375rem;
		font-size: 0.78rem;
		font-weight: 600;
	}

	.unit-badge {
		display: inline-block;
		background: rgba(168, 85, 247, 0.14);
		color: #d8b4fe;
		padding: 0.2rem 0.55rem;
		border-radius: 0.375rem;
		font-size: 0.78rem;
		font-family: monospace;
	}

	.ref-col {
		max-width: 340px;
	}

	.ref-text {
		font-size: 0.8rem;
		color: #cbd5e1;
		line-height: 1.35;
		display: block;
	}

	.sub-text {
		font-size: 0.76rem;
		color: #64748b;
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
		max-width: 620px;
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

	.label-hint {
		font-weight: 400;
		font-size: 0.72rem;
		color: #94a3b8;
		margin-left: 0.35rem;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: 0.65rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: #0f172a;
		color: #f8fafc;
		font-size: 0.875rem;
		outline: none;
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
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

