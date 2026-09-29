<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import { fade, slide } from 'svelte/transition';
  import { 
    PlusCircle, Save, Calendar, Building, Loader2, 
    X, FlaskConical, ChevronRight, Filter, Plus, Info
  } from 'lucide-svelte';

  interface Props {
    pacienteId: string;
    pacienteSexo?: string | null;
    consultaId?: string | null;
    accessToken: string;
    onsuccess?: () => void;
  }

  let { pacienteId, pacienteSexo = null, consultaId = null, accessToken, onsuccess }: Props = $props();

  let modalAberto = $state(false);
  let carregandoCatalogo = $state(false);
  let salvando = $state(false);

  // Campos de cabeçalho
  let dataColeta = $state("");
  let laboratorio = $state("");

  // Estrutura local para armazenar estado de edição do catálogo inteiro
  interface ParametroEdicao {
      id: string | null;
      nome: string;
      pacote: string;
      tipo_resultado: 'numerico' | 'qualitativo' | 'livre';
      material: string;
      unidade: string | null;
      ref_min: number | null;
      ref_max: number | null;
      ref_texto: string | null;
      significado?: string | null;
      // Estados mutáveis pelo usuário:
      valor_numerico?: string;
      valor_qualitativo?: string;
      valor_livre?: string;
      dirty?: boolean;
  }

  let itemsCatalogo = $state<ParametroEdicao[]>([]);
  let avulsos = $state<ParametroEdicao[]>([]);
  let filtroBusca = $state("");

  // Abre o modal e dispara carregamento do catálogo se vazio
  async function abrirModal() {
      modalAberto = true;
      // Define data de hoje automaticamente se vazia
      if (!dataColeta) {
         dataColeta = new Date().toISOString().split('T')[0];
      }
      if (itemsCatalogo.length === 0) {
          await carregarCatalogo();
      }
  }

  function fecharModal() {
      modalAberto = false;
  }

  async function carregarCatalogo() {
      carregandoCatalogo = true;
      try {
          const resp = await apiFetch<any>(`/api/v1/exames/catalogo?por_pagina=1000&ativo=true`, accessToken);
          itemsCatalogo = (resp.items || []).map((c: any) => {
              let finalMin = c.ref_min;
              let finalMax = c.ref_max;
              
              // Resolução dinâmica conforme sexo do paciente
              if (pacienteSexo === 'M' && (c.ref_min_m !== null || c.ref_max_m !== null)) {
                  finalMin = c.ref_min_m ?? null;
                  finalMax = c.ref_max_m ?? null;
              } else if (pacienteSexo === 'F' && (c.ref_min_f !== null || c.ref_max_f !== null)) {
                  finalMin = c.ref_min_f ?? null;
                  finalMax = c.ref_max_f ?? null;
              }
              
              return {
                  id: c.id,
                  nome: c.nome,
                  pacote: c.pacote || "Sem Pacote",
                  tipo_resultado: c.tipo_resultado,
                  material: c.material || "Sangue",
                  unidade: c.unidade,
                  ref_min: finalMin,
                  ref_max: finalMax,
                  ref_texto: c.ref_texto || "",
                  significado: c.significado,
                  valor_numerico: "",
                  valor_qualitativo: "",
                  valor_livre: "",
                  dirty: false
              };
          });
      } catch (err) {
          console.error("Falha ao carregar catálogo de exames", err);
      } finally {
          carregandoCatalogo = false;
      }
  }

  // Agrupamento Reativo por Pacote
  let pacotesAgrupados = $derived.by(() => {
      const g: Record<string, ParametroEdicao[]> = {};
      // Filtra pelo termo de busca
      const filtrados = itemsCatalogo.filter(x => 
          !filtroBusca || 
          x.nome.toLowerCase().includes(filtroBusca.toLowerCase()) ||
          x.pacote.toLowerCase().includes(filtroBusca.toLowerCase())
      );

      filtrados.forEach(item => {
          if (!g[item.pacote]) g[item.pacote] = [];
          g[item.pacote].push(item);
      });
      // Ordenar chaves
      return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  });

  // Contador de preenchidos para exibir no resumo
  let totalPreenchidos = $derived(
      itemsCatalogo.filter(i => 
          i.valor_numerico?.trim() !== "" || 
          i.valor_qualitativo?.trim() !== "" || 
          i.valor_livre?.trim() !== ""
      ).length + 
      avulsos.filter(a => a.nome.trim() !== "" && (a.valor_numerico || a.valor_qualitativo || a.valor_livre)).length
  );

  function adicionarAvulso() {
      avulsos.push({
          id: null,
          nome: "",
          pacote: "Outros / Avulsos",
          tipo_resultado: "numerico",
          material: "Sangue",
          unidade: "",
          ref_min: null,
          ref_max: null,
          ref_texto: "",
          valor_numerico: "",
          valor_qualitativo: "",
          valor_livre: "",
          dirty: true
      });
  }

  function removerAvulso(idx: number) {
      avulsos.splice(idx, 1);
  }

  async function salvarResultados() {
      if (!dataColeta) {
          alert("Por favor, informe a Data da Coleta no topo do formulário.");
          return;
      }

      // Coleta todos os catálogos preenchidos
      const preenchidosCatalogo = itemsCatalogo.filter(i => 
          i.valor_numerico?.trim() !== "" || i.valor_qualitativo?.trim() !== "" || i.valor_livre?.trim() !== ""
      );

      // Coleta avulsos válidos
      const preenchidosAvulsos = avulsos.filter(a => 
          a.nome.trim() !== "" && 
          (a.valor_numerico?.trim() !== "" || a.valor_qualitativo?.trim() !== "" || a.valor_livre?.trim() !== "")
      );

      const totalFinal = [...preenchidosCatalogo, ...preenchidosAvulsos];

      if (totalFinal.length === 0) {
          alert("Nenhum valor digitado. Preencha ao menos um parâmetro.");
          return;
      }

      salvando = true;
      try {
          const payload = {
              paciente_id: pacienteId,
              consulta_id: consultaId,
              data_coleta: dataColeta,
              laboratorio: laboratorio || undefined,
              resultados: totalFinal.map(e => ({
                  paciente_id: pacienteId,
                  catalogo_exame_id: e.id,
                  material: e.material || "Sangue",
                  nome_exame: e.nome,
                  pacote: e.pacote,
                  tipo_resultado: e.tipo_resultado,
                  valor_numerico: e.tipo_resultado === 'numerico' && e.valor_numerico?.trim() !== "" ? Number(e.valor_numerico!.replace(',', '.')) : null,
                  valor_qualitativo: e.tipo_resultado === 'qualitativo' ? e.valor_qualitativo : null,
                  valor_livre: e.tipo_resultado === 'livre' ? e.valor_livre : null,
                  unidade: e.unidade || null,
                  ref_min: e.ref_min,
                  ref_max: e.ref_max,
                  ref_texto: e.ref_texto || null,
                  data_coleta: dataColeta
              }))
          };

          await apiFetch('/api/v1/exames/resultados/pacote', accessToken, {
              method: 'POST',
              body: JSON.stringify(payload)
          });

          alert(`${totalFinal.length} resultados salvos com sucesso!`);
          
          // Reseta tudo
          itemsCatalogo.forEach(i => {
              i.valor_numerico = ""; i.valor_qualitativo = ""; i.valor_livre = "";
          });
          avulsos = [];
          fecharModal();
          
          if (onsuccess) onsuccess();
      } catch (err: any) {
          alert("Erro ao salvar os dados: " + (err.detail || err.message));
      } finally {
          salvando = false;
      }
  }
