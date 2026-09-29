<script lang="ts">
  import { apiFetch } from '$lib/api'
  import type { GuidelineOut } from '$lib/types/interacoes'
  import SinteseConduta from './SinteseConduta.svelte'

  let {
    aberto = $bindable(false),
    accessToken,
    diagnosticos = [],
    prescricoes  = [],
    sinaisVitais = {},
    consultaId   = null,
    onInserirConduta,
  }: {
    aberto: boolean
    accessToken: string
    diagnosticos: any[]
    prescricoes: any[]
    sinaisVitais: Record<string, string>
    consultaId: string | null
    onInserirConduta?: (texto: string) => void
  } = $props()

  let guidelines       = $state<GuidelineOut[]>([])
  let todoOsGuidelines = $state<GuidelineOut[]>([])
  let categorias       = $state<string[]>([])
  let busca            = $state('')
  let categoriaSelecionada = $state<string | null>(null)
  let carregando       = $state(false)
  let modo             = $state<'automatico' | 'busca'>('automatico')

  // Ao abrir: carrega automaticamente os guidelines dos CIDs da consulta
  $effect(() => {
    if (aberto) {
      carregarAutomatico()
      carregarCategorias()
    }
  })

  async function carregarAutomatico() {
    const cids = diagnosticos
      .filter(d => d.cid_subcat && d.status_resolucao !== 'resolvido')
      .map(d => d.cid_subcat!)
      .join(',')

    if (!cids) {
      modo = 'busca'
      await carregarTodos()
      return
    }

    carregando = true
    try {
      guidelines = await apiFetch<GuidelineOut[]>(
        `/api/v1/guidelines/por-cids?cids=${encodeURIComponent(cids)}`,
        accessToken
      )
      modo = 'automatico'
    } catch {
      guidelines = []
    } finally {
      carregando = false
    }
  }

  async function carregarTodos() {
    carregando = true
    try {
      const params = new URLSearchParams()
      if (busca) params.set('q', busca)
      if (categoriaSelecionada) params.set('categoria', categoriaSelecionada)
      params.set('limit', '50')
      todoOsGuidelines = await apiFetch<GuidelineOut[]>(
        `/api/v1/guidelines?${params}`,
        accessToken
      )
    } catch {
      todoOsGuidelines = []
    } finally {
      carregando = false
    }
  }

  async function carregarCategorias() {
    try {
      categorias = await apiFetch<string[]>('/api/v1/guidelines/categorias', accessToken)
    } catch {
      categorias = []
    }
  }

  // Debounce da busca
  let timer: ReturnType<typeof setTimeout>
  $effect(() => {
    if (modo === 'busca') {
      clearTimeout(timer)
      timer = setTimeout(carregarTodos, 300)
    }
  })

  const guidelinesExibidos = $derived(
    modo === 'automatico' ? guidelines : todoOsGuidelines
  )

  function corOrganizacao(org: string): string {
    const mapa: Record<string, string> = {
      'SBC': 'bg-blue-100 text-blue-700',
      'SBD': 'bg-green-100 text-green-700',
      'SBPT': 'bg-cyan-100 text-cyan-700',
      'CFM': 'bg-purple-100 text-purple-700',
      'ADA': 'bg-indigo-100 text-indigo-700',
      'ESC': 'bg-blue-100 text-blue-700',
      'GOLD': 'bg-amber-100 text-amber-700',
      'GINA': 'bg-teal-100 text-teal-700',
      'NICE': 'bg-rose-100 text-rose-700',
      'ACR': 'bg-orange-100 text-orange-700',
      'KDIGO': 'bg-violet-100 text-violet-700',
    }
    return mapa[org] ?? 'bg-gray-100 text-gray-600'
  }

  function inserirNoPlano(texto: string) {
    onInserirConduta?.(texto)
  }
</script>

