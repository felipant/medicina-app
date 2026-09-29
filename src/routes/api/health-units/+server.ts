import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllHealthUnits } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, platform }) => {
	const search = url.searchParams.get('q') || undefined;
	const city = url.searchParams.get('city') || undefined;
	const activeOnlyParam = url.searchParams.get('activeOnly');
	const activeOnly = activeOnlyParam === 'false' ? false : true;

	try {
		const units = await getAllHealthUnits(platform, {
			search,
			city,
			activeOnly
		});

		return json({
			units,
			total: units.length
		});
	} catch (e) {
		console.error('Error fetching health units API:', e);
		return json({ units: [], total: 0, error: 'Erro ao carregar unidades de saúde' }, { status: 500 });
	}
};
