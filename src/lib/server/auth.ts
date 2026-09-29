import type { RequestEvent } from '@sveltejs/kit';
import { findUserByEmail } from '$lib/server/db';

export async function getUserFromSession(event: RequestEvent) {
	const userEmail = event.cookies.get('user_session');
	if (!userEmail) return null;
	const user = await findUserByEmail(event.platform, userEmail);
	return user;
}

export function getClientIP(event: RequestEvent): string {
	const cfIP = event.request.headers.get('cf-connecting-ip');
	if (cfIP) return cfIP.trim();

	const xForwardedFor = event.request.headers.get('x-forwarded-for');
	if (xForwardedFor) {
		const first = xForwardedFor.split(',')[0].trim();
		if (first) return first;
	}

	try {
		return event.getClientAddress() || '127.0.0.1';
	} catch (_) {
		return '127.0.0.1';
	}
}
