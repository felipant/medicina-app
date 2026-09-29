<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none">
    Queixa Principal
  </summary>
  <div class="px-4 pb-4">
    <input
      bind:value={dados.queixa_principal}
      oninput={() => onchange?.()}
      placeholder="Dor torácica há 2 semanas, dispneia aos esforços..."
      disabled={readonly}
      class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow shadow-sm"
    />
  </div>
</details>
