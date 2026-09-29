<script lang="ts">
  import PacoteHistorico from './PacoteHistorico.svelte';
  import { AlertCircle, LineChart } from 'lucide-svelte';

  interface Props {
      historico: any[];
  }

  let { historico }: Props = $props();
  let tabAtiva = $state("");

  // Seleciona o primeiro automaticamente
  $effect(() => {
      if (!tabAtiva && historico.length > 0) {
          tabAtiva = historico[0].pacote;
      }
  });

  let dadosAtivos = $derived(historico.find(h => h.pacote === tabAtiva));

  function possuiAlterado(pacote: any) {
      return pacote.exames.some((e: any) => e.pontos.some((p: any) => p.alterado));
  }
</script>

<div class="flex flex-col h-full space-y-4">
  <header class="flex items-center justify-between">
    <div class="flex items-center gap-2 text-slate-800">
       <LineChart class="w-5 h-5 text-indigo-600" />
       <h2 class="text-lg font-bold tracking-tight">Histórico de Exames</h2>
    </div>
  </header>

  {#if historico.length === 0}
     <div class="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400 text-center">
        <LineChart class="w-10 h-10 opacity-20 mb-3" />
        <p class="font-medium text-slate-500">Nenhum registro histórico localizado</p>
        <p class="text-xs">Lance novos resultados no formulário ao lado.</p>
     </div>
  {:else}
     <div class="flex flex-col space-y-4">
        <!-- Scroller Horizontal de Abas -->
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-slate-100">
            {#each historico as h}
              <button 
                type="button"
                onclick={() => tabAtiva = h.pacote}
                class="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-xl border-b-2 transition-all flex items-center gap-2
                       {tabAtiva === h.pacote ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}"
              >
                 {h.pacote}
                 {#if possuiAlterado(h)}
                   <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                 {/if}
              </button>
            {/each}
        </div>

        <!-- Conteúdo da Aba -->
        <div class="flex-1">
           {#if dadosAtivos}
              <PacoteHistorico pacote={dadosAtivos} />
           {/if}
        </div>
     </div>
  {/if}
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
