<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { Pill, Plus, Check, X, RefreshCw, AlertTriangle, Trash2, CheckCircle, Loader2 } from 'lucide-svelte';
  import DialogoMedicamento from '../../medicamentos/DialogoMedicamento.svelte';

  let {
    consultaId,
    prontuarioId,
    accessToken,
    readonly = false
  }: {
    consultaId?: string;
    prontuarioId?: string;
    accessToken?: string;
    readonly?: boolean;
  } = $props();

  interface ItemPrescrito {
    id?: string;
    sourceId?: string | null;
    principio_ativo: string;
    concentracao?: string;
    forma_farmaceutica?: string;
    classe?: string;
    frequenciaTipo: string;
    diario?: any;
    semanal?: string;
    intervalo?: string;
    frequencia?: string;
    especial?: string;
    doseQual?: string;
    duracao_tipo: string;
    duracao_valor?: number | null;
    duracao_texto?: string | null;
    observacoes?: string;
    
    // UI Actions & States
    acao_manutencao?: 'continuar' | 'alterar' | 'suspender';
    origem?: 'carryover' | 'novo';
    salvo?: boolean;
  }

  let carregando = $state(true);
  let itens = $state<ItemPrescrito[]>([]);
  let salvando = $state(false);
  let gravadoComSucesso = $state(false);
  
  // Medicamentos relatados de forma verbal pelo paciente no S
  let medsRelatadosNoS = $state<any[]>([]);
  
  // Sugestões são os do S que AINDA NÃO foram incluídos na lista atual como ativos
  let sugestoesFiltradas = $derived(
    medsRelatadosNoS.filter(sug => 
      !itens.some(it => 
        it.acao_manutencao !== 'suspender' && 
        it.principio_ativo?.trim().toUpperCase() === sug.principio_ativo?.trim().toUpperCase()
      )
    )
  );

  onMount(async () => {
    if (!accessToken || !prontuarioId || !consultaId) return;
    carregando = true;
    try {
      // 1. Carrega as sugestões de medicamentos relatados do S e carryover histórico
      const carry = await apiFetch<any>(`/api/v1/prescricoes/carryover/${prontuarioId}`, accessToken);
      medsRelatadosNoS = carry.medicamentos_relatados || [];
      
      // 2. Carrega as prescrições salvas da consulta atual se houver
      const salvos = await apiFetch<any[]>(`/api/v1/prescricoes/consulta/${consultaId}`, accessToken);
      
      if (salvos && salvos.length > 0) {
        const mapped = salvos.map(s => ({ 
          ...s, 
          salvo: true, 
          origem: 'novo', 
          acao_manutencao: s.status === 'suspenso' ? 'suspender' : 'continuar' 
        }));
        // Se estiver em modo leitura (consulta finalizada), exibe apenas os medicamentos mantidos (não suspensos)
        itens = readonly ? mapped.filter(s => s.status !== 'suspenso') : mapped;
        gravadoComSucesso = true;
        carregando = false;
        return;
      }

      // 3. Caso contrário, popula a lista inicial com os carryover do histórico do paciente
      const anteriores = carry.prescricoes_anteriores || [];
      itens = anteriores.map((ant: any) => ({
        ...ant,
        id: undefined, // Rompe PK para gravar de novo atrelado à nova consulta
        origem: 'carryover',
        salvo: false,
        acao_manutencao: 'continuar' // Padrão: continuar uso
      }));
    } catch (e) {
      console.error("Erro ao carregar prescrições:", e);
    } finally {
      carregando = false;
    }
  });

  function handleAdicionarMedicamento(med: any) {
    itens.push({
      ...med,
      id: undefined,
      origem: 'novo',
      salvo: false
    });
    gravadoComSucesso = false; // Clear success state so user knows they must save again
  }

  function handleEditarMedicamento(idx: number, med: any) {
    itens[idx] = {
      ...itens[idx],
      ...med,
      acao_manutencao: itens[idx].origem === 'carryover' ? 'alterar' : undefined,
      salvo: false
    };
    gravadoComSucesso = false;
  }

  function formatarPosologia(item: ItemPrescrito): string {
    let pos = '';
    if (item.frequenciaTipo === 'diario' && item.diario) {
      const d = item.diario;
      const part = [];
      if (d.manha) part.push(`${d.manha} pela manhã`);
      if (d.tarde) part.push(`${d.tarde} à tarde`);
      if (d.noite) part.push(`${d.noite} à noite`);
      pos = part.join(', ');
    } else if (item.frequenciaTipo === 'semanal') {
       pos = `${item.doseQual || 'Dose'} - ${item.semanal}`;
    } else if (item.frequenciaTipo === 'intervalo') {
      pos = `${item.doseQual || 'Dose'} de ${item.intervalo} em ${item.intervalo}`;
    } else if (item.especial) {
      pos = item.especial;
    }
    return pos || item.frequencia || 'Dose e posologia a esclarecer';
  }

  function formatarDuracao(item: ItemPrescrito): string {
    if (item.duracao_tipo === 'continuo') return 'Uso contínuo';
    if (item.duracao_tipo === 'livre') return item.duracao_texto || 'Uso conforme orientação';
    return `Por ${item.duracao_valor} ${item.duracao_tipo}`;
  }

  function adicionarSugestao(sug: any) {
    itens.push({
      principio_ativo: sug.principio_ativo,
      concentracao: sug.concentracao,
      forma_farmaceutica: sug.forma_farmaceutica,
      frequenciaTipo: 'especial',
      especial: sug.frequencia || 'Uso contínuo',
      doseQual: sug.dose || '',
      duracao_tipo: 'continuo',
      origem: 'novo',
      salvo: false,
      acao_manutencao: 'continuar'
    });
    gravadoComSucesso = false;
  }

  async function salvarPrescricoes() {
    if (!accessToken || !consultaId) return;
    
    // NÃO filtramos suspensos! Mantemos eles no payload com status 'suspenso' 
    // para que o histórico definitivo saiba que o tratamento foi descontinuado!
    const payloads = itens.map(it => ({
      consulta_id: consultaId,
      prontuario_id: prontuarioId,
      principio_ativo: it.principio_ativo,
      concentracao: it.concentracao || null,
      forma_farmaceutica: it.forma_farmaceutica || null,
      classe: it.classe || null,
      dose: it.doseQual || null,
      frequencia: formatarPosologia(it) || null,
      frequencia_tipo: it.frequenciaTipo,
      diario: it.diario || null,
      semanal: it.semanal || null,
      intervalo: it.intervalo || null,
      especial: it.especial || null,
      dose_qual: it.doseQual || null,
      duracao_tipo: it.duracao_tipo,
      duracao_valor: it.duracao_valor || null,
      duracao_texto: it.duracao_texto || null,
      observacoes: it.observacoes || null,
      status: it.acao_manutencao === 'suspender' ? 'suspenso' : 'ativo'
    }));

    salvando = true;
    try {
      const res = await apiFetch<any[]>('/api/v1/prescricoes/lote', accessToken, {
        method: 'POST',
        body: JSON.stringify(payloads)
      });

      // Recarrega os itens retornados garantindo a re-população do estado de suspensão
      itens = res.map(r => ({ 
        ...r, 
        salvo: true, 
        origem: 'novo', 
        acao_manutencao: r.status === 'suspenso' ? 'suspender' : 'continuar' 
      }));
      gravadoComSucesso = true;
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar lote de prescrições.");
    } finally {
      salvando = false;
    }
  }

  function removerLocal(idx: number) {
    itens.splice(idx, 1);
    gravadoComSucesso = false;
  }
