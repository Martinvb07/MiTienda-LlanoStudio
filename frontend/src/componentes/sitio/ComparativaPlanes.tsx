'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Minus, Plus } from 'lucide-react'
import { Contenedor, Rotulo } from './Contenedor'
import { Revelar } from './Revelar'
import { ORDEN_PLANES, PLANES, experienciaIncluye, type LimitesPlan } from '@/utilidades/planes'

type Valor = boolean | number | string | null

interface Fila {
  etiqueta: string
  valor: (limites: LimitesPlan) => Valor
}

/** Sale de la misma tabla de límites que aplica el editor: no se desincroniza. */
const GRUPOS: { titulo: string; filas: Fila[] }[] = [
  {
    titulo: 'Catálogo',
    filas: [
      { etiqueta: 'Productos', valor: (l) => l.productos ?? 'Ilimitados' },
      { etiqueta: 'Fotos por producto', valor: (l) => l.fotosPorProducto },
      { etiqueta: 'Pedir por WhatsApp en cada producto', valor: () => true },
      { etiqueta: 'Variantes (talla, color…) por producto', valor: (l) => (l.opcionesVariantes ? `${l.opcionesVariantes} ${l.opcionesVariantes === 1 ? 'opción' : 'opciones'}` : false) },
      { etiqueta: 'Acciones en grupo', valor: (l) => l.accionesLote },
      { etiqueta: 'Importar productos desde Excel', valor: (l) => l.importarProductos },
    ],
  },
  {
    titulo: 'Ventas',
    filas: [
      { etiqueta: 'Carrito, pedidos y pago contra entrega', valor: () => true },
      { etiqueta: 'Pagos en línea con Wompi, ePayco o Bold', valor: () => true },
      { etiqueta: 'Terminar la compra por WhatsApp', valor: () => true },
      { etiqueta: 'Agregar en las tarjetas y aviso con foto', valor: (l) => experienciaIncluye(l.experienciaCompra, 'avanzada') },
      { etiqueta: 'Foto que vuela a la bolsa y barra fija', valor: (l) => experienciaIncluye(l.experienciaCompra, 'completa') },
      { etiqueta: 'Cupones de descuento activos', valor: (l) => (l.cupones === null ? 'Ilimitados' : l.cupones || false) },
      { etiqueta: 'Exportar pedidos a Excel', valor: (l) => l.exportarPedidos },
      { etiqueta: 'Estadísticas de ventas y visitas', valor: (l) => (l.diasMetricas >= 365 ? '1 año' : `${l.diasMetricas} días`) },
      { etiqueta: 'Más vistos, más vendidos y conversión', valor: (l) => l.metricasAvanzadas },
    ],
  },
  {
    titulo: 'Cuenta',
    filas: [
      { etiqueta: 'Personas en el panel', valor: (l) => l.usuarios },
      { etiqueta: 'Dominio propio con HTTPS', valor: (l) => l.dominioPropio },
    ],
  },
  {
    titulo: 'Diseño',
    filas: [
      { etiqueta: 'Secciones en la página', valor: (l) => l.secciones },
      { etiqueta: 'Colores, letra y esquinas a tu medida', valor: (l) => l.temaLibre },
      { etiqueta: 'Carrusel de banners', valor: (l) => (l.bannersCarrusel ? `Hasta ${l.bannersCarrusel}` : false) },
      { etiqueta: 'Categorías con foto', valor: (l) => (l.itemsCategorias ? `Hasta ${l.itemsCategorias}` : false) },
      { etiqueta: 'Tarjetas de producto, 5 columnas y filtro', valor: (l) => l.grillaAvanzada },
      { etiqueta: 'Tipos de sección disponibles', valor: (l) => l.bloques.length },
      { etiqueta: 'Columnas, galería, preguntas y banners', valor: (l) => l.bloques.includes('galeria') },
      { etiqueta: 'Testimonios, video, logos y mapa', valor: (l) => l.bloques.includes('video') },
      { etiqueta: 'Lienzo libre', valor: (l) => l.bloques.includes('lienzo') },
      { etiqueta: 'Cuenta regresiva para ofertas', valor: (l) => l.bloques.includes('cuenta-regresiva') },
    ],
  },
  {
    titulo: 'Estilo de cada sección',
    filas: [
      { etiqueta: 'Fondo, colores, espaciado y enlace desde el menú', valor: (l) => l.estiloSeccion !== 'ninguno' },
      {
        etiqueta: 'Animaciones, ancho, forma de tarjeta y por dispositivo',
        valor: (l) => l.estiloSeccion === 'avanzado' || l.estiloSeccion === 'completo',
      },
      { etiqueta: 'Imagen de fondo en cualquier sección', valor: (l) => l.estiloSeccion === 'completo' },
      { etiqueta: 'Elementos por sección (fotos, testimonios…)', valor: (l) => l.itemsLista || false },
    ],
  },
  {
    titulo: 'Cabecera y pie',
    filas: [
      { etiqueta: 'Enlaces en el menú', valor: (l) => l.enlacesMenu },
      { etiqueta: 'Cabecera completa con barra de color', valor: (l) => l.cabeceraCompleta },
      { etiqueta: 'Buscador de productos', valor: (l) => l.buscador },
      { etiqueta: 'Botón flotante de WhatsApp', valor: (l) => l.whatsappFlotante },
      { etiqueta: 'Pie con contacto, horario y categorías', valor: (l) => l.pieColumnas },
      { etiqueta: 'Sin “Hecho con Mi Sitio”', valor: (l) => l.quitarMarca },
    ],
  },
]

