<script lang="ts">
  import { Building2, GraduationCap, Pill, FlaskConical, Image, Users } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const stats = $derived([
    { label: 'Clínicas', value: data.dashboard?.clinicas ?? 0, icon: Building2, color: 'from-blue-500 to-blue-600' },
    { label: 'Usuários', value: data.dashboard?.usuarios ?? 0, icon: Users, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Pacientes', value: data.dashboard?.pacientes ?? 0, icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Estudantes', value: data.dashboard?.estudantes ?? 0, icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
    { label: 'Medicamentos', value: data.dashboard?.medicamentos ?? 0, icon: Pill, color: 'from-amber-500 to-amber-600' },
    { label: 'Exames Lab', value: data.dashboard?.exames_lab ?? 0, icon: FlaskConical, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Exames Imagem', value: data.dashboard?.exames_imagem ?? 0, icon: Image, color: 'from-rose-500 to-rose-600' },
  ]);
</script>

<div class="space-y-8">
  <header>
    <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Painel do Sistema</h1>
    <p class="text-gray-500 mt-1 text-sm">Visão geral de todas as clínicas e catálogos.</p>
  </header>

  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {#each stats as stat}
      {@const Icon = stat.icon}
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br {stat.color} flex items-center justify-center">
            <Icon class="w-5 h-5 text-white" />
          </div>
        </div>
        <p class="text-2xl font-extrabold text-gray-900">{stat.value.toLocaleString('pt-BR')}</p>
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{stat.label}</p>
      </div>
    {/each}
  </div>
</div>
