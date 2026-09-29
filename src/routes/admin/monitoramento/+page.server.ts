import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import { getAdminUsageMetrics } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);

	if (!user) {
		throw redirect(303, '/login');
	}

	if (user.role !== 'admin') {
		// Usuário comum (médico) não tem autorização para acessar o painel de monitoramento
		throw redirect(303, '/');
	}

	const metrics = await getAdminUsageMetrics(event.platform);

	return {
		user,
		metrics
	};
};
