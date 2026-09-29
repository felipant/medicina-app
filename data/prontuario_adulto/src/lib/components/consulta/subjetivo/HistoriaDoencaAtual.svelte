<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
  
  let activeGuide = $state(false);
  const guideText = "Descreva cronologia, fatores de melhora/piora, intensidade, sintomas associados e impacto funcional.";
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none">
    História da Moléstia Atual (HMA)
  </summary>
  <section class="px-4 pb-4">
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900">HMA</h3>
          <p class="text-xs text-slate-500">Linha narrativa da queixa atual.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 select-none" title="Guia clínico">
            ?
          </span>
        </div>
      </div>
      <div class="relative group">
        <textarea
          bind:value={dados.hma}
          oninput={onchange}
          onfocus={() => activeGuide = true}
          onblur={() => activeGuide = false}
          disabled={readonly}
          rows="8"
          placeholder="Paciente relata..."
          class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/30 px-4 py-3 text-sm leading-relaxed outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-y min-h-[150px]"
        ></textarea>
        
        {#if activeGuide}
          <p class="pointer-events-none absolute bottom-4 right-4 z-20 max-w-md rounded-xl bg-slate-900 text-white px-4 py-3 text-xs leading-relaxed shadow-xl animate-in fade-in duration-200 opacity-90">
            <strong class="block mb-1 text-indigo-300">Sugestão de estrutura:</strong>
            {guideText}
          </p>
        {/if}
      </div>
    </div>
  </section>
</details>
