<script lang="ts">
  import { Plus, Trash2, Pill, Activity, Edit, X, FileEdit, ClipboardCheck, History } from 'lucide-svelte';
  import BuscaCid10 from '$lib/components/cid10/BuscaCid10.svelte';
  import DialogoMedicamento from '$lib/components/medicamentos/DialogoMedicamento.svelte';
  import { fade, slide } from 'svelte/transition';
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';

  let { dados = $bindable(), readonly = false, onchange, accessToken, prontuarioId } = $props();

  // Initialization safely
  if (!dados.hpp) {
    dados.hpp = {
      alergia: "", cirurgias: "", internacoes: "", traumatismos: "",
      doencas_estratificadas: [],
      medicamentos: []
    };
  }

  let carryoverMeds = $state<any[]>([]);

  onMount(async () => {
     if (prontuarioId && accessToken) {
        // 1. Carregar Medicamentos em Uso Prévios
        try {
           const res = await apiFetch<any>(`/api/v1/prescricoes/carryover/${prontuarioId}`, accessToken);
           carryoverMeds = res.prescricoes_anteriores || [];
           
           if (dados.hpp.medicamentos.length === 0 && carryoverMeds.length > 0 && !readonly) {
              dados.hpp.medicamentos = carryoverMeds.map(m => ({
                 id: crypto.randomUUID(),
                 principio_ativo: m.principio_ativo,
                 concentracao: m.concentracao,
                 forma_farmaceutica: m.forma_farmaceutica,
                 posologia: m.frequencia || 'Uso contínuo',
                 observacoes: m.observacoes,
                 frequenciaTipo: 'especial',
                 especial: m.frequencia || 'Uso contínuo'
              }));
              onchange();
           }
        } catch (e) {
           console.error("Erro fetch carryover meds relatados", e);
        }

        // 2. Carregar Diagnósticos Confirmados Prévios (Continuidade)
        try {
           const resDiag = await apiFetch<any>(`/api/v1/diagnosticos/carryover/${prontuarioId}`, accessToken);
           const carryoverDiags = resDiag.diagnosticos_anteriores || [];
           
           if (carryoverDiags.length > 0 && !readonly) {
              // Garante inicialização profunda segura da árvore de dados para o Svelte proxying
              if (!dados.hpp) dados.hpp = {};
              if (!dados.hpp.doencas_estratificadas) dados.hpp.doencas_estratificadas = [];
              
              const novosFiltrados: any[] = [];
              
              for (const d of carryoverDiags) {
                 const keyCid = (d.cid_subcat || "").trim().toUpperCase();
                 
                 // Evita duplicar se o CID já existir no array HPP
                 const jaExiste = dados.hpp.doencas_estratificadas.some((existente: any) => {
                    const keyExistente = (existente.subcat || "").trim().toUpperCase();
                    return keyExistente && keyCid && keyExistente === keyCid;
                 });
                 
                 if (!jaExiste && (d.cid_subcat || d.cid_descricao || d.descricao_livre)) {
                    const dataFormatada = d.criado_em ? new Date(d.criado_em).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : "";
                    novosFiltrados.push({
                       id: crypto.randomUUID(),
                       subcat: d.cid_subcat || "Livre",
                       subcat_desc: d.cid_descricao || d.descricao_livre || "Diagnóstico Prévio",
                       cat_desc: "Diagnóstico Confirmado",
                       cap_desc: "Problemas Ativos do Prontuário",
                       mesAnoDiagnostico: dataFormatada,
                       historico: "Carregado automaticamente do histórico"
                    });
                 }
              }
              
              if (novosFiltrados.length > 0) {
                 // Re-atribuição limpa de array para disparar reatividade máxima em proxies reativos
                 dados.hpp.doencas_estratificadas = [
                    ...dados.hpp.doencas_estratificadas,
                    ...novosFiltrados
                 ];
                 onchange();
              }
           }
        } catch (e) {
           console.error("Erro fetch carryover diagnósticos ativos", e);
        }
     }
  });

  // Estados de controle do Modal de Doenças Crônicas
  let exibirModalDoenca = $state(false);
  let editandoDoencaId = $state<string | null>(null);
  let selectedCid = $state<any>(null);
  let diseaseDiagnostico = $state("");
  let diseaseHistorico = $state("");

  // Derived groups for visualization
  let doencasAgrupadas = $derived.by(() => {
    const g: Record<string, any[]> = {};
    (dados.hpp.doencas_estratificadas || []).forEach((item: any) => {
      const cap = item.cap_desc || "Outras Doenças";
      if (!g[cap]) g[cap] = [];
      g[cap].push(item);
    });
    return Object.entries(g);
  });

  let medsAgrupados = $derived.by(() => {
    const g: Record<string, any[]> = {};
    (dados.hpp.medicamentos || []).forEach((item: any) => {
      const grupo = item.manual ? "Inserção Manual" : (item.classe || "Medicamentos");
      if (!g[grupo]) g[grupo] = [];
      g[grupo].push(item);
    });
    return Object.entries(g);
  });

  function abrirAddDoenca() {
    editandoDoencaId = null;
    selectedCid = null;
    diseaseDiagnostico = "";
    diseaseHistorico = "";
    exibirModalDoenca = true;
  }

  function abrirEdicaoDoenca(item: any) {
    editandoDoencaId = item.id;
    selectedCid = {
      subcat: item.subcat,
      subcat_desc: item.subcat_desc,
      cat_desc: item.cat_desc,
      cap_desc: item.cap_desc
    };
    diseaseDiagnostico = item.mesAnoDiagnostico || "";
    diseaseHistorico = item.historico || "";
    exibirModalDoenca = true;
  }

  function salvarDoenca() {
    if (!selectedCid) return;
    
    if (editandoDoencaId) {
      const idx = (dados.hpp.doencas_estratificadas || []).findIndex((d: any) => d.id === editandoDoencaId);
      if (idx !== -1) {
        dados.hpp.doencas_estratificadas[idx] = {
          ...dados.hpp.doencas_estratificadas[idx],
          subcat: selectedCid.subcat,
          subcat_desc: selectedCid.subcat_desc,
          cat_desc: selectedCid.cat_desc || dados.hpp.doencas_estratificadas[idx].cat_desc || "",
          cap_desc: selectedCid.cap_desc || dados.hpp.doencas_estratificadas[idx].cap_desc || "Outras Doenças",
          mesAnoDiagnostico: diseaseDiagnostico,
          historico: diseaseHistorico,
        };
        // Force deep reactivity trigger for arrays in Svelte 5
        dados.hpp.doencas_estratificadas = [...dados.hpp.doencas_estratificadas];
      }
    } else {
      const nova = {
        id: crypto.randomUUID(),
        subcat: selectedCid.subcat,
        subcat_desc: selectedCid.subcat_desc,
        cat_desc: selectedCid.cat_desc || "",
        cap_desc: selectedCid.cap_desc || "Outras Doenças",
        mesAnoDiagnostico: diseaseDiagnostico,
        historico: diseaseHistorico,
      };
      dados.hpp.doencas_estratificadas = [...(dados.hpp.doencas_estratificadas || []), nova];
    }
    
    // Limpar campos e fechar
    exibirModalDoenca = false;
    onchange();
  }

  function removerDoenca(id: string) {
    dados.hpp.doencas_estratificadas = (dados.hpp.doencas_estratificadas || []).filter((d: any) => d.id !== id);
    onchange();
  }

  function salvarMedicamento(finalMed: any) {
    const index = (dados.hpp.medicamentos || []).findIndex((m: any) => m.id === finalMed.id);
    if (index >= 0) {
      dados.hpp.medicamentos[index] = finalMed;
      dados.hpp.medicamentos = [...dados.hpp.medicamentos]; // Trigger reactivity
    } else {
      dados.hpp.medicamentos = [...(dados.hpp.medicamentos || []), finalMed];
    }
    onchange();
  }

  function formatarFrequencia(item: any) {
    if (!item) return "";
    if (item.frequenciaTipo === "diario" && item.diario) {
      const periods = [
        item.diario.manha ? `Manhã: ${item.diario.manha}` : "",
        item.diario.tarde ? `Tarde: ${item.diario.tarde}` : "",
        item.diario.noite ? `Noite: ${item.diario.noite}` : "",
      ].filter(Boolean);
      return periods.length ? `Diário (${periods.join(", ")})` : "Diário";
    }
    if (item.frequenciaTipo === "semanal") {
      const doseInfo = item.doseQual ? ` (${item.doseQual})` : "";
      return `Semanal: ${item.semanal}${doseInfo}`;
    }
    if (item.frequenciaTipo === "intervalo") {
      const doseInfo = item.doseQual ? ` (${item.doseQual})` : "";
      return `A cada ${item.intervalo}${doseInfo}`;
    }
    if (item.frequenciaTipo === "especial") {
      return `Especial: ${item.especial || "não informado"}`;
    }
    return item.posologia || "Não informado";
  }

  function removerMedicamento(id: string) {
    dados.hpp.medicamentos = (dados.hpp.medicamentos || []).filter((m: any) => m.id !== id);
    onchange();
  }
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-sm">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none bg-white border-b border-slate-200">
    História Patológica Pregressa
  </summary>

  <!-- Textareas Group -->
  <div class="grid gap-3 px-4 py-4 md:grid-cols-2 xl:grid-cols-4 bg-slate-50/30 border-b border-slate-100">
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Alergia e Reações Adversas</span>
      <textarea
        bind:value={dados.hpp.alergia}
        oninput={onchange}
        rows="3"
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow resize-none"
        placeholder="Penicilina, etc..."
      ></textarea>
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Cirurgias Prévias</span>
      <textarea
        bind:value={dados.hpp.cirurgias}
        oninput={onchange}
        rows="3"
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow resize-none"
        placeholder="Apendicectomia aos 12 anos..."
      ></textarea>
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Internações Prévias</span>
      <textarea
        bind:value={dados.hpp.internacoes}
        oninput={onchange}
        rows="3"
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow resize-none"
        placeholder="Pneumonia em 2019..."
      ></textarea>
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Traumatismos / Fraturas</span>
      <textarea
        bind:value={dados.hpp.traumatismos}
        oninput={onchange}
        rows="3"
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-shadow resize-none"
        placeholder="Acidente automobilístico..."
      ></textarea>
    </label>
  </div>

  <!-- Seção Doenças CID-10 (AGORA COMPACTA EM GRID 2 COLUNAS + POPUP) -->
  <div class="border-b border-slate-200 bg-white px-4 py-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity class="w-4 h-4 text-red-500" />
          Doenças Crônicas / CID-10
        </h3>
        <p class="text-xs text-slate-500">Antecedentes mórbidos estratificados formalmente.</p>
      </div>
      {#if !readonly}
        <button 
          type="button" 
          onclick={abrirAddDoenca} 
          class="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-sm"
        >
          <Plus class="w-3.5 h-3.5" /> Adicionar
        </button>
      {/if}
    </div>

    <!-- Listagem Agrupada Compacta (2 Colunas por Capítulo) -->
    {#if doencasAgrupadas.length === 0}
      <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
        Nenhuma doença registrada ainda.
      </div>
    {:else}
      <div class="space-y-4">
        {#each doencasAgrupadas as [chapter, items]}
          <section class="rounded-xl border border-slate-200 bg-slate-50/50 p-3 shadow-sm">
            <div class="mb-2.5 flex items-center justify-between">
              <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-wider">{chapter}</h4>
              <span class="rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-600 font-mono">{items.length}</span>
            </div>
            
            <!-- GRID COM 2 COLUNAS PARA COMPACTAÇÃO -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {#each items as item}
                <div class="flex justify-between items-start bg-white rounded-xl border border-slate-200 p-3 shadow-sm group hover:border-red-200 hover:shadow-md transition-all relative">
                  <div class="min-w-0 flex-1 pr-4">
                    <!-- Categoria & Subcategoria -->
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                      <span class="font-mono font-black bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                        {item.subcat}
                      </span>
                      {#if item.cat_desc}
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate" title={item.cat_desc}>
                          {item.cat_desc}
                        </span>
                      {/if}
                    </div>
                    
                    <p class="text-xs font-extrabold text-slate-800 leading-snug truncate" title={item.subcat_desc}>
                      {item.subcat_desc}
                    </p>
                    
                    <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                      {#if item.mesAnoDiagnostico}
                         <span class="font-bold bg-slate-100 px-1.5 py-0.5 rounded shrink-0 text-slate-600">Diag: {item.mesAnoDiagnostico}</span>
                      {/if}
                      {#if item.historico}
                         <span class="truncate italic text-slate-400 flex-1">"{item.historico}"</span>
                      {/if}
                    </div>
                  </div>

                  <!-- Botões de Ação Contextuais -->
                  <div class="flex gap-1 shrink-0">
                    {#if !readonly}
                      <button 
                        type="button" 
                        onclick={() => abrirEdicaoDoenca(item)} 
                        class="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
                        title="Editar doença"
                      >
                        <Edit class="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onclick={() => removerDoenca(item.id)} 
                        class="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Seção Medicamentos (AGORA COMPACTA EM GRID DE 3 COLUNAS) -->
  <div class="bg-slate-50/20 px-4 py-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Pill class="w-4 h-4 text-indigo-500" />
          Medicações em Uso
        </h3>
        <p class="text-xs text-slate-500">Drogas farmacológicas continuas auto-referidas.</p>
      </div>
      {#if !readonly}
         <DialogoMedicamento 
           {accessToken} 
           onsave={salvarMedicamento} 
           triggerClass="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-sm"
         />
      {/if}
    </div>

    {#if medsAgrupados.length === 0}
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-400">
        Nenhuma medicação em uso listada.
      </div>
    {:else}
      <div class="space-y-4">
        {#each medsAgrupados as [grupo, items]}
          <div class="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <h4 class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 border-b border-slate-50 pb-1">{grupo}</h4>
            
            <!-- GRID COM 2 COLUNAS PARA MEDICAMENTOS -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {#each items as med}
                <div class="flex items-center justify-between bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-100 p-3 hover:border-blue-200 hover:shadow-sm transition-all group relative">
                  <div class="flex-1 pr-3 min-w-0">
                    <p class="text-xs font-black text-slate-800 truncate" title={med.principio_ativo}>
                      {med.principio_ativo} {med.concentracao || ''}
                    </p>
                    {#if med.forma_farmaceutica}
                       <p class="text-[9px] text-slate-400 uppercase tracking-wide mt-0.5 font-bold">{med.forma_farmaceutica}</p>
                    {/if}
                    
                    <p class="text-[10px] text-indigo-600 font-bold mt-1 flex items-center gap-1 truncate">
                       <ClipboardCheck class="w-3 h-3 shrink-0" /> {formatarFrequencia(med)}
                    </p>
                    
                    {#if med.observacoes}
                       <p class="text-[9px] text-slate-500 italic mt-1 truncate">"{med.observacoes}"</p>
                    {/if}
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                     {#if !readonly}
                       <DialogoMedicamento 
                          {accessToken} 
                          onsave={salvarMedicamento} 
                          initialItem={med}
                          triggerClass="p-1.5 rounded-md hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                       />
                       <button 
                         type="button" 
                         onclick={() => removerMedicamento(med.id)} 
                         class="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                       >
                         <Trash2 class="w-3.5 h-3.5" />
                       </button>
                     {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</details>


<!-- POPUP MODAL DE CADASTRO / EDIÇÃO DE DOENÇAS CRÔNICAS -->
{#if exibirModalDoenca}
  <div 
    class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    onclick={(e) => { if (e.target === e.currentTarget) exibirModalDoenca = false; }}
    onkeydown={(e) => { if (e.key === 'Escape') exibirModalDoenca = false; }}
  >
    <div 
      transition:slide={{ duration: 250 }}
      class="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col min-h-[60vh] max-h-[90vh] overflow-hidden border border-slate-100"
    >
      <!-- Header Modal -->
      <div class="bg-red-50/50 px-6 py-4 border-b border-red-100 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-red-100 text-red-600 rounded-xl shadow-sm">
            <Activity class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              {editandoDoencaId ? 'Editar Doença Crônica' : 'Vincular Doença Crônica'}
            </h4>
            <p class="text-xs text-slate-500">Vincule e qualifique uma enfermidade pelo CID-10.</p>
          </div>
        </div>
        <button 
          type="button" 
          onclick={() => exibirModalDoenca = false} 
          class="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Corpo do Modal -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
        
        <!-- Busca/Seleção CID-10 -->
        <div class="space-y-1.5">
          <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Pesquisar Código / Descrição CID-10</label>
          <BuscaCid10 
            {accessToken} 
            bind:selecionado={selectedCid} 
            placeholder="Digite código ou termo da doença..."
          />
        </div>

        {#if selectedCid}
          <div transition:slide={{ duration: 200 }} class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 animate-in zoom-in-95">
            <span class="text-[9px] font-extrabold text-red-600 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded border border-red-100">CID Selecionado</span>
            <div class="flex gap-2 items-start">
              <span class="font-mono font-black bg-slate-200 text-slate-800 rounded px-1.5 py-0.5 text-xs shrink-0">{selectedCid.subcat}</span>
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-900 leading-tight">{selectedCid.subcat_desc}</p>
                {#if selectedCid.cat_desc}
                  <p class="text-[10px] text-slate-500 mt-0.5 italic">{selectedCid.cat_desc}</p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Dados Adicionais -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Mês/Ano Diagnóstico</label>
              <input 
                type="text" 
                placeholder="Ex: Jan/2018 ou 2020" 
                bind:value={diseaseDiagnostico} 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Qualificação / Histórico</label>
              <input 
                type="text" 
                placeholder="Ex: Em tratamento com anti-hipertensivo" 
                bind:value={diseaseHistorico} 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer do Modal -->
      <div class="bg-slate-50 border-t border-slate-150 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
        <button 
          type="button"
          onclick={() => exibirModalDoenca = false}
          class="text-slate-500 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          Cancelar
        </button>
        <button 
          type="button"
          onclick={salvarDoenca}
          disabled={!selectedCid}
          class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ClipboardCheck class="w-4 h-4" />
          {editandoDoencaId ? 'Atualizar Registro' : 'Confirmar Vínculo'}
        </button>
      </div>

    </div>
  </div>
{/if}
