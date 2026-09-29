<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';

  interface Subsection {
    id: string;
    label: string;
  }

  interface Props {
    secaoAtiva: 'S' | 'O' | 'A' | 'P';
    subsections: Subsection[];
    completude: { S: number; O: number; A: number; P: number };
    children: Snippet;
  }

  let { secaoAtiva, subsections, completude, children }: Props = $props();
  
  let sidebarExpanded = $state(true);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      // Offset to account for the fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

<div class="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 transition-all duration-300">
  <!-- Sidebar de Subseções Expansível -->
  <aside 
    class="bg-white border-r border-slate-200 sticky top-16 self-start overflow-hidden transition-all duration-300 z-20 hidden md:flex flex-col"
    style="width: {sidebarExpanded ? '240px' : '64px'}; height: calc(100vh - 4rem);"
  >
    <!-- Header da Sidebar -->
    <div class="flex items-center justify-between p-4 border-b border-slate-100">
      {#if sidebarExpanded}
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Menu class="w-3.5 h-3.5" />
          Índice
        </h4>
      {/if}
      <button 
        onclick={() => sidebarExpanded = !sidebarExpanded} 
        class="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors {sidebarExpanded ? '' : 'mx-auto'}"
        title={sidebarExpanded ? "Recolher" : "Expandir"}
      >
        {#if sidebarExpanded}
          <PanelLeftClose class="w-4 h-4" />
        {:else}
          <PanelLeftOpen class="w-4 h-4" />
        {/if}
      </button>
    </div>

    <!-- Lista de Subseções -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
      {#each subsections as sub}
        <button
          onclick={() => scrollTo(sub.id)}
          class="group w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-left
                 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <div class="w-6 h-6 shrink-0 flex items-center justify-center bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
             {sub.label.substring(0,2).toUpperCase()}
          </div>
          {#if sidebarExpanded}
             <span class="truncate flex-1 text-xs font-semibold">{sub.label}</span>
             <ChevronRight class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 -translate-x-1 group-hover:translate-x-0 transition-all" />
          {/if}
        </button>
      {/each}
    </nav>
  </aside>

  <!-- Barra horizontal mobile -->
  <div class="md:hidden flex items-center gap-2 overflow-x-auto bg-white px-4 py-2 border-b border-slate-200 sticky top-16 z-20 no-scrollbar shadow-sm">
     {#each subsections as sub}
       <button 
         onclick={() => scrollTo(sub.id)}
         class="whitespace-nowrap px-3 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600 border border-slate-200">
         {sub.label}
       </button>
     {/each}
  </div>

  <!-- Área Principal de Conteúdo -->
  <main class="flex-1 p-4 md:p-8 lg:p-10 overflow-hidden">
    <div class="max-w-4xl mx-auto">
      {@render children()}
    </div>
  </main>
</div>

<style>
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
