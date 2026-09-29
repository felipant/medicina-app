<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, Search, Edit3, Power, Pill, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import ModalMedicamento from '$lib/components/admin/ModalMedicamento.svelte';

  let { data } = $props();

  let modalAberto = $state(false);
  let modalSalvando = $state(false);
  let itemEdicao = $state<any>({});

  let q = $state(data.filtros.q);
  let forma = $state(data.filtros.forma);
  let sus = $state(data.filtros.sus);
  let ativo = $state(data.filtros.ativo);

  function aplicarFiltros() {
    const sp = new URLSearchParams(page.url.searchParams);
    if (q) sp.set('q', q); else sp.delete('q');
    if (forma) sp.set('forma', forma); else sp.delete('forma');
    if (sus) sp.set('sus', sus); else sp.delete('sus');
    if (ativo !== '') sp.set('ativo', ativo); else sp.delete('ativo');
    sp.set('pagina', '1');
    goto(`?${sp.toString()}`, { keepFocus: true });
  }

  function handleNovo() { itemEdicao = {}; modalAberto = true; }
  function handleEdit(i: any) { itemEdicao = { ...i }; modalAberto = true; }

  async function salvar(payload: any) {
    modalSalvando = true;
    try {
      const res = await fetch('?/salvar', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'x-sveltekit-action': 'true' }
      });
      const responseJson = await res.json();
      if (responseJson.type === 'success') {
        modalAberto = false; await invalidateAll();
      } else {
        alert("Erro ao salvar medicamento.");
      }
    } finally { modalSalvando = false; }
  }

  const totalPaginas = Math.ceil(data.total / 50);
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Pill class="w-6 h-6 text-indigo-600"/> Banco de Medicamentos
      </h1>
      <p class="text-sm text-slate-500 mt-1">Catálogo de princípios ativos, concentrações e fornecimento no SUS.</p>
    </div>
    <button onclick={handleNovo} class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2">
      <Plus class="w-4 h-4" /> Novo Medicamento
    </button>
  </div>

  <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
    <div class="flex-1 min-w-[200px] space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Buscar Princípio Ativo</label>
      <div class="relative">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input type="text" bind:value={q} onchange={aplicarFiltros} placeholder="Ex: Amoxicilina" class="w-full border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm bg-slate-50" />
      </div>
    </div>

    <div class="w-48 space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Forma Farmacêutica</label>
      <select bind:value={forma} onchange={aplicarFiltros} class="w-full border-slate-200 rounded-xl py-2 text-sm bg-slate-50">
        <option value="">Todas</option>
        {#each data.formas as f}
          <option value={f}>{f}</option>
        {/each}
      </select>
    </div>

    <div class="w-40 space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Fornecimento SUS</label>
      <select bind:value={sus} onchange={aplicarFiltros} class="w-full border-slate-200 rounded-xl py-2 text-sm bg-slate-50">
        <option value="">Todos</option>
        <option value="BÁSICO">BÁSICO</option>
        <option value="ESPECIALIZADO">ESPECIALIZADO</option>
        <option value="Não incluso">Não incluso</option>
      </select>
    </div>

    <div class="w-32 space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Status</label>
      <select bind:value={ativo} onchange={aplicarFiltros} class="w-full border-slate-200 rounded-xl py-2 text-sm bg-slate-50">
        <option value="">Todos</option>
        <option value="true">Ativos</option>
        <option value="false">Inativos</option>
      </select>
    </div>
  </div>

  <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="px-6 py-4">Princípio Ativo / Classe</th>
            <th class="px-6 py-4">Concentração / Forma</th>
            <th class="px-6 py-4">SUS</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each data.items as item}
            <tr class="{!item.ativo ? 'opacity-60 bg-slate-50/30' : ''} hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-900">{item.principio_ativo}</p>
                <p class="text-xs text-slate-500">{item.classe_terapeutica || '—'}</p>
              </td>
              <td class="px-6 py-4 text-slate-700">
                <p class="font-medium">{item.concentracao}</p>
                <p class="text-xs text-slate-500">{item.forma_farmaceutica}</p>
              </td>
              <td class="px-6 py-4">
                {#if item.fornecimento_sus === 'BÁSICO'}
                  <span class="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-bold rounded border border-green-100">Básico</span>
                {:else if item.fornecimento_sus === 'ESPECIALIZADO'}
                  <span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">Especializado</span>
                {:else}
                  <span class="text-slate-400 text-xs">—</span>
                {/if}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border
                  {item.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}">
                  {item.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td class="px-6 py-4 text-right flex justify-end items-center gap-2 h-full my-auto">
                <button onclick={() => handleEdit(item)} class="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Editar">
                  <Edit3 class="w-4 h-4"/>
                </button>
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" class="p-2 rounded-lg transition-colors 
                    {item.ativo ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}" 
                    title={item.ativo ? 'Desativar' : 'Ativar'}>
                    <Power class="w-4 h-4"/>
                  </button>
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-16 text-center text-slate-500">
                Nenhum medicamento encontrado.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if totalPaginas > 1}
      <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span class="text-xs text-slate-500">Exibindo página {data.pagina} de {totalPaginas} ({data.total} no total)</span>
        <div class="flex items-center gap-1">
          <button 
            class="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50" 
            disabled={data.pagina === 1}
            onclick={() => { const s = new URLSearchParams(page.url.searchParams); s.set('pagina', (data.pagina - 1).toString()); goto(`?${s.toString()}`) }}>
            <ChevronLeft class="w-4 h-4"/>
          </button>
          <button 
            class="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50" 
            disabled={data.pagina >= totalPaginas}
            onclick={() => { const s = new URLSearchParams(page.url.searchParams); s.set('pagina', (data.pagina + 1).toString()); goto(`?${s.toString()}`) }}>
            <ChevronRight class="w-4 h-4"/>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<ModalMedicamento
  bind:aberto={modalAberto}
  bind:item={itemEdicao}
  formas={data.formas}
  salvando={modalSalvando}
  onsave={salvar}
/>
