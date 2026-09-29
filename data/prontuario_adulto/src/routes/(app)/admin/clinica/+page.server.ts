import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session) return { clinica: null };
  try {
    const clinica = await apiFetch<any>('/api/v1/admin/clinica/minha', locals.session.access_token);
    return { clinica, accessToken: locals.session.access_token };
  } catch {
    return { clinica: null, accessToken: locals.session?.access_token };
  }
};
