<script lang="ts">
	interface Props {
		isOpen?: boolean;
		onClose?: () => void;
	}

	let { isOpen = $bindable(false), onClose }: Props = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let showCurrent = $state(false);
	let showNew = $state(false);
	let showConfirm = $state(false);

	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	function resetFields() {
		currentPassword = '';
		newPassword = '';
		confirmPassword = '';
		showCurrent = false;
		showNew = false;
		showConfirm = false;
		errorMessage = '';
		successMessage = '';
		isSubmitting = false;
	}

	function handleClose() {
		resetFields();
		isOpen = false;
		if (onClose) onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			handleClose();
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			errorMessage = 'Preencha todos os campos.';
			return;
		}

		if (newPassword.length < 6) {
			errorMessage = 'A nova senha deve possuir pelo menos 6 caracteres.';
			return;
		}

		if (newPassword !== confirmPassword) {
			errorMessage = 'A confirmação de senha não confere com a nova senha.';
			return;
		}

		if (newPassword === currentPassword) {
			errorMessage = 'A nova senha deve ser diferente da senha atual.';
			return;
		}

		isSubmitting = true;

		try {
			const res = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword,
					newPassword,
					confirmPassword
				})
			});

			const data = (await res.json()) as any;

			if (!res.ok || !data?.success) {
				errorMessage = data?.error || 'Não foi possível alterar a senha.';
				isSubmitting = false;
				return;
			}

			successMessage = data?.message || 'Senha alterada com sucesso!';
			setTimeout(() => {
				handleClose();
			}, 1800);
		} catch (err) {
			errorMessage = 'Falha de comunicação com o servidor. Tente novamente.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={handleClose}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div class="header-icon-badge">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
				</div>
				<div class="header-titles">
					<h3 class="modal-title">Alterar Senha</h3>
					<p class="modal-subtitle">Atualize a sua credencial de acesso à plataforma</p>
				</div>
				<button type="button" class="btn-close" onclick={handleClose} aria-label="Fechar">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="modal-body">
				{#if errorMessage}
					<div class="alert alert-error">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" y1="8" x2="12" y2="12"/>
							<line x1="12" y1="16" x2="12.01" y2="16"/>
						</svg>
						<span>{errorMessage}</span>
					</div>
				{/if}

				{#if successMessage}
					<div class="alert alert-success">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12"/>
						</svg>
						<span>{successMessage}</span>
					</div>
				{/if}

				<div class="form-group">
					<label for="current-password" class="field-label">Senha Atual</label>
					<div class="input-password-wrapper">
						<input
							type={showCurrent ? 'text' : 'password'}
							id="current-password"
							bind:value={currentPassword}
							placeholder="Informe sua senha atual"
							class="form-input"
							required
							autocomplete="current-password"
							disabled={isSubmitting}
						/>
						<button
							type="button"
							class="btn-toggle-eye"
							onclick={() => (showCurrent = !showCurrent)}
							tabindex="-1"
							title={showCurrent ? 'Ocultar senha' : 'Ver senha'}
						>
							{#if showCurrent}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
									<line x1="1" y1="1" x2="23" y2="23"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<div class="form-group">
					<label for="new-password" class="field-label">Nova Senha</label>
					<div class="input-password-wrapper">
						<input
							type={showNew ? 'text' : 'password'}
							id="new-password"
							bind:value={newPassword}
							placeholder="Mínimo de 6 caracteres"
							class="form-input"
							required
							minlength="6"
							autocomplete="new-password"
							disabled={isSubmitting}
						/>
						<button
							type="button"
							class="btn-toggle-eye"
							onclick={() => (showNew = !showNew)}
							tabindex="-1"
							title={showNew ? 'Ocultar senha' : 'Ver senha'}
						>
							{#if showNew}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
									<line x1="1" y1="1" x2="23" y2="23"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							{/if}
						</button>
					</div>
					{#if newPassword && newPassword.length < 6}
						<span class="field-hint warning">A senha precisa ter no mínimo 6 caracteres ({newPassword.length}/6).</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="confirm-password" class="field-label">Confirmar Nova Senha</label>
					<div class="input-password-wrapper">
						<input
							type={showConfirm ? 'text' : 'password'}
							id="confirm-password"
							bind:value={confirmPassword}
							placeholder="Repita a nova senha"
							class="form-input"
							required
							minlength="6"
							autocomplete="new-password"
							disabled={isSubmitting}
						/>
						<button
							type="button"
							class="btn-toggle-eye"
							onclick={() => (showConfirm = !showConfirm)}
							tabindex="-1"
							title={showConfirm ? 'Ocultar senha' : 'Ver senha'}
						>
							{#if showConfirm}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
									<line x1="1" y1="1" x2="23" y2="23"/>
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
							{/if}
						</button>
					</div>
					{#if confirmPassword && newPassword !== confirmPassword}
						<span class="field-hint warning">As senhas digitadas não são idênticas.</span>
					{/if}
				</div>

				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={handleClose} disabled={isSubmitting}>
						Cancelar
					</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting || (newPassword.length < 6) || (newPassword !== confirmPassword)}>
						{#if isSubmitting}
							<span class="spinner"></span>
							<span>Atualizando...</span>
						{:else}
							<span>Salvar Nova Senha</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.7);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 16px;
		animation: overlayFadeIn 0.2s ease-out;
	}

	.modal-card {
		background: #ffffff;
		border-radius: 16px;
		width: 100%;
		max-width: 440px;
		box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 20px 24px 16px;
		border-bottom: 1px solid #f1f5f9;
		position: relative;
	}

	.header-icon-badge {
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

	.header-titles {
		flex: 1;
	}

	.modal-title {
		font-size: 17px;
		font-weight: 700;
		color: #0f172a;
		margin: 0;
		letter-spacing: -0.01em;
	}

	.modal-subtitle {
		font-size: 12.5px;
		color: #64748b;
		margin: 2px 0 0;
	}

	.btn-close {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 6px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
		margin: -4px -8px 0 0;
	}

	.btn-close:hover {
		background: #f1f5f9;
		color: #334155;
	}

	.modal-body {
		padding: 20px 24px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 13px;
		font-weight: 600;
		color: #334155;
	}

	.input-password-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.form-input {
		width: 100%;
		padding: 10px 42px 10px 14px;
		border: 1.5px solid #cbd5e1;
		border-radius: 10px;
		font-size: 14px;
		color: #0f172a;
		background: #f8fafc;
		transition: all 0.2s;
		outline: none;
	}

	.form-input:focus {
		background: #ffffff;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-toggle-eye {
		position: absolute;
		right: 10px;
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 0.15s;
	}

	.btn-toggle-eye:hover {
		color: #475569;
	}

	.field-hint {
		font-size: 11.5px;
		margin-top: 2px;
	}

	.field-hint.warning {
		color: #e11d48;
	}

	.alert {
		padding: 10px 14px;
		border-radius: 10px;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		animation: alertSlideIn 0.2s ease-out;
	}

	.alert-error {
		background: #fff1f2;
		color: #be123c;
		border: 1px solid #fecdd3;
	}

	.alert-success {
		background: #f0fdf4;
		color: #15803d;
		border: 1px solid #bbf7d0;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 8px;
		padding-top: 14px;
		border-top: 1px solid #f1f5f9;
	}

	.btn-secondary {
		padding: 9px 16px;
		border-radius: 10px;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		color: #475569;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #e2e8f0;
		color: #1e293b;
	}

	.btn-primary {
		padding: 9px 20px;
		border-radius: 10px;
		background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
		border: none;
		color: #ffffff;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
		transition: all 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
		box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes overlayFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalScaleIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(6px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@keyframes alertSlideIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
