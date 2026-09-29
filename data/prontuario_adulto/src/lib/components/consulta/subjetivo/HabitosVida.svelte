<script lang="ts">
  import { Leaf, Wine, Flame, Compass, ClipboardList } from 'lucide-svelte';
  
  let { dados = $bindable(), readonly = false, onchange } = $props();

  // Inicialização segura da estrutura de dados dentro de dados_subjetivo
  if (!dados.habitos_vida) {
    dados.habitos_vida = {
      etilismo: "",
      etilismo_doses: "",
      tabagismo: "",
      tabagismo_macos: "",
      tabagismo_tempo: "",
      drogadismo: "",
      drogadismo_detalhes: "",
      recordatorio_alimentar: "",
      recordatorio_refinado: {
        cafe_manha: "",
        lanche_manha: "",
        almoco: "",
        lanche_tarde: "",
        cafe_tarde: "",
        lanche_pre_jantar: "",
        jantar: "",
        lanche_dormir: ""
      },
      atividade_fisica: "",
      sono: ""
    };
  }

  // Garante compatibilidade se objeto existe mas sem o refinado
  if (dados.habitos_vida && !dados.habitos_vida.recordatorio_refinado) {
     dados.habitos_vida.recordatorio_refinado = {
        cafe_manha: "", lanche_manha: "", almoco: "", lanche_tarde: "",
        cafe_tarde: "", lanche_pre_jantar: "", jantar: "", lanche_dormir: ""
     };
  }

  // Alias para simplificar o binding
  let hv = $derived(dados.habitos_vida);

  function handleInput() {
    onchange?.();
  }
</script>

