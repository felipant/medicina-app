import { apiFetch } from '$lib/api';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ parent }) => {
  const { accessToken } = await parent();
  try { return { exames: await apiFetch<any[]>('/api/v1/sistema/exames-lab?por_pagina=200', accessToken) }; }
  catch { return { exames: [] }; }
};
