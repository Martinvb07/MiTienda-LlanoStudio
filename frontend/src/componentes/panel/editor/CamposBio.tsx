'use client'

import type { BloqueEnlaces, BloquePerfil, EnlaceBio } from '@/tipos/bloques'
import type { LimitesPlan } from '@/utilidades/planes'
import { Campo, CampoArea, Interruptor, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'
import { ListaEditable, SelectorIcono } from './CamposBloque'

/*
 * Campos de los enlaces para tu bio: el perfil y los botones. Viven aparte de
 * CamposBloque, como los de la página de un negocio.
 */

interface Base {
  alCambiar: (cambios: Record<string, unknown>) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
}

const nuevoId = () => Math.random().toString(36).slice(2, 10)

export function CamposPerfil({ bloque, alCambiar, alError, alSubiendo }: Base & { bloque: BloquePerfil }) {
  const { props } = bloque
  return (
    <>
      <Campo
        etiqueta="Nombre"
        valor={props.nombre ?? ''}
        alCambiar={(nombre) => alCambiar({ nombre })}
        marcador="Vacío = el nombre de tu sitio"
        maximo={60}
      />
      <CampoArea etiqueta="Bio" valor={props.bio ?? ''} alCambiar={(bio) => alCambiar({ bio })} filas={3} maximo={160} />
      <span className="text-[11.5px] text-sitio-suave">
        Foto <small className="text-sitio-tenue">(vacía = tu logo o tus iniciales)</small>
      </span>
      <ZonaImagen
        url={props.fotoUrl}
        alCambiar={(fotoUrl) => alCambiar({ fotoUrl: fotoUrl ?? undefined })}
        proporcion="aspect-square"
        texto="Arrastra tu foto aquí"
        alError={alError}
        alSubiendo={alSubiendo}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Forma de la foto</span>
        <Segmentado
          opciones={[
            { valor: 'circulo', etiqueta: 'Círculo' },
            { valor: 'redondeada', etiqueta: 'Redondeada' },
          ]}
          valor={props.forma ?? 'circulo'}
          alCambiar={(forma) => alCambiar({ forma })}
          chico
        />
      </div>
      <Interruptor activo={props.mostrarRedes ?? true} alCambiar={(mostrarRedes) => alCambiar({ mostrarRedes })}>
        Mostrar mis redes debajo de la bio
      </Interruptor>
      <p className="text-[11.5px] leading-relaxed text-sitio-tenue">Las redes salen de Ajustes, en “Contacto y redes”.</p>
    </>
  )
}

export function CamposEnlaces({ bloque, alCambiar, limites }: Base & { bloque: BloqueEnlaces }) {
  const { props } = bloque
  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={60} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Botones</span>
        <Segmentado
          opciones={[
            { valor: 'relleno', etiqueta: 'Relleno' },
            { valor: 'contorno', etiqueta: 'Borde' },
            { valor: 'suave', etiqueta: 'Suave' },
          ]}
          valor={props.estilo ?? 'relleno'}
          alCambiar={(estilo) => alCambiar({ estilo })}
          chico
        />
      </div>
      <ListaEditable
        elementos={props.items}
        alCambiar={(items) => alCambiar({ items })}
        crear={(): EnlaceBio => ({ id: nuevoId(), texto: 'Nuevo enlace', url: '', icono: 'enlace' })}
        maximo={limites.enlacesBio}
        textoAgregar={`Agregar enlace (hasta ${limites.enlacesBio} en tu plan)`}
        titulo={(enlace, indice) => enlace.texto || `Enlace ${indice + 1}`}
      >
        {(enlace, cambiar) => (
          <>
            <Campo etiqueta="Texto del botón" valor={enlace.texto} alCambiar={(texto) => cambiar({ texto })} maximo={60} />
            <Campo
              etiqueta="A dónde lleva"
              valor={enlace.url}
              alCambiar={(url) => cambiar({ url })}
              marcador="https://…, @usuario, número o correo"
              ayuda="Vacío en WhatsApp, Instagram, TikTok, Facebook o correo: usa el de “Contacto y redes”."
            />
            <Campo
              etiqueta="Línea pequeña (opcional)"
              valor={enlace.descripcion ?? ''}
              alCambiar={(descripcion) => cambiar({ descripcion: descripcion || undefined })}
              maximo={80}
            />
            <SelectorIcono valor={enlace.icono} alCambiar={(icono) => cambiar({ icono })} />
            <Interruptor activo={enlace.destacado ?? false} alCambiar={(destacado) => cambiar({ destacado })}>
              Destacar con un brillo
            </Interruptor>
          </>
        )}
      </ListaEditable>
    </>
  )
}
