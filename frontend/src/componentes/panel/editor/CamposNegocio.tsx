'use client'

import type { BloqueEquipo, BloqueHorario, BloqueServicios, DiaHorario, MiembroEquipo, ServicioNegocio } from '@/tipos/bloques'
import type { LimitesPlan } from '@/utilidades/planes'
import { Campo, CampoArea, Segmentado } from '../ui/basicos'
import { ZonaImagen } from '../ui/imagenes'
import { ListaEditable } from './CamposBloque'

/*
 * Campos de las secciones de la página de un negocio: servicios, equipo y
 * horario. Viven aparte de CamposBloque para no engordarlo.
 */

interface Base {
  alCambiar: (cambios: Record<string, unknown>) => void
  alError: (mensaje: string) => void
  alSubiendo: (delta: number) => void
  limites: LimitesPlan
}

const nuevoId = () => Math.random().toString(36).slice(2, 10)

/** Tope fijo: los servicios y el horario van desde Gratis, sin límite por plan. */
const MAX_SERVICIOS = 24
const MAX_DIAS = 7

export function CamposServicios({ bloque, alCambiar, alError, alSubiendo }: Base & { bloque: BloqueServicios }) {
  const { props } = bloque
  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={80} />
      <Campo etiqueta="Bajada" valor={props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} maximo={160} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Cómo se ven</span>
        <Segmentado
          opciones={[
            { valor: 'tarjetas', etiqueta: 'Tarjetas' },
            { valor: 'lista', etiqueta: 'Lista, como una carta' },
          ]}
          valor={props.disposicion ?? 'tarjetas'}
          alCambiar={(disposicion) => alCambiar({ disposicion })}
          chico
        />
      </div>
      <Campo
        etiqueta="Botón de cada servicio"
        valor={props.textoBoton ?? ''}
        alCambiar={(textoBoton) => alCambiar({ textoBoton })}
        marcador="Vacío = sin botón"
        maximo={30}
        ayuda="Abre WhatsApp con el nombre del servicio. Usa el número de “Contacto y redes”."
      />
      <ListaEditable
        elementos={props.items}
        alCambiar={(items) => alCambiar({ items })}
        crear={(): ServicioNegocio => ({ id: nuevoId(), nombre: 'Nuevo servicio' })}
        maximo={MAX_SERVICIOS}
        textoAgregar="Agregar servicio"
        titulo={(servicio, indice) => servicio.nombre || `Servicio ${indice + 1}`}
      >
        {(servicio, cambiar) => (
          <>
            <Campo etiqueta="Nombre" valor={servicio.nombre} alCambiar={(nombre) => cambiar({ nombre })} maximo={80} />
            <CampoArea
              etiqueta="Descripción"
              valor={servicio.descripcion ?? ''}
              alCambiar={(descripcion) => cambiar({ descripcion })}
              filas={2}
              maximo={240}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <Campo etiqueta="Precio" valor={servicio.precio ?? ''} alCambiar={(precio) => cambiar({ precio })} marcador="Desde $80.000" maximo={40} />
              <Campo etiqueta="Duración" valor={servicio.duracion ?? ''} alCambiar={(duracion) => cambiar({ duracion })} marcador="45 min" maximo={30} />
            </div>
            <ZonaImagen
              url={servicio.imagenUrl}
              alCambiar={(imagenUrl) => cambiar({ imagenUrl: imagenUrl ?? undefined })}
              proporcion="aspect-[4/3]"
              texto="Foto (opcional)"
              alError={alError}
              alSubiendo={alSubiendo}
            />
          </>
        )}
      </ListaEditable>
    </>
  )
}

export function CamposEquipo({ bloque, alCambiar, alError, alSubiendo, limites }: Base & { bloque: BloqueEquipo }) {
  const { props } = bloque
  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={80} />
      <Campo etiqueta="Bajada" valor={props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} maximo={160} />
      <ListaEditable
        elementos={props.items}
        alCambiar={(items) => alCambiar({ items })}
        crear={(): MiembroEquipo => ({ id: nuevoId(), nombre: 'Nombre y apellido', cargo: 'Cargo' })}
        maximo={limites.itemsLista}
        textoAgregar={`Agregar persona (hasta ${limites.itemsLista})`}
        titulo={(persona, indice) => persona.nombre || `Persona ${indice + 1}`}
      >
        {(persona, cambiar) => (
          <div className="grid grid-cols-[72px_1fr] items-start gap-2.5">
            <ZonaImagen
              url={persona.fotoUrl}
              alCambiar={(fotoUrl) => cambiar({ fotoUrl: fotoUrl ?? undefined })}
              proporcion="aspect-square"
              texto="Foto"
              alError={alError}
              alSubiendo={alSubiendo}
            />
            <div className="flex flex-col gap-2.5">
              <Campo etiqueta="Nombre" valor={persona.nombre} alCambiar={(nombre) => cambiar({ nombre })} maximo={60} />
              <Campo etiqueta="Cargo" valor={persona.cargo ?? ''} alCambiar={(cargo) => cambiar({ cargo })} marcador="Odontóloga" maximo={60} />
              <CampoArea etiqueta="Una línea (opcional)" valor={persona.texto ?? ''} alCambiar={(texto) => cambiar({ texto })} filas={2} maximo={200} />
            </div>
          </div>
        )}
      </ListaEditable>
    </>
  )
}

export function CamposHorario({ bloque, alCambiar, limites }: Base & { bloque: BloqueHorario }) {
  const { props } = bloque
  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={80} />
      <ListaEditable
        elementos={props.dias}
        alCambiar={(dias) => alCambiar({ dias })}
        crear={(): DiaHorario => ({ id: nuevoId(), dia: 'Domingos', horas: 'Cerrado' })}
        maximo={MAX_DIAS}
        textoAgregar="Agregar fila"
        titulo={(fila, indice) => fila.dia || `Fila ${indice + 1}`}
      >
        {(fila, cambiar) => (
          <div className="grid grid-cols-2 gap-2.5">
            <Campo etiqueta="Días" valor={fila.dia} alCambiar={(dia) => cambiar({ dia })} marcador="Lunes a viernes" maximo={40} />
            <Campo etiqueta="Horas" valor={fila.horas} alCambiar={(horas) => cambiar({ horas })} marcador="8 a. m. a 6 p. m." maximo={40} />
          </div>
        )}
      </ListaEditable>
      <Campo etiqueta="Nota (opcional)" valor={props.nota ?? ''} alCambiar={(nota) => alCambiar({ nota })} marcador="Festivos cerrado" maximo={120} />
      <Campo
        etiqueta="Dirección"
        valor={props.direccion ?? ''}
        alCambiar={(direccion) => alCambiar({ direccion })}
        marcador="Calle 38 # 30A-15, Villavicencio"
        maximo={160}
        ayuda={limites.pieColumnas ? 'Vacía = la de “Contacto y redes”.' : 'Sale con el botón “Cómo llegar”.'}
      />
      <Campo
        etiqueta="Teléfono para llamar"
        valor={props.telefono ?? ''}
        alCambiar={(telefono) => alCambiar({ telefono })}
        marcador="300 123 4567"
        maximo={20}
        ayuda="Vacío = tu WhatsApp de “Contacto y redes”."
      />
    </>
  )
}
