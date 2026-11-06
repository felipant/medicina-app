<script lang="ts">
	import type { SerializedAlert } from '../types';

	let {
		alerts = []
	}: {
		alerts: SerializedAlert[];
	} = $props();

	function scrollToField(fieldId: string) {
		if (typeof document === 'undefined') return;
		const el = document.getElementById(`field-${fieldId}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
</script>

<aside
	class="alert-panel"
	class:has-alerts={alerts.length > 0}
	aria-live="polite"
	aria-label="Painel de pontos de atenção"
>
	{#if alerts.length === 0}
		<div class="alert-empty">
			<span class="status-ok-dot" aria-hidden="true"></span>
			<span>Nenhum ponto de atenção identificado até o momento.</span>
		</div>
	{:else}
		<div class="alert-header">
			<span class="alert-badge-count">⚠ PONTOS DE ATENÇÃO ({alerts.length})</span>
			<span class="alert-sub">Incluídos automaticamente no topo do PDF e do texto copiado</span>
		</div>
		<ul class="alert-list">
			{#each alerts as item (item.fieldId)}
				<li>
					<button
						type="button"
						class="alert-chip"
						onclick={() => scrollToField(item.fieldId)}
						title="Clique para ir ao campo no formulário"
					>
						<strong>{item.label}:</strong>
						<span>{item.answerDisplay}</span>
						{#if item.detail}
							<span class="alert-detail">({item.detail})</span>
						{/if}
						{#if item.note}
							<span class="alert-note">— {item.note}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</aside>

<style>
	.alert-panel {
		position: sticky;
		top: 62px;
		z-index: 35;
		border-radius: 12px;
		padding: 10px 14px;
		margin-bottom: 16px;
		border: 1px solid #bbf7d0;
		background: #f0fdf4;
		transition: all 0.15s ease;
	}

	.alert-panel.has-alerts {
		background: #fef2f2;
		border: 1.5px solid #ef4444;
		box-shadow: 0 6px 18px -6px rgba(220, 38, 38, 0.22);
	}

	.alert-empty {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #166534;
	}

	.status-ok-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #16a34a;
		flex-shrink: 0;
	}

	.alert-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}

	.alert-badge-count {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.04em;
		color: #991b1b;
		background: #fee2e2;
		border: 1px solid #fca5a5;
		padding: 2px 8px;
		border-radius: 6px;
	}

	.alert-sub {
		font-size: 11.5px;
		color: #7f1d1d;
	}

	.alert-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.alert-chip {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 4px;
		text-align: left;
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px solid #fca5a5;
		background: #ffffff;
		color: #7f1d1d;
		font-family: inherit;
		font-size: 12.5px;
		cursor: pointer;
		transition: background 0.12s ease;
	}

	.alert-chip:hover {
		background: #fee2e2;
	}

	.alert-chip:focus-visible {
		outline: 2px solid #dc2626;
		outline-offset: 2px;
	}

	.alert-detail {
		font-weight: 600;
		color: #991b1b;
	}

	.alert-note {
		font-style: italic;
		color: #b91c1c;
	}
</style>

