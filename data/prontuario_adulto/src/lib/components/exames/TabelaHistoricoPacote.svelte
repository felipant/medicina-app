<script lang="ts">
  import TooltipSignificado from './TooltipSignificado.svelte'
  import type { HistoricoPorPacote, SerieHistorica, SerieHistoricaItem } from '$lib/stores/exames.svelte'

  let { pacote }: { pacote: HistoricoPorPacote } = $props()

  // Coleta todas as datas únicas ordenadas crescentemente
  const datas = $derived(() => {
    const set = new Set<string>()
    pacote.exames.forEach(e => e.pontos.forEach(p => set.add(p.data_coleta)))
    return [...set].sort()
  })

  // Para uma série e uma data, retorna o ponto correspondente ou null
  function pontoPorData(serie: SerieHistorica, data: string): SerieHistoricaItem | null {
    return serie.pontos.find(p => p.data_coleta === data) ?? null
  }

  function classeValor(ponto: SerieHistoricaItem, serie: SerieHistorica): string {
    if (!ponto.valor_numerico || !serie.ref_min || !serie.ref_max) return 'text-gray-700'
    const v = ponto.valor_numerico
    const margem = 0.2
    if (v < serie.ref_min) {
      return v < serie.ref_min * (1 - margem) ? 'text-red-600 font-medium' : 'text-amber-600'
    }
    if (v > serie.ref_max) {
      return v > serie.ref_max * (1 + margem) ? 'text-red-600 font-medium' : 'text-amber-600'
    }
    return 'text-gray-800'
  }

  function setaValor(ponto: SerieHistoricaItem, serie: SerieHistorica): string {
    if (!ponto.valor_numerico || !serie.ref_min || !serie.ref_max) return ''
    if (ponto.valor_numerico < serie.ref_min) return ' ↓'
    if (ponto.valor_numerico > serie.ref_max) return ' ↑'
    return ''
  }

  function formatarRef(serie: SerieHistorica): string {
    if (serie.ref_texto) return serie.ref_texto
    const min = serie.ref_min != null ? String(serie.ref_min).replace('.', ',') : null
    const max = serie.ref_max != null ? String(serie.ref_max).replace('.', ',') : null
    if (min && max) return `${min}–${max}`
    if (max) return `< ${max}`
    if (min) return `> ${min}`
    return '—'
  }

  function formatarData(iso: string): string {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y.slice(2)}`
  }

  const datasVisiveis = $derived(() => datas().slice(-8))  // últimas 8
  const datasMaisAntigas = $derived(() => datas().length > 8)
</script>

<div class="bg-white border border-gray-100 rounded-2xl overflow-hidden">
  <!-- Cabeçalho do pacote -->
  <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
    <h3 class="text-sm font-semibold text-gray-800">{pacote.pacote}</h3>
    {#if datasMaisAntigas()}
      <span class="text-xs text-gray-400">
        Exibindo últimas 8 de {datas().length} coletas
      </span>
    {/if}
  </div>

  <!-- Tabela com scroll horizontal -->
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="bg-gray-50">
          <th class="text-left px-4 py-2 font-medium text-gray-600 sticky left-0 bg-gray-50
                     border-b border-gray-100 min-w-[160px]">
            Exame
          </th>
          {#each datasVisiveis() as data, i}
            <th class="px-4 py-2 font-medium text-gray-600 border-b border-gray-100
                       text-right whitespace-nowrap
                       {i === datasVisiveis().length - 1 ? 'bg-blue-50' : ''}">
              {formatarData(data)}
            </th>
          {/each}
          <th class="px-4 py-2 font-medium text-gray-500 border-b border-gray-100
                     text-right bg-gray-50 border-l border-gray-200 whitespace-nowrap">
            Ref.
          </th>
        </tr>
      </thead>
      <tbody>
        {#each pacote.exames as serie}
          <tr class="border-b border-gray-50 hover:bg-gray-50/50">
            <!-- Nome do exame com tooltip -->
            <td class="px-4 py-2.5 sticky left-0 bg-white font-medium text-gray-700">
              <TooltipSignificado nome={serie.nome_exame} significado={serie.significado ?? null}>
                <span>{serie.nome_exame}</span>
              </TooltipSignificado>
              {#if serie.unidade}
                <span class="text-xs text-gray-400 ml-1">({serie.unidade})</span>
              {/if}
            </td>

            <!-- Resultados por data -->
            {#each datasVisiveis() as data, i}
              {@const ponto = pontoPorData(serie, data)}
              <td class="px-4 py-2.5 text-right
                         {i === datasVisiveis().length - 1 ? 'bg-blue-50' : ''}">
                {#if ponto}
                  {#if serie.tipo_resultado === 'numerico' && ponto.valor_numerico != null}
                    <span class={classeValor(ponto, serie)}>
                      {ponto.valor_numerico.toLocaleString('pt-BR')}{setaValor(ponto, serie)}
                    </span>
                  {:else if ponto.valor_qualitativo}
                    <span class={ponto.alterado ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {ponto.valor_qualitativo}
                    </span>
                  {:else}
                    <span class="text-gray-400">—</span>
                  {/if}
                {:else}
                  <span class="text-gray-300">—</span>
                {/if}
              </td>
            {/each}

            <!-- Referência -->
            <td class="px-4 py-2.5 text-right text-xs text-gray-500
                       bg-gray-50 border-l border-gray-200 whitespace-nowrap">
              {formatarRef(serie)}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
