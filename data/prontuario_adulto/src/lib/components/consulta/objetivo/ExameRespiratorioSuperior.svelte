<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
  const template = "Narinas desobstruídas, mucosa nasal corada e sem secreções. Orofaringe sem hiperemia, amígdalas normotróficas, ausência de placas ou exsudatos. Condutos auditivos externos livres, membranas timpânicas íntegras, translúcidas e com reflexo luminoso presente.";

  function carregarTemplate() {
    if (dados.exame_resp_superior && dados.exame_resp_superior.trim()) return;
    dados.exame_resp_superior = template;
    onchange();
  }
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div class="mb-2 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-400 font-bold">i</span>
      <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Respiratório Superior (ORL)</span>
    </div>
    {#if !readonly}
    <button
      type="button"
      onclick={carregarTemplate}
      class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200 border border-slate-200"
    >
      Carregar Template
    </button>
    {/if}
  </div>
  <textarea
    bind:value={dados.exame_resp_superior}
    oninput={onchange}
    disabled={readonly}
    rows="3"
    placeholder="Otoscopia, oroscopia, rinoscopia..."
    class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
  ></textarea>
</div>
