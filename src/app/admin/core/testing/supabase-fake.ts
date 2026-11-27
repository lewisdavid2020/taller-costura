/**
 * Cliente de Supabase simulado, en memoria, exclusivo para pruebas.
 * Ninguna de estas funciones escribe en el proyecto real de Supabase.
 */

export type Fila = Record<string, unknown>;

interface UsuarioFake {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
}

interface SesionFake {
  user: UsuarioFake;
}

type Resultado = { data: unknown; error: { message: string } | null };
type EscuchaAuth = (evento: string, sesion: SesionFake | null) => void;

const tablas = new Map<string, Fila[]>();
const usuarios: Array<{ usuario: UsuarioFake; contrasena: string }> = [];
let sesion: SesionFake | null = null;
let escucha: EscuchaAuth | null = null;
let contador = 0;

export function reiniciarSupabaseFake(): void {
  tablas.clear();
  usuarios.length = 0;
  sesion = null;
  escucha = null;
  contador = 0;
}

export function establecerFilas(nuevas: Record<string, Fila[]>): void {
  for (const [tabla, filas] of Object.entries(nuevas)) {
    tablas.set(tabla, filas.map((fila) => ({ ...fila })));
  }
}

export function establecerSesion(usuario: UsuarioFake | null): void {
  sesion = usuario ? { user: usuario } : null;
}

export function sembrarRol(correo: string, rol = 'admin'): void {
  const encontrado = usuarios.find((item) => item.usuario.email === correo);
  if (!encontrado) return;
  const filas = tablas.get('user_roles') ?? [];
  const existente = filas.find((fila) => fila['user_id'] === encontrado.usuario.id);
  if (existente) {
    existente['role'] = rol;
  } else {
    filas.push({ user_id: encontrado.usuario.id, role: rol, created_at: new Date().toISOString() });
  }
  tablas.set('user_roles', filas);
}

type Modo = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

class ConsultaFake implements PromiseLike<Resultado> {
  private modo: Modo = 'select';
  private filtros: Array<[string, unknown]> = [];
  private valores: Fila[] = [];
  private unico = false;
  private quizasUno = false;
  private orden: { campo: string; ascendente: boolean } | null = null;

  constructor(private readonly tabla: string) {}

  select(): this {
    return this;
  }

  order(campo: string, opciones: { ascending?: boolean }): this {
    this.orden = { campo, ascendente: opciones?.ascending !== false };
    return this;
  }

  eq(campo: string, valor: unknown): this {
    this.filtros.push([campo, valor]);
    return this;
  }

  insert(datos: Fila | Fila[]): this {
    this.modo = 'insert';
    this.valores = Array.isArray(datos) ? datos : [datos];
    return this;
  }

  update(datos: Fila): this {
    this.modo = 'update';
    this.valores = [datos];
    return this;
  }

  upsert(datos: Fila | Fila[]): this {
    this.modo = 'upsert';
    this.valores = Array.isArray(datos) ? datos : [datos];
    return this;
  }

  delete(): this {
    this.modo = 'delete';
    return this;
  }

  single(): this {
    this.unico = true;
    return this;
  }

  maybeSingle(): this {
    this.quizasUno = true;
    return this;
  }

  then<TResult1 = Resultado, TResult2 = never>(
    onfulfilled?: ((value: Resultado) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.resolver()).then(onfulfilled, onrejected);
  }

