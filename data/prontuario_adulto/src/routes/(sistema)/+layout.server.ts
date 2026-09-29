import { redirect } from '@sveltejs/kit'
import { apiFetch } from '$lib/api'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) redirect(303, '/login')

  try {
    const sa = await apiFetch<{ id: string; nome: string; email: string }>(
      '/api/v1/sistema/me',
      locals.session.access_token
    )
    return { superadmin: sa, accessToken: locals.session.access_token }
  } catch {
    redirect(303, '/pacientes')
  }
}
