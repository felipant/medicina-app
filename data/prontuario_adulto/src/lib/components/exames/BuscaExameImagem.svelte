<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { Search, X, Plus, Check } from 'lucide-svelte';

  interface ExameOut {
    id: string;
    nome: string;
    categoria: string;
    sigla: string | null;
  }

  interface ItemSelecionado {
    id: string | null;
    nome: string;
    categoria: string;
    sigla: string | null;
    manual: boolean;
  }

  let {
    selecionado = $bindable<ItemSelecionado | null>(null),
    accessToken,
    disabled = false,
    onchange
  }: {
    selecionado: ItemSelecionado | null;
    accessToken: string;
    disabled?: boolean;
    onchange?: (item: ItemSelecionado | null) => void;
  } = $props();

  let query = $state('');
  let catFiltro = $state('');
  let categorias = $state<string[]>([]);
  let resultados = $state<ExameOut[]>([]);
  let carregando = $state(false);
  let aberto = $state(false);
  let modoManual = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  let manualNome = $state('');

  onMount(async () => {
    try {
      categorias = await apiFetch<string[]>('/api/v1/exames-imagem/categorias', accessToken);
    } catch {
      categorias = [];
    }
  });

  async function buscar(q: string, cat: string) {
    if (q.length < 2) { resultados = []; aberto = false; return; }
    carregando = true;
    try {
      const url = `/api/v1/exames-imagem/busca?q=${encodeURIComponent(q)}${cat ? '&categoria=' + encodeURIComponent(cat) : ''}`;
      resultados = await apiFetch<ExameOut[]>(url, accessToken);
      aberto = true; 
    } catch {
      resultados = [];
      aberto = true;
    } finally {
      carregando = false;
    }
  }

  function handleInput() {
    selecionado = null;
    onchange?.(null);
    clearTimeout(timer);
    timer = setTimeout(() => buscar(query, catFiltro), 300);
  }

  function handleFiltroChange() {
    buscar(query, catFiltro);
  }

  function selecionar(item: ExameOut) {
    const res = {
      ...item,
      manual: false
    };
    selecionado = res;
    query = item.nome;
    aberto = false;
    onchange?.(res);
  }

  function setModoManual() {
    modoManual = true;
    aberto = false;
    selecionado = null;
    onchange?.(null);
    manualNome = query;
  }

  function aplicarManual() {
    if (!manualNome.trim()) {
      selecionado = null;
      onchange?.(null);
      return;
    }
    const res = {
      id: null,
      nome: manualNome.trim(),
      categoria: "Livre",
      sigla: null,
      manual: true
    };
    selecionado = res;
    onchange?.(res);
  }

  function limpar() {
    selecionado = null;
    query = '';
    resultados = [];
    aberto = false;
    modoManual = false;
    manualNome = '';
    onchange?.(null);
  }
</script>

<div class="relative w-full">
  {#if !modoManual}
    <div class="flex gap-2">
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search class="w-4 h-4" />
        </div>
        <input
          type="text"
          bind:value={query}
          oninput={handleInput}
          onfocus={() => { if (resultados.length > 0) aberto = true }}
          onblur={() => setTimeout(() => { if(!modoManual) aberto = false }, 200)}
          placeholder="Buscar exame de imagem..."
          {disabled}
          class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
        {#if query || carregando}
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
            {#if carregando}
              <div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            {:else}
              <button type="button" onclick={limpar} class="text-slate-400 hover:text-slate-600">
                <X class="w-4 h-4" />
              </button>
            {/if}
          </div>
        {/if}
      </div>
      <select
        bind:value={catFiltro}
        onchange={handleFiltroChange}
        class="border border-slate-200 rounded-xl px-3 text-sm text-slate-600 bg-slate-50 hover:bg-white"
      >
        <option value="">Todas</option>
        {#each categorias as c}
          <option value={c}>{c}</option>
        {/each}
      </select>
    </div>

    {#if aberto && query.length >= 2 && !carregando && !selecionado}
      <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
        {#if resultados.length > 0}
          <ul class="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {#each resultados as item}
              <li>
                <button
                  type="button"
                  onclick={() => selecionar(item)}
                  class="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors flex flex-col"
                >
                  <span class="text-sm font-medium text-slate-900">
                    {#if item.sigla}<span class="font-bold text-indigo-700 mr-1">[{item.sigla}]</span>{/if}
                    {item.nome}
                  </span>
                  <span class="text-xs text-slate-500 mt-0.5">{item.categoria}</span>
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <div class="p-4 text-center text-xs text-slate-400 bg-slate-50/50">
            Nenhum exame pré-cadastrado encontrado.
          </div>
        {/if}
        
        <button
          type="button"
          onclick={setModoManual}
          class="w-full p-3 text-center text-xs font-bold text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus class="w-3.5 h-3.5" /> Descrever "{query}" livremente
        </button>
      </div>
    {/if}
  {:else}
    <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-2 items-center animate-in fade-in duration-200">
      <input
        type="text"
        bind:value={manualNome}
        oninput={aplicarManual}
        placeholder="Descreva o exame livremente..."
        class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 bg-white"
      />
      <button type="button" onclick={() => { modoManual = false; limpar(); }} class="text-xs text-slate-400 px-2 hover:text-slate-600">
        Cancelar
      </button>
    </div>
  {/if}

  {#if selecionado}
    <div class="mt-2 flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100 w-fit">
      <Check class="w-3 h-3" />
      {selecionado.nome}
      {#if selecionado.manual}<span class="text-[9px] bg-slate-200 text-slate-600 px-1 rounded font-bold ml-1">Livre</span>{/if}
      <button onclick={limpar} class="ml-1 opacity-70 hover:opacity-100">✕</button>
    </div>
  {/if}
</div>
