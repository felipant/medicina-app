<script lang="ts">
  let {
    nome,
    significado,
    children,
  }: {
    nome: string
    significado: string | null
    children?: any
  } = $props()

  let visivel = $state(false)
  let tooltipEl = $state<HTMLDivElement | null>(null)
  let anchorEl = $state<HTMLSpanElement | null>(null)

  // Posição dinâmica para não sair da tela
  let estilo = $state('')

  function mostrar(e: MouseEvent) {
    if (!significado) return
    visivel = true
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const top = rect.bottom + window.scrollY + 6
    const left = Math.min(rect.left + window.scrollX, window.innerWidth - 340)
    estilo = `top:${top}px; left:${left}px;`
  }
</script>

<span
  bind:this={anchorEl}
  class="inline-flex items-center gap-1 cursor-help"
  onmouseenter={mostrar}
  onmouseleave={() => visivel = false}
>
  {@render children?.()}

  {#if significado}
    <!-- Ícone discreto indicando que há tooltip -->
    <span class="text-blue-400 text-xs select-none" aria-hidden="true">ⓘ</span>
  {/if}
</span>

{#if visivel && significado}
  <!-- Portal para o body para não ser cortado por overflow:hidden -->
  <div
    bind:this={tooltipEl}
    class="fixed z-[9999] w-80 p-3 bg-gray-900 text-white text-xs rounded-xl
           shadow-xl leading-relaxed pointer-events-none"
    style={estilo}
    role="tooltip"
  >
    <p class="font-medium text-blue-300 mb-1">{nome}</p>
    <p class="text-gray-200">{significado}</p>
  </div>
{/if}
