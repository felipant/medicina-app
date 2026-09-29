<script lang="ts">
  import { enhance } from '$app/forms';
  import { fade } from 'svelte/transition';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let busca = $state('');
  let categoriaFiltro = $state('');
  let modalAberto = $state(false);
  let guidelineEditando = $state<any>(null);

  const guidelinesExibidos = $derived(
    data.guidelines.filter((g: any) => {
      const matchBusca = !busca ||
        g.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        g.organizacao.toLowerCase().includes(busca.toLowerCase());
      const matchCat = !categoriaFiltro || g.categoria === categoriaFiltro;
      return matchBusca && matchCat;
    })
  );

  function abrirModalNovo() {
    guidelineEditando = null;
    modalAberto = true;
  }

  function abrirModalEditar(g: any) {
    guidelineEditando = { ...g };
    modalAberto = true;
  }

  function fecharModal() {
    modalAberto = false;
    guidelineEditando = null;
  }

  $effect(() => {
    if (form?.criar_ok || form?.editar_ok) {
      fecharModal();
    }
  });
</script>

<div class="max-w-6xl mx-auto space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Guidelines Clínicos</h1>
      <p class="text-sm text-gray-500 mt-1">Gerencie as diretrizes médicas do sistema.</p>
    </div>
    <button
      onclick={abrirModalNovo}
      class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      + Novo guideline
    </button>
  </div>

  <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
    <div class="flex-1">
      <input
        type="text"
        bind:value={busca}
        placeholder="Buscar por título ou organização..."
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
    <div class="w-64">
      <select
        bind:value={categoriaFiltro}
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
      >
        <option value="">Todas as categorias</option>
        {#each data.categorias as cat}
          <option value={cat}>{cat}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <table class="w-full text-left text-sm whitespace-nowrap">
      <thead class="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
        <tr>
          <th class="px-4 py-3 w-16">Ord.</th>
          <th class="px-4 py-3 w-32">Organização</th>
          <th class="px-4 py-3 w-40">Categoria</th>
          <th class="px-4 py-3 max-w-xs truncate">Título</th>
          <th class="px-4 py-3 w-48">CIDs</th>
          <th class="px-4 py-3 w-24">Ano</th>
          <th class="px-4 py-3 w-24">Status</th>
          <th class="px-4 py-3 w-24">Ações</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#each guidelinesExibidos as g}
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 text-gray-500">{g.ordem}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {g.organizacao}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{g.categoria}</td>
            <td class="px-4 py-3 font-medium text-gray-900 max-w-xs truncate" title={g.titulo}>
              <a href={g.url} target="_blank" class="hover:text-blue-600 hover:underline">
                {g.titulo}
              </a>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs font-mono truncate" title={g.cids_relacionados.join(', ')}>
              {g.cids_relacionados.slice(0, 3).join(', ')}
              {#if g.cids_relacionados.length > 3}...{/if}
            </td>
            <td class="px-4 py-3 text-gray-600">{g.ano || '-'}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs {g.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                {g.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td class="px-4 py-3 flex items-center gap-2">
              <button
                onclick={() => abrirModalEditar(g)}
                class="text-blue-600 hover:text-blue-800 font-medium"
              >
                Editar
              </button>
              <form method="POST" action="?/toggle" use:enhance>
                <input type="hidden" name="id" value={g.id} />
                <button type="submit" class="text-gray-500 hover:text-gray-800">
                  {g.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </form>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="8" class="px-4 py-8 text-center text-gray-500">
              Nenhum guideline encontrado.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if modalAberto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" transition:fade>
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 class="text-lg font-bold text-gray-900">
          {guidelineEditando ? 'Editar Guideline' : 'Novo Guideline'}
        </h3>
        <button onclick={fecharModal} class="text-gray-400 hover:text-gray-600 p-2">✕</button>
      </div>

      <div class="p-6 overflow-y-auto">
        {#if form?.criar_erro || form?.editar_erro}
          <div class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {form.criar_erro || form.editar_erro}
          </div>
        {/if}

        <form
          method="POST"
          action={guidelineEditando ? '?/editar' : '?/criar'}
          use:enhance
          class="space-y-4"
        >
          {#if guidelineEditando}
            <input type="hidden" name="id" value={guidelineEditando.id} />
          {/if}

          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                name="titulo"
                required
                value={guidelineEditando?.titulo || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Organização *</label>
              <input
                type="text"
                name="organizacao"
                required
                list="org-list"
                value={guidelineEditando?.organizacao || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: SBC, ADA, GOLD"
              />
              <datalist id="org-list">
                <option value="SBC"></option>
                <option value="SBD"></option>
                <option value="CFM"></option>
                <option value="NICE"></option>
                <option value="AHA"></option>
                <option value="ESC"></option>
                <option value="ADA"></option>
                <option value="GOLD"></option>
                <option value="GINA"></option>
                <option value="KDIGO"></option>
                <option value="ACR"></option>
              </datalist>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                name="ano"
                min="1900"
                max="2100"
                value={guidelineEditando?.ano || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">URL (Link) *</label>
              <input
                type="url"
                name="url"
                required
                value={guidelineEditando?.url || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <input
                type="text"
                name="categoria"
                required
                list="cat-list"
                value={guidelineEditando?.categoria || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <datalist id="cat-list">
                {#each data.categorias as cat}
                  <option value={cat}></option>
                {/each}
              </datalist>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input
                type="number"
                name="ordem"
                value={guidelineEditando?.ordem || 0}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">CIDs Relacionados</label>
              <input
                type="text"
                name="cids"
                value={guidelineEditando?.cids_relacionados?.join(', ') || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="I10, I11, I12"
              />
              <p class="text-xs text-gray-500 mt-1">Insira os CIDs separados por vírgula que farão este guideline aparecer automaticamente.</p>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (Tags)</label>
              <input
                type="text"
                name="tags"
                value={guidelineEditando?.tags?.join(', ') || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="hipertensão, has, pressão"
              />
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                name="descricao"
                rows="3"
                value={guidelineEditando?.descricao || ''}
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              ></textarea>
            </div>
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onclick={fecharModal}
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
