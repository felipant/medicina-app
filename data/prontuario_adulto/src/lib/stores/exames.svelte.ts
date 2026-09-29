export interface SerieHistoricaItem {
  id: string
  data_coleta: string
  valor_numerico: number | null
  valor_qualitativo: string | null
  valor_livre: string | null
  alterado: boolean
  consulta_id: string | null
  laboratorio: string | null
}

export interface SerieHistorica {
  nome_exame: string
  unidade: string | null
  tipo_resultado: string
  ref_min: number | null
  ref_max: number | null
  ref_texto: string | null
  significado: string | null
  pontos: SerieHistoricaItem[]
}

export interface HistoricoPorPacote {
  pacote: string
  exames: SerieHistorica[]
}

export interface ExameRascunho {
  catalogo_exame_id: string | null;
  nome_exame: string;
  pacote: string;
  tipo_resultado: 'numerico' | 'qualitativo' | 'livre';
  material?: string;
  valor_numerico: number | null;
  valor_qualitativo: string | null;
  valor_livre: string | null;
  unidade: string | null;
  ref_min: number | null;
  ref_max: number | null;
  ref_texto?: string | null;
  significado?: string | null;
  incluido: boolean;
}

export class SessaoInsercaoStore {
  paciente_id = $state("");
  consulta_id = $state<string | null>(null);
  data_coleta = $state(new Date().toISOString().split('T')[0]);
  laboratorio = $state("");
  pacote_selecionado = $state<string | null>(null);
  exames = $state<ExameRascunho[]>([]);
  salvando = $state(false);
  erros = $state<string[]>([]);

  iniciarSessao(pid: string, cid: string | null = null) {
    this.limparSessao();
    this.paciente_id = pid;
    this.consulta_id = cid;
  }

  limparSessao() {
    this.paciente_id = "";
    this.consulta_id = null;
    this.data_coleta = new Date().toISOString().split('T')[0];
    this.laboratorio = "";
    this.pacote_selecionado = null;
    this.exames = [];
    this.salvando = false;
    this.erros = [];
  }

  adicionarExame(ex: ExameRascunho) {
    this.exames.push(ex);
  }

  removerExame(idx: number) {
    this.exames.splice(idx, 1);
  }

  definirExames(novos: ExameRascunho[]) {
    this.exames = novos;
  }
}

// Exporta uma instância única pronta para uso no frontend reativo
export const storeExames = new SessaoInsercaoStore();
