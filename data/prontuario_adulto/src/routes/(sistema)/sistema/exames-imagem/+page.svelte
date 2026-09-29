<script lang="ts">
  import { Image, Plus, Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let busca = $state('');
  let modalAberto = $state(false);
  let editando = $state<any>(null);
  let salvando = $state(false);
  let form = $state({ nome: '', categoria: '', descricao: '' });

  let filtrados = $derived((data.exames || []).filter((e: any) => e.nome.toLowerCase().includes(busca.toLowerCase())));

  function abrirCriar() { editando = null; form = { nome: '', categoria: '', descricao: '' }; modalAberto = true; }
  function abrirEditar(e: any) { editando = e; form = { nome: e.nome, categoria: e.categoria || '', descricao: e.descricao || '' }; modalAberto = true; }

  async function salvar() {
    salvando = true;
    try {
      if (editando) await apiFetch(`/api/v1/sistema/exames-imagem/${editando.id}`, data.accessToken, { method: 'PUT', body: JSON.stringify(form) });
      else await apiFetch('/api/v1/sistema/exames-imagem', data.accessToken, { method: 'POST', body: JSON.stringify(form) });
      modalAberto = false; await invalidateAll();
    } catch (e: any) { alert(e.message); } finally { salvando = false; }
  }
  async function toggle(id: string) { await apiFetch(`/api/v1/sistema/exames-imagem/${id}/toggle`, data.accessToken, { method: 'PATCH' }); await invalidateAll(); }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div><h1 class="text-2xl font-extrabold text-gray-900">Exames de Imagem</h1><p class="text-sm text-gray-500">Catálogo global de exames de imagem e funcionais.</p></div>
    <button onclick={abrirCriar} class="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-sm"><Plus class="w-4 h-4" /> Novo Exame</button>
  </header>

  <div class="relative max-w-sm"><Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" bind:value={busca} placeholder="Buscar exame..." class="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider"><th class="px-5 py-3 text-left">Nome</th><th class="px-5 py-3 text-left">Categoria</th><th class="px-5 py-3 text-left">Descrição</th><th class="px-5 py-3 text-center">Status</th><th class="px-5 py-3 text-right">Ações</th></tr></thead>
      <tbody>
        {#each filtrados as e}
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="px-5 py-3 font-semibold text-gray-900">{e.nome}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{e.categoria || '—'}</td>
            <td class="px-5 py-3 text-gray-600 text-xs truncate max-w-[200px]">{e.descricao || '—'}</td>
            <td class="px-5 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold {e.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">{e.ativo ? 'Ativo' : 'Inativo'}</span></td>
            <td class="px-5 py-3 text-right flex items-center justify-end gap-2">
              <button onclick={() => abrirEditar(e)} class="text-indigo-500"><Pencil class="w-4 h-4" /></button>
              <button onclick={() => toggle(e.id)}>{#if e.ativo}<ToggleRight class="w-5 h-5 text-green-500" />{:else}<ToggleLeft class="w-5 h-5 text-gray-400" />{/if}</button>
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
      <div class="p-5 border-b border-gray-100"><h3 class="text-lg font-bold">{editando ? 'Editar' : 'Novo'} Exame de Imagem</h3></div>
      <div class="p-5 space-y-3">
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="ei-n">Nome</label><input id="ei-n" type="text" bind:value={form.nome} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="ei-c">Categoria</label><input id="ei-c" type="text" bind:value={form.categoria} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="ei-d">Descrição</label><textarea id="ei-d" bind:value={form.descricao} rows="3" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm resize-none"></textarea></div>
      </div>
      <div class="p-5 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-5 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </div>
  </div>
{/if}
