<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();

  if (!dados.antropometria) {
    dados.antropometria = { altura: "", peso: "", circ_abdominal: "", imc: "" };
  } else if (dados.antropometria.imc === undefined) {
    dados.antropometria.imc = "";
  }

  function calcularImc() {
    const peso = parseFloat(dados.antropometria.peso);
    const altura = parseFloat(dados.antropometria.altura) / 100;
    if (peso > 0 && altura > 0) {
      dados.antropometria.imc = (peso / (altura * altura)).toFixed(1);
    }
  }
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70 mt-4 overflow-hidden shadow-sm">
  <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 select-none bg-white border-b border-slate-200">
    <span>Dados Antropométricos</span>
    <span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-400 font-mono font-bold">i</span>
  </summary>
  
  <div class="grid gap-4 px-4 py-5 sm:grid-cols-2 lg:grid-cols-4 bg-white/50">
    <label class="space-y-1 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
      <span>Altura (cm)</span>
      <input
        type="number"
        bind:value={dados.antropometria.altura}
        oninput={() => { calcularImc(); onchange?.(); }}
        disabled={readonly}
        placeholder="Ex: 170"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
      />
    </label>
    
    <label class="space-y-1 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
      <span>Peso (kg)</span>
      <input
        type="number"
        step="0.1"
        bind:value={dados.antropometria.peso}
        oninput={() => { calcularImc(); onchange?.(); }}
        disabled={readonly}
        placeholder="Ex: 70.5"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
      />
    </label>
    
    <label class="space-y-1 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
      <span>Circ. Abdominal (cm)</span>
      <input
        type="number"
        step="0.1"
        bind:value={dados.antropometria.circ_abdominal}
        oninput={onchange}
        disabled={readonly}
        placeholder="Ex: 85.0"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
      />
    </label>
    
    <label class="space-y-1 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
      <span class="flex items-center justify-between">
         <span>IMC (kg/m²)</span>
         <span class="text-[9px] font-bold text-amber-600 lowercase italic bg-amber-50 px-1.5 rounded border border-amber-100 shrink-0">editável</span>
      </span>
      <input
        type="text"
        bind:value={dados.antropometria.imc}
        oninput={onchange}
        disabled={readonly}
        placeholder="Calculado..."
        class="w-full rounded-xl border border-indigo-200 bg-indigo-50/30 px-3 py-2.5 font-bold text-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none"
      />
    </label>
  </div>
</details>
