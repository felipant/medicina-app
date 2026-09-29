<script lang="ts">
  import { Building2, Plus, Pencil } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let modalAberto = $state(false);
  let editando = $state<any>(null);
  let salvando = $state(false);
  let form = $state({ nome: '', cnpj: '', plano: 'gratuito' });

  function abrirCriar() {
    editando = null;
    form = { nome: '', cnpj: '', plano: 'gratuito' };
    modalAberto = true;
  }
  function abrirEditar(c: any) {
    editando = c;
    form = { nome: c.nome, cnpj: c.cnpj || '', plano: c.plano };
    modalAberto = true;
  }

  async function salvar() {
    salvando = true;
    try {
      if (editando) {
        await apiFetch(`/api/v1/sistema/clinicas/${editando.id}`, data.accessToken, {
          method: 'PUT', body: JSON.stringify(form)
        });
      } else {
        await apiFetch('/api/v1/sistema/clinicas', data.accessToken, {
          method: 'POST', body: JSON.stringify(form)
        });
      }
      modalAberto = false;
      await invalidateAll();
    } catch (e: any) { alert(e.message); }
    finally { salvando = false; }
  }
</script>

<div class="space-y-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-extrabold text-gray-900">Clínicas</h1>
      <p class="text-sm text-gray-500">Gerenciamento de clínicas cadastradas no sistema.</p>
    </div>
    <button onclick={abrirCriar} class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm">
      <Plus class="w-4 h-4" /> Nova Clínica
    </button>
  </header>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <th class="px-5 py-3 text-left">Nome</th>
          <th class="px-5 py-3 text-left">CNPJ</th>
          <th class="px-5 py-3 text-left">Plano</th>
          <th class="px-5 py-3 text-center">Usuários</th>
          <th class="px-5 py-3 text-center">Pacientes</th>
          <th class="px-5 py-3 text-right">Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each data.clinicas as c}
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="px-5 py-3 font-semibold text-gray-900">{c.nome}</td>
            <td class="px-5 py-3 text-gray-600 font-mono text-xs">{c.cnpj || '—'}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                {c.plano === 'estudante' ? 'bg-purple-100 text-purple-700' :
                 c.plano === 'clinica' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}">
                {c.plano}
              </span>
            </td>
            <td class="px-5 py-3 text-center font-bold text-gray-700">{c.total_usuarios}</td>
            <td class="px-5 py-3 text-center font-bold text-gray-700">{c.total_pacientes}</td>
            <td class="px-5 py-3 text-right">
              <button onclick={() => abrirEditar(c)} class="text-indigo-600 hover:text-indigo-800">
                <Pencil class="w-4 h-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if modalAberto}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-xl">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900">{editando ? 'Editar Clínica' : 'Nova Clínica'}</h3>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="cl-nome">Nome</label>
          <input id="cl-nome" type="text" bind:value={form.nome} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="cl-cnpj">CNPJ</label>
          <input id="cl-cnpj" type="text" bind:value={form.cnpj} placeholder="00.000.000/0000-00" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm" />
        </div>
        <div>
          <label class="text-xs font-bold text-gray-600 uppercase" for="cl-plano">Plano</label>
          <select id="cl-plano" bind:value={form.plano} class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-sm">
            <option value="gratuito">Gratuito</option>
            <option value="basico">Básico</option>
            <option value="clinica">Clínica</option>
            <option value="estudante">Estudante</option>
          </select>
        </div>
      </div>
      <div class="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
        <button onclick={() => modalAberto = false} class="px-4 py-2 text-sm text-gray-600">Cancelar</button>
        <button onclick={salvar} disabled={salvando} class="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  </div>
{/if}
