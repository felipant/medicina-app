<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div class="mb-2 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-400 font-bold">i</span>
      <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Osteoarticular / Extremidades</span>
    </div>
  </div>
  <textarea
    bind:value={dados.exame_osteoarticular}
    oninput={onchange}
    disabled={readonly}
    rows="3"
    placeholder="Articulações, força, amplitude, edemas de membros..."
    class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
  ></textarea>
</div>
