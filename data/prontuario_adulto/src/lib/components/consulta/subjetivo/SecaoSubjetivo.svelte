<script lang="ts">
  import CollapsibleSection from '../CollapsibleSection.svelte';
  import Identificacao from './Identificacao.svelte';
  import QueixaPrincipal from './QueixaPrincipal.svelte';
  import HistoriaDoencaAtual from './HistoriaDoencaAtual.svelte';
  import RevisaoSistemas from './RevisaoSistemas.svelte';
  import HistoriaPatologicaPregressa from './HistoriaPatologicaPregressa.svelte';
  import HistoriaFamiliar from './HistoriaFamiliar.svelte';
  import HistoriaOcupacional from './HistoriaOcupacional.svelte';
  import HistoriaPsicossocial from './HistoriaPsicossocial.svelte';
  import HabitosVida from './HabitosVida.svelte';
  import AnamneseMultipla from './AnamneseMultipla.svelte';
  import HistoriaGinecologica from './HistoriaGinecologica.svelte';

  import { Copy, Check, Loader2 } from 'lucide-svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { formatarSubjetivoSintetizado, copiarParaTransferencia } from '$lib/utils/copyClipboard';

  interface Props {
    dados: any;
    readonly?: boolean;
    onchange?: () => void;
    accessToken: string;
    consultaId: string;
    prontuarioId?: string;
    anamneseApiPrefix?: string;
    pacienteSexo?: string;
  }

  let { 
    dados = $bindable(), 
    readonly = false, 
    onchange = () => {}, 
    accessToken, 
    consultaId,
    prontuarioId,
    anamneseApiPrefix = undefined,
    pacienteSexo = ""
  }: Props = $props();

  let copiando = $state(false);
  let copiadoSucesso = $state(false);

  async function handleCopiar() {
    copiando = true;
    try {
       const prefix = anamneseApiPrefix || `${PUBLIC_API_URL}/api/v1/anamnese/consulta`;
       const res = await fetch(`${prefix}/${consultaId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
       });
       const blocos = res.ok ? await res.json() : [];
       
       const texto = formatarSubjetivoSintetizado(dados, blocos);
       const ok = await copiarParaTransferencia(texto);
       
       if (ok) {
          copiadoSucesso = true;
          setTimeout(() => copiadoSucesso = false, 2000);
       }
    } catch (err) {
       console.error("Erro ao copiar:", err);
    } finally {
       copiando = false;
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <header class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
    <div>
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
        <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xl font-black shadow-sm">S</span>
        Subjetivo
      </h2>
      <p class="text-slate-500 mt-1 text-sm font-medium">História clínica e relatos do paciente.</p>
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

  <CollapsibleSection id="identificacao" title="Identificação">
    <Identificacao bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="queixa-principal" title="Queixa Principal">
    <QueixaPrincipal bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="hda">
    {#snippet header()}
      <div class="flex items-center justify-between w-full gap-2">
         <span class="font-semibold">História da Doença Atual / Queixas</span>
         <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold font-mono">S1</span>
            <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">E sequenciais (S2, S3...)</span>
         </div>
      </div>
    {/snippet}
    <div class="mt-1">
      <AnamneseMultipla 
         {consultaId} 
         {accessToken} 
         {readonly} 
         apiPrefix={anamneseApiPrefix}
      />
    </div>
  </CollapsibleSection>

  {#if ['F', 'FEMININO', 'feminino'].includes(pacienteSexo || '')}
    <CollapsibleSection id="historia-ginecologica" title="História Ginecológica">
      <HistoriaGinecologica bind:dados {readonly} {onchange} />
    </CollapsibleSection>
  {/if}

  <CollapsibleSection id="revisao-sistemas" title="Revisão de Sistemas">
    <RevisaoSistemas bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="hpp" title="História Patológica Pregressa (HPP)">
    <HistoriaPatologicaPregressa bind:dados {readonly} {onchange} {accessToken} {prontuarioId} />
  </CollapsibleSection>

  <CollapsibleSection id="historico-familiar" title="Histórico Familiar">
    <HistoriaFamiliar bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="historia-ocupacional" title="História Ocupacional">
    <HistoriaOcupacional bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="historia-psicossocial" title="História Psicossocial">
    <HistoriaPsicossocial bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="habitos-vida" title="Hábitos de Vida">
    <HabitosVida bind:dados {readonly} {onchange} />
  </CollapsibleSection>
  
  <div class="h-24"></div> 
</div>
