<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Hub de Medicina — Painel Clínico</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="hub-wrapper">
	<!-- Subtle light background elements -->
	<div class="bg-grid"></div>

	<!-- Top Navigation -->
	<header class="hub-header">
		<div class="header-inner">
			<div class="brand">
				<div class="asclepius-badge">
					<!-- Bastão de Asclépio SVG -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 32 32"
						width="22"
						height="22"
						fill="none"
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<!-- Bastão (Vara vertical) -->
						<line
							x1="16"
							y1="3"
							x2="16"
							y2="29"
							stroke-width="2.4"
						/>
						<circle cx="16" cy="3" r="1.6" fill="currentColor" />
						<!-- Serpente de Asclépio entrelaçada -->
						<path
							d="M12 6.5C13.5 5 16 5 17.8 6.4C19.5 7.8 18.8 10 16 11.5C13 13 12.5 15.4 14.5 17.2C16.5 19 19.2 20.2 18.2 22.8C17.4 24.8 14.8 25.5 13 27"
							stroke-width="2.2"
						/>
					</svg>
				</div>
				<div class="brand-text">
					<span class="brand-title"
						>Medicina<span class="brand-sub">App</span></span
					>
					<span class="brand-tagline">Plataforma Clínica</span>
				</div>
			</div>

			<div class="user-section">
				<div class="user-info">
					<span class="user-status-dot"></span>
					<span class="user-email">{data.user.email}</span>
					<span class="role-pill {data.user.role}"
						>{data.user.role === "admin"
							? "Administrador"
							: "Médico"}</span
					>
				</div>
				<form action="/logout" method="POST">
					<button
						type="submit"
						class="btn-logout"
						title="Encerrar sessão"
					>
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

	<!-- Main Content -->
	<main class="hub-main">
		<!-- Hero Banner Minimalista -->
		<section class="hero-banner">
			<div class="hero-content">
				<div class="section-kicker">
					<span class="kicker-icon">
						<!-- Mini Bastão de Asclépio -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line
								x1="16"
								y1="4"
								x2="16"
								y2="28"
								stroke-width="2.5"
							/>
							<path
								d="M12 8C13.5 6.5 16 6.5 17.5 8C19 9.5 18 11.5 16 13C13.5 14.5 13 16.5 15 18C17 19.5 18.5 21 17.5 23C16.8 24.5 14.5 25 13 26.5"
								stroke-width="2"
							/>
						</svg>
					</span>
					<span>SISTEMA DE APOIO CLÍNICO</span>
				</div>
				<h1 class="hero-heading">Módulos & Aplicações Médicas</h1>
				<p class="hero-subtext">
					Prontuário estruturado, exame físico guiado, suporte a
					decisões terapêuticas e acompanhamento longitudinal.
				</p>
			</div>
		</section>

		<!-- Cards Grid -->
		<section class="cards-grid">
			<!-- Application 1: Anamnese Pediátrica (Active) -->
			<div class="app-card active-card">
				<div class="card-top">
					<div class="card-icon-wrap active-icon">
						<!-- Bastão de Asclépio + Prontuário Clínico -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 32 32"
							width="28"
							height="28"
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<!-- Staff & Snake -->
							<line
								x1="16"
								y1="4"
								x2="16"
								y2="28"
								stroke-width="2.2"
							/>
							<circle
								cx="16"
								cy="4"
								r="1.4"
								fill="currentColor"
							/>
							<path
								d="M12 7.5C13.5 6.2 16 6.2 17.8 7.5C19.4 8.8 18.6 11 16 12.4C13.2 13.8 12.6 16.2 14.6 18C16.6 19.6 19 20.8 18 23.2C17.2 25 14.8 25.6 13 27"
								stroke-width="2"
							/>
						</svg>
					</div>
					<span class="badge-status online">Disponível</span>
				</div>

				<div class="card-body">
					<h2 class="card-title">Anamnese Pediátrica</h2>
					<p class="card-category">
						Prontuário Eletrônico Pediátrico & Puericultura
					</p>
					<p class="card-desc">
						Avaliação pediátrica completa com 20 seções
						padronizadas, marcos do desenvolvimento (DNPM), cálculo
						automático de IMC/Z-score, busca de medicamentos e
						exportação em PDF.
					</p>

					<div class="card-features">
						<span class="feature-tag">SOAP</span>
						<span class="feature-tag">Marcos DNPM</span>
						<span class="feature-tag">Calculadora IMC</span>
						<span class="feature-tag">Medicamentos</span>
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

			<!-- Application 2: Calculadora Cardiológica (Coming Soon) -->
			<div class="app-card disabled-card">
				<div class="card-top">
					<div class="card-icon-wrap">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
							/>
							<polyline
								points="3.22 12 7 12 9 8 12 16 14 12 20.78 12"
							/>
						</svg>
					</div>
					<span class="badge-status muted">Em Breve</span>
				</div>

				<div class="card-body">
					<h2 class="card-title">Cardiologia & Hemodinâmica</h2>
					<p class="card-category">
						Calculadoras Clínicas & Escores de Risco
					</p>
					<p class="card-desc">
						Estratificação de risco cardiovascular (Framingham,
						GRACE, TIMI), cálculo de clearance de creatinina,
						dosagem de drogas vasoativas e ajuste por peso corporal.
					</p>
				</div>

				<div class="card-footer">
					<button type="button" class="btn-disabled" disabled
						>Módulo em Planejamento</button
					>
				</div>
			</div>

			<!-- Application 3: Urgência & Emergência (Coming Soon) -->
			<div class="app-card disabled-card">
				<div class="card-top">
					<div class="card-icon-wrap">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polygon
								points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
							/>
						</svg>
					</div>
					<span class="badge-status muted">Em Breve</span>
				</div>

				<div class="card-body">
					<h2 class="card-title">Pronto-Atendimento & Triagem</h2>
					<p class="card-category">Protocolos de Resposta Rápida</p>
					<p class="card-desc">
						Classificação de risco conforme Protocolo de Manchester,
						condutas em sepse, ressuscitação cardiopulmonar
						(PALS/ACLS) e fluxogramas de urgência médica.
					</p>
				</div>

				<div class="card-footer">
					<button type="button" class="btn-disabled" disabled
						>Módulo em Planejamento</button
					>
				</div>
			</div>
		</section>
	</main>

	<!-- Minimal Footer -->
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
				<span>MedicinaApp · Plataforma para Profissionais de Saúde</span
				>
			</div>
			<div class="footer-copy">
				Desenvolvido para atendimento clínico de alta precisão
			</div>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
		font-family:
			"Plus Jakarta Sans",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		color: #0f172a;
		-webkit-font-smoothing: antialiased;
	}

	.hub-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f8fafc;
		position: relative;
	}

	.bg-grid {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
				to right,
				rgba(226, 232, 240, 0.6) 1px,
				transparent 1px
			),
			linear-gradient(
				to bottom,
				rgba(226, 232, 240, 0.6) 1px,
				transparent 1px
			);
		background-size: 48px 48px;
		pointer-events: none;
		opacity: 0.7;
	}

	/* Header */
	.hub-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid #e2e8f0;
	}

	.header-inner {
		max-width: 1180px;
		margin: 0 auto;
		padding: 14px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
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
		background: #f0fdfa;
		border: 1px solid #ccfbf1;
		color: #0d9488;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
	}

	.brand-title {
		font-size: 17px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #0f172a;
		line-height: 1.2;
	}

	.brand-sub {
		color: #0d9488;
		font-weight: 500;
	}

	.brand-tagline {
		font-size: 11px;
		color: #64748b;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.user-section {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 8px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 12.5px;
		color: #334155;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.user-status-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #10b981;
	}

	.user-email {
		font-weight: 500;
	}

	.role-pill {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 2px 7px;
		border-radius: 6px;
	}

	.role-pill.admin {
		background: #fef2f2;
		color: #b91c1c;
		border: 1px solid #fecaca;
	}

	.role-pill.med {
		background: #f0fdfa;
		color: #0f766e;
		border: 1px solid #ccfbf1;
	}

	.btn-logout {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		color: #64748b;
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 12.5px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-logout:hover {
		background: #fef2f2;
		color: #dc2626;
		border-color: #fecaca;
	}

	/* Main Hub Body */
	.hub-main {
		position: relative;
		z-index: 10;
		max-width: 1180px;
		width: 100%;
		margin: 0 auto;
		padding: 48px 24px 72px;
		flex: 1;
	}

	.hero-banner {
		margin-bottom: 40px;
	}

	.section-kicker {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #f0fdfa;
		border: 1px solid #ccfbf1;
		color: #0f766e;
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		margin-bottom: 12px;
	}

	.kicker-icon {
		display: flex;
		align-items: center;
		color: #0d9488;
	}

	.hero-heading {
		font-size: 32px;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: #0f172a;
		margin: 0 0 10px;
	}

	.hero-subtext {
		font-size: 15px;
		line-height: 1.6;
		color: #64748b;
		max-width: 680px;
		margin: 0;
	}

	/* Cards Grid */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 24px;
	}

	.app-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 16px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
	}

	.active-card {
		border-color: #cbd5e1;
		background: #ffffff;
	}

	.active-card:hover {
		border-color: #0d9488;
		box-shadow:
			0 12px 28px -6px rgba(13, 148, 136, 0.12),
			0 4px 10px rgba(0, 0, 0, 0.04);
		transform: translateY(-2px);
	}

	.disabled-card {
		background: #fafafa;
		border-color: #eaeaea;
		opacity: 0.75;
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
	}

	.card-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 12px;
		background: #f1f5f9;
		color: #64748b;
	}

	.card-icon-wrap.active-icon {
		background: #f0fdfa;
		color: #0d9488;
		border: 1px solid #ccfbf1;
	}

	.badge-status {
		font-size: 11px;
		font-weight: 600;
		padding: 3px 9px;
		border-radius: 9999px;
	}

	.badge-status.online {
		background: #ecfdf5;
		color: #059669;
		border: 1px solid #a7f3d0;
	}

	.badge-status.muted {
		background: #f1f5f9;
		color: #64748b;
		border: 1px solid #e2e8f0;
	}

	.card-body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.card-title {
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
		margin: 0 0 4px;
		letter-spacing: -0.01em;
	}

	.card-category {
		font-size: 12px;
		font-weight: 600;
		color: #0d9488;
		margin: 0 0 12px;
	}

	.disabled-card .card-category {
		color: #94a3b8;
	}

	.card-desc {
		font-size: 13.5px;
		line-height: 1.55;
		color: #475569;
		margin: 0 0 18px;
		flex: 1;
	}

	.card-features {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 22px;
	}

	.feature-tag {
		font-size: 11px;
		font-weight: 500;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		color: #334155;
		padding: 3px 8px;
		border-radius: 6px;
	}

	.card-footer {
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid #f1f5f9;
	}

	.btn-primary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		background: #0f766e;
		color: #ffffff;
		padding: 11px 16px;
		border-radius: 10px;
		text-decoration: none;
		font-size: 13.5px;
		font-weight: 600;
		transition: all 0.15s ease;
		box-sizing: border-box;
	}

	.btn-primary:hover {
		background: #115e59;
		box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
	}

	.btn-disabled {
		width: 100%;
		background: #f1f5f9;
		color: #94a3b8;
		border: 1px solid #e2e8f0;
		padding: 10px 16px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		cursor: not-allowed;
		box-sizing: border-box;
	}

	/* Footer */
	.hub-footer {
		border-top: 1px solid #e2e8f0;
		background: #ffffff;
		padding: 20px 24px;
		position: relative;
		z-index: 10;
	}

	.footer-inner {
		max-width: 1180px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 12px;
		color: #64748b;
	}

	.footer-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #0f766e;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.header-inner {
			padding: 12px 16px;
		}

		.user-email {
			display: none;
		}

		.hub-main {
			padding: 32px 16px 56px;
		}

		.hero-heading {
			font-size: 24px;
		}

		.footer-inner {
			flex-direction: column;
			gap: 8px;
			text-align: center;
		}
	}
</style>
