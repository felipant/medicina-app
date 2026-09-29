<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();
  
  let activeGuide = $state(false);
  const guideText = "Registre sinais e sintomas por sistemas, destacando positivos e negativos relevantes para o raciocínio clínico.";
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none">
    Revisão de Sistemas
  </summary>
  <section class="px-4 pb-4">
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Revisão de Sistemas</h3>
          <p class="text-xs text-slate-500">Checklist narrativo focado nos sistemas orgânicos.</p>
        </div>
        <span class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
          ?
        </span>
      </div>
      <div class="relative">
        <textarea
          bind:value={dados.revisao_sistemas_narrativo}
          oninput={onchange}
          onfocus={() => activeGuide = true}
          onblur={() => activeGuide = false}
          disabled={readonly}
          rows="6"
          class="relative z-10 w-full rounded-xl border border-slate-300 bg-slate-50/30 px-4 py-3 text-sm leading-relaxed outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          placeholder="Sem outras queixas aos demais sistemas interrogados..."
        ></textarea>
        
        {#if activeGuide}
          <p class="pointer-events-none absolute bottom-4 right-4 z-20 max-w-md rounded-xl bg-slate-900 text-white px-4 py-3 text-xs leading-relaxed shadow-xl animate-in fade-in duration-200 opacity-90">
             <strong class="block mb-1 text-indigo-300">Lembrete:</strong>
             {guideText}
          </p>
        {/if}
      </div>
    </div>
  </section>
</details>
