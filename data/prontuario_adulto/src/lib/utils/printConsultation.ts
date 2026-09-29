function formatarDataLocal(isoStr: string | null | undefined, incluirHora = false): string {
  if (!isoStr) return "";
  try {
    const safeStr = isoStr.includes(':') ? isoStr : `${isoStr}T12:00:00`;
    const d = new Date(safeStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString('pt-BR', {
       day: '2-digit', month: '2-digit', year: 'numeric',
       ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {})
    });
  } catch {
    return "";
  }
}

function escapeHtml(text: any): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValorPreenchido(val: any): boolean {
  if (val === null || val === undefined || val === "" || val === false) return false;
  if (Array.isArray(val)) {
    return val.length > 0 && val.some(v => isValorPreenchido(v));
  }
  if (typeof val === 'object') {
    // Para objetos complexos de família ou ginecológico, se contêm apenas chaves vazias ou falsas é considerado vazio
    const values = Object.values(val);
    return values.length > 0 && values.some(v => isValorPreenchido(v));
  }
  return true;
}

function getInitials(name: string): string {
  if (!name) return "P.N.";
  return name.trim()
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w[0].toUpperCase() + ".")
    .join("");
}

// Parser robusto de medicamentos herdado do sistema médico
function formatarFrequencia(item: any): string {
  if (!item) return "";
  if (item.frequenciaTipo === "diario" && item.diario) {
    const periods = [
      item.diario.manha ? `Manhã: ${item.diario.manha}` : "",
      item.diario.tarde ? `Tarde: ${item.diario.tarde}` : "",
      item.diario.noite ? `Noite: ${item.diario.noite}` : "",
    ].filter(Boolean);
    return periods.length ? `Diário (${periods.join(", ")})` : "Diário";
  }
  if (item.frequenciaTipo === "semanal") {
    const doseInfo = item.doseQual ? ` (${item.doseQual})` : "";
    return `Semanal: ${item.semanal}${doseInfo}`;
  }
  if (item.frequenciaTipo === "intervalo") {
    const doseInfo = item.doseQual ? ` (${item.doseQual})` : "";
    return `A cada ${item.intervalo}${doseInfo}`;
  }
  if (item.frequenciaTipo === "especial") {
    return `Especial: ${item.especial || "não informado"}`;
  }
  return item.posologia || "";
}

