<script lang="ts">
  import { onMount } from 'svelte';
  import { X, Edit, ClipboardList, History, CalendarDays, FileEdit } from 'lucide-svelte';
  import BuscaCid10 from '$lib/components/cid10/BuscaCid10.svelte';
  import { fade, slide } from 'svelte/transition';

  interface Props {
    dados: any;
    indice: number;
    accessToken: string;
    readonly?: boolean;
    removivel?: boolean;
    onchange?: () => void;
    onremover?: () => void;
  }

  let { 
    dados = $bindable(), 
    indice, 
    accessToken, 
    readonly = false, 
    removivel = false,
    onchange, 
    onremover 
  }: Props = $props();

  // Bridge entre as propriedades soltas (cid_subcat/descricao) e o objeto esperado pela BuscaCid10
  let cidSelecionado = $state<any>(null);
  let editModalAberto = $state(false);

  // Inicializa o bridge se já houver dado no bootstrap
  onMount(() => {
    if (dados.cid_subcat && !cidSelecionado) {
      cidSelecionado = {
        subcat: dados.cid_subcat,
        subcat_desc: dados.cid_descricao || ''
      };
    }
  });

  // Quando muda localmente o CID selecionado pelo widget, propaga para 'dados'
  $effect(() => {
     if (cidSelecionado) {
        if (dados.cid_subcat !== cidSelecionado.subcat) {
           dados.cid_subcat = cidSelecionado.subcat;
           dados.cid_descricao = cidSelecionado.subcat_desc;
           onchange?.();
        }
     } else {
        if (dados.cid_subcat) {
           dados.cid_subcat = null;
           dados.cid_descricao = null;
           onchange?.();
        }
     }
  });

  // Abre o modal de edição
  function abrirEdicao() {
    editModalAberto = true;
  }

  // Helper para pegar o preview de texto
  function getPreview(texto: string, maxLength = 100): string {
    if (!texto) return "Não preenchido.";
    if (texto.length <= maxLength) return texto;
    return texto.slice(0, maxLength) + "...";
  }
</script>

