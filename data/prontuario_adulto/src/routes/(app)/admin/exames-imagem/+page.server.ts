import { apiFetch } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.session!.access_token;
  
  const pagina = url.searchParams.get('pagina') || '1';
  const busca = url.searchParams.get('q') || '';
  const categoria = url.searchParams.get('categoria') || '';
  const ativo = url.searchParams.get('ativo') || '';

  let qs = `pagina=${pagina}&por_pagina=20`;
  if (busca) qs += `&q=${encodeURIComponent(busca)}`;
  if (categoria) qs += `&categoria=${encodeURIComponent(categoria)}`;
  if (ativo !== '') qs += `&ativo=${ativo}`;

  const [resItems, resCats] = await Promise.all([
    apiFetch<any>(`/api/v1/exames-imagem?${qs}`, token),
    apiFetch<string[]>('/api/v1/exames-imagem/categorias', token)
  ]);

  return {
    items: resItems.items || [],
    total: resItems.total || 0,
    pagina: parseInt(pagina),
    categorias: resCats,
    filtros: { busca, categoria, ativo }
  };
};

export const actions: Actions = {
  salvar: async ({ request, locals }) => {
    const token = locals.session!.access_token;
    const body = await request.json();
    
    try {
      if (body.id) {
        const data = await apiFetch(`/api/v1/exames-imagem/${body.id}`, token, { method: 'PUT', body: JSON.stringify(body) });
        return { success: true, data };
      } else {
        const data = await apiFetch(`/api/v1/exames-imagem`, token, { method: 'POST', body: JSON.stringify(body) });
        return { success: true, data };
      }
    } catch (e: any) {
      return fail(400, { erro: e.message });
    }
  },
  toggle: async ({ request, locals }) => {
    const token = locals.session!.access_token;
    const fd = await request.formData();
    const id = fd.get('id');
    try {
      await apiFetch(`/api/v1/exames-imagem/${id}/toggle`, token, { method: 'PATCH' });
      return { success: true };
    } catch (e) { return fail(400, { erro: 'Falha status' }); }
  }
};
