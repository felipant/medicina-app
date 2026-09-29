<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { FlaskConical, Image, Plus, Trash2, Printer, CheckSquare, Square, CheckCircle, Loader2, Search, Edit3 } from 'lucide-svelte';
  import BuscaExameImagem from '../../exames/BuscaExameImagem.svelte';
  import BuscaExameLab from '../../exames/BuscaExameLab.svelte';
  import { PUBLIC_API_URL } from '$env/static/public';

  let {
    consultaId,
    prontuarioId,
    pacienteId,
    accessToken,
    readonly = false
  }: {
    consultaId?: string;
    prontuarioId?: string;
    pacienteId?: string;
    accessToken?: string;
    readonly?: boolean;
  } = $props();

  type AbaAtiva = 'laboratorio' | 'imagem';
  let aba = $state<AbaAtiva>('laboratorio');

  // --- PACOTES DE LABORATÓRIO PREDEFINIDOS ---
  const PACOTES_ESTATICOS: Record<string, string[]> = {
    'Hemograma': ['Hemograma Completo (Eritrograma + Leucograma + Plaquetas)'],
    'Lipídico': ['Colesterol Total', 'HDL', 'LDL', 'Triglicerídeos', 'VLDL', 'Lipoproteína (a) [Lp(a)]', 'Colesterol Não-HDL'],
    'Renal': ['Creatinina', 'Ureia', 'Ácido Úrico', 'Sódio', 'Potássio'],
    'Glicídico': ['Glicose de Jejum', 'Hemoglobina Glicada (HbA1c)', 'Insulina de Jejum', 'HOMA-IR'],
    'Tireoide': ['TSH', 'T4 Livre', 'T3 Livre', 'Anti-TPO'],
    'Hepático': ['TGO (AST)', 'TGP (ALT)', 'Gama-GT', 'Fosfatase Alcalina', 'Bilirrubinas T/D/I'],
    'Vitaminas': ['Vitamina B12', '25-OH Vitamina D', 'Ácido Fólico (Vitamina B9)', 'Ferritina'],
    'Coagulação': ['TAP (Tempo e Atividade da Protrombina)', 'TTPA (Tempo de Tromboplastina Parcial Ativada)', 'Fibrinogênio', 'D-Dímero'],
    'Urina': ['EAS (Urina Tipo 1)', 'Urocultura com Antibiograma']
  };

  // --- LAB STATE ---
  interface LabItem {
    nome_exame: string;
    pacote: string;
    incluido: boolean;
    manual: boolean;
    catalogo_exame_id?: string;
  }

  let itensLab = $state<LabItem[]>([]);
  let justificativaLab = $state('');
  let urgenciaLab = $state('rotina');
  let observacoesLab = $state('');
  let salvandoLab = $state(false);
  let pedidoLabSalvoId = $state<string | null>(null);
  let editandoLab = $state(false);
  let novoItemTexto = $state<Record<string, string>>({});

  // Computed derivation of packages currently being ordered
  let pacotesAtivos = $derived.by(() => {
    const set = new Set(itensLab.map(i => i.pacote));
    return Array.from(set);
  });

  function adicionarPacote(pacoteNome: string) {
    if (readonly) return;
    const exames = PACOTES_ESTATICOS[pacoteNome] || [];
    let novos = [...itensLab];
    exames.forEach(ex => {
      // Avoid duplicates
      if (!novos.some(i => i.nome_exame === ex && i.pacote === pacoteNome)) {
        novos.push({
          nome_exame: ex,
          pacote: pacoteNome,
          incluido: true,
          manual: true
        });
      }
    });
    itensLab = novos;
  }

  function adicionarItemAoPacote(pacoteNome: string) {
    const txt = (novoItemTexto[pacoteNome] || '').trim();
    if (!txt) return;
    itensLab = [...itensLab, {
      nome_exame: txt,
      pacote: pacoteNome,
      incluido: true,
      manual: true
    }];
    novoItemTexto[pacoteNome] = '';
  }

  function adicionarItemAvulso() {
    const ex = prompt("Digite o nome do exame avulso:");
    if (!ex || !ex.trim()) return;
    itensLab = [...itensLab, {
      nome_exame: ex.trim(),
      pacote: 'Avulsos',
      incluido: true,
      manual: true
    }];
  }

  function removerItem(idx: number) {
    itensLab = itensLab.filter((_, i) => i !== idx);
  }

  function removerPacote(pacoteNome: string) {
    itensLab = itensLab.filter(i => i.pacote !== pacoteNome);
  }

  let buscaLabSelecionado = $state<any>(null);

  function handleLabSelecionado(obj: any) {
    if (!obj) return;
    
    // Evita duplicidades
    if (itensLab.some(i => i.nome_exame.toLowerCase() === obj.nome.toLowerCase())) {
      alert("Este exame já foi adicionado à lista.");
      buscaLabSelecionado = null;
      return;
    }
    
    // Adiciona de forma reativa
    itensLab = [...itensLab, {
      nome_exame: obj.nome,
      pacote: obj.pacote || 'Geral',
      incluido: true,
      manual: obj.manual || false
    }];
    
    buscaLabSelecionado = null;
  }

  async function salvarPedidoLab() {
    const inclusos = itensLab.filter(i => i.incluido);
    if (inclusos.length === 0) {
      alert("Selecione ao menos um exame para o pedido.");
      return;
    }
    if (!accessToken || !consultaId) return;
    
    salvandoLab = true;
    try {
      const payload = {
        consulta_id: consultaId,
        prontuario_id: prontuarioId,
        paciente_id: pacienteId,
        justificativa: justificativaLab || null,
        urgencia: urgenciaLab,
        observacoes: observacoesLab || null,
        itens: inclusos.map((it, idx) => ({
          nome_exame: it.nome_exame,
          pacote: it.pacote,
          manual: it.manual,
          ordem: idx + 1,
          catalogo_exame_id: it.catalogo_exame_id || null
        }))
      };

      const url = pedidoLabSalvoId ? `/api/v1/pedidos/laboratorial/${pedidoLabSalvoId}` : '/api/v1/pedidos/laboratorial';
      const method = pedidoLabSalvoId ? 'PUT' : 'POST';

      const res = await apiFetch<any>(url, accessToken, {
        method,
        body: JSON.stringify(payload)
      });

      pedidoLabSalvoId = res.id;
      editandoLab = false;
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar pedido laboratorial.");
    } finally {
      salvandoLab = false;
    }
  }

  // --- IMAGEM STATE ---
  interface PedidoImagemUI {
    id?: string;
    nome_exame: string;
    categoria: string;
    motivo_clinico: string;
    urgencia: string;
    preparo_especial: string;
    observacoes: string;
    salvando?: boolean;
    salvo?: boolean;
    _exameObj?: any;
  }

  let pedidosImagem = $state<PedidoImagemUI[]>([]);
  let carregandoImg = $state(false);

  onMount(async () => {
    if (!consultaId || !accessToken) return;
    try {
      // Load existing lab orders
      const resLab = await apiFetch<any[]>(`/api/v1/pedidos/laboratorial/consulta/${consultaId}`, accessToken);
      if (resLab && resLab.length > 0) {
        const ultimo = resLab[0];
        pedidoLabSalvoId = ultimo.id;
        justificativaLab = ultimo.justificativa || '';
        urgenciaLab = ultimo.urgencia;
        observacoesLab = ultimo.observacoes || '';
        itensLab = (ultimo.itens || []).map((it: any) => ({
          nome_exame: it.nome_exame,
          pacote: it.pacote,
          incluido: true,
          manual: it.manual
        }));
      }

      // Load existing image orders
      carregandoImg = true;
      const resImg = await apiFetch<PedidoImagemUI[]>(`/api/v1/pedidos/imagem/consulta/${consultaId}`, accessToken);
      pedidosImagem = (resImg || []).map(item => ({
        ...item,
        salvo: true,
        _exameObj: { nome: item.nome_exame, categoria: item.categoria }
      }));
    } catch (e) {
      console.error(e);
    } finally {
      carregandoImg = false;
    }
  });

  function addPedidoImagem() {
    pedidosImagem.push({
      nome_exame: '',
      categoria: 'Outros',
      motivo_clinico: '',
      urgencia: 'eletivo',
      preparo_especial: '',
      observacoes: '',
      salvando: false,
      salvo: false,
      _exameObj: null
    });
  }

  function handleImagemSelecionado(idx: number, obj: any) {
    if (!obj) return;
    pedidosImagem[idx].nome_exame = obj.nome;
    pedidosImagem[idx].categoria = obj.categoria || 'Imagem';
  }

  async function salvarPedidoImagem(idx: number) {
    const p = pedidosImagem[idx];
    if (!p.nome_exame || !p.motivo_clinico) {
      alert("Informe o exame e o motivo clínico do pedido.");
      return;
    }
    if (!accessToken || !consultaId) return;

    p.salvando = true;
    try {
      const payload = {
        consulta_id: consultaId,
        prontuario_id: prontuarioId,
        paciente_id: pacienteId,
        nome_exame: p.nome_exame,
        categoria: p.categoria,
        motivo_clinico: p.motivo_clinico,
        urgencia: p.urgencia,
        preparo_especial: p.preparo_especial || null,
        observacoes: p.observacoes || null
      };

      const url = p.id ? `/api/v1/pedidos/imagem/${p.id}` : '/api/v1/pedidos/imagem';
      const method = p.id ? 'PUT' : 'POST';

      const res = await apiFetch<any>(url, accessToken, {
        method,
        body: JSON.stringify(payload)
      });

      pedidosImagem[idx] = {
        ...pedidosImagem[idx],
        id: res.id,
        salvo: true,
        salvando: false
      };
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar pedido de imagem.");
      p.salvando = false;
    }
  }

  function removerImagemLocal(idx: number) {
    pedidosImagem = pedidosImagem.filter((_, i) => i !== idx);
  }
