<script lang="ts">
  import { onMount } from 'svelte';
  import { Loader2, History, CalendarDays, Info, Sparkles } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import CollapsibleSection from '../CollapsibleSection.svelte';
  import CalculadorasClinicas from './CalculadorasClinicas.svelte';
  import HipotesesDiagnosticas from './HipotesesDiagnosticas.svelte';

  import { Copy, Check } from 'lucide-svelte';
  import { formatarAvaliacaoSintetizado, copiarParaTransferencia } from '$lib/utils/copyClipboard';

  interface Props {
    dados: any;
    readonly?: boolean;
    onchange?: () => void;
    accessToken?: string;
    consultaId?: string;
    prontuarioId?: string;
    dadosSubjetivo?: any;
  }

  let { 
    dados = $bindable(), 
    readonly = false, 
    onchange, 
    accessToken = undefined, 
    consultaId = undefined, 
    prontuarioId = undefined,
    dadosSubjetivo = {} 
  }: Props = $props();

  // Garantir inicialização da estrutura de análise por queixa
  if (!dados.analise_por_queixa) {
    dados.analise_por_queixa = {};
  }

  let blocos = $state<any[]>([]);
  let carregando = $state(true);
  let activeBlockId = $state<string | null>(null);

  let copiando = $state(false);
  let copiadoSucesso = $state(false);

  async function handleCopiar() {
    copiando = true;
    try {
       const texto = formatarAvaliacaoSintetizado(dados, blocos);
       const ok = await copiarParaTransferencia(texto);
       
       if (ok) {
          copiadoSucesso = true;
          setTimeout(() => copiadoSucesso = false, 2000);
       }
    } catch (err) {
       console.error("Erro ao copiar Avaliação:", err);
    } finally {
       copiando = false;
    }
  }

  onMount(async () => {
    if (!accessToken || !consultaId) {
      carregando = false;
      return;
    }
    
    try {
      carregando = true;
      const res = await apiFetch<any[]>(`/api/v1/anamnese/consulta/${consultaId}`, accessToken);
      blocos = res;
      
      // Auto-seleciona a primeira se existir
      if (blocos.length > 0) {
        activeBlockId = blocos[0].id;
      }
    } catch (e) {
      console.error("Erro ao carregar blocos na avaliação", e);
    } finally {
      carregando = false;
    }
  });

  let activeBlock = $derived(blocos.find(b => b.id === activeBlockId) || null);
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <header class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
    <div>
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
        <span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-xl text-xl font-black shadow-sm">A</span>
        Avaliação
      </h2>
      <p class="text-slate-500 mt-1 text-sm font-medium">Raciocínio clínico, escores de risco e diagnósticos.</p>
    </div>
    
    <button
       type="button"
       disabled={copiando}
       onclick={handleCopiar}
       class="px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0
              {copiadoSucesso 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 shadow-sm'}"
    >
       {#if copiando}
          <Loader2 class="w-3.5 h-3.5 animate-spin" /> Copiando...
       {:else if copiadoSucesso}
          <Check class="w-3.5 h-3.5" /> Copiado!
       {:else}
          <Copy class="w-3.5 h-3.5" /> Copiar Sintetizado
       {/if}
    </button>
  </header>

  <CollapsibleSection id="calculadoras" title="Escores de Risco / Calculadoras" initialOpen={false}>
    <CalculadorasClinicas {readonly} />
  </CollapsibleSection>

  <!-- SEÇÃO DE ANÁLISE ESTRATIFICADA -->
  <CollapsibleSection id="raciocinio" title="Análise Clínica por Queixa">
    {#if carregando}
      <div class="flex items-center justify-center py-12 text-slate-400 gap-2">
        <Loader2 class="w-5 h-5 animate-spin" />
        <span class="text-sm font-medium">Carregando queixas da anamnese...</span>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Lado Esquerdo: Lista de Inputs das Análises -->
        <div class="lg:col-span-7 space-y-5">
          {#if blocos.length > 0}
            {#each blocos as bloco, i}
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-extrabold text-purple-800 uppercase tracking-wider flex items-center gap-2">
                     <span class="bg-purple-100 px-1.5 py-0.5 rounded font-mono">S{i+1}</span>
                     {bloco.titulo || 'Queixa Principal'}
                  </label>
                </div>
                
                <textarea 
                  rows="3" 
                  placeholder="Descreva suas conclusões diagnósticas e raciocínio para {bloco.titulo || 'esta demanda'}..." 
                  bind:value={dados.analise_por_queixa[bloco.id]} 
                  oninput={onchange}
                  onfocus={() => activeBlockId = bloco.id}
                  disabled={readonly} 
                  class="w-full border-slate-250 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all p-4 leading-relaxed bg-slate-50/30 {activeBlockId === bloco.id ? 'border-purple-400 ring-2 ring-purple-100' : ''}"
                ></textarea>
              </div>
            {/each}
          {:else}
             <!-- Fallback se não houver queixas salvas -->
             <div class="space-y-2">
                <label class="text-xs font-extrabold text-purple-800 uppercase tracking-wider block">Análise Geral / Raciocínio Clínico</label>
                <textarea 
                  rows="6" 
                  placeholder="Descreva a justificativa do raciocínio clínico e diagnósticos diferenciais..." 
                  bind:value={dados.analise_clinica} 
                  oninput={onchange} 
                  disabled={readonly} 
                  class="w-full border-slate-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500/20 transition-shadow p-4 leading-relaxed bg-white"
                ></textarea>
             </div>
          {/if}

          {#if blocos.length > 0}
            <div class="border-t border-slate-200 border-dashed pt-5 mt-2">
              <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles class="w-3.5 h-3.5 text-amber-600" /> 
                Síntese Global / Notas Adicionais
              </label>
              <textarea 
                rows="3" 
                placeholder="Conclusões adicionais, correlações sindrômicas e outras sínteses clínicas..." 
                bind:value={dados.analise_clinica} 
                oninput={onchange} 
                disabled={readonly} 
                class="w-full border-slate-200 border-dashed rounded-xl text-sm focus:ring-2 focus:ring-purple-500/10 transition-shadow p-3 leading-relaxed bg-slate-50/10"
              ></textarea>
            </div>
          {/if}
        </div>

        <!-- Lado Direito: Painel Flutuante da Anamnese Selecionada -->
        <div class="lg:col-span-5 lg:sticky lg:top-20">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all border-t-4 border-t-amber-500">
            {#if activeBlock}
              <div class="bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <span class="flex items-center justify-center w-6 h-6 bg-amber-500 text-slate-950 rounded font-mono font-black text-xs shadow-xs shrink-0">S</span>
                  <div class="min-w-0">
                    <h4 class="text-xs font-black tracking-wider uppercase truncate">{activeBlock.titulo || 'Sem Título'}</h4>
                    {#if activeBlock.cid_subcat}
                       <p class="text-[10px] text-amber-300 font-bold font-mono truncate mt-0.5 bg-amber-950/40 px-1.5 py-0.5 rounded inline-block">{activeBlock.cid_subcat} - {activeBlock.cid_descricao}</p>
                    {/if}
                  </div>
                </div>
              </div>
              
              <div class="p-4 space-y-4 bg-slate-50/50 text-xs leading-relaxed animate-in slide-in-from-right-2">
                <div class="space-y-1.5">
                  <span class="font-black text-slate-500 tracking-wider uppercase text-[9px] flex items-center gap-1">
                    <History class="w-3 h-3 text-slate-400" /> Histórico da Condição (Anamnese)
                  </span>
                  <div class="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap italic font-medium leading-normal text-[11px]">
                    {activeBlock.historico_texto || 'Campo não preenchido na anamnese.'}
                  </div>
                </div>

                <div class="space-y-1.5">
                  <span class="font-black text-slate-500 tracking-wider uppercase text-[9px] flex items-center gap-1">
                    <CalendarDays class="w-3 h-3 text-slate-400" /> Queixa Atual e Evolução
                  </span>
                  <div class="p-3.5 bg-amber-50/40 border border-amber-100/80 text-slate-700 rounded-xl whitespace-pre-wrap italic font-medium leading-normal text-[11px]">
                    {activeBlock.queixa_atual_texto || 'Campo não preenchido na anamnese.'}
                  </div>
                </div>
              </div>
            {:else}
              <div class="p-8 text-center space-y-2.5 text-slate-400 bg-slate-50/30">
                <div class="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300"><Info class="w-5 h-5" /></div>
                <p class="text-[11px] font-black uppercase tracking-widest">Monitor de Anamnese</p>
                <p class="text-[11px] max-w-xs mx-auto leading-relaxed">Clique em uma das caixas de queixa à esquerda para visualizar instantaneamente o histórico dela aqui enquanto constrói sua hipótese.</p>
              </div>
            {/if}
          </div>
        </div>

      </div>
    {/if}
  </CollapsibleSection>

  <CollapsibleSection id="hipoteses" title="Hipóteses Diagnósticas (CID)">
    <HipotesesDiagnosticas bind:dados {readonly} {onchange} {dadosSubjetivo} {blocos} {prontuarioId} />
  </CollapsibleSection>

  <div class="h-24"></div>
</div>
