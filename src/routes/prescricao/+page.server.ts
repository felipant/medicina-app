import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import { getAllHealthUnits } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);

	if (!user) {
		throw redirect(303, '/login');
	}

	const officialUnits = await getAllHealthUnits(event.platform, { activeOnly: true });

	return {
		user,
		officialUnits
	};
};