</script>

<div class="bg-white border border-slate-100 rounded-2xl shadow-sm">
  <!-- HEADER + TABS -->
  <div class="bg-slate-50/80 border-b border-slate-100 flex items-center justify-between px-6 rounded-t-2xl">
    <div class="flex gap-1 py-3">
      <button 
        type="button"
        onclick={() => aba = 'laboratorio'}
        class="px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all
               {aba === 'laboratorio' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}"
      >
        <FlaskConical class="w-4 h-4" /> Exames Laboratoriais
      </button>
      <button 
        type="button"
        onclick={() => aba = 'imagem'}
        class="px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition-all
               {aba === 'imagem' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}"
      >
        <Image class="w-4 h-4" /> Imagem / Especiais
      </button>
    </div>
  </div>

  <div class="p-6">
    {#if aba === 'laboratorio'}
      <!-- SELETOR DE PACOTES -->
      <div class="mb-6">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pacotes Rápidos</h4>
        <div class="flex gap-2 flex-wrap">
          {#each Object.keys(PACOTES_ESTATICOS) as pacote}
            <button 
              type="button"
              onclick={() => adicionarPacote(pacote)}
              disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
              class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-800 text-xs font-bold border border-sky-200/50 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1"
            >
              <Plus class="w-3 h-3" /> {pacote}
            </button>
          {/each}
          <button 
            type="button"
            onclick={adicionarItemAvulso}
            disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
            class="px-3 py-1.5 border border-dashed border-slate-300 hover:border-sky-300 text-slate-600 hover:text-sky-800 text-xs font-bold rounded-xl inline-flex items-center gap-1 transition-colors"
          >
            <Plus class="w-3 h-3" /> Exame Avulso
          </button>
        </div>
      </div>

      <!-- BUSCADOR DO CATÁLOGO -->
      {#if !readonly && (!pedidoLabSalvoId || editandoLab)}
        <div class="mb-6 p-4 bg-sky-50/20 border border-sky-100 rounded-2xl space-y-2 shadow-xs">
          <h4 class="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
            <Search class="w-3.5 h-3.5 text-sky-600" /> Adicionar via Catálogo de Exames
          </h4>
          <BuscaExameLab 
            accessToken={accessToken || ''}
            bind:selecionado={buscaLabSelecionado}
            onchange={() => handleLabSelecionado(buscaLabSelecionado)}
          />
          <p class="text-[10px] text-slate-400 font-medium">
            Utilize para buscar qualquer exame detalhado. Novos parâmetros podem ser cadastrados pelo Administrador no Catálogo.
          </p>
        </div>
      {/if}

      <!-- LISTA DE ITENS POR PACOTE -->
      {#if itensLab.length === 0}
        <div class="py-8 text-center text-slate-400 text-sm border border-slate-100 rounded-2xl bg-slate-50/40 mb-4">
          Nenhum exame laboratorial adicionado. Clique nos pacotes rápidos ou adicione itens avulsos.
        </div>
      {:else}
        <div class="space-y-4 mb-6">
          {#each pacotesAtivos as pacote}
            <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div class="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span class="text-xs font-black text-slate-700 uppercase tracking-wide">{pacote}</span>
                {#if !readonly && (!pedidoLabSalvoId || editandoLab)}
                  <button type="button" onclick={() => removerPacote(pacote)} class="text-slate-400 hover:text-red-500">
                    <Trash2 class="w-4 h-4" />
                  </button>
                {/if}
              </div>
              <div class="p-3 space-y-2">
                {#each itensLab.filter(i => i.pacote === pacote) as item, idx}
                  <div class="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <button
                      type="button"
                      disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
                      onclick={() => item.incluido = !item.incluido}
                      class="flex items-center gap-2 text-sm text-slate-700 text-left font-medium hover:text-sky-900 disabled:opacity-80"
                    >
                      {#if item.incluido}
                        <CheckSquare class="w-4 h-4 text-sky-600 fill-sky-50" />
                      {:else}
                        <Square class="w-4 h-4 text-slate-300" />
                      {/if}
                      <span class={item.incluido ? '' : 'line-through text-slate-400'}>
                        {item.nome_exame}
                      </span>
                    </button>
                    {#if !readonly && (!pedidoLabSalvoId || editandoLab)}
                      <button 
                        type="button" 
                        onclick={() => removerItem(itensLab.indexOf(item))}
                        class="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    {/if}
                  </div>
                {/each}
                
                <!-- Input Inline to add to this specific group -->
                {#if !readonly && (!pedidoLabSalvoId || editandoLab)}
                  <div class="flex gap-2 pt-2">
                    <input 
                      type="text"
                      placeholder="Escreva +1 exame para este pacote..."
                      bind:value={novoItemTexto[pacote]}
                      onkeydown={(e) => e.key === 'Enter' && adicionarItemAoPacote(pacote)}
                      class="flex-1 text-xs border-slate-200 rounded-lg h-8 shadow-none focus:ring-sky-500"
                    />
                    <button 
                      type="button" 
                      onclick={() => adicionarItemAoPacote(pacote)} 
                      class="h-8 px-2.5 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 text-xs font-bold rounded-lg"
                    >
                      Incluir
                    </button>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- LAB META -->
      <div class="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-slate-600">Justificativa Clínica (Obrigatório por Planos)</label>
          <textarea 
            bind:value={justificativaLab} 
            rows="2" 
            placeholder="Indicação ou suspeita clínica para a solicitação dos exames..."
            disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
            class="w-full text-sm border-slate-200 rounded-xl focus:ring-sky-500 shadow-sm"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600">Urgência</label>
            <select 
              bind:value={urgenciaLab} 
              disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
              class="w-full text-sm border-slate-200 rounded-xl shadow-sm bg-white"
            >
              <option value="rotina">Rotina</option>
              <option value="prioritario">Prioritário</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-600">Observações no Pedido (ex: Jejum)</label>
            <input 
              type="text"
              bind:value={observacoesLab} 
              placeholder="Ex: Jejum de 8 horas, colher pela manhã..."
              disabled={readonly || (!!pedidoLabSalvoId && !editandoLab)}
              class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
            />
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
          {#if !pedidoLabSalvoId || editandoLab}
            <div class="flex gap-2">
              <button 
                type="button" 
                onclick={salvarPedidoLab}
                disabled={salvandoLab || itensLab.length === 0}
                class="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 shadow-sm transition-all"
              >
                {#if salvandoLab}
                  <Loader2 class="w-4 h-4 animate-spin" /> {pedidoLabSalvoId ? 'Atualizando...' : 'Salvando...'}
                {:else}
                  {pedidoLabSalvoId ? 'Atualizar Pedido de Exames' : 'Salvar Pedido de Exames'}
                {/if}
              </button>
              {#if editandoLab}
                <button 
                  type="button"
                  onclick={() => editandoLab = false}
                  class="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl transition-colors"
                >
                  Cancelar Edição
                </button>
              {/if}
            </div>
          {:else}
            <div class="flex items-center gap-1.5 py-2">
              <CheckCircle class="w-5 h-5 text-emerald-600" />
              <span class="text-sm font-bold text-emerald-700">Pedido Laboratorial Gravado!</span>
            </div>
            <div class="flex items-center gap-3">
              {#if !readonly}
                <button 
                  type="button"
                  onclick={() => editandoLab = true}
                  class="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-bold rounded-xl border border-sky-200/50 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 class="w-4 h-4" /> Editar Pedido
                </button>
              {/if}
              <a 
                href={`${PUBLIC_API_URL}/api/v1/pedidos/laboratorial/${pedidoLabSalvoId}/pdf`} 
                target="_blank"
                class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <Printer class="w-4 h-4" /> Imprimir Pedido (PDF)
              </a>
            </div>
          {/if}
        </div>
      </div>

    {:else if aba === 'imagem'}
      <!-- IMAGEM REQUISITION -->
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-sm font-bold text-slate-800">Solicitações de Imagem / Funcional</h3>
        {#if !readonly}
          <button 
            type="button" 
            onclick={addPedidoImagem} 
            class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl font-bold transition-colors inline-flex items-center gap-1 shadow-xs"
          >
            <Plus class="w-3.5 h-3.5" /> Novo Pedido de Imagem
          </button>
        {/if}
      </div>

      {#if carregandoImg}
        <div class="py-12 flex justify-center text-slate-400 gap-2 items-center text-sm">
          <Loader2 class="w-6 h-6 animate-spin" /> Carregando solicitações...
        </div>
      {:else if pedidosImagem.length === 0}
        <div class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
          {#if readonly}
            Nenhuma solicitação de imagem realizada para esta consulta.
          {:else}
            Nenhuma solicitação de imagem gravada. Clique em "Novo Pedido de Imagem" para começar.
          {/if}
        </div>
      {:else}
        <div class="space-y-6">
          {#each pedidosImagem as p, idx}
            <div class="border border-slate-200 rounded-2xl shadow-xs relative">
              {#if p.salvo}
                <span class="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full z-10">
                  <CheckCircle class="w-3 h-3" /> Gravado
                </span>
              {/if}

              <div class="p-5 bg-white space-y-4 rounded-t-2xl">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-600">Exame de Imagem *</label>
                    <BuscaExameImagem 
                      accessToken={accessToken || ''}
                      bind:selecionado={p._exameObj}
                      disabled={readonly || p.salvo}
                      onchange={() => handleImagemSelecionado(idx, p._exameObj)}
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-600">Urgência</label>
                    <div class="flex gap-2">
                      {#each ['eletivo', 'prioritario', 'urgente'] as u}
                        <button 
                          type="button" 
                          disabled={readonly || p.salvo}
                          onclick={() => p.urgencia = u}
                          class="text-xs px-3 py-2 border rounded-xl font-bold capitalize transition-all
                                 {p.urgencia === u 
                                   ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                   : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
                        >
                          {u}
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-600">Indicação Clínica / Motivo *</label>
                  <textarea 
                    bind:value={p.motivo_clinico} 
                    rows="2" 
                    placeholder="Qual é o motivo do exame? Ex: Suspeita de pneumonia..."
                    disabled={readonly || p.salvo}
                    class="w-full text-sm border-slate-200 rounded-xl shadow-sm focus:ring-emerald-500"
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-600">Preparo Especial (opcional)</label>
                    <input 
                      type="text"
                      bind:value={p.preparo_especial} 
                      placeholder="Ex: Bexiga cheia, jejum..."
                      disabled={readonly || p.salvo}
                      class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-xs font-bold text-slate-600">Observações (opcional)</label>
                    <input 
                      type="text"
                      bind:value={p.observacoes} 
                      placeholder="Ex: Paciente claustrofóbico..."
                      disabled={readonly || p.salvo}
                      class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div class="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
                {#if !p.salvo}
                  <div class="flex gap-3">
                    <button 
                      type="button" 
                      onclick={() => salvarPedidoImagem(idx)}
                      disabled={p.salvando}
                      class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
                    >
                      {#if p.salvando}
                        <Loader2 class="w-3.5 h-3.5 animate-spin" /> {p.id ? 'Atualizando...' : 'Salvando...'}
                      {:else}
                        {p.id ? 'Atualizar Solicitação' : 'Salvar Solicitação'}
                      {/if}
                    </button>
                    {#if p.id}
                      <button 
                        type="button" 
                        onclick={() => p.salvo = true}
                        class="text-slate-500 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Cancelar
                      </button>
                    {:else}
                      <button 
                        type="button" 
                        onclick={() => removerImagemLocal(idx)}
                        class="text-slate-400 hover:text-red-500 text-xs transition-colors flex items-center gap-1"
                      >
                        Descartar
                      </button>
                    {/if}
                  </div>
                {:else}
                  <div class="flex items-center gap-3 w-full justify-between">
                    {#if !readonly}
                      <button 
                        type="button"
                        onclick={() => p.salvo = false}
                        class="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/50 inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 class="w-3.5 h-3.5" /> Editar
                      </button>
                    {/if}
                    <a 
                      href={`${PUBLIC_API_URL}/api/v1/pedidos/imagem/${p.id}/pdf`} 
                      target="_blank"
                      class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-colors ml-auto"
                    >
                      <Printer class="w-3.5 h-3.5" /> Imprimir Pedido de Imagem (PDF)
                    </a>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
