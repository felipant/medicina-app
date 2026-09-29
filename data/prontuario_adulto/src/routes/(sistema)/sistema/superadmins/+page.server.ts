import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try { return { superadmins: await apiFetch<any[]>('/api/v1/sistema/superadmins', accessToken) }; }
  catch { return { superadmins: [] }; }
};
