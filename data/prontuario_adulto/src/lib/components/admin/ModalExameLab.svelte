<script lang="ts">
  import { X, Save, Loader2, Info } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { enhance } from '$app/forms';

  export interface ExameCatalogo {
    id?: string;
    material: string;
    pacote: string;
    nome: string;
    unidade: string | null;
    tipo_resultado: 'numerico' | 'qualitativo';
    ref_min: number | null;
    ref_max: number | null;
    ref_min_m: number | null;
    ref_max_m: number | null;
    ref_min_f: number | null;
    ref_max_f: number | null;
    ref_texto: string | null;
    significado?: string | null;
  }

  let {
    aberto = $bindable(false),
    exame = $bindable<Partial<ExameCatalogo>>({}),
    pacotes = [],
    onSalvo
  }: {
    aberto: boolean;
    exame: Partial<ExameCatalogo>;
    pacotes: string[];
    onSalvo: () => void;
  } = $props();

  let salvando = $state(false);
  let erroModal = $state<string | null>(null);
  let diferencaSexo = $state(false);

  $effect(() => {
    if (aberto) {
      erroModal = null;
      diferencaSexo = !!(exame.ref_min_m || exame.ref_max_m || exame.ref_min_f || exame.ref_max_f);
    }
  });
</script>

