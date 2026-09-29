<script lang="ts">
	let {
		open = $bindable(false),
		pontuacaoAtual = 0,
		onsave,
		onclose
	}: {
		open: boolean;
		pontuacaoAtual?: number;
		onsave?: (resultado: { score: number; grau: string; resumo: string }) => void;
		onclose?: () => void;
	} = $props();

	// 6 Questões do Teste de Fagerström para Dependência de Nicotina
	let q1 = $state<number | null>(null); // Tempo após acordar
	let q2 = $state<number | null>(null); // Difícil não fumar em locais proibidos
	let q3 = $state<number | null>(null); // Cigarro de maior satisfação
	let q4 = $state<number | null>(null); // Quantidade por dia
	let q5 = $state<number | null>(null); // Fuma mais pela manhã
	let q6 = $state<number | null>(null); // Fuma mesmo doente na cama

	// Score Calculation
	let scoreTotal = $derived(
		(q1 ?? 0) + (q2 ?? 0) + (q3 ?? 0) + (q4 ?? 0) + (q5 ?? 0) + (q6 ?? 0)
	);

	let todasRespondidas = $derived(
		q1 !== null && q2 !== null && q3 !== null && q4 !== null && q5 !== null && q6 !== null
	);

	let grauDependencia = $derived.by(() => {
		if (scoreTotal <= 2) return { nivel: 'Muito Baixa', cor: '#059669', bg: '#ecfdf5', borda: '#a7f3d0' };
		if (scoreTotal <= 4) return { nivel: 'Baixa', cor: '#0d9488', bg: '#f0fdfa', borda: '#99f6e4' };
		if (scoreTotal === 5) return { nivel: 'Média', cor: '#d97706', bg: '#fffbeb', borda: '#fde68a' };
		if (scoreTotal <= 7) return { nivel: 'Elevada', cor: '#ea580c', bg: '#fff7ed', borda: '#fed7aa' };
		return { nivel: 'Muito Elevada', cor: '#dc2626', bg: '#fef2f2', borda: '#fecaca' };
	});

	function handleSalvar() {
		if (!todasRespondidas) {
			alert('Por favor, responda a todas as 6 perguntas do teste para calcular o resultado.');
			return;
		}

		if (onsave) {
			onsave({
				score: scoreTotal,
				grau: grauDependencia.nivel,
				resumo: `Score ${scoreTotal}/10 (Dependência ${grauDependencia.nivel})`
			});
		}
		fechar();
	}

	function fechar() {
		open = false;
		if (onclose) onclose();
	}
</script>

