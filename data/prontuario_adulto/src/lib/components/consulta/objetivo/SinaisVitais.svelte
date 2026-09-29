<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();

  if (!dados.sinais_vitais) {
    dados.sinais_vitais = { pas: "", pad: "", temperatura: "", fc: "", fr: "", spo2: "" };
  }
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
  <summary class="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-900 select-none">
    <span>Sinais Vitais</span>
    <span class="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-400">i</span>
  </summary>
  <div class="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 bg-white/50 pt-3">
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>PAS (mmHg)</span>
      <input
        type="number"
        bind:value={dados.sinais_vitais.pas}
        oninput={onchange}
        disabled={readonly}
        placeholder="120"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>PAD (mmHg)</span>
      <input
        type="number"
        bind:value={dados.sinais_vitais.pad}
        oninput={onchange}
        disabled={readonly}
        placeholder="80"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Temperatura (°C)</span>
      <input
        type="number"
        step="0.1"
        bind:value={dados.sinais_vitais.temperatura}
        oninput={onchange}
        disabled={readonly}
        placeholder="36.5"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>FC (bpm)</span>
      <input
        type="number"
        bind:value={dados.sinais_vitais.fc}
        oninput={onchange}
        disabled={readonly}
        placeholder="72"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>FR (irpm)</span>
      <input
        type="number"
        bind:value={dados.sinais_vitais.fr}
        oninput={onchange}
        disabled={readonly}
        placeholder="16"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>SpO2 (%)</span>
      <input
        type="number"
        bind:value={dados.sinais_vitais.spo2}
        oninput={onchange}
        disabled={readonly}
        placeholder="98"
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-all"
      />
    </label>
  </div>
</details>
