<script lang="ts">
  import { onMount } from 'svelte';
  import { PlusCircle, Loader2, GripVertical } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import BlocoAnamnese from './BlocoAnamnese.svelte';
  import ResumoBlocos from './ResumoBlocos.svelte';

  interface Props {
    consultaId: string;
    accessToken: string;
    readonly?: boolean;
    apiPrefix?: string;
  }

  let { 
    consultaId, 
    accessToken, 
    readonly = false, 
    apiPrefix = '/api/v1/anamnese' 
  }: Props = $props();

  let blocos = $state<any[]>([]);
  let carregando = $state(true);
  let salvando = $state<Record<string, boolean>>({});

  onMount(async () => {
    await carregarBlocos();
  });

  async function carregarBlocos() {
    try {
      carregando = true;
      const res = await apiFetch<any[]>(`${apiPrefix}/consulta/${consultaId}`, accessToken);
      blocos = res;
      
      // Se não existe nada, cria S1 automático
      if (blocos.length === 0 && !readonly) {
        await adicionarBloco('queixa', 'Queixa Principal');
      }
    } catch (e) {
      console.error("Erro carregar blocos", e);
    } finally {
      carregando = false;
    }
  }

  async function adicionarBloco(tipo: 'queixa' | 'comorbidade' = 'queixa', titulo: string = '') {
    try {
      const novo = await apiFetch<any>(`${apiPrefix}/`, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          consulta_id: consultaId,
          ordem: blocos.length + 1, // Backend recalcula por segurança
          tipo,
          titulo: titulo || undefined
        })
      });
      blocos.push(novo);
    } catch (e) {
      alert("Erro ao criar novo bloco");
    }
  }

  async function removerBloco(id: string) {
    try {
      await apiFetch(`${apiPrefix}/${id}`, accessToken, { method: 'DELETE' });
      // Recarrega lista completa para garantir ordenação correta re-feita pelo backend
      await carregarBlocos();
    } catch (e) {
      alert("Não foi possível remover.");
    }
  }

  // Map de timers debounce por ID do bloco
  const saveDebounces: Record<string, any> = {};

  function agendarSalvamento(blocoId: string) {
    if (readonly) return;
    salvando[blocoId] = true;
    
    if (saveDebounces[blocoId]) clearTimeout(saveDebounces[blocoId]);
    
    saveDebounces[blocoId] = setTimeout(async () => {
      await executarSave(blocoId);
    }, 3000); // 3s debounce
  }

  async function executarSave(blocoId: string) {
    const target = blocos.find(b => b.id === blocoId);
    if (!target) return;
    try {
      // Remove campos de ID do body, usa o schema update
      const { id, criado_em, atualizado_em, consulta_id, ordem, ...dadosUpdate } = target;
      await apiFetch(`${apiPrefix}/${blocoId}`, accessToken, {
        method: 'PUT',
        body: JSON.stringify(dadosUpdate)
      });
    } catch (e) {
      console.error("Erro ao salvar bloco", blocoId);
    } finally {
      salvando[blocoId] = false;
    }
  }


</script>

<div class="space-y-6 relative">
  {#if carregando}
    <div class="flex items-center justify-center py-12 text-slate-400 gap-2">
      <Loader2 class="w-6 h-6 animate-spin" />
      <span class="text-sm font-medium">Carregando anamnese...</span>
    </div>
  {:else}
    {#if blocos.length > 1}
      <ResumoBlocos {blocos} />
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {#each blocos as bloco, i (bloco.id)}
        <div class="relative group">

          <div class="flex-1 relative">
            <BlocoAnamnese
              bind:dados={blocos[i]}
              indice={i + 1}
              {accessToken}
              {readonly}
              removivel={i > 0}
              onchange={() => agendarSalvamento(bloco.id)}
              onremover={() => removerBloco(bloco.id)}
            />
            
            {#if salvando[bloco.id]}
              <div class="absolute top-2 right-12 flex items-center gap-1.5 bg-white/80 backdrop-blur px-2 py-1 rounded-lg border text-[10px] font-bold text-slate-500 shadow-sm">
                <Loader2 class="w-3 h-3 animate-spin text-indigo-500" /> Salvando...
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    {#if !readonly}
      <div class="pt-2 flex justify-center">
        <button 
          type="button"
          onclick={() => adicionarBloco()}
          class="flex flex-col items-center justify-center w-full max-w-lg p-6 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-3xl transition-all text-slate-400 hover:text-indigo-600 group"
        >
          <PlusCircle class="w-8 h-8 mb-2 opacity-70 group-hover:scale-110 transition-transform" />
          <span class="text-sm font-bold">Adicionar S{blocos.length + 1}</span>
          <span class="text-xs text-slate-500 mt-0.5">Nova queixa secundária ou comorbidade</span>
        </button>
      </div>
    {/if}
  {/if}
</div>
