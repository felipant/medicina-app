<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
  const template = "Lúcido e orientado (escala de coma de Glasgow 15). Pupilas isocóricas e fotorreativas. Ausência de déficits motores ou sensitivos focais. Coordenação motora preservada (teste índex-nariz normal). Ausência de sinais de irritação meníngea (rigidez de nuca ausente). Reflexos osteotendíneos normais e simétricos.";

  function carregarTemplate() {
    if (dados.exame_neurologico && dados.exame_neurologico.trim()) return;
    dados.exame_neurologico = template;
    onchange();
  }
</script>

<div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div class="mb-2 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-400 font-bold">i</span>
      <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Neurológico</span>
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
    bind:value={dados.exame_neurologico}
    oninput={onchange}
    disabled={readonly}
    rows="3"
    placeholder="Sensitivo, motor, reflexos..."
    class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
  ></textarea>
</div>
