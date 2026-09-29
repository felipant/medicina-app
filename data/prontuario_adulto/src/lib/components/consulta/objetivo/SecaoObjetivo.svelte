<script lang="ts">
  import CollapsibleSection from '../CollapsibleSection.svelte';
  import SinaisVitais from './SinaisVitais.svelte';
  import DadosAntropometricos from './DadosAntropometricos.svelte';
  import ExameFisicoGeral from './ExameFisicoGeral.svelte';
  import ExameNeurologico from './ExameNeurologico.svelte';
  import ExameRespiratorioSuperior from './ExameRespiratorioSuperior.svelte';
  import ExameRespiratorioInferior from './ExameRespiratorioInferior.svelte';
  import ApCardiovascular from './ApCardiovascular.svelte';
  import ApAbdominal from './ApAbdominal.svelte';
  import ApGenitourinario from './ApGenitourinario.svelte';
  import OsteoarticularEExtremidades from './OsteoarticularEExtremidades.svelte';
  import ExamePsiquiatrico from './ExamePsiquiatrico.svelte';
  import PainelExamesConsulta from './PainelExamesConsulta.svelte';
  import ExamesImagemConsulta from './ExamesImagemConsulta.svelte';
  import ExameGinecologico from './ExameGinecologico.svelte';
  import ExameDermatologico from './ExameDermatologico.svelte';

  import { Copy, Check, Loader2 } from 'lucide-svelte';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { formatarObjetivoSintetizado, copiarParaTransferencia } from '$lib/utils/copyClipboard';

  let { dados = $bindable(), readonly = false, onchange, pacienteId, consultaId, accessToken, pacienteSexo = undefined } = $props();

  let copiando = $state(false);
  let copiadoSucesso = $state(false);

  async function handleCopiar() {
    copiando = true;
    try {
        // Buscar exames em paralelo
        const [recentesData, examesImagem] = await Promise.all([
          fetch(`${PUBLIC_API_URL}/api/v1/exames/pacientes/${pacienteId}/exames/recentes`, {
             headers: { 'Authorization': `Bearer ${accessToken}` }
          }).then(r => r.ok ? r.json() : []),
          fetch(`${PUBLIC_API_URL}/api/v1/resultados-imagem/consulta/${consultaId}`, {
             headers: { 'Authorization': `Bearer ${accessToken}` }
          }).then(r => r.ok ? r.json() : [])
        ]);
        
        // Flatten the results array from each recent package
        const exames = (recentesData || []).flatMap((pkg: any) => pkg.resultados || []);
       
       const texto = formatarObjetivoSintetizado(dados, exames, examesImagem);
       const ok = await copiarParaTransferencia(texto);
       
       if (ok) {
          copiadoSucesso = true;
          setTimeout(() => copiadoSucesso = false, 2000);
       }
    } catch (err) {
       console.error("Erro ao copiar Objetivo:", err);
    } finally {
       copiando = false;
    }
  }
</script>

<div class="space-y-6 animate-in fade-in duration-300">
  <header class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-sm">
    <div>
      <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-xl text-xl font-black shadow-sm">O</span>
        Objetivo
      </h2>
      <p class="text-slate-500 mt-1 text-sm font-medium">Dados mensuráveis e exames físicos.</p>
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

  {#if pacienteId && accessToken}
    <!-- Dashboard de Laboratório (Encolhido por padrão) -->
    <CollapsibleSection id="painel-exames" title="Painel de Laboratório" initialOpen={false}>
      <PainelExamesConsulta {pacienteId} {consultaId} {accessToken} {pacienteSexo} />
    </CollapsibleSection>
    
    <!-- Dashboard de Imagem e Funcionais (Encolhido por padrão e ancorado) -->
    <CollapsibleSection id="exames-imagem" title="Exames de Imagem e Funcionais" initialOpen={false}>
      <ExamesImagemConsulta
        {pacienteId}
        {consultaId}
        {accessToken}
        {readonly}
      />
    </CollapsibleSection>
  {/if}

  <CollapsibleSection id="sinais-vitais" title="Sinais Vitais">
    <SinaisVitais bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="antropometria" title="Antropometria">
    <DadosAntropometricos bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="exame-fisico-geral" title="Exame Físico Geral" initialOpen={false}>
    <ExameFisicoGeral bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="exame-dermatologico" title="Exame Dermatológico" initialOpen={false}>
    <ExameDermatologico bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  {#if ['F', 'FEMININO', 'feminino'].includes(pacienteSexo || '')}
    <CollapsibleSection id="exame-ginecologico" title="Exame Ginecológico" initialOpen={false}>
      <ExameGinecologico bind:dados {readonly} {onchange} />
    </CollapsibleSection>
  {/if}

  <CollapsibleSection id="exame-neurologico" title="Exame Neurológico" initialOpen={false}>
    <ExameNeurologico bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="exame-respiratorio-sup" title="Exame Resp. Superior" initialOpen={false}>
    <ExameRespiratorioSuperior bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="exame-respiratorio-inf" title="Exame Resp. Inferior" initialOpen={false}>
    <ExameRespiratorioInferior bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="ap-cardiovascular" title="Exame Cardiovascular" initialOpen={false}>
    <ApCardiovascular bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="ap-abdominal" title="Aparelho Digestório" initialOpen={false}>
    <ApAbdominal bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="ap-genitourinario" title="Aparelho Genitourinário" initialOpen={false}>
    <ApGenitourinario bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="osteoarticular" title="Osteoarticular e Extremidades" initialOpen={false}>
    <OsteoarticularEExtremidades bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="exame-psiquiatrico" title="Exame Psiquiátrico" initialOpen={false}>
    <ExamePsiquiatrico bind:dados {readonly} {onchange} />
  </CollapsibleSection>

  <CollapsibleSection id="outros-achados" title="Outros Achados e Notas" initialOpen={false}>
    <div class="bg-white border border-dashed border-slate-300 rounded-xl p-6">
      <textarea 
        rows="4" 
        bind:value={dados.outros_achados} 
        oninput={onchange} 
        disabled={readonly} 
        placeholder="Genitourinário, psiquiátrico, ginecológico se necessário..." 
        class="w-full bg-transparent border-none text-sm focus:ring-0 resize-none leading-relaxed text-slate-700"
      ></textarea>
    </div>
  </CollapsibleSection>

  <div class="h-24"></div>
</div>
