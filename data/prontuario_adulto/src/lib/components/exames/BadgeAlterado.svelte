<script lang="ts">
  import { ArrowDown, ArrowUp, AlertTriangle, CheckCircle2 } from 'lucide-svelte';

  interface Props {
    alterado: boolean;
    valor?: number | null;
    refMin?: number | null;
    refMax?: number | null;
    size?: 'sm' | 'md';
    showNormal?: boolean;
  }

  let { alterado, valor = null, refMin = null, refMax = null, size = 'sm', showNormal = false }: Props = $props();

  let situacao = $derived.by(() => {
    if (!alterado) return 'normal';
    if (valor !== null && refMin !== null && valor < refMin) return 'abaixo';
    if (valor !== null && refMax !== null && valor > refMax) return 'acima';
    return 'alterado';
  });
</script>

{#if situacao === 'normal' && showNormal}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium {size === 'sm' ? 'text-[10px]' : 'text-xs'}">
    <CheckCircle2 class="w-3 h-3" /> Normal
  </span>
{:else if situacao === 'abaixo'}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold {size === 'sm' ? 'text-[10px]' : 'text-xs'} animate-in zoom-in-95">
    <ArrowDown class="w-3 h-3" /> Abaixo
  </span>
{:else if situacao === 'acima'}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold {size === 'sm' ? 'text-[10px]' : 'text-xs'} animate-in zoom-in-95">
    <ArrowUp class="w-3 h-3" /> Acima
  </span>
{:else if situacao === 'alterado'}
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold {size === 'sm' ? 'text-[10px]' : 'text-xs'}">
    <AlertTriangle class="w-3 h-3" /> Alterado
  </span>
{/if}
