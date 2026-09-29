<script lang="ts">
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';
  import { LogOut, Users, GraduationCap, LayoutDashboard, ChevronDown } from 'lucide-svelte';
  
  let { data, children } = $props();
  
  // Detecta se estamos em uma tela focada em atendimento que possui cabeçalho próprio
  let esConsulta = $derived($page.url.pathname.includes('/consulta/'));
  
  let menuAberto = $state(false);
</script>

{#if esConsulta}
  <!-- Renderização direta para o ambiente de workstation de consulta (tela cheia sem header global) -->
  {@render children()}
{:else}
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Topbar Global Moderno -->
    <nav class="sticky top-0 z-40 w-full bg-white border-b border-slate-200 h-16 flex items-center px-6 shadow-sm">
      <div class="flex items-center gap-3 mr-8">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-sm">
          P
        </div>
        <span class="text-lg font-extrabold text-slate-800 tracking-tight hidden sm:block">Prontuário<span class="text-indigo-600">Web</span></span>
      </div>

      <!-- Navegação Central -->
      <div class="flex items-center gap-1 text-sm font-semibold">
        <a 
          href="/pacientes" 
          class="px-4 py-2 rounded-xl flex items-center gap-2 transition-all
                 {$page.url.pathname.startsWith('/pacientes') 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
        >
          <Users class="w-4 h-4" /> Pacientes
        </a>
      </div>

      <!-- User Profile / Logout Lado Direito -->
      <div class="ml-auto flex items-center gap-4">
        <div class="relative">
          <button 
            onclick={() => menuAberto = !menuAberto}
            class="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
          >
            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm border border-slate-300 shadow-inner uppercase">
              {data.usuario?.nome?.substring(0,1) || 'U'}
            </div>
            <div class="hidden md:flex flex-col items-start leading-none">
               <span class="text-sm font-bold text-slate-800">{data.usuario?.nome || 'Usuário'}</span>
               <span class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{data.usuario?.role || 'Acesso'}</span>
            </div>
            <ChevronDown class="w-4 h-4 text-slate-400 ml-1 transition-transform {menuAberto ? 'rotate-180' : ''}" />
          </button>

          {#if menuAberto}
             <!-- Dropdown de menu overlay -->
             <div class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="px-4 py-2 border-b border-slate-50 mb-1">
                   <div class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Conta</div>
                   <div class="text-sm font-medium text-slate-800 truncate">{data.session?.user?.email}</div>
                </div>

                <form action="/logout" method="POST" use:enhance>
                   <button 
                     type="submit"
                     class="w-full px-4 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                   >
                     <LogOut class="w-4 h-4" />
                     Sair do Sistema
                   </button>
                </form>
             </div>
             <!-- Clique fora fecha -->
             <button class="fixed inset-0 z-40 bg-transparent w-full h-full cursor-default" onclick={() => menuAberto = false} aria-label="Fechar menu"></button>
          {/if}
        </div>
      </div>
    </nav>

    <!-- Conteúdo da Página Real -->
    <main class="flex-1 w-full">
      {@render children()}
    </main>
  </div>
{/if}
