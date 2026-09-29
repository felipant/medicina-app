<script lang="ts">
	let {
		value = $bindable(''),
		label = 'Horário',
		id = '',
		type = 'dormir' // 'dormir' | 'acordar'
	}: {
		value: string;
		label?: string;
		id?: string;
		type?: 'dormir' | 'acordar';
	} = $props();

	let isOpen = $state(false);

	// Parse initial or default value
	let selectedHour = $derived.by(() => {
		if (!value || !value.includes(':')) return type === 'dormir' ? 23 : 7;
		const h = parseInt(value.split(':')[0], 10);
		return isNaN(h) ? (type === 'dormir' ? 23 : 7) : h;
	});

	let selectedMinute = $derived.by(() => {
		if (!value || !value.includes(':')) return 0;
		const m = parseInt(value.split(':')[1], 10);
		return isNaN(m) ? 0 : m;
	});

	// Quick presets according to context
	const PRESETS_DORMIR = [
		'21:00', '21:30', '22:00', '22:30',
		'23:00', '23:30', '00:00', '00:30', '01:00'
	];

	const PRESETS_ACORDAR = [
		'05:00', '05:30', '06:00', '06:30',
		'07:00', '07:30', '08:00', '08:30', '09:00'
	];

	const presets = $derived(type === 'dormir' ? PRESETS_DORMIR : PRESETS_ACORDAR);

	// Hours list 00 to 23
	const HOURS = Array.from({ length: 24 }, (_, i) => i);
	const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

	function setTime(h: number, m: number) {
		const strH = String(h).padStart(2, '0');
		const strM = String(m).padStart(2, '0');
		value = `${strH}:${strM}`;
	}

	function setPreset(timeStr: string) {
		value = timeStr;
		isOpen = false;
	}

	function changeHour(delta: number) {
		let nextH = (selectedHour + delta) % 24;
		if (nextH < 0) nextH += 24;
		setTime(nextH, selectedMinute);
	}

	function changeMinute(delta: number) {
		let nextM = selectedMinute + delta;
		let nextH = selectedHour;
		if (nextM >= 60) {
			nextM = nextM % 60;
			nextH = (nextH + 1) % 24;
		} else if (nextM < 0) {
			nextM = 60 + (nextM % 60);
			nextH = (nextH - 1 + 24) % 24;
		}
		setTime(nextH, nextM);
	}

	// Period icon
	let periodIcon = $derived.by(() => {
		if (selectedHour >= 5 && selectedHour < 12) return '🌅';
		if (selectedHour >= 12 && selectedHour < 18) return '☀️';
		if (selectedHour >= 18 && selectedHour < 22) return '🌆';
		return '🌙';
	});
</script>

