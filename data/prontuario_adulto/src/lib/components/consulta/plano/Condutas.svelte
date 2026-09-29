<script lang="ts">
  import { Stethoscope } from 'lucide-svelte';
  import Prescricoes from './Prescricoes.svelte';

  let { dados = $bindable(), readonly = false, onchange, accessToken, prontuarioId, consultaId, pacienteId, textoInserido = $bindable('') } = $props();
  if (!dados.condutas) dados.condutas = {};

  // Receber texto da síntese Groq e appendar ao campo conduta_geral
  $effect(() => {
    if (textoInserido) {
      const atual = dados.condutas.conduta_geral ?? ''
      dados.condutas.conduta_geral = atual
        ? atual + '\n\n---\n' + textoInserido
        : textoInserido
      textoInserido = ''
      onchange?.()
    }
  })
</script>

<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
  <div class="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-3 text-slate-800 font-semibold">
    <Stethoscope class="w-5 h-5 text-emerald-600" /> Condutas e Prescrições
  </div>

  <div class="p-6 space-y-8">
    <!-- CONDUTA GERAL -->
    <div class="space-y-1.5">
      <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        Orientações Não-Farmacológicas / Conduta Geral *
      </label>
      <textarea 
        rows="4" 
        placeholder="Ex: Repouso, hidratação oral, dieta hipossódica, sinais de alarme para retornar..." 
        bind:value={dados.condutas.conduta_geral} 
        oninput={onchange} 
        disabled={readonly} 
        class="w-full border-slate-200 rounded-2xl text-sm leading-relaxed focus:ring-emerald-500 shadow-sm min-h-[90px]"
      ></textarea>
    </div>

    <!-- PRESCRIÇÕES ESTRUTURADAS SQL -->
    <div class="pt-4 border-t border-slate-100">
      <Prescricoes {consultaId} {prontuarioId} {accessToken} {readonly} />
    </div>
  </div>
</div>

