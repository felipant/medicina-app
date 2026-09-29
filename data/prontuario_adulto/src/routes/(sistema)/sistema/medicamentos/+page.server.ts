import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try {
    const medicamentos = await apiFetch<any[]>('/api/v1/sistema/medicamentos', accessToken);
    return { medicamentos };
  } catch { return { medicamentos: [] }; }
};
