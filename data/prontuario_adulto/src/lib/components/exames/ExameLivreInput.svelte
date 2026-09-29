<script lang="ts">
  import type { ExameRascunho } from '$lib/stores/exames.svelte';
  import { Trash2, FlaskConical } from 'lucide-svelte';

  interface Props {
    exame: ExameRascunho;
    onremove: () => void;
  }

  let { exame = $bindable(), onremove }: Props = $props();
</script>

<div class="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 relative animate-in slide-in-from-top-2 duration-200">
  <button type="button" onclick={onremove} class="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors">
    <Trash2 class="w-4 h-4" />
  </button>

  <div class="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
    <FlaskConical class="w-3.5 h-3.5" /> Exame Não Catalogado
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div class="col-span-2">
      <label class="text-[10px] font-bold text-slate-500 block">Nome do Exame *</label>
      <input type="text" bind:value={exame.nome_exame} class="w-full text-sm border-slate-200 rounded-lg p-2 bg-white" placeholder="Ex: Ácido Metilmalônico" />
    </div>

    <div>
      <label class="text-[10px] font-bold text-slate-500 block">Material</label>
      <select bind:value={exame.material} class="w-full text-xs border-slate-200 rounded-lg bg-white">
         <option value="Sangue">Sangue</option>
         <option value="Urina">Urina</option>
         <option value="Fezes">Fezes</option>
         <option value="LCR">LCR</option>
         <option value="Outro">Outro</option>
      </select>
    </div>

    <div>
      <label class="text-[10px] font-bold text-slate-500 block">Tipo Resultado</label>
      <select bind:value={exame.tipo_resultado} class="w-full text-xs border-slate-200 rounded-lg bg-white">
         <option value="numerico">Numérico</option>
         <option value="qualitativo">Qualitativo</option>
         <option value="livre">Laudo Livre</option>
      </select>
    </div>
  </div>

  <div class="bg-white p-3 rounded-lg border border-indigo-100 flex gap-3 items-end">
     {#if exame.tipo_resultado === 'numerico'}
        <div class="flex-1">
          <label class="text-[10px] text-slate-400 block">Valor</label>
          <input type="number" step="0.01" bind:value={exame.valor_numerico} class="w-full text-sm border-slate-200 rounded" />
        </div>
        <div class="w-16">
           <label class="text-[10px] text-slate-400 block">Uni</label>
           <input type="text" bind:value={exame.unidade} class="w-full text-sm border-slate-200 rounded" placeholder="g/dL" />
        </div>
        <div class="w-16">
           <label class="text-[10px] text-slate-400 block">Ref Mín</label>
           <input type="number" step="0.01" bind:value={exame.ref_min} class="w-full text-sm border-slate-200 rounded" />
        </div>
        <div class="w-16">
           <label class="text-[10px] text-slate-400 block">Ref Máx</label>
           <input type="number" step="0.01" bind:value={exame.ref_max} class="w-full text-sm border-slate-200 rounded" />
        </div>
     {:else if exame.tipo_resultado === 'qualitativo'}
        <div class="flex-1">
           <label class="text-[10px] text-slate-400 block">Resultado Textual</label>
           <input type="text" bind:value={exame.valor_qualitativo} class="w-full text-sm border-slate-200 rounded" placeholder="Ex: Negativo" />
        </div>
     {:else}
        <div class="flex-1">
           <label class="text-[10px] text-slate-400 block">Laudo Livre</label>
           <textarea bind:value={exame.valor_livre} rows="2" class="w-full text-sm border-slate-200 rounded"></textarea>
        </div>
     {/if}
  </div>
</div>
