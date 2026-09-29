<script lang="ts">
  import { enhance } from '$app/forms'
  import type { ActionData } from './$types'

  import { Eye, EyeOff } from 'lucide-svelte'
  let { form }: { form: ActionData } = $props()
  let loading = $state(false)
  let showPassword = $state(false)
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900 mb-2">Entrar</h1>
    <p class="text-gray-500 text-sm mb-8">Prontuário Eletrônico</p>

    {#if form?.error}
      <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {form.error}
      </div>
    {/if}

    <form
      method="POST"
      action="?/login"
      use:enhance={() => {
        loading = true
        return async ({ update }) => {
          loading = false
          await update()
        }
      }}
      class="space-y-4"
    >
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          value={form?.email ?? ''}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <div class="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm pr-10
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            tabindex="-1"
          >
            {#if showPassword}
              <EyeOff class="h-4 w-4" />
            {:else}
              <Eye class="h-4 w-4" />
            {/if}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between text-sm">
        <label class="flex items-center gap-2 text-gray-600">
          <input type="checkbox" name="remember" class="rounded" />
          Lembrar de mim
        </label>
        <a href="/recuperar-senha" class="text-blue-600 hover:underline">
          Esqueceu a senha?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium
               hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-500">
      Sem conta?
      <a href="/registro" class="text-blue-600 hover:underline">Criar conta gratuita</a>
    </p>
  </div>
</div>
