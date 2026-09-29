<script lang="ts">
  import TabelaHistoricoPacote from './TabelaHistoricoPacote.svelte'
  import GraficoSerie from './GraficoSerie.svelte'

  let { pacote } = $props()
  let modoVisualizacao = $state<'tabela' | 'grafico'>('tabela')  // padrão: tabela
</script>

<div>
  <div class="flex justify-end mb-2 gap-2">
    <button onclick={() => modoVisualizacao = 'tabela'}
            class="text-xs px-3 py-1 rounded-lg {modoVisualizacao === 'tabela'
              ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}">
      Tabela
    </button>
    <button onclick={() => modoVisualizacao = 'grafico'}
            class="text-xs px-3 py-1 rounded-lg {modoVisualizacao === 'grafico'
              ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}">
      Gráfico
    </button>
  </div>

  {#if modoVisualizacao === 'tabela'}
    <TabelaHistoricoPacote {pacote} />
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each pacote.exames.filter((e: any) => e.tipo_resultado === 'numerico') as serie}
        <GraficoSerie {serie} />
      {/each}
    </div>
  {/if}
</div>