<!-- Overlay -->
{#if aberto}
  <div class="fixed inset-0 bg-black/20 z-40"
       onclick={() => aberto = false}
       aria-hidden="true"></div>
{/if}

<!-- Gaveta -->
<div
  class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50
         transform transition-transform duration-300 ease-in-out flex flex-col
         {aberto ? 'translate-x-0' : 'translate-x-full'}"
  role="dialog"
  aria-label="Guidelines clínicos"
>
  <!-- Cabeçalho -->
  <div class="px-5 py-4 border-b border-gray-100">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold text-gray-900">📋 Guidelines</h3>
      <button onclick={() => aberto = false}
              class="text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
        ✕
      </button>
    </div>

    <!-- Toggle automático / busca -->
    <div class="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
      <button
        onclick={() => { modo = 'automatico'; carregarAutomatico() }}
        class="flex-1 py-1.5 text-xs rounded-md transition-colors
               {modo === 'automatico'
                 ? 'bg-white text-gray-800 font-medium shadow-sm'
                 : 'text-gray-500 hover:text-gray-700'}"
      >
        Para esta consulta
      </button>
      <button
        onclick={() => { modo = 'busca'; carregarTodos() }}
        class="flex-1 py-1.5 text-xs rounded-md transition-colors
               {modo === 'busca'
                 ? 'bg-white text-gray-800 font-medium shadow-sm'
                 : 'text-gray-500 hover:text-gray-700'}"
      >
        Buscar todos
      </button>
    </div>

    <!-- Busca (modo busca) -->
    {#if modo === 'busca'}
      <div class="mt-3 space-y-2">
        <input
          type="text"
          bind:value={busca}
          placeholder="Buscar por título, organização ou palavra-chave..."
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex gap-1 flex-wrap">
          <button
            onclick={() => categoriaSelecionada = null}
            class="text-xs px-2 py-1 rounded-full border transition-colors
                   {!categoriaSelecionada
                     ? 'bg-blue-600 text-white border-blue-600'
                     : 'border-gray-200 text-gray-500 hover:border-gray-300'}"
          >
            Todas
          </button>
          {#each categorias as cat}
            <button
              onclick={() => categoriaSelecionada = cat}
              class="text-xs px-2 py-1 rounded-full border transition-colors
                     {categoriaSelecionada === cat
                       ? 'bg-blue-600 text-white border-blue-600'
                       : 'border-gray-200 text-gray-500 hover:border-gray-300'}"
            >
              {cat}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Lista de guidelines -->
  <div class="flex-1 overflow-y-auto">
    {#if carregando}
      <div class="flex items-center justify-center py-12">
        <span class="text-xl animate-spin text-gray-400">⟳</span>
      </div>

    {:else if guidelinesExibidos.length === 0}
      <div class="flex flex-col items-center justify-center py-12 px-5 text-center">
        {#if modo === 'automatico'}
          <p class="text-4xl mb-3">📋</p>
          <p class="text-sm font-medium text-gray-600">
            Nenhum guideline encontrado para os diagnósticos desta consulta
          </p>
          <p class="text-xs text-gray-400 mt-2">
            Adicione hipóteses diagnósticas com CID-10 na seção A para ver
            guidelines relevantes automaticamente
          </p>
          <button
            onclick={() => { modo = 'busca'; carregarTodos() }}
            class="mt-4 text-sm text-blue-600 underline"
          >
            Buscar todos os guidelines
          </button>
        {:else}
          <p class="text-sm text-gray-400">Nenhum guideline encontrado</p>
        {/if}
      </div>

    {:else}
      <!-- CIDs da consulta (modo automático) -->
      {#if modo === 'automatico' && diagnosticos.filter(d => d.cid_subcat).length > 0}
        <div class="px-5 py-3 bg-blue-50 border-b border-blue-100">
          <p class="text-xs text-blue-700 font-medium mb-1">Baseado nos diagnósticos:</p>
          <div class="flex flex-wrap gap-1">
            {#each diagnosticos.filter(d => d.cid_subcat && d.status_resolucao !== 'resolvido') as diag}
              <span class="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {diag.cid_subcat}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <ul class="divide-y divide-gray-50">
        {#each guidelinesExibidos as g (g.id)}
          <li class="px-5 py-4">
            <!-- Linha do guideline -->
            <div class="flex items-start justify-between gap-2 mb-2">
              <a href={g.url} target="_blank" rel="noopener noreferrer"
                 class="group flex-1">
                <div class="flex items-start justify-between gap-1">
                  <span class="text-sm font-medium text-gray-800
                               group-hover:text-blue-600 leading-snug transition-colors">
                    {g.titulo}
                  </span>
                  <span class="text-blue-400 shrink-0 group-hover:text-blue-600
                               transition-colors text-xs">↗</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap mt-1">
                  <span class="text-xs px-2 py-0.5 rounded-full {corOrganizacao(g.organizacao)}">
                    {g.organizacao}
                  </span>
                  <span class="text-xs text-gray-400">{g.categoria}</span>
                  {#if g.ano}
                    <span class="text-xs text-gray-300">· {g.ano}</span>
                  {/if}
                </div>
              </a>
            </div>

            {#if g.descricao}
              <p class="text-xs text-gray-400 mb-2 leading-relaxed">{g.descricao}</p>
            {/if}

            <!-- Botão e painel de síntese -->
            <SinteseConduta
              guideline={g}
              {consultaId}
              {accessToken}
              {diagnosticos}
              {prescricoes}
              {sinaisVitais}
              onInserirNoPlano={inserirNoPlano}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <!-- Rodapé -->
  <div class="px-5 py-3 border-t border-gray-100 bg-gray-50">
    <p class="text-xs text-gray-400 text-center">
      Links para publicações oficiais das sociedades médicas.
      Abrem em nova aba.
    </p>
  </div>
</div>
