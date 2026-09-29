export function calcularHomaIR(glicemia: number, insulina: number): string {
  const val = (glicemia * insulina) / 405;
  const res = val > 2.5 ? "Elevado (Sugere resistência à insulina)" : "Normal";
  return `Índice HOMA-IR: ${val.toFixed(2)} - Interpretação: ${res}`;
}
