import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import {
	getAllHealthUnits,
	createHealthUnit,
	updateHealthUnit,
	toggleHealthUnitActive,
	deleteHealthUnit
} from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);

	if (!user) {
		throw redirect(303, '/login');
	}

	if (user.role !== 'admin') {
		throw redirect(303, '/');
	}

	const units = await getAllHealthUnits(event.platform);

	return {
		user,
		units
	};
};

export const actions: Actions = {
	create: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();
		const address = formData.get('address')?.toString().trim();
		const cep = formData.get('cep')?.toString().trim() || '35500-000';
		const neighborhood = formData.get('neighborhood')?.toString().trim();
		const city = formData.get('city')?.toString().trim() || 'Divinópolis';
		const state = formData.get('state')?.toString().trim() || 'Minas Gerais';
		const email = formData.get('email')?.toString().trim() || null;
		const businessHours = formData.get('businessHours')?.toString().trim() || 'De 07:00 às 17:00';
		const active = formData.get('active') === '0' ? 0 : 1;

		if (!name || !phone || !address || !neighborhood) {
			return fail(400, {
				message: 'Preencha os campos obrigatórios: Nome, Telefone, Endereço e Bairro.'
			});
		}

		try {
			const unit = await createHealthUnit(event.platform, {
				name,
				phone,
				address,
				cep,
				neighborhood,
				city,
				state,
				email,
				businessHours,
				active,
				source: 'admin_manual'
			});

			return { success: true, createdUnit: unit };
		} catch (e: any) {
			console.error('Error creating health unit:', e);
			return fail(500, { message: 'Erro ao cadastrar unidade de saúde.' });
		}
	},

	update: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const name = formData.get('name')?.toString().trim();
		const phone = formData.get('phone')?.toString().trim();
		const address = formData.get('address')?.toString().trim();
		const cep = formData.get('cep')?.toString().trim();
		const neighborhood = formData.get('neighborhood')?.toString().trim();
		const city = formData.get('city')?.toString().trim();
		const state = formData.get('state')?.toString().trim();
		const email = formData.get('email')?.toString().trim() || null;
		const businessHours = formData.get('businessHours')?.toString().trim();
		const active = formData.get('active') !== null ? (formData.get('active') === '1' ? 1 : 0) : undefined;

		if (!id) {
			return fail(400, { message: 'ID da unidade é obrigatório.' });
		}

		try {
			const updated = await updateHealthUnit(event.platform, id, {
				name,
				phone,
				address,
				cep,
				neighborhood,
				city,
				state,
				email,
				businessHours,
				active
			});

			if (!updated) {
				return fail(404, { message: 'Unidade de saúde não encontrada.' });
			}

			return { success: true, updatedUnit: updated };
		} catch (e: any) {
			console.error('Error updating health unit:', e);
			return fail(500, { message: 'Erro ao atualizar unidade de saúde.' });
		}
	},

	toggleActive: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const active = formData.get('active') === '1';

		if (!id) {
			return fail(400, { message: 'ID da unidade é obrigatório.' });
		}

		try {
			await toggleHealthUnitActive(event.platform, id, active);
			return { success: true };
		} catch (e) {
			console.error('Error toggling health unit active:', e);
			return fail(500, { message: 'Erro ao alterar status da unidade.' });
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
			return fail(400, { message: 'ID da unidade é obrigatório.' });
		}

		try {
			await deleteHealthUnit(event.platform, id);
			return { success: true, deletedId: id };
		} catch (e) {
			console.error('Error deleting health unit:', e);
			return fail(500, { message: 'Erro ao excluir unidade de saúde.' });
		}
	}
};
