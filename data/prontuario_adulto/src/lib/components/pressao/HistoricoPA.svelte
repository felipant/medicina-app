<script lang="ts">
  import { Loader2, Activity } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';

  interface Props {
    pacienteId: string;
    accessToken: string;
    refreshKey?: number;
  }

  let { pacienteId, accessToken, refreshKey = 0 }: Props = $props();

  $effect(() => {
    if (refreshKey > 0) {
      carregar();
    }
  });

  let historico = $state<any>(null);
  let carregando = $state(true);
  let filtroInicio = $state('');
  let filtroFim = $state('');
  let aba = $state<'tabela' | 'grafico'>('tabela');

  async function carregar() {
    carregando = true;
    try {
      let params = '';
      if (filtroInicio) params += `?data_inicio=${filtroInicio}`;
      if (filtroFim) params += `${params ? '&' : '?'}data_fim=${filtroFim}`;
      historico = await apiFetch(`/api/v1/pressao/paciente/${pacienteId}${params}`, accessToken);
    } catch {
      historico = null;
    } finally {
      carregando = false;
    }
  }

  onMount(carregar);

  function classificarPA(ps: number, pd: number): { label: string; cor: string } {
    if (ps >= 180 || pd >= 110) return { label: 'HTN Estágio 3', cor: 'text-red-700 bg-red-50' };
    if (ps >= 160 || pd >= 100) return { label: 'HTN Estágio 2', cor: 'text-orange-700 bg-orange-50' };
    if (ps >= 140 || pd >= 90)  return { label: 'HTN Estágio 1', cor: 'text-amber-700 bg-amber-50' };
    if (ps >= 130 || pd >= 80)  return { label: 'Pré-HTN', cor: 'text-yellow-700 bg-yellow-50' };
    if (ps >= 120)              return { label: 'Normal', cor: 'text-green-700 bg-green-50' };
    return { label: 'Ótima', cor: 'text-emerald-700 bg-emerald-50' };
  }

  const horarioLabel: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', unica: 'Medida única' };

  function formatarData(d: string) {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  }
</script>

