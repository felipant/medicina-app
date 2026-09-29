<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { ptBR } from 'date-fns/locale';
  
  // Importações dinâmicas serão guardadas aqui
  let ChartClass: any = null;

  interface Props {
      serie: {
          nome_exame: string;
          unidade: string | null;
          ref_min: number | null;
          ref_max: number | null;
          pontos: any[];
      };
  }

  let { serie }: Props = $props();
  let canvas: HTMLCanvasElement;
  let chartInstance: any = null;

  async function renderChart() {
      if (!canvas || !ChartClass) return;
      if (chartInstance) chartInstance.destroy();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Prepara os dados
      const labels = serie.pontos.map(p => new Date(p.data_coleta));
      const data = serie.pontos.map(p => p.valor_numerico);
      const colors = serie.pontos.map(p => p.alterado ? '#ef4444' : '#10b981');

      chartInstance = new ChartClass(ctx, {
          type: 'line',
          data: {
              labels: labels,
              datasets: [{
                  label: serie.nome_exame,
                  data: data,
                  borderColor: '#6366f1',
                  borderWidth: 2,
                  backgroundColor: 'transparent',
                  pointBackgroundColor: colors,
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 1.5,
                  pointRadius: 5,
                  tension: 0.1
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false },
                  tooltip: {
                      callbacks: {
                          label: (ctx: any) => ` ${ctx.parsed.y} ${serie.unidade || ''}`
                      }
                  }
              },
              scales: {
                  x: {
                      type: 'time',
                      time: {
                          unit: 'month',
                          displayFormats: { month: 'MMM yy' }
                      },
                      adapters: {
                          date: { locale: ptBR }
                      },
                      grid: { display: false }
                  },
                  y: {
                      beginAtZero: false,
                      grid: { color: '#f1f5f9' }
                  }
              }
          }
      });
  }

  onMount(async () => {
      try {
         // Carrega dependências de Browser ONLY para não poluir SSR
         const ChartModule = await import('chart.js/auto');
         // @ts-ignore
         await import('chartjs-adapter-date-fns');
         ChartClass = ChartModule.default || ChartModule.Chart;
         renderChart();
      } catch (e) {
         console.error("Erro ao carregar bibliotecas gráficas no browser:", e);
      }
  });

  onDestroy(() => {
      if (chartInstance) chartInstance.destroy();
  });

  // Re-renderiza se os pontos mudarem
  $effect(() => {
      if (serie.pontos) {
          renderChart();
      }
  });
</script>

<div class="bg-white border border-slate-100 rounded-xl p-4 shadow-sm h-52 flex flex-col relative">
    <div class="flex justify-between items-center mb-2">
        <h4 class="text-xs font-bold text-slate-600 uppercase tracking-tight">{serie.nome_exame} <span class="text-slate-400 normal-case font-medium">({serie.unidade || ''})</span></h4>
        {#if serie.ref_min !== null || serie.ref_max !== null}
          <div class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
            Ref: {serie.ref_min ?? ''}–{serie.ref_max ?? ''}
          </div>
        {/if}
    </div>
    <div class="flex-1 min-h-0 relative">
        <canvas bind:this={canvas}></canvas>
    </div>
</div>
