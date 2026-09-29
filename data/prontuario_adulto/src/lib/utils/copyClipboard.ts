// Funções utilitárias para sintetização e exportação via clipboard

function formatarDataLocal(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr.includes(':') ? isoStr : `${isoStr}T12:00:00`);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('pt-BR');
  } catch {
    return "";
  }
}

// Extrai número de dosagem ou retorna '0'/'1' para o formato shorthand (x,x,x)
function getDosagemSimplificada(str: string | null | undefined): string {
  if (!str || !str.trim()) return '0';
  const match = str.match(/(\d+[\.,]?\d*)/); // Procura números (ex: 1, 0.5, 1,5)
  return match ? match[1] : '1';
}

function formatarPosologiaSimplificada(item: any): string {
  if (!item) return "";
  if (item.frequenciaTipo === "diario" && item.diario) {
    const m = getDosagemSimplificada(item.diario.manha);
    const t = getDosagemSimplificada(item.diario.tarde);
    const n = getDosagemSimplificada(item.diario.noite);
    // Se houve preenchimento em algum campo diário
    if (m !== '0' || t !== '0' || n !== '0') {
       return `(${m},${t},${n})`;
    }
  }
  
  if (item.frequenciaTipo === "semanal" && item.semanal) {
    return `Semanal: ${item.semanal}`;
  }
  if (item.frequenciaTipo === "intervalo" && item.intervalo) {
    return `A cada ${item.intervalo}`;
  }
  return item.posologia || "";
}

