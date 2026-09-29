<script lang="ts">
	export interface ItemExame {
		id: string;
		nomeExame: string;
		nomeMedico: string;
		dataRealizacao: string;
		resultado: string;
	}

	let {
		open = $bindable(false),
		exameParaEditar = null,
		onsave,
		onclose
	}: {
		open: boolean;
		exameParaEditar?: ItemExame | null;
		onsave?: (exame: ItemExame) => void;
		onclose?: () => void;
	} = $props();

	let nomeExame = $state('');
	let nomeMedico = $state('');
	let dataRealizacao = $state('');
	let resultado = $state('');
	let erro = $state('');

	const sugestoesExames = [
		'Radiografia de Tórax (PA e Perfil)',
		'Radiografia de Abdome Simples',
		'Tomografia Computadorizada de Tórax',
		'Tomografia Computadorizada de Crânio',
		'Tomografia Computadorizada de Abdome e Pelve',
		'Ressonância Magnética de Crânio',
		'Ressonância Magnética de Coluna Lombar',
		'Ultrassonografia de Abdome Total',
		'Ultrassonografia de Vias Urinárias / Rins',
		'Ultrassonografia de Tireoide',
		'Ultrassonografia com Doppler de Carótidas e Vertebrais',
		'Ultrassonografia com Doppler Venoso de Membros Inferiores',
		'Eletrocardiograma (ECG de 12 derivações)',
		'Ecocardiograma Transtorácico com Doppler',
		'Teste Ergométrico / Prova de Esforço',
		'Holter 24 horas',
		'MAPA 24 horas (Monitorização Ambulatorial da PA)',
		'Endoscopia Digestiva Alta (EDA)',
		'Colonoscopia',
		'Espirometria / Prova de Função Pulmonar',
		'Polissonografia Noturna',
		'Mamografia Bilateral',
		'Densitometria Óssea'
	];

	// Sync fields when editing or opening
	$effect(() => {
		if (open) {
			if (exameParaEditar) {
				nomeExame = exameParaEditar.nomeExame;
				nomeMedico = exameParaEditar.nomeMedico;
				dataRealizacao = exameParaEditar.dataRealizacao;
				resultado = exameParaEditar.resultado;
			} else {
				nomeExame = '';
				nomeMedico = '';
				dataRealizacao = new Date().toISOString().split('T')[0];
				resultado = '';
			}
			erro = '';
		}
	});

	function handleSalvar() {
		if (!nomeExame.trim()) {
			erro = 'Por favor, informe o nome do exame.';
			return;
		}

		if (!resultado.trim()) {
			erro = 'Por favor, descreva o resultado / laudo do exame.';
			return;
		}

		const exame: ItemExame = {
			id: exameParaEditar?.id || 'exm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
			nomeExame: nomeExame.trim(),
			nomeMedico: nomeMedico.trim(),
			dataRealizacao: dataRealizacao,
			resultado: resultado.trim()
		};

		if (onsave) onsave(exame);
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
							<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
							<line x1="8" y1="21" x2="16" y2="21"></line>
							<line x1="12" y1="17" x2="12" y2="21"></line>
						</svg>
					</div>
					<div>
						<h2 class="modal-title">
							{exameParaEditar ? 'Editar Exame' : 'Adicionar Exame de Imagem ou Funcional'}
						</h2>
						<p class="modal-subtitle">Registro de laudos de radiografias, tomografias, USG, ECG, ecocardiograma e outros</p>
					</div>
				</div>
				<button type="button" class="btn-close" onclick={fechar} title="Fechar">✕</button>
			</div>

			<!-- Body -->
			<div class="modal-body">
				{#if erro}
					<div class="modal-error-banner fade-in">
						<span>⚠️ {erro}</span>
					</div>
				{/if}

				<div class="modal-form-grid">
					<!-- Nome do Exame com Autocomplete -->
					<div class="modal-form-group span-2">
						<label for="modal-nome-exame" class="modal-label required">
							Nome do exame
							<span class="label-hint">(com sugestões ou texto livre)</span>
						</label>
						<input
							id="modal-nome-exame"
							type="text"
							list="datalist-sugestoes-exames"
							class="modal-input"
							placeholder="Ex: Radiografia de Tórax PA/Perfil, Ecocardiograma, USG Abdome..."
							bind:value={nomeExame}
						/>
						<datalist id="datalist-sugestoes-exames">
							{#each sugestoesExames as s}
								<option value={s}></option>
							{/each}
						</datalist>
					</div>

					<!-- Nome do Médico -->
					<div class="modal-form-group">
						<label for="modal-nome-medico" class="modal-label">
							Nome do médico / executante
							<span class="label-hint">(opcional)</span>
						</label>
						<input
							id="modal-nome-medico"
							type="text"
							class="modal-input"
							placeholder="Ex: Dr(a). Carlos Silva (CRM 12345)"
							bind:value={nomeMedico}
						/>
					</div>

					<!-- Data de Realização -->
					<div class="modal-form-group">
						<label for="modal-data-exame" class="modal-label">
							Data de realização
						</label>
						<input
							id="modal-data-exame"
							type="date"
							class="modal-input"
							bind:value={dataRealizacao}
						/>
					</div>

					<!-- Resultado / Laudo -->
					<div class="modal-form-group span-2">
						<label for="modal-resultado-exame" class="modal-label required">
							Resultado / Conclusão do Laudo
							<span class="label-hint">(achados relevantes, dimensões, alterações estruturais...)</span>
						</label>
						<textarea
							id="modal-resultado-exame"
							class="modal-textarea"
							rows="5"
							placeholder="Descreva o resultado ou laudo do exame...&#10;Ex: Campos pleuropulmonares com transparência preservada. Índice cardiotorácico dentro dos limites da normalidade. Seios costofrênicos e cardiofrênicos livres. Conclusão: Exame dentro dos padrões da normalidade."
							bind:value={resultado}
						></textarea>
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
					<span>{exameParaEditar ? 'Salvar Alterações' : 'Adicionar ao Prontuário'}</span>
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
		max-width: 620px;
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
		background: #ecfdf5;
		color: #059669;
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
		font-size: 11.5px;
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

	.modal-error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #b91c1c;
		font-size: 12.5px;
		font-weight: 600;
		padding: 8px 12px;
		border-radius: 8px;
	}

	.modal-form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	.modal-form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.modal-form-group.span-2 {
		grid-column: 1 / -1;
	}

	.modal-label {
		font-size: 12.5px;
		font-weight: 600;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.modal-label.required::after {
		content: "*";
		color: #e11d48;
		font-weight: 700;
	}

	.label-hint {
		font-size: 11px;
		font-weight: 400;
		color: #94a3b8;
	}

	.modal-input {
		height: 40px;
		padding: 8px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		background: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 13.5px;
		color: #0f172a;
		box-sizing: border-box;
		transition: all 0.15s ease;
	}

	.modal-textarea {
		padding: 10px 12px;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		background: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 13.5px;
		color: #0f172a;
		line-height: 1.5;
		box-sizing: border-box;
		resize: vertical;
		transition: all 0.15s ease;
	}

	.modal-input:focus,
	.modal-textarea:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
	}

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
		background: #059669;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-save:hover {
		background: #047857;
	}

	.fade-in {
		animation: fadeIn 0.18s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.98); }
		to { opacity: 1; transform: scale(1); }
	}

	@media (max-width: 600px) {
		.modal-form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
