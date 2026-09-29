export function classificarHAS(pas: number, pad: number): string {
  let est = "";
  if (pas < 120 && pad < 80) est = "Ótima";
  else if (pas <= 129 && pad <= 84) est = "Normal";
  else if (pas <= 139 || pad <= 89) est = "Pré-hipertensão";
  else if (pas <= 159 || pad <= 99) est = "HAS Estágio 1";
  else if (pas <= 179 || pad <= 109) est = "HAS Estágio 2";
  else est = "HAS Estágio 3 / Crise Hipertensiva";
  
  return `Classificação da PA (SBC): ${est}`;
}
