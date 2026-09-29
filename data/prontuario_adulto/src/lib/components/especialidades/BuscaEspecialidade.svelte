<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { Search, X, Loader2 } from 'lucide-svelte';
  import { slide } from 'svelte/transition';
  import { onMount } from 'svelte';

  interface Especialidade {
    id: string;
    nome: string;
    categoria: string;
  }

  let {
    selecionado = $bindable<Especialidade | null>(null),
    accessToken,
    placeholder = 'Buscar especialidade...',
    disabled = false,
    onchange
  }: {
    selecionado: Especialidade | null;
    accessToken?: string;
    placeholder?: string;
    disabled?: boolean;
    onchange?: (item: Especialidade | null) => void;
  } = $props();

  let query = $state('');
  let todasEspecialidades = $state<Especialidade[]>([]);
  let carregando = $state(false);
  let aberto = $state(false);

  let resultadosFiltrados = $derived(
    query.trim().length > 0
      ? todasEspecialidades.filter(e => 
          e.nome.toLowerCase().includes(query.toLowerCase()) ||
          e.categoria.toLowerCase().includes(query.toLowerCase())
        )
      : todasEspecialidades
  );

  onMount(async () => {
    carregando = true;
    try {
      const res = await apiFetch<Especialidade[]>('/api/v1/especialidades', accessToken || '');
      todasEspecialidades = res || [];
    } catch (err) {
      console.error("Erro ao listar especialidades:", err);
    } finally {
      carregando = false;
    }
  });

  $effect(() => {
    if (selecionado) {
      query = selecionado.nome;
    }
  });

  function onInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    query = val;
    
    if (selecionado && val !== selecionado.nome) {
      selecionado = null;
      onchange?.(null);
    }
    
    aberto = true;
  }

  function selecionar(item: Especialidade) {
    selecionado = item;
    query = item.nome;
    aberto = false;
    onchange?.(item);
  }

  function limpar() {
    selecionado = null;
    query = '';
    aberto = false;
    onchange?.(null);
  }

  function handleBlur() {
    setTimeout(() => {
      aberto = false;
    }, 200);
  }

  function handleFocus() {
    aberto = true;
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
             focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
             disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400"
    />

    <div class="absolute right-3 flex items-center gap-1.5">
      {#if carregando}
        <Loader2 class="w-4 h-4 animate-spin text-indigo-600" />
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

  {#if aberto && resultadosFiltrados.length > 0}
    <div 
      transition:slide={{ duration: 150 }}
      class="absolute z-[100] mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden"
    >
      <ul class="divide-y divide-slate-50">
        {#each resultadosFiltrados as item}
          <li>
            <button
              type="button"
              onmousedown={(e) => { 
                e.preventDefault(); 
                selecionar(item); 
              }}
              class="w-full text-left px-4 py-3 hover:bg-indigo-50/60 transition-colors group flex flex-col gap-0.5"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-800 font-semibold leading-tight group-hover:text-slate-900">
                  {item.nome}
                </span>
                <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded shrink-0">
                  {item.categoria}
                </span>
              </div>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
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

