import { apiFetch } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');

  try {
    const [paciente, historico, pacotes] = await Promise.all([
      apiFetch<any>(`/api/v1/pacientes/${params.id}`, session.access_token),
      apiFetch<any[]>(`/api/v1/exames/pacientes/${params.id}/exames/historico`, session.access_token),
      apiFetch<any[]>(`/api/v1/exames/catalogo/pacotes`, session.access_token)
    ]);

    return {
      paciente,
      historico,
      catalogoPacotes: pacotes,
      accessToken: session.access_token
    };
  } catch (err: any) {
    throw error(err.status || 500, err.message || "Erro de rede ao carregar módulo de exames");
  }
}
