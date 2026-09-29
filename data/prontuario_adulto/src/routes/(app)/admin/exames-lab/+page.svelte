<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { Plus, Search, Edit3, Power, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import ModalExameLab from '$lib/components/admin/ModalExameLab.svelte';
  import { enhance } from '$app/forms';

  let { data } = $props();

  let modalAberto = $state(false);
  let exameEdicao = $state<any>({});

  // Filtros Reativos via URL
  let busca = $state(data.filtros.busca);
  let material = $state(data.filtros.material);
  let ativo = $state(data.filtros.ativo);
  let pacote = $state(data.filtros.pacote);

  function aplicarFiltros() {
    const sp = new URLSearchParams(page.url.searchParams);
    if (busca) sp.set('busca', busca); else sp.delete('busca');
    if (material) sp.set('material', material); else sp.delete('material');
    if (ativo !== '') sp.set('ativo', ativo); else sp.delete('ativo');
    if (pacote) sp.set('pacote', pacote); else sp.delete('pacote');
    sp.set('pagina', '1');
    goto(`?${sp.toString()}`, { keepFocus: true, noScroll: true });
  }

  function mudarPagina(nova: number) {
    const sp = new URLSearchParams(page.url.searchParams);
    sp.set('pagina', nova.toString());
    goto(`?${sp.toString()}`);
  }

  function handleNovo() {
    exameEdicao = {};
    modalAberto = true;
  }

  function handleEdit(item: any) {
    exameEdicao = { ...item };
    modalAberto = true;
  }


  function formatRef(it: any) {
    if (it.tipo_resultado === 'qualitativo') return it.ref_texto || '—';
    if (it.ref_min_m || it.ref_max_m || it.ref_min_f || it.ref_max_f) {
      return `♂ ${it.ref_min_m || '?'}-${it.ref_max_m || '?'} / ♀ ${it.ref_min_f || '?'}-${it.ref_max_f || '?'}`;
    }
    return `${it.ref_min ?? '?'} – ${it.ref_max ?? '?'}`;
  }

  const totalPaginas = Math.ceil(data.total / 20);
</script>

<div class="space-y-6">
  <!-- Top Bar -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <FlaskConical class="w-6 h-6 text-indigo-600"/> Catálogo de Exames Laboratoriais
      </h1>
      <p class="text-sm text-slate-500 mt-1">Gerencie a lista de exames disponíveis para lançamentos e históricos.</p>
    </div>
    <button onclick={handleNovo} class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
      <Plus class="w-4 h-4" /> Novo Exame
    </button>
  </div>

  <!-- Filtros -->
  <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-end">
    <div class="flex-1 min-w-[200px] space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Buscar Nome</label>
      <div class="relative">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input type="text" bind:value={busca} onchange={aplicarFiltros} placeholder="Ex: Hemoglobina" class="w-full border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm bg-slate-50 focus:bg-white" />
      </div>
    </div>

    <div class="w-40 space-y-1">
      <label class="text-[10px] font-bold text-slate-500 uppercase">Pacote</label>
      <select bind:value={pacote} onchange={aplicarFiltros} class="w-full border-slate-200 rounded-xl py-2 text-sm bg-slate-50">
        <option value="">Todos</option>
        {#each data.pacotes as p}
          <option value={p}>{p}</option>
        {/each}
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

  <!-- Tabela -->
  <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <th class="px-6 py-4">Nome / Material</th>
            <th class="px-6 py-4">Pacote</th>
            <th class="px-6 py-4">Unidade</th>
            <th class="px-6 py-4">Referência</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          {#each data.items as item}
            <tr class="hover:bg-slate-50/50 transition-colors {!item.ativo ? 'bg-slate-50/50 opacity-70' : ''}">
              <td class="px-6 py-4">
                <p class="font-semibold text-slate-900">{item.nome}</p>
                <p class="text-xs text-slate-500 mt-0.5">{item.material}</p>
              </td>
              <td class="px-6 py-4 text-slate-600">
                <span class="inline-block px-2 py-1 bg-slate-100 rounded-md text-xs font-medium">{item.pacote}</span>
              </td>
              <td class="px-6 py-4 text-slate-600 font-mono">{item.unidade || '—'}</td>
              <td class="px-6 py-4 text-xs text-slate-700 font-medium max-w-xs break-words">
                {formatRef(item)}
              </td>
              <td class="px-6 py-4">
                {#if item.ativo}
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">Ativo</span>
                {:else}
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">Inativo</span>
                {/if}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end items-center gap-2">
                  <button onclick={() => handleEdit(item)} class="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Editar">
                    <Edit3 class="w-4 h-4" />
                  </button>
                  
                  <form method="POST" action="?/toggle" use:enhance>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" class="p-2 {item.ativo ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'} rounded-lg transition-colors" title={item.ativo ? 'Desativar' : 'Ativar'}>
                      <Power class="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                Nenhum exame localizado com os filtros selecionados.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    {#if totalPaginas > 1}
      <div class="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span class="text-xs text-slate-500">Exibindo página {data.pagina} de {totalPaginas} ({data.total} no total)</span>
        <div class="flex items-center gap-1">
          <button 
            class="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50" 
            disabled={data.pagina === 1}
            onclick={() => mudarPagina(data.pagina - 1)}
          >
            <ChevronLeft class="w-4 h-4"/>
          </button>
          <button 
            class="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50" 
            disabled={data.pagina >= totalPaginas}
            onclick={() => mudarPagina(data.pagina + 1)}
          >
            <ChevronRight class="w-4 h-4"/>
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<ModalExameLab
  bind:aberto={modalAberto}
  bind:exame={exameEdicao}
  pacotes={data.pacotes}
  onSalvo={async () => await invalidateAll()}
/>