{#if open}
	<div
		class="modal-backdrop fade-in"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) fechar(); }}
		onkeydown={(e) => { if (e.key === 'Escape') fechar(); }}
	>
		<div class="modal-card">
			<!-- Header -->
			<div class="modal-header">
				<div class="modal-title-wrap">
					<div class="modal-icon">
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 2v20"></path>
							<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
						</svg>
					</div>
					<div>
						<h2 class="modal-title">Teste de Fagerström</h2>
						<p class="modal-subtitle">Avaliação do Grau de Dependência à Nicotina</p>
					</div>
				</div>
				<button type="button" class="btn-close" onclick={fechar} title="Fechar">✕</button>
			</div>

			<!-- Body: 6 Perguntas -->
			<div class="modal-body">
				<!-- Questão 1 -->
				<div class="question-card">
					<span class="question-num">1</span>
					<div class="question-content">
						<p class="question-title">Em quanto tempo depois de acordar você fuma o primeiro cigarro?</p>
						<div class="options-grid">
							<label class="option-label" class:selected={q1 === 3}>
								<input type="radio" name="fag-q1" value={3} bind:group={q1} />
								<span class="option-text">Dentro de 5 minutos</span>
								<span class="option-points">3 pts</span>
							</label>
							<label class="option-label" class:selected={q1 === 2}>
								<input type="radio" name="fag-q1" value={2} bind:group={q1} />
								<span class="option-text">6 a 30 minutos</span>
								<span class="option-points">2 pts</span>
							</label>
							<label class="option-label" class:selected={q1 === 1}>
								<input type="radio" name="fag-q1" value={1} bind:group={q1} />
								<span class="option-text">31 a 60 minutos</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q1 === 0}>
								<input type="radio" name="fag-q1" value={0} bind:group={q1} />
								<span class="option-text">Após 60 minutos</span>
								<span class="option-points">0 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Questão 2 -->
				<div class="question-card">
					<span class="question-num">2</span>
					<div class="question-content">
						<p class="question-title">Você acha difícil não fumar em lugares proibidos (como igrejas, cinemas, bibliotecas, hospitais)?</p>
						<div class="options-grid cols-2">
							<label class="option-label" class:selected={q2 === 1}>
								<input type="radio" name="fag-q2" value={1} bind:group={q2} />
								<span class="option-text">Sim</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q2 === 0}>
								<input type="radio" name="fag-q2" value={0} bind:group={q2} />
								<span class="option-text">Não</span>
								<span class="option-points">0 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Questão 3 -->
				<div class="question-card">
					<span class="question-num">3</span>
					<div class="question-content">
						<p class="question-title">Qual o cigarro do dia que traz mais satisfação?</p>
						<div class="options-grid cols-2">
							<label class="option-label" class:selected={q3 === 1}>
								<input type="radio" name="fag-q3" value={1} bind:group={q3} />
								<span class="option-text">O primeiro da manhã</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q3 === 0}>
								<input type="radio" name="fag-q3" value={0} bind:group={q3} />
								<span class="option-text">Outros</span>
								<span class="option-points">0 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Questão 4 -->
				<div class="question-card">
					<span class="question-num">4</span>
					<div class="question-content">
						<p class="question-title">Quantos cigarros você fuma por dia?</p>
						<div class="options-grid">
							<label class="option-label" class:selected={q4 === 0}>
								<input type="radio" name="fag-q4" value={0} bind:group={q4} />
								<span class="option-text">Menos de 10 cigarros/dia</span>
								<span class="option-points">0 pts</span>
							</label>
							<label class="option-label" class:selected={q4 === 1}>
								<input type="radio" name="fag-q4" value={1} bind:group={q4} />
								<span class="option-text">De 11 a 20 cigarros/dia</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q4 === 2}>
								<input type="radio" name="fag-q4" value={2} bind:group={q4} />
								<span class="option-text">De 21 a 30 cigarros/dia</span>
								<span class="option-points">2 pts</span>
							</label>
							<label class="option-label" class:selected={q4 === 3}>
								<input type="radio" name="fag-q4" value={3} bind:group={q4} />
								<span class="option-text">Mais de 30 cigarros/dia</span>
								<span class="option-points">3 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Questão 5 -->
				<div class="question-card">
					<span class="question-num">5</span>
					<div class="question-content">
						<p class="question-title">Você fuma mais frequentemente pela manhã do que no resto do dia?</p>
						<div class="options-grid cols-2">
							<label class="option-label" class:selected={q5 === 1}>
								<input type="radio" name="fag-q5" value={1} bind:group={q5} />
								<span class="option-text">Sim</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q5 === 0}>
								<input type="radio" name="fag-q5" value={0} bind:group={q5} />
								<span class="option-text">Não</span>
								<span class="option-points">0 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Questão 6 -->
				<div class="question-card">
					<span class="question-num">6</span>
					<div class="question-content">
						<p class="question-title">Você fuma mesmo se estiver tão doente que precise ficar de cama a maior parte do dia?</p>
						<div class="options-grid cols-2">
							<label class="option-label" class:selected={q6 === 1}>
								<input type="radio" name="fag-q6" value={1} bind:group={q6} />
								<span class="option-text">Sim</span>
								<span class="option-points">1 pt</span>
							</label>
							<label class="option-label" class:selected={q6 === 0}>
								<input type="radio" name="fag-q6" value={0} bind:group={q6} />
								<span class="option-text">Não</span>
								<span class="option-points">0 pts</span>
							</label>
						</div>
					</div>
				</div>

				<!-- Result Card -->
				<div
					class="fagerstrom-result-card"
					style="background: {grauDependencia.bg}; border-color: {grauDependencia.borda};"
				>
					<div class="result-score-wrap">
						<span class="result-score-val" style="color: {grauDependencia.cor};">{scoreTotal}</span>
						<span class="result-score-max">/ 10 pontos</span>
					</div>
					<div class="result-info">
						<span class="result-label">Grau de Dependência à Nicotina:</span>
						<span class="result-grau" style="color: {grauDependencia.cor};">
							{grauDependencia.nivel}
						</span>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button type="button" class="btn-cancel" onclick={fechar}>Cancelar</button>
				<button type="button" class="btn-save" onclick={handleSalvar}>
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Salvar Resultado no Prontuário</span>
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
		max-width: 640px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.modal-header {
		padding: 16px 22px;
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
		background: #fef2f2;
		color: #dc2626;
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
		padding: 20px 22px;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* Question Card */
	.question-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 14px;
		display: flex;
		gap: 12px;
		transition: border-color 0.15s ease;
	}

	.question-card:hover {
		border-color: #cbd5e1;
	}

	.question-num {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		background: #f1f5f9;
		color: #475569;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.question-content {
		flex: 1;
	}

	.question-title {
		font-size: 13px;
		font-weight: 600;
		color: #0f172a;
		margin: 0 0 10px;
		line-height: 1.4;
	}

	.options-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.options-grid.cols-2 {
		grid-template-columns: 1fr 1fr;
	}

	.option-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		background: #f8fafc;
		cursor: pointer;
		transition: all 0.15s ease;
		user-select: none;
	}

	.option-label:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.option-label.selected {
		background: #eff6ff;
		border-color: #3b82f6;
	}

	.option-label input[type="radio"] {
		display: none;
	}

	.option-text {
		font-size: 12.5px;
		color: #334155;
		font-weight: 500;
	}

	.option-label.selected .option-text {
		color: #1d4ed8;
		font-weight: 600;
	}

	.option-points {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.option-label.selected .option-points {
		background: #3b82f6;
		color: #ffffff;
		border-color: #3b82f6;
	}

	/* Result Card */
	.fagerstrom-result-card {
		border: 1.5px solid;
		border-radius: 10px;
		padding: 14px 18px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.result-score-wrap {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.result-score-val {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 28px;
		font-weight: 800;
		line-height: 1;
	}

	.result-score-max {
		font-size: 13px;
		color: #64748b;
		font-weight: 600;
	}

	.result-info {
		display: flex;
		flex-direction: column;
		text-align: right;
	}

	.result-label {
		font-size: 11.5px;
		color: #64748b;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.result-grau {
		font-size: 18px;
		font-weight: 800;
		font-family: 'Plus Jakarta Sans', sans-serif;
	}

	/* Footer */
	.modal-footer {
		padding: 14px 22px;
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
		.options-grid {
			grid-template-columns: 1fr;
		}

		.fagerstrom-result-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.result-info {
			text-align: left;
		}
	}
</style>