</script>

<!-- TRIGGER PRINCIPAL -->
<button 
  type="button"
  onclick={abrirModal}
  class="w-full flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 py-3 px-4 rounded-xl shadow-sm font-bold text-sm transition-all group"
>
  <PlusCircle class="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
  Lançar Resultados
</button>

<!-- MODAL OVERLAY -->
{#if modalAberto}
  <div 
    class="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
    transition:fade={{ duration: 150 }}
  >
    <!-- CORPO DO MODAL -->
    <div 
      class="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-modal="true"
    >
      
      <!-- HEADER DO MODAL -->
      <div class="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
            <FlaskConical class="w-5 h-5" />
          </div>
          <div>
             <h2 class="text-lg font-extrabold text-slate-800 tracking-tight">Folha de Lançamento Laboratorial</h2>
             <p class="text-xs text-slate-500 flex items-center gap-1">Insira múltiplos resultados de uma vez.</p>
          </div>
        </div>
        
        <button onclick={fecharModal} class="p-2 rounded-full hover:bg-white hover:shadow text-slate-400 hover:text-slate-600 transition-all">
           <X class="w-6 h-6" />
        </button>
      </div>

      <!-- PAINEL DE CONFIGURAÇÃO (DATA E LAB) -->
      <div class="bg-white border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 sticky top-0 z-10 shadow-sm">
          
          <div class="flex-1 max-w-sm space-y-1">
             <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar class="w-3 h-3 text-indigo-500" /> Data da Coleta <span class="text-red-500">*</span>
             </label>
             <input 
               type="date" 
               bind:value={dataColeta}
               class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
             />
          </div>

          <div class="flex-1 max-w-sm space-y-1">
             <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building class="w-3 h-3 text-slate-400" /> Laboratório (Opcional)
             </label>
             <input 
               type="text" 
               bind:value={laboratorio}
               placeholder="Ex: Hermes Pardini"
               class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
             />
          </div>

          <div class="flex-1 max-w-xs space-y-1 md:ml-auto">
             <label class="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Filter class="w-3 h-3" /> Filtrar Tabela
             </label>
             <input 
               type="text" 
               bind:value={filtroBusca}
               placeholder="Filtrar exame ou pacote..."
               class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all"
             />
          </div>
      </div>

      <!-- CORPO PRINCIPAL: LISTAGEM DE TABELAS -->
      <div class="flex-1 overflow-y-auto bg-slate-50/50 p-6 relative">
         
         {#if carregandoCatalogo}
            <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-slate-500">
               <Loader2 class="w-8 h-8 animate-spin text-indigo-600 mb-3" />
               <span class="font-bold text-sm">Carregando Catálogo de Referência...</span>
            </div>
         {/if}

         <div class="space-y-4">
            {#each pacotesAgrupados as [nomePacote, itens]}
               <!-- BLOCO COLAPSÁVEL POR PACOTE -->
               <details class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group open:ring-2 open:ring-indigo-100 open:border-indigo-300 transition-all">
                  <summary class="flex items-center justify-between p-4 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors font-bold text-slate-800 border-b group-open:border-slate-200 border-transparent">
                     <div class="flex items-center gap-3">
                        <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-open:bg-indigo-100 group-open:text-indigo-600 group-hover:scale-110 transition-transform">
                           <ChevronRight class="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </div>
                        <span class="text-sm sm:text-base">{nomePacote}</span>
                        <span class="bg-slate-200 group-open:bg-indigo-200 group-open:text-indigo-800 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-mono font-black transition-colors">{itens.length} itens</span>
                     </div>
                     
                     <!-- Indicador de preenchimento no pacote -->
                     {#if itens.some(i => i.valor_numerico || i.valor_qualitativo || i.valor_livre)}
                        <span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg flex items-center gap-1 font-extrabold animate-pulse">
                           <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Preenchendo
                        </span>
                     {/if}
                  </summary>

                  <div class="p-0 overflow-x-auto bg-white">
                     <table class="w-full text-left text-xs border-collapse">
                        <thead>
                           <tr class="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                              <th class="px-4 py-3 w-1/3 font-black">Parâmetro / Exame</th>
                              <th class="px-4 py-3 text-indigo-700 w-1/4 font-black bg-indigo-50/30">Resultado</th>
                              <th class="px-4 py-3 w-16 text-center">Unid.</th>
                              <th class="px-4 py-3 w-32 text-center">V. Referência</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                           {#each itens as item}
                              <tr class="hover:bg-slate-50/60 transition-colors group/row">
                                 <td class="px-4 py-2.5">
                                    <div class="flex items-center gap-1.5">
                                       <div class="font-bold text-slate-800 text-sm">{item.nome}</div>
                                       {#if item.significado}
                                          <div class="relative group/tip cursor-help shrink-0">
                                             <Info class="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                                             <div class="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block w-64 bg-slate-800 text-white text-[10px] leading-relaxed p-2.5 rounded-xl shadow-xl z-50 animate-in fade-in duration-150 normal-case font-medium">
                                                <div class="font-bold mb-1 border-b border-white/10 pb-0.5">Significado Clínico</div>
                                                {item.significado}
                                                <div class="absolute top-full left-3 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                                             </div>
                                          </div>
                                       {/if}
                                    </div>
                                    <div class="text-[10px] text-slate-400 font-medium">{item.material}</div>
                                 </td>
                                 
                                 <!-- INPUT COLUNA -->
                                 <td class="px-4 py-2 bg-indigo-50/10 group-hover/row:bg-indigo-50/30 transition-colors">
                                    {#if item.tipo_resultado === 'numerico'}
                                       <div class="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all shadow-sm">
                                          <input 
                                             type="text" 
                                             inputmode="decimal"
                                             bind:value={item.valor_numerico}
                                             placeholder="Digitando..."
                                             class="w-full px-3 py-1.5 font-bold text-indigo-800 text-sm outline-none bg-transparent text-right"
                                          />
                                       </div>
                                    {:else if item.tipo_resultado === 'qualitativo'}
                                       <input 
                                          type="text" 
                                          bind:value={item.valor_qualitativo}
                                          placeholder="Ex: Negativo, Reagente..."
                                          class="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-indigo-800 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                                       />
                                    {:else}
                                       <textarea 
                                          rows="1"
                                          bind:value={item.valor_livre}
                                          placeholder="Descrever laudo..."
                                          class="w-full border border-slate-300 rounded-lg px-3 py-1 text-xs text-indigo-800 font-medium bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none resize-y"
                                       ></textarea>
                                    {/if}
                                 </td>

                                 <td class="px-4 py-2 text-center text-slate-500 font-medium">
                                    {item.unidade || '—'}
                                 </td>

                                 <td class="px-4 py-2">
                                    <div class="flex items-center justify-center min-w-[130px]">
                                      {#if item.tipo_resultado === 'qualitativo'}
                                         <input 
                                            type="text" 
                                            bind:value={item.ref_texto}
                                            placeholder="Ref..."
                                            class="w-full border border-slate-200 rounded px-2 py-1 text-[10px] font-mono text-center outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-slate-50/50 focus:bg-white transition-colors"
                                         />
                                      {:else}
                                         <div class="flex items-center gap-1">
                                            <input 
                                               type="number" 
                                               step="any" 
                                               bind:value={item.ref_min}
                                               placeholder="Min"
                                               class="w-14 border border-slate-200 rounded px-1 py-1 text-[10px] font-mono text-center outline-none focus:ring-1 focus:ring-indigo-400 bg-slate-50/50 focus:bg-white transition-colors"
                                            />
                                            <span class="text-slate-300 text-[9px]">—</span>
                                            <input 
                                               type="number" 
                                               step="any" 
                                               bind:value={item.ref_max}
                                               placeholder="Max"
                                               class="w-14 border border-slate-200 rounded px-1 py-1 text-[10px] font-mono text-center outline-none focus:ring-1 focus:ring-indigo-400 bg-slate-50/50 focus:bg-white transition-colors"
                                            />
                                         </div>
                                      {/if}
                                    </div>
                                 </td>
                              </tr>
                           {/each}
                        </tbody>
                     </table>
                  </div>
               </details>
            {/each}

            <!-- EXAMES AVULSOS -->
            <div class="mt-8 border-t border-dashed border-slate-300 pt-6">
               <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2 font-extrabold text-slate-700 text-base">
                     <Plus class="w-5 h-5 text-indigo-600" /> Exames Avulsos / Fora do Catálogo
                  </div>
                  <button 
                    type="button" 
                    onclick={adicionarAvulso} 
                    class="bg-indigo-50 text-indigo-700 text-xs font-extrabold px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 shadow-sm transition-all"
                  >
                     + Inserir Linha Avulsa
                  </button>
               </div>

               {#if avulsos.length > 0}
                  <div class="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
                     <table class="w-full text-left text-xs border-collapse">
                        <thead class="bg-indigo-600 text-white">
                           <tr>
                              <th class="px-4 py-3">Nome do Exame</th>
                              <th class="px-4 py-3">Tipo</th>
                              <th class="px-4 py-3">Material</th>
                              <th class="px-4 py-3">Valor</th>
                              <th class="px-4 py-3">V. Ref.</th>
                              <th class="px-4 py-3 text-center">Remover</th>
                           </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                           {#each avulsos as av, i}
                              <tr class="bg-indigo-50/10">
                                 <td class="px-3 py-2">
                                    <input type="text" bind:value={av.nome} placeholder="Nome Ex: TSH..." class="w-full border rounded px-2 py-1 bg-white text-sm font-bold" />
                                 </td>
                                 <td class="px-3 py-2 w-32">
                                    <select bind:value={av.tipo_resultado} class="w-full border rounded px-2 py-1 bg-white text-xs font-medium">
                                       <option value="numerico">Numérico</option>
                                       <option value="qualitativo">Qualitativo</option>
                                       <option value="livre">Laudo Livre</option>
                                    </select>
                                 </td>
                                 <td class="px-3 py-2 w-32">
                                    <input type="text" bind:value={av.material} placeholder="Sangue..." class="w-full border rounded px-2 py-1 bg-white text-xs" />
                                 </td>
                                 <td class="px-3 py-2">
                                    {#if av.tipo_resultado === 'numerico'}
                                       <div class="flex gap-1">
                                          <input type="text" bind:value={av.valor_numerico} placeholder="Valor" class="w-full border border-indigo-300 rounded px-2 py-1 text-sm font-bold bg-white" />
                                          <input type="text" bind:value={av.unidade} placeholder="Unid" class="w-20 border rounded px-2 py-1 text-xs" />
                                       </div>
                                    {:else if av.tipo_resultado === 'qualitativo'}
                                       <input type="text" bind:value={av.valor_qualitativo} placeholder="Resultado..." class="w-full border border-indigo-300 rounded px-2 py-1 text-sm" />
                                    {:else}
                                       <input type="text" bind:value={av.valor_livre} placeholder="Resumo laudo..." class="w-full border border-indigo-300 rounded px-2 py-1 text-xs" />
                                    {/if}
                                 </td>
                                 <td class="px-3 py-2 min-w-[150px]">
                                    {#if av.tipo_resultado === 'qualitativo'}
                                       <input 
                                          type="text" 
                                          bind:value={av.ref_texto}
                                          placeholder="Ex: Negativo"
                                          class="w-full border rounded px-2 py-1 text-xs bg-white font-mono"
                                       />
                                    {:else if av.tipo_resultado === 'numerico'}
                                       <div class="flex gap-1 items-center">
                                          <input 
                                             type="number" 
                                             step="any" 
                                             bind:value={av.ref_min}
                                             placeholder="Min"
                                             class="w-full border rounded px-1 py-1 text-xs bg-white font-mono text-center"
                                          />
                                          <span class="text-slate-300 text-[9px]">—</span>
                                          <input 
                                             type="number" 
                                             step="any" 
                                             bind:value={av.ref_max}
                                             placeholder="Max"
                                             class="w-full border rounded px-1 py-1 text-xs bg-white font-mono text-center"
                                          />
                                       </div>
                                    {:else}
                                       <span class="text-slate-300 text-center block">—</span>
                                    {/if}
                                 </td>
                                 <td class="px-3 py-2 text-center">
                                    <button onclick={() => removerAvulso(i)} class="p-1.5 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                       <X class="w-4 h-4" />
                                    </button>
                                 </td>
                              </tr>
                           {/each}
                        </tbody>
                     </table>
                  </div>
               {/if}
            </div>
         </div>

         <!-- Footer padding extra so we can scroll beyond floating footer -->
         <div class="h-20"></div>
      </div>

      <!-- BARRA DE AÇÕES FIXA INFERIOR -->
      <div class="bg-white border-t border-slate-200 p-4 md:px-8 md:py-5 flex items-center justify-between shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-20">
          <div class="flex items-center gap-3">
             <div class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 font-mono font-black text-slate-600 text-lg shadow-inner">
                {totalPreenchidos}
             </div>
             <div class="text-sm">
                <div class="font-bold text-slate-800 leading-tight">Resumo da Lançamento</div>
                <div class="text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                   {totalPreenchidos} item(ns) preenchidos para salvar
                </div>
             </div>
          </div>

          <div class="flex items-center gap-3">
             <button 
               type="button" 
               onclick={fecharModal} 
               class="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 border border-transparent rounded-xl transition-colors"
               disabled={salvando}
             >
                Cancelar
             </button>
             
             <button 
               type="button"
               onclick={salvarResultados}
               disabled={salvando || totalPreenchidos === 0}
               class="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none min-w-[180px]"
             >
                {#if salvando}
                   <Loader2 class="w-5 h-5 animate-spin" /> Salvando...
                {:else}
                   <Save class="w-5 h-5" /> Gravar Resultados
                {/if}
             </button>
          </div>
      </div>

    </div>
  </div>
{/if}

<style>
  /* Estilizando scrollbars internas para ficarem densas e elegantes */
  div::-webkit-scrollbar {
      width: 8px;
  }
  div::-webkit-scrollbar-track {
      background: transparent;
  }
  div::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
  }
  div::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
  }
  /* Remove default outline for details on active */
  details summary::-webkit-details-marker {
    display: none;
  }
</style>
