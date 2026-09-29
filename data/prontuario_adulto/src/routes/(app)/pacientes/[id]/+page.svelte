<script lang="ts">
  import { enhance } from '$app/forms';
  import { 
    User, CalendarDays, FileText, ArrowRightCircle, 
    CheckCircle2, AlertCircle, PlusCircle, Edit, FlaskConical,
    Activity, X, Trash2, Pill
  } from 'lucide-svelte';
  import PopupPA from '$lib/components/pressao/PopupPA.svelte';
  import HistoricoPA from '$lib/components/pressao/HistoricoPA.svelte';
  import { apiFetch } from '$lib/api';
  import { goto } from '$app/navigation';

  let { data, form } = $props();
  let { paciente, consultas } = $derived(data);

  const rascunhos = $derived(consultas.filter((c: any) => c.status === 'rascunho'));
  const finalizados = $derived(consultas.filter((c: any) => c.status === 'finalizado'));

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
       day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function formatarDataSimples(dStr: string | null) {
    if (!dStr) return "-";
    const parts = dStr.split('-');
    if (parts.length < 3) return dStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function calcularIdade(dStr: string | null) {
    if (!dStr) return "-";
    // Use local date computation to prevent time-of-day shifting errors
    const today = new Date();
    const parts = dStr.split('-');
    const birthYear = parseInt(parts[0]);
    const birthMonth = parseInt(parts[1]) - 1;
    const birthDay = parseInt(parts[2]);
    
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
        age--;
    }
    return age;
  }

  const role = data.usuario?.role;
  const isEstudante = role === 'estudante';
  const isRecepcionista = role === 'recepcionista';
  const getConsultaUrl = (id: string) => `/consulta/${id}`;

  let paPopupAberto = $state(false);
  let paHistoricoAberto = $state(false);
  let refreshHistoricoCount = $state(0);

  let modalExclusaoAberto = $state(false);
  let excluindo = $state(false);

  function confirmarExclusao(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    modalExclusaoAberto = true;
  }

  async function executarExclusao() {
    excluindo = true;
    try {
      await apiFetch(`/api/v1/pacientes/${paciente.id}`, data.accessToken, {
        method: 'DELETE'
      });
      modalExclusaoAberto = false;
      await goto('/pacientes');
    } catch (e: any) {
      alert(e.message || "Erro ao excluir paciente.");
    } finally {
      excluindo = false;
    }
  }
</script>

