<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { Search, X, Loader2 } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

  interface Cid10Item {
    subcat: string;
    subcat_desc: string;
    cat: string;
    cat_desc: string;
    cap_desc: string;
    grupo: string;
  }

  let {
    selecionado = $bindable<Cid10Item | null>(null),
    accessToken,
    placeholder = 'Buscar CID-10...',
    disabled = false,
  }: {
    selecionado: Cid10Item | null;
    accessToken: string;
    placeholder?: string;
    disabled?: boolean;
  } = $props();

  let query = $state('');
  let resultados = $state<Cid10Item[]>([]);
  let carregando = $state(false);
  let aberto = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  // Exibe o item selecionado no input
  $effect(() => {
    if (selecionado) {
      query = `${selecionado.subcat} — ${selecionado.subcat_desc}`;
    }
  });

  async function buscar(q: string) {
    if (q.length < 2) { 
      resultados = []; 
      aberto = false; 
      return; 
    }
    carregando = true;
    try {
      const res = await apiFetch<Cid10Item[]>(
        `/api/v1/cid10/busca?q=${encodeURIComponent(q)}&limit=15`,
        accessToken
      );
      resultados = res || [];
      aberto = resultados.length > 0;
    } catch (err) {
      resultados = [];
      aberto = false;
    } finally {
      carregando = false;
    }
  }

  function onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    query = val;
    
    // Se alterou o texto e havia algo selecionado, desvincula
    if (selecionado) {
      selecionado = null;
    }

    clearTimeout(timer);
    timer = setTimeout(() => buscar(val), 350);
  }

  function selecionar(item: Cid10Item) {
    selecionado = item;
    aberto = false;
    resultados = [];
  }

  function limpar() {
    selecionado = null;
    query = '';
    resultados = [];
    aberto = false;
  }

  function handleBlur() {
    // Pequeno atraso para permitir que onmousedown execute antes de fechar,
    // embora onmousedown com preventDefault mantenha o dropdown funcional.
    setTimeout(() => {
      aberto = false;
    }, 200);
  }

  function handleFocus() {
    if (resultados.length > 0 && !selecionado) {
      aberto = true;
    }
  }
</script>

<div class="relative w-full">
  <div class="relative flex items-center">
    <div class="absolute left-3 text-slate-400 pointer-events-none">
      <Search class="w-4 h-4" />
    </div>
    
    <input
      type="text"
      value={query}
      oninput={onInput}
      onfocus={handleFocus}
      onblur={handleBlur}
      {placeholder}
      {disabled}
      class="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-sm outline-none shadow-sm transition-all 
             focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
             disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
    />

    <div class="absolute right-3 flex items-center gap-1.5">
      {#if carregando}
        <Loader2 class="w-4 h-4 animate-spin text-amber-600" />
      {:else if query || selecionado}
        <button 
          type="button"
          onclick={limpar}
          disabled={disabled}
          class="p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          title="Limpar busca"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      {/if}
    </div>
  </div>

  {#if aberto && resultados.length > 0}
    <div 
      transition:slide={{ duration: 150 }}
      class="absolute z-[100] mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden"
    >
      <ul class="divide-y divide-slate-50">
        {#each resultados as item}
          <li>
            <!-- Usamos onmousedown para capturar a ação ANTES do blur do input e e.preventDefault() para não roubar foco -->
            <button
              type="button"
              onmousedown={(e) => { 
                e.preventDefault(); 
                selecionar(item); 
              }}
              class="w-full text-left px-4 py-3 hover:bg-amber-50/60 transition-colors group flex flex-col gap-0.5"
            >
              <div class="flex items-baseline gap-2">
                <span class="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                  {item.subcat}
                </span>
                <span class="text-sm text-slate-800 font-medium leading-tight group-hover:text-slate-900">
                  {item.subcat_desc}
                </span>
              </div>
              <div class="text-[10px] text-slate-400 font-medium truncate pl-1 capitalize">
                {item.cap_desc.toLowerCase()} › {item.grupo.toLowerCase()}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  /* Oculta scrollbars nativas da lista mantendo rolagem elegente */
  div::-webkit-scrollbar {
    width: 6px;
  }
  div::-webkit-scrollbar-track {
    background: transparent;
  }
  div::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
  div::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }
</style>
