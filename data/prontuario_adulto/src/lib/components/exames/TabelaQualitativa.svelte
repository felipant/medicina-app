<script lang="ts">
  interface Props {
      exames: any[];
  }

  let { exames }: Props = $props();

  // Coleta todas as datas únicas de todas as séries ordenadas descendente (mais recente primeiro)
  let uniqueDates = $derived.by(() => {
      const s = new Set<string>();
      exames.forEach(ex => ex.pontos.forEach((p: any) => s.add(p.data_coleta)));
      return Array.from(s).sort((a, b) => b.localeCompare(a)).slice(0, 8); // Últimas 8
  });

  function formatarData(iso: string) {
      const parts = iso.split('-');
      return `${parts[2]}/${parts[1]}`;
  }

  function getValorNaData(pontos: any[], data: string) {
      return pontos.find(p => p.data_coleta === data);
  }

  function getBgColor(ponto: any) {
      if (!ponto) return 'bg-slate-50';
      if (ponto.alterado) return 'bg-red-50 text-red-700 font-medium';
      return 'bg-white text-slate-800';
  }
</script>

<div class="overflow-x-auto bg-white border border-slate-100 rounded-xl shadow-sm">
  <table class="w-full text-xs border-collapse text-left">
    <thead class="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
      <tr>
        <th class="p-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-40">Exame</th>
        {#each uniqueDates as dt}
           <th class="p-3 text-center border-r border-slate-100 min-w-[70px]">{formatarData(dt)}</th>
        {/each}
        <th class="p-3 text-slate-400 italic">Referência</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      {#each exames as ex}
         <tr class="hover:bg-slate-50/50">
            <td class="p-3 font-medium text-slate-700 border-r border-slate-200 sticky left-0 bg-white">{ex.nome_exame}</td>
            {#each uniqueDates as dt}
               {@const pt = getValorNaData(ex.pontos, dt)}
               <td class="p-3 text-center border-r border-slate-100 {getBgColor(pt)}">
                  {pt ? (pt.valor_qualitativo || pt.valor_numerico || '-') : '—'}
               </td>
            {/each}
            <td class="p-3 text-slate-500 italic bg-slate-50/30">{ex.ref_texto || '—'}</td>
         </tr>
      {/each}
    </tbody>
  </table>
</div>
