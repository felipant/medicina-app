<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { Search, X, Plus, CornerDownRight, Check } from 'lucide-svelte';

  interface MedicamentoOut {
    id: string;
    principio_ativo: string;
    concentracao: string | null;
    forma_farmaceutica: string;
    fornecimento_sus: string | null;
  }

  interface MedicamentoSelecionado {
    id: string | null;
    principio_ativo: string;
    concentracao: string;
    forma_farmaceutica: string;
    manual: boolean;
  }

  let {
    selecionado = $bindable<MedicamentoSelecionado | null>(null),
    accessToken,
    disabled = false,
  }: {
    selecionado: MedicamentoSelecionado | null;
    accessToken: string;
    disabled?: boolean;
  } = $props();

  let query = $state('');
  let formaFiltro = $state('');
  let formas = $state<string[]>([]);
  let resultados = $state<MedicamentoOut[]>([]);
  let carregando = $state(false);
  let aberto = $state(false);
  let modoManual = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  // Campos manuais
  let manualPa = $state('');
  let manualConc = $state('');
  let manualForma = $state('');

  onMount(async () => {
    try {
      formas = await apiFetch<string[]>('/api/v1/medicamentos/formas', accessToken);
    } catch {
      formas = [];
    }
  });

  async function buscar(q: string, f: string) {
    if (q.length < 2) { resultados = []; aberto = false; return; }
    carregando = true;
    try {
      const url = `/api/v1/medicamentos/busca?q=${encodeURIComponent(q)}${f ? '&forma=' + encodeURIComponent(f) : ''}`;
      resultados = await apiFetch<MedicamentoOut[]>(url, accessToken);
      aberto = resultados.length > 0;
    } catch {
      resultados = [];
    } finally {
      carregando = false;
    }
  }

  function handleInput() {
    selecionado = null;
    clearTimeout(timer);
    timer = setTimeout(() => buscar(query, formaFiltro), 300);
  }

  function handleFiltroChange() {
    buscar(query, formaFiltro);
  }

  function selecionar(med: MedicamentoOut) {
    selecionado = {
      id: med.id,
      principio_ativo: med.principio_ativo,
      concentracao: med.concentracao || '',
      forma_farmaceutica: med.forma_farmaceutica,
      manual: false
    };
    query = med.principio_ativo;
    aberto = false;
  }

  function aplicarManual() {
    if (!manualPa.trim()) return;
    selecionado = {
      id: null,
      principio_ativo: manualPa.trim(),
      concentracao: manualConc.trim(),
      forma_farmaceutica: manualForma.trim(),
      manual: true
    };
  }

  function limpar() {
    selecionado = null;
    query = '';
    resultados = [];
    aberto = false;
    modoManual = false;
    manualPa = '';
    manualConc = '';
    manualForma = '';
  }

  function setModoManual() {
    modoManual = true;
    aberto = false;
    selecionado = null;
    manualPa = query;
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
          placeholder="Buscar princípio ativo..."
          {disabled}
          class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
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
        bind:value={formaFiltro}
        onchange={handleFiltroChange}
        {disabled}
        class="border border-slate-200 rounded-xl px-3 text-sm text-slate-600 bg-slate-50 hover:bg-white transition-colors min-w-[140px]"
      >
        <option value="">Todas as formas</option>
        {#each formas as f}
          <option value={f}>{f}</option>
        {/each}
      </select>
    </div>

    {#if aberto && resultados.length > 0}
      <div class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <ul class="max-h-60 overflow-y-auto divide-y divide-slate-50">
          {#each resultados as med}
            <li>
              <button
                type="button"
                onclick={() => selecionar(med)}
                class="w-full text-left px-4 py-3 hover:bg-indigo-50/50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p class="text-sm text-slate-900 font-medium group-hover:text-indigo-700">
                    {med.principio_ativo} <span class="text-slate-500 font-normal">{med.concentracao || ''}</span>
                  </p>
                  <p class="text-xs text-slate-500 mt-0.5">{med.forma_farmaceutica}</p>
                </div>
                {#if med.fornecimento_sus}
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase border border-emerald-100">
                    {med.fornecimento_sus}
                  </span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
        <button
          type="button"
          onclick={setModoManual}
          class="w-full p-3 text-center text-xs font-semibold text-indigo-600 bg-slate-50 hover:bg-indigo-50 border-t border-slate-100 flex items-center justify-center gap-1 transition-colors"
        >
          <Plus class="w-3 h-3" /> Não encontrou? Inserir manualmente
        </button>
      </div>
    {/if}
  {:else}
    <!-- Modo Manual -->
    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Plus class="w-3 h-3"/> Inserção Manual
        </span>
        <button type="button" onclick={() => { modoManual = false; limpar(); }} class="text-xs text-slate-400 hover:text-indigo-600">
          Voltar ao catálogo
        </button>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          bind:value={manualPa}
          placeholder="Princípio Ativo"
          oninput={aplicarManual}
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
        <input
          type="text"
          bind:value={manualConc}
          placeholder="Concentração (ex: 50mg)"
          oninput={aplicarManual}
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
        <input
          type="text"
          bind:value={manualForma}
          placeholder="Forma Farmacêutica"
          oninput={aplicarManual}
          class="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        />
      </div>
    </div>
  {/if}

  {#if selecionado}
    <div class="mt-2 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm animate-in zoom-in-95 duration-150">
      <Check class="w-3 h-3" />
      {selecionado.principio_ativo} {selecionado.concentracao} ({selecionado.forma_farmaceutica})
      {#if selecionado.manual}
        <span class="ml-1 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] uppercase font-bold">Manual</span>
      {/if}
      <button type="button" onclick={limpar} class="ml-1 hover:text-indigo-900">✕</button>
    </div>
  {/if}
</div>
