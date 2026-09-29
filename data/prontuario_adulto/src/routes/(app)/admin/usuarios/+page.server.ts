import { apiFetch } from '$lib/api';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');
  
  // Garante que é admin (pode deixar o middleware ou conferir aqui)
  if (locals.usuario?.role !== 'admin') {
    throw error(403, "Acesso Negado");
  }

  try {
    const usuarios = await apiFetch<any[]>('/api/v1/admin/usuarios', session.access_token);
    return { usuarios };
  } catch (err: any) {
    return { usuarios: [], erro: err.message };
  }
};

export const actions: Actions = {
  criar: async ({ request, locals }) => {
    const token = locals.session?.access_token;
    if (!token) return fail(401, { erro: 'Não autenticado' });

    const data = await request.formData();
    const payload = {
      email: data.get('email') as string,
      senha: data.get('senha') as string,
      nome: data.get('nome') as string,
      role: data.get('role') as string
    };

    if (!payload.email || !payload.senha || !payload.nome || !payload.role) {
      return fail(400, { erro: 'Todos os campos são obrigatórios.' });
    }

    try {
      await apiFetch('/api/v1/admin/usuarios', token, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return { success: true };
    } catch (e: any) {
      return fail(400, { erro: e.message || 'Falha ao criar usuário.' });
    }
  },

  toggle: async ({ request, locals }) => {
    const token = locals.session?.access_token;
    if (!token) return fail(401, { erro: 'Não autenticado' });

    const data = await request.formData();
    const id = data.get('id');

    try {
      await apiFetch(`/api/v1/admin/usuarios/${id}/toggle`, token, { method: 'PATCH' });
      return { success: true };
    } catch (e: any) {
      return fail(400, { erro: 'Erro ao alterar status.' });
    }
  },

  mudar_role: async ({ request, locals }) => {
    const token = locals.session?.access_token;
    if (!token) return fail(401, { erro: 'Não autenticado' });

    const data = await request.formData();
    const id = data.get('id');
    const nova_role = data.get('role');

    try {
      await apiFetch(`/api/v1/admin/usuarios/${id}/role`, token, {
        method: 'PATCH',
        body: JSON.stringify({ nova_role })
      });
      return { success: true };
    } catch (e: any) {
      return fail(400, { erro: 'Erro ao alterar permissões.' });
    }
  }
};
