<script lang="ts">
  import { X, Save, Loader2 } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  interface Props {
    aberto: boolean;
    item: any;
    formas?: string[];
    salvando?: boolean;
    onsave: (d: any) => void;
  }

  let { 
    aberto = $bindable(false), 
    item = $bindable({}), 
    formas = [], 
    salvando = false, 
    onsave 
  }: Props = $props();

  let local = $state<any>({});

  $effect(() => {
    if (aberto) {
      local = {
        fornecimento_sus: 'Não incluso',
        ativo: true,
        ...item
      };
    }
  });

  function submit() {
    if (!local.principio_ativo) return alert("Princípio Ativo é obrigatório.");
    if (!local.concentracao) return alert("Concentração é obrigatória.");
    if (!local.forma_farmaceutica) return alert("Forma Farmacêutica é obrigatória.");
    
    onsave(local);
  }
</script>

{#if aberto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick={() => !salvando && (aberto = false)}></div>

    <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]" transition:scale={{ start: 0.95, duration: 150 }}>
      <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{local.id ? 'Editar' : 'Novo'} Medicamento</h3>
          <p class="text-xs text-slate-500">Configure a apresentação padrão deste medicamento.</p>
        </div>
        <button type="button" class="p-2 text-slate-400 hover:text-slate-600 rounded-full" onclick={() => (aberto = false)} disabled={salvando}>
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto">
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Princípio Ativo *</label>
          <input type="text" bind:value={local.principio_ativo} placeholder="Ex: Losartana Potássica" class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 font-bold focus:ring-indigo-500" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Concentração *</label>
            <input type="text" bind:value={local.concentracao} placeholder="Ex: 50 mg" class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500" required />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Forma Farmacêutica *</label>
            <input list="formas-list" type="text" bind:value={local.forma_farmaceutica} placeholder="Ex: Comprimido" class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500" required />
            <datalist id="formas-list">
              {#each formas as f}<option value={f} />{/each}
            </datalist>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Unidade Fornecimento</label>
            <input type="text" bind:value={local.unidade_fornecimento} placeholder="Ex: 1 Comprimido" class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500" />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Fornecimento SUS</label>
            <select bind:value={local.fornecimento_sus} class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500">
              <option value="Não incluso">Não incluso</option>
              <option value="BÁSICO">BÁSICO</option>
              <option value="ESPECIALIZADO">ESPECIALIZADO</option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Classe Terapêutica</label>
          <input type="text" bind:value={local.classe_terapeutica} placeholder="Ex: Anti-hipertensivo" class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500" />
        </div>
      </div>

      <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30 rounded-b-2xl">
        <button type="button" class="px-4 py-2 text-sm font-medium text-slate-600" onclick={() => (aberto = false)} disabled={salvando}>Cancelar</button>
        <button type="button" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2" onclick={submit} disabled={salvando}>
          {#if salvando}
            <Loader2 class="w-4 h-4 animate-spin" /> Salvando...
          {:else}
            <Save class="w-4 h-4" /> Salvar
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
