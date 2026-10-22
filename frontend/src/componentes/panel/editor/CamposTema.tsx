'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import type { EsquemaColor, TemaTienda } from '@/tipos/tienda'
import { FUENTES, GRUPOS_FUENTES, urlFuentes } from '@/utilidades/fuentes'
import { nivelIncluye, planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { esquemasIniciales } from '@/utilidades/tema'
import { cn } from '@/utilidades/clases'
import { CURVA, Campo, CampoColor, Candado, Interruptor, Seccion, Segmentado } from '../ui/basicos'

interface Props {
  tema: TemaTienda
  alCambiar: (cambios: Partial<TemaTienda>) => void
  limites: LimitesPlan
}

/** Todas las familias en una sola hoja, para ver cada opción con su letra. */
const URL_TODAS = urlFuentes(...Object.keys(FUENTES))

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11.5px] text-sitio-suave">{titulo}</span>
      {children}
    </div>
  )
}

/** Desplegable de tipografías: cada opción se muestra escrita en su letra. */
function SelectorFuente({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: string; alCambiar: (valor: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const actual = FUENTES[valor] ?? FUENTES.moderna!

  useEffect(() => {
    if (!abierto) return
    const alClic = (evento: PointerEvent) => {
      if (ref.current && !ref.current.contains(evento.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alClic)
    return () => document.removeEventListener('pointerdown', alClic)
  }, [abierto])

  return (
    <Grupo titulo={etiqueta}>
      <div ref={ref} className="relative">
        {URL_TODAS && <link rel="stylesheet" href={URL_TODAS} precedence="default" />}
        <button
          type="button"
          onClick={() => setAbierto((estado) => !estado)}
          aria-expanded={abierto}
          className="flex w-full items-center justify-between rounded-lg border border-sitio-borde bg-[#121214] px-3 py-2.5 text-left transition-colors hover:border-white/25"
        >
          <span className="text-[17px] leading-none" style={{ fontFamily: actual.pila }}>
            {actual.nombre}
          </span>
          <ChevronDown aria-hidden="true" className={cn('h-4 w-4 text-sitio-tenue transition-transform', abierto && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: CURVA }}
              className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-80 overflow-y-auto rounded-[10px] border border-white/12 bg-[#141416] p-1 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)]"
            >
              {GRUPOS_FUENTES.map((grupo) => (
                <div key={grupo}>
                  <p className="px-2.5 pt-2.5 pb-1 text-[10px] tracking-[0.14em] text-sitio-tenue uppercase">{grupo}</p>
                  {Object.entries(FUENTES)
                    .filter(([, fuente]) => fuente.grupo === grupo)
                    .map(([clave, fuente]) => (
                      <button
                        key={clave}
                        type="button"
                        onClick={() => {
                          alCambiar(clave)
                          setAbierto(false)
                        }}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[16px] transition-colors hover:bg-white/[0.07]',
                          clave === valor ? 'text-white' : 'text-white/75',
                        )}
                        style={{ fontFamily: fuente.pila }}
                      >
                        {fuente.nombre}
                        {clave === valor && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Grupo>
  )
}

function EditorEsquemas({ tema, alCambiar }: Props) {
  const esquemas = tema.esquemas ?? esquemasIniciales(tema)
  const [abierto, setAbierto] = useState<string | null>(null)

  function cambiar(id: string, cambios: Partial<EsquemaColor>) {
    alCambiar({ esquemas: esquemas.map((esquema) => (esquema.id === id ? { ...esquema, ...cambios } : esquema)) })
  }

  return (
    <div className="flex flex-col gap-2">
      {esquemas.map((esquema) => (
        <div key={esquema.id} className="rounded-[10px] border border-sitio-borde bg-[#121214]">
          <button
            type="button"
            onClick={() => setAbierto(abierto === esquema.id ? null : esquema.id)}
            className="flex w-full items-center gap-3 p-2.5 text-left"
          >
            <span
              className="grid h-10 w-14 shrink-0 place-items-center rounded-md border border-white/10 text-[13px] font-semibold"
              style={{ background: esquema.fondo, color: esquema.texto }}
            >
              Aa
              <span className="sr-only">Muestra</span>
            </span>
            <span className="flex-1 text-[13px]">{esquema.nombre}</span>
            <span className="flex gap-1">
              {[esquema.marca, esquema.contraste].map((color, indice) => (
                <span key={indice} className="h-4 w-4 rounded-full ring-1 ring-white/15" style={{ background: color }} />
              ))}
            </span>
            <ChevronDown aria-hidden="true" className={cn('h-4 w-4 text-sitio-tenue transition-transform', abierto === esquema.id && 'rotate-180')} />
          </button>
          <AnimatePresence initial={false}>
            {abierto === esquema.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: CURVA }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 border-t border-sitio-borde p-3">
                  <Campo etiqueta="Nombre" valor={esquema.nombre} alCambiar={(nombre) => cambiar(esquema.id, { nombre })} maximo={30} />
                  <div className="grid grid-cols-2 gap-2.5">
                    <CampoColor etiqueta="Fondo" valor={esquema.fondo} alCambiar={(fondo) => cambiar(esquema.id, { fondo })} />
                    <CampoColor etiqueta="Texto" valor={esquema.texto} alCambiar={(texto) => cambiar(esquema.id, { texto })} />
                    <CampoColor etiqueta="Botones" valor={esquema.marca} alCambiar={(marca) => cambiar(esquema.id, { marca })} />
                    <CampoColor
                      etiqueta="Texto de botones"
                      valor={esquema.contraste}
                      alCambiar={(contraste) => cambiar(esquema.id, { contraste })}
                    />
                  </div>
                  {esquemas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => alCambiar({ esquemas: esquemas.filter((otro) => otro.id !== esquema.id) })}
                      className="inline-flex items-center gap-1.5 self-start text-[11.5px] text-sitio-rojo/80 hover:text-sitio-rojo"
                    >
                      <Trash2 aria-hidden="true" className="h-3 w-3" />
                      Eliminar esquema
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {esquemas.length < 8 && (
        <button
          type="button"
          onClick={() => {
            const id = `e${Date.now().toString(36)}`
            alCambiar({ esquemas: [...esquemas, { ...esquemas[0]!, id, nombre: `Esquema ${esquemas.length + 1}` }] })
            setAbierto(id)
          }}
          className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-sitio-borde text-[12px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus aria-hidden="true" className="h-3.5 w-3.5" />
          Agregar esquema
        </button>
      )}
      <p className="text-[11px] leading-relaxed text-sitio-tenue">
        Elige un esquema en la pestaña Estilo de cada sección para cambiarle fondo, texto y botones de un clic.
      </p>
    </div>
  )
}

/**
 * Configuración del tema, como la de Shopify: lo que vale para toda la tienda.
 * Colores base y estilos predefinidos siguen en EditorTienda (sección Colores).
 */
export function CamposTema({ tema, alCambiar, limites }: Props) {
  const libre = limites.temaLibre
  const candado = !libre && (
    <Candado plan={planMinimo((plan) => plan.temaLibre)}>Tipografías, botones, tarjetas y diseño a tu medida.</Candado>
  )

  return (
    <>
      <Seccion titulo="Tipografía">
        {candado}
        <fieldset disabled={!libre} className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40">
          <SelectorFuente etiqueta="Títulos" valor={tema.fuenteTitulos ?? 'moderna'} alCambiar={(fuenteTitulos) => alCambiar({ fuenteTitulos })} />
          <SelectorFuente etiqueta="Textos" valor={tema.fuenteCuerpo ?? 'moderna'} alCambiar={(fuenteCuerpo) => alCambiar({ fuenteCuerpo })} />
          <Grupo titulo="Grosor de los títulos">
            <Segmentado
              opciones={[
                { valor: 'normal', etiqueta: 'Fino' },
                { valor: 'medio', etiqueta: 'Normal' },
                { valor: 'negrita', etiqueta: 'Grueso' },
              ]}
              valor={tema.pesoTitulos ?? 'medio'}
              alCambiar={(pesoTitulos) => alCambiar({ pesoTitulos })}
              chico
            />
          </Grupo>
          <Interruptor activo={tema.titulosMayusculas ?? false} alCambiar={(titulosMayusculas) => alCambiar({ titulosMayusculas })}>
            Títulos en mayúsculas
          </Interruptor>
        </fieldset>
      </Seccion>

      <Seccion titulo="Botones">
        {candado}
        <fieldset disabled={!libre} className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40">
          <Grupo titulo="Forma">
            <Segmentado
              opciones={[
                { valor: 'recto', etiqueta: 'Recto' },
                { valor: 'suave', etiqueta: 'Como las esquinas' },
                { valor: 'pildora', etiqueta: 'Píldora' },
              ]}
              valor={tema.botonForma ?? 'suave'}
              alCambiar={(botonForma) => alCambiar({ botonForma })}
              chico
            />
          </Grupo>
          <Grupo titulo="Estilo">
            <Segmentado
              opciones={[
                { valor: 'relleno', etiqueta: 'Relleno' },
                { valor: 'contorno', etiqueta: 'Contorno' },
              ]}
              valor={tema.botonEstilo ?? 'relleno'}
              alCambiar={(botonEstilo) => alCambiar({ botonEstilo })}
              chico
            />
          </Grupo>
          <Interruptor activo={tema.botonMayusculas ?? false} alCambiar={(botonMayusculas) => alCambiar({ botonMayusculas })}>
            Texto en mayúsculas
          </Interruptor>
        </fieldset>
      </Seccion>

      <Seccion titulo="Tarjetas de producto">
        {candado}
        <fieldset disabled={!libre} className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40">
          <Grupo titulo="Forma de la foto">
            <Segmentado
              opciones={[
                { valor: 'cuadrada', etiqueta: 'Cuadrada' },
                { valor: 'vertical', etiqueta: 'Vertical' },
                { valor: 'horizontal', etiqueta: 'Horizontal' },
              ]}
              valor={tema.tarjetaProporcion ?? 'cuadrada'}
              alCambiar={(tarjetaProporcion) => alCambiar({ tarjetaProporcion })}
              chico
            />
          </Grupo>
          <Grupo titulo="Texto">
            <Segmentado
              opciones={[
                { valor: 'izquierda', etiqueta: 'A la izquierda' },
                { valor: 'centro', etiqueta: 'Centrado' },
              ]}
              valor={tema.tarjetaAlineacion ?? 'izquierda'}
              alCambiar={(tarjetaAlineacion) => alCambiar({ tarjetaAlineacion })}
              chico
            />
          </Grupo>
          <Interruptor activo={tema.tarjetaSegundaFoto ?? false} alCambiar={(tarjetaSegundaFoto) => alCambiar({ tarjetaSegundaFoto })}>
            Mostrar la segunda foto al pasar el cursor
          </Interruptor>
        </fieldset>
      </Seccion>

      <Seccion titulo="Diseño y animaciones">
        {candado}
        <fieldset disabled={!libre} className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40">
          <Grupo titulo="Ancho de la página">
            <Segmentado
              opciones={[
                { valor: 'normal', etiqueta: 'Normal' },
                { valor: 'amplio', etiqueta: 'Amplio' },
                { valor: 'completo', etiqueta: 'Toda la pantalla' },
              ]}
              valor={tema.anchoPagina ?? 'normal'}
              alCambiar={(anchoPagina) => alCambiar({ anchoPagina })}
              chico
            />
          </Grupo>
          <Interruptor activo={tema.animarSecciones ?? false} alCambiar={(animarSecciones) => alCambiar({ animarSecciones })}>
            Revelar las secciones al bajar
            <small className="block text-[11.5px] text-sitio-tenue">Cada sección aparece suave al llegar a ella.</small>
          </Interruptor>
        </fieldset>
      </Seccion>

      <Seccion titulo="Esquemas de color">
        {nivelIncluye(limites.estiloSeccion, 'avanzado') ? (
          <EditorEsquemas tema={tema} alCambiar={alCambiar} limites={limites} />
        ) : (
          <Candado plan={planMinimo((plan) => nivelIncluye(plan.estiloSeccion, 'avanzado'))}>
            Crea tus propias paletas y aplícalas a cada sección.
          </Candado>
        )}
      </Seccion>
    </>
  )
}
