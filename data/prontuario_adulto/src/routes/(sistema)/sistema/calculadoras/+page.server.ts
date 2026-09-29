import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try {
    const calculadoras = await apiFetch<any[]>('/api/v1/calculadoras', accessToken);
    return { calculadoras };
  } catch (err) {
    console.error("Falha ao carregar calculadoras:", err);
    return { calculadoras: [] };
  }
};
