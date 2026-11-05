import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import {
	getAllLabExams,
	createLabExam,
	updateLabExam,
	deleteLabExam
} from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);

	if (!user) {
		throw redirect(303, '/login');
	}

	if (user.role !== 'admin') {
		throw redirect(303, '/');
	}

	const exams = await getAllLabExams(event.platform, false);

	return {
		user,
		exams
	};
};

export const actions: Actions = {
	create: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const nome = formData.get('nome')?.toString().trim() || '';
		const material = formData.get('material')?.toString().trim() || 'SANGUE';
		const pacote = formData.get('pacote')?.toString().trim() || '';
		const unidade = formData.get('unidade')?.toString().trim() || '';
		const valoresReferencia = formData.get('valoresReferencia')?.toString().trim() || '';
		const active = formData.get('active') === '0' ? 0 : 1;

		if (!nome) {
			return fail(400, {
				message: 'Informe o nome do exame laboratorial.'
			});
		}

		try {
			const created = await createLabExam(event.platform, {
				nome,
				material,
				pacote,
				unidade,
				valoresReferencia,
				active
			});

			return { success: true, createdExam: created };
		} catch (e) {
			console.error('Error creating lab exam:', e);
			return fail(500, { message: 'Erro ao cadastrar exame laboratorial.' });
		}
	},

	update: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const nome = formData.get('nome')?.toString().trim();
		const material = formData.get('material')?.toString().trim();
		const pacote = formData.get('pacote')?.toString().trim();
		const unidade = formData.get('unidade')?.toString().trim();
		const valoresReferencia = formData.get('valoresReferencia')?.toString().trim();
		const active =
			formData.get('active') !== null ? (formData.get('active') === '1' ? 1 : 0) : undefined;

		if (!id || !nome) {
			return fail(400, { message: 'ID e Nome do exame são obrigatórios.' });
		}

		try {
			const updated = await updateLabExam(event.platform, id, {
				nome,
				material,
				pacote,
				unidade,
				valoresReferencia,
				active
			});

			if (!updated) {
				return fail(404, { message: 'Exame laboratorial não encontrado.' });
			}

			return { success: true, updatedExam: updated };
		} catch (e) {
			console.error('Error updating lab exam:', e);
			return fail(500, { message: 'Erro ao atualizar exame laboratorial.' });
		}
	},

	toggleActive: async (event) => {
		const user = await getUserFromSession(event);
		if (!user || user.role !== 'admin') {
			return fail(403, { message: 'Acesso não autorizado' });
		}

		const formData = await event.request.formData();
		const id = Number(formData.get('id'));
		const active = formData.get('active') === '1' ? 1 : 0;

		if (!id) {
			return fail(400, { message: 'ID do exame é obrigatório.' });
		}

		try {
			await updateLabExam(event.platform, id, { active });
			return { success: true };
		} catch (e) {
			console.error('Error toggling lab exam active:', e);
			return fail(500, { message: 'Erro ao alterar status do exame.' });
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
			return fail(400, { message: 'ID do exame é obrigatório.' });
		}

		try {
			await deleteLabExam(event.platform, id);
			return { success: true };
		} catch (e) {
			console.error('Error deleting lab exam:', e);
			return fail(500, { message: 'Erro ao remover exame laboratorial.' });
		}
	}
};