<section class="rounded-2xl border border-slate-200 bg-slate-50/30 overflow-hidden shadow-sm">
  <div class="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="p-2 bg-emerald-50 rounded-xl text-emerald-600">
        <Leaf class="w-5 h-5" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-slate-900">Hábitos de Vida</h3>
        <p class="text-xs text-slate-500">Estilo de vida, substâncias e alimentação.</p>
      </div>
    </div>
  </div>
  
  <div class="p-6 space-y-6 bg-white/50">
    
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      
      <!-- 1. Etilismo -->
      <div class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-slate-200">
        <div class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
          <Wine class="w-4 h-4 text-amber-600" />
          Etilismo
        </div>
        <div class="flex gap-3">
          {#each [['nao', 'Não'], ['sim', 'Sim'], ['ex', 'Ex-etilista']] as [val, label]}
            <label class="flex-1 flex items-center justify-center px-2 py-2 border rounded-xl cursor-pointer text-xs font-bold transition-all
                          {hv.etilismo === val ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}">
              <input 
                type="radio" 
                name="etilismo" 
                value={val} 
                bind:group={hv.etilismo} 
                onchange={handleInput}
                disabled={readonly} 
                class="sr-only"
              />
              {label}
            </label>
          {/each}
        </div>
        
        {#if hv.etilismo === 'sim' || hv.etilismo === 'ex'}
          <div class="pt-2 animate-in slide-in-from-top-1 duration-200">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Doses Semanais / Tipo</label>
            <input 
              type="text" 
              bind:value={hv.etilismo_doses} 
              oninput={handleInput}
              disabled={readonly}
              placeholder="Ex: 5 doses cerveja fds..."
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
            />
          </div>
        {/if}
      </div>

      <!-- 2. Tabagismo -->
      <div class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-slate-200">
        <div class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
          <Flame class="w-4 h-4 text-orange-600" />
          Tabagismo
        </div>
        <div class="flex gap-3">
          {#each [['nao', 'Não'], ['sim', 'Sim'], ['ex', 'Ex-fumante']] as [val, label]}
            <label class="flex-1 flex items-center justify-center px-2 py-2 border rounded-xl cursor-pointer text-xs font-bold transition-all
                          {hv.tabagismo === val ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}">
              <input 
                type="radio" 
                name="tabagismo" 
                value={val} 
                bind:group={hv.tabagismo} 
                onchange={handleInput}
                disabled={readonly} 
                class="sr-only"
              />
              {label}
            </label>
          {/each}
        </div>
        
        {#if hv.tabagismo === 'sim' || hv.tabagismo === 'ex'}
          <div class="pt-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
            <div>
              <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Maços/Dia</label>
              <input 
                type="text" 
                bind:value={hv.tabagismo_macos} 
                oninput={handleInput}
                disabled={readonly}
                placeholder="Ex: 1/2 maço..."
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
              />
            </div>
            <div>
              <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Tempo (anos)</label>
              <input 
                type="text" 
                bind:value={hv.tabagismo_tempo} 
                oninput={handleInput}
                disabled={readonly}
                placeholder="Ex: 10 anos..."
                class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 bg-white"
              />
            </div>
          </div>
        {/if}
      </div>

      <!-- 3. Drogadismo / Substâncias -->
      <div class="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3 transition-all hover:border-slate-200">
        <div class="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider border-b border-slate-50 pb-2">
          <Compass class="w-4 h-4 text-violet-600" />
          Drogadismo
        </div>
        <div class="flex gap-3">
          {#each [['nao', 'Nega'], ['sim', 'Usa'], ['ex', 'Ex-usuário']] as [val, label]}
            <label class="flex-1 flex items-center justify-center px-2 py-2 border rounded-xl cursor-pointer text-xs font-bold transition-all
                          {hv.drogadismo === val ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}">
              <input 
                type="radio" 
                name="drogadismo" 
                value={val} 
                bind:group={hv.drogadismo} 
                onchange={handleInput}
                disabled={readonly} 
                class="sr-only"
              />
              {label}
            </label>
          {/each}
        </div>
        
        {#if hv.drogadismo === 'sim' || hv.drogadismo === 'ex'}
          <div class="pt-2 animate-in slide-in-from-top-1 duration-200">
            <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Detalhes / Substância</label>
            <input 
              type="text" 
              bind:value={hv.drogadismo_detalhes} 
              oninput={handleInput}
              disabled={readonly}
              placeholder="Maconha eventual, etc..."
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 bg-white"
            />
          </div>
        {/if}
      </div>

    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Recordatório Alimentar Estruturado -->
      <div class="space-y-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
        <label class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
          <ClipboardList class="w-4 h-4 text-sky-600" />
          Recordatório Alimentar Detalhado
        </label>
        
        <div class="space-y-3 max-h-[380px] overflow-y-auto pr-2">
          {#each [
            { key: "cafe_manha", label: "Café da Manhã", icon: "🌅" },
            { key: "lanche_manha", label: "Lanche da Manhã", icon: "🍏" },
            { key: "almoco", label: "Almoço", icon: "🍽️" },
            { key: "lanche_tarde", label: "Lanche da Tarde", icon: "🍌" },
            { key: "cafe_tarde", label: "Café da Tarde", icon: "☕" },
            { key: "lanche_pre_jantar", label: "Lanche antes do Jantar", icon: "🍘" },
            { key: "jantar", label: "Jantar", icon: "🍲" },
            { key: "lanche_dormir", label: "Lanche antes de Dormir", icon: "🌙" }
          ] as meal}
            <div class="flex flex-col gap-1 bg-white rounded-xl border border-slate-200 p-2 shadow-sm transition-all hover:border-emerald-200">
              <span class="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                <span class="text-xs">{meal.icon}</span> {meal.label}
              </span>
              <input 
                type="text"
                bind:value={hv.recordatorio_refinado[meal.key]}
                oninput={handleInput}
                disabled={readonly}
                placeholder={`O que come no ${meal.label.toLowerCase()}...`}
                class="w-full bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>
          {/each}
        </div>
      </div>

      <!-- Narrativa Geral (Atividade física, sono, sexualidade...) -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Leaf class="w-4 h-4 text-emerald-600" />
          Narrativa Geral (Sono, Atividade Física, Sexualidade...)
        </label>
        <textarea 
          bind:value={dados.habitos_vida_narrativa} 
          oninput={handleInput}
          disabled={readonly}
          rows="4"
          placeholder="Pratica caminhada 3x/semana. Sono regular de 7h..."
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
        ></textarea>
      </div>
      
    </div>

  </div>
</section>
