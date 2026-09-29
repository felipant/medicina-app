<script lang="ts">
  let { ps = $bindable<number | null>(null), pd = $bindable<number | null>(null) } = $props();

  const classe = $derived(() => {
    if (!ps || !pd) return 'bg-gray-50 border-gray-200';
    if (ps >= 180 || pd >= 110) return 'bg-red-100 border-red-300';
    if (ps >= 160 || pd >= 100) return 'bg-orange-100 border-orange-300';
    if (ps >= 140 || pd >= 90)  return 'bg-amber-100 border-amber-300';
    if (ps >= 130 || pd >= 80)  return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  });
</script>

<div class="flex items-center gap-1 p-1.5 rounded-lg border {classe()} min-w-[100px] transition-colors">
  <input
    type="number"
    bind:value={ps}
    placeholder="PS"
    min="50" max="300"
    class="w-11 text-center text-xs bg-transparent outline-none font-bold text-gray-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
  />
  <span class="text-gray-300 text-xs font-bold">/</span>
  <input
    type="number"
    bind:value={pd}
    placeholder="PD"
    min="30" max="200"
    class="w-11 text-center text-xs bg-transparent outline-none font-bold text-gray-800 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
  />
</div>
