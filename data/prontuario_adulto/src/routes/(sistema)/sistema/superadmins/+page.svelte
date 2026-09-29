<script lang="ts">
  import { Shield, Plus, ToggleLeft, ToggleRight } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let modalAberto = $state(false);
  let salvando = $state(false);
  let form = $state({ nome: '', email: '', senha: '' });

  async function salvar() {
    salvando = true;
    try {
      await apiFetch('/api/v1/sistema/superadmins', data.accessToken, { method: 'POST', body: JSON.stringify(form) });
      modalAberto = false; form = { nome: '', email: '', senha: '' };
      await invalidateAll();
    } catch (e: any) { alert(e.message); } finally { salvando = false; }
  }

  async function toggle(id: string) {
    await apiFetch(`/api/v1/sistema/superadmins/${id}/toggle`, data.accessToken, { method: 'PATCH' });
    await invalidateAll();
  }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div><h1 class="text-2xl font-extrabold text-gray-900">Superadmins</h1><p class="text-sm text-gray-500">Administradores do sistema.</p></div>
    <button onclick={() => modalAberto = true} class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm"><Plus class="w-4 h-4" /> Novo Superadmin</button>
  </header>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider"><th class="px-5 py-3 text-left">Nome</th><th class="px-5 py-3 text-left">Email</th><th class="px-5 py-3 text-center">Status</th><th class="px-5 py-3 text-right">Ações</th></tr></thead>
      <tbody>
        {#each data.superadmins as sa}
          <tr class="border-t border-gray-50">
            <td class="px-5 py-3 font-semibold text-gray-900">{sa.nome}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{sa.email}</td>
            <td class="px-5 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold {sa.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">{sa.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td class="px-5 py-3 text-right">
              <button onclick={() => toggle(sa.id)} class="text-gray-400 hover:text-gray-600">
                {#if sa.ativo}<ToggleRight class="w-5 h-5 text-green-500" />{:else}<ToggleLeft class="w-5 h-5" />{/if}
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
      <div class="p-5 border-b border-gray-100"><h3 class="text-lg font-bold">Novo Superadmin</h3></div>
      <div class="p-5 space-y-3">
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="sa-n">Nome</label><input id="sa-n" type="text" bind:value={form.nome} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="sa-e">Email</label><input id="sa-e" type="email" bind:value={form.email} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="sa-s">Senha</label><input id="sa-s" type="password" bind:value={form.senha} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
      </div>
      <div class="p-5 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">{salvando ? 'Criando...' : 'Criar'}</button>
      </div>
    </div>
  </div>
{/if}
