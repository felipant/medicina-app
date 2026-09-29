<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import { FlaskConical, History, PlusCircle, Link2, ExternalLink, ChevronRight, AlertCircle, Loader2, Info } from 'lucide-svelte';
  import ExameFormInsercao from '../../exames/ExameFormInsercao.svelte';

  interface Props {
      pacienteId: string;
      consultaId: string;
      accessToken: string;
      pacienteSexo?: string | null;
  }

  let { pacienteId, consultaId, accessToken, pacienteSexo = null }: Props = $props();

  let loadingRecentes = $state(true);
  let recentes = $state<any[]>([]);
  let subAba = $state<'anteriores' | 'inserir'>('anteriores');
  let pacotesCatalogo = $state<any[]>([]);

  let totalAlteradosTotal = $derived(recentes.reduce((acc, curr) => acc + curr.alterados, 0));

  async function carregarRecentes() {
      loadingRecentes = true;
      try {
          const [data, pacs] = await Promise.all([
             apiFetch<any[]>(`/api/v1/exames/pacientes/${pacienteId}/exames/recentes`, accessToken),
             apiFetch<any[]>(`/api/v1/exames/catalogo/pacotes`, accessToken)
          ]);
          recentes = data;
          pacotesCatalogo = pacs;
      } catch (e) {
          console.error("Erro ao carregar dados para o painel:", e);
      } finally {
          loadingRecentes = false;
      }
  }

  async function vincularExame(id: string) {
      try {
          await apiFetch(`/api/v1/exames/resultados/${id}/vincular`, accessToken, {
              method: 'PATCH',
              body: JSON.stringify({ consulta_id: consultaId })
          });
          carregarRecentes();
      } catch (err: any) {
          alert("Erro ao vincular: " + err.message);
      }
  }

  async function vincularTodosRecentes() {
      const idsNaoVinculados: string[] = [];
      recentes.forEach(pack => {
          pack.resultados.forEach((res: any) => {
              if (res.consulta_id !== consultaId) {
                  idsNaoVinculados.push(res.id);
              }
          });
      });

      if (idsNaoVinculados.length === 0) {
          alert("Todos os exames recentes já estão vinculados.");
          return;
      }

      if (!confirm(`Deseja vincular todos os ${idsNaoVinculados.length} exames pendentes a esta consulta?`)) {
          return;
      }

      try {
          loadingRecentes = true;
          await apiFetch(`/api/v1/exames/resultados/vincular-multiplos`, accessToken, {
              method: 'POST',
              body: JSON.stringify({
                  resultado_ids: idsNaoVinculados,
                  consulta_id: consultaId
              })
          });
          await carregarRecentes();
      } catch (err: any) {
          alert("Erro ao vincular todos: " + err.message);
          loadingRecentes = false;
      }
  }

  onMount(() => {
      carregarRecentes();
  });

  function formatarDataCompacta(iso: string) {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-sm">
  <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-slate-900 select-none bg-white border-b border-slate-200">
    <span class="flex items-center gap-2"><FlaskConical class="w-4 h-4 text-indigo-500" /> Análise Laboratorial</span>
    <a href="/pacientes/{pacienteId}/exames" target="_blank" onclick={(e)=>e.stopPropagation()} class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-indigo-600 hover:text-indigo-800 transition-colors">
       Histórico <ExternalLink class="w-3 h-3" />
    </a>
  </summary>

  <nav class="flex border-b border-slate-100">
     <button 
       onclick={() => subAba = 'anteriores'}
       class="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all 
              {subAba === 'anteriores' ? 'text-indigo-600 bg-indigo-50/20 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}"
     >
       <History class="w-3.5 h-3.5" /> Resultados Recentes
     </button>
     <button 
       onclick={() => subAba = 'inserir'}
       class="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all 
              {subAba === 'inserir' ? 'text-indigo-600 bg-indigo-50/20 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}"
     >
       <PlusCircle class="w-3.5 h-3.5" /> Lançar Agora
     </button>
  </nav>

  <div class="p-4 bg-slate-50/30 min-h-[300px]">
     {#if subAba === 'anteriores'}
        {#if loadingRecentes}
           <div class="py-12 flex flex-col items-center text-slate-400 text-xs">
              <Loader2 class="w-6 h-6 animate-spin mb-2 text-indigo-400" /> Carregando últimos resultados...
           </div>
        {:else if recentes.length === 0}
           <div class="py-10 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              Nenhum resultado anterior localizado para este paciente.
           </div>
        {:else}
            <div class="space-y-3">
               <!-- Botão Bulk Link -->
               <div class="flex justify-end border-b border-slate-200 pb-2 mb-2">
                  <button 
                     onclick={vincularTodosRecentes}
                     class="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wide"
                  >
                     <Link2 class="w-3.5 h-3.5" /> Vincular Todos Recentes
                  </button>
               </div>
              {#each recentes as pack}
                 <div class="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-3 bg-slate-50/80 flex items-center justify-between">
                       <div>
                          <span class="text-xs font-bold text-slate-800 block">{pack.pacote}</span>
                          <span class="text-[10px] text-slate-500">Última: {formatarDataCompacta(pack.data_mais_recente)}</span>
                       </div>
                       {#if pack.alterados > 0}
                          <span class="bg-red-100 text-red-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                             <AlertCircle class="w-3 h-3"/> {pack.alterados} ALTERADOS
                          </span>
                       {/if}
                    </div>
                    <div class="p-2 divide-y divide-slate-50 max-h-48 overflow-y-auto">
                       {#each pack.resultados as res}
                          <div class="py-1.5 flex items-center justify-between text-[11px]">
                             <div class="min-w-0 flex-1 pr-2">
                                <div class="flex items-center gap-1">
                                    <span class="font-medium text-slate-600 truncate block">{res.nome_exame}</span>
                                    {#if res.significado}
                                       <div class="relative group/tip cursor-help shrink-0">
                                          <Info class="w-2.5 h-2.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                                          <div class="absolute bottom-full left-0 mb-1.5 hidden group-hover/tip:block w-56 bg-slate-800 text-white text-[9px] leading-snug p-2 rounded-xl shadow-xl z-50 normal-case font-medium whitespace-normal">
                                             <div class="font-bold mb-0.5 border-b border-white/10 pb-0.5">Significado Clínico</div>
                                             {res.significado}
                                             <div class="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                          </div>
                                       </div>
                                    {/if}
                                 </div>
                                <div class="flex items-center gap-2">
                                   <span class="font-bold {res.alterado ? 'text-red-600' : 'text-emerald-600'}">
                                      {res.valor_numerico ?? res.valor_qualitativo ?? 'Ver Laudo'} {res.unidade || ''}
                                   </span>
                                   {#if res.consulta_id === consultaId}
                                      <span class="text-[9px] bg-indigo-100 text-indigo-600 px-1 rounded flex items-center gap-0.5"><Link2 class="w-2 h-2"/> Vinculado</span>
                                   {/if}
                                </div>
                             </div>
                             {#if res.consulta_id !== consultaId}
                                <button 
                                   onclick={() => vincularExame(res.id)}
                                   class="flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 p-1 rounded border border-indigo-100 font-bold text-[9px] transition-all uppercase"
                                >
                                   Vincular
                                </button>
                             {/if}
                          </div>
                       {/each}
                    </div>
                 </div>
              {/each}
           </div>
        {/if}
     {:else}
        <div class="scale-95 origin-top">
           <ExameFormInsercao 
              pacienteId={pacienteId} pacienteSexo={pacienteSexo} 
              consultaId={consultaId} 
              accessToken={accessToken} 
              onsuccess={() => {
                  subAba = 'anteriores';
                  carregarRecentes();
              }} 
           />
        </div>
     {/if}
  </div>
</details>
