/**
 * Store reativo que mantém as sínteses geradas durante a sessão da consulta.
 * Persiste entre aberturas/fechamentos do drawer (não perde ao fechar o painel).
 */

import type { SinteseGuidelineSalva } from '$lib/types/interacoes'

// Mapa: guideline_id → síntese gerada
const _sinteses = $state(new Map<string, SinteseGuidelineSalva>())

export const sintesesStore = {
  get: (guidelineId: string) => _sinteses.get(guidelineId),
  set: (guidelineId: string, sintese: SinteseGuidelineSalva) => {
    _sinteses.set(guidelineId, sintese)
  },
  tem: (guidelineId: string) => _sinteses.has(guidelineId),
  limpar: () => _sinteses.clear(),
  todos: () => [..._sinteses.values()],
}
