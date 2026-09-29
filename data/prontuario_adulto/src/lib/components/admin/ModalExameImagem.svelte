<script lang="ts">
  import { X, Save, Loader2 } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  export interface ExameImagem {
    id?: string;
    categoria: string;
    sigla: string | null;
    nome: string;
    descricao: string | null;
  }

  let {
    aberto = $bindable(false),
    exame = $bindable<Partial<ExameImagem>>({}),
    categorias = [],
    salvando = false,
    onsave
  }: {
    aberto: boolean;
    exame: Partial<ExameImagem>;
    categorias: string[];
    salvando?: boolean;
    onsave: (dados: any) => void;
  } = $props();

  let localData = $state<Partial<ExameImagem>>({});

  $effect(() => {
    if (aberto) {
      localData = { ...exame };
    }
  });

  function submit() {
    if (!localData.nome || !localData.categoria) return alert("Nome e categoria são obrigatórios.");
    onsave(localData);
  }

  function autoUpperSigla(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    localData.sigla = val.toUpperCase().substring(0, 6);
  }
</script>

{#if aberto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick={() => !salvando && (aberto = false)}></div>

    <div 
      class="bg-white w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col"
      transition:scale={{ start: 0.95, duration: 150 }}
    >
      <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{localData.id ? 'Editar' : 'Novo'} Exame de Imagem</h3>
          <p class="text-xs text-slate-500">Cadastre exames de imagem ou funcionais.</p>
        </div>
        <button type="button" class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100" onclick={() => (aberto = false)} disabled={salvando}>
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4 flex-1">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2 space-y-1">
            <label class="text-xs font-semibold text-slate-700">Categoria *</label>
            <input list="cats-list" type="text" bind:value={localData.categoria} placeholder="Ex: Ultrassonografia" class="w-full text-sm border-slate-300 rounded-lg px-3 py-2" />
            <datalist id="cats-list">
              {#each categorias as c}<option value={c}/>{/each}
            </datalist>
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Sigla</label>
            <input type="text" value={localData.sigla || ''} oninput={autoUpperSigla} placeholder="USG" class="w-full text-sm border-slate-300 rounded-lg px-3 py-2 font-mono uppercase" />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Nome Completo *</label>
          <input type="text" bind:value={localData.nome} placeholder="USG de Abdome Total" class="w-full text-sm border-slate-300 rounded-lg px-3 py-2 font-medium" required />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Descrição (opcional)</label>
          <textarea bind:value={localData.descricao} placeholder="Instruções de preparo, etc." class="w-full text-sm border-slate-300 rounded-lg px-3 py-2 h-24 resize-none"></textarea>
        </div>
      </div>

      <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30 rounded-b-2xl">
        <button type="button" class="px-4 py-2 text-sm text-slate-600 font-medium" onclick={() => (aberto = false)} disabled={salvando}>Cancelar</button>
        <button type="button" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2" onclick={submit} disabled={salvando}>
          {#if salvando}<Loader2 class="w-4 h-4 animate-spin"/>{:else}<Save class="w-4 h-4" />{/if} Salvar
        </button>
      </div>
    </div>
  </div>
{/if}
