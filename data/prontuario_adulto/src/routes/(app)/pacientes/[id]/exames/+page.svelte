<script lang="ts">
  import type { PageData } from './$types';
  import { invalidateAll } from '$app/navigation';
  import { ArrowLeft, FlaskConical } from 'lucide-svelte';
  import ExameFormInsercao from '$lib/components/exames/ExameFormInsercao.svelte';
  import HistoricoExames from '$lib/components/exames/HistoricoExames.svelte';

  let { data }: { data: PageData } = $props();

  function refreshView() {
      // Força SvelteKit a disparar o load() novamente e atualizar historico de forma reativa e fluida.
      invalidateAll();
  }
</script>

<svelte:head>
  <title>Exames - {data.paciente.nome}</title>
</svelte:head>

<div class="min-h-screen bg-slate-50/40 p-6 space-y-6">
  <header class="max-w-7xl mx-auto flex items-center justify-between">
     <div class="flex items-center gap-4">
        <a href="/pacientes" class="bg-white border border-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
           <ArrowLeft class="w-5 h-5" />
        </a>
        <div>
           <div class="flex items-center gap-2 text-indigo-600 font-medium text-xs uppercase tracking-wider mb-0.5">
              <FlaskConical class="w-3.5 h-3.5" /> Módulo de Apoio Diagnóstico
           </div>
           <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">
              Exames de <span class="text-slate-500 font-normal">{data.paciente.nome}</span>
           </h1>
        </div>
     </div>
  </header>

  <main class="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
     <!-- Esquerda: FORMULÁRIO DE INSERÇÃO -->
     <section class="xl:col-span-4 2xl:col-span-3 flex flex-col h-full">
         <ExameFormInsercao 
           pacienteId={data.paciente.id} 
           pacienteSexo={data.paciente.sexo}
           accessToken={data.accessToken}
           onsuccess={refreshView}
         />
     </section>

     <!-- Direita: VISUALIZAÇÃO HISTÓRICA -->
     <section class="xl:col-span-8 2xl:col-span-9 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 h-full min-h-[600px]">
         <HistoricoExames historico={data.historico} />
     </section>
  </main>
</div>
