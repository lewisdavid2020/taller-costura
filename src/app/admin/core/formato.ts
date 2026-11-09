const FORMATO_MONEDA = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FORMATO_ENTERO = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
});

export function formatearPrecio(valor: number): string {
  return `$${FORMATO_MONEDA.format(Number.isFinite(valor) ? valor : 0)}`;
}

export function formatearNumero(valor: number): string {
  return FORMATO_ENTERO.format(Number.isFinite(valor) ? valor : 0);
}

export function formatearFecha(fecha: string | Date): string {
  const valor = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(valor);
}

export function formatearFechaLarga(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function mesCorto(fecha: Date): string {
  const texto = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(fecha);
  return texto.replace('.', '').toUpperCase();
}

export function saludoSegunHora(fecha: Date = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'AD';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0].charAt(0)}${partes[partes.length - 1].charAt(0)}`.toUpperCase();
}

export function fechaHaceDias(dias: number, hora = 10): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha.toISOString();
}

export function fechaEnDias(dias: number, hora = 12): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha.toISOString();
}
