<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import type { HealthUnitRecord } from '$lib/server/db';
	import ChangePasswordModal from '$lib/components/ChangePasswordModal.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
	let isCreateModalOpen = $state(false);
	let isChangePasswordOpen = $state(false);
	let editingUnit = $state<HealthUnitRecord | null>(null);
	let deleteConfirmId = $state<number | null>(null);

	// Filtering units live
	let filteredUnits = $derived(() => {
		let list = data.units;
		if (statusFilter === 'active') {
			list = list.filter((u) => u.active === 1);
		} else if (statusFilter === 'inactive') {
			list = list.filter((u) => u.active === 0);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				(u) =>
					u.name.toLowerCase().includes(q) ||
					u.neighborhood.toLowerCase().includes(q) ||
					u.address.toLowerCase().includes(q) ||
					u.city.toLowerCase().includes(q) ||
					(u.phone && u.phone.includes(q))
			);
		}
		return list;
	});

	// Metrics
	let totalCount = $derived(data.units.length);
	let activeCount = $derived(data.units.filter((u) => u.active === 1).length);
	let inactiveCount = $derived(data.units.filter((u) => u.active === 0).length);
	let csvCount = $derived(data.units.filter((u) => u.source === 'csv_import').length);

	function openCreateModal() {
		isCreateModalOpen = true;
	}

	function closeCreateModal() {
		isCreateModalOpen = false;
	}

	function openEditModal(unit: HealthUnitRecord) {
		editingUnit = { ...unit };
	}

	function closeEditModal() {
		editingUnit = null;
	}
</script>

<svelte:head>
	<title>Gerenciamento de Unidades de Saúde | Painel Admin</title>
</svelte:head>

