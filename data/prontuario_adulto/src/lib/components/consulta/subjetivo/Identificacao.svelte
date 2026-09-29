<script lang="ts">
  let { dados = $bindable(), readonly = false, onchange } = $props();

  if (!dados.identificacao) {
    dados.identificacao = {
      idade: "",
      ocupacao: "",
      naturalidade: "",
      acompanhante: "",
      sexo: "",
      genero: "",
      generoOutro: "",
      raca: "",
      racaOutro: "",
      estadoCivil: "",
      estadoCivilOutro: "",
      escolaridade: "",
      escolaridadeOutro: "",
      religiao: "",
      religiaoOutro: ""
    };
  }

  const generoOptions = ["Cis", "Trans", "Não-binário", "Outros"];
  const racaOptions = ["Preta", "Parda", "Branca", "Indígena", "Quilombola", "Outros"];
  const estadoCivilOptions = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)", "Outros"];
  const escolaridadeOptions = [
    "Sem escolaridade formal", "Fundamental incompleto", "Fundamental completo",
    "Médio incompleto", "Médio completo", "Superior incompleto", "Superior completo",
    "Pós-graduação", "Outros"
  ];
  const religiaoOptions = [
    "Católica", "Evangélica", "Espírita", "Religiões de matriz africana", "Sem religião", "Outros"
  ];
</script>

<details open class="rounded-2xl border border-slate-200 bg-slate-50/70">
  <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 select-none">
    Identificação
  </summary>
  <div class="grid gap-3 px-4 pb-4 md:grid-cols-2 xl:grid-cols-4">
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Idade</span>
      <input
        bind:value={dados.identificacao.idade}
        oninput={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Ocupação</span>
      <input
        bind:value={dados.identificacao.ocupacao}
        oninput={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Naturalidade</span>
      <input
        bind:value={dados.identificacao.naturalidade}
        oninput={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      />
    </label>
    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Nome do acompanhante</span>
      <input
        bind:value={dados.identificacao.acompanhante}
        oninput={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      />
    </label>

    <div class="space-y-2 text-xs font-medium text-slate-700 xl:col-span-2">
      <span class="block">Sexo biológico</span>
      <div class="flex flex-wrap gap-2">
        <label class="flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 cursor-pointer hover:bg-slate-50">
          <input
            class="mr-2 accent-slate-900"
            type="radio"
            bind:group={dados.identificacao.sexo}
            value="Feminino"
            onchange={onchange}
            disabled={readonly}
          />Feminino
        </label>
        <label class="flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 cursor-pointer hover:bg-slate-50">
          <input
            class="mr-2 accent-slate-900"
            type="radio"
            bind:group={dados.identificacao.sexo}
            value="Masculino"
            onchange={onchange}
            disabled={readonly}
          />Masculino
        </label>
      </div>
    </div>

    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Gênero</span>
      <select
        bind:value={dados.identificacao.genero}
        onchange={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      >
        <option value="">Selecione</option>
        {#each generoOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      {#if dados.identificacao.genero === "Outros"}
        <input
          type="text"
          bind:value={dados.identificacao.generoOutro}
          oninput={onchange}
          placeholder="Especifique"
          disabled={readonly}
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
        />
      {/if}
    </label>

    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Raça</span>
      <select
        bind:value={dados.identificacao.raca}
        onchange={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      >
        <option value="">Selecione</option>
        {#each racaOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      {#if dados.identificacao.raca === "Outros"}
        <input
          type="text"
          bind:value={dados.identificacao.racaOutro}
          oninput={onchange}
          placeholder="Especifique"
          disabled={readonly}
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
        />
      {/if}
    </label>

    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Estado civil</span>
      <select
        bind:value={dados.identificacao.estadoCivil}
        onchange={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      >
        <option value="">Selecione</option>
        {#each estadoCivilOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      {#if dados.identificacao.estadoCivil === "Outros"}
        <input
          type="text"
          bind:value={dados.identificacao.estadoCivilOutro}
          oninput={onchange}
          placeholder="Especifique"
          disabled={readonly}
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
        />
      {/if}
    </label>

    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Escolaridade</span>
      <select
        bind:value={dados.identificacao.escolaridade}
        onchange={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      >
        <option value="">Selecione</option>
        {#each escolaridadeOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      {#if dados.identificacao.escolaridade === "Outros"}
        <input
          type="text"
          bind:value={dados.identificacao.escolaridadeOutro}
          oninput={onchange}
          placeholder="Especifique"
          disabled={readonly}
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
        />
      {/if}
    </label>

    <label class="space-y-1 text-xs font-medium text-slate-700">
      <span>Religião</span>
      <select
        bind:value={dados.identificacao.religiao}
        onchange={onchange}
        disabled={readonly}
        class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
      >
        <option value="">Selecione</option>
        {#each religiaoOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
      {#if dados.identificacao.religiao === "Outros"}
        <input
          type="text"
          bind:value={dados.identificacao.religiaoOutro}
          oninput={onchange}
          placeholder="Especifique"
          disabled={readonly}
          class="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition-shadow"
        />
      {/if}
    </label>
  </div>
</details>
