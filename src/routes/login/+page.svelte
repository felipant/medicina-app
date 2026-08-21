<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();

	let mode: 'login' | 'register' = $state('login');
	let email = $state(form?.email || '');
	let password = $state('');
	let showPassword = $state(false);
	let loading = $state(false);

	function toggleMode() {
		mode = mode === 'login' ? 'register' : 'login';
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Login' : 'Cadastro'} — Hub de Medicina</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="login-wrapper">
	<!-- Glowing background effect -->
	<div class="glow-bg"></div>
	<div class="grid-overlay"></div>

	<main class="login-card">
		<header class="brand-header">
			<div class="icon-badge">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
					<path d="M12 5v14"/>
				</svg>
			</div>
			<h1>Medicina<span>Hub</span></h1>
			<p class="subtitle">Acesse a plataforma de saúde & prontuários clínicos</p>
		</header>

		{#if form?.error}
			<div class="error-banner">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
					<line x1="12" y1="8" x2="12" y2="12"/>
					<line x1="12" y1="16" x2="12.01" y2="16"/>
				</svg>
				<span>{form.error}</span>
			</div>
		{/if}

		<form
			method="POST"
			action="?/{mode}"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="form-group">
				<label for="email">E-mail Profissional</label>
				<div class="input-container">
					<svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="20" height="16" x="2" y="4" rx="2"/>
						<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
					</svg>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						placeholder="medico@hospital.com.br"
						required
						autocomplete="email"
					/>
				</div>
			</div>

			<div class="form-group">
				<div class="label-row">
					<label for="password">Senha de Acesso</label>
				</div>
				<div class="input-container">
					<svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
					<input
						type={showPassword ? 'text' : 'password'}
						id="password"
						name="password"
						bind:value={password}
						placeholder="••••••••••••"
						required
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
					/>
					<button
						type="button"
						class="toggle-eye"
						onclick={() => (showPassword = !showPassword)}
						tabindex="-1"
					>
						{#if showPassword}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
								<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
								<path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
								<line x1="2" y1="2" x2="22" y2="22"/>
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button type="submit" class="submit-btn" disabled={loading}>
				{#if loading}
					<div class="spinner"></div>
					<span>Processando...</span>
				{:else}
					<span>{mode === 'login' ? 'Entrar no Sistema' : 'Criar Minha Conta'}</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="5" y1="12" x2="19" y2="12"/>
						<polyline points="12 5 19 12 12 19"/>
					</svg>
				{/if}
			</button>
		</form>

		<footer class="card-footer">
			<p>
				{mode === 'login' ? 'Primeiro acesso na plataforma?' : 'Já possui uma conta registrada?'}
				<button type="button" class="switch-btn" onclick={toggleMode}>
					{mode === 'login' ? 'Cadastre-se' : 'Fazer Login'}
				</button>
			</p>
			<div class="security-tag">
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
				</svg>
				<span>Criptografia SHA-256 + Salt</span>
			</div>
		</footer>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #090a0f;
		font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
		color: #e2e8f0;
	}

	.login-wrapper {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		overflow: hidden;
		background: #090a0f;
	}

	.glow-bg {
		position: absolute;
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.08) 40%, rgba(0, 0, 0, 0) 70%);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
		background-size: 32px 32px;
		opacity: 0.4;
		pointer-events: none;
	}

	.login-card {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 420px;
		background: rgba(18, 20, 29, 0.75);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		padding: 36px 32px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.brand-header {
		text-align: center;
		margin-bottom: 28px;
	}

	.icon-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2));
		border: 1px solid rgba(56, 189, 248, 0.3);
		color: #38bdf8;
		margin-bottom: 12px;
	}

	.brand-header h1 {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #ffffff;
	}

	.brand-header h1 span {
		color: #38bdf8;
		font-weight: 300;
	}

	.subtitle {
		margin: 6px 0 0;
		font-size: 13px;
		color: #94a3b8;
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 10px;
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		padding: 12px 14px;
		border-radius: 10px;
		font-size: 13px;
		margin-bottom: 20px;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		font-size: 12.5px;
		font-weight: 600;
		color: #cbd5e1;
		margin-bottom: 8px;
		letter-spacing: 0.01em;
	}

	.input-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 14px;
		color: #64748b;
		pointer-events: none;
		transition: color 0.2s;
	}

	.input-container input {
		width: 100%;
		background: rgba(10, 12, 18, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		padding: 13px 40px 13px 42px;
		font-size: 14px;
		color: #ffffff;
		outline: none;
		transition: all 0.2s ease;
	}

	.input-container input:focus {
		border-color: #38bdf8;
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
		background: rgba(15, 23, 42, 0.9);
	}

	.input-container input:focus + .input-icon,
	.input-container input:focus ~ .input-icon {
		color: #38bdf8;
	}

	.toggle-eye {
		position: absolute;
		right: 12px;
		background: none;
		border: none;
		color: #64748b;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.2s;
	}

	.toggle-eye:hover {
		color: #cbd5e1;
	}

	.submit-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		background: linear-gradient(135deg, #0284c7, #2563eb);
		color: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 14px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 8px;
		box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
	}

	.submit-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, #0369a1, #1d4ed8);
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.card-footer {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		text-align: center;
	}

	.card-footer p {
		margin: 0 0 14px;
		font-size: 13px;
		color: #94a3b8;
	}

	.switch-btn {
		background: none;
		border: none;
		color: #38bdf8;
		font-weight: 600;
		cursor: pointer;
		padding: 0 4px;
		font-size: 13px;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.switch-btn:hover {
		color: #7dd3fc;
	}

	.security-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #64748b;
		background: rgba(255, 255, 255, 0.03);
		padding: 4px 10px;
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}
</style>
