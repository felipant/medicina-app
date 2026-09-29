import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try {
    const clinicas = await apiFetch<any[]>('/api/v1/sistema/clinicas', accessToken);
    return { clinicas };
  } catch { return { clinicas: [] }; }
};
