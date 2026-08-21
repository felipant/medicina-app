import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserFromSession } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);
	if (!user) {
		throw redirect(303, '/login');
	}
	return {
		user: {
			email: user.email,
			role: user.role,
			createdAt: user.createdAt
		}
	};
};
