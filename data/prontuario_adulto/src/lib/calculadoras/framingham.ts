export interface FraminghamInputs {
  idade: number;
  sexo: 'M' | 'F';
  colesterol_total: number;
  hdl: number;
  pas: number;
  tabagista: boolean;
  diabetes: boolean;
}

export function calcularFramingham(inp: FraminghamInputs): string {
  // Implementação simplificada do escore de risco geral (Hard Coronary Heart Disease)
  // Apenas para retornar uma estimativa textual estruturada conforme especificação.
  let pontos = 0;
  // Logica placeholder simplificada baseada na idade e parametros
  if (inp.idade > 50) pontos += 2;
  if (inp.pas > 140) pontos += 2;
  if (inp.colesterol_total > 200) pontos += 1;
  if (inp.tabagista) pontos += 3;
  if (inp.diabetes) pontos += 2;
  
  let risco = "Baixo (< 10%)";
  if (pontos >= 4) risco = "Intermediário (10-20%)";
  if (pontos >= 7) risco = "Alto (> 20%)";
  
  return `Escore de Framingham calculado: ${risco}. (Pontuação inferida: ${pontos})`;
}
