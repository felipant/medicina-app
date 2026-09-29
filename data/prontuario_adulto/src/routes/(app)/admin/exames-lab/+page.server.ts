import { apiFetch } from '$lib/api';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const token = locals.session!.access_token;
  
  const pagina = url.searchParams.get('pagina') || '1';
  const busca = url.searchParams.get('busca') || '';
  const pacote = url.searchParams.get('pacote') || '';
  const material = url.searchParams.get('material') || '';
  const ativo = url.searchParams.get('ativo') || '';

  let queryStr = `pagina=${pagina}&por_pagina=20`;
  if (busca) queryStr += `&busca=${encodeURIComponent(busca)}`;
  if (pacote) queryStr += `&pacote=${encodeURIComponent(pacote)}`;
  if (material) queryStr += `&material=${encodeURIComponent(material)}`;
  if (ativo !== '') queryStr += `&ativo=${ativo}`;

  const [resPaginated, resPacotes] = await Promise.all([
    apiFetch<any>(`/api/v1/exames/catalogo?${queryStr}`, token),
    apiFetch<any[]>(`/api/v1/exames/catalogo/pacotes`, token)
  ]);

  return {
    items: resPaginated.items || [],
    total: resPaginated.total || 0,
    pagina: parseInt(pagina),
    pacotes: resPacotes.map((p: any) => p.pacote),
    filtros: { busca, pacote, material, ativo }
  };
};

export const actions: Actions = {
  salvar: async ({ request, locals }) => {
    if (!locals.session) return fail(401, { erro: 'Não autenticado' });
    const token = locals.session.access_token;
    
    const form = await request.formData();
    const id = form.get('id') as string | null;
    
    // Extrair e validar campos obrigatórios antes de chamar o backend (Conforme seção 4.2)
    const nome = (form.get('nome') as string)?.trim();
    const pacote = (form.get('pacote') as string)?.trim();
    const material = form.get('material') as string;
    const tipo_resultado = form.get('tipo_resultado') as string;

    if (!nome || !pacote || !material || !tipo_resultado) {
      return fail(400, {
        erro: 'Campos obrigatórios ausentes: nome, pacote, material, tipo_resultado',
      });
    }

    const body = {
      nome,
      pacote,
      material,
      tipo_resultado,
      unidade:    (form.get('unidade') as string) || null,
      ref_min:    form.get('ref_min')   ? Number(form.get('ref_min'))   : null,
      ref_max:    form.get('ref_max')   ? Number(form.get('ref_max'))   : null,
      ref_min_m:  form.get('ref_min_m') ? Number(form.get('ref_min_m')) : null,
      ref_max_m:  form.get('ref_max_m') ? Number(form.get('ref_max_m')) : null,
      ref_min_f:  form.get('ref_min_f') ? Number(form.get('ref_min_f')) : null,
      ref_max_f:  form.get('ref_max_f') ? Number(form.get('ref_max_f')) : null,
      ref_texto:  (form.get('ref_texto') as string) || null,
      significado:(form.get('significado') as string) || null,
    };

    try {
      if (id) {
        // Editar
        await apiFetch(`/api/v1/exames/catalogo/${id}`, token, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      } else {
        // Criar
        await apiFetch(`/api/v1/exames/catalogo`, token, {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
      return { ok: true };
    } catch (e: any) {
      return fail(422, { erro: e.message ?? 'Erro ao salvar exame no catálogo.' });
    }
  },
  
  toggle: async ({ request, locals }) => {
    const token = locals.session!.access_token;
    const data = await request.formData();
    const id = data.get('id');
    
    try {
      await apiFetch(`/api/v1/exames/catalogo/${id}/toggle`, token, {
        method: 'PATCH'
      });
      return { success: true };
    } catch (e: any) {
      return fail(400, { erro: 'Não foi possível alterar o status.' });
    }
  }
};