<div class="max-w-5xl mx-auto p-6 space-y-6">
  
  <!-- Backlink -->
  <a href="/pacientes" class="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors">
    &larr; Voltar para a Lista
  </a>

  <!-- Cabeçalho de Identificação -->
  <header class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="flex items-start gap-4">
      <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 shadow-inner border border-slate-200">
        <User class="w-8 h-8" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-900 leading-tight">{paciente.nome}</h1>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-500 font-medium">
           <span class="flex items-center gap-1"><CalendarDays class="w-4 h-4 text-slate-400" /> {calcularIdade(paciente.data_nasc)} anos ({formatarDataSimples(paciente.data_nasc)})</span>
           {#if !isEstudante && paciente.cpf}<span>CPF: {paciente.cpf}</span>{/if}
           <span>Sexo: {paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Feminino' : 'Outro'}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <a href="/pacientes/{paciente.id}/edit" class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all">
        <Edit class="w-4 h-4" /> Editar Dados
      </a>
      
      <button onclick={() => paHistoricoAberto = true} class="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 shadow-sm transition-all">
        <Activity class="w-4 h-4" /> Histórico PA
      </button>
      
      <a href="/pacientes/{paciente.id}/exames" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold hover:bg-indigo-100 shadow-sm transition-all">
        <FlaskConical class="w-4 h-4" /> Ver Laboratório
      </a>
      
      {#if isEstudante}
        <button type="button" onclick={confirmarExclusao} class="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 shadow-sm transition-all">
          <Trash2 class="w-4 h-4" /> Excluir Paciente
        </button>
      {/if}
    </div>
  </header>

  <!-- Mensagem de erro na criação -->
  {#if form?.error}
    <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-3 text-sm font-medium animate-shake">
       <AlertCircle class="w-5 h-5 shrink-0" />
       {form.error}
    </div>
  {/if}

  {#if !isRecepcionista}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Coluna da Esquerda: Ações Rápidas -->
      <div class="md:col-span-1 space-y-6">
        <section class="bg-slate-900 rounded-3xl p-5 text-white shadow-xl">
          <h3 class="text-lg font-bold leading-tight mb-1">Nova Consulta</h3>
          <p class="text-slate-400 text-xs mb-5">Inicie um novo registro clínico em branco para este paciente.</p>
          
          <form method="POST" action="?/nova_consulta" use:enhance>
            <input type="hidden" name="prontuario_id" value={paciente.prontuario_id} />
            <button type="submit" class="w-full py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-md">
               <PlusCircle class="w-5 h-5" /> Iniciar Atendimento
            </button>
          </form>
        </section>

        <!-- SEÇÃO: PROBLEMAS ATIVOS / DIAGNÓSTICOS CONFIRMADOS -->
        <section class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
           <div class="flex items-center gap-2.5 border-b border-slate-50 pb-3">
             <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
               <CheckCircle2 class="w-4.5 h-4.5" />
             </div>
             <div>
               <h3 class="font-extrabold text-slate-900 text-sm leading-none">Lista de Problemas</h3>
               <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">Histórico Clínico</p>
             </div>
           </div>

           <div class="space-y-2 overflow-y-auto max-h-[320px] pr-1">
             {#if !data.diagnosticos || data.diagnosticos.length === 0}
               <div class="py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                 <p class="text-[10px] text-slate-400 italic font-medium px-3 leading-snug">Nenhum diagnóstico registrado no prontuário.</p>
               </div>
             {:else}
               {#each data.diagnosticos as d}
                 {#if d.status_resolucao === 'resolvido'}
                   <!-- Item Resolvido Visão Geral -->
                   <div class="bg-slate-50/50 border border-slate-200 p-3 rounded-xl flex gap-2.5 items-start opacity-70 shadow-inner bg-opacity-60">
                     <span class="font-mono font-bold text-[8px] bg-slate-200 text-slate-500 border border-slate-300/50 px-1.5 py-0.5 rounded shrink-0 tracking-wide line-through">
                       {d.cid_subcat || "Livre"}
                     </span>
                     <div class="min-w-0 flex-1">
                       <p class="text-xs font-semibold text-slate-450 leading-tight truncate line-through" title={d.cid_descricao || d.descricao_livre}>
                         {d.cid_descricao || d.descricao_livre}
                       </p>
                       <div class="flex items-center gap-1.5 mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <span class="px-1 bg-slate-200 text-slate-500 rounded-md shrink-0 text-[8px]">Resolvido</span>
                          <span class="text-[7px] text-slate-300">•</span>
                          <span class="font-medium normal-case shrink-0 text-slate-400">Fim: {new Date(d.criado_em).toLocaleDateString('pt-BR')}</span>
                       </div>
                     </div>
                   </div>
                 {:else}
                   <!-- Item Ativo Visão Geral -->
                   <div class="bg-emerald-50/30 hover:bg-emerald-50 border border-emerald-100/80 p-3 rounded-xl transition-all flex gap-2.5 items-start group hover:shadow-sm hover:border-emerald-300">
                     <span class="font-mono font-black text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded shrink-0 tracking-wide">
                       {d.cid_subcat || "Livre"}
                     </span>
                     <div class="min-w-0 flex-1">
                       <p class="text-xs font-bold text-slate-800 leading-tight group-hover:text-slate-900 truncate" title={d.cid_descricao || d.descricao_livre}>
                         {d.cid_descricao || d.descricao_livre}
                       </p>
                       <div class="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          <span class="px-1 bg-white border border-slate-200 rounded text-slate-600 shrink-0">{d.tipo}</span>
                          <span class="text-[7px] text-slate-300">•</span>
                          <span class="font-medium text-slate-500 normal-case shrink-0">Início: {new Date(d.criado_em).toLocaleDateString('pt-BR')}</span>
                       </div>
                     </div>
                   </div>
                 {/if}
               {/each}
             {/if}
           </div>
        </section>

        <!-- SEÇÃO: MEDICAMENTOS EM USO / HISTÓRICO -->
        <section class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200 mt-5">
           <div class="flex items-center gap-2.5 border-b border-slate-50 pb-3">
             <div class="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
               <Pill class="w-4.5 h-4.5" />
             </div>
             <div>
               <h3 class="font-extrabold text-slate-900 text-sm leading-none">Medicamentos em Uso</h3>
               <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">Histórico Terapêutico</p>
             </div>
           </div>

           <div class="space-y-2 overflow-y-auto max-h-[320px] pr-1">
             {#if !data.medicamentos || data.medicamentos.length === 0}
               <div class="py-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                 <p class="text-[10px] text-slate-400 italic font-medium px-3 leading-snug">Nenhum medicamento estruturado registrado.</p>
               </div>
             {:else}
               {#each data.medicamentos as m}
                 {#if m.status === 'suspenso'}
                   <!-- Item Suspenso Visão Geral -->
                   <div class="bg-slate-50/50 border border-slate-200 p-3 rounded-xl flex gap-2.5 items-start opacity-70 shadow-inner bg-opacity-60">
                     <div class="min-w-0 flex-1">
                       <p class="text-xs font-semibold text-slate-450 leading-tight truncate line-through" title={m.principio_ativo}>
                         {m.principio_ativo} {m.concentracao || ''}
                       </p>
                       <div class="flex items-center gap-1.5 mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          <span class="px-1 bg-red-50 text-red-600 border border-red-100 rounded-md shrink-0 text-[8px]">Suspenso</span>
                          <span class="text-[7px] text-slate-300">•</span>
                          <span class="font-medium normal-case shrink-0 text-slate-400">Fim: {new Date(m.criado_em).toLocaleDateString('pt-BR')}</span>
                       </div>
                     </div>
                   </div>
                 {:else}
                   <!-- Item Ativo Visão Geral -->
                   <div class="bg-sky-50/30 hover:bg-sky-50 border border-sky-100/80 p-3 rounded-xl transition-all flex gap-2.5 items-start group hover:shadow-sm hover:border-sky-300">
                     <div class="min-w-0 flex-1">
                       <p class="text-xs font-bold text-slate-800 leading-tight group-hover:text-slate-900 truncate" title={m.principio_ativo}>
                         {m.principio_ativo} {m.concentracao || ''}
                       </p>
                       {#if m.frequencia}
                         <p class="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.frequencia}</p>
                       {/if}
                       <div class="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          <span class="px-1 bg-white border border-slate-200 rounded text-slate-600 shrink-0">Ativo</span>
                          <span class="text-[7px] text-slate-300">•</span>
                          <span class="font-medium text-slate-500 normal-case shrink-0">Desde: {new Date(m.criado_em).toLocaleDateString('pt-BR')}</span>
                       </div>
                     </div>
                   </div>
                 {/if}
               {/each}
             {/if}
           </div>
        </section>
      </div>

      <!-- Coluna da Direita: Histórico (Rascunhos e Finalizados) -->
      <div class="md:col-span-2 space-y-6">
        
        <!-- SEÇÃO 1: CONSULTAS EM ABERTO (PENDENTES) -->
        <section>
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            Consultas em Aberto / Rascunho
          </h2>
          
          {#if rascunhos.length === 0}
            <div class="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
               Não há consultas pendentes de finalização.
            </div>
          {:else}
            <div class="space-y-3">
              {#each rascunhos as c (c.id)}
                <div class="group bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between hover:bg-white hover:shadow-md transition-all duration-300">
                  <div class="flex items-center gap-3">
                    <div class="p-3 bg-amber-100 text-amber-700 rounded-xl">
                      <FileText class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 text-sm">{formatarData(c.criado_em)}</p>
                      <p class="text-xs text-slate-500 mt-0.5">Profissional: {c.medico_nome || "Desconhecido"}</p>
                      
                      <!-- Barra de Progresso -->
                      <div class="mt-2 flex items-center gap-2">
                         <div class="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div class="h-full bg-amber-500" style="width: {c.completude_pct}%"></div>
                         </div>
                         <span class="text-[10px] font-bold text-amber-700">{c.completude_pct}% concluído</span>
                      </div>
                    </div>
                  </div>

                  <a href={getConsultaUrl(c.id)} class="flex items-center gap-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white hover:border-transparent px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all">
                    Retomar Consulta <ArrowRightCircle class="w-4 h-4" />
                  </a>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <!-- SEÇÃO 2: HISTÓRICO COMPLETO (FINALIZADOS) -->
        <section>
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Histórico de Consultas</h2>
          
          {#if finalizados.length === 0}
            <div class="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm shadow-sm flex flex-col items-center justify-center gap-2">
               <FileText class="w-8 h-8 text-slate-300" />
               <p class="font-medium">Nenhum atendimento finalizado até o momento.</p>
            </div>
          {:else}
             <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
                 <div class="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {#each finalizados as c (c.id)}
                    <div class="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                           <CheckCircle2 class="w-5 h-5" />
                        </div>
                        <div>
                          <p class="font-bold text-slate-800 text-sm">{formatarData(c.criado_em)}</p>
                          <p class="text-xs text-slate-500">Por: {c.medico_nome}</p>
                        </div>
                      </div>
                      <a href={getConsultaUrl(c.id)} class="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                        Ver Detalhes &rarr;
                      </a>
                    </div>
                  {/each}
                </div>
             </div>
          {/if}
        </section>

      </div>
    </div>
  {:else}
    <div class="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto">
        <AlertCircle class="w-8 h-8" />
      </div>
      <div class="max-w-md mx-auto space-y-2">
        <h2 class="text-lg font-bold text-slate-900">Prontuário Clínico Restrito</h2>
        <p class="text-sm text-slate-500">Sua conta administrativa não possui acesso ao prontuário nem ao histórico clínico.</p>
        <p class="text-xs text-slate-400 font-medium mt-2 pt-2 border-t border-slate-100">Utilize os botões no cabeçalho para lançar resultados de exames laboratoriais ou monitorar e cadastrar as medições da pressão arterial do paciente.</p>
      </div>
    </div>
  {/if}
</div>

<!-- MODAL: LANÇAR PRESSÃO ARTERIAL -->
<PopupPA pacienteId={paciente.id} accessToken={data.accessToken} bind:aberto={paPopupAberto} onsaved={() => refreshHistoricoCount++} />

<!-- MODAL: HISTÓRICO DE PRESSÃO ARTERIAL -->
{#if paHistoricoAberto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
         <div>
           <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
             <Activity class="w-5 h-5 text-rose-500" /> Histórico de Pressão Arterial
           </h3>
           <p class="text-xs text-slate-500 mt-0.5">Relatório completo e evolução das medições seriadas</p>
         </div>
         
         <div class="flex items-center gap-3">
           <button 
             onclick={() => { paHistoricoAberto = false; paPopupAberto = true; }}
             class="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 shadow-md shadow-rose-600/20 active:bg-rose-800 transition-all shrink-0"
           >
             <PlusCircle class="w-4 h-4" /> Lançar Nova PA
           </button>
           
           <button onclick={() => paHistoricoAberto = false} class="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors shrink-0">
             <X class="w-5 h-5" />
           </button>
         </div>
      </div>
      <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50">
         <HistoricoPA pacienteId={paciente.id} accessToken={data.accessToken} refreshKey={refreshHistoricoCount} />
      </div>
    </div>
  </div>
{/if}

<!-- MODAL PREMIUM: CONFIRMAÇÃO DE EXCLUSÃO -->
{#if modalExclusaoAberto}
  <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
      <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
        <Trash2 class="w-6 h-6" />
      </div>
      
      <h3 class="text-lg font-bold text-slate-900 mb-2">
        Excluir Paciente Permanentemente?
      </h3>
      <p class="text-sm text-slate-500 mb-6 leading-relaxed">
        Esta ação é irreversível. Todas as consultas, prescrições de medicamentos, diagnósticos e exames cadastrados no histórico clínico de **{paciente.nome}** serão permanentemente apagados do banco de dados.
      </p>
      
      <div class="flex gap-3">
        <button 
          type="button"
          onclick={() => modalExclusaoAberto = false}
          disabled={excluindo}
          class="flex-1 py-2.5 text-center text-sm font-bold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        
        <button 
          type="button"
          onclick={executarExclusao}
          disabled={excluindo}
          class="flex-1 py-2.5 text-center text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/20 active:bg-rose-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {#if excluindo}
             <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
             Excluindo...
          {:else}
             Confirmar Exclusão
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
