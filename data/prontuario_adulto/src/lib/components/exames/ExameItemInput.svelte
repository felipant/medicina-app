<script lang="ts">
  import type { ExameRascunho } from '$lib/stores/exames.svelte';
  import BadgeAlterado from './BadgeAlterado.svelte';
  import TooltipSignificado from './TooltipSignificado.svelte';
  import { Settings, ChevronDown } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

  let { exame = $bindable() }: { exame: ExameRascunho } = $props();

  let accordionAberto = $state(false);

  let isAlterado = $derived.by(() => {
    if (!exame.incluido) return false;
    if (exame.tipo_resultado === 'numerico' && exame.valor_numerico !== null) {
       const v = Number(exame.valor_numerico);
       if (exame.ref_min !== null && v < exame.ref_min) return true;
       if (exame.ref_max !== null && v > exame.ref_max) return true;
    }
    if (exame.tipo_resultado === 'qualitativo' && exame.valor_qualitativo) {
        const low = exame.valor_qualitativo.toLowerCase();
        if (low.includes("positivo") || low.includes("presente") || low.includes("+")) return true;
    }
    return false;
  });

  let dangerZone = $derived.by(() => {
     if (!isAlterado) return 'normal';
     if (exame.tipo_resultado === 'numerico' && exame.valor_numerico !== null) {
         const v = Number(exame.valor_numerico);
         if (exame.ref_max !== null && v > exame.ref_max * 1.2) return 'high';
         if (exame.ref_min !== null && v < exame.ref_min * 0.8) return 'high';
         return 'warn';
     }
     return 'warn';
  });

  let borderColor = $derived.by(() => {
     if (!exame.incluido) return 'border-slate-200 bg-slate-50 opacity-60';
     if (exame.valor_numerico === null && !exame.valor_qualitativo) return 'border-slate-300';
     if (!isAlterado) return 'border-emerald-300 bg-emerald-50/30';
     if (dangerZone === 'high') return 'border-red-400 bg-red-50/30';
     return 'border-amber-300 bg-amber-50/30';
  });

  function toggleAccordion() {
    if (exame.incluido) {
      accordionAberto = !accordionAberto;
    }
  }
</script>

<div class="flex flex-col border rounded-xl transition-all {borderColor}">
  <div class="flex items-center gap-3 p-3">
    <input type="checkbox" bind:checked={exame.incluido} class="rounded border-slate-300 w-4 h-4 text-indigo-600" />
    
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <TooltipSignificado nome={exame.nome_exame} significado={exame.significado ?? null}>
          <span class="text-sm font-medium text-slate-800 truncate">{exame.nome_exame}</span>
        </TooltipSignificado>
        {#if isAlterado && exame.incluido}
           <BadgeAlterado alterado={true} valor={exame.valor_numerico} refMin={exame.ref_min} refMax={exame.ref_max} />
        {/if}
      </div>
      <span class="text-[10px] text-slate-500 block mt-0.5">
        {#if exame.ref_texto}
           Ref: {exame.ref_texto}
        {:else if exame.ref_min !== null || exame.ref_max !== null}
           Ref: {exame.ref_min !== null ? exame.ref_min : ''} {exame.ref_min !== null && exame.ref_max !== null ? '—' : ''} {exame.ref_max !== null ? exame.ref_max : ''} {exame.unidade || ''}
        {:else}
           Ref: Variável
        {/if}
      </span>
    </div>

    <div class="w-48 flex items-center gap-2">
      {#if exame.tipo_resultado === 'numerico'}
        <div class="relative flex-1">
          <input 
             type="number" 
             step="0.01" 
             placeholder="--" 
             bind:value={exame.valor_numerico}
             disabled={!exame.incluido}
             class="w-full text-right text-sm font-mono font-bold border-none bg-transparent focus:ring-0 p-1 pr-1"
          />
        </div>
        <span class="text-xs text-slate-400 w-10 truncate">{exame.unidade || ''}</span>
      {:else if exame.tipo_resultado === 'qualitativo'}
        <select 
          bind:value={exame.valor_qualitativo} 
          disabled={!exame.incluido}
          class="w-full bg-transparent border-none text-xs focus:ring-0 p-1"
        >
          <option value="">Selecione</option>
          <option value="Negativo">Negativo</option>
          <option value="Positivo">Positivo</option>
          <option value="Ausente">Ausente</option>
          <option value="Presente">Presente</option>
          <option value="Traços">Traços</option>
          <option value="1+">1+</option>
          <option value="2+">2+</option>
          <option value="3+">3+</option>
        </select>
      {:else}
        <textarea 
          bind:value={exame.valor_livre} 
          disabled={!exame.incluido}
          placeholder="Laudo..."
          class="w-full text-xs bg-white/50 rounded border-slate-200 p-1 resize-none" 
          rows="1"
        ></textarea>
      {/if}

      <!-- Botão de Configurações de Referência -->
      <button
        type="button"
        onclick={toggleAccordion}
        disabled={!exame.incluido}
        class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-30"
        title="Ajustar valores de referência"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Accordion: Edição de Referência -->
  {#if accordionAberto && exame.incluido}
    <div transition:slide={{ duration: 200 }} class="px-3 pb-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
      <div class="pt-2 space-y-2">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ajustar Limites de Referência para este Resultado</span>
        
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 block">Mínimo</label>
            <input 
              type="number" 
              step="0.01" 
              bind:value={exame.ref_min}
              placeholder="Vazio"
              class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 block">Máximo</label>
            <input 
              type="number" 
              step="0.01" 
              bind:value={exame.ref_max}
              placeholder="Vazio"
              class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label class="text-[10px] text-slate-500 block">Texto de Referência Alternativo</label>
          <input 
            type="text" 
            bind:value={exame.ref_texto}
            placeholder="Sobrescreve limites numéricos na exibição..."
            class="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>
