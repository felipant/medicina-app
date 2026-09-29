<script lang="ts">
	import ChangePasswordModal from '$lib/components/ChangePasswordModal.svelte';

	let { data } = $props();

	let isChangePasswordOpen = $state(false);
	let searchTerm = $state('');
	let roleFilter: 'all' | 'med' | 'admin' = $state('all');

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '-';
		try {
			const d = new Date(dateStr);
			if (isNaN(d.getTime())) return dateStr;
			return d.toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch {
			return dateStr;
		}
	}

	const filteredUsers = $derived(
		(data.metrics?.users || []).filter((u) => {
			const matchesSearch =
				u.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
				u.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
				u.institution.toLowerCase().includes(searchTerm.toLowerCase().trim());

			const matchesRole = roleFilter === 'all' || u.role === roleFilter;

			return matchesSearch && matchesRole;
		})
	);

	function exportToCSV() {
		const headers = ['ID', 'Nome', 'Email', 'Instituicao', 'Perfil', 'Data Cadastro', 'Qtd Sessoes', 'Tempo Total (s)', 'Tempo Formatado', 'Ultima Atividade'];
		const rows = (data.metrics?.users || []).map(u => [
			u.id,
			`"${u.name.replace(/"/g, '""')}"`,
			`"${u.email}"`,
			`"${u.institution.replace(/"/g, '""')}"`,
			u.role === 'admin' ? 'Administrador' : 'Médico',
			u.createdAt,
			u.sessionCount,
			u.totalDurationSeconds,
			`"${u.formattedDuration}"`,
			u.lastSeenAt || ''
		]);

		const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `medicinahub-monitoramento-usuarios-${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<svelte:head>
	<title>Painel de Monitoramento — MedicinaHub Admin</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
</svelte:head>

<div class="admin-wrapper">
	<!-- Background grid -->
	<div class="bg-grid"></div>

	<!-- Top Navigation -->
	<header class="admin-header">
		<div class="header-inner">
			<div class="brand-group">
				<a href="/" class="btn-back">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="19" y1="12" x2="5" y2="12"></line>
						<polyline points="12 19 5 12 12 5"></polyline>
					</svg>
					<span>Voltar ao Hub</span>
				</a>
				<div class="brand-divider"></div>
				<div class="brand">
					<div class="admin-badge">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<div class="brand-text">
						<span class="brand-title">Painel de Monitoramento</span>
						<span class="brand-badge">Área do Administrador</span>
					</div>
				</div>
			</div>

			<div class="user-section">
				<div class="user-pill">
					<span class="pulse-dot"></span>
					<span class="user-email">{data.user.email}</span>
					<span class="admin-tag">ADMIN</span>
				</div>
				<button
					type="button"
					class="btn-change-pwd"
					onclick={() => (isChangePasswordOpen = true)}
					title="Alterar senha do administrador"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					<span>Alterar Senha</span>
				</button>
				<form action="/logout" method="POST">
					<button type="submit" class="btn-logout" title="Encerrar sessão">
						<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
							<polyline points="16 17 21 12 16 7" />
							<line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						<span>Sair</span>
					</button>
				</form>
			</div>
		</div>
	</header>

	<ChangePasswordModal bind:isOpen={isChangePasswordOpen} />

	<main class="admin-main">
		<!-- Hero Section -->
		<section class="admin-hero">
			<div class="hero-left">
				<div class="hero-kicker">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
					</svg>
					<span>MÉTRICAS DA PLATAFORMA & SESSÕES</span>
				</div>
				<h1>Visão Geral de Usuários e Uso</h1>
				<p class="hero-subtitle">
					Monitore o volume de contas ativas, frequência de logins e tempo de permanência no sistema Cloudflare D1.
				</p>
			</div>

			<div class="hero-right">
				<button class="btn-export" onclick={exportToCSV} title="Exportar dados para planilha CSV">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
						<polyline points="7 10 12 15 17 10"/>
						<line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span>Exportar Relatório CSV</span>
				</button>
			</div>
		</section>

		<!-- Cards de Métricas Agregadas -->
		<section class="metrics-grid">
			<!-- Card 1: Total de Usuários -->
			<div class="metric-card">
				<div class="metric-header">
					<span class="metric-label">Usuários Cadastrados</span>
					<div class="metric-icon users-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
					</div>
				</div>
				<div class="metric-value">{data.metrics?.totalUsers || 0}</div>
				<div class="metric-footer">
					<span class="metric-sub">Contas ativas no Cloudflare D1</span>
				</div>
			</div>

			<!-- Card 2: Total de Sessões -->
			<div class="metric-card">
				<div class="metric-header">
					<span class="metric-label">Sessões Realizadas</span>
					<div class="metric-icon sessions-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
							<polyline points="10 17 15 12 10 7"/>
							<line x1="15" y1="12" x2="3" y2="12"/>
						</svg>
					</div>
				</div>
				<div class="metric-value">{data.metrics?.totalSessions || 0}</div>
				<div class="metric-footer">
					<span class="metric-sub">
						Média de {(
							(data.metrics?.totalSessions || 0) / (data.metrics?.totalUsers || 1)
						).toFixed(1)} sessões por profissional
					</span>
				</div>
			</div>

			<!-- Card 3: Tempo Total de Uso -->
			<div class="metric-card">
				<div class="metric-header">
					<span class="metric-label">Tempo Total de Uso</span>
					<div class="metric-icon time-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<polyline points="12 6 12 12 16 14"/>
						</svg>
					</div>
				</div>
				<div class="metric-value">{data.metrics?.totalUsageHours || '0h'}</div>
				<div class="metric-footer">
					<span class="metric-sub">Soma acumulada de tempo ativo</span>
				</div>
			</div>

			<!-- Card 4: Soberania & Privacidade -->
			<div class="metric-card privacy-metric-card">
				<div class="metric-header">
					<span class="metric-label">Soberania dos Dados</span>
					<div class="metric-icon privacy-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
				</div>
				<div class="metric-value text-green">100% Client-Side</div>
				<div class="metric-footer">
					<span class="metric-sub">Zero prontuários ou dados de pacientes na nuvem</span>
				</div>
			</div>
		</section>

		<!-- Tabela de Usuários e Uso -->
		<section class="table-section">
			<div class="table-controls">
				<div class="search-box">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"/>
						<line x1="21" y1="21" x2="16.65" y2="16.65"/>
					</svg>
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Buscar por nome, e-mail ou instituição..."
					/>
					{#if searchTerm}
						<button class="btn-clear-search" onclick={() => (searchTerm = '')} title="Limpar busca">✕</button>
					{/if}
				</div>

				<div class="filter-pills">
					<button
						type="button"
						class="filter-pill"
						class:active={roleFilter === 'all'}
						onclick={() => (roleFilter = 'all')}
					>
						Todos ({data.metrics?.users?.length || 0})
					</button>
					<button
						type="button"
						class="filter-pill"
						class:active={roleFilter === 'med'}
						onclick={() => (roleFilter = 'med')}
					>
						Médicos ({(data.metrics?.users || []).filter(u => u.role === 'med').length})
					</button>
					<button
						type="button"
						class="filter-pill"
						class:active={roleFilter === 'admin'}
						onclick={() => (roleFilter = 'admin')}
					>
						Administradores ({(data.metrics?.users || []).filter(u => u.role === 'admin').length})
					</button>
				</div>
			</div>

			<div class="table-container">
				<table class="users-table">
					<thead>
						<tr>
							<th>Profissional</th>
							<th>Instituição</th>
							<th>Perfil</th>
							<th>Data de Cadastro</th>
							<th class="text-center">Sessões</th>
							<th>Tempo de Uso</th>
							<th>Última Atividade</th>
						</tr>
					</thead>
					<tbody>
						{#if filteredUsers.length === 0}
							<tr>
								<td colspan="7" class="empty-state">
									<div class="empty-wrap">
										<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
											<circle cx="11" cy="11" r="8"/>
											<line x1="21" y1="21" x2="16.65" y2="16.65"/>
										</svg>
										<p>Nenhum usuário encontrado para os filtros selecionados.</p>
									</div>
								</td>
							</tr>
						{:else}
							{#each filteredUsers as u (u.id)}
								<tr>
									<td class="user-cell">
										<div class="user-avatar" class:admin-avatar={u.role === 'admin'}>
											{u.name ? u.name.charAt(0).toUpperCase() : 'U'}
										</div>
										<div class="user-details">
											<span class="user-name">{u.name || 'Sem nome'}</span>
											<span class="user-sub-email">{u.email}</span>
										</div>
									</td>
									<td>
										<span class="institution-badge">{u.institution || '-'}</span>
									</td>
									<td>
										<span class="role-tag {u.role}">
											{u.role === 'admin' ? 'Administrador' : 'Médico'}
										</span>
									</td>
									<td class="date-cell">{formatDate(u.createdAt)}</td>
									<td class="text-center">
										<span class="session-count-badge">{u.sessionCount}</span>
									</td>
									<td class="duration-cell">
										<div class="duration-badge">
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<circle cx="12" cy="12" r="10"/>
												<polyline points="12 6 12 12 16 14"/>
											</svg>
											<span>{u.formattedDuration}</span>
										</div>
									</td>
									<td class="date-cell">{formatDate(u.lastSeenAt)}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>

			<div class="table-footer">
				<span>Exibindo {filteredUsers.length} de {data.metrics?.totalUsers || 0} usuários</span>
				<div class="privacy-note">
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
					<span>Privacidade LGPD: Nenhum dado clínico é monitorado ou armazenado nesta visão.</span>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #0b0f19;
		font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
		color: #e2e8f0;
	}

	.admin-wrapper {
		min-height: 100vh;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.bg-grid {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
		background-size: 28px 28px;
		pointer-events: none;
		z-index: 0;
	}

	/* ── Header ── */
	.admin-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(15, 23, 42, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		height: 64px;
		display: flex;
		align-items: center;
	}

	.header-inner {
		max-width: 1240px;
		width: 100%;
		margin: 0 auto;
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand-group {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		color: #94a3b8;
		font-size: 13px;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.15s ease;
	}

	.btn-back:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.brand-divider {
		width: 1px;
		height: 24px;
		background: rgba(255, 255, 255, 0.1);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.admin-badge {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: linear-gradient(135deg, #ec4899, #be185d);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 10px rgba(236, 72, 153, 0.3);
	}

	.brand-text {
		display: flex;
		flex-direction: column;
	}

	.brand-title {
		font-size: 15px;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.01em;
	}

	.brand-badge {
		font-size: 11px;
		color: #f472b6;
		font-weight: 600;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-pill {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 12px;
		color: #cbd5e1;
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #10b981;
		box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
	}

	.admin-tag {
		font-size: 9px;
		font-weight: 800;
		color: #f472b6;
		background: rgba(244, 114, 182, 0.15);
		border: 1px solid rgba(244, 114, 182, 0.3);
		padding: 1px 5px;
		border-radius: 4px;
	}

	.btn-change-pwd {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #cbd5e1;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-change-pwd:hover {
		background: rgba(56, 189, 248, 0.15);
		border-color: rgba(56, 189, 248, 0.35);
		color: #38bdf8;
	}

	.btn-logout {
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #94a3b8;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-logout:hover {
		background: rgba(239, 68, 68, 0.15);
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}

	/* ── Main ── */
	.admin-main {
		position: relative;
		z-index: 10;
		max-width: 1240px;
		width: 100%;
		margin: 0 auto;
		padding: 36px 24px 80px;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	/* Hero */
	.admin-hero {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
	}

	.hero-kicker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 700;
		color: #38bdf8;
		background: rgba(56, 189, 248, 0.1);
		border: 1px solid rgba(56, 189, 248, 0.2);
		padding: 3px 8px;
		border-radius: 6px;
		margin-bottom: 8px;
		letter-spacing: 0.04em;
	}

	.admin-hero h1 {
		margin: 0 0 6px;
		font-size: 28px;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.hero-subtitle {
		margin: 0;
		font-size: 14px;
		color: #94a3b8;
		max-width: 640px;
	}

	.btn-export {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: linear-gradient(135deg, #0284c7, #2563eb);
		border: none;
		color: #ffffff;
		padding: 10px 18px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		box-shadow: 0 4px 15px rgba(2, 132, 199, 0.25);
	}

	.btn-export:hover {
		background: linear-gradient(135deg, #0369a1, #1d4ed8);
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
	}

	/* ── Metrics Grid ── */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}

	.metric-card {
		background: rgba(18, 24, 39, 0.7);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.metric-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.metric-label {
		font-size: 13px;
		font-weight: 600;
		color: #94a3b8;
	}

	.metric-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.users-icon {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.25);
	}

	.sessions-icon {
		background: rgba(168, 85, 247, 0.15);
		color: #c084fc;
		border: 1px solid rgba(168, 85, 247, 0.25);
	}

	.time-icon {
		background: rgba(245, 158, 11, 0.15);
		color: #fbbf24;
		border: 1px solid rgba(245, 158, 11, 0.25);
	}

	.privacy-icon {
		background: rgba(16, 185, 129, 0.15);
		color: #34d399;
		border: 1px solid rgba(16, 185, 129, 0.25);
	}

	.metric-value {
		font-size: 28px;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.text-green {
		color: #34d399;
		font-size: 22px;
	}

	.metric-footer {
		font-size: 12px;
		color: #64748b;
	}

	/* ── Table Section ── */
	.table-section {
		background: rgba(18, 24, 39, 0.7);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
	}

	.table-controls {
		padding: 18px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		max-width: 380px;
		width: 100%;
	}

	.search-box svg {
		position: absolute;
		left: 12px;
		color: #64748b;
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 9px 34px 9px 36px;
		font-size: 13px;
		color: #ffffff;
		outline: none;
		transition: all 0.15s ease;
	}

	.search-box input:focus {
		background: rgba(255, 255, 255, 0.07);
		border-color: #38bdf8;
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
	}

	.btn-clear-search {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: 12px;
	}

	.filter-pills {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.filter-pill {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #94a3b8;
		font-size: 12px;
		font-weight: 600;
		padding: 6px 14px;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.filter-pill:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #cbd5e1;
	}

	.filter-pill.active {
		background: #0284c7;
		border-color: #38bdf8;
		color: #ffffff;
	}

	.table-container {
		overflow-x: auto;
	}

	.users-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		font-size: 13px;
	}

	.users-table th {
		background: rgba(255, 255, 255, 0.02);
		color: #94a3b8;
		font-weight: 600;
		font-size: 11.5px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 14px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		white-space: nowrap;
	}

	.users-table td {
		padding: 14px 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		color: #cbd5e1;
		vertical-align: middle;
	}

	.users-table tr:hover td {
		background: rgba(255, 255, 255, 0.02);
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-avatar {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: linear-gradient(135deg, #0284c7, #2563eb);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 13px;
		flex-shrink: 0;
	}

	.user-avatar.admin-avatar {
		background: linear-gradient(135deg, #ec4899, #be185d);
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.user-name {
		font-weight: 600;
		color: #ffffff;
	}

	.user-sub-email {
		font-size: 11.5px;
		color: #94a3b8;
	}

	.institution-badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 3px 8px;
		border-radius: 6px;
		font-size: 12px;
		color: #cbd5e1;
	}

	.role-tag {
		display: inline-block;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 3px 8px;
		border-radius: 6px;
	}

	.role-tag.admin {
		background: rgba(244, 114, 182, 0.15);
		color: #f472b6;
		border: 1px solid rgba(244, 114, 182, 0.3);
	}

	.role-tag.med {
		background: rgba(56, 189, 248, 0.12);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.25);
	}

	.date-cell {
		font-size: 12px;
		color: #94a3b8;
		white-space: nowrap;
	}

	.text-center {
		text-align: center;
	}

	.session-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		border-radius: 12px;
		background: rgba(168, 85, 247, 0.15);
		border: 1px solid rgba(168, 85, 247, 0.3);
		color: #c084fc;
		font-weight: 700;
		font-size: 12px;
	}

	.duration-cell {
		white-space: nowrap;
	}

	.duration-badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: rgba(245, 158, 11, 0.12);
		border: 1px solid rgba(245, 158, 11, 0.25);
		color: #fbbf24;
		padding: 3px 9px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	}

	.empty-state {
		text-align: center;
		padding: 48px 20px !important;
	}

	.empty-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		color: #64748b;
	}

	.empty-wrap p {
		margin: 0;
		font-size: 14px;
	}

	.table-footer {
		padding: 14px 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #64748b;
		flex-wrap: wrap;
		gap: 10px;
	}

	.privacy-note {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #34d399;
	}

	@media (max-width: 768px) {
		.header-inner {
			padding: 0 16px;
		}

		.user-email {
			display: none;
		}

		.admin-main {
			padding: 24px 16px 60px;
		}

		.admin-hero {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
