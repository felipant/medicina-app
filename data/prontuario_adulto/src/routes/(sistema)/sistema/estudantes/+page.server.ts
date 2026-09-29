import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try {
    const estudantes = await apiFetch<any[]>('/api/v1/sistema/estudantes', accessToken);
    return { estudantes };
  } catch { return { estudantes: [] }; }
};
