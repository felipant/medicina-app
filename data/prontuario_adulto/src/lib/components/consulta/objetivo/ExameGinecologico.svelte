<script lang="ts">
  import { Flower, Baby, ClipboardCheck, Sparkles } from 'lucide-svelte';
  import { slide } from 'svelte/transition';

  let { dados = $bindable(), readonly = false, onchange } = $props();

  // Inicialização segura conforme estrutura exigida do arquivo raiz
  if (!dados.exame_ginecologico) {
    dados.exame_ginecologico = {
      mamas: {
        inspecaoEstatica: {
          posicao: "", 
          simetria: "", 
          volume: "", 
          mamilos: "", 
          ausenciaAbaulamentosRetracoes: false,
          observacoes: "",
        },
        inspecaoDinamica: {
          ausenciaAbaulamentosRetracoes: false,
          observacoes: "",
        },
        palpacao: "",
        expressao: {
          resultado: "", 
          observacoes: "",
        },
      },
      genitalia: {
        externa: "",
        interna: "",
        toqueVaginal: "",
      },
    };
  }

  let eg = $derived(dados.exame_ginecologico);

  function handleInput() {
    onchange?.();
  }

  function carregarTemplatePalpacao() {
    if (eg.mamas.palpacao && eg.mamas.palpacao.trim()) return;
    dados.exame_ginecologico.mamas.palpacao = "Glândulas mamárias com tecido glandular denso, ausência de nódulos palpáveis bilateralmente, sem áreas de espessamento localizado. Cadeias linfáticas axilares e supraclaviculares livres.";
    handleInput();
  }

  function carregarTemplateExterna() {
    if (eg.genitalia.externa && eg.genitalia.externa.trim()) return;
    dados.exame_ginecologico.genitalia.externa = "Vulva sem lesões elementares, hiperemias ou ulcerações. Distribuição de pilificação ginoide normal. Grandes e pequenos lábios sem alterações estruturais. Mecato uretral e hímen sem particularidades.";
    handleInput();
  }

  function carregarTemplateInterna() {
    if (eg.genitalia.interna && eg.genitalia.interna.trim()) return;
    dados.exame_ginecologico.genitalia.interna = "Paredes vaginais com coloração e trofismo preservados, ausência de abaulamentos ou lesões. Conteúdo vaginal fisiológico. Colo uterino centralizado, epitélio escamoso original intacto, orifício externo fechado, sem sinais de sangramento ativo.";
    handleInput();
  }

  function carregarTemplateToque() {
    if (eg.genitalia.toqueVaginal && eg.genitalia.toqueVaginal.trim()) return;
    dados.exame_ginecologico.genitalia.toqueVaginal = "Vagina elástica e indolor. Colo móvel e indolor à mobilização. Útero em anteroversoflexão (AVF), de volume e contornos normais, móvel, indolor. Anexos não palpáveis e indolores.";
    handleInput();
  }
</script>

