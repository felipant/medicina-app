import type { RequestEvent } from '@sveltejs/kit';
import { findUserByEmail } from '$lib/server/db';

export async function getUserFromSession(event: RequestEvent) {
	const userEmail = event.cookies.get('user_session');
	if (!userEmail) return null;
	const user = await findUserByEmail(event.platform, userEmail);
	return user;
}