function Celda({ valor }: { valor: Valor }): ReactNode {
  if (valor === true) return <Check aria-label="Incluido" className="mx-auto h-4 w-4 text-white" />
  if (valor === false || valor === null) return <Minus aria-label="No incluido" className="mx-auto h-4 w-4 text-white/20" />
  return <span className="text-white/80">{valor}</span>
}

const COLUMNAS = 'grid grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] items-center sm:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]'

/**
 * Tabla comparativa por grupos que se despliegan, como las preguntas
 * frecuentes: el primero abierto y los demás a pedido.
 */
export function ComparativaPlanes() {
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set([GRUPOS[0]!.titulo]))

  function alternar(titulo: string) {
    setAbiertos((actuales) => {
      const nuevos = new Set(actuales)
      if (nuevos.has(titulo)) nuevos.delete(titulo)
      else nuevos.add(titulo)
      return nuevos
    })
  }

  return (
    <section className="pb-[110px] md:pb-[150px]">
      <Contenedor>
        <Revelar>
          <Rotulo>Comparar</Rotulo>
          <h2 className="titulo-2 mt-4">Qué personalizas en cada plan</h2>
        </Revelar>

        <Revelar className="mt-12">
          <div className="text-[12px] sm:text-[13.5px]" role="table" aria-label="Comparación de planes">
            <div className={`${COLUMNAS} border-b border-white/15`} role="row">
              <span role="columnheader" />
              {ORDEN_PLANES.map((plan) => (
                <span key={plan} role="columnheader" className="truncate py-4 text-center text-[11.5px] tracking-[-0.01em] sm:text-[15px]">
                  {PLANES[plan].nombre}
                </span>
              ))}
            </div>

            {GRUPOS.map((grupo) => {
              const abierto = abiertos.has(grupo.titulo)
              return (
                <div key={grupo.titulo} className="border-b border-white/12" role="rowgroup">
                  <button
                    type="button"
                    aria-expanded={abierto}
                    onClick={() => alternar(grupo.titulo)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="text-[11px] tracking-[0.14em] text-white/50 uppercase transition-colors duration-500 group-hover:text-white">
                      {grupo.titulo}
                      <span className="ml-2 text-white/30 normal-case">· {grupo.filas.length}</span>
                    </span>
                    <Plus
                      aria-hidden="true"
                      strokeWidth={1.4}
                      className={`h-5 w-5 shrink-0 text-white/50 transition-transform duration-700 ease-salida ${abierto ? 'rotate-45 text-white' : ''}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {abierto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4">
                          {grupo.filas.map((fila) => (
                            <div key={fila.etiqueta} className={`${COLUMNAS} border-t border-white/10`} role="row">
                              <span role="rowheader" className="py-3.5 pr-3 text-white/70 sm:pr-4">
                                {fila.etiqueta}
                              </span>
                              {ORDEN_PLANES.map((plan) => (
                                <span key={plan} role="cell" className="py-3.5 text-center">
                                  <Celda valor={fila.valor(PLANES[plan])} />
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Revelar>
      </Contenedor>
    </section>
  )
}
