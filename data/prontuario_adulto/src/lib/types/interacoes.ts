export interface InteracaoDetectada {
  medicamento_a: string
  medicamento_b: string
  descricao: string
  severidade: 'high' | 'moderate' | 'low' | 'N/A'
  fonte: string
}

export interface ResultadoVerificacaoInteracoes {
  medicamentos_verificados: string[]
  medicamentos_nao_encontrados: string[]
  interacoes: InteracaoDetectada[]
  total_interacoes: number
  tem_interacao_grave: boolean
  tem_interacao_moderada: boolean
}

export interface GuidelineOut {
  id: string
  titulo: string
  organizacao: string
  url: string
  ano: number | null
  categoria: string
  descricao: string | null
  cids_relacionados: string[]
  tags: string[]
  ativo: boolean
  ordem: number
}

export interface ContextoPaciente {
  diagnosticos: string[]
  medicamentos: string[]
  sinais_vitais: Record<string, string>
}

export interface ChunkStream {
  content?: string
  done?: boolean
  erro?: string
  do_cache?: boolean
}

export interface SinteseGuidelineSalva {
  guideline_id: string
  conteudo: string
  gerado_em: string
  do_cache: boolean
}

