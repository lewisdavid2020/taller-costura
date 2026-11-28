export function normalizarWhatsapp(valor: string): string {
  let digitos = valor.replace(/\D/g, '');

  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.length === 10 && digitos.startsWith('3')) digitos = `57${digitos}`;

  return digitos;
}

export function enlaceWhatsapp(valor: string): string {
  return `https://wa.me/${normalizarWhatsapp(valor)}`;
}
