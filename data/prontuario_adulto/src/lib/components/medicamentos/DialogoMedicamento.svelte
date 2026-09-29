<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { X, Search, Plus, Check, Pill, Loader2 } from 'lucide-svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    accessToken: string;
    onsave: (finalMed: any) => void;
    initialItem?: any | null;
    triggerClass?: string;
    children?: import('svelte').Snippet;
  }

  let { accessToken, onsave, initialItem = null, triggerClass = '' }: Props = $props();

  let modalAberto = $state(false);
  let searching = $state(false);
  let searchResults = $state<any[]>([]);
  let searchTimer: ReturnType<typeof setTimeout>;
  let manualMode = $state(false);

  // Form State
  let formData = $state({
      sourceId: null as string | null,
      principio_ativo: "",
      concentracao: "",
      classe: "",
      forma_farmaceutica: "",
      fornecimento_sus: "",
      observacoes: "",
      frequenciaTipo: "diario", // diario, semanal, intervalo, especial
      diario: { manha: "", tarde: "", noite: "" },
      semanal: "Segunda a sexta",
      intervalo: "12h",
      especial: "",
      doseQual: "",
      duracao_tipo: "continuo", // continuo, dias, semanas, meses, livre
      duracao_valor: 1,
      duracao_texto: "",
      query: ""
  });

  function resetForm() {
      formData = {
          sourceId: null,
          principio_ativo: "",
          concentracao: "",
          classe: "",
          forma_farmaceutica: "",
          fornecimento_sus: "",
          observacoes: "",
          frequenciaTipo: "diario",
          diario: { manha: "", tarde: "", noite: "" },
          semanal: "Segunda a sexta",
          intervalo: "12h",
          especial: "",
          doseQual: "",
          duracao_tipo: "continuo",
          duracao_valor: 1,
          duracao_texto: "",
          query: ""
      };
      searchResults = [];
      manualMode = false;
  }

  function loadItem(item: any) {
      formData = {
          sourceId: item.sourceId || null,
          principio_ativo: item.principio_ativo || "",
          concentracao: item.concentracao || "",
          classe: item.classe || "",
          forma_farmaceutica: item.forma_farmaceutica || "",
          fornecimento_sus: item.fornecimento_sus || "",
          observacoes: item.observacoes || "",
          frequenciaTipo: item.frequenciaTipo || "diario",
          diario: item.diario ? { ...item.diario } : { manha: "", tarde: "", noite: "" },
          semanal: item.semanal || "Segunda a sexta",
          intervalo: item.intervalo || "12h",
          especial: item.especial || "",
          doseQual: item.doseQual || "",
          duracao_tipo: item.duracao_tipo || "continuo",
          duracao_valor: item.duracao_valor != null ? item.duracao_valor : 1,
          duracao_texto: item.duracao_texto || "",
          query: item.principio_ativo || ""
      };
      manualMode = !item.sourceId;
  }

  function abrir() {
      if (initialItem) {
          loadItem(initialItem);
      } else {
          resetForm();
      }
      modalAberto = true;
  }

  function fechar() {
      modalAberto = false;
  }

  function handleSearch() {
      clearTimeout(searchTimer);
      if (!formData.query.trim()) {
          searchResults = [];
          return;
      }
      searching = true;
      searchTimer = setTimeout(async () => {
          try {
              const data = await apiFetch<any[]>(`/api/v1/medicamentos/busca?q=${encodeURIComponent(formData.query.trim())}`, accessToken);
              searchResults = data || [];
          } catch (err) {
              searchResults = [];
          } finally {
              searching = false;
          }
      }, 350);
  }

  function selectSuggestion(item: any) {
      manualMode = false;
      formData.sourceId = item.id;
      formData.principio_ativo = item.principio_ativo || "";
      formData.concentracao = item.concentracao || "";
      formData.forma_farmaceutica = item.forma_farmaceutica || "";
      formData.fornecimento_sus = item.fornecimento_sus || "";
      formData.classe = item.classe || "";
      formData.query = item.principio_ativo;
      searchResults = [];
  }

  function startManual() {
      manualMode = true;
      searchResults = [];
      formData.sourceId = null;
  }

  function save() {
      if (!formData.principio_ativo.trim()) {
          alert("O Princípio Ativo é obrigatório.");
          return;
      }
      
      // Cria objeto para persistência seguindo rigorosamente o payload esperado
      const finalItem = {
          id: initialItem?.id || crypto.randomUUID(),
          sourceId: formData.sourceId,
          principio_ativo: formData.principio_ativo.trim(),
          concentracao: formData.concentracao.trim(),
          classe: formData.classe.trim(),
          forma_farmaceutica: formData.forma_farmaceutica.trim(),
          fornecimento_sus: formData.fornecimento_sus.trim(),
          observacoes: formData.observacoes.trim(),
          frequenciaTipo: formData.frequenciaTipo,
          diario: formData.frequenciaTipo === 'diario' ? { ...formData.diario } : null,
          semanal: formData.semanal,
          intervalo: formData.intervalo,
          especial: formData.especial.trim(),
          doseQual: formData.doseQual.trim(),
          duracao_tipo: formData.duracao_tipo,
          duracao_valor: formData.duracao_tipo !== 'continuo' && formData.duracao_tipo !== 'livre' ? Number(formData.duracao_valor) : null,
          duracao_texto: formData.duracao_tipo === 'livre' ? formData.duracao_texto.trim() : null,
          manual: manualMode
      };

      onsave(finalItem);
      fechar();
  }

