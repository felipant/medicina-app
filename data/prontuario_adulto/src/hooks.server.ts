import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Cria cliente Supabase com cookies da requisição
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            event.cookies.set(name, value, { ...options, path: '/' })
          )
      }
    }
  )

  // 2. Valida e recupera o usuário e a sessão de forma segura
  const { data: { session } } = await event.locals.supabase.auth.getSession()
  
  if (session) {
    // Chamada segura sugerida pelo Supabase para validar token no servidor e evitar avisos
    await event.locals.supabase.auth.getUser()
  }
  
  event.locals.session = session

  // 3. Se há sessão, busca dados extras do usuário (role, clinica_id)
  if (session) {
    const { data: usuario } = await event.locals.supabase
      .from('usuarios')
      .select('id, nome, role, clinica_id, crm')
      .eq('id', session.user.id)
      .single()

    event.locals.usuario = usuario as any
  } else {
    event.locals.usuario = null
  }

  return resolve(event)
}