<div class="admin-units-container">
	<!-- Top Navigation Bar -->
	<header class="admin-header">
		<div class="header-left">
			<a href="/" class="back-link">
				<span class="arrow">←</span> Voltar ao Hub
			</a>
			<div class="title-group">
				<div class="badge-admin">Admin Master</div>
				<h1>Unidades de Saúde (ESF / UBS)</h1>
			</div>
		</div>

		<div class="header-actions">
			<button
				type="button"
				class="btn-secondary"
				onclick={() => (isChangePasswordOpen = true)}
				title="Alterar senha do administrador"
			>
				<span class="icon">🔑</span> Alterar Senha
			</button>
			<a href="/admin/monitoramento" class="btn-secondary">
				<span class="icon">📊</span> Painel de Uso
			</a>
			<button class="btn-primary" onclick={openCreateModal}>
				<span class="icon">+</span> Nova Unidade
			</button>
		</div>
	</header>

	<ChangePasswordModal bind:isOpen={isChangePasswordOpen} />

	<!-- Feedback Alerts -->
	{#if form?.message}
		<div class="alert {form.success ? 'alert-success' : 'alert-error'}">
			<span class="alert-icon">{form.success ? '✓' : '⚠️'}</span>
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Metric Cards Grid -->
	<section class="metrics-grid">
		<div class="metric-card">
			<div class="metric-icon total">🏥</div>
			<div class="metric-info">
				<span class="metric-label">Total Cadastradas</span>
				<strong class="metric-val">{totalCount}</strong>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon active">🟢</div>
			<div class="metric-info">
				<span class="metric-label">Unidades Ativas</span>
				<strong class="metric-val">{activeCount}</strong>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon inactive">⚪</div>
			<div class="metric-info">
				<span class="metric-label">Desativadas</span>
				<strong class="metric-val">{inactiveCount}</strong>
			</div>
		</div>

		<div class="metric-card">
			<div class="metric-icon csv">📁</div>
			<div class="metric-info">
				<span class="metric-label">Base Oficial ESF</span>
				<strong class="metric-val">{csvCount}</strong>
			</div>
		</div>
	</section>

	<!-- Search & Filters Toolbar -->
	<div class="toolbar">
		<div class="search-box">
			<span class="search-icon">🔍</span>
			<input
				type="text"
				placeholder="Buscar por nome, bairro, endereço ou telefone..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button class="clear-search" onclick={() => (searchQuery = '')}>✕</button>
			{/if}
		</div>

		<div class="filter-group">
			<label for="status-filter">Status:</label>
			<select id="status-filter" bind:value={statusFilter}>
				<option value="all">Todas ({totalCount})</option>
				<option value="active">Apenas Ativas ({activeCount})</option>
				<option value="inactive">Apenas Inativas ({inactiveCount})</option>
			</select>
		</div>
	</div>

	<!-- Health Units Table View -->
	<div class="table-card">
		<div class="table-header-info">
			<h2>Lista de Unidades ({filteredUnits().length})</h2>
			<p class="table-subtitle">
				Unidades ativas ficam visíveis para todos os médicos no seletor do módulo de Prescrição Médica.
			</p>
		</div>

		{#if filteredUnits().length === 0}
			<div class="empty-state">
				<span class="empty-icon">🏥</span>
				<p>Nenhuma unidade de saúde encontrada com os filtros atuais.</p>
				{#if searchQuery || statusFilter !== 'all'}
					<button
						class="btn-outline"
						onclick={() => {
							searchQuery = '';
							statusFilter = 'all';
						}}
					>
						Limpar Filtros
					</button>
				{/if}
			</div>
		{:else}
			<div class="table-responsive">
				<table class="units-table">
					<thead>
						<tr>
							<th>Unidade & Origem</th>
							<th>Endereço & Bairro</th>
							<th>Contato & Horário</th>
							<th>Status</th>
							<th class="text-right">Ações</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredUnits() as unit (unit.id)}
							<tr class={unit.active ? '' : 'row-inactive'}>
								<td class="unit-name-cell">
									<div class="name-wrapper">
										<strong class="unit-title">{unit.name}</strong>
										<div class="tags-row">
											{#if unit.source === 'csv_import'}
												<span class="badge badge-csv" title="Importada da base oficial de ESFs">
													Base ESF
												</span>
											{:else}
												<span class="badge badge-manual" title="Cadastrada manualmente por admin">
													Manual
												</span>
											{/if}
											<span class="city-tag">{unit.city} - {unit.state}</span>
										</div>
									</div>
								</td>

								<td>
									<div class="address-text">{unit.address}</div>
									<div class="neighborhood-text">
										{unit.neighborhood} {unit.cep ? `• CEP ${unit.cep}` : ''}
									</div>
								</td>

								<td>
									<div class="contact-line">
										<span class="phone-icon">📞</span>
										<span>{unit.phone}</span>
									</div>
									<div class="hours-line">
										<span class="hours-icon">🕒</span>
										<span>{unit.businessHours}</span>
									</div>
									{#if unit.email}
										<div class="email-line">
											<span class="email-icon">✉️</span>
											<span>{unit.email}</span>
										</div>
									{/if}
								</td>

								<td>
									<form method="POST" action="?/toggleActive" use:enhance>
										<input type="hidden" name="id" value={unit.id} />
										<input type="hidden" name="active" value={unit.active ? '0' : '1'} />
										<button
											type="submit"
											class="status-toggle-btn {unit.active ? 'is-active' : 'is-inactive'}"
											title={unit.active ? 'Clique para desativar' : 'Clique para ativar'}
										>
											<span class="status-dot"></span>
											<span>{unit.active ? 'Ativa' : 'Inativa'}</span>
										</button>
									</form>
								</td>

								<td class="text-right actions-cell">
									<button
										type="button"
										class="btn-icon edit-btn"
										title="Editar dados da unidade"
										onclick={() => openEditModal(unit)}
									>
										✏️
									</button>
									<button
										type="button"
										class="btn-icon delete-btn"
										title="Excluir unidade"
										onclick={() => (deleteConfirmId = unit.id)}
									>
										🗑️
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Modal: Criar Unidade -->
{#if isCreateModalOpen}
	<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}>
		<div class="modal-dialog">
			<div class="modal-header">
				<h3>🏥 Cadastrar Nova Unidade de Saúde</h3>
				<button class="modal-close" onclick={closeCreateModal}>✕</button>
			</div>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							closeCreateModal();
						}
					};
				}}
			>
				<div class="modal-body">
					<div class="form-group">
						<label for="create-name">Nome da Unidade *</label>
						<input
							type="text"
							id="create-name"
							name="name"
							required
							placeholder="Ex: E.S.F. CENTRAL OU UBS SÃO JOSÉ"
						/>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="create-phone">Telefone(s) *</label>
							<input
								type="text"
								id="create-phone"
								name="phone"
								required
								placeholder="Ex: 3229-6000 / 3229-6001"
							/>
						</div>

						<div class="form-group">
							<label for="create-hours">Horário de Atendimento *</label>
							<input
								type="text"
								id="create-hours"
								name="businessHours"
								required
								value="De 07:00 às 17:00"
								placeholder="Ex: De 07:00 às 22:00"
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="create-address">Endereço (Rua/Av. e Número) *</label>
						<input
							type="text"
							id="create-address"
							name="address"
							required
							placeholder="Ex: Av. Brasília, 861"
						/>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="create-neighborhood">Bairro *</label>
							<input
								type="text"
								id="create-neighborhood"
								name="neighborhood"
								required
								placeholder="Ex: Centro"
							/>
						</div>

						<div class="form-group">
							<label for="create-cep">CEP</label>
							<input
								type="text"
								id="create-cep"
								name="cep"
								value="35500-000"
								placeholder="35500-000"
							/>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="create-city">Cidade *</label>
							<input
								type="text"
								id="create-city"
								name="city"
								required
								value="Divinópolis"
							/>
						</div>

						<div class="form-group">
							<label for="create-state">Estado *</label>
							<input
								type="text"
								id="create-state"
								name="state"
								required
								value="Minas Gerais"
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="create-email">E-mail da Unidade (Opcional)</label>
						<input
							type="email"
							id="create-email"
							name="email"
							placeholder="unidade@saude.gov.br"
						/>
					</div>

					<div class="form-group checkbox-group">
						<label class="checkbox-label">
							<input type="checkbox" name="active" value="1" checked />
							<span>Tornar unidade imediatamente ativa e visível no receituário</span>
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={closeCreateModal}>Cancelar</button>
					<button type="submit" class="btn-primary">Salvar Unidade</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal: Editar Unidade -->
{#if editingUnit}
	<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
		<div class="modal-dialog">
			<div class="modal-header">
				<h3>✏️ Editar Unidade de Saúde</h3>
				<button class="modal-close" onclick={closeEditModal}>✕</button>
			</div>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							closeEditModal();
						}
					};
				}}
			>
				<input type="hidden" name="id" value={editingUnit.id} />

				<div class="modal-body">
					<div class="form-group">
						<label for="edit-name">Nome da Unidade *</label>
						<input
							type="text"
							id="edit-name"
							name="name"
							required
							bind:value={editingUnit.name}
						/>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="edit-phone">Telefone(s) *</label>
							<input
								type="text"
								id="edit-phone"
								name="phone"
								required
								bind:value={editingUnit.phone}
							/>
						</div>

						<div class="form-group">
							<label for="edit-hours">Horário de Atendimento *</label>
							<input
								type="text"
								id="edit-hours"
								name="businessHours"
								required
								bind:value={editingUnit.businessHours}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="edit-address">Endereço (Rua/Av. e Número) *</label>
						<input
							type="text"
							id="edit-address"
							name="address"
							required
							bind:value={editingUnit.address}
						/>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="edit-neighborhood">Bairro *</label>
							<input
								type="text"
								id="edit-neighborhood"
								name="neighborhood"
								required
								bind:value={editingUnit.neighborhood}
							/>
						</div>

						<div class="form-group">
							<label for="edit-cep">CEP</label>
							<input
								type="text"
								id="edit-cep"
								name="cep"
								bind:value={editingUnit.cep}
							/>
						</div>
					</div>

					<div class="form-row">
						<div class="form-group">
							<label for="edit-city">Cidade *</label>
							<input
								type="text"
								id="edit-city"
								name="city"
								required
								bind:value={editingUnit.city}
							/>
						</div>

						<div class="form-group">
							<label for="edit-state">Estado *</label>
							<input
								type="text"
								id="edit-state"
								name="state"
								required
								bind:value={editingUnit.state}
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="edit-email">E-mail da Unidade</label>
						<input
							type="email"
							id="edit-email"
							name="email"
							bind:value={editingUnit.email}
						/>
					</div>

					<div class="form-group checkbox-group">
						<label class="checkbox-label">
							<input
								type="checkbox"
								name="active"
								value="1"
								checked={editingUnit.active === 1}
								onchange={(e) => {
									if (editingUnit) editingUnit.active = e.currentTarget.checked ? 1 : 0;
								}}
							/>
							<span>Unidade Ativa</span>
						</label>
					</div>
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={closeEditModal}>Cancelar</button>
					<button type="submit" class="btn-primary">Salvar Alterações</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Confirmation Dialog: Excluir -->
{#if deleteConfirmId !== null}
	<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) deleteConfirmId = null; }}>
		<div class="modal-dialog modal-small">
			<div class="modal-header">
				<h3>⚠️ Excluir Unidade de Saúde</h3>
				<button class="modal-close" onclick={() => (deleteConfirmId = null)}>✕</button>
			</div>
			<div class="modal-body">
				<p>Tem certeza de que deseja remover permanentemente esta unidade de saúde do banco de dados?</p>
				<p class="text-muted">Dica: Se a unidade apenas fechou temporariamente, você pode desativá-la sem excluir.</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" onclick={() => (deleteConfirmId = null)}>Cancelar</button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							deleteConfirmId = null;
						};
					}}
				>
					<input type="hidden" name="id" value={deleteConfirmId} />
					<button type="submit" class="btn-danger">Confirmar Exclusão</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #0f172a;
		color: #f8fafc;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		margin: 0;
		padding: 0;
	}

	.admin-units-container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	.admin-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #94a3b8;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: #38bdf8;
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.badge-admin {
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		color: #ffffff;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	h1 {
		font-size: 1.85rem;
		font-weight: 800;
		color: #f1f5f9;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
		color: white;
		border: 1px solid #38bdf840;
		padding: 0.65rem 1.25rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(2, 132, 199, 0.35);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #1e293b;
		color: #cbd5e1;
		border: 1px solid #334155;
		padding: 0.65rem 1.1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: #334155;
		color: #f8fafc;
	}

	.btn-danger {
		background: #dc2626;
		color: white;
		border: none;
		padding: 0.65rem 1.25rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn-danger:hover {
		background: #b91c1c;
	}

	.btn-outline {
		background: transparent;
		border: 1px solid #475569;
		color: #cbd5e1;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-outline:hover {
		border-color: #94a3b8;
		color: #f8fafc;
	}

	.alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.85rem 1.25rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.92rem;
	}

	.alert-success {
		background: #064e3b;
		border: 1px solid #059669;
		color: #a7f3d0;
	}

	.alert-error {
		background: #7f1d1d;
		border: 1px solid #dc2626;
		color: #fecaca;
	}

	/* Metrics Grid */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.metric-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 12px;
		padding: 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.metric-icon {
		font-size: 1.75rem;
		background: #0f172a;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid #334155;
	}

	.metric-info {
		display: flex;
		flex-direction: column;
	}

	.metric-label {
		font-size: 0.8rem;
		color: #94a3b8;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.metric-val {
		font-size: 1.6rem;
		font-weight: 800;
		color: #f8fafc;
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.search-box {
		position: relative;
		flex: 1;
		min-width: 280px;
	}

	.search-icon {
		position: absolute;
		left: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.95rem;
		color: #64748b;
	}

	.search-box input {
		width: 100%;
		box-sizing: border-box;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 8px;
		padding: 0.75rem 2.25rem 0.75rem 2.4rem;
		color: #f8fafc;
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.search-box input:focus {
		border-color: #38bdf8;
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #94a3b8;
		font-size: 0.88rem;
	}

	.filter-group select {
		background: #1e293b;
		border: 1px solid #334155;
		color: #f8fafc;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		outline: none;
		font-size: 0.9rem;
		cursor: pointer;
	}

	/* Table Card */
	.table-card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
	}

	.table-header-info {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #334155;
		background: #162032;
	}

	.table-header-info h2 {
		margin: 0;
		font-size: 1.15rem;
		color: #f1f5f9;
		font-weight: 700;
	}

	.table-subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: #94a3b8;
	}

	.table-responsive {
		overflow-x: auto;
	}

	.units-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 0.9rem;
	}

	.units-table th {
		background: #1e293b;
		color: #94a3b8;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.75rem;
		padding: 0.9rem 1.25rem;
		border-bottom: 1px solid #334155;
	}

	.units-table td {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #1e293b;
		vertical-align: middle;
	}

	.units-table tr:hover {
		background: #243046;
	}

	.row-inactive {
		opacity: 0.6;
		background: #131d2e;
	}

	.unit-name-cell {
		min-width: 240px;
	}

	.name-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.unit-title {
		color: #f8fafc;
		font-size: 0.95rem;
	}

	.tags-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge-csv {
		background: #0284c725;
		color: #38bdf8;
		border: 1px solid #38bdf840;
	}

	.badge-manual {
		background: #8b5cf625;
		color: #a78bfa;
		border: 1px solid #8b5cf640;
	}

	.city-tag {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.address-text {
		color: #e2e8f0;
		font-weight: 500;
	}

	.neighborhood-text {
		color: #94a3b8;
		font-size: 0.8rem;
		margin-top: 0.15rem;
	}

	.contact-line,
	.hours-line,
	.email-line {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #cbd5e1;
		margin-bottom: 0.2rem;
	}

	.email-line {
		color: #38bdf8;
		font-size: 0.8rem;
	}

	.status-toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0.75rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.status-toggle-btn.is-active {
		background: #064e3b;
		color: #34d399;
		border: 1px solid #05966960;
	}

	.status-toggle-btn.is-active .status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #34d399;
		box-shadow: 0 0 6px #34d399;
	}

	.status-toggle-btn.is-inactive {
		background: #334155;
		color: #94a3b8;
		border: 1px solid #475569;
	}

	.status-toggle-btn.is-inactive .status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #94a3b8;
	}

	.actions-cell {
		white-space: nowrap;
	}

	.text-right {
		text-align: right;
	}

	.btn-icon {
		background: transparent;
		border: 1px solid #334155;
		border-radius: 6px;
		padding: 0.4rem 0.55rem;
		color: #cbd5e1;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.15s ease;
		margin-left: 0.35rem;
	}

	.btn-icon:hover {
		background: #334155;
		border-color: #475569;
	}

	.delete-btn:hover {
		background: #7f1d1d;
		border-color: #dc2626;
		color: #fecaca;
	}

	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		color: #94a3b8;
	}

	.empty-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
		opacity: 0.6;
	}

	/* Modal Dialogs */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-dialog {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 16px;
		width: 100%;
		max-width: 600px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
	}

	.modal-small {
		max-width: 440px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #334155;
		background: #162032;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.15rem;
		color: #f8fafc;
	}

	.modal-close {
		background: transparent;
		border: none;
		color: #94a3b8;
		font-size: 1.25rem;
		cursor: pointer;
		line-height: 1;
	}

	.modal-close:hover {
		color: #f8fafc;
	}

	.modal-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #cbd5e1;
	}

	.form-group input {
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 8px;
		padding: 0.65rem 0.85rem;
		color: #f8fafc;
		font-size: 0.9rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.form-group input:focus {
		border-color: #38bdf8;
		box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
	}

	.checkbox-group {
		margin-top: 0.5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.88rem;
		color: #e2e8f0;
	}

	.checkbox-label input {
		width: 16px;
		height: 16px;
		accent-color: #0284c7;
	}

	.modal-footer {
		padding: 1.25rem 1.5rem;
		border-top: 1px solid #334155;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		background: #162032;
	}

	.text-muted {
		color: #94a3b8;
		font-size: 0.85rem;
	}

	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.admin-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-actions {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