</script>

<!-- Trigger slot dynamically rendered -->
<button type="button" onclick={abrir} class={triggerClass}>
  {@render children()}
</button>

{#snippet children()}
  {#if initialItem}
     Editar
  {:else}
     <Plus class="w-4 h-4" /> Adicionar Medicamento
  {/if}
{/snippet}

{#if modalAberto}
  <!-- Modal Container -->
  <div 
    class="fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    transition:fade={{ duration: 150 }}
  >
    <div 
      class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-slate-100">
         <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
               <Pill class="w-5 h-5" />
            </div>
            <div>
               <h2 class="text-lg font-extrabold text-slate-900 tracking-tight">
                  {initialItem ? "Editar Medicamento" : "Adicionar Medicamento em Uso"}
               </h2>
               <p class="text-xs text-slate-500">Documente detalhadamente a terapêutica atual.</p>
            </div>
         </div>
         <button onclick={fechar} class="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
            <X class="w-6 h-6" />
         </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/20">
         
         <!-- Coluna Esquerda: Pesquisa e Identidade -->
         <div class="space-y-5">
            
            <div class="space-y-2">
               <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Search class="w-3 h-3" /> Pesquisar na Base
               </label>
               <div class="relative">
                  <input 
                     type="text"
                     bind:value={formData.query}
                     oninput={handleSearch}
                     placeholder="Ex: Losartana, Sinvastatina..."
                     class="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                  {#if searching}
                     <div class="absolute right-3 top-3 text-indigo-500">
                        <Loader2 class="w-5 h-5 animate-spin" />
                     </div>
                  {/if}
               </div>

               <button 
                 type="button" 
                 onclick={startManual}
                 class="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide flex items-center gap-1 px-1"
               >
                  <Plus class="w-3 h-3" /> Não encontrou? Digitar manualmente
               </button>

               <!-- Resultados da Busca Flutuantes/Inline -->
               {#if searchResults.length > 0}
                  <div class="bg-white border border-slate-200 rounded-2xl shadow-lg max-h-48 overflow-y-auto mt-2 divide-y divide-slate-50 animate-in slide-in-from-top-2">
                     {#each searchResults as item}
                        <button 
                          type="button" 
                          onclick={() => selectSuggestion(item)}
                          class="w-full text-left p-3 hover:bg-indigo-50 transition-colors group"
                        >
                           <div class="font-bold text-sm text-slate-800 group-hover:text-indigo-800">
                              {item.principio_ativo} <span class="font-medium text-slate-500 text-xs">{item.concentracao || ''}</span>
                           </div>
                           <div class="text-xs text-slate-400 flex items-center gap-2">
                              {item.forma_farmaceutica || 'Forma não inf.'}
                              {#if item.fornecimento_sus}
                                 <span class="text-[9px] px-1 rounded bg-emerald-100 text-emerald-700 font-bold">{item.fornecimento_sus}</span>
                              {/if}
                           </div>
                        </button>
                     {/each}
                  </div>
               {/if}
            </div>

            <hr class="border-slate-200/60" />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div class="col-span-2 space-y-1">
                  <label class="text-xs font-semibold text-slate-600">Princípio Ativo</label>
                  <input 
                    type="text" 
                    bind:value={formData.principio_ativo} 
                    readonly={!manualMode && !!formData.sourceId}
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-all {!manualMode && !!formData.sourceId ? 'opacity-70 select-none' : 'focus:bg-white focus:ring-2 focus:ring-indigo-500/20'}" 
                  />
               </div>
               <div class="space-y-1">
                  <label class="text-xs font-semibold text-slate-600">Concentração</label>
                  <input type="text" bind:value={formData.concentracao} readonly={!manualMode && !!formData.sourceId} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
               </div>
               <div class="space-y-1">
                  <label class="text-xs font-semibold text-slate-600">Forma</label>
                  <input type="text" bind:value={formData.forma_farmaceutica} readonly={!manualMode && !!formData.sourceId} class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none" />
               </div>
               <div class="col-span-2 space-y-1">
                  <label class="text-xs font-semibold text-slate-600">Classe Farmacológica</label>
                  <input type="text" bind:value={formData.classe} class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
               </div>
            </div>

         </div>

         <!-- Coluna Direita: Posologia Complexa -->
         <div class="space-y-5">
            
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
               <div class="flex items-center justify-between">
                  <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                     <div class="w-1.5 h-4 bg-amber-400 rounded-full"></div>
                     Posologia / Modo de Uso
                  </h3>
               </div>

               <!-- TABS de Frequência -->
               <div class="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-xl">
                  {#each [{id:'diario', label:'Diário'}, {id:'semanal', label:'Semanal'}, {id:'intervalo', label:'Intervalo'}, {id:'especial', label:'Especial'}] as tab}
                     <button 
                       type="button"
                       onclick={() => formData.frequenciaTipo = tab.id}
                       class="flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all
                              {formData.frequenciaTipo === tab.id ? 'bg-white shadow-sm text-indigo-700 border border-slate-100' : 'text-slate-500 hover:text-slate-800'}"
                     >
                        {tab.label}
                     </button>
                  {/each}
               </div>

               <!-- CONTEÚDO DINÂMICO DAS TABS -->
               <div class="pt-2 animate-in slide-in-from-bottom-1 duration-200">
                  {#if formData.frequenciaTipo === 'diario'}
                     <div class="grid grid-cols-3 gap-2">
                        <div class="space-y-1">
                           <label class="text-[10px] font-bold text-slate-500 uppercase text-center block">Manhã</label>
                           <input type="text" bind:value={formData.diario.manha} placeholder="0" class="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-3 font-bold text-indigo-800 text-base outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                        <div class="space-y-1">
                           <label class="text-[10px] font-bold text-slate-500 uppercase text-center block">Tarde</label>
                           <input type="text" bind:value={formData.diario.tarde} placeholder="0" class="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-3 font-bold text-indigo-800 text-base outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                        <div class="space-y-1">
                           <label class="text-[10px] font-bold text-slate-500 uppercase text-center block">Noite</label>
                           <input type="text" bind:value={formData.diario.noite} placeholder="0" class="w-full text-center bg-slate-50 border border-slate-200 rounded-xl py-3 font-bold text-indigo-800 text-base outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                     </div>
                     <p class="text-[10px] text-slate-400 mt-2 text-center">Digite a dose por turno (ex: 1, 1/2, 5ml, 20UI)</p>
                  
                  {:else if formData.frequenciaTipo === 'semanal'}
                     <div class="space-y-3">
                        <select bind:value={formData.semanal} class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium">
                           <option>Segunda a sexta</option>
                           <option>Final de semana</option>
                           <option>1x por semana</option>
                           <option>2x por semana</option>
                           <option>3x por semana</option>
                           <option>Seg, Qua, Sex</option>
                           <option>Ter, Qui, Sab</option>
                        </select>
                        <div class="space-y-1">
                           <label class="text-xs font-medium text-slate-500">Dose na aplicação</label>
                           <input type="text" bind:value={formData.doseQual} placeholder="Ex: 1 comprimido, 5 mL..." class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                     </div>

                  {:else if formData.frequenciaTipo === 'intervalo'}
                     <div class="space-y-3">
                        <div class="flex items-center gap-2">
                           <span class="text-sm text-slate-500">A cada</span>
                           <select bind:value={formData.intervalo} class="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-indigo-800">
                              <option>24h</option>
                              <option>12h</option>
                              <option>8h</option>
                              <option>6h</option>
                              <option>4h</option>
                              <option>1h</option>
                           </select>
                        </div>
                        <div class="space-y-1">
                           <label class="text-xs font-medium text-slate-500">Dose em cada tomada</label>
                           <input type="text" bind:value={formData.doseQual} placeholder="Ex: 1 comprimido, 20 gotas..." class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/20" />
                        </div>
                     </div>

                  {:else}
                     <div class="space-y-2">
                        <label class="text-xs font-medium text-slate-600">Descrição da rotina especial</label>
                        <textarea 
                          bind:value={formData.especial}
                          rows="3"
                          placeholder="Ex: Usar SOS se dor intensa, em dias intercalados, jejum..."
                          class="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                        ></textarea>
                     </div>
                  {/if}
               </div>
            </div>

            <!-- Duração do Tratamento -->
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
               <h3 class="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <div class="w-1.5 h-4 bg-sky-400 rounded-full"></div>
                  Duração do Tratamento
               </h3>
               
               <div class="grid grid-cols-1 gap-3">
                  <div class="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-xl">
                     {#each [
                        {id:'continuo', label:'Contínuo'}, 
                        {id:'dias', label:'Dias'}, 
                        {id:'semanas', label:'Semanas'}, 
                        {id:'meses', label:'Meses'}, 
                        {id:'livre', label:'Livre'}
                     ] as opt}
                        <button 
                          type="button"
                          onclick={() => formData.duracao_tipo = opt.id}
                          class="flex-1 text-[10px] font-bold py-1.5 px-1 rounded-lg transition-all text-center
                                 {formData.duracao_tipo === opt.id ? 'bg-white shadow-sm text-indigo-700 border border-slate-100' : 'text-slate-500 hover:text-slate-800'}"
                        >
                           {opt.label}
                        </button>
                     {/each}
                  </div>

                  {#if formData.duracao_tipo === 'dias' || formData.duracao_tipo === 'semanas' || formData.duracao_tipo === 'meses'}
                     <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl animate-in slide-in-from-top-1 duration-150">
                        <label class="text-sm text-slate-600 font-medium">Quantidade:</label>
                        <input 
                           type="number" 
                           min="1" 
                           bind:value={formData.duracao_valor}
                           class="w-20 text-center font-bold border-slate-200 rounded-lg px-2 py-1 focus:ring-indigo-500 bg-white"
                        />
                        <span class="text-sm font-medium text-slate-500 uppercase tracking-wider text-xs">
                           {formData.duracao_tipo}
                        </span>
                     </div>
                  {:else if formData.duracao_tipo === 'livre'}
                     <div class="animate-in slide-in-from-top-1 duration-150">
                        <input 
                           type="text" 
                           bind:value={formData.duracao_texto}
                           placeholder="Ex: Até a próxima consulta, ou completar ciclo..."
                           class="w-full text-sm border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
                        />
                     </div>
                  {:else}
                     <div class="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                        Uso por tempo indeterminado.
                     </div>
                  {/if}
               </div>
            </div>

            <div class="space-y-2">
               <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">Observações / Notas Clínicas</label>
               <textarea 
                 bind:value={formData.observacoes} 
                 rows="3"
                 placeholder="Ex: Paciente refere cefaleia se suspende o uso, toma há 5 anos..."
                 class="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 resize-y shadow-sm"
               ></textarea>
            </div>

         </div>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
         <button type="button" onclick={fechar} class="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
         </button>
         <button 
           type="button" 
           onclick={save}
           disabled={!formData.principio_ativo.trim()}
           class="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-95"
         >
            <Check class="w-5 h-5" /> Gravar Medicamento
         </button>
      </div>

    </div>
  </div>
{/if}
