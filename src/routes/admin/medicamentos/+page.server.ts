import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import {
	getAllMedicationsAdmin,
	createMedicationAdmin,
	updateMedicationAdmin,
	deleteMedicationAdmin
} from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);

	if (!user) {
		throw redirect(303, '/login');
	}

	if (user.role !== 'admin') {
		throw redirect(303, '/');
	}

	const q = event.url.searchParams.get('q')?.trim() || '';
	const { medications, totalCount } = await getAllMedicationsAdmin(event.platform, {
		search: q,
		limit: 500
	});

	return {
		user,
		medications,
		totalCount,
		initialQuery: q
	};
};

export const actions: Actions = {
	create: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const principioAtivo = formData.get('principioAtivo')?.toString().trim() || '';
		const concentracao = formData.get('concentracao')?.toString().trim() || '';
		const formaFarmaceutica = formData.get('formaFarmaceutica')?.toString().trim() || 'Comprimido';
		const viaAdministracao = formData.get('viaAdministracao')?.toString().trim() || 'Oral';
		const classeTerapeutica =
			formData.get('classeTerapeutica')?.toString().trim() || 'Outros / Não classificado';
		const classeCodigo = formData.get('classeCodigo')?.toString().trim() || '';

		if (!principioAtivo) {
			return fail(400, {
				message: 'Informe o Princípio Ativo / Nome do Medicamento.'
			});
		}

		try {
			const created = await createMedicationAdmin(event.platform, {
				principioAtivo,
				concentracao,
				formaFarmaceutica,
				viaAdministracao,
				classeTerapeutica,
				classeCodigo
			});

			return { success: true, createdMedication: created };
		} catch (e) {
			console.error('Error creating medication:', e);
			return fail(500, { message: 'Erro ao cadastrar medicamento.' });
		}
	},

	update: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const principioAtivo = formData.get('principioAtivo')?.toString().trim() || '';
		const concentracao = formData.get('concentracao')?.toString().trim() || '';
		const formaFarmaceutica = formData.get('formaFarmaceutica')?.toString().trim() || 'Comprimido';
		const viaAdministracao = formData.get('viaAdministracao')?.toString().trim() || 'Oral';
		const classeTerapeutica =
			formData.get('classeTerapeutica')?.toString().trim() || 'Outros / Não classificado';
		const classeCodigo = formData.get('classeCodigo')?.toString().trim() || '';

		if (!id || !principioAtivo) {
			return fail(400, { message: 'ID e Princípio Ativo são obrigatórios.' });
		}

		try {
			const updated = await updateMedicationAdmin(event.platform, id, {
				principioAtivo,
				concentracao,
				formaFarmaceutica,
				viaAdministracao,
				classeTerapeutica,
				classeCodigo
			});

			if (!updated) {
				return fail(404, { message: 'Medicamento não encontrado.' });
			}

			return { success: true, updatedMedication: updated };
		} catch (e) {
			console.error('Error updating medication:', e);
			return fail(500, { message: 'Erro ao atualizar medicamento.' });
		}
	},

	delete: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		if (!id) {
			return fail(400, { message: 'ID do medicamento é obrigatório.' });
		}

		try {
			await deleteMedicationAdmin(event.platform, id);
			return { success: true };
		} catch (e) {
			console.error('Error deleting medication:', e);
			return fail(500, { message: 'Erro ao remover medicamento.' });
		}
	}
};

