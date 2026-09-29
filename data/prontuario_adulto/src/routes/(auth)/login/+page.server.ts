import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { apiFetch } from '$lib/api'
import type { Actions, PageServerLoad } from './$types'

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
})

// Redireciona se já estiver logado
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.session) {
    redirect(303, '/pacientes')
  }
  return {}
}

export const actions: Actions = {
  login: async ({ request, locals }) => {
    const formData = await request.formData()
    const raw = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    }

    // Valida os campos
    const result = loginSchema.safeParse(raw)
    if (!result.success) {
      return fail(400, {
        email: raw.email,
        error: result.error.issues[0].message
      })
    }

    // Tenta autenticar no Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password
    })

    if (error) {
      // Não expõe detalhes internos ao usuário
      console.error('Login error:', error.message)
      return fail(401, {
        email: raw.email,
        error: 'E-mail ou senha incorretos'
      })
    }

    // Verificar se é superadmin
    let isSuper = false;
    try {
      await apiFetch('/api/v1/sistema/me', data.session!.access_token)
      isSuper = true;
    } catch {
      // não é superadmin — continuar com lógica normal de role
    }

    if (isSuper) {
      redirect(303, '/sistema');
    }

    // Verifica se o usuário tem registro na tabela usuarios
    const { data: usuario, error: usuarioError } = await locals.supabase
      .from('usuarios')
      .select('id, role, clinica_id')
      .eq('id', data.user.id)
      .single()

    if (usuarioError || !usuario) {
      // Redireciona para o onboarding caso não tenha cadastro no sistema
      redirect(303, '/onboarding')
    }

    // Redireciona com base no role
    if (usuario.role === 'admin') {
      redirect(303, '/admin');
    } else {
      redirect(303, '/pacientes'); // medicos, residentes, estudantes, recepção
    }
  }
}
