<script lang="ts">
  import CollapsibleSection from '../CollapsibleSection.svelte';
  import Condutas from './Condutas.svelte';
  import PedidosExames from './PedidosExames.svelte';
  import Encaminhamentos from './Encaminhamentos.svelte';
  import Seguimento from './Seguimento.svelte';

  import { Copy, Check } from 'lucide-svelte';
  import { formatarPlanoSintetizado, copiarParaTransferencia } from '$lib/utils/copyClipboard';
  import PainelInteracoes from './PainelInteracoes.svelte';
  import PainelGuidelines from './PainelGuidelines.svelte';
  import { apiFetch } from '$lib/api';

  let { dados = $bindable(), readonly = false, onchange, accessToken, consultaId, prontuarioId, pacienteId, diagnosticos = [] } = $props();

  let copiadoSucesso = $state(false);

  let painelInteracoesAberto = $state(false)
  let painelGuidelinesAberto = $state(false)

  let temInteracaoGrave    = $state(false)
  let temInteracaoModerada = $state(false)
  let jaVerificou          = $state(false)

  // Prescrições ativas da consulta para contexto do Groq
  let prescricoesAtivas = $state<any[]>([])
  let sinaisVitaisAtuais = $state<Record<string, string>>({})

  // Texto inserido pela síntese Groq
  let condutaTextoAdicional = $state('')

  // Carregar prescrições ao montar
  $effect(() => {
    if (consultaId && accessToken) {
      apiFetch<any[]>(`/api/v1/prescricoes/consulta/${consultaId}`, accessToken)
        .then(r => prescricoesAtivas = r ?? [])
        .catch(() => prescricoesAtivas = [])
    }
  })

  async function abrirInteracoes() {
    painelGuidelinesAberto = false
    painelInteracoesAberto = true
  }

  function abrirGuidelines() {
    painelInteracoesAberto = false
    painelGuidelinesAberto = true
  }

  function onResultadoInteracoes(resultado: any) {
    temInteracaoGrave    = resultado.tem_interacao_grave
    temInteracaoModerada = resultado.tem_interacao_moderada
    jaVerificou          = true
  }

  function onInserirConduta(texto: string) {
    condutaTextoAdicional = texto
    painelGuidelinesAberto = false
  }

  async function handleCopiar() {
    const texto = formatarPlanoSintetizado(dados);
    const ok = await copiarParaTransferencia(texto);
    if (ok) {
       copiadoSucesso = true;
       setTimeout(() => copiadoSucesso = false, 2000);
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <header class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-sm sticky top-0 z-20">
    <div>
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
        <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xl font-black shadow-sm">P</span>
        Plano
      </h2>
      <p class="text-slate-500 mt-1 text-sm font-medium">Condutas, prescrição, solicitações e seguimento.</p>
    </div>
    
    <div class="flex flex-wrap items-center gap-2">
      <button
        onclick={abrirInteracoes}
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 border
               {temInteracaoGrave
                 ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                 : temInteracaoModerada
                   ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                   : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200 shadow-sm'}"
        title="Verificar interações medicamentosas"
      >
        <span>💊</span>
        <span>Interações</span>
        {#if jaVerificou}
          {#if temInteracaoGrave}
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          {:else if temInteracaoModerada}
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
          {/if}
        {/if}
      </button>

      <button
        onclick={abrirGuidelines}
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 border bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border-slate-200 hover:border-indigo-200 shadow-sm"
        title="Consultar guidelines clínicos"
      >
        <span>📋</span>
        <span>Guidelines</span>
      </button>

      <button
         type="button"
         onclick={handleCopiar}
         class="px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0
                {copiadoSucesso 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 shadow-sm'}"
      >
         {#if copiadoSucesso}
            <Check class="w-3.5 h-3.5" /> Copiado!
         {:else}
            <Copy class="w-3.5 h-3.5" /> Copiar Sintetizado
         {/if}
      </button>
    </div>
  </header>

  <CollapsibleSection id="condutas" title="Condutas, Orientações e Medicamentos">
    <Condutas bind:dados {readonly} {onchange} {accessToken} {consultaId} {prontuarioId} {pacienteId} bind:textoInserido={condutaTextoAdicional} />
  </CollapsibleSection>

  <CollapsibleSection id="solicitar-exames" title="Solicitação de Exames e Procedimentos">
    <PedidosExames {readonly} {accessToken} {consultaId} {prontuarioId} {pacienteId} />
  </CollapsibleSection>

  <CollapsibleSection id="encaminhamentos" title="Encaminhamentos">
    <Encaminhamentos {readonly} {accessToken} {consultaId} {prontuarioId} {pacienteId} />
  </CollapsibleSection>

  <CollapsibleSection id="seguimento" title="Plano de Seguimento e Retorno">
    <Seguimento bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <div class="h-24"></div>

  <PainelInteracoes
    bind:aberto={painelInteracoesAberto}
    {consultaId}
    {accessToken}
    onResultado={onResultadoInteracoes}
  />

  <PainelGuidelines
    bind:aberto={painelGuidelinesAberto}
    {accessToken}
    {diagnosticos}
    {consultaId}
    prescricoes={prescricoesAtivas}
    sinaisVitais={sinaisVitaisAtuais}
    {onInserirConduta}
  />
</div>
