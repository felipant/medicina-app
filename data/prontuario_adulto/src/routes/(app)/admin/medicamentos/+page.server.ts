import type { PageServerLoad, Actions } from './$types'
import { apiFetch } from '$lib/api'
import { fail } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ url, locals, parent }) => {
  const { accessToken } = await parent()
  const q = url.searchParams.get('q') || ''
  const forma = url.searchParams.get('forma') || ''
  const sus = url.searchParams.get('sus') || ''
  const ativo = url.searchParams.get('ativo')
  const pagina = parseInt(url.searchParams.get('pagina') || '1')

  let path = `/api/v1/medicamentos?pagina=${pagina}`
  if (q) path += `&q=${encodeURIComponent(q)}`
  if (forma) path += `&forma=${encodeURIComponent(forma)}`
  if (sus) path += `&sus=${encodeURIComponent(sus)}`
  if (ativo !== null && ativo !== '') path += `&ativo=${ativo === 'true'}`

  const [data, formas] = await Promise.all([
    apiFetch<any>(path, accessToken),
    apiFetch<string[]>('/api/v1/medicamentos/formas', accessToken).catch(() => [])
  ])

  return {
    items: data.items,
    total: data.total,
    pagina: data.pagina,
    formas,
    filtros: { q, forma, sus, ativo: ativo ?? '' }
  }
}

export const actions: Actions = {
  salvar: async ({ request, locals }) => {
    const accessToken = locals.session?.access_token
    if (!accessToken) return fail(401, { erro: 'Não autorizado' })
    
    const dados = await request.json()
    const id = dados.id
    
    try {
      if (id) {
        // Update
        delete dados.id
        const res = await apiFetch(`/api/v1/medicamentos/${id}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify(dados)
        })
        return { success: true, item: res }
      } else {
        // Create
        const res = await apiFetch(`/api/v1/medicamentos`, accessToken, {
          method: 'POST',
          body: JSON.stringify(dados)
        })
        return { success: true, item: res }
      }
    } catch (e: any) {
      return fail(400, { erro: e.message })
    }
  },

  toggle: async ({ request, locals }) => {
    const accessToken = locals.session?.access_token
    if (!accessToken) return fail(401, { erro: 'Não autorizado' })
    
    const fd = await request.formData()
    const id = fd.get('id')
    if (!id) return fail(400, { erro: 'ID inválido' })

    try {
      await apiFetch(`/api/v1/medicamentos/${id}/toggle`, accessToken, {
        method: 'PATCH'
      })
      return { success: true }
    } catch (e: any) {
      return fail(400, { erro: e.message })
    }
  }
}
