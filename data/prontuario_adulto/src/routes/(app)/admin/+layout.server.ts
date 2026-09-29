import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) throw redirect(303, '/login')
  if (locals.usuario?.role !== 'admin') throw redirect(303, '/dashboard')
  return { usuario: locals.usuario, accessToken: locals.session.access_token }
}
