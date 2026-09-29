<script lang="ts">
  import { CalendarClock } from 'lucide-svelte';
  let { dados = $bindable(), readonly = false, onchange } = $props();
  if (!dados.seguimento) dados.seguimento = { destino: 'Alta' };
</script>

<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
  <div class="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center gap-3 text-slate-800 font-semibold">
    <CalendarClock class="w-5 h-5 text-amber-600" /> Plano de Seguimento / Destino
  </div>
  
  <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-slate-600">Destino do Paciente</label>
      <select bind:value={dados.seguimento.destino} onchange={onchange} disabled={readonly} class="w-full border-slate-200 text-sm rounded-lg p-2">
        <option>Alta ambulatorial</option>
        <option>Retorno agendado</option>
        <option>Encaminhamento Especializado</option>
        <option>Encaminhamento p/ Emergência / UPA</option>
      </select>
    </div>

    {#if dados.seguimento.destino === 'Retorno agendado'}
      <div class="flex gap-3 animate-in slide-in-from-top-1">
        <div class="flex-1 space-y-1.5">
          <label class="text-xs font-medium text-slate-600">Prazo</label>
          <input type="number" bind:value={dados.seguimento.retorno_prazo_valor} oninput={onchange} disabled={readonly} class="w-full border-slate-200 text-sm rounded-lg"/>
        </div>
        <div class="flex-1 space-y-1.5 pt-6">
          <select bind:value={dados.seguimento.retorno_prazo_unidade} onchange={onchange} disabled={readonly} class="w-full border-slate-200 text-sm rounded-lg">
            <option>Dias</option><option>Semanas</option><option>Meses</option>
          </select>
        </div>
      </div>
    {/if}

    <div class="col-span-full pt-2">
      <label class="text-xs font-medium text-slate-600">Justificativa de Encaminhamento / Notas de Alta</label>
      <textarea rows="2" placeholder="Descreva brevemente o motivo da alta ou encaminhamento..." bind:value={dados.seguimento.detalhes} oninput={onchange} disabled={readonly} class="w-full border-slate-200 rounded-lg text-sm resize-none"></textarea>
    </div>
  </div>
</div>