<div class="space-y-6">
  <!-- 1. Exame das Mamas -->
  <div class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden transition-all hover:border-rose-200">
    <div class="bg-rose-50/50 px-5 py-3 border-b border-rose-100 flex items-center gap-2">
      <Flower class="w-4 h-4 text-rose-600" />
      <span class="text-sm font-extrabold text-rose-900 uppercase tracking-wide">Exame das Mamas</span>
    </div>

    <div class="p-5 space-y-5">
      
      <!-- Inspeção Estática -->
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-inner">
        <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span class="text-xs font-black text-slate-600 uppercase tracking-wider">Inspeção Estática</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <!-- Posição e Simetria -->
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-500 w-20 shrink-0">Posição:</span>
              <div class="flex gap-2 flex-1">
                {#each [['topicas', 'Tópicas'], ['ptoticas', 'Ptóticas']] as [val, lbl]}
                  <label class="flex-1 flex items-center justify-center px-2 py-1.5 border rounded-lg font-bold cursor-pointer transition-all {eg.mamas.inspecaoEstatica.posicao === val ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}">
                    <input type="radio" bind:group={dados.exame_ginecologico.mamas.inspecaoEstatica.posicao} onchange={handleInput} value={val} disabled={readonly} class="sr-only" />
                    {lbl}
                  </label>
                {/each}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-500 w-20 shrink-0">Simetria:</span>
              <div class="flex gap-2 flex-1">
                {#each [['simetricas', 'Simétricas'], ['assimetricas', 'Assimétricas']] as [val, lbl]}
                  <label class="flex-1 flex items-center justify-center px-2 py-1.5 border rounded-lg font-bold cursor-pointer transition-all {eg.mamas.inspecaoEstatica.simetria === val ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}">
                    <input type="radio" bind:group={dados.exame_ginecologico.mamas.inspecaoEstatica.simetria} onchange={handleInput} value={val} disabled={readonly} class="sr-only" />
                    {lbl}
                  </label>
                {/each}
              </div>
            </div>
          </div>

          <!-- Volume e Mamilos -->
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-500 w-20 shrink-0">Volume:</span>
              <div class="flex gap-2 flex-1">
                {#each [['eutroficas', 'Eutróficas'], ['hipotroficas', 'Hipotróficas'], ['hipertroficas', 'Hipertróficas']] as [val, lbl]}
                  <label class="flex-1 flex items-center justify-center text-[10px] py-1.5 border rounded-lg font-bold cursor-pointer transition-all {eg.mamas.inspecaoEstatica.volume === val ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}">
                    <input type="radio" bind:group={dados.exame_ginecologico.mamas.inspecaoEstatica.volume} onchange={handleInput} value={val} disabled={readonly} class="sr-only" />
                    {lbl}
                  </label>
                {/each}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="font-bold text-slate-500 w-20 shrink-0">Mamilos:</span>
              <div class="flex gap-2 flex-1">
                {#each [['proeminentes', 'Proeminentes'], ['planos', 'Planos'], ['invertidos', 'Invertidos']] as [val, lbl]}
                  <label class="flex-1 flex items-center justify-center text-[10px] py-1.5 border rounded-lg font-bold cursor-pointer transition-all {eg.mamas.inspecaoEstatica.mamilos === val ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}">
                    <input type="radio" bind:group={dados.exame_ginecologico.mamas.inspecaoEstatica.mamilos} onchange={handleInput} value={val} disabled={readonly} class="sr-only" />
                    {lbl}
                  </label>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <!-- Checkbox e Observações -->
        <div class="space-y-2.5 pt-1.5">
          <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input type="checkbox" bind:checked={dados.exame_ginecologico.mamas.inspecaoEstatica.ausenciaAbaulamentosRetracoes} onchange={handleInput} disabled={readonly} class="rounded accent-rose-600 text-rose-600 focus:ring-rose-500" />
            Ausência de abaulamentos e retrações
          </label>
          <input
            type="text"
            bind:value={dados.exame_ginecologico.mamas.inspecaoEstatica.observacoes}
            oninput={handleInput}
            disabled={readonly}
            placeholder="Observações da inspeção estática..."
            class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all font-medium"
          />
        </div>
      </div>

      <!-- Inspeção Dinâmica -->
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-inner">
        <span class="text-xs font-black text-slate-600 uppercase tracking-wider block pb-1 border-b border-slate-200">Inspeção Dinâmica</span>
        <label class="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none py-1">
          <input type="checkbox" bind:checked={dados.exame_ginecologico.mamas.inspecaoDinamica.ausenciaAbaulamentosRetracoes} onchange={handleInput} disabled={readonly} class="rounded accent-rose-600 text-rose-600 focus:ring-rose-500" />
          Ausência de abaulamentos ou retrações
        </label>
        <input
          type="text"
          bind:value={dados.exame_ginecologico.mamas.inspecaoDinamica.observacoes}
          oninput={handleInput}
          disabled={readonly}
          placeholder="Observações da inspeção dinâmica..."
          class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all font-medium"
        />
      </div>

      <!-- Palpação e Expressão -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Palpação -->
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-inner">
          <div class="flex items-center justify-between pb-1 border-b border-slate-200">
            <span class="text-xs font-black text-slate-600 uppercase tracking-wider">Palpação das Mamas</span>
            {#if !readonly}
              <button type="button" onclick={carregarTemplatePalpacao} class="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-slate-100 border border-slate-250 px-2 py-1 rounded shadow-xs text-slate-600 transition-colors">
                <Sparkles class="w-2.5 h-2.5 text-amber-500" /> Template
              </button>
            {/if}
          </div>
          <textarea
            bind:value={dados.exame_ginecologico.mamas.palpacao}
            oninput={handleInput}
            disabled={readonly}
            rows="3"
            placeholder="Descreva a palpação..."
            class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none font-medium"
          ></textarea>
        </div>

        <!-- Expressão -->
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 shadow-inner flex flex-col">
          <span class="text-xs font-black text-slate-600 uppercase tracking-wider pb-1 border-b border-slate-200 block">Expressão Papilar</span>
          <div class="flex items-center gap-2 pt-0.5">
            {#each [['positiva', 'Positiva'], ['negativa', 'Negativa']] as [val, lbl]}
              <label class="flex-1 flex items-center justify-center py-1.5 border rounded-lg font-bold text-xs cursor-pointer transition-all {eg.mamas.expressao.resultado === val ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}">
                <input type="radio" bind:group={dados.exame_ginecologico.mamas.expressao.resultado} onchange={handleInput} value={val} disabled={readonly} class="sr-only" />
                {lbl}
              </label>
            {/each}
          </div>
          <input
            type="text"
            bind:value={dados.exame_ginecologico.mamas.expressao.observacoes}
            oninput={handleInput}
            disabled={readonly}
            placeholder="Observações da expressão..."
            class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all font-medium mt-auto"
          />
        </div>
      </div>

    </div>
  </div>

  <!-- 2. Exame da Genitália -->
  <div class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden transition-all hover:border-rose-200">
    <div class="bg-rose-50/50 px-5 py-3 border-b border-rose-100 flex items-center gap-2">
      <Baby class="w-4 h-4 text-rose-600" />
      <span class="text-sm font-extrabold text-rose-900 uppercase tracking-wide">Exame da Genitália</span>
    </div>

    <div class="p-5 space-y-4">
      
      <!-- Genitália Externa -->
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-inner">
        <div class="flex items-center justify-between pb-1 border-b border-slate-200">
          <span class="text-xs font-black text-slate-600 uppercase tracking-wider">Genitália Externa (Vulvoscopia)</span>
          {#if !readonly}
            <button type="button" onclick={carregarTemplateExterna} class="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-slate-100 border border-slate-250 px-2 py-1 rounded shadow-xs text-slate-600 transition-colors">
              <Sparkles class="w-2.5 h-2.5 text-amber-500" /> Template
            </button>
          {/if}
        </div>
        <textarea
          bind:value={dados.exame_ginecologico.genitalia.externa}
          oninput={handleInput}
          disabled={readonly}
          rows="2"
          placeholder="Descreva a genitália externa..."
          class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none font-medium"
        ></textarea>
      </div>

      <!-- Genitália Interna -->
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-inner">
        <div class="flex items-center justify-between pb-1 border-b border-slate-200">
          <span class="text-xs font-black text-slate-600 uppercase tracking-wider">Genitália Interna (Especular)</span>
          {#if !readonly}
            <button type="button" onclick={carregarTemplateInterna} class="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-slate-100 border border-slate-250 px-2 py-1 rounded shadow-xs text-slate-600 transition-colors">
              <Sparkles class="w-2.5 h-2.5 text-amber-500" /> Template
            </button>
          {/if}
        </div>
        <textarea
          bind:value={dados.exame_ginecologico.genitalia.interna}
          oninput={handleInput}
          disabled={readonly}
          rows="2"
          placeholder="Paredes vaginais, colo, conteúdo vaginal..."
          class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none font-medium"
        ></textarea>
      </div>

      <!-- Toque Vaginal / Bimanual -->
      <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-inner">
        <div class="flex items-center justify-between pb-1 border-b border-slate-200">
          <span class="text-xs font-black text-slate-600 uppercase tracking-wider">Toque Vaginal / Palpação Bimanual</span>
          {#if !readonly}
            <button type="button" onclick={carregarTemplateToque} class="inline-flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-slate-100 border border-slate-250 px-2 py-1 rounded shadow-xs text-slate-600 transition-colors">
              <Sparkles class="w-2.5 h-2.5 text-amber-500" /> Template
            </button>
          {/if}
        </div>
        <textarea
          bind:value={dados.exame_ginecologico.genitalia.toqueVaginal}
          oninput={handleInput}
          disabled={readonly}
          rows="2"
          placeholder="Mobilidade colo, tamanho uterino, anexos..."
          class="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all resize-none font-medium"
        ></textarea>
      </div>

    </div>
  </div>
</div>
