import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllLabExams } from '$lib/server/db';

export const GET: RequestHandler = async ({ platform }) => {
	const exames = await getAllLabExams(platform, true);
	return json({ exames });
};

