<script lang="ts">
  import { ScrollText } from 'lucide-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function formatarData(d: string) {
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="space-y-6">
  <header>
    <h1 class="text-2xl font-extrabold text-gray-900">Logs do Sistema</h1>
    <p class="text-sm text-gray-500">Auditoria de ações realizadas por superadmins.</p>
  </header>

  <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
          <th class="px-5 py-3 text-left">Data/Hora</th>
          <th class="px-5 py-3 text-left">Superadmin</th>
          <th class="px-5 py-3 text-left">Ação</th>
          <th class="px-5 py-3 text-left">Entidade</th>
          <th class="px-5 py-3 text-left">ID</th>
          <th class="px-5 py-3 text-left">IP</th>
        </tr>
      </thead>
      <tbody>
        {#each data.logs as log}
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="px-5 py-3 text-gray-600 text-xs font-mono whitespace-nowrap">{formatarData(log.criado_em)}</td>
            <td class="px-5 py-3 font-semibold text-gray-900 text-xs">{log.superadmin_nome || '—'}</td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                {log.acao}
              </span>
            </td>
            <td class="px-5 py-3 text-gray-600 text-xs">{log.entidade || '—'}</td>
            <td class="px-5 py-3 text-gray-400 font-mono text-[10px]">{log.entidade_id ? log.entidade_id.substring(0, 8) + '...' : '—'}</td>
            <td class="px-5 py-3 text-gray-400 text-xs font-mono">{log.ip || '—'}</td>
          </tr>
        {/each}
        {#if data.logs.length === 0}
          <tr><td colspan="6" class="px-5 py-12 text-center text-gray-400 text-sm">Nenhum log registrado ainda.</td></tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
