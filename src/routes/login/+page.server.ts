import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { findUserByEmail, createUser } from '$lib/server/db';
import { hashPassword, verifyPassword } from '$lib/server/crypto';
import { getUserFromSession } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);
	if (user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { email, error: 'Preencha o e-mail e a senha.' });
		}

		const user = await findUserByEmail(event.platform, email);
		if (!user) {
			return fail(400, { email, error: 'E-mail ou senha incorretos.' });
		}

		const isValid = await verifyPassword(password, user.passwordHash, user.salt);
		if (!isValid) {
			return fail(400, { email, error: 'E-mail ou senha incorretos.' });
		}

		// Definir cookie de sessão por 7 dias
		event.cookies.set('user_session', user.email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { email, error: 'Informe um e-mail e senha válidos.' });
		}

		if (password.length < 6) {
			return fail(400, { email, error: 'A senha deve ter pelo menos 6 caracteres.' });
		}

		const existing = await findUserByEmail(event.platform, email);
		if (existing) {
			return fail(400, { email, error: 'Este e-mail já está cadastrado.' });
		}

		const { hash, salt } = await hashPassword(password);
		await createUser(event.platform, email, hash, salt);

		event.cookies.set('user_session', email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	}
};