// === COPIAR SUBJETIVO ===
export function formatarSubjetivoSintetizado(sub: any, blocosAnamnese: any[] = []): string {
  const lines: string[] = [];

  // 1. Queixa Principal (QP)
  if (sub.queixa_principal?.trim()) {
    lines.push(`QP: ${sub.queixa_principal.trim()}`);
  }

  // 2. HMA (Anamnese Blocos)
  if (blocosAnamnese && blocosAnamnese.length > 0) {
    blocosAnamnese.forEach((b, i) => {
      const hists = [b.historico_texto, b.queixa_atual_texto].filter(Boolean).map(t => t.trim()).join(" ");
      if (hists) {
        const label = i === 0 ? "HMA" : `S${i + 1} - ${b.titulo || 'Queixa'}`;
        const cid = b.cid_subcat ? ` [${b.cid_subcat}]` : '';
        lines.push(`${label}${cid}: ${hists}`);
      }
    });
  }

  // 3. História Ginecológica (GPNCAE) - Apenas se preenchido
  const gin = sub.historia_ginecologica || {};
  const ginItems: string[] = [];
  if (gin.g) ginItems.push(`G: ${gin.g}`);
  if (gin.p) ginItems.push(`P: ${gin.p}`);
  if (gin.n) ginItems.push(`N: ${gin.n}`);
  if (gin.c) ginItems.push(`C: ${gin.c}`);
  if (gin.a) ginItems.push(`A: ${gin.a}`);
  if (gin.e) ginItems.push(`E: ${gin.e}`);
  if (gin.dum) ginItems.push(`DUM: ${gin.dum}`);
  if (gin.mac) ginItems.push(`MAC: ${gin.mac}`);
  if (ginItems.length > 0) {
    lines.push(`História Ginecológica: ${ginItems.join(" | ")}`);
  }

  // 4. RS (Revisão de Sistemas)
  if (sub.revisao_sistemas?.trim()) {
    lines.push(`RS: ${sub.revisao_sistemas.trim()}`);
  }

  // 5. HPP (História Patológica Pregressa)
  const hpp = sub.hpp || {};
  const hppItems: string[] = [];
  const valAlergia = hpp.alergia?.trim() || hpp.alergias?.trim();
  if (valAlergia) hppItems.push(`Alergias: ${valAlergia}`);
  if (hpp.cirurgias?.trim()) hppItems.push(`Cirurgias: ${hpp.cirurgias.trim()}`);
  if (hpp.internacoes?.trim()) hppItems.push(`Internações: ${hpp.internacoes.trim()}`);
  if (hpp.traumatismos?.trim()) hppItems.push(`Traumatismos: ${hpp.traumatismos.trim()}`);
  
  if (hppItems.length > 0) {
    lines.push(`HPP: ${hppItems.join("; ")}`);
  }

  // 6. Doenças Crônicas (HPP)
  const doencas = hpp.doencas_estratificadas || [];
  if (doencas.length > 0) {
    lines.push("DOENÇAS CRÔNICAS:");
    doencas.forEach((d: any) => {
      const cid = d.subcat ? `[${d.subcat}] ` : '';
      const cat = d.subcat_desc || d.cat_desc || 'Doença';
      const qual = [d.tempo_evolucao || d.mesAnoDiagnostico, d.historico].filter(Boolean).join(" - ");
      lines.push(`- ${cid}${cat}${qual ? ` (${qual})` : ''}`);
    });
  }

  // 7. Medicações (Princípio Ativo - Concentração - Posologia)
  const meds = hpp.medicamentos || [];
  if (meds.length > 0) {
    lines.push("MEDICAÇÕES:");
    meds.forEach((m: any) => {
      const nome = m.principio_ativo || m.nome || 'Medicamento';
      const conc = m.concentracao ? ` - ${m.concentracao}` : '';
      const pos = formatarPosologiaSimplificada(m);
      const posStr = pos ? ` - ${pos}` : '';
      lines.push(`- ${nome}${conc}${posStr}`);
    });
  }

  // 8. HF (Histórico Familiar)
  const fam = sub.historia_familiar || {};
  const famOptions = [
    { id: "dm1", label: "DM1" }, { id: "dm2", label: "DM2" }, { id: "has", label: "HAS" },
    { id: "dac", label: "DAC" }, { id: "ave", label: "AVE" }, { id: "dislipidemia", label: "Dislipidemia" },
    { id: "cancer", label: "Câncer" }, { id: "colelitiase", label: "Colelitíase" },
    { id: "varizes", label: "Varizes" }, { id: "outros", label: "Outros" }
  ];
  
  const hfParts: string[] = [];
  famOptions.forEach(opt => {
    const fData = fam[opt.id];
    if (fData && fData.checked) {
      const parentes = fData.parentes || [];
      const validRels = parentes
        .filter((p: any) => p.parentesco)
        .map((p: any) => {
           const rel = p.parentesco.toLowerCase();
           const parts = [rel];
           if (p.detalhes?.trim()) {
              parts.push(`(${p.detalhes.trim()})`); // Ex: Sítio do Câncer
           }
           if (p.idade?.trim()) {
              parts.push(`[${p.idade.trim()}]`); // Ex: Idade do diagnóstico
           }
           return parts.join(" ");
        });
      
      let labelExtra = "";
      if (opt.id === "outros" && fData.detalhes?.trim()) {
         labelExtra = ` (${fData.detalhes.trim()})`;
      }

      if (validRels.length > 0) {
        hfParts.push(`${opt.label}${labelExtra} - ${validRels.join(", ")}`);
      } else {
        hfParts.push(`${opt.label}${labelExtra}`);
      }
    }
  });

  if (hfParts.length > 0) {
    lines.push(`HF: ${hfParts.join("; ")}`);
  }

  // 9. Outros Históricos (HO, HP, HV)
  const valHO = sub.historia_ocupacional_narrativa?.trim() || sub.historia_ocupacional?.trim();
  if (valHO) {
    lines.push(`História Ocupacional: ${valHO}`);
  }
  
  const valHP = sub.historia_psicossocial_narrativa?.trim() || sub.historia_psicossocial?.trim();
  if (valHP) {
    lines.push(`História Psicossocial: ${valHP}`);
  }

  // Hábitos de Vida (HV)
  const hv = sub.habitos_vida || {};
  const hvParts: string[] = [];
  
  if (hv.etilismo && hv.etilismo !== 'nao') {
     const lbl = hv.etilismo === 'ex' ? 'Ex-etilista' : 'Sim';
     hvParts.push(`Etilismo: ${lbl}${hv.etilismo_doses ? ` (${hv.etilismo_doses})` : ''}`);
  }
  if (hv.tabagismo && hv.tabagismo !== 'nao') {
     const lbl = hv.tabagismo === 'ex' ? 'Ex-fumante' : 'Sim';
     const details = [hv.tabagismo_macos ? `${hv.tabagismo_macos} m/d` : "", hv.tabagismo_tempo ? `${hv.tabagismo_tempo} anos` : ""].filter(Boolean).join(", ");
     hvParts.push(`Tabagismo: ${lbl}${details ? ` (${details})` : ''}`);
  }
  if (hv.drogadismo && hv.drogadismo !== 'nao') {
     const lbl = hv.drogadismo === 'ex' ? 'Ex-usuário' : 'Sim';
     hvParts.push(`Drogadismo: ${lbl}${hv.drogadismo_detalhes ? ` (${hv.drogadismo_detalhes})` : ''}`);
  }
  
  if (sub.habitos_vida_narrativa?.trim()) {
     hvParts.push(`Narrativa: ${sub.habitos_vida_narrativa.trim()}`);
  } else if (hv.atividade_fisica?.trim()) {
     hvParts.push(`Ativ. Física: ${hv.atividade_fisica.trim()}`);
  }
  
  if (hvParts.length > 0) {
    lines.push(`Hábitos de Vida: ${hvParts.join("; ")}`);
  }

  // 10. Recordatório Alimentar
  const ra = hv.recordatorio_refinado || {};
  const raParts: string[] = [];
  const mealLabels: Record<string, string> = {
    cafe_manha: "Café da Manhã",
    lanche_manha: "Lanche da Manhã",
    almoco: "Almoço",
    lanche_tarde: "Lanche da Tarde",
    cafe_tarde: "Café da Tarde",
    lanche_pre_jantar: "Lanche antes do Jantar",
    jantar: "Jantar",
    lanche_dormir: "Lanche antes de Dormir"
  };

  Object.entries(mealLabels).forEach(([key, label]) => {
    if (ra[key]?.trim()) {
      raParts.push(`- ${label}: ${ra[key].trim()}`);
    }
  });

  if (raParts.length === 0 && hv.recordatorio_alimentar?.trim()) {
     raParts.push(hv.recordatorio_alimentar.trim());
  }

  if (raParts.length > 0) {
     lines.push("RECORDATÓRIO ALIMENTAR:");
     raParts.forEach(p => lines.push(p));
  }

  return lines.join("\n");
}


