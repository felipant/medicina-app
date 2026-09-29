<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api';
  import BuscaExameImagem from '$lib/components/exames/BuscaExameImagem.svelte';
  import { Plus, History, Calendar, MapPin, User, ClipboardList, Trash2, Edit, Link, X, FileUp } from 'lucide-svelte';
  import { slide, fade } from 'svelte/transition';

  interface ItemSelecionado {
    id: string | null;
    nome: string;
    categoria: string;
    sigla: string | null;
    manual: boolean;
  }

  interface ResultadoImagemOut {
    id: string;
    paciente_id: string;
    consulta_id: string | null;
    catalogo_imagem_id: string | null;
    nome_exame: string;
    categoria: string | null;
    data_realizacao: string;
    medico_executor: string | null;
    local_realizacao: string | null;
    resultado: string;
    arquivo_url: string | null;
    observacao: string | null;
    criado_em: string;
  }

  let {
    pacienteId,
    consultaId,
    accessToken,
    readonly = false
  }: {
    pacienteId: string;
    consultaId: string;
    accessToken: string;
    readonly?: boolean;
  } = $props();

  // Abas e Modal
  let abaAtiva = $state<'desta' | 'historico'>('desta');
  let exibirModal = $state(false);
  
  // Dados
  let destaConsulta = $state<ResultadoImagemOut[]>([]);
  let historico = $state<ResultadoImagemOut[]>([]);
  let carregando = $state(false);

  // Formulario
  let exameSelecionado = $state<ItemSelecionado | null>(null);
  let dataRealizacao = $state(new Date().toISOString().split('T')[0]);
  let medicoExecutor = $state('');
  let localRealizacao = $state('');
  let resultado = $state('');
  let arquivoUrl = $state('');
  let observacao = $state('');
  let salvando = $state(false);
  
  // Edição
  let editandoId = $state<string | null>(null);
  let lista = $derived(abaAtiva === 'desta' ? destaConsulta : historico);

  async function carregarDados() {
    carregando = true;
    try {
      const [resDesta, resHist] = await Promise.all([
        apiFetch<ResultadoImagemOut[]>(`/api/v1/resultados-imagem/consulta/${consultaId}`, accessToken).catch(() => []),
        apiFetch<ResultadoImagemOut[]>(`/api/v1/resultados-imagem/paciente/${pacienteId}`, accessToken).catch(() => [])
      ]);
      destaConsulta = resDesta;
      historico = resHist;
    } catch (e) {
      console.error("Erro ao carregar exames de imagem:", e);
    } finally {
      carregando = false;
    }
  }

  onMount(() => {
    carregarDados();
  });

  function limparForm() {
    exameSelecionado = null;
    dataRealizacao = new Date().toISOString().split('T')[0];
    medicoExecutor = '';
    localRealizacao = '';
    resultado = '';
    arquivoUrl = '';
    observacao = '';
    editandoId = null;
    exibirModal = false;
  }

  function abrirAdicao() {
    limparForm();
    exibirModal = true;
  }

  async function salvar() {
    if (!exameSelecionado) {
      alert("Selecione ou escreva o nome do exame.");
      return;
    }
    if (!resultado.trim()) {
      alert("Insira o resultado do exame.");
      return;
    }

    salvando = true;
    try {
      if (editandoId) {
        const payload = {
          data_realizacao: dataRealizacao,
          medico_executor: medicoExecutor || null,
          local_realizacao: localRealizacao || null,
          resultado: resultado,
          arquivo_url: arquivoUrl || null,
          observacao: observacao || null
        };
        await apiFetch(`/api/v1/resultados-imagem/${editandoId}`, accessToken, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        const payload = {
          paciente_id: pacienteId,
          consulta_id: consultaId,
          catalogo_imagem_id: exameSelecionado.id,
          nome_exame: exameSelecionado.nome,
          categoria: exameSelecionado.categoria || "Outros",
          data_realizacao: dataRealizacao,
          medico_executor: medicoExecutor || null,
          local_realizacao: localRealizacao || null,
          resultado: resultado,
          arquivo_url: arquivoUrl || null,
          observacao: observacao || null
        };
        await apiFetch(`/api/v1/resultados-imagem/`, accessToken, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      limparForm();
      await carregarDados();
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`);
    } finally {
      salvando = false;
    }
  }

  async function remover(id: string) {
    if (!confirm("Deseja realmente excluir este resultado de exame?")) return;
    try {
      await apiFetch(`/api/v1/resultados-imagem/${id}`, accessToken, {
        method: 'DELETE'
      });
      await carregarDados();
    } catch (e: any) {
      alert(`Erro ao remover: ${e.message}`);
    }
  }

  function iniciarEdicao(item: ResultadoImagemOut) {
    editandoId = item.id;
    exameSelecionado = {
      id: item.catalogo_imagem_id,
      nome: item.nome_exame,
      categoria: item.categoria || "Outro",
      sigla: null,
      manual: item.catalogo_imagem_id === null
    };
    dataRealizacao = item.data_realizacao;
    medicoExecutor = item.medico_executor || '';
    localRealizacao = item.local_realizacao || '';
    resultado = item.resultado;
    arquivoUrl = item.arquivo_url || '';
    observacao = item.observacao || '';
    exibirModal = true;
  }

  function formatarData(iso: string) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function corCategoria(cat: string | null): string {
    if (!cat) return 'bg-slate-100 text-slate-700 border-slate-200';
    const c = cat.toUpperCase();
    if (c.includes('USG') || c.includes('ULTRAS')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (c.includes('TC') || c.includes('TOMO')) return 'bg-violet-50 text-violet-700 border-violet-200';
    if (c.includes('RM') || c.includes('RESSO')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (c.includes('ECG') || c.includes('CARDIO')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (c.includes('RAIO') || c.includes('RX') || c.includes('RADIOG')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
</script>

<div class="space-y-6">
  
  <!-- Barra de Topo da Seção com Botão para Lançamento -->
  <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
    <div>
      <h3 class="text-sm font-bold text-slate-800">Exames de Imagem / Funcionais</h3>
      <p class="text-xs text-slate-500">Gestão de laudos e exames de apoio diagnóstico.</p>
    </div>
    {#if !readonly}
      <button 
        type="button" 
        onclick={abrirAdicao} 
        class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:shadow group"
      >
        <Plus class="w-4 h-4 group-hover:scale-110 transition-transform" />
        Lançar Exame
      </button>
    {/if}
  </div>

  <!-- Tabs de Visualização -->
  <div class="space-y-4 bg-slate-50/40 border border-slate-200 rounded-2xl p-5">
    <div class="flex gap-2 border-b border-slate-200/60 pb-px">
      <button 
        type="button"
        onclick={() => abaAtiva = 'desta'}
        class="px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
               {abaAtiva === 'desta' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'}"
      >
        <ClipboardList class="w-4 h-4" />
        Desta Consulta ({destaConsulta.length})
      </button>
      <button 
        type="button"
        onclick={() => abaAtiva = 'historico'}
        class="px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
               {abaAtiva === 'historico' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800'}"
      >
        <History class="w-4 h-4" />
        Histórico Completo ({historico.length})
      </button>
    </div>

    <!-- Lista de Exames -->
    {#if carregando}
      <div class="py-12 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-2">
        <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        Carregando resultados...
      </div>
    {:else if lista.length === 0}
      <div class="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border-2 border-dashed border-slate-200">
        {#if abaAtiva === 'desta'}
          Nenhum exame de imagem anexado nesta consulta.
        {:else}
          Nenhum exame de imagem encontrado no histórico deste paciente.
        {/if}
      </div>
    {:else}
      <div class="space-y-4">
        {#each lista as item}
          <div class="bg-white border border-slate-150 rounded-2xl p-5 hover:shadow-sm transition-shadow flex flex-col md:flex-row md:items-start gap-4 relative group border-l-4 border-l-indigo-400">
            
            <!-- Badge da Categoria -->
            <div class="shrink-0">
              <span class="px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider inline-block {corCategoria(item.categoria)} shadow-sm">
                {item.categoria || 'Exame'}
              </span>
            </div>

            <!-- Informações Principais -->
            <div class="flex-1 space-y-2 min-w-0">
              <div class="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-50 pb-2">
                <h5 class="font-bold text-slate-800 text-base leading-tight">
                  {item.nome_exame}
                </h5>
                <span class="text-xs text-slate-400 font-mono font-semibold flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded">
                  <Calendar class="w-3.5 h-3.5 text-slate-400" />
                  {formatarData(item.data_realizacao)}
                </span>
              </div>

              <!-- Local e Executor -->
              {#if item.medico_executor || item.local_realizacao}
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 font-medium">
                  {#if item.medico_executor}
                    <span class="flex items-center gap-1">
                      <User class="w-3.5 h-3.5 text-slate-400" /> Dr(a). {item.medico_executor}
                    </span>
                  {/if}
                  {#if item.local_realizacao}
                    <span class="flex items-center gap-1">
                      <MapPin class="w-3.5 h-3.5 text-slate-400" /> {item.local_realizacao}
                    </span>
                  {/if}
                </div>
              {/if}

              <!-- Laudo -->
              <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner select-all font-sans">
                {item.resultado}
              </div>

              <!-- Rodapé: Observação / URL -->
              <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div>
                  {#if item.observacao}
                    <p class="text-xs italic text-slate-500 bg-amber-50 border-l-2 border-l-amber-300 px-2 py-1 rounded-r-lg">
                      <span class="font-semibold non-italic">Nota interna:</span> {item.observacao}
                    </p>
                  {/if}
                </div>
                
                {#if item.arquivo_url}
                  <a 
                    href={item.arquivo_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    <Link class="w-3.5 h-3.5" />
                    Laudo Digital
                  </a>
                {/if}
              </div>
            </div>

            <!-- Ações Contextuais (se for editável e pertencer a esta consulta) -->
            {#if !readonly && item.consulta_id === consultaId}
              <div class="flex md:flex-col gap-1 absolute top-4 right-4 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  type="button" 
                  onclick={() => iniciarEdicao(item)} 
                  title="Editar registro"
                  class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 shadow-sm hover:border-indigo-200 transition-all"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onclick={() => remover(item.id)} 
                  title="Excluir"
                  class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 shadow-sm hover:border-red-200 transition-all"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/if}

          </div>
        {/each}
      </div>
    {/if}
  </div>

</div>

<!-- POPUP / MODAL PARA LANÇAMENTO E EDIÇÃO -->
{#if exibirModal}
  <div 
    class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    onclick={(e) => { if (e.target === e.currentTarget && !salvando) exibirModal = false; }}
    onkeydown={(e) => { if (e.key === 'Escape' && !salvando) exibirModal = false; }}
  >
    <div 
      transition:slide={{ duration: 250 }}
      class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100"
    >
      <!-- Header Modal -->
      <div class="bg-slate-50/80 px-6 py-4 border-b border-slate-150 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
            <FileUp class="w-5 h-5" />
          </div>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              {editandoId ? 'Editar Exame' : 'Lançar Exame'}
            </h4>
            <p class="text-xs text-slate-500">Insira os detalhes do laudo de imagem ou funcional.</p>
          </div>
        </div>
        <button 
          type="button" 
          disabled={salvando}
          onclick={limparForm} 
          class="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Corpo do Modal (Scrollable) -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1">
        
        <!-- Busca/Seleção de Exame -->
        <div class="space-y-1.5">
          <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Nome do Exame</label>
          {#if editandoId}
            <div class="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 font-bold select-none flex justify-between items-center">
              <span>{exameSelecionado?.nome}</span>
              <span class="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wide">
                {exameSelecionado?.categoria}
              </span>
            </div>
          {:else}
            <BuscaExameImagem
              bind:selecionado={exameSelecionado}
              {accessToken}
            />
          {/if}
        </div>

        <!-- Grid de Inputs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">Data de Realização</label>
            <div class="relative">
              <Calendar class="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="date"
                bind:value={dataRealizacao}
                required
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">Link Laudo Digital (Opcional)</label>
            <div class="relative">
              <Link class="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="url"
                bind:value={arquivoUrl}
                placeholder="https://exemplo.com/laudo.pdf"
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">Médico Executor (Opcional)</label>
            <div class="relative">
              <User class="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                bind:value={medicoExecutor}
                placeholder="Nome do médico..."
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">Local (Opcional)</label>
            <div class="relative">
              <MapPin class="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                bind:value={localRealizacao}
                placeholder="Clínica, laboratório ou hospital..."
                class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Laudo Resumido / Achados Principais</label>
          <textarea 
            bind:value={resultado}
            rows={5}
            required
            placeholder="Descreva detalhadamente os achados e conclusões do laudo..."
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-y min-h-[120px]"
          ></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Observações Clínicas Internas (Opcional)</label>
          <input 
            type="text"
            bind:value={observacao}
            placeholder="Notas complementares..."
            class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

      </div>

      <!-- Footer do Modal -->
      <div class="bg-slate-50 border-t border-slate-150 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
        <button 
          type="button"
          disabled={salvando}
          onclick={limparForm}
          class="text-slate-500 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          Cancelar
        </button>
        <button 
          type="button"
          onclick={salvar}
          disabled={salvando || !exameSelecionado}
          class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center gap-2"
        >
          {#if salvando}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Salvando...
          {:else}
            {editandoId ? 'Atualizar Exame' : 'Confirmar Lançamento'}
          {/if}
        </button>
      </div>

    </div>
  </div>
{/if}
