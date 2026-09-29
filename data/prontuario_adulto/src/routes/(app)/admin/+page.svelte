<script lang="ts">
  import { Users, Stethoscope, Calendar, Settings } from 'lucide-svelte';
  let { data } = $props();
  const stats = data.estatisticas;

  const cards = [
    { label: 'Pacientes', value: stats.pacientes, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Usuários Ativos', value: stats.usuarios, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Consultas este mês', value: stats.consultasMes, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];
</script>

<div>
  <header class="mb-8">
    <h1 class="text-2xl font-bold text-slate-900">Painel da Clínica</h1>
    <p class="text-slate-500 text-sm mt-1">Visão geral da sua clínica.</p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    {#each cards as card}
      {@const Icon = card.icon}
      <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 {card.bg} {card.color} rounded-xl flex items-center justify-center">
            <Icon class="w-6 h-6" />
          </div>
        </div>
        <span class="text-3xl font-bold text-slate-900 mb-1">{card.value.toLocaleString('pt-BR')}</span>
        <span class="text-sm font-medium text-slate-500">{card.label}</span>
      </div>
    {/each}
  </div>

  <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
    <a href="/admin/usuarios" class="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex items-center gap-4">
      <div class="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
        <Users class="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <h3 class="font-bold text-slate-900">Gerenciar Usuários</h3>
        <p class="text-xs text-slate-500">Adicionar, editar ou desativar membros.</p>
      </div>
    </a>
    <a href="/admin/clinica" class="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex items-center gap-4">
      <div class="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
        <Settings class="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <h3 class="font-bold text-slate-900">Configurações da Clínica</h3>
        <p class="text-xs text-slate-500">Nome, CNPJ, endereço e especialidades.</p>
      </div>
    </a>
  </div>
</div>