// === COPIAR OBJETIVO ===
export function formatarObjetivoSintetizado(obj: any, resultadosExames: any[] = [], examesImagem: any[] = []): string {
  const lines: string[] = [];

  // 1. Exames Laboratoriais mais recentes agrupados
  if (resultadosExames && resultadosExames.length > 0) {
    // 1.1 Achar o mais recente exame de cada tipo
    const mapMaisRecentes: Record<string, any> = {};
    resultadosExames.forEach(r => {
      const key = r.nome_exame;
      if (!key) return;
      const dataAtual = r.data_coleta ? new Date(r.data_coleta).getTime() : 0;
      const dataExistente = mapMaisRecentes[key] ? (mapMaisRecentes[key].data_coleta ? new Date(mapMaisRecentes[key].data_coleta).getTime() : 0) : -1;
      if (dataAtual > dataExistente) {
        mapMaisRecentes[key] = r;
      }
    });

    const maisRecentes = Object.values(mapMaisRecentes).filter(r => r.valor_numerico !== null || r.valor_qualitativo || r.valor_livre);

    if (maisRecentes.length > 0) {
       // Agrupar por pacote e data
       const pacotesMap: Record<string, { data: string, exames: string[] }> = {};
       maisRecentes.forEach((r: any) => {
          const pkg = r.pacote || "Geral";
          const dt = formatarDataLocal(r.data_coleta) || "S/D";
          if (!pacotesMap[pkg]) {
             pacotesMap[pkg] = { data: dt, exames: [] };
          }
          const val = r.valor_numerico ?? r.valor_qualitativo ?? r.valor_livre ?? "";
          const unid = r.unidade ? ` ${r.unidade}` : "";
          let refStr = "";
          if (r.ref_min !== null && r.ref_max !== null && r.ref_min !== undefined && r.ref_max !== undefined) {
             refStr = ` (${r.ref_min} - ${r.ref_max})`;
          } else if (r.ref_texto) {
             refStr = ` (${r.ref_texto})`;
          } else if (r.valor_referencia || r.referencia) {
             refStr = ` (${r.valor_referencia || r.referencia})`;
          }
          pacotesMap[pkg].exames.push(`${r.nome_exame}: ${val}${unid}${refStr}`);
       });

       Object.entries(pacotesMap).forEach(([pkgName, dataObj]) => {
          lines.push(`EXAMES LABORATORIAIS ${dataObj.data}`);
          lines.push(`[${pkgName}]`);
          dataObj.exames.forEach(exLine => lines.push(exLine));
          lines.push(""); // Separador
       });
    }
  }

  // 2. Exames de Imagem/Funcionais
  if (examesImagem && examesImagem.length > 0) {
    lines.push("EXAMES DE IMAGEM/FUNCIONAIS");
    examesImagem.forEach(ex => {
       const dt = formatarDataLocal(ex.data_realizacao) || "S/D";
       const exec = ex.medico_executor ? `, ${ex.medico_executor}` : "";
       const res = ex.resultado ? `, ${ex.resultado}` : "";
       lines.push(`${ex.nome_exame}, ${dt}${exec}${res}`);
    });
    lines.push(""); // Separador
  }

  // 3. Sinais Vitais: PA, Temp, FC, FR, SpO2
  const sv = obj.sinais_vitais || {};
  const hasSv = sv.pas || sv.pad || sv.temperatura || sv.fc || sv.fr || sv.spo2;
  if (hasSv) {
    lines.push("SINAIS VITAIS");
    const svItems: string[] = [];
    if (sv.pas || sv.pad) svItems.push(`${sv.pas || '--'}/${sv.pad || '--'}`);
    if (sv.temperatura) svItems.push(`${sv.temperatura}ºC`);
    if (sv.fc) svItems.push(`${sv.fc}bpm`);
    if (sv.fr) svItems.push(`${sv.fr}irpm`);
    if (sv.spo2) svItems.push(`${sv.spo2}%spO2`);
    lines.push(svItems.join(", "));
    lines.push("");
  }

  // 4. Antropometria: Altura, Peso, IMC, C.Abd
  const ant = obj.antropometria || {};
  const hasAnt = ant.altura || ant.peso || ant.imc || ant.circ_abdominal;
  if (hasAnt) {
    lines.push("ANTROPOMETRIA");
    const antItems: string[] = [];
    if (ant.altura) antItems.push(`Altura ${ant.altura}cm`);
    if (ant.peso) antItems.push(`${ant.peso}kg`);
    if (ant.imc) antItems.push(`${ant.imc}kg/m²`);
    if (ant.circ_abdominal) antItems.push(`circunferência abdominal ${ant.circ_abdominal}cm`);
    lines.push(antItems.join(", "));
    lines.push("");
  }

  // 5. Exames Físicos Segmentares (Nome \n Descrição)
  const listEf: { label: string, val: any }[] = [
    { label: "GERAL", val: obj.exame_geral },
    { label: "DERMATOLÓGICO", val: obj.exame_dermatologico },
    { label: "NEUROLÓGICO", val: obj.exame_neurologico },
    { label: "RESPIRATÓRIO SUPERIOR", val: obj.exame_resp_superior },
    { label: "RESPIRATÓRIO INFERIOR", val: obj.exame_resp_inferior },
    { label: "EXAME CARDIOVASCULAR", val: obj.exame_cardiovascular },
    { label: "APARELHO DIGESTÓRIO", val: obj.exame_abdominal },
    { label: "APARELHO GENITOURINÁRIO", val: obj.exame_genitourinario },
    { label: "OSTEOTARTICULAR", val: obj.exame_osteoarticular },
    { label: "EXAME PSIQUIÁTRICO", val: obj.exame_psiquiatrico },
    { label: "OUTROS ACHADOS", val: obj.outros_achados }
  ];

  listEf.forEach(item => {
    if (item.val?.trim()) {
       lines.push(item.label);
       lines.push(item.val.trim());
       lines.push("");
    }
  });

  return lines.join("\n").trim();
}


