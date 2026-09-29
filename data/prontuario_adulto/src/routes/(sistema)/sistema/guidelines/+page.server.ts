import { fail, redirect } from '@sveltejs/kit'
import { apiFetch } from '$lib/api'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const [guidelines, categorias] = await Promise.all([
    apiFetch('/api/v1/guidelines?limit=200', locals.session!.access_token),
    apiFetch('/api/v1/guidelines/categorias', locals.session!.access_token),
  ])
  return { guidelines, categorias }
}

export const actions: Actions = {
  criar: async ({ request, locals }) => {
    const form = await request.formData()
    const body = {
      titulo:           form.get('titulo'),
      organizacao:      form.get('organizacao'),
      url:              form.get('url'),
      ano:              form.get('ano') ? Number(form.get('ano')) : null,
      categoria:        form.get('categoria'),
      descricao:        form.get('descricao') || null,
      cids_relacionados: (form.get('cids') as string || '')
                          .split(',').map(s => s.trim()).filter(Boolean),
      tags:             (form.get('tags') as string || '')
                          .split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      ordem:            Number(form.get('ordem') || 0),
    }
    try {
      await apiFetch('/api/v1/guidelines', locals.session!.access_token,
        { method: 'POST', body: JSON.stringify(body) })
      return { criar_ok: true }
    } catch (e: any) {
      return fail(422, { criar_erro: e.message })
    }
  },

  editar: async ({ request, locals }) => {
    const form = await request.formData()
    const id = form.get('id') as string
    const body = {
      titulo:           form.get('titulo'),
      organizacao:      form.get('organizacao'),
      url:              form.get('url'),
      ano:              form.get('ano') ? Number(form.get('ano')) : null,
      categoria:        form.get('categoria'),
      descricao:        form.get('descricao') || null,
      cids_relacionados: (form.get('cids') as string || '')
                          .split(',').map(s => s.trim()).filter(Boolean),
      tags:             (form.get('tags') as string || '')
                          .split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
      ordem:            Number(form.get('ordem') || 0),
    }
    try {
      await apiFetch(`/api/v1/guidelines/${id}`, locals.session!.access_token,
        { method: 'PUT', body: JSON.stringify(body) })
      return { editar_ok: true }
    } catch (e: any) {
      return fail(422, { editar_erro: e.message })
    }
  },

  toggle: async ({ request, locals }) => {
    const form = await request.formData()
    const id = form.get('id') as string
    try {
      await apiFetch(`/api/v1/guidelines/${id}/toggle`, locals.session!.access_token,
        { method: 'PATCH' })
      return { ok: true }
    } catch (e: any) {
      return fail(422, { erro: e.message })
    }
  },
}
