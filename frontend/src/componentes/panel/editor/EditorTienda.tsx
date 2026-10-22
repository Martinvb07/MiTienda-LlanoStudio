'use client'

import { ArrowUpRight, Redo2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { AccionSeccion } from '@/app/panel/vista-previa/mensajes'
import { guardarTienda, listarProductos, type DatosTienda } from '@/servicios/panel'
import { duplicarBloque } from '@/tipos/bloques'
import type { AjustesTienda, Producto, TemaTienda, Tienda } from '@/tipos/tienda'
import { urlTienda } from '@/utilidades/dominios'
import { ESTILOS_PREDEFINIDOS, FUENTES_TITULOS, RADIOS } from '@/utilidades/tema'
import { cn } from '@/utilidades/clases'
import { PLANES, limitesDe, planIncluye, planMinimo } from '@/utilidades/planes'
import { PLANTILLAS_TIENDA, type PlantillaTienda } from '@/utilidades/plantillas'
import { useSesion } from '../SesionPanel'
import { Aviso, Campo, CampoArea, CampoColor, Candado, Interruptor, PlanRequerido, Seccion, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'
import { CamposCabecera, CamposContacto } from './CamposAjustes'
import { ListaBloques } from './ListaBloques'
import { MarcoEditor, useAtajosEditor } from './MarcoEditor'
import { VistaPrevia, type Dispositivo } from './VistaPrevia'

const TEMA_BASE = ESTILOS_PREDEFINIDOS[0]!.tema

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
  const [productos, setProductos] = useState<Producto[]>([])
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoReciente, setGuardadoReciente] = useState(false)
  const [subiendo, setSubiendo] = useState(0)
  const plan = useSesion().sesion.tenant.plan
  const limites = limitesDe(plan)

  // Aplica la plantilla que eligió en el sitio, si su plan la incluye. Queda
  // como cambio sin guardar: decide él si la guarda.
  useEffect(() => {
    const elegida = PLANTILLAS_TIENDA.find((opcion) => opcion.clave === plantillaInicial)
    if (!elegida || !planIncluye(plan, elegida.plan)) return
    setBorrador((actual) => ({
      ...actual,
      tema: { ...elegida.tema },
      plantilla: elegida.estilo,
      configuracionBloques: elegida.bloques(actual.nombre || 'Mi tienda'),
    }))
  }, [plantillaInicial, plan])

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
      if (accion === 'elegir') {
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
          if (!confirm('¿Eliminar esta sección? Puedes deshacerlo con Ctrl+Z.')) return
          copia.splice(indice, 1)
          break
      }
      cambiar({ configuracionBloques: copia })
    },
    [borrador.configuracionBloques, cambiar, limites.secciones],
  )
  const cambiarTema = (cambios: Partial<TemaTienda>) => cambiar({ tema: { ...borrador.tema, ...cambios } })
  const cambiarAjustes = (cambios: Partial<AjustesTienda>) => cambiar({ ajustes: { ...borrador.ajustes, ...cambios } })
  const categorias = useMemo(
    () => [...new Set(productos.map((producto) => producto.categoria?.trim()).filter((c): c is string => Boolean(c)))],
    [productos],
  )
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

  function aplicarPlantilla(plantilla: PlantillaTienda) {
    if (!confirm(`¿Usar la plantilla "${plantilla.nombre}"? Reemplaza las secciones y el estilo de tu página. Tus productos no cambian.`)) {
      return
    }
    cambiar({
      tema: { ...plantilla.tema },
      plantilla: plantilla.estilo,
      configuracionBloques: plantilla.bloques(borrador.nombre || 'Mi tienda'),
    })
    setAbierto(null)
  }

  function cerrar() {
    if (sucio && !confirm('Tienes cambios sin guardar. ¿Salir sin guardar?')) return
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
      },
      productos,
      vista: 'tienda' as const,
      enfocar: abierto,
      editable: true,
    }),
    [borrador, productos, abierto, tienda.moneda, plan],
  )

  const estiloActivo = ESTILOS_PREDEFINIDOS.find(
    (estilo) => JSON.stringify(estilo.tema) === JSON.stringify({ ...TEMA_BASE, ...borrador.tema }),
  )?.clave

  return (
    <MarcoEditor
      volver="Panel"
      alCerrar={cerrar}
      titulo={borrador.nombre || 'Mi tienda'}
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
          Ver tienda <ArrowUpRight aria-hidden="true" className="inline h-3 w-3 align-[-1px]" />
        </a>
        </>
      }
      lateral={
        <>
          <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>

          <Seccion titulo="Plantillas">
            <p className="text-[12px] leading-relaxed text-sitio-tenue">
              Un diseño completo de un clic: estilo y secciones con textos de ejemplo para que solo cambies lo tuyo.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLANTILLAS_TIENDA.map((plantilla) => {
                const incluida = planIncluye(plan, plantilla.plan)
                return (
                  <button
                    key={plantilla.clave}
                    type="button"
                    disabled={!incluida}
                    onClick={() => aplicarPlantilla(plantilla)}
                    title={incluida ? `Usar ${plantilla.nombre}` : `Desde el plan ${PLANES[plantilla.plan].nombre}`}
                    className="group flex flex-col gap-2 rounded-[10px] border border-sitio-borde bg-[#121214] p-2 text-left transition-colors enabled:hover:border-white/30 disabled:cursor-not-allowed"
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

          <Seccion titulo="Secciones de la página" abierta>
            <ListaBloques
              bloques={borrador.configuracionBloques}
              alCambiar={(configuracionBloques) => cambiar({ configuracionBloques })}
              abierto={abierto}
              alAbrir={setAbierto}
              alError={setError}
              alSubiendo={alSubiendo}
              limites={limites}
              categorias={categorias}
            />
          </Seccion>

          <Seccion titulo="Cabecera y menú">
            <CamposCabecera ajustes={borrador.ajustes} alCambiar={cambiarAjustes} categorias={categorias} limites={limites} />
          </Seccion>

          <Seccion titulo="Contacto y redes">
            <CamposContacto ajustes={borrador.ajustes} alCambiar={cambiarAjustes} limites={limites} />
          </Seccion>

          <Seccion titulo="Estilo">
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
              <span className="text-[11.5px] text-sitio-suave">Letra de los títulos</span>
              <Segmentado
                opciones={Object.entries(FUENTES_TITULOS).map(([valor, fuente]) => ({
                  valor: valor as keyof typeof FUENTES_TITULOS,
                  etiqueta: fuente.etiqueta,
                }))}
                valor={borrador.tema.fuenteTitulos ?? 'moderna'}
                alCambiar={(fuenteTitulos) => cambiarTema({ fuenteTitulos })}
                chico
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

          <Seccion titulo="Identidad">
            <Campo
              etiqueta="Nombre de la tienda"
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
              {borrador.publicada ? 'Tienda publicada' : 'Tienda en borrador'}
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
      }
      vista={<VistaPrevia datos={datosVista} dispositivo={dispositivo} alAccion={alAccionVista} />}
    />
  )
}
