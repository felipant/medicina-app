import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	findUserByEmail,
	createUser,
	countRecentRegistrationsByIP,
	recordRegistrationAttempt,
	createSession
} from '$lib/server/db';
import { hashPassword, verifyPassword } from '$lib/server/crypto';
import { getUserFromSession, getClientIP } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	const user = await getUserFromSession(event);
	if (user) {
		throw redirect(303, '/');
	}
	return {};
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim() || '';
		const password = formData.get('password')?.toString() || '';

		if (!email || !password) {
			return fail(400, { email, mode: 'login', error: 'Preencha o e-mail e a senha.' });
		}

		const user = await findUserByEmail(event.platform, email);
		if (!user) {
			return fail(400, { email, mode: 'login', error: 'E-mail ou senha incorretos.' });
		}

		const isValid = await verifyPassword(password, user.passwordHash, user.salt);
		if (!isValid) {
			return fail(400, { email, mode: 'login', error: 'E-mail ou senha incorretos.' });
		}

		// Criar registro de sessão para monitoramento de uso
		const sessionId = await createSession(event.platform, user.id);

		// Definir cookies de sessão por 7 dias
		event.cookies.set('user_session', user.email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		event.cookies.set('user_session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString().trim() || '';
		const email = formData.get('email')?.toString().trim().toLowerCase() || '';
		const institution = formData.get('institution')?.toString().trim() || 'UFSJ';
		const password = formData.get('password')?.toString() || '';

		// 1. Limite por IP (Máximo de 3 cadastros no mesmo IP por dia / 24h)
		const clientIp = getClientIP(event);
		const recentRegistrations = await countRecentRegistrationsByIP(event.platform, clientIp);

		if (recentRegistrations >= 3) {
			return fail(429, {
				name,
				email,
				institution,
				mode: 'register',
				error: 'Limite de cadastros diários atingido para este endereço IP. Por favor, tente novamente mais tarde.'
			});
		}

		// 2. Validações de campos obrigatórios
		if (!name) {
			return fail(400, {
				name,
				email,
				institution,
				mode: 'register',
				error: 'Por favor, preencha o seu nome completo.'
			});
		}

		if (!email || !EMAIL_REGEX.test(email)) {
			return fail(400, {
				name,
				email,
				institution,
				mode: 'register',
				error: 'Por favor, informe um endereço de e-mail profissional válido (ex: nome@dominio.com).'
			});
		}

		if (!password || password.length < 6) {
			return fail(400, {
				name,
				email,
				institution,
				mode: 'register',
				error: 'A senha de acesso deve ter pelo menos 6 caracteres.'
			});
		}

		// 3. Verificação de unicidade de e-mail
		const existing = await findUserByEmail(event.platform, email);
		if (existing) {
			return fail(400, {
				name,
				email,
				institution,
				mode: 'register',
				error: 'Este endereço de e-mail já está cadastrado no sistema.'
			});
		}

		// 4. Criação do usuário com Hash SHA-256 + Salt
		const { hash, salt } = await hashPassword(password);
		const user = await createUser(event.platform, {
			name,
			email,
			institution,
			passwordHash: hash,
			salt,
			role: 'med'
		});

		// 5. Registrar tentativa bem-sucedida para controle de IP
		await recordRegistrationAttempt(event.platform, clientIp, user.id);

		// 6. Iniciar sessão do usuário
		const sessionId = await createSession(event.platform, user.id);

		event.cookies.set('user_session', email, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		event.cookies.set('user_session_id', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	}
};