<div class="space-y-5">
  <!-- Filtros e resumo -->
  <div class="flex flex-wrap items-center gap-3">
    <input type="date" bind:value={filtroInicio} onchange={carregar} class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />
    <span class="text-gray-400 text-xs">até</span>
    <input type="date" bind:value={filtroFim} onchange={carregar} class="border border-gray-200 rounded-lg px-3 py-1.5 text-xs" />

    <div class="flex gap-1 ml-4">
      <button onclick={() => aba = 'tabela'} class="px-3 py-1 rounded-lg text-xs font-medium {aba === 'tabela' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}">Tabela</button>
      <button onclick={() => aba = 'grafico'} class="px-3 py-1 rounded-lg text-xs font-medium {aba === 'grafico' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}">Gráfico</button>
    </div>

    {#if historico}
      <div class="ml-auto flex gap-5 text-xs">
        <span class="text-gray-600">Média PS: <strong class="text-blue-700">{historico.media_ps_periodo ?? '—'} mmHg</strong></span>
        <span class="text-gray-600">Média PD: <strong class="text-purple-700">{historico.media_pd_periodo ?? '—'} mmHg</strong></span>
        <span class="text-gray-400">{historico.total_medicoes} medições</span>
      </div>
    {/if}
  </div>

  {#if carregando}
    <div class="flex items-center justify-center py-12 text-gray-400 gap-2">
      <Loader2 class="w-5 h-5 animate-spin" />
      <span class="text-sm">Carregando histórico...</span>
    </div>
  {:else if !historico || historico.total_medicoes === 0}
    <div class="text-center py-12 text-gray-400">
      <Activity class="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p class="text-sm">Nenhuma medição de PA registrada.</p>
    </div>
  {:else if aba === 'tabela'}
    <div class="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <th class="px-4 py-2.5 text-left">Data</th>
            <th class="px-4 py-2.5 text-left">Horário</th>
            <th class="px-4 py-2.5 text-center">PS</th>
            <th class="px-4 py-2.5 text-center">PD</th>
            <th class="px-4 py-2.5 text-left">Classificação</th>
          </tr>
        </thead>
        <tbody>
          {#each historico.medicoes as m}
            {@const cls = classificarPA(m.ps, m.pd)}
            <tr class="border-t border-gray-50 hover:bg-gray-50/50">
              <td class="px-4 py-2 text-gray-700 text-xs font-medium">{formatarData(m.data_medicao)}</td>
              <td class="px-4 py-2 text-gray-500 text-xs">{horarioLabel[m.horario] || m.horario}</td>
              <td class="px-4 py-2 text-center font-bold text-gray-800">{m.ps}</td>
              <td class="px-4 py-2 text-center font-bold text-gray-800">{m.pd}</td>
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {cls.cor}">{cls.label}</span>
              </td>
            </tr>
          {/each}
          <!-- Médias diárias separadas -->
          {#each historico.medias_diarias as md}
            {#if md.n_medicoes > 1}
              <tr class="bg-blue-50/30 border-t border-blue-100">
                <td class="px-4 py-1.5 text-blue-700 text-xs font-bold">{formatarData(md.data_medicao)} média</td>
                <td class="px-4 py-1.5 text-blue-500 text-[10px]">{md.n_medicoes} medições</td>
                <td class="px-4 py-1.5 text-center font-bold text-blue-700">{md.media_ps}</td>
                <td class="px-4 py-1.5 text-center font-bold text-blue-700">{md.media_pd}</td>
                <td class="px-4 py-1.5">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold {classificarPA(md.media_ps, md.media_pd).cor}">{classificarPA(md.media_ps, md.media_pd).label}</span>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <!-- Gráfico simples com SVG -->
    <div class="bg-white rounded-xl border border-gray-100 p-5">
      <p class="text-xs text-gray-500 mb-4">Médias diárias de PA ao longo do tempo</p>
      {#if historico.medias_diarias.length > 1}
        {@const dados = historico.medias_diarias}
        {@const maxY = Math.max(...dados.map((d: any) => d.media_ps), 180)}
        {@const minY = Math.min(...dados.map((d: any) => d.media_pd), 50)}
        {@const width = 600}
        {@const height = 250}
        {@const padX = 40}
        {@const padY = 20}
        {@const chartW = width - padX * 2}
        {@const chartH = height - padY * 2}
        <svg viewBox="0 0 {width} {height}" class="w-full h-auto">
          <!-- Grid lines -->
          {#each [80, 90, 120, 140, 180] as ref}
            {@const y = padY + chartH - ((ref - minY) / (maxY - minY)) * chartH}
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke={ref >= 140 ? '#fbbf24' : '#d1fae5'} stroke-width="1" stroke-dasharray="4 2" />
            <text x={padX - 5} y={y + 3} text-anchor="end" class="text-[10px] fill-gray-400">{ref}</text>
          {/each}

          <!-- PS line -->
          <polyline
            fill="none" stroke="#3b82f6" stroke-width="2"
            points={dados.map((d: any, i: number) => {
              const x = padX + (i / (dados.length - 1)) * chartW;
              const y = padY + chartH - ((d.media_ps - minY) / (maxY - minY)) * chartH;
              return `${x},${y}`;
            }).join(' ')}
          />
          <!-- PD line -->
          <polyline
            fill="none" stroke="#8b5cf6" stroke-width="2"
            points={dados.map((d: any, i: number) => {
              const x = padX + (i / (dados.length - 1)) * chartW;
              const y = padY + chartH - ((d.media_pd - minY) / (maxY - minY)) * chartH;
              return `${x},${y}`;
            }).join(' ')}
          />

          <!-- Dots -->
          {#each dados as d, i}
            {@const x = padX + (i / (dados.length - 1)) * chartW}
            {@const yPS = padY + chartH - ((d.media_ps - minY) / (maxY - minY)) * chartH}
            {@const yPD = padY + chartH - ((d.media_pd - minY) / (maxY - minY)) * chartH}
            <circle cx={x} cy={yPS} r="3" fill="#3b82f6" />
            <circle cx={x} cy={yPD} r="3" fill="#8b5cf6" />
            <text x={x} y={height - 5} text-anchor="middle" class="text-[9px] fill-gray-400">{formatarData(d.data_medicao).slice(0, 5)}</text>
          {/each}
        </svg>
        <div class="flex justify-center gap-6 mt-3 text-xs">
          <span class="flex items-center gap-1.5"><span class="w-3 h-0.5 bg-blue-500 rounded"></span> PS</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-0.5 bg-purple-500 rounded"></span> PD</span>
        </div>
      {:else}
        <p class="text-sm text-gray-400 text-center py-8">Necessário pelo menos 2 dias de medição para gerar gráfico.</p>
      {/if}
    </div>
  {/if}
</div>
