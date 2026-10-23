'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { AjustesTienda, EnlaceMenu } from '@/tipos/tienda'
import { generarSlug } from '@/utilidades/formato'
import { planMinimo, type LimitesPlan } from '@/utilidades/planes'
import { vendeEnLinea } from '@/utilidades/sitio'
import { Campo, CampoColor, Candado, Interruptor, Segmentado } from '../ui/basicos'
import { useSesion } from '../SesionPanel'

interface Props {
  ajustes: AjustesTienda
  alCambiar: (cambios: Partial<AjustesTienda>) => void
  /** Categorías del catálogo: se ofrecen como atajo para el menú. */
  categorias: string[]
  limites: LimitesPlan
}

/** Cabecera de la tienda: estilo, barra de menú y botón destacado. */
export function CamposCabecera({ ajustes, alCambiar, categorias, limites }: Props) {
  const completa = limites.cabeceraCompleta && ajustes.cabecera === 'completa'
  const menu = ajustes.menu ?? []
  // Una página no tiene buscador ni carrito: su menú lleva a sus propias secciones.
  const vende = vendeEnLinea(useSesion().sesion.tienda?.tipo)

  function cambiarEnlace(indice: number, cambios: Partial<EnlaceMenu>) {
    alCambiar({
      menu: menu.map((enlace, i) => (i === indice ? { ...enlace, ...cambios } : enlace)),
    })
  }

  const sinUsar = categorias.filter((categoria) => !menu.some((enlace) => enlace.texto === categoria))

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Estilo</span>
        <Segmentado
          opciones={[
            { valor: 'simple', etiqueta: 'Simple' },
            { valor: 'completa', etiqueta: 'Completa, con barra' },
          ]}
          valor={completa ? 'completa' : 'simple'}
          alCambiar={(cabecera) => limites.cabeceraCompleta && alCambiar({ cabecera })}
          chico
        />
        {!limites.cabeceraCompleta && (
          <Candado plan={planMinimo((plan) => plan.cabeceraCompleta)}>
            Cabecera completa con barra de color, botón destacado y WhatsApp.
          </Candado>
        )}
        <span className="text-[11px] leading-relaxed text-sitio-tenue">
          {completa
            ? vende
              ? 'Logo grande, buscador al centro y una barra de color con el menú y tu WhatsApp.'
              : 'Logo grande y una barra de color con el menú, un botón destacado y tu WhatsApp.'
            : vende
              ? 'Una línea con el logo y el menú. Ideal para catálogos cortos.'
              : 'Una línea con el logo, el menú y un botón para escribirte por WhatsApp.'}
        </span>
      </div>

      <Interruptor activo={ajustes.cabeceraFija ?? false} alCambiar={(cabeceraFija) => alCambiar({ cabeceraFija })}>
        Fija arriba al bajar
        <small className="block text-[11.5px] text-sitio-tenue">
          {vende ? 'El menú y el carrito siempre a mano.' : 'El menú y el botón de WhatsApp siempre a mano.'}
        </small>
      </Interruptor>
      {!completa && (
        <Interruptor activo={ajustes.logoCentrado ?? false} alCambiar={(logoCentrado) => alCambiar({ logoCentrado })}>
          Logo al centro
          <small className="block text-[11.5px] text-sitio-tenue">Menú a la izquierda, buscador y carrito a la derecha.</small>
        </Interruptor>
      )}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Tamaño del logo</span>
        <Segmentado
          opciones={[
            { valor: 'chico', etiqueta: 'Chico' },
            { valor: 'medio', etiqueta: 'Medio' },
            { valor: 'grande', etiqueta: 'Grande' },
          ]}
          valor={ajustes.tamanoLogo ?? (completa ? 'grande' : 'medio')}
          alCambiar={(tamanoLogo) => alCambiar({ tamanoLogo })}
          chico
        />
      </div>

      {!vende ? null : limites.buscador ? (
        <Interruptor activo={ajustes.buscador ?? completa} alCambiar={(buscador) => alCambiar({ buscador })}>
          Buscador de productos
        </Interruptor>
      ) : (
        <Candado plan={planMinimo((plan) => plan.buscador)}>Buscador de productos.</Candado>
      )}

      {completa && (
        <CampoColor
          etiqueta="Color de la barra"
          valor={ajustes.colorBarra ?? '#111111'}
          alCambiar={(colorBarra) => alCambiar({ colorBarra })}
        />
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[11.5px] text-sitio-suave">
          Menú{' '}
          <small className="text-sitio-tenue">
            (hasta {limites.enlacesMenu} enlaces en tu plan {limites.nombre})
          </small>
        </span>
        {menu.slice(0, limites.enlacesMenu).map((enlace, indice) => (
          <div key={indice} className="grid grid-cols-[1fr_1fr_auto] items-end gap-1.5">
            <Campo
              etiqueta="Texto"
              valor={enlace.texto}
              alCambiar={(texto) => cambiarEnlace(indice, { texto })}
              maximo={40}
            />
            <Campo
              etiqueta="Lleva a"
              valor={enlace.enlace}
              alCambiar={(destino) => cambiarEnlace(indice, { enlace: destino })}
              marcador={vende ? '/categoria/…' : '#servicios'}
            />
            <button
              type="button"
              onClick={() => alCambiar({ menu: menu.filter((_, i) => i !== indice) })}
              aria-label="Quitar enlace"
              className="mb-[3px] grid h-8 w-8 place-items-center rounded-md text-sitio-tenue transition-colors hover:bg-white/10 hover:text-red-300"
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {menu.length < limites.enlacesMenu && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                alCambiar({
                  menu: [...menu, vende ? { texto: 'Productos', enlace: '/buscar' } : { texto: 'Contacto', enlace: '#contacto' }],
                })
              }
              className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-sitio-borde px-2.5 text-[11.5px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
            >
              <Plus aria-hidden="true" className="h-3 w-3" />
              Enlace
            </button>
            {sinUsar.slice(0, 6).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() =>
                  alCambiar({
                    menu: [
                      ...menu,
                      {
                        texto: categoria,
                        enlace: `/categoria/${generarSlug(categoria)}`,
                      },
                    ],
                  })
                }
                className="inline-flex h-7 items-center gap-1 rounded-full border border-sitio-borde px-2.5 text-[11.5px] text-sitio-suave transition-colors hover:border-white/30 hover:text-white"
              >
                <Plus aria-hidden="true" className="h-3 w-3" />
                {categoria}
              </button>
            ))}
          </div>
        )}
      </div>

      {completa && (
        <div className="grid grid-cols-2 gap-2.5">
          <Campo
            etiqueta="Botón destacado"
            valor={ajustes.botonDestacado?.texto ?? ''}
            alCambiar={(texto) =>
              alCambiar({
                botonDestacado: texto
                  ? {
                      texto,
                      enlace: ajustes.botonDestacado?.enlace ?? (vende ? '/buscar' : '#contacto'),
                    }
                  : undefined,
              })
            }
            marcador={vende ? 'Tienda en línea' : 'Agendar cita'}
            maximo={40}
          />
          <Campo
            etiqueta="Lleva a"
            valor={ajustes.botonDestacado?.enlace ?? ''}
            alCambiar={(enlace) =>
              ajustes.botonDestacado &&
              alCambiar({
                botonDestacado: { ...ajustes.botonDestacado, enlace },
              })
            }
            marcador={vende ? '/buscar' : '#contacto'}
          />
        </div>
      )}
    </>
  )
}

