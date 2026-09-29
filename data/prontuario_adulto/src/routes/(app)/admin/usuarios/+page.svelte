<script lang="ts">
  import { enhance } from '$app/forms';
  import { Users, Plus, Shield, ShieldAlert, ShieldCheck, Mail, Key, Save, X, Ban, CheckCircle, UserCog } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';

  let { data } = $props();

  let busca = $state("");
  let modalNovoAberto = $state(false);
  let statusFiltro = $state("todos");

  let filtrados = $derived(
    (data.usuarios || []).filter((u: any) => {
      const mNome = u.nome.toLowerCase().includes(busca.toLowerCase());
      const mEmail = u.email.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = statusFiltro === "todos" 
        ? true 
        : (statusFiltro === "ativos" ? u.ativo : !u.ativo);
      return (mNome || mEmail) && matchStatus;
    })
  );

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'medico': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'residente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'estudante': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  let modalErro = $state<string|null>(null);
  let modalSalvando = $state(false);

</script>

<div class="space-y-6 max-w-7xl mx-auto">
  <!-- Header Panel -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Users class="w-7 h-7 text-indigo-600"/> Gestão de Usuários do Sistema
      </h1>
      <p class="text-sm text-slate-500 mt-1">Cadastre e configure permissões de profissionais e estudantes.</p>
    </div>
    <button onclick={() => modalNovoAberto = true} class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-sm flex items-center gap-2 transition-all">
      <Plus class="w-4 h-4" /> Novo Usuário
    </button>
  </div>

  <!-- Filtros -->
  <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
    <div class="relative flex-1 w-full">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Users class="h-4 w-4 text-slate-400" />
      </div>
      <input type="text" bind:value={busca} placeholder="Buscar por nome ou e-mail..." class="w-full text-sm border border-slate-200 rounded-xl pl-10 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"/>
    </div>
    <select bind:value={statusFiltro} class="text-sm border-slate-200 rounded-xl bg-slate-50 py-2 px-4">
      <option value="todos">Todos Status</option>
      <option value="ativos">Apenas Ativos</option>
      <option value="inativos">Suspensos</option>
    </select>
  </div>

  <!-- Tabela de Resultados -->
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
            <th class="px-6 py-4">Identificação / Nome</th>
            <th class="px-6 py-4">Papel (Role)</th>
            <th class="px-6 py-4">Acesso</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each filtrados as user (user.id)}
            <tr class="hover:bg-slate-50/30 {!user.ativo ? 'opacity-60 bg-slate-50' : ''}">
              <td class="px-6 py-4">
                <div class="font-bold text-slate-900">{user.nome}</div>
                <div class="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Mail class="w-3 h-3"/> {user.email}</div>
              </td>
              <td class="px-6 py-4">
                <form method="POST" action="?/mudar_role" use:enhance class="flex items-center gap-2 group">
                  <input type="hidden" name="id" value={user.id} />
                  <span class="px-2 py-1 rounded-md border text-xs font-bold {getRoleColor(user.role)} capitalize">
                    {user.role}
                  </span>
                  <select name="role" onchange={(e) => e.currentTarget.form?.requestSubmit()} class="opacity-0 group-hover:opacity-100 focus:opacity-100 bg-transparent border-0 text-[10px] text-slate-400 cursor-pointer hover:text-indigo-600 transition-all">
                    <option value="" disabled selected>Mudar</option>
                    <option value="medico">Médico</option>
                    <option value="residente">Residente</option>
                    <option value="estudante">Estudante</option>
                    <option value="admin">Admin</option>
                  </select>
                </form>
              </td>
              <td class="px-6 py-4 font-mono text-xs text-slate-400 break-all truncate max-w-[150px]" title={user.id}>
                {user.id.split('-')[0]}...
              </td>
              <td class="px-6 py-4">
                {#if user.ativo}
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">Ativo</span>
                {:else}
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 text-xs font-bold">Suspenso</span>
                {/if}
              </td>
              <td class="px-6 py-4 text-right">
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="id" value={user.id} />
                  {#if user.ativo}
                    <button type="submit" title="Desativar acesso" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <Ban class="w-4 h-4" />
                    </button>
                  {:else}
                    <button type="submit" title="Ativar acesso" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                      <CheckCircle class="w-4 h-4" />
                    </button>
                  {/if}
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/30">Nenhum usuário corresponde aos filtros.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- MODAL NOVO USUÁRIO -->
{#if modalNovoAberto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4" transition:fade={{ duration: 150 }}>
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onclick={() => !modalSalvando && (modalNovoAberto = false)}></div>
    
    <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col z-10" transition:scale={{ start: 0.95, duration: 150 }}>
      <form 
        method="POST" 
        action="?/criar" 
        use:enhance={() => {
          modalSalvando = true;
          modalErro = null;
          return async ({ result, update }) => {
             modalSalvando = false;
             if (result.type === 'success') {
                modalNovoAberto = false;
                await update();
             } else if (result.type === 'failure') {
                modalErro = (result.data as any)?.erro ?? 'Ocorreu um erro inesperado.';
             }
          };
        }}
      >
        <!-- Cabeçalho -->
        <div class="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-lg flex items-center gap-2"><UserCog class="w-5 h-5 text-indigo-600"/> Novo Registro</h3>
            <p class="text-xs text-slate-500 mt-0.5">Isso criará a conta no sistema e base de autenticação.</p>
          </div>
          <button type="button" onclick={() => modalNovoAberto = false} class="text-slate-400 hover:text-slate-600">&times;</button>
        </div>

        <div class="p-6 space-y-4">
          {#if modalErro}
            <div class="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-medium rounded-xl animate-in fade-in">{modalErro}</div>
          {/if}

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 uppercase">Nome Completo</label>
            <input type="text" name="nome" required placeholder="Ex: Dr. João Souza" class="w-full text-sm border-slate-300 rounded-xl py-2 px-3"/>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 uppercase">E-mail</label>
            <div class="relative">
              <Mail class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="email" name="email" required placeholder="exemplo@dominio.com" class="w-full text-sm border-slate-300 rounded-xl py-2 pl-10 pr-3"/>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 uppercase">Senha Inicial</label>
            <div class="relative">
              <Key class="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="password" name="senha" required minlength="6" placeholder="Min 6 caracteres" class="w-full text-sm border-slate-300 rounded-xl py-2 pl-10 pr-3"/>
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-700 uppercase">Papel / Nível de Acesso</label>
            <select name="role" required class="w-full text-sm border-slate-300 rounded-xl py-2 px-3">
              <option value="medico">Médico</option>
              <option value="residente">Residente</option>
              <option value="estudante">Estudante</option>
              <option value="recepcionista">Recepcionista / Secretaria</option>
              <option value="admin">Administrador do Sistema</option>
            </select>
          </div>
        </div>

        <div class="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onclick={() => modalNovoAberto = false} class="px-4 py-2 text-sm font-medium text-slate-600" disabled={modalSalvando}>Cancelar</button>
          <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 text-sm rounded-xl shadow-md transition-all disabled:opacity-50" disabled={modalSalvando}>
            {modalSalvando ? 'Salvando...' : 'Confirmar Criação'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
