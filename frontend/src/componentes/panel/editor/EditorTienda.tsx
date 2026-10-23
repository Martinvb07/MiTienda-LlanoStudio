'use client'

import { ArrowUpRight, LayoutTemplate, Move, Palette, Redo2, Settings2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { AccionSeccion, MensajeLienzo, MensajeSoltar } from '@/app/panel/vista-previa/mensajes'
import { guardarTienda, listarProductos, type DatosTienda } from '@/servicios/panel'
import { crearBloque, duplicarBloque, type Bloque, etiquetaBloque, type BloqueLienzo, type PropsLienzo, type TipoBloque, type TipoElementoLienzo } from '@/tipos/bloques'
import type { AjustesTienda, Producto, TemaTienda, Tienda } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { ESTILOS_PREDEFINIDOS, RADIOS, esquemasIniciales } from '@/utilidades/tema'
import { cn } from '@/utilidades/clases'
import { PLANES, limitesDe, planIncluye, planMinimo } from '@/utilidades/planes'
import { ajustesConPlantilla, type PlantillaTienda } from '@/utilidades/plantillas'
import { bloquesDePlantilla, plantillasDe } from '@/utilidades/plantillasPagina'
import { textosSitio, vendeEnLinea } from '@/utilidades/sitio'
import { useSesion } from '../SesionPanel'
import { Aviso, CURVA, Campo, CampoArea, CampoColor, Candado, Interruptor, PlanRequerido, Seccion, Segmentado } from '../ui/basicos'
import { Selector } from '../ui/flotantes'
import { ZonaImagen } from '../ui/imagenes'
import { CamposCabecera, CamposContacto } from './CamposAjustes'
import { CamposFicha } from './CamposFicha'
import { CamposTema } from './CamposTema'
import { CamposVentas } from './CamposVentas'
import { ListaBloques, posicionNueva } from './ListaBloques'
import { ContextoEditorLienzo } from './ContextoLienzo'
import { DISENOS_LIENZO, agregarAlLienzo, cajaVisible, cambiarCapa, conCaja, duplicarElemento, nuevoElemento } from '@/utilidades/lienzo'
import { PaletaLienzo } from './PaletaLienzo'
import { ModalPieza } from './CamposLienzo'
import { aLienzo, avisoConversion, esConvertible } from '@/utilidades/editarLibre'
import { medirSecciones } from '@/utilidades/medirSecciones'
import { MarcoEditor, useAtajosEditor } from './MarcoEditor'
import { VistaPrevia, type Dispositivo } from './VistaPrevia'
import { SALIR_SIN_GUARDAR, confirmar } from '../ui/confirmar'

const TEMA_BASE = ESTILOS_PREDEFINIDOS[0]!.tema

const PESTANAS = [
  { valor: 'pagina', etiqueta: 'Página', Icono: LayoutTemplate },
  { valor: 'tema', etiqueta: 'Tema', Icono: Palette },
  { valor: 'ajustes', etiqueta: 'Ajustes', Icono: Settings2 },
] as const

/** Producto de muestra para ver la plantilla cuando la tienda aún no tiene productos. */
const PRODUCTO_EJEMPLO: Producto = {
  id: 'ejemplo',
  nombre: 'Producto de ejemplo',
  slug: 'ejemplo',
  descripcion: 'Así se ve la descripción de tus productos: materiales, medidas y lo que lo hace especial.',
  precio: '89000',
  precioComparacion: '120000',
  stock: 4,
  fotos: [],
  categoria: null,
  presentacion: 'Talla única',
}

function borradorDe(tienda: Tienda): DatosTienda {
  return {
    nombre: tienda.nombre,
    descripcion: tienda.descripcion ?? '',
    logoUrl: tienda.logoUrl,
    plantilla: tienda.plantilla,
    tema: { ...TEMA_BASE, ...tienda.tema },
    configuracionBloques: tienda.configuracionBloques,
    ajustes: tienda.ajustes ?? {},
    publicada: tienda.publicada,
  }
}

interface Props {
  tienda: Tienda
  subdominio: string
  alGuardar: (tienda: Tienda) => void
  alCerrar: () => void
  /** Plantilla elegida en el sitio antes de crear la cuenta: se aplica al abrir. */
  plantillaInicial?: string | null
}

/**
 * Editor de la tienda: a la izquierda las secciones de la página, el estilo y
 * los datos; a la derecha la tienda real actualizándose mientras se edita.
 */
export function EditorTienda({ tienda, subdominio, alGuardar, alCerrar, plantillaInicial }: Props) {
  const [borrador, setBorrador] = useState<DatosTienda>(() => borradorDe(tienda))
  const [inicial, setInicial] = useState(() => JSON.stringify(borradorDe(tienda)))
  const [abierto, setAbierto] = useState<string | null>(null)
  const [dispositivo, setDispositivo] = useState<Dispositivo>('escritorio')
  const [pestana, setPestana] = useState<(typeof PESTANAS)[number]['valor']>('pagina')
  const [plantillaEditada, setPlantillaEditada] = useState<'portada' | 'producto'>('portada')
  const [productos, setProductos] = useState<Producto[]>([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoReciente, setGuardadoReciente] = useState(false)
  const [subiendo, setSubiendo] = useState(0)
  const plan = useSesion().sesion.tenant.plan
  const limites = limitesDe(plan)
  // Una página informativa no ve lo de vender: ficha de producto ni ventas y envíos.
  const vende = vendeEnLinea(tienda.tipo)
  const textos = textosSitio(tienda.tipo)

  // Aplica la plantilla que eligió en el sitio, si su plan la incluye. Queda
  // como cambio sin guardar: decide él si la guarda.
  useEffect(() => {
    const elegida = plantillasDe(tienda.tipo).find((opcion) => opcion.clave === plantillaInicial)
    if (!elegida || !planIncluye(plan, elegida.plan)) return
    setBorrador((actual) => ({
      ...actual,
      tema: { ...elegida.tema },
      plantilla: elegida.estilo,
      configuracionBloques: bloquesDePlantilla(elegida, actual.nombre || 'Mi negocio', plan),
      ajustes: ajustesConPlantilla(actual.ajustes, elegida),
    }))
  }, [plantillaInicial, plan, tienda.tipo])

  const sucio = JSON.stringify(borrador) !== inicial

  useEffect(() => {
    listarProductos()
      .then((lista) => setProductos(lista.filter((producto) => producto.activo)))
      .catch(() => setProductos([]))
  }, [])

  // Historial para deshacer. Los cambios seguidos (escribir un título letra a
  // letra) se agrupan en un solo paso si llegan con menos de 700 ms entre sí.
  const pasado = useRef<DatosTienda[]>([])
  const futuro = useRef<DatosTienda[]>([])
  const ultimoCambio = useRef(0)
  const [, setVersionHistorial] = useState(0)

  const actualRef = useRef(borrador)
  actualRef.current = borrador
  const marcar = () => setVersionHistorial((version) => version + 1)

  const cambiar = useCallback((cambios: Partial<DatosTienda>) => {
    const ahora = Date.now()
    if (ahora - ultimoCambio.current > 700) {
      pasado.current = [...pasado.current.slice(-79), actualRef.current]
      futuro.current = []
      marcar()
    }
    ultimoCambio.current = ahora
    setBorrador((actual) => ({ ...actual, ...cambios }))
  }, [])

  const deshacer = useCallback(() => {
    const anterior = pasado.current.at(-1)
    if (!anterior) return
    pasado.current = pasado.current.slice(0, -1)
    futuro.current = [actualRef.current, ...futuro.current]
    ultimoCambio.current = 0
    setBorrador(anterior)
    marcar()
  }, [])

  const rehacer = useCallback(() => {
    const siguiente = futuro.current[0]
    if (!siguiente) return
    futuro.current = futuro.current.slice(1)
    pasado.current = [...pasado.current, actualRef.current]
    ultimoCambio.current = 0
    setBorrador(siguiente)
    marcar()
  }, [])

  // Ctrl/Cmd+Z y Ctrl/Cmd+Shift+Z (o Ctrl+Y). Dentro de un campo de texto se
  // deja el deshacer propio del navegador.
  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (!(evento.metaKey || evento.ctrlKey)) return
      const objetivo = evento.target as HTMLElement
      if (objetivo.closest('input, textarea, [contenteditable="true"]')) return
      const tecla = evento.key.toLowerCase()
      if (tecla === 'z' && !evento.shiftKey) {
        evento.preventDefault()
        deshacer()
      } else if ((tecla === 'z' && evento.shiftKey) || tecla === 'y') {
        evento.preventDefault()
        rehacer()
      }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [deshacer, rehacer])

  /** Lo que se pide desde la barra de cada sección en la vista previa. */
  const alAccionVista = useCallback(
    (id: string, accion: AccionSeccion) => {
      if (accion === 'libre') {
        void editarLibre([id])
        return
      }
      if (accion === 'elegir') {
        // Desde cualquier pestaña: lleva a la lista de secciones con ésta abierta.
        setPestana('pagina')
        setPlantillaEditada('portada')
        setAbierto(id)
        return
      }
      const bloques = borrador.configuracionBloques
      const indice = bloques.findIndex((bloque) => bloque.id === id)
      const bloque = bloques[indice]
      if (!bloque) return
      const copia = [...bloques]
      switch (accion) {
        case 'subir':
        case 'bajar': {
          const destino = indice + (accion === 'subir' ? -1 : 1)
          if (destino < 0 || destino >= copia.length) return
          copia.splice(indice, 1)
          copia.splice(destino, 0, bloque)
          break
        }
        case 'duplicar': {
          if (copia.length >= limites.secciones) return
          const nuevo = duplicarBloque(bloque)
          copia.splice(indice + 1, 0, nuevo)
          setAbierto(nuevo.id)
          break
        }
        case 'ocultar':
          copia[indice] = { ...bloque, visible: false }
          break
        case 'eliminar':
          void confirmar({
            titulo: `¿Eliminar la sección "${etiquetaBloque(bloque)}"?`,
            mensaje: 'Se quita de tu tienda con todo lo que tiene adentro. Puedes recuperarla con Ctrl+Z mientras no cierres el editor.',
            confirmar: 'Sí, eliminar',
            peligro: true,
          }).then((si) => si && cambiar({ configuracionBloques: bloques.filter((otro) => otro.id !== id) }))
          return
      }
      cambiar({ configuracionBloques: copia })
    },
    // editarLibre se declara más abajo: toma el borrador de actualRef, y el plan y los
    // productos que usa no cambian mientras el editor está abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [borrador.configuracionBloques, cambiar, limites.secciones],
  )
  const cambiarTema = (cambios: Partial<TemaTienda>) => cambiar({ tema: { ...borrador.tema, ...cambios } })
  const cambiarAjustes = (cambios: Partial<AjustesTienda>) => cambiar({ ajustes: { ...borrador.ajustes, ...cambios } })
  const categorias = useMemo(
    () => [...new Set(productos.map((producto) => producto.categoria?.trim()).filter((c): c is string => Boolean(c)))],
    [productos],
  )
  const esquemas = borrador.tema.esquemas ?? esquemasIniciales(borrador.tema)
  const alSubiendo = useCallback((delta: number) => setSubiendo((valor) => valor + delta), [])

  const guardar = useCallback(async () => {
    if (guardando || subiendo > 0) return
    if (!borrador.nombre.trim()) {
      setError('La tienda necesita un nombre.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const guardada = await guardarTienda(borrador)
      const nuevo = borradorDe(guardada)
      setBorrador(nuevo)
      setInicial(JSON.stringify(nuevo))
      alGuardar(guardada)
      setGuardadoReciente(true)
      setTimeout(() => setGuardadoReciente(false), 2200)
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }, [alGuardar, borrador, guardando, subiendo])

  useAtajosEditor(sucio, () => void guardar())

  async function aplicarPlantilla(plantilla: PlantillaTienda) {
    const si = await confirmar({
      titulo: `¿Usar la plantilla ${plantilla.nombre}?`,
      mensaje: 'Reemplaza las secciones, el encabezado y el estilo de tu página. Tus productos y tus datos de contacto no cambian, y puedes deshacerlo con Ctrl+Z.',
      confirmar: 'Usar plantilla',
    })
    if (!si) return
    cambiar({
      tema: { ...plantilla.tema },
      plantilla: plantilla.estilo,
      configuracionBloques: bloquesDePlantilla(plantilla, borrador.nombre || 'Mi negocio', plan),
      ajustes: ajustesConPlantilla(borrador.ajustes, plantilla),
    })
    setAbierto(null)
  }

  // ── Lienzo libre: lo que se hace con el mouse en la vista previa ──
  const [lienzoElegido, setLienzoElegido] = useState<{ bloque: string; elemento: string } | null>(null)

  const cambiarLienzo = useCallback(
    (bloqueId: string, cambio: (props: PropsLienzo) => PropsLienzo) => {
      cambiar({
        configuracionBloques: actualRef.current.configuracionBloques.map((bloque) =>
          bloque.id === bloqueId && bloque.tipo === 'lienzo' ? { ...bloque, props: cambio(bloque.props) } : bloque,
        ),
      })
    },
    [cambiar],
  )

  const alLienzo = useCallback(
    (mensaje: MensajeLienzo) => {
      const { bloque, elemento, movil } = mensaje
      switch (mensaje.accion) {
        case 'elegir':
          setLienzoElegido(elemento ? { bloque, elemento } : null)
          if (elemento) {
            setPestana('pagina')
            setPlantillaEditada('portada')
            setAbierto(bloque)
          }
          return
        case 'mover':
          if (!elemento || !mensaje.caja) return
          cambiarLienzo(bloque, (props) => ({
            ...props,
            elementos: props.elementos.map((pieza) => (pieza.id === elemento ? conCaja(pieza, mensaje.caja!, movil) : pieza)),
          }))
          return
        case 'alto':
          if (!mensaje.alto) return
          cambiarLienzo(bloque, (props) => (movil ? { ...props, altoMovil: mensaje.alto! } : { ...props, alto: mensaje.alto! }))
          return
        case 'adelante':
        case 'atras':
          if (!elemento) return
          cambiarLienzo(bloque, (props) => ({
            ...props,
            elementos: cambiarCapa(props.elementos, elemento, mensaje.accion === 'adelante' ? 1 : -1),
          }))
          return
        case 'duplicar': {
          if (!elemento) return
          let nuevo: string | undefined
          cambiarLienzo(bloque, (props) => {
            const resultado = duplicarElemento(props.elementos, elemento)
            nuevo = resultado.nuevo
            return { ...props, elementos: resultado.elementos }
          })
          if (nuevo) setLienzoElegido({ bloque, elemento: nuevo })
          return
        }
        case 'eliminar':
          if (!elemento) return
          cambiarLienzo(bloque, (props) => ({ ...props, elementos: props.elementos.filter((pieza) => pieza.id !== elemento) }))
          setLienzoElegido(null)
          return
      }
    },
    [cambiarLienzo],
  )

  // ── Editar libre: una sección (o toda la página) pasa a Lienzo libre ──
  const conLienzo = limites.bloques.includes('lienzo')
  const [convirtiendo, setConvirtiendo] = useState(false)

  async function editarLibre(ids: string[] | 'todas') {
    if (!conLienzo) return
    const bloques = actualRef.current.configuracionBloques
    const elegidos = bloques.filter((bloque) => (ids === 'todas' || ids.includes(bloque.id)) && esConvertible(bloque.tipo))
    if (elegidos.length === 0) return
    const avisos = elegidos.map(avisoConversion).filter(Boolean)
    const si = await confirmar({
      titulo:
        ids === 'todas'
          ? `¿Pasar ${elegidos.length === 1 ? 'la sección' : `las ${elegidos.length} secciones`} a edición libre?`
          : `¿Editar libre "${etiquetaBloque(elegidos[0]!)}"?`,
      mensaje: [
        ids === 'todas'
          ? 'Todas tus secciones pasan a edición libre; los productos y las redes siguen al día. Puedes volver atrás con Ctrl+Z.'
          : 'Esta sección pasa a edición libre. Puedes volver atrás con Ctrl+Z.',
        ...avisos,
      ].join(' '),
      confirmar: 'Editar libre',
    })
    if (!si) return

    // Se mide la sección pintada (a 1440 y a 390) para dejar cada pieza donde estaba.
    setConvirtiendo(true)
    const actual = actualRef.current
    const medidas = await medirSecciones(
      { ...datosVista, tienda: { ...datosVista.tienda, tema: actual.tema, configuracionBloques: actual.configuracionBloques } },
      elegidos,
    ).catch(() => new Map())
    setConvirtiendo(false)
    const tema = actualRef.current.tema
    const nuevos = new Map(elegidos.map((bloque) => [bloque.id, aLienzo(bloque, tema, medidas.get(bloque.id))]))
    // Lo que no se pudo medir se queda como estaba, y se avisa.
    const fallidas = elegidos.filter((bloque) => !nuevos.get(bloque.id))
    for (const bloque of fallidas) nuevos.delete(bloque.id)
    if (fallidas.length)
      setError(
        `No pudimos pasar a libre ${fallidas.map((bloque) => `"${etiquetaBloque(bloque)}"`).join(', ')}. Vuelve a intentarlo en un momento.`,
      )
    if (nuevos.size === 0) return
    // Un solo paso en el historial: ni se junta con lo anterior ni con lo que siga.
    ultimoCambio.current = 0
    cambiar({
      configuracionBloques: actualRef.current.configuracionBloques.map((bloque) => nuevos.get(bloque.id) ?? bloque),
    })
    ultimoCambio.current = 0

    const primero = [...nuevos.values()][0]
    setPestana('pagina')
    setPlantillaEditada('portada')
    setAbierto(primero?.id ?? null)
    const pieza = primero?.props.elementos.find((elemento) => elemento.tipo !== 'imagen' && elemento.tipo !== 'forma') ?? primero?.props.elementos[0]
    setLienzoElegido(primero && pieza ? { bloque: primero.id, elemento: pieza.id } : null)
  }
  const convertibles = borrador.configuracionBloques.filter((bloque) => esConvertible(bloque.tipo)).length

  // ── Paleta de la derecha: agrega piezas al lienzo abierto ──
  const lienzoAbierto =
    pestana === 'pagina' && plantillaEditada === 'portada'
      ? borrador.configuracionBloques.find((bloque): bloque is BloqueLienzo => bloque.id === abierto && bloque.tipo === 'lienzo')
      : undefined

  /** Agrega una sección antes de `antesDe` (o donde corresponde) y la deja abierta. */
  function agregarSeccion(tipo: TipoBloque, antesDe: string | null, preparar?: (bloque: Bloque) => Bloque) {
    const bloques = actualRef.current.configuracionBloques
    if (bloques.length >= limites.secciones || !limites.bloques.includes(tipo)) {
      setError(`Tu plan ${limites.nombre} no admite más secciones de este tipo.`)
      return null
    }
    const nuevo = preparar ? preparar(crearBloque(tipo)) : crearBloque(tipo)
    const indice = antesDe ? bloques.findIndex((bloque) => bloque.id === antesDe) : -1
    const posicion =
      tipo === 'anuncio' || tipo === 'pie' || indice === -1 ? posicionNueva(bloques, tipo, abierto) : Math.max(indice, bloques[0]?.tipo === 'anuncio' ? 1 : 0)
    ultimoCambio.current = 0
    cambiar({ configuracionBloques: [...bloques.slice(0, posicion), nuevo, ...bloques.slice(posicion)] })
    ultimoCambio.current = 0
    setPestana('pagina')
    setPlantillaEditada('portada')
    setAbierto(nuevo.id)
    return nuevo
  }

  /** Pone una pieza en un lienzo; si no hay uno abierto, crea uno nuevo. */
  function agregarPieza(tipo: TipoElementoLienzo, donde?: { bloque: string; x: number; y: number; movil: boolean }) {
    const bloques = actualRef.current.configuracionBloques
    const destino = donde
      ? bloques.find((bloque): bloque is BloqueLienzo => bloque.id === donde.bloque && bloque.tipo === 'lienzo')
      : lienzoAbierto
    if (!destino) {
      const pieza = nuevoElemento(tipo)
      // Sin lienzo donde ponerla: va en uno nuevo, debajo de donde se soltó.
      const siguiente = donde ? bloques[bloques.findIndex((bloque) => bloque.id === donde.bloque) + 1] : undefined
      const nuevo = agregarSeccion('lienzo', siguiente?.id ?? null, (bloque) =>
        bloque.tipo === 'lienzo' ? { ...bloque, props: agregarAlLienzo({ ...bloque.props, elementos: [] }, pieza) } : bloque,
      )
      if (nuevo) setLienzoElegido({ bloque: nuevo.id, elemento: pieza.id })
      return
    }
    const id = destino.id
    const pieza = nuevoElemento(tipo)
    ultimoCambio.current = 0
    cambiarLienzo(id, (props) => {
      const con = agregarAlLienzo(props, pieza)
      if (!donde) return con
      // Soltada en un punto: ahí queda en el aparato donde se soltó (sin mover lo
      // demás); en el otro, debajo de lo que hay.
      const caja = cajaVisible(pieza, donde.movil)
      const puesta = conCaja(
        con.elementos.at(-1)!,
        { x: Math.min(Math.max(donde.x - caja.w / 2, 0), 100 - caja.w), y: Math.min(Math.max(donde.y - caja.h / 2, 0), 100 - caja.h), w: caja.w, h: caja.h },
        donde.movil,
      )
      const elementos = props.elementos.map((elemento, indice) => {
        const otro = con.elementos[indice]!
        return donde.movil ? { ...otro, movil: elemento.movil } : { ...elemento, movil: otro.movil }
      })
      return donde.movil
        ? { ...props, alto: con.alto, elementos: [...elementos, puesta] }
        : { ...props, altoMovil: con.altoMovil, elementos: [...elementos, puesta] }
    })
    ultimoCambio.current = 0
    setLienzoElegido({ bloque: id, elemento: pieza.id })
  }

  /** Lo que se suelta desde la paleta dentro de la vista previa. */
  function alSoltar(mensaje: MensajeSoltar) {
    if (mensaje.clase === 'seccion') {
      agregarSeccion(mensaje.que as TipoBloque, mensaje.bloque)
      return
    }
    if (!conLienzo) return
    agregarPieza(
      mensaje.que as TipoElementoLienzo,
      mensaje.bloque ? { bloque: mensaje.bloque, x: mensaje.x ?? 50, y: mensaje.y ?? 50, movil: mensaje.movil } : undefined,
    )
  }

  async function usarDiseno(clave: string) {
    const diseno = DISENOS_LIENZO.find((opcion) => opcion.clave === clave)
    if (!diseno || !lienzoAbierto) return
    const id = lienzoAbierto.id
    if (
      lienzoAbierto.props.elementos.length > 0 &&
      !(await confirmar({
        titulo: `¿Usar "${diseno.nombre}"?`,
        mensaje: 'Reemplaza las piezas de este lienzo. Puedes volver atrás con Ctrl+Z.',
        confirmar: 'Usar diseño',
      }))
    )
      return
    ultimoCambio.current = 0
    cambiarLienzo(id, (props) => ({ ...props, ...diseno.armar() }))
    ultimoCambio.current = 0
    setLienzoElegido(null)
  }

  // ── La pieza elegida se edita en un modal sobre la vista previa ──
  const contextoLienzo = {
    elegido: lienzoElegido,
    elegir: (bloque: string, elemento: string | null) => setLienzoElegido(elemento ? { bloque, elemento } : null),
    movil: dispositivo === 'movil',
    productos,
    categorias,
  }
  const lienzoDeLaPieza = lienzoElegido
    ? borrador.configuracionBloques.find((bloque): bloque is Extract<typeof bloque, { tipo: 'lienzo' }> => bloque.id === lienzoElegido.bloque && bloque.tipo === 'lienzo')
    : undefined

  async function cerrar() {
    if (sucio && !(await confirmar(SALIR_SIN_GUARDAR))) return
    alCerrar()
  }

  const datosVista = useMemo(
    () => ({
      tienda: {
        nombre: borrador.nombre,
        logoUrl: borrador.logoUrl,
        tema: borrador.tema,
        configuracionBloques: borrador.configuracionBloques,
        ajustes: borrador.ajustes,
        moneda: tienda.moneda,
        plan,
        tipo: tienda.tipo,
      },
      productos,
      vista: plantillaEditada === 'producto' ? ('producto' as const) : ('tienda' as const),
      producto: productos[0] ?? PRODUCTO_EJEMPLO,
      enfocar: abierto,
      editable: true,
      lienzoElegido,
    }),
    [borrador, productos, abierto, tienda.moneda, plan, plantillaEditada, lienzoElegido, tienda.tipo],
  )

  const estiloActivo = ESTILOS_PREDEFINIDOS.find(
    (estilo) => JSON.stringify(estilo.tema) === JSON.stringify({ ...TEMA_BASE, ...borrador.tema }),
  )?.clave

  return (
    <MarcoEditor
      volver="Panel"
      alCerrar={cerrar}
      titulo={borrador.nombre || 'Mi negocio'}
      estado={borrador.publicada ? { texto: 'Publicada', tono: 'verde' } : { texto: 'Borrador', tono: 'ambar' }}
      sucio={sucio}
      guardadoReciente={guardadoReciente}
      subiendo={subiendo}
      guardando={guardando}
      puedeGuardar={sucio}
      textoGuardar="Guardar"
      alGuardar={() => void guardar()}
      dispositivo={dispositivo}
      alCambiarDispositivo={setDispositivo}
      acciones={
        <>
        <span className="hidden items-center gap-0.5 md:flex">
          <button
            type="button"
            onClick={deshacer}
            disabled={pasado.current.length === 0}
            aria-label="Deshacer"
            title="Deshacer (Ctrl+Z)"
            className="grid h-[34px] w-[34px] place-items-center rounded-lg text-sitio-suave transition-colors enabled:hover:bg-white/[0.07] enabled:hover:text-white disabled:opacity-30"
          >
            <Undo2 aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={rehacer}
            disabled={futuro.current.length === 0}
            aria-label="Rehacer"
            title="Rehacer (Ctrl+Shift+Z)"
            className="grid h-[34px] w-[34px] place-items-center rounded-lg text-sitio-suave transition-colors enabled:hover:bg-white/[0.07] enabled:hover:text-white disabled:opacity-30"
          >
            <Redo2 aria-hidden="true" className="h-4 w-4" />
          </button>
        </span>
        <a
          href={urlTienda(subdominio)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-[34px] items-center rounded-lg border border-sitio-borde px-[13px] text-[12.5px] text-sitio-suave transition-colors hover:bg-white/[0.06] hover:text-white sm:inline-flex"
        >
          {textos.ver} <ArrowUpRight aria-hidden="true" className="inline h-3 w-3 align-[-1px]" />
        </a>
        </>
      }
      lateral={
        <ContextoEditorLienzo.Provider value={contextoLienzo}>
          <div className="sticky -top-3.5 z-20 -mx-3.5 -mt-3.5 mb-1 border-b border-sitio-borde bg-sitio-lateral/95 px-3.5 pt-3.5 pb-3 backdrop-blur">
            <div className="grid grid-cols-3 gap-1 rounded-[10px] border border-sitio-borde bg-white/[0.03] p-1">
              {PESTANAS.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => setPestana(opcion.valor)}
                  className={cn(
                    'relative flex h-9 items-center justify-center gap-1.5 rounded-[7px] text-[12.5px] transition-colors',
                    pestana === opcion.valor ? 'text-white' : 'text-sitio-tenue hover:text-sitio-suave',
                  )}
                >
                  {pestana === opcion.valor && (
                    <motion.span
                      layoutId="pestana-editor"
                      transition={{ duration: 0.45, ease: CURVA }}
                      className="absolute inset-0 rounded-[7px] bg-white/[0.09]"
                    />
                  )}
                  <opcion.Icono aria-hidden="true" className="relative h-3.5 w-3.5" />
                  <span className="relative">{opcion.etiqueta}</span>
                </button>
              ))}
            </div>
            {pestana === 'pagina' && vende && (
              <div className="mt-2.5">
                <Selector
                  etiqueta="Plantilla que estás editando"
                  valor={plantillaEditada}
                  alCambiar={(valor) => {
                    setPlantillaEditada(valor)
                    setAbierto(null)
                  }}
                  opciones={[
                    { valor: 'portada', etiqueta: 'Portada', detalle: 'La página de inicio de tu tienda' },
                    { valor: 'producto', etiqueta: 'Página de producto', detalle: 'Cómo se ve cada producto' },
                  ]}
                />
              </div>
            )}
          </div>

          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
          <AnimatePresence>
            {convirtiendo && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: CURVA }}
                role="status"
                className="flex items-center gap-2 rounded-lg border border-sitio-borde bg-white/[0.03] px-3 py-2.5 text-[12px] text-sitio-suave"
              >
                <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Pasando a edición libre…
              </motion.p>
            )}
          </AnimatePresence>

          {pestana === 'pagina' && plantillaEditada === 'portada' && (
            <>
              <Seccion titulo="Encabezado">
                <CamposCabecera ajustes={borrador.ajustes} alCambiar={cambiarAjustes} categorias={categorias} limites={limites} />
              </Seccion>

              <Seccion titulo="Secciones" abierta abrirCon={abierto}>
                <ListaBloques
                  bloques={borrador.configuracionBloques}
                  alCambiar={(configuracionBloques) => cambiar({ configuracionBloques })}
                  abierto={abierto}
                  alAbrir={setAbierto}
                  alError={setError}
                  alSubiendo={alSubiendo}
                  limites={limites}
                  categorias={categorias}
                  esquemas={esquemas}
                  alEditarLibre={(id) => void editarLibre([id])}
                />
                {convertibles > 0 && (
                  <div className="mt-1 flex flex-col gap-2 border-t border-sitio-borde pt-3">
                    <button
                      type="button"
                      disabled={!conLienzo || convirtiendo}
                      onClick={() => void editarLibre('todas')}
                      className="flex h-9 items-center justify-center gap-2 rounded-lg border border-sitio-borde text-[12.5px] text-sitio-suave transition-colors enabled:hover:border-white/30 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {convirtiendo ? (
                        <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      ) : (
                        <Move aria-hidden="true" className="h-3.5 w-3.5" />
                      )}
                      {convirtiendo ? 'Pasando a edición libre…' : 'Editar toda la página en libre'}
                    </button>
                    {conLienzo ? (
                      <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
                        Pasa a edición libre {convertibles === 1 ? 'la sección' : `las ${convertibles} secciones`}; los productos y las redes siguen al día.
                      </p>
                    ) : (
                      <Candado plan={planMinimo((opcion) => opcion.bloques.includes('lienzo'))}>Mueve y estira cada pieza de tus secciones.</Candado>
                    )}
                  </div>
                )}
              </Seccion>
            </>
          )}

          {pestana === 'pagina' && plantillaEditada === 'producto' && (
            <CamposFicha
              plantilla={borrador.ajustes.paginaProducto}
              alCambiar={(paginaProducto) => cambiarAjustes({ paginaProducto })}
              limites={limites}
            />
          )}

          {pestana === 'tema' && (
            <>
              <Seccion titulo="Plantillas de diseño">
                <p className="text-[12px] leading-relaxed text-sitio-tenue">
                  Un diseño completo de un clic: estilo y secciones con textos de ejemplo para que solo cambies lo tuyo.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {plantillasDe(tienda.tipo).map((plantilla) => {
                    const incluida = planIncluye(plan, plantilla.plan)
                    return (
                      <button
                        key={plantilla.clave}
                        type="button"
                        disabled={!incluida}
                        onClick={() => void aplicarPlantilla(plantilla)}
                        title={incluida ? `Usar ${plantilla.nombre}` : `Desde el plan ${PLANES[plantilla.plan].nombre}`}
                        className="group flex flex-col gap-2 rounded-[10px] border border-sitio-borde bg-sitio-campo p-2 text-left transition-colors enabled:hover:border-white/30 disabled:cursor-not-allowed"
                      >
                        <span
                          className={cn(
                            'relative block aspect-[16/10] overflow-hidden rounded-md bg-black transition-opacity',
                            !incluida && 'opacity-40',
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura estática */}
                          <img src={plantilla.captura} alt="" className="h-full w-full object-cover object-top" />
                        </span>
                        <span className="flex items-center justify-between gap-1.5 px-0.5">
                          <span className="truncate text-[11.5px] text-white">{plantilla.nombre}</span>
                          {!incluida && <PlanRequerido plan={PLANES[plantilla.plan].nombre} />}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Seccion>

              <Seccion titulo="Colores" abierta>
                <span className="text-[11.5px] text-sitio-suave">Punto de partida</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {ESTILOS_PREDEFINIDOS.map((estilo) => (
                    <button
                      key={estilo.clave}
                      type="button"
                      title={estilo.nombre}
                      onClick={() => cambiar({ tema: { ...estilo.tema }, plantilla: estilo.clave })}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-colors',
                        estiloActivo === estilo.clave ? 'border-white/50 bg-white/[0.06]' : 'border-sitio-borde hover:border-white/25',
                      )}
                    >
                      <span
                        className="relative block h-9 w-full overflow-hidden rounded-[5px] border border-white/10"
                        style={{ background: estilo.tema.colorFondo }}
                      >
                        <span
                          className="absolute right-1.5 bottom-1.5 left-1.5 h-2.5 rounded-[3px]"
                          style={{ background: estilo.tema.colorMarca }}
                        />
                        <span
                          className="absolute top-1.5 left-1.5 h-1 w-5 rounded-full opacity-70"
                          style={{ background: estilo.tema.colorTexto }}
                        />
                      </span>
                      <span className="text-[10px] text-sitio-suave">{estilo.nombre}</span>
                    </button>
                  ))}
                </div>
                {!limites.temaLibre && (
                  <Candado plan={planMinimo((plan) => plan.temaLibre)}>
                    Colores, letra y esquinas a tu medida.
                  </Candado>
                )}
                <fieldset disabled={!limites.temaLibre} className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40">
                <div className="grid grid-cols-2 gap-2.5">
                  <CampoColor
                    etiqueta="Color de marca"
                    valor={borrador.tema.colorMarca ?? TEMA_BASE.colorMarca}
                    alCambiar={(colorMarca) => cambiarTema({ colorMarca })}
                  />
                  <CampoColor
                    etiqueta="Texto sobre la marca"
                    valor={borrador.tema.colorContraste ?? TEMA_BASE.colorContraste}
                    alCambiar={(colorContraste) => cambiarTema({ colorContraste })}
                  />
                  <CampoColor
                    etiqueta="Fondo"
                    valor={borrador.tema.colorFondo ?? TEMA_BASE.colorFondo}
                    alCambiar={(colorFondo) => cambiarTema({ colorFondo })}
                  />
                  <CampoColor
                    etiqueta="Texto"
                    valor={borrador.tema.colorTexto ?? TEMA_BASE.colorTexto}
                    alCambiar={(colorTexto) => cambiarTema({ colorTexto })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] text-sitio-suave">Esquinas</span>
                  <Segmentado
                    opciones={RADIOS}
                    valor={(borrador.tema.radio ?? TEMA_BASE.radio) as (typeof RADIOS)[number]['valor']}
                    alCambiar={(radio) => cambiarTema({ radio })}
                    chico
                  />
                </div>
                </fieldset>
              </Seccion>

              <CamposTema tema={borrador.tema} alCambiar={cambiarTema} limites={limites} />
            </>
          )}

          {pestana === 'ajustes' && (
            <>
              <Seccion titulo="Contacto y redes">
                <CamposContacto ajustes={borrador.ajustes} alCambiar={cambiarAjustes} limites={limites} />
              </Seccion>

              {vende && (
                <Seccion titulo="Ventas y envíos" abierta>
                  <CamposVentas ajustes={borrador.ajustes} alCambiar={cambiarAjustes} />
                </Seccion>
              )}

              <Seccion titulo="Identidad">
                <Campo
                  etiqueta={textos.campoNombre}
                  valor={borrador.nombre}
                  alCambiar={(nombre) => cambiar({ nombre })}
                  maximo={80}
                />
                <CampoArea
                  etiqueta="Descripción (sale en Google y al compartir)"
                  valor={borrador.descripcion ?? ''}
                  alCambiar={(descripcion) => cambiar({ descripcion })}
                  filas={3}
                  maximo={300}
                />
                <span className="text-[11.5px] text-sitio-suave">Logo</span>
                <div className="w-28">
                  <ZonaImagen
                    url={borrador.logoUrl}
                    alCambiar={(logoUrl) => cambiar({ logoUrl })}
                    proporcion="aspect-square"
                    texto="Logo"
                    alError={setError}
                    alSubiendo={alSubiendo}
                  />
                </div>
              </Seccion>

              <Seccion titulo="Publicación" abierta>
                <Interruptor activo={borrador.publicada} alCambiar={(publicada) => cambiar({ publicada })}>
                  {borrador.publicada ? textos.publicada : textos.borrador}
                  <small className="block text-[11.5px] text-sitio-tenue">
                    {borrador.publicada
                      ? 'Cualquiera puede verla en tu dirección.'
                      : 'Sólo tú la ves aquí; la dirección muestra “no encontrada”.'}
                  </small>
                </Interruptor>
                <a
                  href={urlTienda(subdominio)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate font-mono text-[12px] text-sitio-azul-claro hover:underline"
                >
                  {urlTienda(subdominio).replace(/^https?:\/\//, '')}
                </a>
              </Seccion>
            </>
          )}
        </ContextoEditorLienzo.Provider>
      }
      vista={
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative grid min-h-0">
            <VistaPrevia datos={datosVista} dispositivo={dispositivo} alAccion={alAccionVista} alLienzo={alLienzo} alSoltar={alSoltar} />
            {lienzoDeLaPieza && (
              <ContextoEditorLienzo.Provider value={contextoLienzo}>
                <ModalPieza
                  bloqueId={lienzoDeLaPieza.id}
                  props={lienzoDeLaPieza.props}
                  alCambiar={(cambios) => cambiarLienzo(lienzoDeLaPieza.id, (props) => ({ ...props, ...cambios }))}
                  alError={setError}
                  alSubiendo={alSubiendo}
                />
              </ContextoEditorLienzo.Provider>
            )}
          </div>
          <PaletaLienzo
            key={lienzoAbierto ? 'piezas' : 'secciones'}
            alAgregarPieza={(tipo) => agregarPieza(tipo)}
            alAgregarSeccion={(tipo) => agregarSeccion(tipo, null)}
            alUsarDiseno={(clave) => void usarDiseno(clave)}
            conLienzo={Boolean(lienzoAbierto)}
            bloquesDelPlan={limites.bloques}
            puedeLibre={conLienzo}
          />
        </div>
      }
    />
  )
}
