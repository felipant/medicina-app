<script lang="ts">
  import { Users2 } from 'lucide-svelte';
  let { dados = $bindable(), readonly = false, onchange } = $props();

  let activeGuide = $state(false);
  const guideText = "Explore contexto familiar, suporte social, moradia, renda, estressores, espiritualidade e segurança.";
</script>

<section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm h-full">
  <div class="mb-2 flex items-start justify-between gap-3">
    <div>
      <h3 class="text-sm font-bold text-slate-900 flex items-center gap-1.5">
        <Users2 class="w-4 h-4 text-emerald-600" />
        História Psicossocial
      </h3>
      <p class="text-xs text-slate-500 mt-0.5">Contexto familiar e redes de apoio.</p>
    </div>
    <span class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-400">
      ?
    </span>
  </div>
  
  <div class="relative">
    <textarea
      bind:value={dados.historia_psicossocial_narrativa}
      oninput={onchange}
      onfocus={() => activeGuide = true}
      onblur={() => activeGuide = false}
      disabled={readonly}
      rows="5"
      placeholder="Composição do domicílio, lazer, conflitos..."
      class="relative z-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
    ></textarea>
    
    {#if activeGuide}
      <p class="pointer-events-none absolute bottom-3 left-3 right-3 z-20 rounded-lg bg-slate-900 text-white px-3 py-2 text-xs opacity-90 shadow-lg animate-in slide-in-from-bottom-1">
        {guideText}
      </p>
    {/if}
  </div>
</section>
