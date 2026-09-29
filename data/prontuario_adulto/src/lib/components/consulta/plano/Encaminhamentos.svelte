<script lang="ts">
  import { apiFetch } from '$lib/api';
  import { onMount } from 'svelte';
  import { Printer, Trash2, Plus, FileText, Loader2, CheckCircle } from 'lucide-svelte';
  import BuscaEspecialidade from '../../especialidades/BuscaEspecialidade.svelte';
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

  interface EncaminhamentoUI {
    id?: string;
    especialidade_id?: string;
    especialidade_nome: string;
    categoria: string;
    motivo: string;
    historia_resumida: string;
    exames_relevantes: string;
    hipotese_diagnostica: string;
    urgencia: string;
    observacoes: string;
    salvando?: boolean;
    salvo?: boolean;
    // For local selection state
    _especialidadeObj?: any;
  }

  let lista = $state<EncaminhamentoUI[]>([]);
  let carregando = $state(false);

  onMount(async () => {
    if (!consultaId || !accessToken) return;
    carregando = true;
    try {
      const res = await apiFetch<EncaminhamentoUI[]>(
        `/api/v1/encaminhamentos/consulta/${consultaId}`,
        accessToken
      );
      lista = (res || []).map(item => ({
        ...item,
        salvo: true,
        _especialidadeObj: { nome: item.especialidade_nome, id: item.especialidade_id, categoria: item.categoria }
      }));
    } catch (e) {
      console.error("Erro ao listar encaminhamentos:", e);
    } finally {
      carregando = false;
    }
  });

  function add() {
    lista.push({
      especialidade_nome: '',
      categoria: 'outro',
      motivo: '',
      historia_resumida: '',
      exames_relevantes: '',
      hipotese_diagnostica: '',
      urgencia: 'eletivo',
      observacoes: '',
      salvo: false
    });
  }

  function handleEspecialidadeChange(idx: number, obj: any) {
    if (!obj) return;
    lista[idx].especialidade_id = obj.id;
    lista[idx].especialidade_nome = obj.nome;
    lista[idx].categoria = obj.categoria;
  }

  async function salvar(idx: number) {
    const enc = lista[idx];
    if (!enc.especialidade_nome || !enc.motivo) {
      alert("Preencha a especialidade e o motivo do encaminhamento.");
      return;
    }
    if (!accessToken || !consultaId) return;

    enc.salvando = true;
    try {
      const payload = {
        consulta_id: consultaId,
        prontuario_id: prontuarioId,
        paciente_id: pacienteId,
        especialidade_id: enc.especialidade_id || null,
        especialidade_nome: enc.especialidade_nome,
        categoria: enc.categoria,
        motivo: enc.motivo,
        historia_resumida: enc.historia_resumida || null,
        exames_relevantes: enc.exames_relevantes || null,
        hipotese_diagnostica: enc.hipotese_diagnostica || null,
        urgencia: enc.urgencia,
        observacoes: enc.observacoes || null
      };

      const res = await apiFetch<any>('/api/v1/encaminhamentos', accessToken, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      lista[idx] = {
        ...lista[idx],
        id: res.id,
        salvo: true,
        salvando: false
      };
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar encaminhamento.");
      enc.salvando = false;
    }
  }

  function removerLocal(idx: number) {
    lista.splice(idx, 1);
  }

  function getPdfUrl(id: string) {
    return `${PUBLIC_API_URL}/api/v1/encaminhamentos/${id}/pdf`;
  }
</script>

<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
  <div class="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between font-semibold text-slate-800">
    <div class="flex items-center gap-3">
      <FileText class="w-5 h-5 text-violet-600" />
      Encaminhamentos Clínicos
    </div>
    {#if !readonly}
      <button 
        type="button" 
        onclick={add} 
        class="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-xl font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" />
        Novo Encaminhamento
      </button>
    {/if}
  </div>

  <div class="p-6 space-y-6">
    {#if carregando}
      <div class="py-8 flex justify-center text-slate-400 gap-2 items-center text-sm">
        <Loader2 class="w-5 h-5 animate-spin" />
        Carregando encaminhamentos...
      </div>
    {:else if lista.length === 0}
      <div class="py-8 text-center text-slate-400 text-sm">
        Nenhum encaminhamento solicitado para esta consulta.
      </div>
    {:else}
      {#each lista as enc, idx}
        <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50/30 relative">
          <!-- Status Pill -->
          {#if enc.salvo}
            <span class="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full z-10 shadow-xs">
              <CheckCircle class="w-3 h-3" /> Gravado
            </span>
          {/if}

          <div class="p-5 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600">Especialidade de Destino *</label>
                <BuscaEspecialidade 
                  {accessToken}
                  bind:selecionado={enc._especialidadeObj}
                  disabled={readonly || enc.salvo}
                  onchange={() => handleEspecialidadeChange(idx, enc._especialidadeObj)}
                  placeholder="Digite a especialidade (ex: Cardiologia)" 
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600">Urgência</label>
                <div class="flex gap-2">
                  {#each ['eletivo', 'prioritario', 'urgente'] as opt}
                    <button
                      type="button"
                      disabled={readonly || enc.salvo}
                      onclick={() => enc.urgencia = opt}
                      class="text-xs px-3 py-2 border rounded-xl font-semibold capitalize transition-all
                             {enc.urgencia === opt 
                               ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                               : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}"
                    >
                      {opt}
                    </button>
                  {/each}
                </div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-600">Motivo do Encaminhamento *</label>
              <textarea 
                bind:value={enc.motivo} 
                rows="2" 
                placeholder="Descreva detalhadamente o motivo do encaminhamento para o especialista..."
                disabled={readonly || enc.salvo}
                class="w-full text-sm border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600">História Clínica Resumida (Opcional)</label>
                <textarea 
                  bind:value={enc.historia_resumida} 
                  rows="2" 
                  placeholder="Resumo das comorbidades, tratamentos ou histórico..."
                  disabled={readonly || enc.salvo}
                  class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
                ></textarea>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-slate-600">Hipótese Diagnóstica (Opcional)</label>
                <input 
                  type="text"
                  bind:value={enc.hipotese_diagnostica} 
                  placeholder="CID ou hipótese que levou ao encaminhamento"
                  disabled={readonly || enc.salvo}
                  class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-slate-600">Exames Relevantes / Observações</label>
              <input 
                type="text"
                bind:value={enc.exames_relevantes} 
                placeholder="Ex: ECG normal, Creatinina 1.2..."
                disabled={readonly || enc.salvo}
                class="w-full text-sm border-slate-200 rounded-xl shadow-sm"
              />
            </div>
          </div>

          <!-- Footer / Actions inside card -->
          <div class="bg-slate-100/50 border-t border-slate-200 px-5 py-3.5 flex items-center gap-3">
            {#if !enc.salvo}
              <button 
                type="button" 
                onclick={() => salvar(idx)} 
                disabled={enc.salvando}
                class="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {#if enc.salvando}
                  <Loader2 class="w-3.5 h-3.5 animate-spin" /> Gravando...
                {:else}
                  Salvar Encaminhamento
                {/if}
              </button>
              
              <button 
                type="button" 
                onclick={() => removerLocal(idx)} 
                class="text-slate-400 hover:text-red-500 transition-colors ml-auto"
                title="Descartar rascunho"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            {:else}
              <!-- Print/PDF for saved referral -->
              <a 
                href={getPdfUrl(enc.id!)}
                target="_blank"
                class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Printer class="w-3.5 h-3.5" />
                Imprimir Encaminhamento (PDF)
              </a>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
