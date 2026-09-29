<script lang="ts">
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  import { Building2, GraduationCap, Pill, FlaskConical, Image, Calculator, Shield, ScrollText, LayoutDashboard, LogOut, BookOpen } from 'lucide-svelte';

  let { children, data } = $props();

  const menuItems = [
    { path: '/sistema', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/sistema/clinicas', label: 'Clínicas', icon: Building2 },
    { path: '/sistema/estudantes', label: 'Estudantes', icon: GraduationCap },
    { path: '/sistema/medicamentos', label: 'Medicamentos', icon: Pill },
    { path: '/sistema/exames-lab', label: 'Exames Laboratoriais', icon: FlaskConical },
    { path: '/sistema/exames-imagem', label: 'Exames de Imagem', icon: Image },
    { path: '/sistema/calculadoras', label: 'Calculadoras', icon: Calculator },
    { path: '/sistema/guidelines', label: 'Guidelines', icon: BookOpen },
    { path: '/sistema/superadmins', label: 'Superadmins', icon: Shield },
    { path: '/sistema/logs', label: 'Logs do Sistema', icon: ScrollText },
  ];

  function isActive(path: string) {
    if (path === '/sistema') return page.url.pathname === '/sistema';
    return page.url.pathname.startsWith(path);
  }
</script>

<div class="flex min-h-screen bg-gray-950">
  <!-- Sidebar escura diferenciada -->
  <aside class="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 sticky top-0 self-start h-screen">
    <div class="p-5 border-b border-gray-800">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span class="text-white font-black text-sm">⬡</span>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white tracking-tight">ProntuárioWeb</h1>
          <p class="text-[10px] text-gray-500 font-medium">Painel do Sistema</p>
        </div>
      </div>
    </div>

    <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {#each menuItems as item}
        {@const Icon = item.icon}
        <a
          href={item.path}
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                 {isActive(item.path) 
                   ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20' 
                   : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'}"
        >
          <Icon class="w-4 h-4 shrink-0" />
          <span class="truncate">{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="p-4 border-t border-gray-800 space-y-3">
      <div class="flex items-center gap-3 px-3 py-2.5 bg-gray-800/60 rounded-xl border border-gray-700/50">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
          SA
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-gray-200 truncate">{data.superadmin?.nome}</p>
          <p class="text-[10px] text-gray-500 truncate">{data.superadmin?.email}</p>
        </div>
      </div>
      <form action="/logout" method="POST" use:enhance>
        <button type="submit" class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors">
          <LogOut class="w-3.5 h-3.5" />
          Sair do painel sistema
        </button>
      </form>
    </div>
  </aside>

  <!-- Conteúdo principal -->
  <main class="flex-1 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto p-8">
      {@render children()}
    </div>
  </main>
</div>
