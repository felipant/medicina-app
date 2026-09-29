export function classificarIMC(peso: number, alturaCm: number): string {
  const altM = alturaCm / 100;
  const imc = peso / (altM * altM);
  let cat = "";
  
  if (imc < 18.5) cat = "Abaixo do peso";
  else if (imc < 25) cat = "Eutrófico (Normal)";
  else if (imc < 30) cat = "Sobrepeso";
  else if (imc < 35) cat = "Obesidade Grau I";
  else if (imc < 40) cat = "Obesidade Grau II";
  else cat = "Obesidade Grau III (Mórbida)";
  
  return `IMC: ${imc.toFixed(2)} kg/m² - Classificação OMS: ${cat}`;
}
