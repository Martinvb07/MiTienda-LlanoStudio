/**
 * Clientes de un sitio, armados con lo que ya hay: pedidos y citas. No hay
 * una tabla de clientes; una persona es la misma si repite correo o celular.
 */

export interface PedidoCliente {
  id: string
  numero: number
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string | null
  ciudad: string | null
  estado: string
  total: number
  creadoEn: Date
}

export interface CitaCliente {
  id: string
  servicio: string
  clienteNombre: string
  clienteEmail: string | null
  clienteTelefono: string
  estado: string
  inicio: Date
}

export interface Cliente {
  clave: string
  nombre: string
  email: string | null
  telefono: string | null
  ciudad: string | null
  pedidos: number
  citas: number
  /** Pesos, sin los pedidos cancelados ni reembolsados. */
  gastado: number
  primeraVez: string
  ultimaVez: string
  pedidoIds: string[]
  citaIds: string[]
}

const NO_CUENTAN = new Set(['CANCELADO', 'REEMBOLSADO'])

/** "+57 300 123-4567" y "3001234567" son el mismo celular. */
export function normalizarTelefono(telefono: string | null | undefined): string | null {
  const digitos = (telefono ?? '').replace(/\D/g, '')
  if (digitos.length < 7) return null
  return digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos
}

/**
 * Junta pedidos y citas por persona: primero por correo y, si no, por celular.
 * Quien usa el mismo celular con dos correos queda como una sola persona.
 */
export function agruparClientes(pedidos: PedidoCliente[], citas: CitaCliente[]): Cliente[] {
  const clientes: Cliente[] = []
  const porEmail = new Map<string, Cliente>()
  const porTelefono = new Map<string, Cliente>()

  function buscar(email: string | null, telefono: string | null, nombre: string, fecha: Date) {
    const correo = email?.trim().toLowerCase() || null
    const celular = normalizarTelefono(telefono)
    let cliente = (correo && porEmail.get(correo)) || (celular && porTelefono.get(celular)) || null
    const iso = fecha.toISOString()
    if (!cliente) {
      cliente = {
        clave: correo ?? celular ?? `${nombre}-${iso}`,
        nombre,
        email: correo,
        telefono: telefono?.trim() || null,
        ciudad: null,
        pedidos: 0,
        citas: 0,
        gastado: 0,
        primeraVez: iso,
        ultimaVez: iso,
        pedidoIds: [],
        citaIds: [],
      }
      clientes.push(cliente)
    }
    // Lo más reciente manda en el nombre y los datos de contacto.
    if (iso >= cliente.ultimaVez) {
      cliente.ultimaVez = iso
      cliente.nombre = nombre
      if (telefono?.trim()) cliente.telefono = telefono.trim()
    }
    if (iso < cliente.primeraVez) cliente.primeraVez = iso
    if (correo && !cliente.email) cliente.email = correo
    if (correo) porEmail.set(correo, cliente)
    if (celular) porTelefono.set(celular, cliente)
    return cliente
  }

  for (const pedido of [...pedidos].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime())) {
    const cliente = buscar(pedido.clienteEmail, pedido.clienteTelefono, pedido.clienteNombre, pedido.creadoEn)
    cliente.pedidoIds.push(pedido.id)
    if (pedido.ciudad) cliente.ciudad = pedido.ciudad
    if (NO_CUENTAN.has(pedido.estado)) continue
    cliente.pedidos += 1
    cliente.gastado += pedido.total
  }
  for (const cita of [...citas].sort((a, b) => a.inicio.getTime() - b.inicio.getTime())) {
    const cliente = buscar(cita.clienteEmail, cita.clienteTelefono, cita.clienteNombre, cita.inicio)
    cliente.citaIds.push(cita.id)
    if (cita.estado !== 'CANCELADA') cliente.citas += 1
  }

  return clientes.sort((a, b) => b.ultimaVez.localeCompare(a.ultimaVez))
}