</script>

<div class="space-y-5">
  <!-- SUB-HEADER -->
  <div class="flex items-center justify-between bg-slate-50 px-4 py-3 border border-slate-200 rounded-2xl">
    <div class="flex items-center gap-2">
      <Pill class="w-4 h-4 text-sky-600" />
      <span class="text-sm font-extrabold text-slate-700">Prescrição Estruturada</span>
    </div>
    {#if !readonly}
      <DialogoMedicamento 
        accessToken={accessToken || ''}
        onsave={handleAdicionarMedicamento}
        triggerClass="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all"
      />
    {/if}
  </div>

  <!-- BANNER DE SUGESTÕES DO SUBJETIVO -->
  {#if !readonly && sugestoesFiltradas.length > 0}
    <div class="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200">
       <div class="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wide mb-2">
         <Pill class="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
         Medicamentos Relatados pelo Paciente (no Subjetivo)
       </div>
       <p class="text-[11px] text-slate-500 mb-3">Clique em um item abaixo para adicioná-lo como prescrição ou mantê-lo em uso estruturado nesta consulta:</p>
       <div class="flex flex-wrap gap-2">
          {#each sugestoesFiltradas as sug}
            <button 
              type="button" 
              onclick={() => adicionarSugestao(sug)}
              class="bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 group"
            >
              <Plus class="w-3 h-3 text-indigo-400 group-hover:text-white" />
              {sug.principio_ativo} 
              {#if sug.concentracao}<span class="text-[10px] opacity-75">{sug.concentracao}</span>{/if}
            </button>
          {/each}
       </div>
    </div>
  {/if}

  <!-- CARDS LIST -->
  {#if carregando}
    <div class="flex items-center justify-center py-10 text-slate-400 gap-2 text-sm">
      <Loader2 class="w-5 h-5 animate-spin" /> Carregando histórico de tratamentos...
    </div>
  {:else if itens.length === 0}
    <div class="text-center py-12 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40 text-slate-400 text-sm">
      Nenhum medicamento prescrito. Comece a adicionar clicando no botão acima.
    </div>
  {:else}
    <div class="space-y-3">
      {#each itens as item, idx}
        <div 
          class="border rounded-2xl overflow-hidden shadow-xs bg-white flex flex-col md:flex-row 
                 {item.acao_manutencao === 'suspender' ? 'border-red-200 bg-red-50/20 opacity-75' : 'border-slate-200'}
                 {item.salvo ? 'border-emerald-100 bg-emerald-50/5' : ''}"
        >
          
          <!-- Left side: Med Info -->
          <div class="p-5 flex-1 flex flex-col justify-between gap-2">
            <div>
              <div class="flex items-center flex-wrap gap-2">
                <span class="text-base font-extrabold text-slate-900">
                  {item.principio_ativo} {item.concentracao || ''}
                </span>
                {#if item.forma_farmaceutica}
                  <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200/50">
                    {item.forma_farmaceutica}
                  </span>
                {/if}
                {#if item.origem === 'carryover'}
                  <span class="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                    Em Manutenção
                  </span>
                {/if}
                {#if item.salvo && gravadoComSucesso}
                  <span class="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full inline-flex items-center gap-0.5 animate-in fade-in duration-300">
                    <CheckCircle class="w-3 h-3" /> Gravado
                  </span>
                {/if}
              </div>
              
              <p class="text-sm font-medium text-slate-700 mt-2 flex items-center gap-1">
                <span class="font-bold text-slate-400 text-xs uppercase">Dose:</span>
                {formatarPosologia(item)}
              </p>
              <p class="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <span class="font-bold text-slate-400 uppercase text-[10px]">Duração:</span>
                {formatarDuracao(item)}
              </p>
              {#if item.observacoes}
                <p class="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-lg mt-2 max-w-prose italic">
                  "{item.observacoes}"
                </p>
              {/if}
            </div>
          </div>

          <!-- Right side: Action panel (Conditional based on Carryover / Novo / Readonly) -->
          <div class="border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center min-w-[180px] shrink-0">
            {#if readonly}
              <div class="text-slate-500 text-xs font-medium">Somente leitura</div>
            {:else if item.origem === 'carryover'}
              <!-- TRIO ACTIONS for Carryover -->
              <div class="flex gap-1">
                <button 
                  type="button"
                  onclick={() => { item.acao_manutencao = 'continuar'; gravadoComSucesso = false; }}
                  class="px-2 py-2 rounded-xl font-bold text-[10px] uppercase flex flex-col items-center gap-1 w-14 transition-colors
                         {item.acao_manutencao === 'continuar' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'hover:bg-slate-100 text-slate-400'}"
                >
                  <Check class="w-3.5 h-3.5" /> Manter
                </button>

                <DialogoMedicamento 
                  accessToken={accessToken || ''}
                  initialItem={item}
                  onsave={(med) => handleEditarMedicamento(idx, med)}
                  triggerClass="px-2 py-2 rounded-xl font-bold text-[10px] uppercase flex flex-col items-center gap-1 w-14 hover:bg-slate-100 transition-colors
                                {item.acao_manutencao === 'alterar' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'text-slate-400'}"
                >
                  <RefreshCw class="w-3.5 h-3.5" /> Ajustar
                </DialogoMedicamento>

                <button 
                  type="button"
                  onclick={() => { item.acao_manutencao = 'suspender'; gravadoComSucesso = false; }}
                  class="px-2 py-2 rounded-xl font-bold text-[10px] uppercase flex flex-col items-center gap-1 w-14 transition-colors
                         {item.acao_manutencao === 'suspender' ? 'bg-red-100 text-red-800 border border-red-200' : 'hover:bg-slate-100 text-slate-400'}"
                >
                  <X class="w-3.5 h-3.5" /> Parar
                </button>
              </div>
            {:else}
              <!-- NEW ITEM ACTIONS -->
              <div class="flex gap-2">
                <DialogoMedicamento 
                  accessToken={accessToken || ''}
                  initialItem={item}
                  onsave={(med) => handleEditarMedicamento(idx, med)}
                  triggerClass="p-2 hover:bg-slate-100 text-slate-500 hover:text-amber-600 rounded-xl transition-colors"
                >
                  <RefreshCw class="w-4 h-4" />
                </DialogoMedicamento>
                <button 
                  type="button" 
                  onclick={() => removerLocal(idx)}
                  class="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- SAVING ACTION -->
  {#if !readonly && !gravadoComSucesso && itens.length > 0}
    <div class="pt-4 flex justify-end border-t border-slate-100">
      <button
        type="button"
        onclick={salvarPrescricoes}
        disabled={salvando}
        class="px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm font-extrabold rounded-2xl shadow-md inline-flex items-center gap-2 transition-all"
      >
        {#if salvando}
          <Loader2 class="w-4 h-4 animate-spin" /> Gravando prescrições...
        {:else}
          <CheckCircle class="w-4 h-4" /> Gravar Prescrição Atualizada
        {/if}
      </button>
    </div>
  {/if}
</div>
