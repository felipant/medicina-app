import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    // Preserva a URL de destino para redirecionar após login
    redirect(303, `/login?redirect=${url.pathname}`)
  }

  return {
    session: locals.session,
    usuario: locals.usuario
  }
}
