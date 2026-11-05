import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchMedicationsCatalog } from '$lib/server/db';

export const GET: RequestHandler = async ({ url, platform }) => {
	const q = url.searchParams.get('q')?.trim() || '';
	if (!q || q.length < 2) {
		return json({ medicamentos: [], principios_ativos: [] });
	}

	const result = await searchMedicationsCatalog(platform, q);
	return json(result);
};
