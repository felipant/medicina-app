export interface LoginForm {
  email: string
  password: string
}

export interface Usuario {
  id: string
  nome: string
  role: 'admin' | 'medico' | 'residente' | 'recepcionista' | 'estudante'
  clinica_id: string | null
  crm: string | null
}

// Estende os tipos do SvelteKit
declare global {
  namespace App {
    interface Locals {
      supabase: import('@supabase/supabase-js').SupabaseClient
      session: import('@supabase/supabase-js').Session | null
      usuario: Usuario | null
    }
  }
}
