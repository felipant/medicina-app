<script lang="ts">
  import { FlaskConical, Plus, Trash2 } from 'lucide-svelte';
  let { dados = $bindable(), readonly = false, onchange, accessToken, consultaId, prontuarioId, pacienteId } = $props();
  if (!dados.exames) dados.exames = { solicitados: [] };

  function add() {
    dados.exames.solicitados.push({ nome: '', urgencia: 'Rotina' });
    onchange();
  }
</script>

<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
  <div class="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-800">
    <div class="flex items-center gap-3"><FlaskConical class="w-5 h-5 text-sky-600" /> Exames Solicitados</div>
    <button type="button" onclick={add} disabled={readonly} class="text-xs text-indigo-600 font-bold">+ Solicitar Exame</button>
  </div>
  <div class="p-6 space-y-3">
    {#each dados.exames.solicitados as ex, idx}
      <div class="flex gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl">
        <input type="text" placeholder="Nome do exame (Hemograma, Rx...)" bind:value={ex.nome} oninput={onchange} disabled={readonly} class="flex-1 text-sm border-slate-200 rounded-lg"/>
        <select bind:value={ex.urgencia} onchange={onchange} disabled={readonly} class="text-xs border-slate-200 rounded-lg bg-white">
          <option>Rotina</option><option>Urgência</option>
        </select>
        <button type="button" onclick={() => { dados.exames.solicitados.splice(idx, 1); onchange(); }} class="text-slate-400 hover:text-red-500"><Trash2 class="w-4 h-4"/></button>
      </div>
    {/each}
  </div>
</div>
