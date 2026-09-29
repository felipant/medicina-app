<script lang="ts">
  import { PUBLIC_API_URL } from '$env/static/public'
  import { apiFetch } from '$lib/api'
  import { sintesesStore } from '$lib/stores/sinteses.svelte'
  import type { GuidelineOut } from '$lib/types/interacoes'

  let {
    guideline,
    consultaId = null,
    accessToken,
    diagnosticos = [],
    prescricoes  = [],
    sinaisVitais = {},
    onInserirNoPlano,
  }: {
    guideline: GuidelineOut
    consultaId: string | null
    accessToken: string
    diagnosticos: any[]
    prescricoes: any[]
    sinaisVitais: Record<string, string>
    onInserirNoPlano?: (texto: string) => void
  } = $props()

  // Estados do componente
  let gerando       = $state(false)
  let erro          = $state<string | null>(null)
  let textoCorrente = $state('')
  let doCacheFlag   = $state(false)
  let aberto        = $state(false)
  let groqDisponivel = $state<boolean | null>(null)
  let copiado       = $state(false)

  // Verifica se Groq está disponível ao montar
  $effect(() => {
    apiFetch<{ disponivel: boolean }>('/api/v1/groq/disponivel', accessToken)
      .then(r => groqDisponivel = r.disponivel)
      .catch(() => groqDisponivel = false)
  })

  // Verifica se já há síntese em cache para este guideline
  $effect(() => {
    const cached = sintesesStore.get(guideline.id)
    if (cached) {
      textoCorrente = cached.conteudo
      doCacheFlag   = cached.do_cache
      aberto        = true
    }
  })

  async function gerarSintese(forcarNovo = false) {
    aberto        = true
    gerando       = true
    erro          = null
    textoCorrente = ''
    doCacheFlag   = false

    // Montar contexto clínico do paciente
    const contexto = {
      diagnosticos: diagnosticos
        .filter((d: any) => d.status_resolucao !== 'resolvido' && d.cid_subcat)
        .map((d: any) => `${d.cid_subcat} — ${d.cid_descricao ?? d.descricao_livre ?? ''}`),
      medicamentos: prescricoes
        .filter((p: any) => p.status === 'ativo')
        .map((p: any) => [p.principio_ativo, p.concentracao, p.frequencia]
          .filter(Boolean).join(' ')),
      sinais_vitais: sinaisVitais,
    }

    const body = {
      guideline_id: guideline.id,
      consulta_id:  consultaId,
      contexto,
      usar_cache:   !forcarNovo,
    }

    try {
      const response = await fetch(
        `${PUBLIC_API_URL}/api/v1/condutas/stream`,
        {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail ?? `Erro HTTP ${response.status}`)
      }

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          try {
            const data = JSON.parse(jsonStr)

            if (data.erro) {
              erro = data.erro
              gerando = false
              return
            }
            if (data.content) {
              textoCorrente += data.content
              doCacheFlag    = data.do_cache ?? false
            }
            if (data.done) {
              gerando = false
              sintesesStore.set(guideline.id, {
                guideline_id: guideline.id,
                conteudo:     textoCorrente,
                gerado_em:    new Date().toISOString(),
                do_cache:     doCacheFlag,
              })
            }
          } catch {
            // ignorar JSON inválido
          }
        }
      }
    } catch (e: any) {
      erro    = e.message ?? 'Erro ao conectar ao serviço de IA'
      gerando = false
    }
  }

  function markdownParaHtml(texto: string): string {
    return texto
      .replace(/^## (.+)$/gm, '<h4 class="text-sm font-semibold text-gray-800 mt-4 mb-1.5 flex items-center gap-1.5">$1</h4>')
      .replace(/^### (.+)$/gm, '<h5 class="text-xs font-semibold text-gray-700 mt-3 mb-1">$1</h5>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="text-gray-500">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="text-sm text-gray-700 ml-3">• $1</li>')
      .replace(/^---$/gm, '<hr class="border-gray-100 my-3" />')
      .replace(/\n\n/g, '<br />')
      .replace(/\n/g, '<br />')
  }

  function copiarTexto() {
    navigator.clipboard.writeText(textoCorrente)
    copiado = true
    setTimeout(() => copiado = false, 2000)
  }
</script>

<!-- Botão de acionar a síntese -->
{#if groqDisponivel === false}
  <button
    disabled
    title="Integração com IA não configurada. Configure GROQ_API_KEY no servidor."
    class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
           border border-gray-200 text-gray-300 cursor-not-allowed"
  >
    ✨ Sintetizar
  </button>
{:else if groqDisponivel}
  <button
    onclick={() => aberto ? (aberto = false) : gerarSintese()}
    class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border
           transition-all
           {aberto
             ? 'bg-violet-100 border-violet-300 text-violet-700'
             : 'border-gray-200 text-gray-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700'}"
  >
    <span class={gerando ? 'animate-pulse' : ''}>✨</span>
    {#if gerando}
      Gerando...
    {:else if aberto}
      Ocultar síntese
    {:else if sintesesStore.tem(guideline.id)}
      Ver síntese
    {:else}
      Sintetizar condutas
    {/if}
  </button>
{/if}

<!-- Painel de síntese expansível -->
{#if aberto}
  <div class="mt-3 border border-violet-100 rounded-xl bg-violet-50/30 overflow-hidden">

    <!-- Cabeçalho do painel -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-violet-100 bg-violet-50/50">
      <div class="flex items-center gap-2">
        <span class="text-violet-600 text-sm">✨</span>
        <span class="text-xs font-medium text-violet-700">
          Síntese de condutas — {guideline.organizacao}
        </span>
        {#if doCacheFlag}
          <span class="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-500 rounded-full">
            cache
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-1.5">
        {#if textoCorrente && !gerando}
          <button
            onclick={copiarTexto}
            title="Copiar texto"
            class="text-xs px-2 py-1 text-violet-500 hover:text-violet-700
                   hover:bg-violet-100 rounded transition-colors"
          >
            {copiado ? '✓ Copiado' : '📋 Copiar'}
          </button>
          {#if onInserirNoPlano}
            <button
              onclick={() => onInserirNoPlano?.(textoCorrente)}
              class="text-xs px-2 py-1 bg-violet-600 text-white rounded
                     hover:bg-violet-700 transition-colors"
            >
              ↓ Inserir no Plano
            </button>
          {/if}
          <button
            onclick={() => gerarSintese(true)}
            title="Gerar novamente (ignora cache)"
            class="text-xs px-2 py-1 text-violet-400 hover:text-violet-600
                   hover:bg-violet-100 rounded transition-colors"
          >
            ↻
          </button>
        {/if}
      </div>
    </div>

    <!-- Conteúdo -->
    <div class="px-4 py-3">
      {#if erro}
        <div class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span class="text-red-500 text-sm shrink-0">⚠</span>
          <div>
            <p class="text-sm text-red-700 font-medium">Erro ao gerar síntese</p>
            <p class="text-xs text-red-600 mt-0.5">{erro}</p>
            <button
              onclick={() => gerarSintese(true)}
              class="text-xs text-red-600 underline mt-1"
            >
              Tentar novamente
            </button>
          </div>
        </div>

      {:else if gerando && !textoCorrente}
        <div class="flex items-center gap-3 py-4">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                  style="animation-delay: 300ms"></span>
          </div>
          <p class="text-sm text-violet-600">
            Consultando Llama 3.1 via Groq...
          </p>
        </div>

      {:else if textoCorrente}
        <div class="prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html markdownParaHtml(textoCorrente)}
          {#if gerando}
            <span class="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 animate-pulse align-middle"></span>
          {/if}
        </div>

        {#if !gerando}
          <div class="mt-3 pt-3 border-t border-violet-100">
            <p class="text-xs text-gray-400 leading-relaxed">
              🤖 Gerado por Llama 3.1 70B via Groq com base no guideline selecionado.
              Uso exclusivamente educacional e de apoio à decisão clínica.
              Não substitui julgamento clínico nem leitura do guideline original.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