<div class="time-picker-root">
	<button
		type="button"
		class="time-display-btn"
		class:active={isOpen}
		class:has-val={Boolean(value)}
		onclick={() => isOpen = !isOpen}
		aria-expanded={isOpen}
		aria-haspopup="dialog"
	>
		<div class="time-btn-left">
			<span class="period-emoji">{periodIcon}</span>
			<div class="time-btn-texts">
				<span class="time-btn-label">{label}</span>
				<span class="time-btn-val">
					{#if value}
						{value}
					{:else}
						<span class="placeholder-text">Selecionar horário</span>
					{/if}
				</span>
			</div>
		</div>

		<div class="time-btn-right">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="clock-svg">
				<circle cx="12" cy="12" r="10"></circle>
				<polyline points="12 6 12 12 16 14"></polyline>
			</svg>
		</div>
	</button>

	{#if isOpen}
		<!-- Backdrop for closing on outside click -->
		<div
			class="picker-backdrop"
			role="button"
			tabindex="-1"
			aria-label="Fechar seletor"
			onclick={() => isOpen = false}
			onkeydown={(e) => { if (e.key === 'Escape') isOpen = false; }}
		></div>

		<div class="clock-popover fade-in">
			<!-- Popover Header: Large Time Display with Steppers -->
			<div class="popover-header">
				<div class="popover-title-row">
					<span class="popover-title">⏰ {label}</span>
					<button type="button" class="btn-pop-close" onclick={() => isOpen = false}>✕</button>
				</div>

				<div class="digital-clock-display">
					<div class="digit-box">
						<button type="button" class="btn-step" onclick={() => changeHour(1)} title="Aumentar hora">▲</button>
						<span class="digit-val">{String(selectedHour).padStart(2, '0')}</span>
						<button type="button" class="btn-step" onclick={() => changeHour(-1)} title="Diminuir hora">▼</button>
						<span class="digit-sub">horas</span>
					</div>

					<span class="time-separator">:</span>

					<div class="digit-box">
						<button type="button" class="btn-step" onclick={() => changeMinute(15)} title="+15 min">▲</button>
						<span class="digit-val">{String(selectedMinute).padStart(2, '0')}</span>
						<button type="button" class="btn-step" onclick={() => changeMinute(-15)} title="-15 min">▼</button>
						<span class="digit-sub">minutos</span>
					</div>
				</div>
			</div>

			<!-- Quick Presets Row -->
			<div class="presets-section">
				<span class="section-micro-label">Horários frequentes:</span>
				<div class="presets-chips-wrap">
					{#each presets as pr}
						<button
							type="button"
							class="chip-preset"
							class:active={value === pr}
							onclick={() => setPreset(pr)}
						>
							{pr}
						</button>
					{/each}
				</div>
			</div>

			<!-- Hours Grid Selection -->
			<div class="hours-grid-section">
				<span class="section-micro-label">Escolher Hora (00 a 23h):</span>
				<div class="hours-grid">
					{#each HOURS as h}
						<button
							type="button"
							class="btn-hour"
							class:selected={selectedHour === h}
							onclick={() => setTime(h, selectedMinute)}
						>
							{String(h).padStart(2, '0')}
						</button>
					{/each}
				</div>
			</div>

			<!-- Minutes Grid Selection -->
			<div class="minutes-grid-section">
				<span class="section-micro-label">Escolher Minutos:</span>
				<div class="minutes-grid">
					{#each MINUTES as m}
						<button
							type="button"
							class="btn-minute"
							class:selected={selectedMinute === m}
							onclick={() => setTime(selectedHour, m)}
						>
							:{String(m).padStart(2, '0')}
						</button>
					{/each}
				</div>
			</div>

			<!-- Footer with OK button -->
			<div class="popover-footer">
				<button type="button" class="btn-confirm-time" onclick={() => isOpen = false}>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="20 6 9 17 4 12"></polyline>
					</svg>
					<span>Confirmar {value || `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`}</span>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.time-picker-root {
		position: relative;
		width: 100%;
	}

	.time-display-btn {
		width: 100%;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 6px 14px;
		background: #ffffff;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: 'Inter', sans-serif;
		text-align: left;
		transition: all 0.15s ease;
		box-sizing: border-box;
	}

	.time-display-btn:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
	}

	.time-display-btn.active {
		border-color: var(--tab-sub);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
		background: #ffffff;
	}

	.time-display-btn.has-val {
		border-color: #93c5fd;
		background: #f0f7ff;
	}

	.time-btn-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.period-emoji {
		font-size: 20px;
		line-height: 1;
	}

	.time-btn-texts {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}

	.time-btn-label {
		font-size: 11px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.time-btn-val {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}

	.placeholder-text {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 400;
		color: #94a3b8;
	}

	.clock-svg {
		color: #64748b;
		transition: transform 0.15s ease;
	}

	.time-display-btn:hover .clock-svg {
		color: var(--tab-sub);
		transform: scale(1.08);
	}

	/* Backdrop */
	.picker-backdrop {
		position: fixed;
		inset: 0;
		z-index: 110;
		background: transparent;
	}

	/* Popover Card */
	.clock-popover {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 120;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 14px;
		box-shadow: 0 12px 30px -4px rgba(0, 0, 0, 0.18), 0 4px 10px -2px rgba(0, 0, 0, 0.08);
		width: 320px;
		max-width: 95vw;
		overflow: hidden;
		animation: popIn 0.15s ease-out;
	}

	@keyframes popIn {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.popover-header {
		padding: 12px 16px;
		background: #f8fafc;
		border-bottom: 1px solid #e2e8f0;
	}

	.popover-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.popover-title {
		font-size: 12px;
		font-weight: 700;
		color: #334155;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.btn-pop-close {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: none;
		background: #e2e8f0;
		color: #64748b;
		cursor: pointer;
		font-size: 11px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-pop-close:hover {
		background: #cbd5e1;
		color: #0f172a;
	}

	/* Digital Display */
	.digital-clock-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: #ffffff;
		border: 1px solid #bfdbfe;
		border-radius: 10px;
		padding: 8px 14px;
	}

	.digit-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.digit-val {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 26px;
		font-weight: 800;
		color: var(--tab-sub);
		line-height: 1;
	}

	.digit-sub {
		font-size: 9px;
		font-weight: 600;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.btn-step {
		border: none;
		background: transparent;
		color: #64748b;
		font-size: 10px;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 4px;
		transition: background 0.12s ease;
	}

	.btn-step:hover {
		background: #eff6ff;
		color: var(--tab-sub);
	}

	.time-separator {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 24px;
		font-weight: 800;
		color: #94a3b8;
		margin-top: -12px;
	}

	/* Presets */
	.presets-section {
		padding: 10px 14px 6px;
		border-bottom: 1px solid #f1f5f9;
	}

	.section-micro-label {
		display: block;
		font-size: 10.5px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-bottom: 6px;
	}

	.presets-chips-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}

	.chip-preset {
		padding: 3px 8px;
		border-radius: 6px;
		border: 1px solid #cbd5e1;
		background: #f8fafc;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11.5px;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.chip-preset:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		color: var(--tab-sub);
	}

	.chip-preset.active {
		background: var(--tab-sub);
		border-color: var(--tab-sub);
		color: #ffffff;
	}

	/* Hours Grid */
	.hours-grid-section {
		padding: 10px 14px 6px;
		border-bottom: 1px solid #f1f5f9;
	}

	.hours-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 4px;
	}

	.btn-hour {
		height: 28px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		background: #ffffff;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11.5px;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.12s ease;
	}

	.btn-hour:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		color: var(--tab-sub);
	}

	.btn-hour.selected {
		background: var(--tab-sub);
		border-color: var(--tab-sub);
		color: #ffffff;
	}

	/* Minutes Grid */
	.minutes-grid-section {
		padding: 10px 14px 10px;
	}

	.minutes-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 5px;
	}

	.btn-minute {
		height: 26px;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
		background: #ffffff;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 600;
		color: #475569;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.12s ease;
	}

	.btn-minute:hover {
		background: #eff6ff;
		border-color: #93c5fd;
		color: var(--tab-sub);
	}

	.btn-minute.selected {
		background: #0284c7;
		border-color: #0284c7;
		color: #ffffff;
	}

	/* Footer */
	.popover-footer {
		padding: 8px 14px 12px;
		background: #fafbfc;
		border-top: 1px solid #e2e8f0;
	}

	.btn-confirm-time {
		width: 100%;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: none;
		border-radius: 8px;
		background: var(--tab-sub);
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 12.5px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn-confirm-time:hover {
		background: #1d4ed8;
	}
</style>
