<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, Search, Edit3, Power, Image, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import ModalExameImagem from '$lib/components/admin/ModalExameImagem.svelte';

  let { data } = $props();

  let modalAberto = $state(false);
  let modalSalvando = $state(false);
  let exameEdicao = $state<any>({});

  let busca = $state(data.filtros.busca);
  let categoria = $state(data.filtros.categoria);
  let ativo = $state(data.filtros.ativo);

  function aplicarFiltros() {
    const sp = new URLSearchParams(page.url.searchParams);
    if (busca) sp.set('q', busca); else sp.delete('q');
    if (categoria) sp.set('categoria', categoria); else sp.delete('categoria');
    if (ativo !== '') sp.set('ativo', ativo); else sp.delete('ativo');
    sp.set('pagina', '1');
    goto(`?${sp.toString()}`, { keepFocus: true });
  }

  function handleNovo() { exameEdicao = {}; modalAberto = true; }
  function handleEdit(i: any) { exameEdicao = { ...i }; modalAberto = true; }

  async function salvar(payload: any) {
    modalSalvando = true;
    try {
      const res = await fetch('?/salvar', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'x-sveltekit-action': 'true' }
      });
      if ((await res.json()).type === 'success') {
        modalAberto = false; await invalidateAll();
      }
    } finally { modalSalvando = false; }
  }

  const totalPaginas = Math.ceil(data.total / 20);
</script>

<div class="space-y-6">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Image class="w-6 h-6 text-indigo-600"/> Catálogo de Imagem / Funcionais
      </h1>
      <p class="text-sm text-slate-500 mt-1">Catálogo para pedidos de radiografias, tomografias, ultrassons, etc.</p>
    </div>
    <button onclick={handleNovo} class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2">
      <Plus class="w-4 h-4" /> Novo Exame
    </button>
  </div>

  <div class="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-3 items-end shadow-sm">
    <div class="flex-1 min-w-[200px] space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Buscar</label>
      <div class="relative">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input type="text" bind:value={busca} onchange={aplicarFiltros} placeholder="Ex: TC Crânio" class="w-full border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm bg-slate-50" />
      </div>
    </div>
    <div class="w-48 space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
      <select bind:value={categoria} onchange={aplicarFiltros} class="w-full border-slate-200 rounded-xl py-2 text-sm bg-slate-50">
        <option value="">Todas</option>
        {#each data.categorias as c}<option value={c}>{c}</option>{/each}
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
    <table class="w-full text-left">
      <thead>
        <tr class="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b">
          <th class="px-6 py-4">Sigla</th>
          <th class="px-6 py-4">Nome / Categoria</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 text-sm">
        {#each data.items as item}
          <tr class="{!item.ativo ? 'opacity-60' : ''} hover:bg-slate-50/50">
            <td class="px-6 py-4 font-mono font-bold text-indigo-700 text-xs">{item.sigla || '—'}</td>
            <td class="px-6 py-4">
              <p class="font-semibold text-slate-900">{item.nome}</p>
              <p class="text-xs text-slate-500">{item.categoria}</p>
            </td>
            <td class="px-6 py-4">
              <span class="px-2 py-0.5 text-xs font-bold rounded-full {item.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                {item.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
              <button onclick={() => handleEdit(item)} class="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"><Edit3 class="w-4 h-4"/></button>
              <form method="POST" action="?/toggle" use:enhance>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" class="p-1.5 {item.ativo ? 'text-red-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'} rounded hover:bg-slate-100"><Power class="w-4 h-4"/></button>
              </form>
            </td>
          </tr>
        {:else}
          <tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">Nenhum exame cadastrado.</td></tr>
        {/each}
      </tbody>
    </table>

    {#if totalPaginas > 1}
      <div class="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
        <span class="text-xs text-slate-500">{data.total} registros</span>
        <div class="flex items-center gap-1">
          <button class="p-1.5 border bg-white rounded disabled:opacity-50" disabled={data.pagina===1} onclick={()=> { const p=new URLSearchParams(page.url.searchParams); p.set('pagina',(data.pagina-1).toString()); goto(`?${p.toString()}`) }}><ChevronLeft class="w-4 h-4"/></button>
          <button class="p-1.5 border bg-white rounded disabled:opacity-50" disabled={data.pagina>=totalPaginas} onclick={()=> { const p=new URLSearchParams(page.url.searchParams); p.set('pagina',(data.pagina+1).toString()); goto(`?${p.toString()}`) }}><ChevronRight class="w-4 h-4"/></button>
        </div>
      </div>
    {/if}
  </div>
</div>

<ModalExameImagem bind:aberto={modalAberto} exame={exameEdicao} categorias={data.categorias} salvando={modalSalvando} onsave={salvar} />
