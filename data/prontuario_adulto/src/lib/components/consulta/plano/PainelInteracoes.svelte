<script lang="ts">
  import { apiFetch } from '$lib/api'
  import type { ResultadoVerificacaoInteracoes, InteracaoDetectada } from '$lib/types/interacoes'

  let {
    aberto = $bindable(false),
    consultaId,
    accessToken,
    onResultado,
  }: {
    aberto: boolean
    consultaId: string
    accessToken: string
    onResultado?: (r: ResultadoVerificacaoInteracoes) => void
  } = $props()

  let resultado = $state<ResultadoVerificacaoInteracoes | null>(null)
  let carregando = $state(false)
  let erro = $state<string | null>(null)

  // Verifica automaticamente ao abrir
  $effect(() => {
    if (aberto && !resultado) {
      verificar()
    }
  })

  async function verificar() {
    carregando = true
    erro = null
    try {
      resultado = await apiFetch<ResultadoVerificacaoInteracoes>(
        `/api/v1/interacoes/consulta/${consultaId}`,
        accessToken
      )
      onResultado?.(resultado)
    } catch (e: any) {
      erro = e.message ?? 'Erro ao verificar interações'
    } finally {
      carregando = false
    }
  }

  const corSeveridade = {
    high:     { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    label: '⚠ Grave'     },
    moderate: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700', label: '⚡ Moderada'  },
    low:      { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',  label: 'ℹ Leve'      },
    'N/A':    { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600',   badge: 'bg-gray-100 text-gray-600',  label: '— Leve'      },
  } as const
</script>

<!-- Overlay escuro -->
{#if aberto}
  <div class="fixed inset-0 bg-black/20 z-40"
       onclick={() => aberto = false}
       aria-hidden="true"></div>
{/if}

<!-- Gaveta lateral -->
<div
  class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50
         transform transition-transform duration-300 ease-in-out flex flex-col
         {aberto ? 'translate-x-0' : 'translate-x-full'}"
  role="dialog"
  aria-label="Verificação de interações medicamentosas"
>
  <!-- Cabeçalho do painel -->
  <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
    <div>
      <h3 class="text-base font-semibold text-gray-900">💊 Interações Medicamentosas</h3>
      <p class="text-xs text-gray-400 mt-0.5">
        Fonte: NLM Drug Interaction API · Dados em inglês
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button onclick={verificar}
              disabled={carregando}
              class="text-xs px-3 py-1.5 border border-gray-200 rounded-lg
                     text-gray-600 hover:bg-gray-50 disabled:opacity-40">
        {carregando ? '⟳ Verificando...' : '↻ Atualizar'}
      </button>
      <button onclick={() => aberto = false}
              class="text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
        ✕
      </button>
    </div>
  </div>

  <!-- Conteúdo rolável -->
  <div class="flex-1 overflow-y-auto p-5 space-y-4">

    {#if carregando}
      <div class="flex flex-col items-center justify-center py-12 gap-3">
        <span class="text-2xl animate-spin">⟳</span>
        <p class="text-sm text-gray-400">Consultando base de dados da NLM...</p>
        <p class="text-xs text-gray-300">Pode levar alguns segundos</p>
      </div>

    {:else if erro}
      <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p class="text-sm text-red-700">{erro}</p>
        <button onclick={verificar} class="text-xs text-red-600 underline mt-2">
          Tentar novamente
        </button>
      </div>

    {:else if resultado}

      <!-- Resumo -->
      {#if resultado.total_interacoes === 0}
        <div class="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <p class="text-2xl mb-2">✅</p>
          <p class="text-sm font-medium text-green-700">Nenhuma interação detectada</p>
          <p class="text-xs text-green-600 mt-1">
            Entre os medicamentos verificados com sucesso
          </p>
        </div>
      {:else}
        <!-- Alerta de gravidade -->
        {#if resultado.tem_interacao_grave}
          <div class="p-3 bg-red-50 border border-red-300 rounded-xl flex gap-3">
            <span class="text-xl">🚨</span>
            <div>
              <p class="text-sm font-semibold text-red-700">
                {resultado.interacoes.filter(i => i.severidade === 'high').length}
                interação(ões) grave(s) detectada(s)
              </p>
              <p class="text-xs text-red-600 mt-0.5">
                Revise a prescrição antes de finalizar a consulta
              </p>
            </div>
          </div>
        {:else if resultado.tem_interacao_moderada}
          <div class="p-3 bg-amber-50 border border-amber-300 rounded-xl flex gap-3">
            <span class="text-xl">⚡</span>
            <div>
              <p class="text-sm font-semibold text-amber-700">
                Interação(ões) moderada(s) detectada(s)
              </p>
              <p class="text-xs text-amber-600 mt-0.5">
                Avalie a necessidade de ajuste
              </p>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Lista de interações -->
      {#each resultado.interacoes as interacao}
        {@const cor = corSeveridade[interacao.severidade] ?? corSeveridade['N/A']}
        <div class="border {cor.border} {cor.bg} rounded-xl p-4 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-sm text-gray-800">
                {interacao.medicamento_a}
              </span>
              <span class="text-gray-400 text-sm">+</span>
              <span class="font-medium text-sm text-gray-800">
                {interacao.medicamento_b}
              </span>
            </div>
            <span class="shrink-0 text-xs px-2 py-0.5 rounded-full {cor.badge}">
              {cor.label}
            </span>
          </div>
          <p class="text-sm {cor.text} leading-relaxed">{interacao.descricao}</p>
        </div>
      {/each}

      <!-- Medicamentos não verificados -->
      {#if resultado.medicamentos_nao_encontrados.length > 0}
        <div class="p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p class="text-xs font-medium text-gray-600 mb-1">
            Não verificados (não encontrados na base):
          </p>
          <div class="flex flex-wrap gap-1">
            {#each resultado.medicamentos_nao_encontrados as nome}
              <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                {nome}
              </span>
            {/each}
          </div>
          <p class="text-xs text-gray-400 mt-2">
            A base usa nomes genéricos internacionais (inglês/INN).
            Nomes de marca ou termos em português podem não ser reconhecidos.
          </p>
        </div>
      {/if}

      <!-- Medicamentos verificados com sucesso -->
      {#if resultado.medicamentos_verificados.length > 0}
        <div class="pt-2">
          <p class="text-xs text-gray-400 mb-1">Verificados com sucesso:</p>
          <div class="flex flex-wrap gap-1">
            {#each resultado.medicamentos_verificados as nome}
              <span class="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100">
                ✓ {nome}
              </span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Disclaimer -->
      <div class="pt-2 border-t border-gray-100">
        <p class="text-xs text-gray-400 leading-relaxed">
          Esta verificação usa a base de dados da NLM (National Library of Medicine)
          e tem caráter auxiliar. Não substitui o julgamento clínico.
          Interações podem não estar catalogadas ou ter relevância variável
          de acordo com o contexto do paciente.
        </p>
      </div>
    {/if}

  </div>
</div>
