<script lang="ts">
</script>

<svelte:head>
	<title>Política de Privacidade e Proteção de Dados — MedicinaHub</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="privacy-page-wrapper">
	<!-- Background grid -->
	<div class="bg-grid"></div>

	<!-- Top Navigation -->
	<header class="privacy-header">
		<div class="header-inner">
			<a href="/" class="btn-back">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="19" y1="12" x2="5" y2="12"></line>
					<polyline points="12 19 5 12 12 5"></polyline>
				</svg>
				<span>Voltar ao Sistema</span>
			</a>
			<div class="brand">
				<div class="asclepius-badge">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
						<line x1="16" y1="3" x2="16" y2="29" stroke-width="2.4"/>
						<circle cx="16" cy="3" r="1.6" fill="currentColor"/>
						<path d="M12 6.5C13.5 5 16 5 17.8 6.4C19.5 7.8 18.8 10 16 11.5C13 13 12.5 15.4 14.5 17.2C16.5 19 19.2 20.2 18.2 22.8C17.4 24.8 14.8 25.5 13 27" stroke-width="2.2"/>
					</svg>
				</div>
				<span class="brand-title">Medicina<span>Hub</span></span>
			</div>
		</div>
	</header>

	<main class="privacy-main">
		<div class="privacy-hero">
			<div class="badge-pill">Privacidade por Design & LGPD</div>
			<h1>Política de Privacidade e Proteção de Dados</h1>
			<p class="hero-subtitle">
				Entenda nosso compromisso inegociável com a segurança, o sigilo profissional e a soberania dos dados médicos.
			</p>
			<div class="hero-meta">
				<span>Última atualização: Agosto de 2026</span>
				<span class="meta-dot">•</span>
				<span>Versão 1.2</span>
			</div>
		</div>

		<!-- Card de Princípio Central -->
		<div class="highlight-card">
			<div class="highlight-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
				</svg>
			</div>
			<div class="highlight-content">
				<h3>Princípio Central: Nenhum Dado de Paciente Vai Para a Nuvem</h3>
				<p>
					Nossa aplicação adota a arquitetura <strong>Client-Side First</strong>. Todas as informações clínicas, anamneses, hipóteses diagnósticas e prescrições registradas no prontuário permanecem <strong>exclusivamente na memória local do seu navegador</strong> (localStorage / IndexedDB). Nenhum dado sensível de paciente trafega para nossos servidores nem é armazenado em banco de dados na nuvem.
				</p>
			</div>
		</div>

		<!-- Seções da Política -->
		<div class="content-sections">
			<!-- 1. Público-Alvo -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">01</span>
					<h2>Público-Alvo e Finalidade da Plataforma</h2>
				</div>
				<p>
					O <strong>MedicinaHub</strong> é uma ferramenta tecnológica de apoio clínico e estruturação de prontuários destinada exclusivamente a <strong>médicos, residentes, estudantes de medicina e profissionais de saúde</strong> devidamente autorizados.
				</p>
				<p>
					A plataforma visa agilizar o raciocínio clínico, o registro mnemônico e a padronização semiológica no atendimento ambulatorial e hospitalar, sempre em consonância com as normas éticas do Conselho Federal de Medicina (CFM).
				</p>
			</section>

			<!-- 2. Dados Coletados na Conta -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">02</span>
					<h2>Dados Coletados na Conta de Usuário</h2>
				</div>
				<p>
					Para a criação e gestão de sua conta de acesso, coletamos exclusivamente os seguintes dados cadastrais:
				</p>
				<ul class="policy-list">
					<li><strong>Nome Completo:</strong> utilizado para personalização do cabeçalho e identificação profissional na plataforma.</li>
					<li><strong>E-mail Profissional:</strong> utilizado como identificador único de login e canal de comunicação exclusivo de segurança.</li>
					<li><strong>Instituição de Vínculo:</strong> hospital, universidade (ex: UFSJ) ou serviço de saúde no qual o profissional atua ou estuda.</li>
					<li><strong>Senha de Acesso:</strong> armazenada de forma estritamente irreversível utilizando criptografia com <strong>Hash SHA-256 + Salt individual de 128 bits</strong>. Sua senha em texto puro nunca é salva, logada ou transmitida.</li>
				</ul>
				<p>
					Esses metadados cadastrais ficam armazenados na infraestrutura global de alta segurança da <strong>Cloudflare</strong> (Cloudflare D1 & Workers).
				</p>
			</section>

			<!-- 3. Dados do Prontuário e Não-Persistência em Nuvem -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">03</span>
					<h2>Dados de Pacientes e Rascunhos de Prontuário</h2>
				</div>
				<p>
					Em estrito cumprimento ao sigilo médico e à Lei Geral de Proteção de Dados:
				</p>
				<div class="feature-box">
					<div class="feature-item">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
						<div>
							<strong>Armazenamento Local no Dispositivo</strong>
							<span>O rascunho do atendimento em andamento fica gravado temporariamente apenas no armazenamento interno do seu navegador (localStorage).</span>
						</div>
					</div>
					<div class="feature-item">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
						<div>
							<strong>Zero Tráfego para o Backend</strong>
							<span>Ao preencher sintomas, sinais vitais, exames ou medicações, nenhum dado clínico é transmitido via HTTP para nossos servidores.</span>
						</div>
					</div>
					<div class="feature-item">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
						<div>
							<strong>Exportação e Limpeza Sob Controle do Usuário</strong>
							<span>A cópia do texto SOAP ou a geração de PDF é processada localmente na sua máquina. Ao clicar em "Limpar Formulário", todos os dados são apagados imediatamente do seu navegador.</span>
						</div>
					</div>
				</div>
			</section>

			<!-- 4. Compartilhamento de Dados -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">04</span>
					<h2>Compartilhamento com Terceiros</h2>
				</div>
				<p>
					<strong>Não compartilhamos, não vendemos e não transferimos dados cadastrais de nossos usuários a terceiros</strong> ou a empresas parceiras.
				</p>
				<p>
					Os dados da conta serão utilizados <strong>somente se for estritamente necessário entrar em contato com o profissional em situações excepcionais</strong>, tais como questões críticas de segurança da conta ou comunicados operacionais importantes sobre o serviço.
				</p>
			</section>

			<!-- 5. Uso de Cookies e Armazenamento Local -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">05</span>
					<h2>Política de Cookies e Sessão</h2>
				</div>
				<p>
					Utilizamos exclusivamente cookies técnicos necessários para as seguintes finalidades essenciais:
				</p>
				<ul class="policy-list">
					<li><strong>Manutenção de Sessão Autenticada:</strong> cookie HTTP-Only seguro para identificar o login do profissional.</li>
					<li><strong>Preservação Local do Atendimento:</strong> recursos nativos do navegador (localStorage) para que você não perca seu preenchimento caso a página seja recarregada involuntariamente.</li>
				</ul>
				<p>
					Não utilizamos cookies de rastreamento de terceiros, pixels de redes sociais ou ferramentas invasivas de perfilamento comercial.
				</p>
			</section>

			<!-- 6. Exclusão de Conta e Direitos do Titular -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">06</span>
					<h2>Exclusão de Conta e Direitos do Titular</h2>
				</div>
				<p>
					Em conformidade com a LGPD, o titular da conta tem o direito de solicitar a confirmação, correção e eliminação definitiva de seus dados cadastrais a qualquer momento.
				</p>
				<div class="delete-account-card">
					<div class="delete-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="3 6 5 6 21 6"></polyline>
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						</svg>
					</div>
					<div class="delete-info">
						<h4>Como solicitar a exclusão da sua conta:</h4>
						<p>
							Envie um e-mail a partir do endereço cadastrado para <strong>valdotaincode@gmail.com</strong> com o assunto <strong>"Excluir conta"</strong>. Todos os seus dados de usuário e sessões associadas serão permanentemente removidos de nossa infraestrutura em até 48 horas úteis.
						</p>
					</div>
				</div>
			</section>

			<!-- 7. Conformidade com a LGPD -->
			<section class="policy-section">
				<div class="section-title-wrap">
					<span class="section-num">07</span>
					<h2>Conformidade com a LGPD (Lei nº 13.709/2018)</h2>
				</div>
				<p>
					O MedicinaHub foi arquitetado sob o conceito de <em>Privacy by Design and by Default</em>. Ao não armazenar prontuários de pacientes em servidores externos, reduzimos drasticamente o risco de incidentes de segurança cibernética e vazamento de dados sensíveis de saúde, oferecendo aos médicos e instituições parceiras máxima tranquilidade regulatória.
				</p>
			</section>
		</div>

		<!-- Rodapé da Página -->
		<footer class="privacy-footer">
			<div class="footer-brand">
				<span>MedicinaHub • Sistema de Prontuários Clínicos</span>
			</div>
			<div class="footer-actions">
				<a href="/" class="footer-link">Página Inicial</a>
				<a href="/login" class="footer-link">Acesso / Login</a>
				<a href="mailto:valdotaincode@gmail.com" class="footer-link">Suporte: valdotaincode@gmail.com</a>
			</div>
			<p class="copyright">© 2026 MedicinaHub. Todos os direitos reservados.</p>
		</footer>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #f8fafc;
		font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
		color: #1e293b;
		line-height: 1.6;
	}

	.privacy-page-wrapper {
		min-height: 100vh;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.bg-grid {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
		background-size: 24px 24px;
		opacity: 0.6;
		pointer-events: none;
		z-index: 0;
	}

	/* ── Header ── */
	.privacy-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid #e2e8f0;
		height: 60px;
		display: flex;
		align-items: center;
	}

	.header-inner {
		max-width: 900px;
		width: 100%;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.btn-back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		text-decoration: none;
		color: #475569;
		font-size: 13px;
		font-weight: 600;
		padding: 6px 12px;
		border-radius: 8px;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		transition: all 0.15s ease;
	}

	.btn-back:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.asclepius-badge {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: linear-gradient(135deg, #0284c7, #0369a1);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.brand-title {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.01em;
	}

	.brand-title span {
		color: #0284c7;
	}

	/* ── Main ── */
	.privacy-main {
		position: relative;
		z-index: 10;
		max-width: 860px;
		width: 100%;
		margin: 0 auto;
		padding: 40px 20px 80px;
		display: flex;
		flex-direction: column;
		gap: 28px;
	}

	.privacy-hero {
		text-align: center;
		padding-bottom: 8px;
	}

	.badge-pill {
		display: inline-flex;
		padding: 4px 12px;
		border-radius: 20px;
		background: #e0f2fe;
		color: #0369a1;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 12px;
	}

	.privacy-hero h1 {
		font-size: 30px;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 10px;
		letter-spacing: -0.02em;
	}

	.hero-subtitle {
		font-size: 15px;
		color: #64748b;
		margin: 0 0 12px;
		max-width: 680px;
		margin-left: auto;
		margin-right: auto;
	}

	.hero-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 12px;
		color: #94a3b8;
	}

	.meta-dot {
		opacity: 0.5;
	}

	/* ── Highlight Card ── */
	.highlight-card {
		background: #ffffff;
		border: 2px solid #38bdf8;
		border-radius: 14px;
		padding: 22px 24px;
		display: flex;
		gap: 16px;
		align-items: flex-start;
		box-shadow: 0 4px 20px rgba(56, 189, 248, 0.12);
	}

	.highlight-icon {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: #e0f2fe;
		color: #0284c7;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.highlight-content h3 {
		margin: 0 0 6px;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}

	.highlight-content p {
		margin: 0;
		font-size: 13.5px;
		color: #334155;
		line-height: 1.55;
	}

	/* ── Content Sections ── */
	.content-sections {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 16px;
		padding: 32px 36px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.policy-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.policy-section:not(:last-child) {
		padding-bottom: 28px;
		border-bottom: 1px solid #f1f5f9;
	}

	.section-title-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-num {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 800;
		color: #0284c7;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		padding: 2px 7px;
		border-radius: 6px;
	}

	.policy-section h2 {
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		color: #0f172a;
	}

	.policy-section p {
		margin: 0;
		font-size: 14px;
		color: #475569;
		line-height: 1.65;
	}

	.policy-list {
		margin: 0;
		padding-left: 20px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 13.5px;
		color: #475569;
	}

	.policy-list li strong {
		color: #1e293b;
	}

	/* Feature Box */
	.feature-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 4px;
	}

	.feature-item {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.feature-item svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.feature-item div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.feature-item strong {
		font-size: 13.5px;
		color: #0f172a;
	}

	.feature-item span {
		font-size: 12.5px;
		color: #64748b;
		line-height: 1.45;
	}

	/* Delete Account Card */
	.delete-account-card {
		background: #fef2f2;
		border: 1.5px solid #fecaca;
		border-radius: 12px;
		padding: 18px 20px;
		display: flex;
		gap: 14px;
		align-items: flex-start;
	}

	.delete-icon {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		background: #fee2e2;
		color: #dc2626;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.delete-info h4 {
		margin: 0 0 4px;
		font-size: 14.5px;
		font-weight: 700;
		color: #991b1b;
	}

	.delete-info p {
		margin: 0;
		font-size: 13px;
		color: #7f1d1d;
		line-height: 1.55;
	}

	.delete-info strong {
		color: #450a0a;
	}

	/* ── Footer ── */
	.privacy-footer {
		text-align: center;
		padding-top: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.footer-brand {
		font-size: 13px;
		font-weight: 600;
		color: #64748b;
	}

	.footer-actions {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.footer-link {
		font-size: 12.5px;
		color: #0284c7;
		text-decoration: none;
	}

	.footer-link:hover {
		text-decoration: underline;
	}

	.copyright {
		margin: 0;
		font-size: 11.5px;
		color: #94a3b8;
	}

	@media (max-width: 640px) {
		.content-sections {
			padding: 20px 18px;
		}

		.privacy-hero h1 {
			font-size: 24px;
		}

		.highlight-card {
			flex-direction: column;
		}
	}
</style>
