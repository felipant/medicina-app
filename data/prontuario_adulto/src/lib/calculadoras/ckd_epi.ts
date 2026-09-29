export function calcularCKDEPI(creatinina: number, idade: number, sexo: 'M' | 'F'): string {
  const k = sexo === 'F' ? 0.7 : 0.9;
  const alpha = sexo === 'F' ? -0.329 : -0.411;
  const f = sexo === 'F' ? 1.018 : 1;
  
  const minScrK = Math.min(creatinina / k, 1);
  const maxScrK = Math.max(creatinina / k, 1);
  
  const gfr = 141 * Math.pow(minScrK, alpha) * Math.pow(maxScrK, -1.209) * Math.pow(0.993, idade) * f;
  
  let estagio = "G1 (Normal)";
  if (gfr < 90) estagio = "G2 (Leve)";
  if (gfr < 60) estagio = "G3a (Leve-Mod)";
  if (gfr < 45) estagio = "G3b (Mod-Grave)";
  if (gfr < 30) estagio = "G4 (Grave)";
  if (gfr < 15) estagio = "G5 (Falência)";

  return `TFG estimada (CKD-EPI): ${gfr.toFixed(1)} mL/min/1.73m². Estágio: ${estagio}`;
}
