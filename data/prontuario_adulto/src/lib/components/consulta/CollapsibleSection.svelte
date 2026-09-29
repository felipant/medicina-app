<script lang="ts">
  import { slide } from 'svelte/transition';
  import { ChevronDown, ChevronUp } from 'lucide-svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    title?: string;
    header?: Snippet;
    children: Snippet;
    initialOpen?: boolean;
  }

  let { id, title = '', header, children, initialOpen = true }: Props = $props();
  let isOpen = $state(initialOpen);

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<section {id} class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-shadow duration-200 scroll-mt-24 focus-within:ring-2 focus-within:ring-indigo-500/20 hover:shadow-md">
  <button 
    type="button"
    onclick={toggle}
    class="w-full flex items-center justify-between px-6 py-4 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left border-b border-slate-100"
    aria-expanded={isOpen}
  >
    {#if header}
      {@render header()}
    {:else}
      <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
        <span class="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
        {title}
      </h3>
    {/if}
    <div class="text-slate-400">
      {#if isOpen}
        <ChevronUp class="w-5 h-5" />
      {:else}
        <ChevronDown class="w-5 h-5" />
      {/if}
    </div>
  </button>

  {#if isOpen}
    <div transition:slide={{ duration: 250 }} class="p-6">
      {@render children()}
    </div>
  {/if}
</section>
