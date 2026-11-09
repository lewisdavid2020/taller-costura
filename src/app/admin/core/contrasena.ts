export interface FuerzaContrasena {
  puntaje: number;
  etiqueta: string;
  descripcion: string;
}

const ETIQUETAS = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Excelente'];
const DESCRIPCIONES = [
  'Usa al menos 8 caracteres, una letra y un número.',
  'Agrega más caracteres para que sea difícil de adivinar.',
  'Vas por buen camino; suma una mayúscula o un símbolo.',
  'Buena combinación de longitud y variedad.',
  'Contraseña robusta. Perfecta para una cuenta administradora.',
];

export function evaluarContrasena(contrasena: string): FuerzaContrasena {
  if (!contrasena) {
    return { puntaje: 0, etiqueta: ETIQUETAS[0], descripcion: DESCRIPCIONES[0] };
  }

  let puntaje = 0;
  if (contrasena.length >= 8) puntaje += 1;
  if (contrasena.length >= 12) puntaje += 1;
  if (/[a-z]/.test(contrasena) && /[A-Z]/.test(contrasena)) puntaje += 1;
  if (/\d/.test(contrasena)) puntaje += 1;
  if (/[^A-Za-z0-9]/.test(contrasena)) puntaje += 1;

  const obvia = /^(123456|password|qwerty|admin|letmein|taller)\d{0,4}$/i.test(contrasena);
  if (obvia || /^\d+$/.test(contrasena)) puntaje = Math.min(puntaje, 1);

  const limitado = Math.min(4, puntaje);
  return {
    puntaje: limitado,
    etiqueta: ETIQUETAS[limitado],
    descripcion: DESCRIPCIONES[limitado],
  };
}

export function contrasenaValida(contrasena: string): boolean {
  return contrasena.length >= 8 && /[A-Za-z]/.test(contrasena) && /\d/.test(contrasena);
}

export async function hashContrasena(contrasena: string): Promise<string> {
  const datos = new TextEncoder().encode(`taller-costura::${contrasena}`);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Respaldo determinista para entornos sin WebCrypto (solo demostración local).
  let hash = 2166136261;
  for (const byte of datos) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}
