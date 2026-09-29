import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { endSession } from '$lib/server/db';

export const actions: Actions = {
	default: async (event) => {
		const sessionId = event.cookies.get('user_session_id');
		if (sessionId) {
			await endSession(event.platform, sessionId);
		}
		event.cookies.delete('user_session', { path: '/' });
		event.cookies.delete('user_session_id', { path: '/' });
		throw redirect(303, '/login');
	}
};