{#if aberto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
    <!-- Backdrop -->
    <button 
      type="button"
      aria-label="Fechar Modal"
      class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-default w-full border-none" 
      onclick={() => !salvando && (aberto = false)}
    ></button>

    <!-- Modal Container -->
    <div 
      class="bg-white w-full max-w-xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] z-10"
      transition:scale={{ start: 0.95, duration: 150 }}
    >
      <form 
        method="POST" 
        action="?/salvar" 
        use:enhance={() => {
          salvando = true;
          erroModal = null;
          return async ({ result, update }) => {
            salvando = false;
            if (result.type === 'success') {
              aberto = false;
              onSalvo();
              await update();
            } else if (result.type === 'failure') {
              erroModal = (result.data as any)?.erro ?? 'Erro desconhecido';
            }
          };
        }}
        class="flex flex-col overflow-hidden"
      >
        <!-- Hidden for Edit context -->
        {#if exame.id}
          <input type="hidden" name="id" value={exame.id} />
        {/if}

        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 class="text-lg font-bold text-slate-900">{exame.id ? 'Editar' : 'Novo'} Exame Laboratorial</h3>
            <p class="text-xs text-slate-500">Definições estruturadas para o catálogo.</p>
          </div>
          <button 
            type="button" 
            class="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors" 
            onclick={() => (aberto = false)}
            disabled={salvando}
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-6 overflow-y-auto space-y-5">
          
          {#if erroModal}
            <div class="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl mb-2 animate-in fade-in">
              {erroModal}
            </div>
          {/if}

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700">Material</label>
              <select name="material" bind:value={exame.material} required class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500">
                <option value="Sangue">Sangue</option>
                <option value="Urina">Urina</option>
                <option value="Fezes">Fezes</option>
                <option value="LCR">LCR</option>
                <option value="Swab">Swab</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700">Pacote / Grupo</label>
              <input 
                list="list-pacotes-modal" 
                type="text" 
                name="pacote"
                bind:value={exame.pacote} 
                placeholder="Ex: Hemograma"
                required
                class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500"
              />
              <datalist id="list-pacotes-modal">
                {#each pacotes as p}
                  <option value={p}></option>
                {/each}
              </datalist>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">Nome do Exame *</label>
            <input 
              type="text" 
              name="nome"
              bind:value={exame.nome} 
              placeholder="Ex: Hemoglobina Glicada"
              required
              class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 font-medium focus:ring-indigo-500"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700 flex items-center gap-1">
              Significado Clínico
              <span class="text-[10px] text-slate-400 font-normal">(Aparece como tooltip para o médico)</span>
            </label>
            <textarea
              name="significado"
              bind:value={exame.significado}
              rows="2"
              placeholder="Ex: Avalia o controle glicêmico nos últimos 3 meses. Valores elevados sugerem diabetes ou pré-diabetes."
              class="w-full text-sm border-slate-300 rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700">Tipo de Resultado</label>
              <div class="flex items-center gap-4 mt-2">
                <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="tipo_resultado" bind:group={exame.tipo_resultado} value="numerico" class="text-indigo-600"/>
                  Numérico
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name="tipo_resultado" bind:group={exame.tipo_resultado} value="qualitativo" class="text-indigo-600"/>
                  Qualitativo
                </label>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700">Unidade</label>
              <input 
                type="text" 
                name="unidade"
                bind:value={exame.unidade} 
                placeholder="Ex: mg/dL"
                class="w-full text-sm border-slate-300 rounded-lg py-2 px-3"
              />
            </div>
          </div>

          <div class="border-t border-dashed border-slate-200 pt-4">
            {#if exame.tipo_resultado === 'numerico'}
              <div class="space-y-4 animate-in slide-in-from-bottom-2 duration-200">
                <div class="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg">
                  <span class="text-xs font-medium text-slate-600 flex items-center gap-1"><Info class="w-3.5 h-3.5"/> Referências variam por sexo?</span>
                  <input type="checkbox" bind:checked={diferencaSexo} class="rounded text-indigo-600"/>
                </div>

                {#if !diferencaSexo}
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-500 uppercase">Min Global</label>
                      <input type="number" step="any" name="ref_min" bind:value={exame.ref_min} class="w-full text-sm border-slate-300 rounded-lg py-1.5" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[10px] font-bold text-slate-500 uppercase">Max Global</label>
                      <input type="number" step="any" name="ref_max" bind:value={exame.ref_max} class="w-full text-sm border-slate-300 rounded-lg py-1.5" />
                    </div>
                  </div>
                {:else}
                  <div class="grid grid-cols-2 gap-4 animate-in fade-in">
                    <div class="p-3 border border-blue-100 bg-blue-50/30 rounded-xl space-y-2">
                      <span class="text-xs font-bold text-blue-600 uppercase">Masculino ♂</span>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="number" step="any" name="ref_min_m" placeholder="Min" bind:value={exame.ref_min_m} class="w-full text-xs border-slate-300 rounded py-1" />
                        <input type="number" step="any" name="ref_max_m" placeholder="Max" bind:value={exame.ref_max_m} class="w-full text-xs border-slate-300 rounded py-1" />
                      </div>
                    </div>
                    <div class="p-3 border border-pink-100 bg-pink-50/30 rounded-xl space-y-2">
                      <span class="text-xs font-bold text-pink-600 uppercase">Feminino ♀</span>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="number" step="any" name="ref_min_f" placeholder="Min" bind:value={exame.ref_min_f} class="w-full text-xs border-slate-300 rounded py-1" />
                        <input type="number" step="any" name="ref_max_f" placeholder="Max" bind:value={exame.ref_max_f} class="w-full text-xs border-slate-300 rounded py-1" />
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="space-y-1 animate-in fade-in">
                <label class="text-xs font-semibold text-slate-700">Referência Textual Esperada</label>
                <input 
                  type="text" 
                  name="ref_texto"
                  bind:value={exame.ref_texto} 
                  placeholder="Ex: Não Reagente, Negativo"
                  class="w-full text-sm border-slate-300 rounded-lg py-2 px-3"
                />
              </div>
            {/if}
          </div>
        </div>

        <!-- Footer Action -->
        <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30 rounded-b-2xl">
          <button 
            type="button" 
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800" 
            onclick={() => (aberto = false)}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-60" 
            disabled={salvando}
          >
            {#if salvando}
              <Loader2 class="w-4 h-4 animate-spin"/> Salvando...
            {:else}
              <Save class="w-4 h-4" /> Salvar Exame
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