<!-- CARTÃO COMPACTO -->
<div class="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all group flex flex-col h-full">
  <div class="p-4 flex items-start gap-3 flex-1">
    <!-- Badge Lateral do Índice -->
    <div class="shrink-0 flex flex-col items-center gap-1.5">
      <span class="flex items-center justify-center w-10 h-10 bg-amber-600 text-white rounded-xl font-mono font-extrabold shadow-sm text-sm">
        S{indice}
      </span>
      {#if !readonly}
        <button 
          type="button"
          onclick={abrirEdicao}
          title="Editar Detalhes"
          class="p-2 bg-white border border-slate-200 text-slate-500 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 rounded-lg shadow-sm transition-all shrink-0"
        >
          <Edit class="w-4 h-4" />
        </button>
      {/if}
    </div>

    <!-- Conteúdo Resumido -->
    <div class="flex-1 min-w-0 space-y-2.5 cursor-pointer" onclick={abrirEdicao}>
      <!-- Título do Bloco -->
      <div class="flex items-start justify-between gap-2">
        <h4 class="font-bold text-slate-800 text-base leading-tight truncate py-0.5 flex-1">
          {dados.titulo || 'Sem Título'}
        </h4>
        {#if removivel && !readonly}
          <button 
            type="button"
            onclick={(e) => { e.stopPropagation(); if(confirm(`Deseja remover o bloco S${indice}?`)) onremover?.(); }}
            class="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Remover"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        {/if}
      </div>

      <!-- CID Badge -->
      {#if dados.cid_subcat}
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold font-mono shadow-sm max-w-full overflow-hidden">
          <span class="shrink-0 px-1 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-black">{dados.cid_subcat}</span>
          <span class="truncate">{dados.cid_descricao}</span>
        </div>
      {:else}
        <div class="inline-block px-2 py-0.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-semibold tracking-wider uppercase border border-transparent">
          Sem CID Vinculado
        </div>
      {/if}

      <!-- Previews Textuais Expansíveis -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div class="space-y-0.5 text-left flex flex-col">
          <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <History class="w-2.5 h-2.5 text-slate-400" /> Histórico
          </span>
          <div class="text-xs text-slate-600 leading-relaxed break-words bg-slate-50/50 p-2 rounded border border-dashed border-slate-200 min-h-[2.5rem] whitespace-pre-wrap flex-1">
            {dados.historico_texto || "Não preenchido."}
          </div>
        </div>
        <div class="space-y-0.5 text-left flex flex-col">
          <span class="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <CalendarDays class="w-2.5 h-2.5 text-amber-400" /> Queixa Atual
          </span>
          <div class="text-xs text-slate-600 leading-relaxed break-words bg-amber-50/30 p-2 rounded border border-dashed border-amber-100 min-h-[2.5rem] whitespace-pre-wrap flex-1">
            {dados.queixa_atual_texto || "Não preenchido."}
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- MODAL DE EDIÇÃO COMPLETO -->
{#if editModalAberto}
  <div 
    class="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    onclick={(e) => { if (e.target === e.currentTarget) editModalAberto = false; }}
    onkeydown={(e) => { if (e.key === 'Escape') editModalAberto = false; }}
  >
    <div 
      transition:slide={{ duration: 250 }}
      class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100"
    >
      <!-- Header Modal -->
      <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center w-10 h-10 bg-amber-600 text-white rounded-xl font-mono font-black shadow-sm">
            S{indice}
          </span>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <FileEdit class="w-4 h-4 text-amber-600" />
              Detalhes da Queixa / Demanda
            </h4>
            <p class="text-xs text-slate-500">Histórico e evolução clínica para esta queixa.</p>
          </div>
        </div>
        <button 
          type="button" 
          onclick={() => editModalAberto = false} 
          class="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Conteúdo Formulário (Scrollable) -->
      <div class="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
        
        <!-- Título e CID Row -->
        <div class="grid grid-cols-1 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Título da Demanda</label>
            <input 
              type="text" 
              bind:value={dados.titulo}
              oninput={() => onchange?.()}
              disabled={readonly}
              placeholder="Título descritivo (Ex: Hipertensão Arterial, Lombalgia...)"
              class="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-250 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white outline-none transition-all shadow-sm"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Vincular Código CID-10 (opcional)</label>
            <div class="relative">
              <BuscaCid10 
                {accessToken} 
                bind:selecionado={cidSelecionado} 
                disabled={readonly}
                placeholder="Buscar doença no catálogo CID-10..."
              />
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 my-1"></div>

        <!-- Histórico Clínico -->
        <div class="space-y-2">
          <label class="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
             <div class="p-1 bg-slate-100 text-slate-600 rounded">
               <History class="w-3.5 h-3.5" />
             </div>
             Histórico da Condição
          </label>
          <textarea
            bind:value={dados.historico_texto}
            oninput={() => onchange?.()}
            disabled={readonly}
            rows="6"
            placeholder="Ex: Paciente refere que iniciou os sintomas há... Fez tratamentos prévios com... Tem histórico familiar positivo para..."
            class="w-full p-4 bg-slate-50/50 border border-slate-250 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white outline-none resize-y transition-all shadow-sm"
          ></textarea>
        </div>

        <!-- Queixas Atuais / Evolução -->
        <div class="space-y-2">
          <label class="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
             <div class="p-1 bg-amber-100 text-amber-600 rounded">
               <ClipboardList class="w-3.5 h-3.5" />
             </div>
             Queixa Atual e Evolução
          </label>
          <textarea
            bind:value={dados.queixa_atual_texto}
            oninput={() => onchange?.()}
            disabled={readonly}
            rows="6"
            placeholder="Ex: Apresentou piora do quadro há 3 dias com dor de forte intensidade... Nega outros sintomas associados..."
            class="w-full p-4 bg-slate-50/50 border border-slate-250 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white outline-none resize-y transition-all shadow-sm"
          ></textarea>
        </div>

      </div>

      <!-- Footer -->
      <div class="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end shrink-0">
        <button 
          type="button"
          onclick={() => editModalAberto = false}
          class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
        >
          Fechar e Salvar
        </button>
      </div>

    </div>
  </div>
{/if}
