<script lang="ts">
  import { Calendar, Pill, Baby, Flower } from 'lucide-svelte';

  let { dados = $bindable(), readonly = false, onchange } = $props();

  // Inicialização segura
  if (!dados.historia_ginecologica) {
    dados.historia_ginecologica = {
      g: "", p: "", n: "", c: "", a: "", e: "",
      dum: "",
      mac: "",
      outros_detalhes: ""
    };
  }

  let hg = $derived(dados.historia_ginecologica);

  function handleInput() {
    onchange?.();
  }
</script>

<section class="rounded-2xl border border-slate-200 bg-slate-50/30 overflow-hidden shadow-sm">
  <div class="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-rose-50 rounded-xl text-rose-600">
        <Flower class="w-5 h-5" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-slate-900">História Ginecológica e Obstétrica</h3>
        <p class="text-xs text-slate-500">Antecedentes obstétricos, DUM e métodos contraceptivos.</p>
      </div>
    </div>
  </div>

  <div class="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/50">
    
    <!-- Índices Obstétricos (G P N C A E) -->
    <div class="md:col-span-6 bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3 hover:border-rose-200 transition-all">
      <div class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
        <Baby class="w-4 h-4 text-rose-500" />
        Índices Obstétricos (GPNCAE)
      </div>

      <div class="grid grid-cols-6 gap-2">
        {#each [
          { key: "g", label: "G", title: "Gestações" },
          { key: "p", label: "P", title: "Partos" },
          { key: "n", label: "N", title: "Partos Normais / Nascidos" },
          { key: "c", label: "C", title: "Cesáreas" },
          { key: "a", label: "A", title: "Abortos" },
          { key: "e", label: "E", title: "Ectópicas" }
        ] as item}
          <div class="flex flex-col items-center gap-1" title={item.title}>
            <label class="text-xs font-black text-slate-500">{item.label}</label>
            <input 
              type="number" 
              min="0"
              bind:value={hg[item.key]} 
              oninput={handleInput}
              disabled={readonly}
              placeholder="0"
              class="w-full text-center bg-slate-50 border border-slate-250 rounded-xl py-2.5 px-1 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        {/each}
      </div>
      <p class="text-[10px] text-slate-400 text-center italic pt-1">G = Gestações, P = Partos, N = Normais, C = Cesáreas, A = Abortos, E = Ectópicas</p>
    </div>

    <!-- DUM e MAC -->
    <div class="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      
      <!-- DUM -->
      <div class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all">
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
            <Calendar class="w-4 h-4 text-indigo-500" />
            DUM
          </label>
          
          <div class="pt-1">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Data da Última Menstruação</label>
            <input 
              type="date" 
              bind:value={hg.dum} 
              oninput={handleInput}
              disabled={readonly}
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 focus:bg-white transition-all font-semibold"
            />
          </div>
        </div>
      </div>

      <!-- MAC -->
      <div class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-rose-200 transition-all">
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
            <Pill class="w-4 h-4 text-emerald-500" />
            MAC
          </label>
          
          <div class="pt-1">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Método Anticoncepcional</label>
            <input 
              type="text" 
              bind:value={hg.mac} 
              oninput={handleInput}
              disabled={readonly}
              placeholder="Ex: ACO, DIU, Nega, Preservativo..."
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50 focus:bg-white transition-all font-semibold"
            />
          </div>
        </div>
      </div>

    </div>

    <!-- Observações adicionais (opcional) -->
    <div class="md:col-span-12 space-y-1.5 mt-1">
      <label class="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-1">Outras informações ginecológicas (Menarca, Menopausa, Ciclo...)</label>
      <textarea
        bind:value={hg.outros_detalhes}
        oninput={handleInput}
        disabled={readonly}
        rows="2"
        placeholder="Descreva menarca, ciclos menstruais, menopausa ou outras queixas ginecológicas se necessário..."
        class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
      ></textarea>
    </div>

  </div>
</section>