/** WhatsApp, dirección, horario y redes: los usan la cabecera, el pie y la ficha. */
export function CamposContacto({ ajustes, alCambiar, limites }: Omit<Props, 'categorias'>) {
  const vende = vendeEnLinea(useSesion().sesion.tienda?.tipo)
  return (
    <>
      <Campo
        etiqueta="WhatsApp"
        valor={ajustes.whatsapp ?? ''}
        alCambiar={(whatsapp) => alCambiar({ whatsapp })}
        marcador="300 123 4567"
        maximo={20}
        ayuda={
          vende
            ? 'Activa el botón “Pedir por WhatsApp” en cada producto.'
            : 'Lo usan los botones de agendar, el horario y la cabecera.'
        }
      />
      {ajustes.whatsapp && !limites.whatsappFlotante && (
        <Candado plan={planMinimo((plan) => plan.whatsappFlotante)}>Botón flotante de WhatsApp.</Candado>
      )}
      {ajustes.whatsapp && limites.whatsappFlotante && (
        <Interruptor
          activo={ajustes.whatsappFlotante ?? false}
          alCambiar={(whatsappFlotante) => alCambiar({ whatsappFlotante })}
        >
          Botón flotante de WhatsApp
        </Interruptor>
      )}
      {!limites.pieColumnas && (
        <Candado plan={planMinimo((plan) => plan.pieColumnas)}>
          Pie en columnas con dirección, correo y horario.
        </Candado>
      )}
      <fieldset
        disabled={!limites.pieColumnas}
        className="flex flex-col gap-3.5 disabled:pointer-events-none disabled:opacity-40"
      >
        <Campo
          etiqueta="Dirección"
          valor={ajustes.direccion ?? ''}
          alCambiar={(direccion) => alCambiar({ direccion })}
          marcador="Cra 30 # 40-12, Villavicencio"
          maximo={160}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Campo
            etiqueta="Correo"
            tipo="email"
            valor={ajustes.correo ?? ''}
            alCambiar={(correo) => alCambiar({ correo })}
            marcador="hola@tutienda.co"
            maximo={120}
          />
          <Campo
            etiqueta="Horario"
            valor={ajustes.horario ?? ''}
            alCambiar={(horario) => alCambiar({ horario })}
            marcador="Lun a sáb, 8 a 6"
            maximo={120}
          />
        </div>
      </fieldset>
      <div className="grid grid-cols-3 gap-2">
        <Campo
          etiqueta="Instagram"
          valor={ajustes.instagram ?? ''}
          alCambiar={(instagram) => alCambiar({ instagram })}
          marcador="@tienda"
          maximo={60}
        />
        <Campo
          etiqueta="Facebook"
          valor={ajustes.facebook ?? ''}
          alCambiar={(facebook) => alCambiar({ facebook })}
          marcador="tienda"
          maximo={120}
        />
        <Campo
          etiqueta="TikTok"
          valor={ajustes.tiktok ?? ''}
          alCambiar={(tiktok) => alCambiar({ tiktok })}
          marcador="@tienda"
          maximo={60}
        />
      </div>
      {limites.pieColumnas && (
        <p className="text-[11.5px] leading-relaxed text-sitio-tenue">
          Con dirección, correo u horario, el pie de {vende ? 'la tienda' : 'la página'} pasa a columnas con contacto{vende ? ', categorías' : ''} y redes.
        </p>
      )}
    </>
  )
}