  private resolver(): Resultado {
    const filas = tablas.get(this.tabla) ?? [];

    switch (this.modo) {
      case 'insert': {
        const creados = this.valores.map((valor) => {
          const fila: Fila = { id: `fila-${++contador}`, created_at: new Date().toISOString(), ...valor };
          // La base real aplica este valor por defecto al insertar una solicitud.
          if (this.tabla === 'solicitudes_cotizacion' && fila['estado'] === undefined) {
            fila['estado'] = 'nueva';
          }
          // La base real genera el folio con un trigger antes de insertar.
          if (this.tabla === 'orders' && (!fila['folio'] || String(fila['folio']).trim() === '')) {
            fila['folio'] = `PED-${new Date().getFullYear()}-${String(++contador).padStart(4, '0')}`;
          }
          filas.push(fila);
          return fila;
        });
        tablas.set(this.tabla, filas);
        return { data: this.unico ? creados[0] ?? null : creados, error: null };
      }
      case 'update': {
        const destino = filas.filter((fila) => this.coincide(fila));
        for (const fila of destino) Object.assign(fila, this.valores[0]);
        return { data: this.unico ? destino[0] ?? null : destino, error: null };
      }
      case 'delete': {
        tablas.set(this.tabla, filas.filter((fila) => !this.coincide(fila)));
        return { data: null, error: null };
      }
      case 'upsert': {
        for (const valor of this.valores) {
          const indice = filas.findIndex((fila) => fila['id'] === valor['id']);
          if (indice >= 0) filas[indice] = { ...filas[indice], ...valor };
          else filas.push({ ...valor });
        }
        tablas.set(this.tabla, filas);
        return { data: null, error: null };
      }
      default: {
        let resultado = filas.filter((fila) => this.coincide(fila));
        if (this.orden) {
          const { campo, ascendente } = this.orden;
          resultado = [...resultado].sort((a, b) => {
            const izquierda = String(a[campo] ?? '');
            const derecha = String(b[campo] ?? '');
            return ascendente ? izquierda.localeCompare(derecha) : derecha.localeCompare(izquierda);
          });
        }
        if (this.unico || this.quizasUno) return { data: resultado[0] ?? null, error: null };
        return { data: resultado, error: null };
      }
    }
  }

  private coincide(fila: Fila): boolean {
    return this.filtros.every(([campo, valor]) => fila[campo] === valor);
  }
}

function crearUsuario(correo: string, contrasena: string, metadata?: Record<string, unknown>): UsuarioFake {
  const usuario: UsuarioFake = {
    id: `usuario-${++contador}`,
    email: correo,
    created_at: new Date().toISOString(),
    user_metadata: metadata,
  };
  usuarios.push({ usuario, contrasena });
  sesion = { user: usuario };
  escucha?.('SIGNED_IN', sesion);
  return usuario;
}

export function crearSupabaseFalso() {
  return {
    from(tabla: string) {
      return new ConsultaFake(tabla);
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (fn === 'convertir_solicitud_en_pedido') {
        const solicitudes = tablas.get('solicitudes_cotizacion') ?? [];
        const solicitud = solicitudes.find((fila) => fila['id'] === args['p_solicitud_id']);
        if (!solicitud) return { data: null, error: { message: 'La solicitud no existe.' } };
        if (solicitud['estado'] === 'convertida') {
          return { data: null, error: { message: 'La solicitud ya fue convertida en pedido.' } };
        }

        const pedidos = tablas.get('orders') ?? [];
        const pedido: Fila = {
          id: `fila-${++contador}`,
          folio: `PED-${new Date().getFullYear()}-${String(++contador).padStart(4, '0')}`,
          cliente: solicitud['nombre'],
          correo: solicitud['correo'],
          telefono: solicitud['telefono'] ?? '',
          servicio: solicitud['servicio'],
          fecha: new Date().toISOString(),
          entrega: args['p_entrega'],
          total: args['p_total'],
          estado: 'pendiente',
          solicitud_id: solicitud['id'],
          creado_por: sesion?.user.id ?? null,
          created_at: new Date().toISOString(),
        };
        pedidos.push(pedido);
        tablas.set('orders', pedidos);
        solicitud['estado'] = 'convertida';
        return { data: pedido, error: null };
      }
      return { data: null, error: { message: `RPC no simulada: ${fn}` } };
    },
    auth: {
      getSession: async () => ({ data: { session: sesion }, error: null }),
      onAuthStateChange: (callback: EscuchaAuth) => {
        escucha = callback;
        return { data: { subscription: { unsubscribe: () => { escucha = null; } } }, error: null };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const encontrado = usuarios.find(
          (item) => item.usuario.email === email && item.contrasena === password,
        );
        if (!encontrado) return { data: { user: null }, error: { message: 'Invalid login credentials' } };
        sesion = { user: encontrado.usuario };
        escucha?.('SIGNED_IN', sesion);
        return { data: { user: encontrado.usuario }, error: null };
      },
      signUp: async ({
        email,
        password,
        options,
      }: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
      }) => {
        if (usuarios.some((item) => item.usuario.email === email)) {
          return { data: { user: null }, error: { message: 'User already registered' } };
        }
        return { data: { user: crearUsuario(email, password, options?.data) }, error: null };
      },
      signOut: async () => {
        sesion = null;
        escucha?.('SIGNED_OUT', null);
        return { error: null };
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'simulado' }, error: null }),
        getPublicUrl: (ruta: string) => ({ data: { publicUrl: `https://simulado.local/${ruta}` } }),
      }),
    },
  };
}
