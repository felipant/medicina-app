<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  import { Search, Stethoscope, FileText, UserPlus, FileQuestion, FlaskConical, Trash2 } from 'lucide-svelte';
  import { apiFetch } from '$lib/api';
  import { invalidateAll } from '$app/navigation';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  
  let modalConflitoAberto = $state(false);
  
  // React to form results for 409 conflict
  $effect(() => {
    if (form?.consulta_em_andamento) {
      modalConflitoAberto = true;
    }
  });

  let busca = $state("");
  let filteredPacientes = $derived(
    (data.pacientes || []).filter((p: any) =>
      p.nome.toLowerCase().includes(busca.toLowerCase())
    )
  );

  function formatCPF(cpf: string | null) {
    if (!cpf) return "***.***.***-**";
    return "***.***.***-" + cpf.slice(-2);
  }

  function formatarData(dStr: string | null) {
    if (!dStr) return "-";
    const parts = dStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function calcularIdade(dStr: string | null) {
    if (!dStr) return "-";
    const born = new Date(dStr);
    const diff = Date.now() - born.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }
  
  const role = data.usuario?.role;
  const isEstudante = role === 'estudante';
  const canCreateConsulta = ['medico', 'admin', 'residente', 'estudante'].includes(role || '');

  let modalExclusaoAberto = $state(false);
  let idParaExcluir = $state<string | null>(null);
  let excluindo = $state(false);

  function confirmarExclusao(event: MouseEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    idParaExcluir = id;
    modalExclusaoAberto = true;
  }

  async function executarExclusao() {
    if (!idParaExcluir) return;
    excluindo = true;
    try {
      await apiFetch(`/api/v1/pacientes/${idParaExcluir}`, data.accessToken, {
        method: 'DELETE'
      });
      modalExclusaoAberto = false;
      idParaExcluir = null;
      await invalidateAll();
    } catch (e: any) {
      alert(e.message || "Erro ao excluir paciente.");
    } finally {
      excluindo = false;
    }
  }
</script>

<div class="max-w-6xl mx-auto p-6 space-y-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Pacientes</h1>
      <p class="text-gray-500 text-sm">Gestão de registros ambulatoriais</p>
    </div>
    
    <a 
      href="/pacientes/new" 
      class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm font-medium text-sm"
    >
      <UserPlus class="w-4 h-4" />
      Novo Paciente
    </a>
  </header>

  <div class="relative max-w-md">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search class="h-4 w-4 text-gray-400" />
    </div>
    <input
      type="text"
      bind:value={busca}
      class="block w-full pl-10 pr-3 py-2 border border-gray-200 bg-white rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      placeholder="Buscar paciente por nome..."
    />
  </div>

  {#if data.error}
    <div class="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm font-mono">
      <strong>Erro no Carregamento:</strong> {data.error}
    </div>
  {/if}

  {#if !data.pacientes}
    <!-- Skeleton Loading -->
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div class="h-12 bg-gray-50 border-b border-gray-100"></div>
      {#each Array(5) as _}
        <div class="h-16 border-b border-gray-100 last:border-0"></div>
      {/each}
    </div>
  {:else if filteredPacientes.length === 0}
    <div class="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center text-center shadow-sm">
      <div class="bg-gray-50 p-4 rounded-full mb-4">
        <FileQuestion class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900">Nenhum paciente localizado</h3>
      <p class="text-sm text-gray-500 mt-1">Verifique os termos da busca ou cadastre um novo.</p>
    </div>
  {:else}
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
          <tr>
            <th class="px-6 py-4">Nome</th>
            {#if !isEstudante}
              <th class="px-6 py-4">CPF</th>
              <th class="px-6 py-4">Nascimento</th>
              <th class="px-6 py-4">Idade</th>
            {/if}
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each filteredPacientes as paciente (paciente.id)}
            <tr class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4 font-medium text-gray-900">{paciente.nome}</td>
              {#if !isEstudante}
                <td class="px-6 py-4 text-gray-500 font-mono text-xs">{formatCPF(paciente.cpf)}</td>
                <td class="px-6 py-4 text-gray-600">{formatarData(paciente.data_nasc)}</td>
                <td class="px-6 py-4 text-gray-600">{calcularIdade(paciente.data_nasc)} anos</td>
              {/if}
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <a
                    href="/pacientes/{paciente.id}"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-all text-xs font-medium"
                    title="Ver Prontuário"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    Ver
                  </a>

                  <a
                    href="/pacientes/{paciente.id}/exames"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-all text-xs font-medium relative"
                    title="Módulo de Exames"
                  >
                    <FlaskConical class="w-3.5 h-3.5" />
                    Exames
                    {#if paciente.tem_alterados}
                      <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse shadow-sm"></span>
                    {/if}
                  </a>

                  {#if canCreateConsulta && paciente.prontuario_id}
                    <form method="POST" action="?/nova_consulta" use:enhance>
                      <input type="hidden" name="prontuario_id" value={paciente.prontuario_id} />
                      <button
                        type="submit"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-lg transition-all text-xs font-semibold"
                      >
                        <Stethoscope class="w-3.5 h-3.5" />
                        Nova Consulta
                      </button>
                    </form>
                  {/if}
                  
                  {#if isEstudante}
                    <button
                      type="button"
                      onclick={(e) => confirmarExclusao(e, paciente.id)}
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded-lg transition-all text-xs font-semibold"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                      Excluir
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Modais -->

<!-- Modal de conflito: consulta em andamento -->
{#if modalConflitoAberto && form?.consulta_em_andamento}
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
      <h3 class="text-base font-semibold text-gray-900 mb-2">
        Consulta em andamento
      </h3>
      <p class="text-sm text-gray-600 mb-5">
        Este paciente já tem uma consulta não finalizada
        {#if form.criada_em}
          iniciada em {new Date(form.criada_em).toLocaleDateString('pt-BR')}.
        {:else}
          em andamento.
        {/if}
        O que deseja fazer?
      </p>
      <div class="flex gap-3">
        <a href="/consulta/{form.consulta_id}"
           class="flex-1 py-2.5 text-center text-sm font-medium bg-blue-600
                  text-white rounded-lg hover:bg-blue-700 transition-colors">
          Continuar consulta
        </a>
        <form method="POST" action="?/finalizar_e_criar" use:enhance class="flex-1">
          <input type="hidden" name="consulta_id" value={form.consulta_id} />
          <input type="hidden" name="prontuario_id" value={form.prontuario_id} />
          <button type="submit"
                  class="w-full py-2.5 text-sm font-medium border border-gray-200
                         text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Finalizar anterior e nova
          </button>
        </form>
      </div>
      <button
        onclick={() => modalConflitoAberto = false}
        class="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600">
        Cancelar
      </button>
    </div>
  </div>
{/if}

<!-- Modal Premium de Confirmação de Exclusão -->
{#if modalExclusaoAberto}
  <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center px-4 animate-in fade-in duration-200">
    <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
      <div class="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100">
        <Trash2 class="w-6 h-6" />
      </div>
      
      <h3 class="text-lg font-bold text-slate-900 mb-2">
        Excluir Paciente Permanentemente?
      </h3>
      <p class="text-sm text-slate-500 mb-6 leading-relaxed">
        Esta ação **não pode ser desfeita**. Todo o histórico de consultas, exames laboratoriais e receitas associados a este prontuário serão apagados definitivamente do banco de dados.
      </p>
      
      <div class="flex gap-3">
        <button 
          type="button"
          onclick={() => { modalExclusaoAberto = false; idParaExcluir = null; }}
          disabled={excluindo}
          class="flex-1 py-2.5 text-center text-sm font-bold border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
        >
          Cancelar
        </button>
        
        <button 
          type="button"
          onclick={executarExclusao}
          disabled={excluindo}
          class="flex-1 py-2.5 text-center text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-md shadow-rose-600/20 active:bg-rose-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {#if excluindo}
             <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
             Excluindo...
          {:else}
             Confirmar Exclusão
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
