<script lang="ts">
  import { page } from '$app/state';
  import { LayoutDashboard, Users, Settings } from 'lucide-svelte';

  let { children } = $props();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/usuarios', label: 'Usuários', icon: Users },
    { path: '/admin/clinica', label: 'Configurações da Clínica', icon: Settings },
  ];

  function isActive(path: string) {
    if (path === '/admin') return page.url.pathname === '/admin';
    return page.url.pathname.startsWith(path);
  }
</script>

<div class="flex min-h-[calc(100vh-4rem)] bg-slate-50/50">
  <!-- Sidebar Admin -->
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)]">
    <div class="p-6">
      <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Administração</h2>
      <nav class="space-y-1">
        {#each menuItems as item}
          {@const Icon = item.icon}
          <a
            href={item.path}
            class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                   {isActive(item.path) 
                     ? 'bg-indigo-50 text-indigo-700' 
                     : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
          >
            <Icon class="w-4 h-4" />
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
    
    <div class="mt-auto p-6 border-t border-slate-100">
      <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
          AD
        </div>
        <div>
          <p class="text-xs font-semibold text-slate-800">Sistema</p>
          <p class="text-[10px] text-slate-500">Admin de Clínica</p>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-8 overflow-y-auto">
    {@render children()}
  </main>
</div>
