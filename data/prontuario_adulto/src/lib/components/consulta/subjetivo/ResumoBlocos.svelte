<script lang="ts">
  interface Props {
    blocos: any[];
  }
  let { blocos }: Props = $props();

  function getBadgeColor(controle: string | null) {
    switch (controle) {
      case 'bom': return 'bg-emerald-500';
      case 'regular': return 'bg-amber-500';
      case 'ruim': return 'bg-orange-500';
      case 'instavel': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  }
</script>

<div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10 py-2 px-1 rounded-xl border-b border-slate-100">
  <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap px-1">Fluxo S:</span>
  {#each blocos as b, i}
    <div class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-full text-xs font-medium text-slate-700 whitespace-nowrap">
      <span class="font-black text-indigo-600 font-mono">S{i+1}</span>
      <span class="max-w-[120px] truncate">{b.titulo || (b.tipo === 'queixa' ? 'Queixa' : 'Comorbidade')}</span>
      {#if b.tipo === 'comorbidade' && b.controle_status}
        <span class="w-2 h-2 rounded-full {getBadgeColor(b.controle_status)}" title="Controle: {b.controle_status}"></span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
