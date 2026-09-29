import { apiFetch } from '$lib/api';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  if (!session) throw redirect(303, '/login');

  try {
    const paciente = await apiFetch<any>(`/api/v1/pacientes/${params.id}`, session.access_token);
    return { paciente };
  } catch (err: any) {
    throw error(err.status || 500, err.message || 'Paciente não encontrado ou erro de carregamento');
  }
}
