import { apiFetch } from '$lib/api';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');

  try {
    // 1. Busca os dados do paciente (agora retorna prontuario_id também!)
    const paciente = await apiFetch<any>(`/api/v1/pacientes/${params.id}`, session.access_token);
    
    let consultas: any[] = [];
    let diagnosticos: any[] = [];
    let medicamentos: any[] = [];
    if (paciente.prontuario_id && locals.usuario?.role !== 'recepcionista') {
       // 2. Busca o histórico de consultas
       consultas = await apiFetch<any[]>(`/api/v1/consultas/prontuario/${paciente.prontuario_id}`, session.access_token);
       
       // 3. Busca os problemas/diagnósticos ativos e permanentes do paciente
       try {
         diagnosticos = await apiFetch<any[]>(`/api/v1/diagnosticos/ativos/${paciente.prontuario_id}`, session.access_token);
       } catch (diagErr) {
         console.error("Error loading active diagnoses for profile:", diagErr);
       }

       // 4. Busca o histórico de medicamentos estruturados do paciente (em uso / suspensos)
       try {
         medicamentos = await apiFetch<any[]>(`/api/v1/prescricoes/ativas/${paciente.prontuario_id}`, session.access_token);
       } catch (medErr) {
         console.error("Error loading active prescriptions for profile:", medErr);
       }
    }

    return {
      paciente,
      consultas,
      diagnosticos,
      medicamentos,
      usuario: locals.usuario,
      accessToken: session.access_token
    };
  } catch (err: any) {
    console.error("Error fetching patient profile:", err);
    throw error(err.status || 500, err.message || "Falha ao carregar o perfil do paciente.");
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
       const target = `/consulta/${response.id}`;
       throw redirect(303, target);
    } catch (err: any) {
       if (err.status && err.status >= 300 && err.status < 400) throw err;
       return fail(500, { error: err.message || "Não foi possível iniciar consulta." });
    }
  }
};