// === COPIAR AVALIAÇÃO ===
export function formatarAvaliacaoSintetizado(aval: any, blocosAnamnese: any[] = []): string {
  const lines: string[] = ["AVALIAÇÃO"];

  // 1. Análise por Queixa: QP/S1: conclusões
  const apx = aval.analise_por_queixa || {};
  if (blocosAnamnese && blocosAnamnese.length > 0) {
    blocosAnamnese.forEach((b, i) => {
       const conclusao = apx[b.id]?.trim();
       if (conclusao) {
          const label = i === 0 ? "QP/S1" : `S${i + 1}`;
          lines.push(`${label}: ${conclusao}`);
       }
    });
  }

  // 2. Raciocínio Geral
  if (aval.analise_clinica?.trim()) {
     lines.push(`Síntese: ${aval.analise_clinica.trim()}`);
  }

  // 3. Hipóteses Diagnósticas
  const hd = aval.hipoteses_diagnosticas || { itens: [] };
  const activeHd = (hd.itens || []).filter((it: any) => it.cid || it.descricao);
  if (activeHd.length > 0) {
     lines.push("HD:");
     activeHd.forEach((it: any) => {
        const cid = it.cid ? `[${it.cid}] ` : '';
        lines.push(`- ${cid}${it.descricao}`);
     });
  }

  return lines.join("\n");
}


