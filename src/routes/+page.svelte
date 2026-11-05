<script lang="ts">
	import ChangePasswordModal from "$lib/components/ChangePasswordModal.svelte";

	let { data } = $props();
	let isChangePasswordOpen = $state(false);
	let isAdminSidebarMobileOpen = $state(false);

	const isAdmin = $derived(data.user.role === "admin");
</script>

<svelte:head>
	<title>MedicinaHub — Painel Clínico</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="hub-layout" class:has-sidebar={isAdmin}>
	{#if isAdmin}
		<!-- Mobile Backdrop for Admin Sidebar -->
		{#if isAdminSidebarMobileOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="sidebar-backdrop"
				onclick={() => (isAdminSidebarMobileOpen = false)}
			></div>
		{/if}

		<!-- Painel Lateral de Administração -->
		<aside class="admin-sidebar" class:mobile-open={isAdminSidebarMobileOpen}>
			<div class="sidebar-top">
				<div class="sidebar-badge-row">
					<div class="sidebar-shield">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<div>
						<span class="sidebar-title">Administração</span>
						<span class="sidebar-subtitle">Gestão da Plataforma</span>
					</div>
				</div>
				<button
					type="button"
					class="sidebar-close-mobile"
					onclick={() => (isAdminSidebarMobileOpen = false)}
					aria-label="Fechar menu administrativo"
				>
					✕
				</button>
			</div>

			<div class="sidebar-section">
				<span class="sidebar-section-label">NAVEGAÇÃO</span>
				<nav class="sidebar-nav">
					<a href="/" class="sidebar-link active">
						<span class="sidebar-link-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect width="7" height="7" x="3" y="3" rx="1" />
								<rect width="7" height="7" x="14" y="3" rx="1" />
								<rect width="7" height="7" x="14" y="14" rx="1" />
								<rect width="7" height="7" x="3" y="14" rx="1" />
							</svg>
						</span>
						<div class="sidebar-link-text">
							<span class="sidebar-link-name">Hub de Módulos</span>
							<span class="sidebar-link-desc">Visão do usuário</span>
						</div>
					</a>
				</nav>
			</div>

			<div class="sidebar-section">
				<span class="sidebar-section-label">FUNÇÕES DE ADMIN</span>
				<nav class="sidebar-nav">
					<a href="/admin/medicamentos" class="sidebar-link">
						<span class="sidebar-link-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M10.5 20.5 20.5 10.5a4.95 4.95 0 1 0-7-7L3.5 13.5a4.95 4.95 0 1 0 7 7Z"
								/>
								<path d="m8.5 8.5 7 7" />
							</svg>
						</span>
						<div class="sidebar-link-text">
							<span class="sidebar-link-name">Medicamentos</span>
							<span class="sidebar-link-desc">Adicionar e editar catálogo</span>
						</div>
					</a>

					<a href="/admin/exames-laboratoriais" class="sidebar-link">
						<span class="sidebar-link-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M10 2v7.31" />
								<path d="M14 9.3V1.99" />
								<path d="M8.5 2h7" />
								<path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
								<path d="M5.52 16h12.96" />
							</svg>
						</span>
						<div class="sidebar-link-text">
							<span class="sidebar-link-name">Exames Laboratoriais</span>
							<span class="sidebar-link-desc">Exames e valores de referência</span>
						</div>
					</a>

					<a href="/admin/unidades-saude" class="sidebar-link">
						<span class="sidebar-link-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 21h18" />
								<path d="M5 21V7l8-4 6 3v15" />
								<path d="M9 9h1" />
								<path d="M9 13h1" />
								<path d="M9 17h1" />
								<path d="M14 9h1" />
								<path d="M14 13h1" />
								<path d="M14 17h1" />
							</svg>
						</span>
						<div class="sidebar-link-text">
							<span class="sidebar-link-name">Unidades de Saúde</span>
							<span class="sidebar-link-desc">Cadastro de ESF e UBS</span>
						</div>
					</a>

					<a href="/admin/monitoramento" class="sidebar-link">
						<span class="sidebar-link-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 3v18h18" />
								<path d="m19 9-5 5-4-4-3 3" />
							</svg>
						</span>
						<div class="sidebar-link-text">
							<span class="sidebar-link-name">Uso & Sessões</span>
							<span class="sidebar-link-desc">Monitoramento de usuários</span>
						</div>
					</a>
				</nav>
			</div>

			<div class="sidebar-footer">
				<div class="sidebar-user-box">
					<span class="sidebar-user-dot"></span>
					<div class="sidebar-user-meta">
						<span class="sidebar-user-role">Perfil Administrador</span>
						<span class="sidebar-user-email">{data.user.email}</span>
					</div>
				</div>
			</div>
		</aside>
	{/if}

	<!-- Área Principal (Idêntica para Usuário e Admin) -->
	<div class="hub-wrapper">
		<!-- Top Navigation -->
		<header class="hub-header">
			<div class="header-inner">
				<div class="brand-left">
					{#if isAdmin}
						<button
							type="button"
							class="btn-mobile-sidebar"
							onclick={() => (isAdminSidebarMobileOpen = true)}
							title="Abrir painel administrativo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
							<span>Admin</span>
						</button>
					{/if}

					<div class="brand">
						<div class="asclepius-badge">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 32 32"
								width="22"
								height="22"
								fill="none"
								stroke="currentColor"
							>
								<line
									x1="16"
									y1="3"
									x2="16"
									y2="29"
									stroke-width="2.5"
									stroke-linecap="round"
								/>
								<path
									d="M12 6.5C13.5 5 16 5 17.8 6.4C19.5 7.8 18.8 10 16 11.5C13 13 12.5 15.4 14.5 17.2C16.5 19 19.2 20.2 18.2 22.8C17.4 24.8 14.8 25.5 13 27"
									stroke-width="2.2"
								/>
							</svg>
						</div>
						<div class="brand-text">
							<span class="brand-title"
								>Medicina<span class="brand-sub">Hub</span></span
							>
							<span class="brand-tagline">Plataforma Clínica</span>
						</div>
					</div>
				</div>

				<div class="user-section">
					<div class="user-info">
						<span class="user-status-dot"></span>
						<span class="user-email">{data.user.email}</span>
						<span class="role-pill"
							>{isAdmin ? "Administrador" : "Médico"}</span
						>
					</div>

					<button
						type="button"
						class="btn-user-action"
						onclick={() => (isChangePasswordOpen = true)}
						title="Alterar senha de acesso"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
							<path d="M7 11V7a5 5 0 0 1 10 0v4" />
						</svg>
						<span>Alterar Senha</span>
					</button>

					<form action="/logout" method="POST">
						<button type="submit" class="btn-logout" title="Encerrar sessão">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
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

		<!-- Main Content -->
		<main class="hub-main">
			<section class="hero-banner">
				<div class="hero-kicker">
					<span class="pulse-dot"></span>
					<span>PRONTUÁRIO ELETRÔNICO</span>
				</div>
				<h1 class="hero-heading">Módulos de Atendimento Clínico</h1>
				<p class="hero-subtext">
					Selecione uma ferramenta para iniciar o registro estruturado ou emitir receitas médicas.
				</p>
			</section>

			<!-- Grid de Módulos -->
			<section class="cards-grid">
				<!-- Módulo 1: Anamnese do Adulto -->
				<div class="app-card active-card">
					<div class="card-top">
						<div class="card-icon-wrap active-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
								/>
								<rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
								<line x1="9" y1="12" x2="15" y2="12" />
								<line x1="9" y1="16" x2="13" y2="16" />
							</svg>
						</div>
						<span class="badge-status online">Disponível</span>
					</div>

					<div class="card-body">
						<h2 class="card-title">Anamnese do Adulto</h2>
						<p class="card-category">Prontuário SOAP Completo</p>
						<p class="card-desc">
							Consulta estruturada com HMA, exame físico, exames laboratoriais, hipóteses CID-10 e plano terapêutico.
						</p>

						<div class="card-features">
							<span class="feature-tag">SOAP</span>
							<span class="feature-tag">Exames Lab</span>
							<span class="feature-tag">Prescrição</span>
							<span class="feature-tag">PDF</span>
						</div>
					</div>

					<div class="card-footer">
						<a href="/anamnese-adulto" class="btn-primary">
							<span>Abrir Anamnese do Adulto</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Módulo 2: Anamnese Pediátrica -->
				<div class="app-card active-card">
					<div class="card-top">
						<div class="card-icon-wrap active-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M9 12h.01" />
								<path d="M15 12h.01" />
								<path d="M10 16c.5.5 1.5.5 2 0" />
								<path
									d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"
								/>
							</svg>
						</div>
						<span class="badge-status online">Disponível</span>
					</div>

					<div class="card-body">
						<h2 class="card-title">Anamnese Pediátrica</h2>
						<p class="card-category">Pediatria & Puericultura</p>
						<p class="card-desc">
							Avaliação pediátrica com marcos do desenvolvimento (DNPM), antropometria (IMC/Z-score) e prescrição.
						</p>

						<div class="card-features">
							<span class="feature-tag">SOAP</span>
							<span class="feature-tag">Marcos DNPM</span>
							<span class="feature-tag">Z-Score</span>
							<span class="feature-tag">PDF</span>
						</div>
					</div>

					<div class="card-footer">
						<a href="/anamnese-pediatrica" class="btn-primary">
							<span>Abrir Anamnese Pediátrica</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Módulo 3: Prescrição Médica -->
				<div class="app-card active-card">
					<div class="card-top">
						<div class="card-icon-wrap active-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"
								/>
								<path d="m8.5 8.5 7 7" />
							</svg>
						</div>
						<span class="badge-status online">Disponível</span>
					</div>

					<div class="card-body">
						<h2 class="card-title">Prescrição & Receituário</h2>
						<p class="card-category">Receita Dupla Paisagem (2 Vias)</p>
						<p class="card-desc">
							Emissão rápida de receitas em PDF com duas vias (Paciente e Farmácia) e identificação de Unidades ESF.
						</p>

						<div class="card-features">
							<span class="feature-tag">2 Vias PDF</span>
							<span class="feature-tag">Unidades ESF</span>
							<span class="feature-tag">Posologia</span>
						</div>
					</div>

					<div class="card-footer">
						<a href="/prescricao" class="btn-primary">
							<span>Abrir Prescrição Médica</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</a>
					</div>
				</div>

				<!-- Módulo 4: Pronto-Atendimento & Triagem -->
				<div class="app-card disabled-card">
					<div class="card-top">
						<div class="card-icon-wrap disabled-icon">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width="24"
								height="24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
								/>
								<path d="M12 5v14" />
							</svg>
						</div>
						<span class="badge-status muted">Em Breve</span>
					</div>

					<div class="card-body">
						<h2 class="card-title">Pronto-Atendimento & Triagem</h2>
						<p class="card-category">Protocolos de Urgência</p>
						<p class="card-desc">
							Classificação de risco de Manchester, fluxogramas de urgência e protocolos de atendimento rápido.
						</p>

						<div class="card-features">
							<span class="feature-tag">Manchester</span>
							<span class="feature-tag">ACLS / PALS</span>
							<span class="feature-tag">Sepse</span>
						</div>
					</div>

					<div class="card-footer">
						<button type="button" class="btn-disabled" disabled>
							Em Planejamento
						</button>
					</div>
				</div>
			</section>
		</main>

		<!-- Footer -->
		<footer class="hub-footer">
			<div class="footer-inner">
				<div class="footer-brand">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 32 32"
						width="16"
						height="16"
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="16" y1="4" x2="16" y2="28" stroke-width="2" />
						<path
							d="M13 8C14.5 6.8 16 6.8 17.5 8C19 9.5 18 11.5 16 13C13.5 14.5 13 16.5 15 18C17 19.5 18.5 21 17.5 23C16.8 24.5 14.5 25 13 26.5"
							stroke-width="1.8"
						/>
					</svg>
					<span>MedicinaHub · Plataforma para Profissionais de Saúde</span>
				</div>
				<div class="footer-links-row">
					<a href="/politica-de-privacidade" class="footer-link">
						Política de Privacidade & LGPD
					</a>
				</div>
			</div>
		</footer>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #ffffff;
		font-family:
			"Plus Jakarta Sans",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		color: #09090b;
		-webkit-font-smoothing: antialiased;
	}

	.hub-layout {
		min-height: 100vh;
		display: flex;
		background: #ffffff;
	}

	/* =========================================
	   PAINEL LATERAL DO ADMINISTRADOR (SIDEBAR)
	   ========================================= */
	.admin-sidebar {
		width: 270px;
		flex-shrink: 0;
		background: #ffffff;
		border-right: 1px solid #dcfce7;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: 0;
		height: 100vh;
		z-index: 60;
		box-sizing: border-box;
		padding: 20px 16px;
	}

	.sidebar-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 18px;
		margin-bottom: 18px;
		border-bottom: 1px solid #e4e4e7;
	}

	.sidebar-badge-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.sidebar-shield {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.sidebar-title {
		display: block;
		font-size: 14.5px;
		font-weight: 800;
		color: #09090b;
		line-height: 1.2;
	}

	.sidebar-subtitle {
		display: block;
		font-size: 11px;
		font-weight: 600;
		color: #15803d;
	}

	.sidebar-close-mobile {
		display: none;
		background: transparent;
		border: 1px solid #e4e4e7;
		border-radius: 6px;
		width: 28px;
		height: 28px;
		font-size: 13px;
		color: #18181b;
		cursor: pointer;
	}

	.sidebar-section {
		margin-bottom: 22px;
	}

	.sidebar-section-label {
		display: block;
		font-size: 10.5px;
		font-weight: 800;
		letter-spacing: 0.07em;
		color: #52525b;
		padding: 0 10px;
		margin-bottom: 8px;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.sidebar-link {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 10px 12px;
		border-radius: 10px;
		text-decoration: none;
		color: #18181b;
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.sidebar-link:hover {
		background: #f0fdf4;
		border-color: #bbf7d0;
		color: #09090b;
	}

	.sidebar-link.active {
		background: #f0fdf4;
		border-color: #86efac;
		color: #09090b;
	}

	.sidebar-link-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: #f4f4f5;
		color: #15803d;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.sidebar-link:hover .sidebar-link-icon,
	.sidebar-link.active .sidebar-link-icon {
		background: #dcfce7;
		color: #166534;
	}

	.sidebar-link-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.sidebar-link-name {
		font-size: 13px;
		font-weight: 700;
		color: #09090b;
		line-height: 1.25;
	}

	.sidebar-link-desc {
		font-size: 11px;
		color: #52525b;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-footer {
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid #e4e4e7;
	}

	.sidebar-user-box {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #f0fdf4;
		border: 1px solid #dcfce7;
	}

	.sidebar-user-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #16a34a;
		flex-shrink: 0;
	}

	.sidebar-user-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.sidebar-user-role {
		font-size: 11px;
		font-weight: 800;
		color: #166534;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.sidebar-user-email {
		font-size: 11.5px;
		color: #18181b;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sidebar-backdrop {
		display: none;
	}

	/* =========================================
	   CONTEÚDO PRINCIPAL DO HUB
	   ========================================= */
	.hub-wrapper {
		flex: 1;
		min-width: 0;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #ffffff;
	}

	/* Header */
	.hub-header {
		position: sticky;
		top: 0;
		z-index: 40;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid #e4e4e7;
	}

	.header-inner {
		max-width: 1140px;
		margin: 0 auto;
		padding: 14px 28px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.brand-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.btn-mobile-sidebar {
		display: none;
		align-items: center;
		gap: 6px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
		padding: 7px 11px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 700;
		cursor: pointer;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 12px;
		text-decoration: none;
	}

	.asclepius-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 10px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #15803d;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
	}

	.brand-title {
		font-size: 17px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #09090b;
		line-height: 1.2;
	}

	.brand-sub {
		color: #15803d;
		font-weight: 700;
	}

	.brand-tagline {
		font-size: 11px;
		color: #3f3f46;
		font-weight: 500;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 12.5px;
		color: #09090b;
	}

	.user-status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #16a34a;
	}

	.user-email {
		font-weight: 600;
		color: #09090b;
	}

	.role-pill {
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 8px;
		border-radius: 6px;
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.btn-user-action {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #ffffff;
		border: 1px solid #d4d4d8;
		color: #09090b;
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-user-action:hover {
		background: #f0fdf4;
		border-color: #86efac;
		color: #14532d;
	}

	.btn-logout {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		color: #18181b;
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-logout:hover {
		background: #f4f4f5;
		color: #09090b;
		border-color: #a1a1aa;
	}

	/* Main Hub Body */
	.hub-main {
		max-width: 1140px;
		width: 100%;
		margin: 0 auto;
		padding: 40px 28px 64px;
		flex: 1;
		box-sizing: border-box;
	}

	.hero-banner {
		margin-bottom: 32px;
	}

	.hero-kicker {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
		padding: 4px 11px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.06em;
		margin-bottom: 10px;
	}

	.pulse-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #16a34a;
	}

	.hero-heading {
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.025em;
		color: #09090b;
		margin: 0 0 6px;
	}

	.hero-subtext {
		font-size: 14.5px;
		line-height: 1.5;
		color: #27272a;
		margin: 0;
	}

	/* Cards Grid */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 20px;
	}

	.app-card {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 14px;
		padding: 22px;
		display: flex;
		flex-direction: column;
		transition: all 0.18s ease;
	}

	.active-card {
		border-color: #d4d4d8;
		background: #ffffff;
	}

	.active-card:hover {
		border-color: #16a34a;
		box-shadow: 0 10px 24px -8px rgba(22, 163, 74, 0.16);
		transform: translateY(-2px);
	}

	.disabled-card {
		background: #fafafa;
		border-color: #e4e4e7;
		opacity: 0.72;
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.card-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: #f4f4f5;
		color: #52525b;
	}

	.card-icon-wrap.active-icon {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.badge-status {
		font-size: 11px;
		font-weight: 700;
		padding: 3px 9px;
		border-radius: 9999px;
	}

	.badge-status.online {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}

	.badge-status.muted {
		background: #f4f4f5;
		color: #52525b;
		border: 1px solid #e4e4e7;
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.card-title {
		font-size: 17px;
		font-weight: 800;
		color: #09090b;
		margin: 0 0 3px;
		letter-spacing: -0.01em;
	}

	.card-category {
		font-size: 12px;
		font-weight: 700;
		color: #15803d;
		margin: 0 0 10px;
	}

	.disabled-card .card-category {
		color: #52525b;
	}

	.card-desc {
		font-size: 13.5px;
		line-height: 1.5;
		color: #18181b;
		margin: 0 0 16px;
		flex: 1;
	}

	.card-features {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 18px;
	}

	.feature-tag {
		font-size: 11px;
		font-weight: 600;
		background: #f0fdf4;
		border: 1px solid #dcfce7;
		color: #14532d;
		padding: 3px 8px;
		border-radius: 6px;
	}

	.disabled-card .feature-tag {
		background: #f4f4f5;
		border-color: #e4e4e7;
		color: #52525b;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid #f4f4f5;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		background: #15803d;
		color: #ffffff;
		padding: 10px 14px;
		border-radius: 9px;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
		transition: all 0.15s ease;
		box-sizing: border-box;
	}

	.btn-primary:hover {
		background: #166534;
		box-shadow: 0 4px 12px rgba(21, 128, 61, 0.22);
	}

	.btn-disabled {
		width: 100%;
		background: #f4f4f5;
		color: #52525b;
		border: 1px solid #e4e4e7;
		padding: 10px 14px;
		border-radius: 9px;
		font-size: 13px;
		font-weight: 600;
		cursor: not-allowed;
		box-sizing: border-box;
	}

	/* Footer */
	.hub-footer {
		border-top: 1px solid #e4e4e7;
		background: #ffffff;
		padding: 18px 28px;
	}

	.footer-inner {
		max-width: 1140px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #27272a;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #09090b;
		font-weight: 700;
	}

	.footer-brand svg {
		color: #15803d;
	}

	.footer-links-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.footer-link {
		color: #15803d;
		font-weight: 700;
		text-decoration: none;
	}

	.footer-link:hover {
		text-decoration: underline;
	}

	@media (max-width: 960px) {
		.admin-sidebar {
			position: fixed;
			left: 0;
			top: 0;
			bottom: 0;
			transform: translateX(-100%);
			transition: transform 0.22s ease;
			box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
		}

		.admin-sidebar.mobile-open {
			transform: translateX(0);
		}

		.sidebar-close-mobile {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.sidebar-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(9, 9, 11, 0.35);
			z-index: 55;
		}

		.btn-mobile-sidebar {
			display: inline-flex;
		}
	}

	@media (max-width: 640px) {
		.header-inner {
			padding: 12px 16px;
		}

		.user-email {
			display: none;
		}

		.hub-main {
			padding: 28px 16px 48px;
		}

		.hero-heading {
			font-size: 22px;
		}

		.footer-inner {
			flex-direction: column;
			gap: 8px;
			text-align: center;
		}
	}
</style>
