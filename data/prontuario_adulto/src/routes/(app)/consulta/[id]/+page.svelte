<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import LayoutConsulta from '$lib/components/consulta/LayoutConsulta.svelte';
  import SecaoSubjetivo from '$lib/components/consulta/subjetivo/SecaoSubjetivo.svelte';
  import SecaoObjetivo from '$lib/components/consulta/objetivo/SecaoObjetivo.svelte';
  import SecaoAvaliacao from '$lib/components/consulta/avaliacao/SecaoAvaliacao.svelte';
  import SecaoPlano from '$lib/components/consulta/plano/SecaoPlano.svelte';
  import { CheckCircle2, Loader2, CloudOff, CheckCircle, Printer } from 'lucide-svelte';
  import { exportarConsultaPDF } from '$lib/utils/printConsultation';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let finalizando = $state(false);
  
  // Estado local do progresso
  let secaoAtiva = $state<'S' | 'O' | 'A' | 'P'>('S');
  let salvando = $state(false);
  let ultimoSalvo = $state<string | null>(null);
  let erroSalvar = $state(false);

  // Dados bidirecionais populados com fallback seguro
  let dadosConsulta = $state({
    dados_subjetivo: data.consulta?.dados_subjetivo || {},
    dados_objetivo: data.consulta?.dados_objetivo || {},
    dados_avaliacao: data.consulta?.dados_avaliacao || {},
    dados_plano: data.consulta?.dados_plano || {}
  });

  let completudeTotal = $state(data.consulta?.completude_pct || 0);
  const isReadonly = data.consulta?.status === 'finalizado';

  // Debouncer para salvar
  let saveTimeout: any;
  function agendarSalvar() {
    if (isReadonly) return;
    erroSalvar = false;
    salvando = true;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(salvarDados, 3000);
  }

  async function salvarDados() {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/api/v1/consultas/${data.consulta.id}/detalhes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.accessToken}`
        },
        body: JSON.stringify(dadosConsulta)
      });
      
      if (!response.ok) throw new Error("Faiou save");
      
      const updated = await response.json();
      completudeTotal = updated.completude_pct;
      ultimoSalvo = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      erroSalvar = false;
    } catch (e) {
      erroSalvar = true;
    } finally {
      salvando = false;
    }
  }

  // Simular completude parcial por seção para o Layout (baseado no cálculo global mas subdividido simplificado)
  // Idealmente o backend retornaria quebra por seção, simulamos aqui baseado no count de chaves não vazias
  let completudeParcial = $derived({
    S: Object.keys(dadosConsulta.dados_subjetivo).length > 0 ? 50 : 0,
    O: Object.keys(dadosConsulta.dados_objetivo).length > 0 ? 50 : 0,
    A: Object.keys(dadosConsulta.dados_avaliacao).length > 0 ? 50 : 0,
    P: Object.keys(dadosConsulta.dados_plano).length > 0 ? 50 : 0
  });

  function handleSecaoChange(s: 'S' | 'O' | 'A' | 'P') {
    // Salva imediatamente o que estiver no buffer antes de trocar o visual da seção
    if (!isReadonly) {
       clearTimeout(saveTimeout);
       salvarDados();
    }
    secaoAtiva = s;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  let subsectionsMap = $derived.by(() => {
    const isFeminino = ['F', 'FEMININO', 'feminino'].includes(data.consulta.paciente_sexo || '');
    
    const subS = [
      { id: 'identificacao', label: 'Identificação' },
      { id: 'queixa-principal', label: 'Queixa Principal' },
      { id: 'hda', label: 'HDA' },
    ];
    
    if (isFeminino) {
      subS.push({ id: 'historia-ginecologica', label: 'História Ginecológica' });
    }
    
    subS.push(
      { id: 'revisao-sistemas', label: 'Revisão de Sistemas' },
      { id: 'hpp', label: 'Histórico Pregresso' },
      { id: 'historico-familiar', label: 'Histórico Familiar' },
      { id: 'historia-ocupacional', label: 'História Ocupacional' },
      { id: 'historia-psicossocial', label: 'História Psicossocial' },
      { id: 'habitos-vida', label: 'Hábitos de Vida' }
    );

    return {
      S: subS,
      O: (() => {
        const list = [
          { id: 'painel-exames', label: 'Painel de Laboratório' },
          { id: 'exames-imagem', label: 'Exames de Imagem / Fun' },
          { id: 'sinais-vitais', label: 'Sinais Vitais' },
          { id: 'antropometria', label: 'Antropometria' },
          { id: 'exame-fisico-geral', label: 'Exame Físico Geral' },
        ];
        if (isFeminino) {
          list.push({ id: 'exame-ginecologico', label: 'Exame Ginecológico' });
        }
        list.push(
          { id: 'exame-neurologico', label: 'Exame Neurológico' },
          { id: 'exame-respiratorio-sup', label: 'Exame Resp. Superior' },
          { id: 'exame-respiratorio-inf', label: 'Exame Resp. Inferior' },
          { id: 'ap-cardiovascular', label: 'Exame Cardiovascular' },
          { id: 'ap-abdominal', label: 'Aparelho Digestório' },
          { id: 'ap-genitourinario', label: 'Ap. Genitourinário' },
          { id: 'osteoarticular', label: 'Osteoarticular' },
          { id: 'exame-psiquiatrico', label: 'Exame Psiquiátrico' },
          { id: 'outros-achados', label: 'Notas Gerais' }
        );
        return list;
      })(),
      A: [
        { id: 'calculadoras', label: 'Escores e Risco' },
        { id: 'raciocinio', label: 'Raciocínio Clínico' },
        { id: 'hipoteses', label: 'Hipóteses (CID)' }
      ],
      P: [
        { id: 'condutas', label: 'Condutas e Meds' },
        { id: 'solicitar-exames', label: 'Solicitar Exames' },
        { id: 'seguimento', label: 'Seguimento' }
      ]
    };
  });

  let subsections = $derived(subsectionsMap[secaoAtiva]);

</script>

<!-- Barra Superior Fixa -->
<header class="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between h-16 shadow-sm backdrop-blur-md bg-white/80">
  <div class="flex items-center gap-4">
    <a href="/pacientes/{data.consulta?.paciente_id}" class="inline-flex items-center justify-center p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Voltar ao Perfil">
      &larr; <span class="hidden md:inline ml-1.5 text-sm font-bold text-slate-700">Voltar</span>
    </a>
    <div class="flex flex-col">
      <h2 class="text-base font-semibold text-slate-800 leading-tight flex items-center gap-2">
        {data.consulta?.paciente_nome || "Paciente"}
        <span class="text-xs font-normal px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">ID: {data.consulta.id.substring(0,8)}</span>
      </h2>
      <p class="text-xs text-slate-500">Consulta em andamento • {new Date().toLocaleDateString('pt-BR')}</p>
    </div>
  </div>

  <!-- Tabs de Navegação S.O.A.P Centrais -->
  <div class="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 backdrop-blur">
    {#each [
      { id: 'S', label: 'Subjetivo', color: 'text-amber-700 bg-amber-100 border-amber-200' },
      { id: 'O', label: 'Objetivo', color: 'text-blue-700 bg-blue-100 border-blue-200' },
      { id: 'A', label: 'Avaliação', color: 'text-purple-700 bg-purple-100 border-purple-200' },
      { id: 'P', label: 'Plano', color: 'text-emerald-700 bg-emerald-100 border-emerald-200' }
    ] as tab}
      <button 
        onclick={() => handleSecaoChange(tab.id as any)}
        class="px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-200
               {secaoAtiva === tab.id 
                 ? tab.color + ' shadow-sm border' 
                 : 'text-slate-500 hover:text-slate-900 border border-transparent hover:bg-slate-200/50'}"
      >
        <span class="font-extrabold">{tab.id}</span>
        <span class="hidden xl:inline ml-1.5 font-semibold tracking-tight">{tab.label}</span>
      </button>
    {/each}
  </div>

  <div class="flex items-center gap-6">
    <!-- Mobile S.O.A.P indicator / toggle -->
    <div class="lg:hidden flex gap-1">
       {#each ['S','O','A','P'] as s}
          <button onclick={() => handleSecaoChange(s as any)} 
                  class="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs border
                         {secaoAtiva === s ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-500 border-slate-200'}">
            {s}
          </button>
       {/each}
    </div>

    <!-- Indicador de Autosave -->
    <div class="hidden md:flex items-center gap-2 text-xs text-slate-500">
      {#if salvando}
        <Loader2 class="w-3.5 h-3.5 animate-spin text-indigo-600" />
        <span>Salvando...</span>
      {:else if erroSalvar}
        <CloudOff class="w-3.5 h-3.5 text-red-500" />
      {:else if ultimoSalvo}
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
        <span>{ultimoSalvo}</span>
      {/if}
    </div>

    <!-- Barra Geral de Progresso -->
    <div class="hidden sm:flex flex-col items-end gap-1 w-24">
      <div class="flex justify-between w-full text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        <span>{completudeTotal}%</span>
      </div>
      <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          class="h-full transition-all duration-500 ease-out rounded-full {completudeTotal > 70 ? 'bg-emerald-500' : 'bg-indigo-500'}"
          style="width: {completudeTotal}%"
        ></div>
      </div>
    </div>

    <!-- Botões de Ação -->
    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={async () => {
           try {
              // Busca dados complementares em paralelo
              const [blocos, exames, examesImagem, prescricoes, pedidosLab, pedidosImagem] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/api/v1/anamnese/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : []),
                fetch(`${PUBLIC_API_URL}/api/v1/exames/resultados/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : []),
                fetch(`${PUBLIC_API_URL}/api/v1/resultados-imagem/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : []),
                fetch(`${PUBLIC_API_URL}/api/v1/prescricoes/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : []),
                fetch(`${PUBLIC_API_URL}/api/v1/pedidos/laboratorial/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : []),
                fetch(`${PUBLIC_API_URL}/api/v1/pedidos/imagem/consulta/${data.consulta.id}`, {
                   headers: { 'Authorization': `Bearer ${data.accessToken}` }
                }).then(r => r.ok ? r.json() : [])
              ]);
              
              const fullConsulta = { ...data.consulta, ...dadosConsulta };
              const dummyPaciente = {
                 nome: data.consulta.paciente_nome || "Paciente",
                 data_nasc: data.consulta.paciente_data_nasc,
                 sexo: data.consulta.paciente_sexo || "Não informado"
              };
              
              // Chamada async do utilitário adaptado com exames, prescrições e pedidos de exames
              await exportarConsultaPDF(dummyPaciente, fullConsulta, blocos, exames, examesImagem, prescricoes, pedidosLab, pedidosImagem);
           } catch(e) {
              console.error(e);
              alert("Erro ao carregar dados complementares para exportar.");
           }
        }}
        class="p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors"
        title="Exportar PDF"
      >
        <Printer class="w-5 h-5" />
      </button>

      {#if data.consulta.status === 'rascunho'}
        <form method="POST" action="?/finalizar"
              use:enhance={() => {
                finalizando = true;
                return async ({ update }) => {
                  finalizando = false;
                  await update();
                };
              }}>
          <button
            type="submit"
            disabled={finalizando}
            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {#if finalizando}
              <Loader2 class="w-3.5 h-3.5 animate-spin" />
            {:else}
              <CheckCircle class="w-3.5 h-3.5" /> <span>Finalizar</span>
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </div>
</header>

<!-- Exibição de Erro da Action Finalizar -->
{#if form?.erro}
  <div class="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
    <span class="text-red-500 text-lg font-bold">⚠</span>
    <div>
      <p class="text-sm font-medium text-red-700">Não foi possível finalizar</p>
      <p class="text-sm text-red-600 mt-1">{form.erro}</p>
    </div>
  </div>
{/if}

<LayoutConsulta 
  {secaoAtiva} 
  {subsections}
  completude={completudeParcial}
>
  <div class="transition-all duration-300">
    {#if secaoAtiva === 'S'}
      <SecaoSubjetivo 
        bind:dados={dadosConsulta.dados_subjetivo} 
        readonly={isReadonly} 
        onchange={agendarSalvar}
        accessToken={data.accessToken}
        consultaId={data.consulta.id}
        prontuarioId={data.consulta.prontuario_id}
        pacienteSexo={data.consulta.paciente_sexo}
      />
    {:else if secaoAtiva === 'O'}
      <SecaoObjetivo 
         bind:dados={dadosConsulta.dados_objetivo} 
         readonly={isReadonly} 
         onchange={agendarSalvar}
         pacienteId={data.consulta.paciente_id}
         consultaId={data.consulta.id}
         accessToken={data.accessToken}
         pacienteSexo={data.consulta.paciente_sexo}
      />
    {:else if secaoAtiva === 'A'}
      <SecaoAvaliacao 
         bind:dados={dadosConsulta.dados_avaliacao} 
         readonly={isReadonly} 
         onchange={agendarSalvar}
         accessToken={data.accessToken}
         consultaId={data.consulta.id}
         prontuarioId={data.consulta.prontuario_id}
         dadosSubjetivo={dadosConsulta.dados_subjetivo}
      />
    {:else if secaoAtiva === 'P'}
      <SecaoPlano 
         bind:dados={dadosConsulta.dados_plano} 
         readonly={isReadonly} 
         onchange={agendarSalvar} 
         accessToken={data.accessToken}
         consultaId={data.consulta.id}
         prontuarioId={data.consulta.prontuario_id}
         pacienteId={data.consulta.paciente_id}
      />
    {/if}
  </div>
</LayoutConsulta>
