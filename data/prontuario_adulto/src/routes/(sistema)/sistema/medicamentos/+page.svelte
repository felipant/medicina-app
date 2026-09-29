<script lang="ts">
  import { Pill, Plus, Pencil, ToggleLeft, ToggleRight, Search, Loader2 } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let busca = $state('');
  let modalAberto = $state(false);
  let editando = $state<any>(null);
  let salvando = $state(false);
  let carregando = $state(false);
  let form = $state({ principio_ativo: '', classe: '', forma_farmaceutica: '', concentracao: '' });

  let medicamentos = $state<any[]>([]);

  // Synchronize data.medicamentos initially or after invalidateAll
  $effect(() => {
    if (!busca.trim()) {
      medicamentos = data.medicamentos || [];
    }
  });

  // Server side search effect
  $effect(() => {
    const termo = busca.trim();
    if (!termo) {
      medicamentos = data.medicamentos || [];
      return;
    }

    const controller = new AbortController();
    carregando = true;

    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<any[]>(
          `/api/v1/sistema/medicamentos?busca=${encodeURIComponent(termo)}`,
          data.accessToken,
          { signal: controller.signal }
        );
        medicamentos = res || [];
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error(e);
        }
      } finally {
        carregando = false;
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  });

  function abrirCriar() { editando = null; form = { principio_ativo: '', classe: '', forma_farmaceutica: '', concentracao: '' }; modalAberto = true; }
  function abrirEditar(m: any) { editando = m; form = { principio_ativo: m.principio_ativo, classe: m.classe || '', forma_farmaceutica: m.forma_farmaceutica || '', concentracao: m.concentracao || '' }; modalAberto = true; }

  async function carregarAtual() {
    const termo = busca.trim();
    const url = termo 
      ? `/api/v1/sistema/medicamentos?busca=${encodeURIComponent(termo)}`
      : '/api/v1/sistema/medicamentos';
    const res = await apiFetch<any[]>(url, data.accessToken);
    medicamentos = res || [];
  }

  async function salvar() {
    salvando = true;
    try {
      if (editando) { 
        await apiFetch(`/api/v1/sistema/medicamentos/${editando.id}`, data.accessToken, { method: 'PUT', body: JSON.stringify(form) }); 
      } else { 
        await apiFetch('/api/v1/sistema/medicamentos', data.accessToken, { method: 'POST', body: JSON.stringify(form) }); 
      }
      modalAberto = false;
      await invalidateAll(); // updates server data
      await carregarAtual();  // updates client state immediately
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      salvando = false; 
    }
  }

  async function toggle(id: string) {
    try {
      await apiFetch(`/api/v1/sistema/medicamentos/${id}/toggle`, data.accessToken, { method: 'PATCH' });
      await invalidateAll();
      await carregarAtual();
    } catch (e: any) {
      alert(e.message);
    }
  }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-extrabold text-gray-900">Medicamentos</h1>
      <p class="text-sm text-gray-500">Catálogo global de medicamentos.</p>
    </div>
    <button onclick={abrirCriar} class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 shadow-sm">
      <Plus class="w-4 h-4" /> Novo Medicamento
    </button>
  </header>

  <div class="relative max-w-sm flex items-center">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input type="text" bind:value={busca} placeholder="Buscar por princípio ativo..." class="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none" />
    {#if carregando}
      <Loader2 class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 animate-spin" />
    {/if}
  </div>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
    {#if carregando && medicamentos.length === 0}
      <div class="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-10 py-12">
         <Loader2 class="w-8 h-8 animate-spin text-amber-600" />
      </div>
    {/if}

    <table class="w-full text-sm {carregando ? 'opacity-60' : ''} transition-opacity">
      <thead>
        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <th class="px-5 py-3 text-left">Princípio Ativo</th>
          <th class="px-5 py-3 text-left">Classe</th>
          <th class="px-5 py-3 text-left">Forma</th>
          <th class="px-5 py-3 text-left">Concentração</th>
          <th class="px-5 py-3 text-center">Status</th>
          <th class="px-5 py-3 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each medicamentos as m}
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="px-5 py-3 font-semibold text-gray-900">{m.principio_ativo}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{m.classe || '—'}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{m.forma_farmaceutica || '—'}</td>
            <td class="px-5 py-3 text-gray-600 text-xs">{m.concentracao || '—'}</td>
            <td class="px-5 py-3 text-center">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {m.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                {m.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td class="px-5 py-3 text-right flex items-center justify-end gap-2">
              <button onclick={() => abrirEditar(m)} class="text-indigo-500 hover:text-indigo-700"><Pencil class="w-4 h-4" /></button>
              <button onclick={() => toggle(m.id)} class="text-gray-400 hover:text-gray-600">
                {#if m.ativo}<ToggleRight class="w-5 h-5 text-green-500" />{:else}<ToggleLeft class="w-5 h-5" />{/if}
              </button>
            </td>
          </tr>
        {:else}
          <tr>
             <td colspan="6" class="px-5 py-12 text-center text-gray-400 text-sm font-medium">
                {#if !carregando}Nenhum medicamento encontrado com este critério.{:else}Buscando...{/if}
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
      <div class="p-5 border-b border-gray-100"><h3 class="text-lg font-bold text-gray-900">{editando ? 'Editar' : 'Novo'} Medicamento</h3></div>
      <div class="p-5 space-y-4">
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="m-pa">Princípio Ativo</label><input id="m-pa" type="text" bind:value={form.principio_ativo} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div><label class="text-xs font-bold text-gray-600 uppercase" for="m-cl">Classe</label><input id="m-cl" type="text" bind:value={form.classe} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold text-gray-600 uppercase" for="m-ff">Forma</label><input id="m-ff" type="text" bind:value={form.forma_farmaceutica} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
          <div><label class="text-xs font-bold text-gray-600 uppercase" for="m-co">Concentração</label><input id="m-co" type="text" bind:value={form.concentracao} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" /></div>
        </div>
      </div>
      <div class="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-5 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </div>
  </div>
{/if}
