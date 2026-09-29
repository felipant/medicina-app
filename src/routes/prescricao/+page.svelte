<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import MedicamentoModal, {
		type StructuredMedication,
	} from "$lib/components/MedicamentoModal.svelte";
	import {
		printPrescriptionPdf,
		calculateAge,
		normalizeRouteLabel,
		formatPrescriptionPosology,
		cleanPhone,
		type HealthUnitData,
		type PatientData,
		type DoctorData,
		type PrescriptionMedItem,
		type PrescriptionPayload,
	} from "$lib/utils/prescriptionPdfGenerator";

	let { data }: { data: PageData } = $props();

	// ── State: Custom Local Units (localStorage) ──
	let customUnits = $state<HealthUnitData[]>([]);
	let isCustomUnitModalOpen = $state(false);

	// Custom Unit Form in Modal
	let newUnitName = $state("");
	let newUnitPhone = $state("");
	let newUnitAddress = $state("");
	let newUnitCep = $state("35500-000");
	let newUnitNeighborhood = $state("");
	let newUnitCity = $state("Divinópolis");
	let newUnitState = $state("Minas Gerais");
	let newUnitHours = $state("De 07:00 às 17:00");
	let newUnitEmail = $state("");

	// ── State: Selected Health Unit ──
	let selectedUnitKey = $state<string>(""); // 'official_{id}' or 'custom_{index}'
	let selectedUnit = $state<HealthUnitData | null>(null);

	// ── State: Patient Info (Local only) ──
	let patientName = $state("");
	let patientBirthDate = $state("");
	let patientCpf = $state("");
	let patientAddress = $state("");

	// ── State: Doctor Info ──
	let doctorName = $state(data.user?.name || "");
	let doctorCrm = $state("");
	let doctorRqe = $state("");
	let saveDoctorAsDefault = $state(true);

	// ── State: Prescribed Medications ──
	let medications = $state<PrescriptionMedItem[]>([]);
	let customInstructions = $state("");
	let prescriptionDate = $state(new Date().toISOString().split("T")[0]);
	let showPreview = $state(false); // Pré-visualização oculta por padrão para otimizar espaço

	// Quick Add Custom Med Modal
	let isQuickAddMedOpen = $state(false);
	let quickMedName = $state("");
	let quickMedConc = $state("");
	let quickMedRoute = $state("oral");
	let quickMedDosage = $state("1 comprimido");
	let quickMedFrequency = $state("de 8 em 8 horas");
	let quickMedDuration = $state("por 7 dias");
	let quickMedQuantity = $state("");
	let quickMedInstructions = $state("");

	// Edit Med Modal
	let isEditMedOpen = $state(false);
	let editingMedId = $state<string | null>(null);
	let editMedName = $state("");
	let editMedConc = $state("");
	let editMedRoute = $state("oral");
	let editMedDosage = $state("");
	let editMedFrequency = $state("");
	let editMedDuration = $state("");
	let editMedQuantity = $state("");
	let editMedInstructions = $state("");

	// Validation Errors
	let validationErrors = $state<string[]>([]);
	let saveNotification = $state<string | null>(null);

	// ── Derived combined units list (Strictly Deduplicated by Name) ──
	let allUnits = $derived(() => {
		const list: Array<{
			key: string;
			isOfficial: boolean;
			data: HealthUnitData;
		}> = [];
		const seenNames = new Set<string>();

		for (const u of data.officialUnits) {
			const normName = u.name.toUpperCase().trim();
			if (!seenNames.has(normName)) {
				seenNames.add(normName);
				list.push({
					key: `official_${u.id}`,
					isOfficial: true,
					data: {
						name: u.name,
						phone: cleanPhone(u.phone),
						address: u.address,
						cep: u.cep,
						neighborhood: u.neighborhood,
						city: u.city,
						state: u.state,
						email: u.email,
						businessHours: u.businessHours,
					},
				});
			}
		}

		customUnits.forEach((u, idx) => {
			const normName = u.name.toUpperCase().trim();
			if (!seenNames.has(normName)) {
				seenNames.add(normName);
				list.push({
					key: `custom_${idx}`,
					isOfficial: false,
					data: {
						...u,
						phone: cleanPhone(u.phone),
					},
				});
			}
		});

		return list;
	});

	// Patient Age derived
	let patientAge = $derived(
		patientBirthDate ? calculateAge(patientBirthDate) : null,
	);

	// Grouped medications for preview
	let groupedMedications = $derived(() => {
		const groups: { [key: string]: PrescriptionMedItem[] } = {};
		for (const med of medications) {
			const label = normalizeRouteLabel(med.route);
			if (!groups[label]) groups[label] = [];
			groups[label].push(med);
		}
		return groups;
	});

	// ── Persistence: Local Storage ──
	onMount(() => {
		loadLocalCustomUnits();
		loadDoctorProfile();
		loadDraft();

		// Auto select first unit if none selected
		if (!selectedUnitKey && data.officialUnits.length > 0) {
			const first = data.officialUnits[0];
			selectedUnitKey = `official_${first.id}`;
			selectedUnit = {
				name: first.name,
				phone: first.phone,
				address: first.address,
				cep: first.cep,
				neighborhood: first.neighborhood,
				city: first.city,
				state: first.state,
				email: first.email,
				businessHours: first.businessHours,
			};
		}
	});

	function loadLocalCustomUnits() {
		try {
			const saved = localStorage.getItem("custom_health_units");
			if (saved) {
				customUnits = JSON.parse(saved);
			}
		} catch (e) {
			console.error("Error loading custom units from localStorage:", e);
		}
	}

	function saveLocalCustomUnits(units: HealthUnitData[]) {
		try {
			localStorage.setItem("custom_health_units", JSON.stringify(units));
		} catch (e) {
			console.error("Error saving custom units:", e);
		}
	}

	function loadDoctorProfile() {
		try {
			const saved = localStorage.getItem("doctor_profile");
			if (saved) {
				const profile = JSON.parse(saved);
				if (profile.name) doctorName = profile.name;
				if (profile.crm) doctorCrm = profile.crm;
				if (profile.rqe) doctorRqe = profile.rqe;
				if (profile.defaultUnitKey) {
					selectedUnitKey = profile.defaultUnitKey;
					updateSelectedUnitFromKey(profile.defaultUnitKey);
				}
			}
		} catch (e) {
			console.error("Error loading doctor profile:", e);
		}
	}

	function saveDoctorProfile() {
		if (!saveDoctorAsDefault) return;
		try {
			const profile = {
				name: doctorName,
				crm: doctorCrm,
				rqe: doctorRqe,
				defaultUnitKey: selectedUnitKey,
			};
			localStorage.setItem("doctor_profile", JSON.stringify(profile));
		} catch (e) {
			console.error("Error saving doctor profile:", e);
		}
	}

	function autoSaveDraft() {
		try {
			const draft = {
				selectedUnitKey,
				selectedUnit,
				patientName,
				patientBirthDate,
				patientCpf,
				patientAddress,
				medications,
				customInstructions,
				prescriptionDate,
			};
			localStorage.setItem("prescription_draft", JSON.stringify(draft));
		} catch (e) {
			console.error("Error auto-saving draft:", e);
		}
	}

	function loadDraft() {
		try {
			const saved = localStorage.getItem("prescription_draft");
			if (saved) {
				const draft = JSON.parse(saved);
				if (draft.selectedUnitKey) {
					selectedUnitKey = draft.selectedUnitKey;
					selectedUnit = draft.selectedUnit;
				}
				if (draft.patientName) patientName = draft.patientName;
				if (draft.patientBirthDate)
					patientBirthDate = draft.patientBirthDate;
				if (draft.patientCpf) patientCpf = draft.patientCpf;
				if (draft.patientAddress) patientAddress = draft.patientAddress;
				if (draft.medications && Array.isArray(draft.medications))
					medications = draft.medications;
				if (draft.customInstructions)
					customInstructions = draft.customInstructions;
				if (draft.prescriptionDate)
					prescriptionDate = draft.prescriptionDate;
			}
		} catch (e) {
			console.error("Error loading prescription draft:", e);
		}
	}

	function handleUnitChange(key: string) {
		selectedUnitKey = key;
		updateSelectedUnitFromKey(key);
		autoSaveDraft();
		saveDoctorProfile();
	}

	function updateSelectedUnitFromKey(key: string) {
		const match = allUnits().find((u) => u.key === key);
		if (match) {
			selectedUnit = { ...match.data };
		}
	}

	// ── CPF Mask Handler ──
	function handleCpfInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let val = input.value.replace(/\D/g, "");
		if (val.length > 11) val = val.slice(0, 11);
		if (val.length > 9) {
			val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
		} else if (val.length > 6) {
			val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
		} else if (val.length > 3) {
			val = val.replace(/(\d{3})(\d{1,3})/, "$1.$2");
		}
		patientCpf = val;
		autoSaveDraft();
	}

	// ── Add Medication Handlers ──
	function handleAddStructuredMedication(item: StructuredMedication) {
		const newMed: PrescriptionMedItem = {
			id:
				"med_" +
				Date.now() +
				"_" +
				Math.random().toString(36).slice(2, 6),
			name: item.name,
			concentration: item.concentration,
			form: item.form,
			route: item.route || "oral",
			dosage: item.dosage,
			frequency: item.frequency,
			duration: item.duration,
			quantity: item.quantity,
			instructions: item.instructions,
		};
		medications = [...medications, newMed];
		autoSaveDraft();
		showNotification("Medicamento adicionado à receita");
	}

	function handleAddQuickMed() {
		if (!quickMedName.trim()) return;
		const newMed: PrescriptionMedItem = {
			id:
				"med_" +
				Date.now() +
				"_" +
				Math.random().toString(36).slice(2, 6),
			name: quickMedName.trim().toUpperCase(),
			concentration: quickMedConc.trim(),
			form: "comprimido",
			route: quickMedRoute,
			dosage: quickMedDosage.trim(),
			frequency: quickMedFrequency.trim(),
			duration: quickMedDuration.trim(),
			quantity: quickMedQuantity.trim(),
			instructions: quickMedInstructions.trim(),
		};
		medications = [...medications, newMed];
		// reset form
		quickMedName = "";
		quickMedConc = "";
		quickMedQuantity = "";
		quickMedInstructions = "";
		isQuickAddMedOpen = false;
		autoSaveDraft();
		showNotification("Medicamento adicionado à receita");
	}

	function removeMedication(id: string) {
		medications = medications.filter((m) => m.id !== id);
		autoSaveDraft();
	}

	function openEditMed(med: PrescriptionMedItem) {
		editingMedId = med.id;
		editMedName = med.name;
		editMedConc = med.concentration || "";
		editMedRoute = med.route || "oral";
		editMedDosage = med.dosage || "";
		editMedFrequency = med.frequency || "";
		editMedDuration = med.duration || "";
		editMedQuantity = med.quantity || "";
		editMedInstructions = med.instructions || "";
		isEditMedOpen = true;
	}

	function handleSaveEditMed() {
		if (!editingMedId || !editMedName.trim()) return;
		medications = medications.map((m) => {
			if (m.id === editingMedId) {
				return {
					...m,
					name: editMedName.trim().toUpperCase(),
					concentration: editMedConc.trim(),
					route: editMedRoute,
					dosage: editMedDosage.trim(),
					frequency: editMedFrequency.trim(),
					duration: editMedDuration.trim(),
					quantity: editMedQuantity.trim(),
					instructions: editMedInstructions.trim(),
				};
			}
			return m;
		});
		isEditMedOpen = false;
		editingMedId = null;
		autoSaveDraft();
		showNotification("Medicamento atualizado com sucesso");
	}

	function moveMedication(index: number, direction: "up" | "down") {
		if (direction === "up" && index > 0) {
			const temp = medications[index];
			medications[index] = medications[index - 1];
			medications[index - 1] = temp;
		} else if (direction === "down" && index < medications.length - 1) {
			const temp = medications[index];
			medications[index] = medications[index + 1];
			medications[index + 1] = temp;
		}
		autoSaveDraft();
	}

	// ── Custom Unit Creation ──
	function handleSaveCustomUnit() {
		if (
			!newUnitName.trim() ||
			!newUnitPhone.trim() ||
			!newUnitAddress.trim() ||
			!newUnitNeighborhood.trim()
		) {
			alert(
				"Preencha os campos obrigatórios da unidade (Nome, Telefone, Endereço, Bairro).",
			);
			return;
		}

		const unit: HealthUnitData = {
			name: newUnitName.trim().toUpperCase(),
			phone: newUnitPhone.trim(),
			address: newUnitAddress.trim(),
			cep: newUnitCep.trim() || "35500-000",
			neighborhood: newUnitNeighborhood.trim(),
			city: newUnitCity.trim() || "Divinópolis",
			state: newUnitState.trim() || "Minas Gerais",
			businessHours: newUnitHours.trim() || "De 07:00 às 17:00",
			email: newUnitEmail.trim() || null,
		};

		const updated = [...customUnits, unit];
		customUnits = updated;
		saveLocalCustomUnits(updated);

		// Select it immediately
		const newKey = `custom_${updated.length - 1}`;
		selectedUnitKey = newKey;
		selectedUnit = unit;

		// Clear modal
		newUnitName = "";
		newUnitPhone = "";
		newUnitAddress = "";
		newUnitNeighborhood = "";
		isCustomUnitModalOpen = false;
		autoSaveDraft();
		showNotification("Unidade local cadastrada com sucesso!");
	}

	// ── Generate & Print PDF ──
	function handleGeneratePdf() {
		validationErrors = [];

		if (!selectedUnit) {
			validationErrors.push("Selecione uma Unidade de Saúde.");
		}
		if (!patientName.trim()) {
			validationErrors.push("Informe o Nome do Paciente.");
		}
		if (medications.length === 0) {
			validationErrors.push(
				"Adicione pelo menos um medicamento à receita.",
			);
		}

		if (validationErrors.length > 0) {
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		// Save profile & draft
		saveDoctorProfile();
		autoSaveDraft();

		const payload: PrescriptionPayload = {
			healthUnit: selectedUnit!,
			patient: {
				name: patientName.trim(),
				birthDate: patientBirthDate || undefined,
				cpf: patientCpf.trim() || undefined,
				address: patientAddress.trim() || undefined,
			},
			doctor: {
				name: doctorName.trim(),
				crm: doctorCrm.trim(),
				rqe: doctorRqe.trim() || undefined,
			},
			medications,
			date: prescriptionDate,
			customInstructions: customInstructions.trim() || undefined,
		};

		printPrescriptionPdf(payload);
	}

	function handleClearForm() {
		if (
			confirm(
				"Deseja realmente limpar todos os dados do paciente e medicamentos?",
			)
		) {
			patientName = "";
			patientBirthDate = "";
			patientCpf = "";
			patientAddress = "";
			medications = [];
			customInstructions = "";
			localStorage.removeItem("prescription_draft");
			showNotification("Formulário limpo com sucesso.");
		}
	}

	function showNotification(msg: string) {
		saveNotification = msg;
		setTimeout(() => {
			if (saveNotification === msg) saveNotification = null;
		}, 3500);
	}
</script>

<svelte:head>
	<title>Módulo de Prescrição Médica | Receituário Duplo Paisagem</title>
</svelte:head>

<div class="prescription-page-container">
	<!-- Top App Header -->
	<header class="prescription-header">
		<div class="header-left">
			<a href="/" class="back-link">
				<span class="arrow">←</span> Voltar ao Hub
			</a>
			<div class="title-group">
				<span class="badge-module">Prescrição Médica</span>
				<h1>Emissão de Receituário Clínico</h1>
			</div>
			<p class="privacy-note">
				<span class="lock-icon">🔒</span> Privacidade 100% no navegador:
				os dados clínicos não trafegam para servidores.
			</p>
		</div>

		<div class="header-actions">
			<button
				type="button"
				class="btn-toggle-preview"
				class:active={showPreview}
				onclick={() => (showPreview = !showPreview)}
				title="Alternar pré-visualização da receita"
			>
				{#if showPreview}
					<span class="icon">✕</span> Ocultar Pré-visualização
				{:else}
					<span class="icon">👁️</span> Ver Pré-visualização
				{/if}
			</button>
			<button
				class="btn-clear"
				onclick={handleClearForm}
				title="Limpar formulário"
			>
				🗑️ Limpar
			</button>
			<button class="btn-generate-pdf" onclick={handleGeneratePdf}>
				<span class="icon">🖨️</span> Gerar Receita (PDF)
			</button>
		</div>
	</header>

	<!-- Notification Toast -->
	{#if saveNotification}
		<div class="toast-notification">
			<span class="toast-icon">✓</span>
			<span>{saveNotification}</span>
		</div>
	{/if}

	<!-- Validation Errors Banner -->
	{#if validationErrors.length > 0}
		<div class="alert-errors">
			<div class="alert-title">
				⚠️ Atenção: Corrija os seguintes campos para gerar a receita:
			</div>
			<ul>
				{#each validationErrors as err}
					<li>{err}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="prescription-grid" class:with-preview={showPreview}>
		<!-- FORM INPUTS -->
		<div class="form-column">
			<!-- CARD 1: UNIDADE DE SAÚDE -->
			<section class="card-section">
				<div class="section-title-bar">
					<div class="section-title">
						<span class="section-num">1</span>
						<h2>Unidade de Saúde (ESF / UBS)</h2>
					</div>
					<button
						type="button"
						class="btn-text-action"
						onclick={() => (isCustomUnitModalOpen = true)}
					>
						+ Nova Unidade Local
					</button>
				</div>

				<div class="form-group">
					<label for="health-unit-select"
						>Selecione a Unidade de Atendimento *</label
					>
					<select
						id="health-unit-select"
						class="form-select"
						value={selectedUnitKey}
						onchange={(e) =>
							handleUnitChange(e.currentTarget.value)}
					>
						<optgroup label="── Unidades Oficiais ESF">
							{#each allUnits().filter((u) => u.isOfficial) as u}
								<option value={u.key}
									>{u.data.name} — {u.data
										.neighborhood}</option
								>
							{/each}
						</optgroup>

						{#if allUnits().filter((u) => !u.isOfficial).length > 0}
							<optgroup
								label="── Unidades Personalizadas (Navegador Local) ──"
							>
								{#each allUnits().filter((u) => !u.isOfficial) as u}
									<option value={u.key}
										>⭐ {u.data.name} ({u.data
											.neighborhood}) [Local]</option
									>
								{/each}
							</optgroup>
						{/if}
					</select>
				</div>

				{#if selectedUnit}
					<div class="unit-preview-card">
						<div class="unit-preview-name">{selectedUnit.name}</div>
						<div class="unit-preview-details">
							<span
								>📍 {selectedUnit.address}, {selectedUnit.neighborhood}
								- CEP {selectedUnit.cep}</span
							>
							<span
								>🏙️ {selectedUnit.city} - {selectedUnit.state} •
								📞 {selectedUnit.phone}</span
							>
							<span>🕒 {selectedUnit.businessHours}</span>
						</div>
					</div>
				{/if}
			</section>

			<!-- CARD 2: DADOS DO PACIENTE -->
			<section class="card-section">
				<div class="section-title-bar">
					<div class="section-title">
						<span class="section-num">2</span>
						<h2>Dados do Paciente</h2>
					</div>
					{#if patientAge !== null}
						<span class="badge-age">{patientAge} anos</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="patient-name">Nome Completo do Paciente *</label
					>
					<input
						type="text"
						id="patient-name"
						class="form-input"
						placeholder="Ex: Maria das Graças Silva"
						bind:value={patientName}
						oninput={autoSaveDraft}
					/>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="patient-dob"
							>Data de Nascimento (Opcional)</label
						>
						<input
							type="date"
							id="patient-dob"
							class="form-input"
							bind:value={patientBirthDate}
							oninput={autoSaveDraft}
						/>
					</div>

					<div class="form-group">
						<label for="patient-cpf">CPF (Opcional)</label>
						<input
							type="text"
							id="patient-cpf"
							class="form-input"
							placeholder="000.000.000-00"
							value={patientCpf}
							oninput={handleCpfInput}
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="patient-address"
						>Endereço Residencial (Opcional)</label
					>
					<input
						type="text"
						id="patient-address"
						class="form-input"
						placeholder="Ex: Rua das Flores, 120, Bairro Jardim"
						bind:value={patientAddress}
						oninput={autoSaveDraft}
					/>
				</div>
			</section>

			<!-- CARD 3: DADOS DO MÉDICO -->
			<section class="card-section">
				<div class="section-title-bar">
					<div class="section-title">
						<span class="section-num">3</span>
						<h2>Dados do Médico Prescritor</h2>
					</div>
				</div>

				<div class="form-group">
					<label for="doc-name"
						>Nome Completo do Médico (Opcional)</label
					>
					<input
						type="text"
						id="doc-name"
						class="form-input"
						placeholder="Ex: Felipe Torres"
						bind:value={doctorName}
						oninput={() => {
							saveDoctorProfile();
							autoSaveDraft();
						}}
					/>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="doc-crm">CRM / UF (Opcional)</label>
						<input
							type="text"
							id="doc-crm"
							class="form-input"
							placeholder="Ex: CRM/MG 123456"
							bind:value={doctorCrm}
							oninput={() => {
								saveDoctorProfile();
								autoSaveDraft();
							}}
						/>
					</div>

					<div class="form-group">
						<label for="doc-rqe">RQE (Opcional)</label>
						<input
							type="text"
							id="doc-rqe"
							class="form-input"
							placeholder="Ex: RQE 45890"
							bind:value={doctorRqe}
							oninput={() => {
								saveDoctorProfile();
								autoSaveDraft();
							}}
						/>
					</div>
				</div>

				<div class="form-group checkbox-wrapper">
					<label class="checkbox-label">
						<input
							type="checkbox"
							bind:checked={saveDoctorAsDefault}
							onchange={saveDoctorProfile}
						/>
						<span
							>Lembrar meus dados de médico neste computador para
							as próximas receitas</span
						>
					</label>
				</div>
			</section>

			<!-- CARD 4: MEDICAMENTOS -->
			<section class="card-section">
				<div class="section-title-bar">
					<div class="section-title">
						<span class="section-num">4</span>
						<h2>Medicamentos Prescritos ({medications.length})</h2>
					</div>
					<div class="med-actions-buttons">
						<button
							type="button"
							class="btn-secondary-sm"
							onclick={() => (isQuickAddMedOpen = true)}
						>
							+ Digitar Manual
						</button>
						<MedicamentoModal
							placeholder="+ Buscar no Catálogo"
							context="prescricao"
							onSelectStructured={handleAddStructuredMedication}
						/>
					</div>
				</div>

				{#if medications.length === 0}
					<div class="empty-meds-box">
						<span class="empty-icon">💊</span>
						<p>Nenhum medicamento adicionado ainda.</p>
						<p class="empty-hint">
							Use o botão <strong>"+ Buscar no Catálogo"</strong>
							para pesquisar princípios ativos ou
							<strong>"+ Digitar Manual"</strong>.
						</p>
					</div>
				{:else}
					<div class="medications-list">
						{#each medications as med, index (med.id)}
							<div class="med-card">
								<div class="med-card-header">
									<div class="med-title-group">
										<span class="med-order-badge"
											>{index + 1}</span
										>
										<strong class="med-card-title"
											>{med.name}
											{med.concentration || ""}</strong
										>
										<span class="badge-route"
											>{normalizeRouteLabel(
												med.route,
											)}</span
										>
									</div>
									<div class="med-controls">
										<button
											type="button"
											class="btn-icon-tiny edit"
											title="Editar medicamento"
											onclick={() => openEditMed(med)}
										>
											✏️
										</button>
										<button
											type="button"
											class="btn-icon-tiny"
											title="Mover para cima"
											disabled={index === 0}
											onclick={() =>
												moveMedication(index, "up")}
										>
											▲
										</button>
										<button
											type="button"
											class="btn-icon-tiny"
											title="Mover para baixo"
											disabled={index ===
												medications.length - 1}
											onclick={() =>
												moveMedication(index, "down")}
										>
											▼
										</button>
										<button
											type="button"
											class="btn-icon-tiny delete"
											title="Excluir item"
											onclick={() =>
												removeMedication(med.id)}
										>
											✕
										</button>
									</div>
								</div>

								<div class="med-card-body">
									<div class="posology-line">
										<span class="posology-icon">📝</span>
										<span
											>{formatPrescriptionPosology(
												med.dosage,
												med.frequency,
												med.duration,
												med.form,
												med.route
											)}</span
										>
									</div>
									{#if med.quantity}
										<div class="qty-line">
											<span class="qty-label"
												>Quantidade:</span
											>
											<strong>{med.quantity}</strong>
										</div>
									{/if}
									{#if med.instructions}
										<div class="instructions-line">
											<em>Obs: {med.instructions}</em>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- CARD 5: ORIENTAÇÕES ADICIONAIS & DATA -->
			<section class="card-section">
				<div class="section-title-bar">
					<div class="section-title">
						<span class="section-num">5</span>
						<h2>Orientações Gerais & Data</h2>
					</div>
				</div>

				<div class="form-group">
					<label for="prescription-date">Data da Receita</label>
					<input
						type="date"
						id="prescription-date"
						class="form-input"
						bind:value={prescriptionDate}
						oninput={autoSaveDraft}
					/>
				</div>

				<div class="form-group">
					<label for="custom-inst"
						>Orientações Gerais / Recomendações (Opcional)</label
					>
					<textarea
						id="custom-inst"
						class="form-textarea"
						rows="3"
						placeholder="Ex: Manter repouso relativo por 3 dias, ingerir bastante líquido, retornar se febre persistente..."
						bind:value={customInstructions}
						oninput={autoSaveDraft}
					></textarea>
				</div>
			</section>
		</div>

		<!-- PREVIEW COLUMN (CONDICIONAL / TOGGLE) -->
		{#if showPreview}
			<div class="preview-column">
				<div class="preview-sticky-card">
					<div class="preview-header">
						<div class="preview-title">
							<span class="preview-icon">👁️</span>
							<h3>Pré-visualização (2 Vias Paisagem)</h3>
						</div>
						<div class="preview-actions">
							<button
								class="btn-close-preview"
								onclick={() => (showPreview = false)}
								title="Fechar pré-visualização">✕ Fechar</button
							>
							<button
								class="btn-print-action"
								onclick={handleGeneratePdf}
							>
								🖨️ Imprimir
							</button>
						</div>
					</div>

					<div class="preview-viewport">
						<div class="preview-paper-sheet">
							<!-- VIA 1: PACIENTE -->
							<div class="preview-col">
								<div class="preview-via-tag">
									1ª Via — Paciente
								</div>

								<div class="p-unit-head">
									<h4>
										{selectedUnit?.name ||
											"UNIDADE DE SAÚDE"}
									</h4>
									<p>
										{selectedUnit?.address || "Endereço"}, {selectedUnit?.neighborhood ||
											"Bairro"}
									</p>
									<p>
										{selectedUnit?.city || "Cidade"} - {selectedUnit?.state ||
											"MG"} • Tel: {selectedUnit?.phone ||
											"Telefone"}
									</p>
								</div>

								<div class="p-patient-box">
									<div class="p-patient-name">
										<strong>PACIENTE:</strong>
										{patientName.toUpperCase() ||
											"NOME DO PACIENTE"}
									</div>
									{#if patientBirthDate || patientCpf}
										<div class="p-patient-meta">
											{#if patientBirthDate}<span
													>Nasc: {patientBirthDate}
													{patientAge !== null
														? `(${patientAge}a)`
														: ""}</span
												>{/if}
											{#if patientCpf}<span
													>CPF: {patientCpf}</span
												>{/if}
										</div>
									{/if}
								</div>

								<div class="p-meds-body">
									{#if Object.keys(groupedMedications()).length === 0}
										<div class="p-empty-placeholder">
											Nenhum medicamento adicionado
										</div>
									{:else}
										{#each Object.entries(groupedMedications()) as [route, items]}
											<div class="p-group">
												<div class="p-group-title">
													{route}
												</div>
												{#each items as item, i}
													<div class="p-med-row">
														<div
															class="p-med-line-1"
														>
															<span
																class="p-med-left"
																><span
																	class="p-med-num"
																	>{i +
																		1}.</span
																>
																<span
																	class="p-med-name"
																	>{item.name}
																	{item.concentration ||
																		""}</span
																></span
															>
															{#if item.quantity}<span
																	class="p-med-fill-line"
																></span><span
																	class="p-med-qty"
																	>{item.quantity.trim()}</span
																>{/if}
														</div>
														{#if formatPrescriptionPosology(item.dosage, item.frequency, item.duration)}
															<div
																class="p-med-poso"
															>
																{formatPrescriptionPosology(
																	item.dosage,
																	item.frequency,
																	item.duration,
																)}
															</div>
														{/if}
														{#if item.instructions}
															<div
																class="p-med-obs"
															>
																Obs: {item.instructions.trim()}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/each}
									{/if}

									{#if customInstructions}
										<div class="p-custom-box">
											<strong>Orientações:</strong>
											{customInstructions}
										</div>
									{/if}
								</div>

								<div class="p-doctor-foot">
									<div class="p-sign-line"></div>
									{#if doctorName}<div class="p-doc-name">
											{doctorName}
										</div>{/if}
									{#if doctorCrm}<div class="p-doc-crm">
											CRM: {doctorCrm}
											{doctorRqe
												? `• RQE: ${doctorRqe}`
												: ""}
										</div>{/if}
									<div class="p-date-line">
										{selectedUnit?.city || "Divinópolis"}, {prescriptionDate}
									</div>
								</div>
							</div>

							<!-- CUT SEPARATOR -->
							<div class="preview-cut-line">
								<span>✂</span>
								<span>✂</span>
								<span>✂</span>
							</div>

							<!-- VIA 2: FARMÁCIA -->
							<div class="preview-col">
								<div class="preview-via-tag">
									2ª Via — Farmácia
								</div>

								<div class="p-unit-head">
									<h4>
										{selectedUnit?.name ||
											"UNIDADE DE SAÚDE"}
									</h4>
									<p>
										{selectedUnit?.address || "Endereço"}, {selectedUnit?.neighborhood ||
											"Bairro"}
									</p>
									<p>
										{selectedUnit?.city || "Cidade"} - {selectedUnit?.state ||
											"MG"} • Tel: {selectedUnit?.phone ||
											"Telefone"}
									</p>
								</div>

								<div class="p-patient-box">
									<div class="p-patient-name">
										<strong>PACIENTE:</strong>
										{patientName.toUpperCase() ||
											"NOME DO PACIENTE"}
									</div>
									{#if patientBirthDate || patientCpf}
										<div class="p-patient-meta">
											{#if patientBirthDate}<span
													>Nasc: {patientBirthDate}
													{patientAge !== null
														? `(${patientAge}a)`
														: ""}</span
												>{/if}
											{#if patientCpf}<span
													>CPF: {patientCpf}</span
												>{/if}
										</div>
									{/if}
								</div>

								<div class="p-meds-body">
									{#if Object.keys(groupedMedications()).length === 0}
										<div class="p-empty-placeholder">
											Nenhum medicamento adicionado
										</div>
									{:else}
										{#each Object.entries(groupedMedications()) as [route, items]}
											<div class="p-group">
												<div class="p-group-title">
													{route}
												</div>
												{#each items as item, i}
													<div class="p-med-row">
														<div
															class="p-med-line-1"
														>
															<span
																class="p-med-left"
																><span
																	class="p-med-num"
																	>{i +
																		1}.</span
																>
																<span
																	class="p-med-name"
																	>{item.name}
																	{item.concentration ||
																		""}</span
																></span
															>
															{#if item.quantity}<span
																	class="p-med-fill-line"
																></span><span
																	class="p-med-qty"
																	>{item.quantity.trim()}</span
																>{/if}
														</div>
														{#if formatPrescriptionPosology(item.dosage, item.frequency, item.duration)}
															<div
																class="p-med-poso"
															>
																{formatPrescriptionPosology(
																	item.dosage,
																	item.frequency,
																	item.duration,
																)}
															</div>
														{/if}
														{#if item.instructions}
															<div
																class="p-med-obs"
															>
																Obs: {item.instructions.trim()}
															</div>
														{/if}
													</div>
												{/each}
											</div>
										{/each}
									{/if}

									{#if customInstructions}
										<div class="p-custom-box">
											<strong>Orientações:</strong>
											{customInstructions}
										</div>
									{/if}
								</div>

								<div class="p-doctor-foot">
									<div class="p-sign-line"></div>
									{#if doctorName}<div class="p-doc-name">
											{doctorName}
										</div>{/if}
									{#if doctorCrm}<div class="p-doc-crm">
											CRM: {doctorCrm}
											{doctorRqe
												? `• RQE: ${doctorRqe}`
												: ""}
										</div>{/if}
									<div class="p-date-line">
										{selectedUnit?.city || "Divinópolis"}, {prescriptionDate}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- MODAL: CADASTRAR UNIDADE LOCAL (LOCALSTORAGE) -->
{#if isCustomUnitModalOpen}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) isCustomUnitModalOpen = false;
		}}
	>
		<div class="modal-dialog">
			<div class="modal-header">
				<h3>🏥 Cadastrar Nova Unidade Localmente</h3>
				<button
					class="modal-close"
					onclick={() => (isCustomUnitModalOpen = false)}>✕</button
				>
			</div>

			<div class="modal-body">
				<p class="modal-info-text">
					Esta unidade será salva exclusivamente no seu navegador
					(localStorage) e não trafegará para o servidor.
				</p>

				<div class="form-group">
					<label for="cu-name">Nome da Unidade *</label>
					<input
						type="text"
						id="cu-name"
						class="form-input"
						placeholder="Ex: CLÍNICA MÉDICA SANTA RITA"
						bind:value={newUnitName}
					/>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="cu-phone">Telefone(s) *</label>
						<input
							type="text"
							id="cu-phone"
							class="form-input"
							placeholder="Ex: (37) 3222-0000"
							bind:value={newUnitPhone}
						/>
					</div>

					<div class="form-group">
						<label for="cu-hours">Horário de Atendimento *</label>
						<input
							type="text"
							id="cu-hours"
							class="form-input"
							placeholder="Ex: De 07:00 às 18:00"
							bind:value={newUnitHours}
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="cu-address">Endereço (Rua e Número) *</label>
					<input
						type="text"
						id="cu-address"
						class="form-input"
						placeholder="Ex: Av. Sete de Setembro, 500"
						bind:value={newUnitAddress}
					/>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="cu-neighborhood">Bairro *</label>
						<input
							type="text"
							id="cu-neighborhood"
							class="form-input"
							placeholder="Ex: Centro"
							bind:value={newUnitNeighborhood}
						/>
					</div>

					<div class="form-group">
						<label for="cu-cep">CEP</label>
						<input
							type="text"
							id="cu-cep"
							class="form-input"
							placeholder="35500-000"
							bind:value={newUnitCep}
						/>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="cu-city">Cidade</label>
						<input
							type="text"
							id="cu-city"
							class="form-input"
							bind:value={newUnitCity}
						/>
					</div>

					<div class="form-group">
						<label for="cu-state">Estado</label>
						<input
							type="text"
							id="cu-state"
							class="form-input"
							bind:value={newUnitState}
						/>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					onclick={() => (isCustomUnitModalOpen = false)}
					>Cancelar</button
				>
				<button
					type="button"
					class="btn-primary"
					onclick={handleSaveCustomUnit}>Salvar Unidade Local</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: DIGITAR MEDICAMENTO MANUALMENTE -->
{#if isQuickAddMedOpen}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) isQuickAddMedOpen = false;
		}}
	>
		<div class="modal-dialog">
			<div class="modal-header">
				<h3>💊 Digitar Medicamento Personalizado</h3>
				<button
					class="modal-close"
					onclick={() => (isQuickAddMedOpen = false)}>✕</button
				>
			</div>

			<div class="modal-body">
				<div class="form-row-2">
					<div class="form-group">
						<label for="qm-name">Nome do Medicamento *</label>
						<input
							type="text"
							id="qm-name"
							class="form-input"
							placeholder="Ex: DIPIRONA MONOIDRATADA"
							bind:value={quickMedName}
						/>
					</div>

					<div class="form-group">
						<label for="qm-conc">Concentração</label>
						<input
							type="text"
							id="qm-conc"
							class="form-input"
							placeholder="Ex: 500 mg / 1 g / 50 mg/mL"
							bind:value={quickMedConc}
						/>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="qm-route">Via de Administração *</label>
						<select
							id="qm-route"
							class="form-select"
							bind:value={quickMedRoute}
						>
							<option value="oral">Oral (USO ORAL)</option>
							<option value="topica">Tópica (USO TÓPICO)</option>
							<option value="inalatoria"
								>Inalatória (USO INALATÓRIO)</option
							>
							<option value="oftalmica"
								>Oftálmica (USO OFTÁLMICO)</option
							>
							<option value="otologica"
								>Otológica (USO OTOLÓGICO)</option
							>
							<option value="nasal">Nasal (USO NASAL)</option>
							<option value="parenteral"
								>Parenteral / Injetável (USO PARENTERAL)</option
							>
							<option value="sublingual"
								>Sublingual (USO SUBLINGUAL)</option
							>
							<option value="retal">Retal (USO RETAL)</option>
							<option value="vaginal"
								>Vaginal (USO VAGINAL)</option
							>
						</select>
					</div>

					<div class="form-group">
						<label for="qm-dosage">Dose Unitária</label>
						<input
							type="text"
							id="qm-dosage"
							class="form-input"
							placeholder="Ex: 1 comprimido / 20 gotas"
							bind:value={quickMedDosage}
						/>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="qm-freq">Frequência</label>
						<input
							type="text"
							id="qm-freq"
							class="form-input"
							placeholder="Ex: de 6 em 6 horas se dor"
							bind:value={quickMedFrequency}
						/>
					</div>

					<div class="form-group">
						<label for="qm-dur">Duração</label>
						<input
							type="text"
							id="qm-dur"
							class="form-input"
							placeholder="Ex: por 5 dias"
							bind:value={quickMedDuration}
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="qm-qty">Quantidade a Dispensar</label>
					<input
						type="text"
						id="qm-qty"
						class="form-input"
						placeholder="Ex: 30 comprimidos / 1 caixa / 1 frasco"
						bind:value={quickMedQuantity}
					/>
					<div class="quick-chips-row" style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
						{#each ['30 comprimidos', '60 comprimidos', '1 caixa', '2 caixas', '1 frasco', '1 tubo'] as emb}
							<button type="button" class="mini-chip" onclick={() => (quickMedQuantity = emb)} style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: var(--bg-tertiary, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); cursor: pointer;">
								{emb}
							</button>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<label for="qm-obs">Orientações Especiais (Opcional)</label>
					<input
						type="text"
						id="qm-obs"
						class="form-input"
						placeholder="Ex: Tomar após as refeições / Evitar bebidas alcoólicas"
						bind:value={quickMedInstructions}
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					onclick={() => (isQuickAddMedOpen = false)}>Cancelar</button
				>
				<button
					type="button"
					class="btn-primary"
					onclick={handleAddQuickMed}>Adicionar à Receita</button
				>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: EDITAR MEDICAMENTO -->
{#if isEditMedOpen}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) isEditMedOpen = false;
		}}
	>
		<div class="modal-dialog">
			<div class="modal-header">
				<h3>✏️ Editar Medicamento</h3>
				<button
					class="modal-close"
					onclick={() => (isEditMedOpen = false)}>✕</button
				>
			</div>

			<div class="modal-body">
				<div class="form-row-2">
					<div class="form-group">
						<label for="em-name">Nome do Medicamento *</label>
						<input
							type="text"
							id="em-name"
							class="form-input"
							placeholder="Ex: DIPIRONA MONOIDRATADA"
							bind:value={editMedName}
						/>
					</div>

					<div class="form-group">
						<label for="em-conc">Concentração</label>
						<input
							type="text"
							id="em-conc"
							class="form-input"
							placeholder="Ex: 500 mg / 1 g / 50 mg/mL"
							bind:value={editMedConc}
						/>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="em-route">Via de Administração *</label>
						<select
							id="em-route"
							class="form-select"
							bind:value={editMedRoute}
						>
							<option value="oral">Oral (USO ORAL)</option>
							<option value="topica">Tópica (USO TÓPICO)</option>
							<option value="inalatoria"
								>Inalatória (USO INALATÓRIO)</option
							>
							<option value="oftalmica"
								>Oftálmica (USO OFTÁLMICO)</option
							>
							<option value="otologica"
								>Otológica (USO OTOLÓGICO)</option
							>
							<option value="nasal">Nasal (USO NASAL)</option>
							<option value="parenteral"
								>Parenteral / Injetável (USO PARENTERAL)</option
							>
							<option value="sublingual"
								>Sublingual (USO SUBLINGUAL)</option
							>
							<option value="retal">Retal (USO RETAL)</option>
							<option value="vaginal"
								>Vaginal (USO VAGINAL)</option
							>
						</select>
					</div>

					<div class="form-group">
						<label for="em-dosage">Dose Unitária</label>
						<input
							type="text"
							id="em-dosage"
							class="form-input"
							placeholder="Ex: 1 comprimido / 20 gotas"
							bind:value={editMedDosage}
						/>
					</div>
				</div>

				<div class="form-row-2">
					<div class="form-group">
						<label for="em-freq">Frequência</label>
						<input
							type="text"
							id="em-freq"
							class="form-input"
							placeholder="Ex: de 6 em 6 horas se dor"
							bind:value={editMedFrequency}
						/>
					</div>

					<div class="form-group">
						<label for="em-dur">Duração</label>
						<input
							type="text"
							id="em-dur"
							class="form-input"
							placeholder="Ex: por 5 dias / Uso contínuo"
							bind:value={editMedDuration}
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="em-qty">Quantidade a Dispensar</label>
					<input
						type="text"
						id="em-qty"
						class="form-input"
						placeholder="Ex: 30 comprimidos / 1 caixa / 1 frasco"
						bind:value={editMedQuantity}
					/>
					<div class="quick-chips-row" style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px;">
						{#each ['30 comprimidos', '60 comprimidos', '1 caixa', '2 caixas', '1 frasco', '1 tubo'] as emb}
							<button type="button" class="mini-chip" onclick={() => (editMedQuantity = emb)} style="font-size: 11px; padding: 2px 8px; border-radius: 6px; background: var(--bg-tertiary, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); cursor: pointer;">
								{emb}
							</button>
						{/each}
					</div>
				</div>

				<div class="form-group">
					<label for="em-obs">Orientações Especiais (Opcional)</label>
					<input
						type="text"
						id="em-obs"
						class="form-input"
						placeholder="Ex: Tomar após as refeições / Evitar bebidas alcoólicas"
						bind:value={editMedInstructions}
					/>
				</div>
			</div>

			<div class="modal-footer">
				<button
					type="button"
					class="btn-secondary"
					onclick={() => (isEditMedOpen = false)}>Cancelar</button
				>
				<button
					type="button"
					class="btn-primary"
					onclick={handleSaveEditMed}>Salvar Alterações</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body) {
		background-color: #f8fafc;
		color: #0f172a;
		font-family:
			"Inter",
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			sans-serif;
		margin: 0;
		padding: 0;
	}

	.prescription-page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	/* Top Header */
	.prescription-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1.5rem;
		flex-wrap: wrap;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 1.5rem;
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #64748b;
		text-decoration: none;
		font-size: 0.88rem;
		font-weight: 500;
		transition: color 0.15s ease;
	}

	.back-link:hover {
		color: #000000;
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.badge-module {
		background: #000000;
		color: #ffffff;
		padding: 0.22rem 0.55rem;
		border-radius: 4px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 800;
		color: #000000;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.privacy-note {
		font-size: 0.82rem;
		color: #64748b;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}

	.btn-toggle-preview {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #ffffff;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		padding: 0.65rem 1.1rem;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-toggle-preview:hover,
	.btn-toggle-preview.active {
		background: #000000;
		color: #ffffff;
		border-color: #000000;
	}

	.btn-generate-pdf {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #000000;
		color: #ffffff;
		border: 1px solid #000000;
		padding: 0.65rem 1.25rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-generate-pdf:hover {
		background: #27272a;
		border-color: #27272a;
	}

	.btn-clear {
		background: #ffffff;
		color: #64748b;
		border: 1px solid #cbd5e1;
		padding: 0.65rem 0.95rem;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-clear:hover {
		background: #fef2f2;
		border-color: #dc2626;
		color: #dc2626;
	}

	/* Toast Notification */
	.toast-notification {
		background: #f0fdf4;
		border: 1px solid #86efac;
		color: #166534;
		padding: 0.75rem 1.25rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.88rem;
		font-weight: 600;
	}

	.alert-errors {
		background: #fef2f2;
		border: 1px solid #fca5a5;
		color: #991b1b;
		padding: 1rem 1.25rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
	}

	.alert-title {
		font-weight: 700;
		margin-bottom: 0.4rem;
	}

	.alert-errors ul {
		margin: 0;
		padding-left: 1.25rem;
		font-size: 0.88rem;
	}

	/* Main Grid Layout */
	.prescription-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		width: 100%;
		max-width: 860px;
		margin: 0 auto;
		transition: all 0.2s ease;
		align-items: start;
	}

	.prescription-grid.with-preview {
		max-width: 1400px;
		grid-template-columns: 1.08fr 0.92fr;
	}

	.form-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.card-section {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.section-title-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.section-num {
		background: #000000;
		color: #ffffff;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 800;
	}

	.section-title h2 {
		margin: 0;
		font-size: 1.1rem;
		color: #000000;
		font-weight: 700;
	}

	.btn-text-action {
		background: #ffffff;
		border: 1px solid #cbd5e1;
		color: #0f172a;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-text-action:hover {
		background: #000000;
		color: #ffffff;
		border-color: #000000;
	}

	.badge-age {
		background: #f1f5f9;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.78rem;
		font-weight: 700;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #334155;
	}

	.form-input,
	.form-select,
	.form-textarea {
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 0.65rem 0.85rem;
		color: #0f172a;
		font-size: 0.9rem;
		outline: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		width: 100%;
		box-sizing: border-box;
		font-family: inherit;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		border-color: #000000;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
	}

	.unit-preview-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-left: 3px solid #000000;
		border-radius: 6px;
		padding: 0.85rem 1rem;
		margin-top: 0.75rem;
	}

	.unit-preview-name {
		font-weight: 700;
		color: #000000;
		font-size: 0.92rem;
		margin-bottom: 0.25rem;
	}

	.unit-preview-details {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.8rem;
		color: #475569;
	}

	.checkbox-wrapper {
		margin-top: 0.5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		cursor: pointer;
		font-size: 0.85rem;
		color: #334155;
	}

	.checkbox-label input {
		width: 16px;
		height: 16px;
		accent-color: #000000;
	}

	/* Medications Section */
	.med-actions-buttons {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.btn-secondary-sm {
		background: #ffffff;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		padding: 0.4rem 0.8rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-secondary-sm:hover {
		background: #000000;
		color: #ffffff;
		border-color: #000000;
	}

	.empty-meds-box {
		padding: 2.5rem 1.5rem;
		text-align: center;
		background: #f8fafc;
		border: 1px dashed #cbd5e1;
		border-radius: 8px;
		color: #64748b;
	}

	.empty-meds-box .empty-icon {
		font-size: 2.2rem;
		display: block;
		margin-bottom: 0.5rem;
		opacity: 0.6;
	}

	.empty-hint {
		font-size: 0.82rem;
		margin-top: 0.25rem;
		color: #64748b;
	}

	.medications-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.med-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 0.9rem 1rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.med-card:hover {
		border-color: #94a3b8;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
	}

	.med-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.med-title-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.med-order-badge {
		background: #f1f5f9;
		color: #0f172a;
		font-size: 0.72rem;
		font-weight: 800;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #cbd5e1;
	}

	.med-card-title {
		font-size: 0.92rem;
		color: #000000;
		font-weight: 700;
	}

	.badge-route {
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		background: #f1f5f9;
		color: #334155;
		border: 1px solid #cbd5e1;
		text-transform: uppercase;
	}

	.med-controls {
		display: flex;
		gap: 0.25rem;
	}

	.btn-icon-tiny {
		background: #ffffff;
		border: 1px solid #cbd5e1;
		color: #475569;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		font-size: 0.72rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon-tiny:hover:not(:disabled) {
		background: #f1f5f9;
		color: #000000;
		border-color: #94a3b8;
	}

	.btn-icon-tiny.delete:hover {
		background: #fef2f2;
		border-color: #dc2626;
		color: #dc2626;
	}

	.btn-icon-tiny:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.med-card-body {
		font-size: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.posology-line {
		color: #334155;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.qty-line {
		color: #000000;
		font-size: 0.82rem;
		font-weight: 600;
	}

	.instructions-line {
		color: #64748b;
		font-size: 0.8rem;
		font-style: italic;
	}

	/* RIGHT COLUMN: PREVIEW */
	.preview-sticky-card {
		position: sticky;
		top: 1.5rem;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 1.25rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.preview-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.preview-title h3 {
		margin: 0;
		font-size: 0.95rem;
		color: #000000;
		font-weight: 700;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-close-preview {
		background: transparent;
		border: 1px solid #cbd5e1;
		color: #64748b;
		padding: 0.35rem 0.65rem;
		border-radius: 5px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-close-preview:hover {
		background: #f1f5f9;
		color: #000000;
		border-color: #94a3b8;
	}

	.btn-print-action {
		background: #000000;
		color: #ffffff;
		border: 1px solid #000000;
		padding: 0.35rem 0.8rem;
		border-radius: 5px;
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-print-action:hover {
		background: #27272a;
	}

	.preview-viewport {
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 10px;
		overflow-x: auto;
	}

	.preview-paper-sheet {
		background: white;
		color: #0f172a;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		display: grid;
		grid-template-columns: minmax(0, 1fr) 10px minmax(0, 1fr);
		font-size: 8.5pt;
		min-height: 460px;
		line-height: 1.25;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.preview-col {
		padding: 10px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.preview-via-tag {
		position: absolute;
		top: 6px;
		right: 8px;
		font-size: 6.5pt;
		font-weight: 800;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		padding: 1px 4px;
		border-radius: 3px;
		color: #475569;
	}

	.p-unit-head {
		text-align: center;
		border-bottom: 1.5px solid #0f172a;
		padding-bottom: 4px;
		margin-bottom: 6px;
	}

	.p-unit-head h4 {
		margin: 0 0 1px;
		font-size: 8.5pt;
		font-weight: 800;
	}

	.p-unit-head p {
		margin: 0;
		font-size: 6.5pt;
		color: #475569;
	}

	.p-patient-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 4px;
		padding: 4px 6px;
		margin-bottom: 6px;
		font-size: 7.5pt;
	}

	.p-patient-name {
		color: #0f172a;
	}

	.p-patient-meta {
		display: flex;
		gap: 8px;
		margin-top: 2px;
		font-size: 6.5pt;
		color: #64748b;
		border-top: 1px dashed #cbd5e1;
		padding-top: 2px;
	}

	.p-meds-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 5px;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}

	.p-empty-placeholder {
		color: #94a3b8;
		font-style: italic;
		text-align: center;
		padding: 20px 0;
		font-size: 7.5pt;
	}

	.p-group {
		margin-bottom: 3px;
		width: 100%;
		max-width: 100%;
	}

	.p-group-title {
		font-size: 8.5pt;
		font-weight: 800;
		border-bottom: 1px solid #0f172a;
		padding-bottom: 1px;
		margin-bottom: 4px;
		text-transform: uppercase;
	}

	.p-med-row {
		margin-bottom: 4px;
		padding-left: 2px;
		width: 100%;
		max-width: 100%;
	}

	.p-med-line-1 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		width: 100%;
		max-width: 100%;
		font-size: 8pt;
		font-weight: 700;
		color: #0f172a;
		row-gap: 2px;
	}

	.p-med-left {
		display: inline-flex;
		align-items: baseline;
		gap: 3px;
		flex: 0 1 auto;
		max-width: 100%;
		white-space: normal;
		word-break: break-word;
		overflow-wrap: break-word;
	}

	.p-med-num {
		font-weight: 700;
		font-size: 8pt;
		flex-shrink: 0;
	}

	.p-med-name {
		font-size: 8pt;
		font-weight: 700;
		white-space: normal;
		word-break: break-word;
		overflow-wrap: break-word;
	}

	.p-med-fill-line {
		flex: 1 1 15px;
		border-bottom: 1px dashed #64748b;
		margin: 0 4px 2px 4px;
		min-width: 10px;
	}

	.p-med-qty {
		font-weight: 700;
		font-size: 8pt;
		white-space: nowrap;
		margin-left: auto;
		flex-shrink: 0;
	}

	.p-med-poso {
		font-size: 7.5pt;
		color: #1e293b;
		padding-left: 10px;
		line-height: 1.3;
	}

	.p-med-obs {
		font-size: 7pt;
		color: #64748b;
		font-style: italic;
		padding-left: 10px;
	}

	.p-custom-box {
		background: #f1f5f9;
		border-left: 2px solid #0284c7;
		padding: 3px 5px;
		font-size: 7pt;
		margin-top: 4px;
	}

	.p-doctor-foot {
		border-top: none;
		padding-top: 0;
		margin-top: 14px;
		text-align: center;
	}

	.p-sign-line {
		width: 70%;
		margin: 0 auto 3px;
		border-top: 1px solid #0f172a;
	}

	.p-doc-name {
		font-weight: 700;
		font-size: 7.5pt;
	}

	.p-doc-crm {
		font-size: 6.5pt;
		color: #64748b;
	}

	.p-date-line {
		font-size: 6.5pt;
		color: #64748b;
		margin-top: 8px;
		margin-bottom: 0;
	}

	.preview-cut-line {
		border-left: 1px dashed #94a3b8;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		padding: 10px 0;
		font-size: 9px;
		color: #94a3b8;
	}

	/* Modal Styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(3px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-dialog {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		width: 100%;
		max-width: 580px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.1rem 1.4rem;
		border-bottom: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.05rem;
		color: #000000;
		font-weight: 700;
	}

	.modal-close {
		background: transparent;
		border: none;
		color: #64748b;
		font-size: 1.25rem;
		cursor: pointer;
	}

	.modal-close:hover {
		color: #000000;
	}

	.modal-body {
		padding: 1.4rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.modal-info-text {
		font-size: 0.85rem;
		color: #334155;
		background: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 0.6rem 0.8rem;
		margin: 0;
	}

	.modal-footer {
		padding: 1.1rem 1.4rem;
		border-top: 1px solid #e2e8f0;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		background: #f8fafc;
	}

	.btn-secondary {
		background: #ffffff;
		color: #0f172a;
		border: 1px solid #cbd5e1;
		padding: 0.6rem 1rem;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-secondary:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}

	.btn-primary {
		background: #000000;
		color: #ffffff;
		border: 1px solid #000000;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-primary:hover {
		background: #27272a;
	}

	@media (max-width: 1024px) {
		.prescription-grid.with-preview {
			grid-template-columns: 1fr;
		}

		.preview-sticky-card {
			position: static;
		}
	}

	@media (max-width: 640px) {
		.form-row-2 {
			grid-template-columns: 1fr;
		}

		.prescription-header {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
