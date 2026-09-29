import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import { hashPassword, verifyPassword } from '$lib/server/crypto';
import { updateUserPassword } from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
	const user = await getUserFromSession(event);
	if (!user) {
		return json({ success: false, error: 'Usuário não autenticado.' }, { status: 401 });
	}

	try {
		const body = (await event.request.json()) as any;
		const currentPassword = (body?.currentPassword || '').toString();
		const newPassword = (body?.newPassword || '').toString();
		const confirmPassword = (body?.confirmPassword || '').toString();

		if (!currentPassword || !newPassword || !confirmPassword) {
			return json(
				{ success: false, error: 'Por favor, preencha todos os campos.' },
				{ status: 400 }
			);
		}

		if (newPassword.length < 6) {
			return json(
				{ success: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' },
				{ status: 400 }
			);
		}

		if (newPassword !== confirmPassword) {
			return json(
				{ success: false, error: 'A confirmação de senha não confere com a nova senha.' },
				{ status: 400 }
			);
		}

		// Verify current password
		const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash, user.salt);
		if (!isCurrentValid) {
			return json(
				{ success: false, error: 'A senha atual informada está incorreta.' },
				{ status: 400 }
			);
		}

		if (currentPassword === newPassword) {
			return json(
				{ success: false, error: 'A nova senha não pode ser idêntica à senha atual.' },
				{ status: 400 }
			);
		}

		// Hash and update
		const { hash, salt } = await hashPassword(newPassword);
		const updated = await updateUserPassword(event.platform, user.id, hash, salt);

		if (!updated) {
			return json(
				{ success: false, error: 'Erro ao salvar a nova senha no banco de dados.' },
				{ status: 500 }
			);
		}

		return json({
			success: true,
			message: 'Sua senha foi alterada com sucesso!'
		});
	} catch (e: any) {
		console.error('Error changing password:', e);
		return json(
			{ success: false, error: 'Erro interno ao processar a alteração de senha.' },
			{ status: 500 }
		);
	}
};