// === COPIAR PLANO ===
export function formatarPlanoSintetizado(plano: any): string {
  const lines: string[] = ["PLANO"];

  const cond = plano.condutas || {};
  if (cond.conduta_geral?.trim()) {
     lines.push(cond.conduta_geral.trim());
  }
  
  if (cond.prescricao?.trim()) {
     lines.push("PRESCRIÇÃO:");
     lines.push(cond.prescricao.trim());
  }

  // Exames Solicitados
  const exSol = plano.exames || { solicitados: [] };
  const activeSol = (exSol.solicitados || []).filter((s: any) => s.nome);
  if (activeSol.length > 0) {
     lines.push("EXAMES SOLICITADOS:");
     activeSol.forEach((s: any) => {
        lines.push(`- ${s.nome}${s.urgencia ? ` (${s.urgencia})` : ""}`);
     });
  }

  // Seguimento
  const seg = plano.seguimento || {};
  if (seg.destino || seg.retorno_prazo_valor) {
     const dest = seg.destino ? `Destino: ${seg.destino}` : '';
     const ret = seg.retorno_prazo_valor ? `Retorno em ${seg.retorno_prazo_valor} ${seg.retorno_prazo_unidade || 'dias'}` : '';
     const items = [dest, ret].filter(Boolean);
     if (items.length > 0) {
        lines.push(`SEGUIMENTO: ${items.join(" - ")}`);
     }
  }

  return lines.join("\n");
}


// Wrapper final para copiar texto e dar feedback visual via Web API
export async function copiarParaTransferencia(texto: string): Promise<boolean> {
  if (!texto || !texto.trim()) return false;
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (err) {
    console.error("Erro ao copiar para área de transferência:", err);
    return false;
  }
}
