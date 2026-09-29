<script lang="ts">
  import { Building2, Save, X, Plus } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let salvando = $state(false);
  let sucesso = $state(false);
  let erro = $state('');

  let form = $state({
    nome: data.clinica?.nome || '',
    cnpj: data.clinica?.cnpj || '',
    endereco: data.clinica?.endereco || '',
    telefone: data.clinica?.telefone || '',
    email_contato: data.clinica?.email_contato || '',
  });

  let especialidades = $state<string[]>(data.clinica?.especialidades || []);
  let novaEsp = $state('');

  function adicionarEsp() {
    const v = novaEsp.trim();
    if (v && !especialidades.includes(v)) {
      especialidades = [...especialidades, v];
    }
    novaEsp = '';
  }
  function removerEsp(idx: number) {
    especialidades = especialidades.filter((_, i) => i !== idx);
  }

  function formatCnpj(val: string) {
    const nums = val.replace(/\D/g, '').slice(0, 14);
    if (nums.length <= 2) return nums;
    if (nums.length <= 5) return nums.replace(/(\d{2})(\d+)/, '$1.$2');
    if (nums.length <= 8) return nums.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    if (nums.length <= 12) return nums.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
    return nums.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
  }

  async function salvar() {
    salvando = true;
    erro = '';
    sucesso = false;
    try {
      await apiFetch('/api/v1/admin/clinica/minha', data.accessToken!, {
        method: 'PUT',
        body: JSON.stringify({ ...form, especialidades })
      });
      sucesso = true;
      setTimeout(() => sucesso = false, 3000);
    } catch (e: any) {
      erro = e.message || 'Erro ao salvar.';
    } finally {
      salvando = false;
    }
  }
</script>

<div class="max-w-2xl space-y-8">
  <header>
    <h1 class="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
      <Building2 class="w-6 h-6 text-indigo-600" />
      Configurações da Clínica
    </h1>
    <p class="text-sm text-gray-500 mt-1">Dados gerais e configurações da sua clínica.</p>
  </header>

  {#if sucesso}
    <div class="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl font-medium">
      ✓ Dados salvos com sucesso!
    </div>
  {/if}
  {#if erro}
    <div class="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{erro}</div>
  {/if}

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
    <div>
      <label class="text-xs font-bold text-gray-600 uppercase" for="cl-nome">Nome da Clínica *</label>
      <input id="cl-nome" type="text" bind:value={form.nome} required class="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm" />
    </div>

    <div>
      <label class="text-xs font-bold text-gray-600 uppercase" for="cl-cnpj">CNPJ</label>
      <input id="cl-cnpj" type="text" value={form.cnpj}
        oninput={(e) => form.cnpj = formatCnpj(e.currentTarget.value)}
        placeholder="00.000.000/0000-00"
        class="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm font-mono" />
    </div>

    <div>
      <label class="text-xs font-bold text-gray-600 uppercase" for="cl-end">Endereço</label>
      <input id="cl-end" type="text" bind:value={form.endereco} class="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs font-bold text-gray-600 uppercase" for="cl-tel">Telefone</label>
        <input id="cl-tel" type="text" bind:value={form.telefone} placeholder="(11) 99999-0000" class="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm" />
      </div>
      <div>
        <label class="text-xs font-bold text-gray-600 uppercase" for="cl-email">Email de contato</label>
        <input id="cl-email" type="email" bind:value={form.email_contato} class="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm" />
      </div>
    </div>

    <div>
      <label class="text-xs font-bold text-gray-600 uppercase">Especialidades</label>
      <div class="flex flex-wrap gap-2 mt-2">
        {#each especialidades as esp, i}
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
            {esp}
            <button onclick={() => removerEsp(i)} class="text-indigo-400 hover:text-indigo-600">
              <X class="w-3 h-3" />
            </button>
          </span>
        {/each}
      </div>
      <div class="flex gap-2 mt-2">
        <input type="text" bind:value={novaEsp} placeholder="Adicionar especialidade..."
          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarEsp(); } }}
          class="flex-1 border border-gray-200 rounded-xl p-2 text-sm" />
        <button onclick={adicionarEsp} class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
          <Plus class="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  </div>

  <div class="flex justify-end">
    <button onclick={salvar} disabled={salvando}
      class="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-colors">
      <Save class="w-4 h-4" />
      {salvando ? 'Salvando...' : 'Salvar Configurações'}
    </button>
  </div>
</div>
