import { apiFetch } from '$lib/api';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const session = locals.session;
  if (!session) {
    throw redirect(303, '/login');
  }

  try {
    const pacientes = await apiFetch<any[]>('/api/v1/pacientes/', session.access_token);
    return { 
      pacientes,
      usuario: locals.usuario,
      accessToken: session.access_token
    };
  } catch (e: any) {
    console.error("FETCH ERROR PACK:", e);
    return { 
      pacientes: [], 
      usuario: locals.usuario,
      accessToken: session.access_token,
      error: e.message || "Erro desconhecido no apiFetch" 
    };
  }
};

export const actions: Actions = {
  nova_consulta: async ({ request, locals }) => {
    const session = locals.session;
    const usuario = locals.usuario;
    if (!session || !usuario) throw redirect(303, '/login');
    
    const formData = await request.formData();
    const prontuario_id = formData.get('prontuario_id') as string;
    
    if (!prontuario_id) {
      return fail(400, { error: "Paciente inválido ou sem prontuário." });
    }
    
    try {
       const response = await apiFetch<{id: string}>('/api/v1/consultas/', session.access_token, {
         method: 'POST',
         body: JSON.stringify({
           prontuario_id,
           medico_id: usuario.id
         })
       });
       
       // Redireciona com sucesso
       const target = `/consulta/${response.id}`;
       throw redirect(303, target);
    } catch (err: any) {
       // Rethrow redirect responses
       if (err.status && err.status >= 300 && err.status < 400) throw err;
       
       // Handle 409 Conflict — consulta em andamento
       const errMsg = err.message || '';
       if (errMsg.includes('consulta_id') || errMsg.includes('em andamento')) {
         try {
           const dados = JSON.parse(errMsg);
           return fail(409, {
             consulta_em_andamento: true,
             consulta_id: dados.consulta_id,
             criada_em: dados.criada_em,
             prontuario_id,
           });
         } catch {
           // fallback: tenta extrair consulta_id do detail
         }
       }
       
       return fail(500, { error: errMsg || "Não foi possível iniciar consulta." });
    }
  },

  finalizar_e_criar: async ({ request, locals }) => {
    const session = locals.session;
    const usuario = locals.usuario;
    if (!session || !usuario) throw redirect(303, '/login');

    const formData = await request.formData();
    const consulta_id = formData.get('consulta_id') as string;
    const prontuario_id = formData.get('prontuario_id') as string;

    try {
      // 1. Finaliza a consulta existente
      await apiFetch(`/api/v1/consultas/${consulta_id}/finalizar?forcar=true`,
        session.access_token, { method: 'POST' });

      // 2. Cria nova consulta
      const nova = await apiFetch<{ id: string }>('/api/v1/consultas/',
        session.access_token,
        { method: 'POST', body: JSON.stringify({ prontuario_id, medico_id: usuario.id }) });

      const target = `/consulta/${nova.id}`;
      throw redirect(303, target);
    } catch (err: any) {
      if (err.status && err.status >= 300 && err.status < 400) throw err;
      return fail(500, { error: err.message || "Erro ao finalizar e criar nova consulta." });
    }
  }
};
