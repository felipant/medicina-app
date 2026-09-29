<script lang="ts">
  import { Plus, Trash2, Users } from 'lucide-svelte';

  let { dados = $bindable(), readonly = false, onchange } = $props();

  const options = [
    { id: "dm1", label: "DM1" },
    { id: "dm2", label: "DM2" },
    { id: "has", label: "HAS" },
    { id: "dac", label: "DAC" },
    { id: "ave", label: "AVE" },
    { id: "dislipidemia", label: "Dislipidemia" },
    { id: "cancer", label: "Câncer" },
    { id: "colelitiase", label: "Colelitíase" },
    { id: "varizes", label: "Varizes" },
    { id: "outros", label: "Outros" }
  ];

  const parentesList = [
    "Mãe", "Pai", "Irmão", "Irmã", "Filha", "Filho", 
    "Avó materna", "Avó paterna", "Avô materno", "Avô paterno", 
    "Tia materna", "Tia paterna", "Tio materno", "Tio paterno"
  ];

  if (!dados.historia_familiar) {
    const empty: Record<string, any> = {};
    options.forEach(opt => {
      empty[opt.id] = { checked: false, parentes: [{ id: crypto.randomUUID(), parentesco: "", idade: "", detalhes: "" }] };
    });
    dados.historia_familiar = empty;
  }

  function addRelative(optId: string) {
    dados.historia_familiar[optId].parentes = [
      ...dados.historia_familiar[optId].parentes,
      { id: crypto.randomUUID(), parentesco: "", idade: "", detalhes: "" }
    ];
    onchange();
  }

  function removeRelative(optId: string, relId: string) {
    if (dados.historia_familiar[optId].parentes.length <= 1) return;
    dados.historia_familiar[optId].parentes = dados.historia_familiar[optId].parentes.filter((r: any) => r.id !== relId);
    onchange();
  }
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-sm">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none bg-white border-b border-slate-200 flex items-center gap-2">
    <Users class="w-4 h-4 text-indigo-600" />
    História Familiar
  </summary>
  
  <div class="grid gap-4 p-4 lg:grid-cols-2">
    {#each options as opt}
      {@const item = dados.historia_familiar[opt.id] || { checked: false, parentes: [] }}
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-200">
        <div class="flex items-center justify-between gap-2 pb-1 border-b border-slate-50">
          <label class="flex items-center gap-2 text-sm font-extrabold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              bind:checked={dados.historia_familiar[opt.id].checked}
              onchange={onchange}
              disabled={readonly}
              class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 transition-all"
            />
            {opt.label}
          </label>
          {#if item.checked && !readonly}
            <button
              type="button"
              onclick={() => addRelative(opt.id)}
              class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm"
              title="Adicionar outro parente"
            >
              <Plus class="w-3.5 h-3.5" />
            </button>
          {/if}
        </div>

        {#if item.checked}
          <div class="mt-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
            {#each item.parentes as relative (relative.id)}
              <div class="rounded-xl border border-slate-200 bg-slate-50/30 p-2.5 space-y-2 shadow-inner">
                <div class="grid gap-2 sm:grid-cols-[1.2fr_0.8fr_auto] items-end">
                  <label class="space-y-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Parente Próximo</span>
                    <select
                      bind:value={relative.parentesco}
                      onchange={onchange}
                      disabled={readonly}
                      class="w-full font-semibold rounded-xl border border-slate-250 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {#each parentesList as parente}
                        <option value={parente}>{parente}</option>
                      {/each}
                      <option value="Outro">Outro parente</option>
                    </select>
                  </label>
                  
                  <label class="space-y-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Idade / Info</span>
                    <input
                      bind:value={relative.idade}
                      oninput={onchange}
                      disabled={readonly}
                      placeholder="Ex: 65 anos"
                      class="w-full font-semibold rounded-xl border border-slate-250 bg-white px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
                    />
                  </label>
                  
                  <button
                    type="button"
                    onclick={() => removeRelative(opt.id, relative.id)}
                    disabled={readonly || item.parentes.length <= 1}
                    class="rounded-xl text-slate-300 hover:text-red-600 hover:bg-white p-2 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-30"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>

                <!-- CONDICIONAL CÂNCER: ABRIR CAMPO TIPO DE CÂNCER -->
                {#if opt.id === "cancer"}
                  <div class="animate-in slide-in-from-top-1 duration-200">
                    <label class="block space-y-1 text-[9px] font-black text-amber-700 uppercase tracking-wider pl-0.5">
                      <span>Tipo / Sítio Primário do Câncer</span>
                      <input
                        type="text"
                        bind:value={relative.detalhes}
                        oninput={onchange}
                        disabled={readonly}
                        placeholder="Ex: Mama, Próstata, Cólon, Pulmão..."
                        class="w-full font-semibold rounded-xl border border-amber-200 bg-amber-50/20 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 shadow-sm transition-all"
                      />
                    </label>
                  </div>
                {/if}
              </div>
            {/each}
            
            {#if opt.id === "outros"}
              <label class="block space-y-1 text-[10px] font-black text-slate-500 uppercase tracking-wider mt-2">
                <span>Especificar Outras Doenças</span>
                <input
                  bind:value={dados.historia_familiar[opt.id].detalhes}
                  oninput={onchange}
                  disabled={readonly}
                  class="w-full font-semibold rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Ex: Doença autoimune, hipotireoidismo..."
                />
              </label>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</details>
