<script lang="ts">
  import { GraduationCap, Plus, ToggleLeft, ToggleRight } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let modalAberto = $state(false);
  let salvando = $state(false);
  let form = $state({ nome: '', email: '', senha: '', plano_estudante: 'gratuito' });

  async function salvar() {
    salvando = true;
    try {
      await apiFetch('/api/v1/sistema/estudantes', data.accessToken, {
        method: 'POST', body: JSON.stringify(form)
      });
      modalAberto = false;
      form = { nome: '', email: '', senha: '', plano_estudante: 'gratuito' };
      await invalidateAll();
    } catch (e: any) { alert(e.message); }
    finally { salvando = false; }
  }

  async function toggleEstudante(id: string) {
    await apiFetch(`/api/v1/sistema/estudantes/${id}/toggle`, data.accessToken, { method: 'PATCH' });
    await invalidateAll();
  }

  async function alterarPlano(id: string, plano: string) {
    await apiFetch(`/api/v1/sistema/estudantes/${id}/plano`, data.accessToken, {
      method: 'PATCH', body: JSON.stringify({ plano })
    });
    await invalidateAll();
  }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-extrabold text-gray-900">Estudantes</h1>
      <p class="text-sm text-gray-500">Gerenciamento de contas de estudantes na clínica virtual.</p>
    </div>
    <button onclick={() => modalAberto = true} class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-sm">
      <Plus class="w-4 h-4" /> Novo Estudante
    </button>
  </header>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <th class="px-5 py-3 text-left">Nome</th>
          <th class="px-5 py-3 text-left">Email</th>
          <th class="px-5 py-3 text-center">Plano</th>
          <th class="px-5 py-3 text-center">Pacientes</th>
          <th class="px-5 py-3 text-center">Status</th>
          <th class="px-5 py-3 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each data.estudantes as e}
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="px-5 py-3 font-semibold text-gray-900">{e.nome}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{e.email || '—'}</td>
            <td class="px-5 py-3 text-center">
              <select
                value={e.plano_estudante || 'gratuito'}
                onchange={(ev) => alterarPlano(e.id, ev.currentTarget.value)}
                class="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                <option value="gratuito">Gratuito</option>
                <option value="pago">Pago</option>
              </select>
            </td>
            <td class="px-5 py-3 text-center font-bold text-gray-700">{e.total_pacientes}</td>
            <td class="px-5 py-3 text-center">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {e.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                {e.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td class="px-5 py-3 text-right">
              <button onclick={() => toggleEstudante(e.id)} class="text-gray-400 hover:text-gray-600" title="Ativar/Desativar">
                {#if e.ativo}
                  <ToggleRight class="w-5 h-5 text-green-500" />
                {:else}
                  <ToggleLeft class="w-5 h-5 text-gray-400" />
                {/if}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if modalAberto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900">Novo Estudante</h3>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="est-nome">Nome</label>
          <input id="est-nome" type="text" bind:value={form.nome} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="est-email">Email</label>
          <input id="est-email" type="email" bind:value={form.email} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="est-senha">Senha</label>
          <input id="est-senha" type="password" bind:value={form.senha} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="est-plano">Plano</label>
          <select id="est-plano" bind:value={form.plano_estudante} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm">
            <option value="gratuito">Gratuito</option>
            <option value="pago">Pago</option>
          </select>
        </div>
      </div>
      <div class="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-5 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">
          {salvando ? 'Criando...' : 'Criar Estudante'}
        </button>
      </div>
    </div>
  </div>
{/if}
