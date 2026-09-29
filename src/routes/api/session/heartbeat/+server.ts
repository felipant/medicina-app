import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateSessionHeartbeat } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
	const sessionId = event.cookies.get('user_session_id');
	if (sessionId) {
		await updateSessionHeartbeat(event.platform, sessionId);
	}
	return json({ ok: true });
};
