import { apiFetch } from '$lib/api';
import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  const usuario = locals.usuario;

  if (!session || !usuario) {
    throw redirect(303, '/login');
  }

  if (usuario.role === 'recepcionista') {
    throw error(403, "Acesso negado. O prontuário clínico é restrito a profissionais de saúde autorizados.");
  }

  try {
    // Busca os detalhes da consulta (inclui JSONB blocks)
    const consulta = await apiFetch<any>(
      `/api/v1/consultas/${params.id}/detalhes`,
      session.access_token
    );
    
    return {
      consulta,
      accessToken: session.access_token,
      usuarioRole: usuario.role
    };
  } catch (err: any) {
    console.error("Erro load consulta:", err);
    throw error(err.status || 500, "Não foi possível carregar os dados da consulta.");
  }
};

export const actions: Actions = {
  // Salva rascunho sem finalizar (chamado pelo autosave)
  salvar: async ({ request, locals, params }) => {
    if (!locals.session) return fail(401, { erro: 'Não autenticado' });
    const dados = await request.json();
    await apiFetch(
      `/api/v1/consultas/${params.id}`,
      locals.session.access_token,
      { method: 'PUT', body: JSON.stringify(dados) }
    );
    return { ok: true };
  },

  // Finaliza e redireciona para /pacientes
  finalizar: async ({ locals, params }) => {
    if (!locals.session) return fail(401, { erro: 'Não autenticado' });

    try {
      await apiFetch(
        `/api/v1/consultas/${params.id}/finalizar`,
        locals.session.access_token,
        { method: 'POST' }
      );
    } catch (e: any) {
      // Backend retorna 422 se completude < 80%
      return fail(422, { erro: e.message ?? 'Não foi possível finalizar a consulta.' });
    }

    // Sucesso: volta para a lista de pacientes
    throw redirect(303, '/pacientes');
  },
};