export async function exportarConsultaPDF(paciente: any, consulta: any, anamneseBlocos: any[] = [], resultadosExames: any[] = [], examesImagem: any[] = [], prescricoes: any[] = [], pedidosLab: any[] = [], pedidosImagem: any[] = []) {
  try {
    const sub = consulta.dados_subjetivo || {};
    const obj = consulta.dados_objetivo || {};
    const aval = consulta.dados_avaliacao || {};
    const plano = consulta.dados_plano || {};

    // --- FUNÇÕES DE GERAÇÃO HTML SEGMENTADAS ADAPTADAS DO LAYOUT REQUISITADO ---

    function gerarSubjetivoHTML(): string {
      const parts: string[] = [];

      // 1. Identificação Completa
      const id = sub.identificacao || {};
      const temIdentificacao = isValorPreenchido(id);
      if (temIdentificacao) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Identificação</h3>');
        const campos: string[] = [];
        if (id.idade) campos.push(`<b>Idade:</b> ${escapeHtml(id.idade)}`);
        if (id.ocupacao) campos.push(`<b>Ocupação:</b> ${escapeHtml(id.ocupacao)}`);
        if (id.naturalidade) campos.push(`<b>Naturalidade:</b> ${escapeHtml(id.naturalidade)}`);
        if (id.acompanhante) campos.push(`<b>Acompanhante:</b> ${escapeHtml(id.acompanhante)}`);
        if (id.sexo) campos.push(`<b>Sexo:</b> ${escapeHtml(id.sexo)}`);
        if (id.genero) campos.push(`<b>Gênero:</b> ${escapeHtml(id.genero === "Outros" ? id.generoOutro || id.genero : id.genero)}`);
        if (id.raca) campos.push(`<b>Raça:</b> ${escapeHtml(id.raca === "Outros" ? id.racaOutro || id.raca : id.raca)}`);
        if (id.estadoCivil) campos.push(`<b>Estado Civil:</b> ${escapeHtml(id.estadoCivil === "Outros" ? id.estadoCivilOutro || id.estadoCivil : id.estadoCivil)}`);
        if (id.escolaridade) campos.push(`<b>Escolaridade:</b> ${escapeHtml(id.escolaridade === "Outros" ? id.escolaridadeOutro || id.escolaridade : id.escolaridade)}`);
        if (id.religiao) campos.push(`<b>Religião:</b> ${escapeHtml(id.religiao === "Outros" ? id.religiaoOutro || id.religiao : id.religiao)}`);
        
        if (campos.length > 0) {
          parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;">${campos.join(" | ")}</p>`);
        }
        parts.push('</div>');
      }

      // 2. Queixa Principal
      if (sub.queixa_principal && sub.queixa_principal.trim()) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Queixa Principal</h3>');
        parts.push(`<p style="font-size: 11px; margin: 0; white-space: pre-wrap; color: #1e293b;">${escapeHtml(sub.queixa_principal)}</p>`);
        parts.push('</div>');
      }

      // 3. Anamnese (HMA) Estruturada por Blocos
      if (anamneseBlocos && anamneseBlocos.length > 0) {
        const blocosPreenchidos = anamneseBlocos.filter(b => b.cid_subcat || b.historico_texto || b.queixa_atual_texto);
        if (blocosPreenchidos.length > 0) {
          parts.push('<div style="margin-bottom: 14px;">');
          parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História da Moléstia Atual (Anamnese HMA)</h3>');
          blocosPreenchidos.forEach((b, i) => {
            parts.push(`<div style="margin-left: 10px; margin-bottom: 8px; border-left: 2px solid #cbd5e1; padding-left: 8px;">`);
            parts.push(`<p style="font-size: 11px; font-weight: bold; margin: 0 0 2px 0;">S${i+1} - ${escapeHtml(b.titulo || 'Queixa')}${b.cid_subcat ? ` [${escapeHtml(b.cid_subcat)} - ${escapeHtml(b.cid_descricao)}]` : ''}</p>`);
            if (b.historico_texto) {
              parts.push(`<p style="font-size: 11px; margin: 0 0 2px 0; color: #334155;"><b>Histórico:</b> ${escapeHtml(b.historico_texto)}</p>`);
            }
            if (b.queixa_atual_texto) {
              parts.push(`<p style="font-size: 11px; margin: 0; color: #334155;"><b>Evolução / Atual:</b> ${escapeHtml(b.queixa_atual_texto)}</p>`);
            }
            parts.push('</div>');
          });
          parts.push('</div>');
        }
      }

      // 4. História Ginecológica
      const gin = sub.historia_ginecologica || {};
      const temGin = isValorPreenchido(gin);
      if (temGin) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História Ginecológica (GPNCAE)</h3>');
        const campos: string[] = [];
        if (gin.g) campos.push(`<b>G:</b> ${escapeHtml(gin.g)}`);
        if (gin.p) campos.push(`<b>P:</b> ${escapeHtml(gin.p)}`);
        if (gin.n) campos.push(`<b>N:</b> ${escapeHtml(gin.n)}`);
        if (gin.c) campos.push(`<b>C:</b> ${escapeHtml(gin.c)}`);
        if (gin.a) campos.push(`<b>A:</b> ${escapeHtml(gin.a)}`);
        if (gin.e) campos.push(`<b>E:</b> ${escapeHtml(gin.e)}`);
        if (gin.dum) campos.push(`<b>DUM:</b> ${escapeHtml(gin.dum)}`);
        if (gin.mac) campos.push(`<b>MAC:</b> ${escapeHtml(gin.mac)}`);
        if (campos.length > 0) {
          parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;">${campos.join(" | ")}</p>`);
        }
        parts.push('</div>');
      }

      // 5. Revisão de Sistemas
      if (sub.revisao_sistemas && sub.revisao_sistemas.trim()) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Revisão de Sistemas</h3>');
        parts.push(`<p style="font-size: 11px; margin: 0; white-space: pre-wrap; color: #1e293b;">${escapeHtml(sub.revisao_sistemas)}</p>`);
        parts.push('</div>');
      }

      // 6. Doenças Crônicas do HPP
      const hpp = sub.hpp || {};
      const doencas = hpp.doencas_estratificadas || [];
      if (doencas.length > 0) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Doenças de Base (História Patológica Pregressa)</h3>');
        parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
        doencas.forEach((d: any) => {
          let desc = escapeHtml(d.subcat_desc || d.cat_desc || 'Doença Crônica');
          if (d.subcat) desc += ` <span style="color: #64748b; font-family: monospace;">[${escapeHtml(d.subcat)}]</span>`;
          const dets: string[] = [];
          if (d.mesAnoDiagnostico || d.tempo_evolucao) dets.push(`Diagnóstico/Tempo: ${escapeHtml(d.mesAnoDiagnostico || d.tempo_evolucao)}`);
          if (d.historico && d.historico.trim()) dets.push(`Histórico: ${escapeHtml(d.historico)}`);
          if (d.queixasAtuais && d.queixasAtuais.trim()) dets.push(`Queixa Atual: ${escapeHtml(d.queixasAtuais)}`);
          
          if (dets.length > 0) {
            parts.push(`<li style="margin-bottom: 4px;"><b>${desc}</b><br/><span style="color: #475569; padding-left: 4px; font-style: italic;">${dets.join(" | ")}</span></li>`);
          } else {
            parts.push(`<li style="margin-bottom: 4px;">${desc}</li>`);
          }
        });
        parts.push('</ul></div>');
      }

      // 7. História Patológica Adicional
      const temPat = hpp.alergias || hpp.cirurgias || hpp.internacoes || hpp.traumatismos;
      if (temPat) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História Patológica e Eventos</h3>');
        parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
        if (hpp.alergias) parts.push(`<li><b>Alergias:</b> ${escapeHtml(hpp.alergias)}</li>`);
        if (hpp.cirurgias) parts.push(`<li><b>Cirurgias Prévias:</b> ${escapeHtml(hpp.cirurgias)}</li>`);
        if (hpp.internacoes) parts.push(`<li><b>Internações:</b> ${escapeHtml(hpp.internacoes)}</li>`);
        if (hpp.traumatismos) parts.push(`<li><b>Traumatismos:</b> ${escapeHtml(hpp.traumatismos)}</li>`);
        parts.push('</ul></div>');
      }

      // 8. Medicamentos em Uso
      const meds = hpp.medicamentos || [];
      if (meds.length > 0) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Medicamentos de Uso Contínuo</h3>');
        parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
        meds.forEach((m: any) => {
          const freq = formatarFrequencia(m);
          const nome = m.principio_ativo || m.nome || 'Medicamento';
          const conc = m.concentracao ? ` ${m.concentracao}` : '';
          const obs = m.observacoes ? ` (${m.observacoes})` : '';
          parts.push(`<li style="margin-bottom: 2px;"><b>${escapeHtml(nome)}</b>${escapeHtml(conc)} - ${escapeHtml(freq)}${escapeHtml(obs)}</li>`);
        });
        parts.push('</ul></div>');
      }

      // 9. História Familiar Detalhada
      const fam = sub.historia_familiar || {};
      const famOptions = [
        { id: "dm1", label: "DM1" }, { id: "dm2", label: "DM2" }, { id: "has", label: "HAS" },
        { id: "dac", label: "DAC" }, { id: "ave", label: "AVE" }, { id: "dislipidemia", label: "Dislipidemia" },
        { id: "cancer", label: "Câncer" }, { id: "colelitiase", label: "Colelitíase" },
        { id: "varizes", label: "Varizes" }, { id: "outros", label: "Outros" }
      ];
      
      const famEntries = famOptions.map(o => ({ label: o.label, data: fam[o.id] })).filter(e => e.data && e.data.checked);
      
      if (famEntries.length > 0 || (fam.observacoes && fam.observacoes.trim())) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História Familiar</h3>');
        if (famEntries.length > 0) {
          parts.push('<ul style="margin: 0 0 5px 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
          famEntries.forEach(entry => {
            const parentes = entry.data.parentes || [];
            const activeRels = parentes.filter((p: any) => p.parentesco || p.detalhes);
            if (activeRels.length > 0) {
              activeRels.forEach((p: any) => {
                const relLabel = p.parentesco ? ` (${escapeHtml(p.parentesco)}${p.idade ? `, ${p.idade} anos` : ""})` : "";
                parts.push(`<li><b>${escapeHtml(entry.label)}</b>${relLabel}${p.detalhes ? `: ${escapeHtml(p.detalhes)}` : ""}</li>`);
              });
            } else {
              parts.push(`<li><b>${escapeHtml(entry.label)}</b>${entry.data.detalhes ? `: ${escapeHtml(entry.data.detalhes)}` : ""}</li>`);
            }
          });
          parts.push('</ul>');
        }
        if (fam.observacoes && fam.observacoes.trim()) {
          parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;"><b>Observações Familiares:</b> ${escapeHtml(fam.observacoes)}</p>`);
        }
        parts.push('</div>');
      }

      // 10. Histórico Ocupacional
      if (sub.historia_ocupacional && sub.historia_ocupacional.trim()) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História Ocupacional</h3>');
        parts.push(`<p style="font-size: 11px; margin: 0; white-space: pre-wrap; color: #1e293b;">${escapeHtml(sub.historia_ocupacional)}</p>`);
        parts.push('</div>');
      }

      // 11. Histórico Psicossocial
      if (sub.historia_psicossocial && sub.historia_psicossocial.trim()) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">História Psicossocial</h3>');
        parts.push(`<p style="font-size: 11px; margin: 0; white-space: pre-wrap; color: #1e293b;">${escapeHtml(sub.historia_psicossocial)}</p>`);
        parts.push('</div>');
      }

      // 12. Hábitos de Vida e Recordatório Alimentar
      const hv = sub.habitos_vida || {};
      const temHv = isValorPreenchido(hv);
      if (temHv) {
        parts.push('<div style="margin-bottom: 14px;">');
        parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Hábitos de Vida</h3>');
        
        const listItems: string[] = [];
        if (hv.etilismo) {
           const status = hv.etilismo === 'sim' ? 'Usa' : (hv.etilismo === 'ex' ? 'Ex-etilista' : 'Nega');
           listItems.push(`<b>Etilismo:</b> ${status}${hv.etilismo_doses ? ` (${hv.etilismo_doses})` : ''}`);
        }
        if (hv.tabagismo) {
           const status = hv.tabagismo === 'sim' ? 'Fuma' : (hv.tabagismo === 'ex' ? 'Ex-fumante' : 'Nega');
           const det = [hv.tabagismo_macos ? `${hv.tabagismo_macos} maço(s)/dia` : '', hv.tabagismo_tempo ? `por ${hv.tabagismo_tempo}` : ''].filter(Boolean).join(' ');
           listItems.push(`<b>Tabagismo:</b> ${status}${det ? ` (${det})` : ''}`);
        }
        if (hv.drogadismo) {
           const status = hv.drogadismo === 'sim' ? 'Usa substâncias' : (hv.drogadismo === 'ex' ? 'Ex-usuário' : 'Nega');
           listItems.push(`<b>Outras substâncias (Drogadismo):</b> ${status}${hv.drogadismo_detalhes ? ` (${hv.drogadismo_detalhes})` : ''}`);
        }
        if (hv.atividade_fisica) listItems.push(`<b>Atividade Física:</b> ${escapeHtml(hv.atividade_fisica)}`);
        if (hv.sono) listItems.push(`<b>Padrão de Sono:</b> ${escapeHtml(hv.sono)}`);

        if (listItems.length > 0) {
           parts.push(`<p style="font-size: 11px; margin: 0 0 6px 0; color: #1e293b;">${listItems.join(" | ")}</p>`);
        }

        // Recordatório Alimentar Refinado (Estruturado em UL)
        const ra = hv.recordatorio_refinado || {};
        if (isValorPreenchido(ra)) {
          parts.push('<p style="font-size: 11px; font-weight: bold; color: #475569; margin: 5px 0 2px 0;">Recordatório Alimentar Refinado:</p>');
          parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
          if (ra.cafe_manha) parts.push(`<li><b>Café da Manhã:</b> ${escapeHtml(ra.cafe_manha)}</li>`);
          if (ra.lanche_manha) parts.push(`<li><b>Lanche da Manhã:</b> ${escapeHtml(ra.lanche_manha)}</li>`);
          if (ra.almoco) parts.push(`<li><b>Almoço:</b> ${escapeHtml(ra.almoco)}</li>`);
          if (ra.lanche_tarde) parts.push(`<li><b>Lanche da Tarde:</b> ${escapeHtml(ra.lanche_tarde)}</li>`);
          if (ra.cafe_tarde) parts.push(`<li><b>Café da Tarde:</b> ${escapeHtml(ra.cafe_tarde)}</li>`);
          if (ra.lanche_pre_jantar) parts.push(`<li><b>Lanche Pré-Jantar:</b> ${escapeHtml(ra.lanche_pre_jantar)}</li>`);
          if (ra.jantar) parts.push(`<li><b>Jantar:</b> ${escapeHtml(ra.jantar)}</li>`);
          if (ra.lanche_dormir) parts.push(`<li><b>Lanche antes de Dormir:</b> ${escapeHtml(ra.lanche_dormir)}</li>`);
          parts.push('</ul>');
        } else if (hv.recordatorio_alimentar && hv.recordatorio_alimentar.trim()) {
          parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;"><b>Recordatório Alimentar:</b> ${escapeHtml(hv.recordatorio_alimentar)}</p>`);
        }
        
        parts.push('</div>');
      }

      return parts.join("");
    }

    function gerarObjetivoHTML(): string {
      const parts: string[] = [];

      // 1. Exames Laboratoriais (Pivot por Pacote conforme Requisito)
      if (resultadosExames && resultadosExames.length > 0) {
         const validExams = resultadosExames.filter(r => r.nome_exame && (r.valor_numerico !== null || r.valor_qualitativo || r.valor_livre));
         if (validExams.length > 0) {
            parts.push('<div style="margin-bottom: 16px;">');
            parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Exames Laboratoriais</h3>');
            
            // Agrupador Pivot
            const pacotes: Record<string, { pacote: string, datas: Set<string>, examesMap: Record<string, { nome: string, valRef: string, unidade: string, resPorData: Record<string, string> }> }> = {};
            validExams.forEach(r => {
               const pkg = r.pacote || "Geral";
               const dt = formatarDataLocal(r.data_coleta) || "Sem data";
               if (!pacotes[pkg]) {
                  pacotes[pkg] = { pacote: pkg, datas: new Set(), examesMap: {} };
               }
               pacotes[pkg].datas.add(dt);
               const exKey = r.nome_exame;
               if (!pacotes[pkg].examesMap[exKey]) {
                  pacotes[pkg].examesMap[exKey] = {
                     nome: r.nome_exame,
                     valRef: r.valor_referencia || r.referencia || "-",
                     unidade: r.unidade || "-",
                     resPorData: {}
                  };
               }
               pacotes[pkg].examesMap[exKey].resPorData[dt] = String(r.valor_numerico ?? r.valor_qualitativo ?? r.valor_livre ?? "");
            });

            // Renderizar tabela pivot
            Object.values(pacotes).forEach(pkgData => {
               parts.push(`<p style="font-size: 11px; font-weight: bold; margin: 8px 0 4px 0; color: #475569;">${escapeHtml(pkgData.pacote)}</p>`);
               parts.push('<table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; border: 1px solid #e2e8f0;">');
               
               const datesArray = Array.from(pkgData.datas).sort();
               
               // Thead
               parts.push('<thead style="background-color: #f8fafc;"><tr>');
               parts.push('<th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; font-weight: 700; color: #475569;">Exame</th>');
               parts.push('<th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; font-weight: 700; color: #475569;">Val. Ref.</th>');
               parts.push('<th style="border: 1px solid #cbd5e1; padding: 4px; text-align: left; font-weight: 700; color: #475569;">Unid.</th>');
               datesArray.forEach(d => {
                  parts.push(`<th style="border: 1px solid #cbd5e1; padding: 4px; text-align: center; font-weight: 700; color: #475569;">${escapeHtml(d)}</th>`);
               });
               parts.push('</tr></thead><tbody>');

               // Tbody
               Object.values(pkgData.examesMap).forEach(exItem => {
                  parts.push('<tr>');
                  parts.push(`<td style="border: 1px solid #e2e8f0; padding: 4px; font-weight: 600;">${escapeHtml(exItem.nome)}</td>`);
                  parts.push(`<td style="border: 1px solid #e2e8f0; padding: 4px; color: #64748b;">${escapeHtml(exItem.valRef)}</td>`);
                  parts.push(`<td style="border: 1px solid #e2e8f0; padding: 4px; color: #64748b;">${escapeHtml(exItem.unidade)}</td>`);
                  datesArray.forEach(d => {
                     parts.push(`<td style="border: 1px solid #e2e8f0; padding: 4px; text-align: center; font-weight: bold; background-color: #ffffff;">${escapeHtml(exItem.resPorData[d] || "-")}</td>`);
                  });
                  parts.push('</tr>');
               });
               parts.push('</tbody></table>');
            });
            parts.push('</div>');
         }
      }

      // 2. Exames de Imagem e Funcionais Detalhados (Requisito UL)
      if (examesImagem && examesImagem.length > 0) {
         parts.push('<div style="margin-bottom: 16px;">');
         parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Exames de Imagem e Funcionais</h3>');
         parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
         examesImagem.forEach(ex => {
            const dataStr = ex.data_realizacao ? ` <span style="color: #64748b;">[${formatarDataLocal(ex.data_realizacao)}]</span>` : '';
            const executor = ex.medico_executor ? ` - Executor: ${escapeHtml(ex.medico_executor)}` : '';
            const local = ex.local_realizacao ? ` (${escapeHtml(ex.local_realizacao)})` : '';
            const res = ex.resultado ? `<br/><span style="padding-left: 12px; display: block; color: #475569; font-style: italic;">Resultado: ${escapeHtml(ex.resultado)}</span>` : '';
            parts.push(`<li style="margin-bottom: 6px;"><b>${escapeHtml(ex.nome_exame || 'Exame de Imagem')}</b>${dataStr}${executor}${local}${res}</li>`);
         });
         parts.push('</ul></div>');
      }

      // 3. Sinais Vitais (Piped inline conforme requisito)
      const sv = obj.sinais_vitais || {};
      const temSv = isValorPreenchido(sv);
      if (temSv) {
         parts.push('<div style="margin-bottom: 14px;">');
         parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Sinais Vitais</h3>');
         const campos: string[] = [];
         if (sv.pas || sv.pad) campos.push(`<b>PA:</b> ${sv.pas || "--"}/${sv.pad || "--"} mmHg`);
         if (sv.temperatura) campos.push(`<b>Temp:</b> ${sv.temperatura}°C`);
         if (sv.fc) campos.push(`<b>FC:</b> ${sv.fc} bpm`);
         if (sv.fr) campos.push(`<b>FR:</b> ${sv.fr} irpm`);
         if (sv.spo2) campos.push(`<b>SpO2:</b> ${sv.spo2}%`);
         
         if (campos.length > 0) {
            parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;">${campos.join(" | ")}</p>`);
         }
         parts.push('</div>');
      }

      // 4. Antropometria (Piped inline)
      const ant = obj.antropometria || {};
      const temAnt = isValorPreenchido(ant);
      if (temAnt) {
         parts.push('<div style="margin-bottom: 14px;">');
         parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Antropometria</h3>');
         const campos: string[] = [];
         if (ant.altura) campos.push(`<b>Altura:</b> ${ant.altura} cm`);
         if (ant.peso) campos.push(`<b>Peso:</b> ${ant.peso} kg`);
         if (ant.imc) campos.push(`<b>IMC:</b> ${ant.imc} kg/m²`);
         if (ant.circ_abdominal) campos.push(`<b>C. Abd:</b> ${ant.circ_abdominal} cm`);
         
         if (campos.length > 0) {
            parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;">${campos.join(" | ")}</p>`);
         }
         parts.push('</div>');
      }

      // 5. Exame Físico Estruturado
      const temEf = obj.exame_geral || obj.exame_dermatologico || obj.exame_neurologico || obj.exame_resp_superior || obj.exame_resp_inferior || obj.exame_cardiovascular || obj.exame_abdominal || obj.exame_genitourinario || obj.exame_osteoarticular || obj.exame_psiquiatrico || obj.outros_achados;
      if (temEf) {
         parts.push('<div style="margin-bottom: 14px;">');
         parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Exame Físico Segmentar</h3>');
         const listEf: { label: string, val: any }[] = [
            { label: "Geral", val: obj.exame_geral },
            { label: "Dermatológico", val: obj.exame_dermatologico },
            { label: "Neurológico", val: obj.exame_neurologico },
            { label: "Respiratório Superior", val: obj.exame_resp_superior },
            { label: "Respiratório Inferior", val: obj.exame_resp_inferior },
            { label: "Cardiovascular", val: obj.exame_cardiovascular },
            { label: "Aparelho Digestório", val: obj.exame_abdominal },
            { label: "Aparelho Genitourinário", val: obj.exame_genitourinario },
            { label: "Osteoarticular e Extremidades", val: obj.exame_osteoarticular },
            { label: "Psiquiátrico", val: obj.exame_psiquiatrico },
            { label: "Outros Achados/Notas", val: obj.outros_achados }
         ];
         listEf.forEach(item => {
            if (item.val && item.val.trim()) {
               parts.push(`<p style="font-size: 11px; margin: 0 0 4px 0; color: #1e293b;"><b>${item.label}:</b> ${escapeHtml(item.val)}</p>`);
            }
         });
         parts.push('</div>');
      }

      // 6. Exame Ginecológico Detalhado (Replicação fiel do layout requisitado)
      const ogin = obj.exame_ginecologico || {};
      const temOgin = isValorPreenchido(ogin);
      if (temOgin) {
         parts.push('<div style="margin-bottom: 14px;">');
         parts.push('<h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0 0 4px 0; text-transform: uppercase;">Exame Ginecológico</h3>');
         
         const omamas = ogin.mamas;
         if (omamas) {
            parts.push('<h4 style="font-size: 11px; font-weight: bold; color: #475569; margin: 5px 0 3px 0;">Mamas</h4>');
            const insE = omamas.inspecaoEstatica || {};
            if (isValorPreenchido(insE)) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Inspeção Estática:</b></p>');
               const inps: string[] = [];
               if (insE.posicao) inps.push(`Posição: ${escapeHtml(insE.posicao)}`);
               if (insE.simetria) inps.push(`Simetria: ${escapeHtml(insE.simetria)}`);
               if (insE.volume) inps.push(`Volume: ${escapeHtml(insE.volume)}`);
               if (insE.mamilos) inps.push(`Mamilos: ${escapeHtml(insE.mamilos)}`);
               if (insE.observacoes) inps.push(`Obs: ${escapeHtml(insE.observacoes)}`);
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${inps.join(" | ")}</p>`);
            }
            const insD = omamas.inspecaoDinamica || {};
            if (insD.observacoes) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Inspeção Dinâmica:</b></p>');
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${escapeHtml(insD.observacoes)}</p>`);
            }
            if (omamas.palpacao) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Palpação:</b></p>');
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${escapeHtml(omamas.palpacao)}</p>`);
            }
            const exp = omamas.expressao || {};
            if (exp.resultado || exp.observacoes) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Expressão:</b></p>');
               const exps: string[] = [];
               if (exp.resultado) exps.push(`Resultado: ${escapeHtml(exp.resultado)}`);
               if (exp.observacoes) exps.push(`Obs: ${escapeHtml(exp.observacoes)}`);
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${exps.join(" | ")}</p>`);
            }
         }

         const ogen = ogin.genitalia;
         if (ogen) {
            parts.push('<h4 style="font-size: 11px; font-weight: bold; color: #475569; margin: 5px 0 3px 0;">Genitália</h4>');
            if (ogen.externa) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Externa:</b></p>');
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${escapeHtml(ogen.externa)}</p>`);
            }
            if (ogen.interna) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Interna / Especular:</b></p>');
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${escapeHtml(ogen.interna)}</p>`);
            }
            if (ogen.toqueVaginal) {
               parts.push('<p style="font-size: 11px; margin: 0 0 2px 0; color: #1e293b;"><b>Toque Vaginal / Bimanual:</b></p>');
               parts.push(`<p style="font-size: 10px; margin: 0 0 5px 0; padding-left: 10px; color: #334155;">${escapeHtml(ogen.toqueVaginal)}</p>`);
            }
         }
         parts.push('</div>');
      }

      return parts.join("");
    }

    function gerarAvaliacaoHTML(): string {
      const parts: string[] = [];

      // 1. Análise Clínica por Queixa Estratificada
      const apx = aval.analise_por_queixa || {};
      const blocosAnalise = (anamneseBlocos || []).filter(b => apx[b.id] && apx[b.id].trim());
      
      if (blocosAnalise.length > 0) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Análise por Queixa:</p>');
         blocosAnalise.forEach((b, i) => {
            parts.push(`<div style="margin-left: 10px; font-size: 11px; color: #1e293b; margin-bottom: 4px;">`);
            parts.push(`<b>S${i+1} - ${escapeHtml(b.titulo || 'Demanda')}:</b> ${escapeHtml(apx[b.id])}`);
            parts.push('</div>');
         });
         parts.push('</div>');
      }

      // 2. Análise Geral / Raciocínio Clínico
      if (aval.analise_clinica && aval.analise_clinica.trim()) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;"><b>Síntese Geral / Raciocínio:</b> ${escapeHtml(aval.analise_clinica)}</p>`);
         parts.push('</div>');
      }

      // 3. Hipóteses Diagnósticas CID
      const hd = aval.hipoteses_diagnosticas || { itens: [] };
      const activeHd = (hd.itens || []).filter((it: any) => it.cid || it.descricao);
      if (activeHd.length > 0) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Hipóteses Diagnósticas (CID-10):</p>');
         parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
         activeHd.forEach((it: any) => {
            const cidLabel = it.cid ? `[${escapeHtml(it.cid)}] ` : '';
            const statusLabel = it.status ? ` <span style="color: #64748b; font-size: 9px;">(${escapeHtml(it.status)})</span>` : '';
            parts.push(`<li style="margin-bottom: 2px;"><b>${cidLabel}</b>${escapeHtml(it.descricao)}${statusLabel}</li>`);
         });
         parts.push('</ul></div>');
      }

      return parts.join("");
    }

    function gerarPlanoHTML(): string {
      const parts: string[] = [];

      // 1. Condutas, Orientações e Prescrições
      const cond = plano.condutas || {};
      if (cond.conduta_geral && cond.conduta_geral.trim()) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b; white-space: pre-wrap;"><b>Condutas e Orientações:</b> ${escapeHtml(cond.conduta_geral)}</p>`);
         parts.push('</div>');
      }
      if (cond.prescricao && cond.prescricao.trim()) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Prescrição Médica:</p>');
         parts.push(`<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 10.5px; color: #0f172a; white-space: pre-wrap;">${escapeHtml(cond.prescricao)}</div>`);
         parts.push('</div>');
      }

      // 1.2. Medicamentos Prescritos (Estruturados)
      const medsAtivos = (prescricoes || []).filter((p: any) => p.status !== 'suspenso');
      if (medsAtivos.length > 0) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Medicamentos Prescritos:</p>');
         parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
         medsAtivos.forEach((p: any) => {
            const nome = p.principio_ativo || p.nome || 'Medicamento';
            const conc = p.concentracao ? ` ${p.concentracao}` : '';
            const doseStr = p.dose ? ` - Dose: ${p.dose}` : '';
            const freqStr = p.frequencia ? ` - ${p.frequencia}` : '';
            
            let durStr = '';
            if (p.duracao_tipo === 'continuo') durStr = ' (Uso contínuo)';
            else if (p.duracao_tipo === 'livre') durStr = p.duracao_texto ? ` (${p.duracao_texto})` : '';
            else if (p.duracao_tipo && p.duracao_valor) durStr = ` (Por ${p.duracao_valor} ${p.duracao_tipo})`;
            
            const obsStr = p.observacoes ? `<br/><span style="font-style: italic; color: #475569; font-size: 10px; padding-left: 4px;">"${escapeHtml(p.observacoes)}"</span>` : '';

            parts.push(`<li style="margin-bottom: 4px;"><b>${escapeHtml(nome)}</b>${escapeHtml(conc)}${escapeHtml(doseStr)}${escapeHtml(freqStr)}${escapeHtml(durStr)}${obsStr}</li>`);
         });
         parts.push('</ul></div>');
      }

      // 2. Exames e Solicitações
      const hasLab = (pedidosLab || []).some(p => (p.itens || []).length > 0);
      const hasImg = (pedidosImagem || []).length > 0;

      if (hasLab || hasImg) {
         parts.push('<div style="margin-bottom: 12px;">');
         parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Exames e Procedimentos Solicitados:</p>');
         parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
         
         if (hasLab) {
            pedidosLab.forEach((p: any) => {
               (p.itens || []).forEach((it: any) => {
                  const urgLabel = p.urgencia && p.urgencia !== 'rotina' ? ` - <span style="color: #b91c1c; font-weight: bold; font-size: 9px;">${escapeHtml(p.urgencia).toUpperCase()}</span>` : '';
                  parts.push(`<li style="margin-bottom: 2px;"><b>[Laboratório]</b> ${escapeHtml(it.nome_exame)}${urgLabel}</li>`);
               });
            });
         }

         if (hasImg) {
            pedidosImagem.forEach((im: any) => {
               const urgLabel = im.urgencia && im.urgencia !== 'eletivo' ? ` - <span style="color: #b91c1c; font-weight: bold; font-size: 9px;">${escapeHtml(im.urgencia).toUpperCase()}</span>` : '';
               parts.push(`<li style="margin-bottom: 2px;"><b>[Imagem]</b> ${escapeHtml(im.nome_exame)}${urgLabel}</li>`);
            });
         }

         parts.push('</ul></div>');
      } else {
         const exSol = plano.exames || { solicitados: [] };
         const activeSol = (exSol.solicitados || []).filter((s: any) => s.nome);
         if (activeSol.length > 0) {
            parts.push('<div style="margin-bottom: 12px;">');
            parts.push('<p style="font-size: 11px; font-weight: bold; color: #333; margin: 0 0 3px 0;">Exames e Procedimentos Solicitados:</p>');
            parts.push('<ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #1e293b;">');
            activeSol.forEach((s: any) => {
               const urg = s.urgencia ? ` - <span style="color: #b91c1c; font-weight: bold; font-size: 9px;">${escapeHtml(s.urgencia).toUpperCase()}</span>` : '';
               parts.push(`<li>${escapeHtml(s.nome)}${urg}</li>`);
            });
            parts.push('</ul></div>');
         }
      }

      // 3. Seguimento e Retorno
      const seg = plano.seguimento || {};
      if (isValorPreenchido(seg)) {
         parts.push('<div style="margin-bottom: 12px;">');
         const partsSeg: string[] = [];
         if (seg.destino) partsSeg.push(`<b>Destino:</b> ${escapeHtml(seg.destino)}`);
         if (seg.retorno_prazo_valor) partsSeg.push(`<b>Retorno em:</b> ${escapeHtml(seg.retorno_prazo_valor)} ${escapeHtml(seg.retorno_prazo_unidade || 'dias')}`);
         if (seg.detalhes) partsSeg.push(`<b>Anotações:</b> ${escapeHtml(seg.detalhes)}`);
         
         if (partsSeg.length > 0) {
            parts.push(`<p style="font-size: 11px; margin: 0; color: #1e293b;">${partsSeg.join(" | ")}</p>`);
         }
         parts.push('</div>');
      }

      return parts.join("");
    }

    // --- EXECUÇÃO DA MONTAGEM DO LAYOUT PRINCIPAL ---

    const htmlSubjetivo = gerarSubjetivoHTML();
    const htmlObjetivo = gerarObjetivoHTML();
    const htmlAvaliacao = gerarAvaliacaoHTML();
    const htmlPlano = gerarPlanoHTML();

    const sections: string[] = [];

    // Cabeçalho Adaptado (Iniciais, Sexo, Nascimento)
    const iniciais = paciente.iniciais || getInitials(paciente.nome);
    const sexoLabel = (paciente.sexo === "Feminino" || paciente.sexo === "F") ? "FEMININO" : 
                      ((paciente.sexo === "Masculino" || paciente.sexo === "M") ? "MASCULINO" : escapeHtml(paciente.sexo).toUpperCase());
    
    sections.push(`
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">
        <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.05em;">Prontuário Clínico Integrado</h1>
        <p style="font-size: 11px; margin: 5px 0 0 0; color: #333; font-weight: bold;">
          Data: ${formatarDataLocal(consulta.criado_em, true) || new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
        <div style="font-size: 11px; color: #334155;"><b style="display: block; font-size: 9px; text-transform: uppercase; color: #64748b;">Paciente (Iniciais)</b><div style="font-size: 12px; font-weight: 800; color: #0f172a;">${iniciais}</div></div>
        <div style="font-size: 11px; color: #334155;"><b style="display: block; font-size: 9px; text-transform: uppercase; color: #64748b;">Sexo</b><div style="font-size: 12px; font-weight: 800; color: #0f172a;">${sexoLabel}</div></div>
        <div style="font-size: 11px; color: #334155;"><b style="display: block; font-size: 9px; text-transform: uppercase; color: #64748b;">Data de Nascimento</b><div style="font-size: 12px; font-weight: 800; color: #0f172a;">${formatarDataLocal(paciente.data_nasc) || "---"}</div></div>
      </div>
    `);

    // === S | SUBJETIVO ===
    if (htmlSubjetivo) {
      sections.push(`
        <div style="margin-bottom: 22px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; font-weight: bold; color: #000; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.02em;">S | Subjetivo</h2>
          ${htmlSubjetivo}
        </div>
      `);
    }

    // === O | OBJETIVO ===
    if (htmlObjetivo) {
      sections.push(`
        <div style="margin-bottom: 22px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; font-weight: bold; color: #000; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.02em;">O | Objetivo</h2>
          ${htmlObjetivo}
        </div>
      `);
    }

    // === A | AVALIAÇÃO ===
    if (htmlAvaliacao) {
      sections.push(`
        <div style="margin-bottom: 22px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; font-weight: bold; color: #000; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.02em;">A | Avaliação</h2>
          ${htmlAvaliacao}
        </div>
      `);
    }

    // === P | PLANO ===
    if (htmlPlano) {
      sections.push(`
        <div style="margin-bottom: 22px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; font-weight: bold; color: #000; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.02em;">P | Plano</h2>
          ${htmlPlano}
        </div>
      `);
    }

    // Rodapé (Replicando layout requisitado)
    sections.push(`
      <div style="text-align: center; margin-top: 40px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 9px; color: #64748b; font-weight: 500;">
        Documento gerado eletronicamente via Prontuário Clínico Integrado em ${new Date().toLocaleString("pt-BR")}
      </div>
    `);

    // Montagem Final da Página HTML p/ Janela de Impressão
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Prontuario_${iniciais.replace(/\./g, "")}_${new Date().toISOString().split("T")[0]}</title>
        <style>
          body { font-family: sans-serif; line-height: 1.4; color: #000; margin: 0; padding: 15mm; }
          p { margin: 0 0 8px 0; }
          @media print {
             @page { size: A4; margin: 15mm; }
             body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; }
          }
        </style>
      </head>
      <body>
        ${sections.join("")}
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) {
      alert("Pop-up bloqueado pelo navegador. Por favor, libere pop-ups para imprimir.");
      return;
    }
    win.document.write(htmlContent);
    win.document.close();
    win.onload = function() {
      win.print();
      setTimeout(() => {
         // win.close(); // Opcional: descomentar para fechar automaticamente após 500ms
      }, 500);
    };

  } catch (err: any) {
    console.error("Erro ao gerar impressão:", err);
    alert("Erro ao gerar impressão: " + (err.message || "Erro desconhecido"));
  }
}
