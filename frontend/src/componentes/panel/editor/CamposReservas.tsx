'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { BloqueReservas, DiaReserva, ServicioReserva } from '@/tipos/bloques'
import type { LimitesPlan } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { CLASES_ENTRADA, Campo, CampoArea, Interruptor, Segmentado } from '../ui/basicos'
import { ListaEditable } from './CamposBloque'

/*
 * Campos de la sección de reservas: los servicios que se agendan, los días y
 * horas de atención y las reglas de los turnos. La API lee esto mismo para
 * calcular las horas libres, así que lo que se ve aquí es lo que se ofrece.
 */

const nuevoId = () => Math.random().toString(36).slice(2, 10)
const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
/** De lunes a domingo, como se lee una semana en Colombia. */
const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0]

const numero = (valor: string, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, Number(valor.replace(/\D/g, '')) || minimo))

export function CamposReservas({
  bloque,
  alCambiar,
  limites,
}: {
  bloque: BloqueReservas
  alCambiar: (cambios: Record<string, unknown>) => void
  limites: LimitesPlan
}) {
  const { props } = bloque

  function cambiarDia(dia: number, cambios: Partial<DiaReserva>) {
    const dias = ORDEN_DIAS.map((otro) => props.dias.find((guardado) => guardado.dia === otro) ?? { dia: otro, activo: false, desde: '08:00', hasta: '18:00' })
    alCambiar({ dias: dias.map((otro) => (otro.dia === dia ? { ...otro, ...cambios } : otro)) })
  }

  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={80} />
      <Campo etiqueta="Bajada" valor={props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} maximo={160} />

      <span className="mt-1 text-[11.5px] text-sitio-suave">Servicios que se agendan</span>
      <ListaEditable
        elementos={props.servicios}
        alCambiar={(servicios) => alCambiar({ servicios })}
        crear={(): ServicioReserva => ({ id: nuevoId(), nombre: 'Nuevo servicio', duracion: 30 })}
        maximo={24}
        textoAgregar="Agregar servicio"
        titulo={(servicio, indice) => servicio.nombre || `Servicio ${indice + 1}`}
      >
        {(servicio, cambiar) => (
          <>
            <Campo etiqueta="Nombre" valor={servicio.nombre} alCambiar={(nombre) => cambiar({ nombre })} maximo={80} />
            <div className="grid grid-cols-2 gap-2.5">
              <Campo
                etiqueta="Duración (minutos)"
                valor={servicio.duracion}
                alCambiar={(valor) => cambiar({ duracion: numero(valor, 5, 600) })}
                marcador="30"
              />
              <Campo etiqueta="Precio" valor={servicio.precio ?? ''} alCambiar={(precio) => cambiar({ precio: precio || undefined })} marcador="Opcional" maximo={40} />
            </div>
          </>
        )}
      </ListaEditable>

      <span className="mt-1 text-[11.5px] text-sitio-suave">Días y horas de atención</span>
      <div className="flex flex-col divide-y divide-sitio-borde rounded-[10px] border border-sitio-borde">
        {ORDEN_DIAS.map((numeroDia) => {
          const dia = props.dias.find((otro) => otro.dia === numeroDia) ?? { dia: numeroDia, activo: false, desde: '08:00', hasta: '18:00' }
          return (
            <div key={numeroDia} className="flex items-center gap-2 px-2.5 py-2">
              <label className="flex w-[104px] shrink-0 cursor-pointer items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={dia.activo}
                  onChange={(evento) => cambiarDia(numeroDia, { activo: evento.target.checked })}
                  className="accent-white"
                />
                <span className={dia.activo ? 'text-white' : 'text-sitio-tenue'}>{NOMBRES_DIA[numeroDia]}</span>
              </label>
              {dia.activo ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <input
                    type="time"
                    aria-label={`${NOMBRES_DIA[numeroDia]}: abre`}
                    value={dia.desde}
                    onChange={(evento) => cambiarDia(numeroDia, { desde: evento.target.value })}
                    className={cn(CLASES_ENTRADA, '!h-8 min-w-0 !px-2 text-[12px]')}
                  />
                  <span className="text-[11px] text-sitio-tenue">a</span>
                  <input
                    type="time"
                    aria-label={`${NOMBRES_DIA[numeroDia]}: cierra`}
                    value={dia.hasta}
                    onChange={(evento) => cambiarDia(numeroDia, { hasta: evento.target.value })}
                    className={cn(CLASES_ENTRADA, '!h-8 min-w-0 !px-2 text-[12px]')}
                  />
                </div>
              ) : (
                <span className="text-[11.5px] text-sitio-tenue">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] text-sitio-suave">Un turno cada</span>
        <Segmentado
          opciones={[
            { valor: '15', etiqueta: '15 min' },
            { valor: '30', etiqueta: '30 min' },
            { valor: '60', etiqueta: '1 hora' },
          ]}
          valor={String(props.intervalo) as '15' | '30' | '60'}
          alCambiar={(intervalo) => alCambiar({ intervalo: Number(intervalo) })}
          chico
        />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <Campo
          etiqueta="Citas a la vez"
          valor={props.capacidad}
          alCambiar={(valor) => alCambiar({ capacidad: numero(valor, 1, 50) })}
          ayuda="Sillas o personas"
        />
        <Campo
          etiqueta="Días adelante"
          valor={props.diasAdelante}
          alCambiar={(valor) => alCambiar({ diasAdelante: numero(valor, 1, 120) })}
          ayuda="Hasta cuándo"
        />
        <Campo
          etiqueta="Aviso mínimo"
          valor={props.anticipacion}
          alCambiar={(valor) => alCambiar({ anticipacion: Math.min(168, Number(valor.replace(/\D/g, '')) || 0) })}
          ayuda="En horas"
        />
      </div>
      <DiasCerrados guardados={props.cerrado ?? []} alCambiar={(cerrado) => alCambiar({ cerrado })} />
      <Interruptor activo={props.pedirCorreo} alCambiar={(pedirCorreo) => alCambiar({ pedirCorreo })}>
        Pedir correo
        <small className="block text-[11.5px] text-sitio-tenue">Para mandar la confirmación y el recordatorio del día antes.</small>
      </Interruptor>
      <CampoArea
        etiqueta="Mensaje al agendar"
        valor={props.mensajeFinal ?? ''}
        alCambiar={(mensajeFinal) => alCambiar({ mensajeFinal })}
        filas={2}
        maximo={240}
        marcador="Llega 10 minutos antes. Si no puedes venir, avísanos."
      />
      <p className="text-[11px] leading-relaxed text-sitio-tenue">
        {limites.citasMes === null ? 'Citas en línea sin límite en tu plan. ' : `Tu plan recibe hasta ${limites.citasMes} citas en línea al mes. `}
        <Link href="/panel/agenda" className="inline-flex items-center gap-0.5 text-sitio-suave underline-offset-2 hover:text-white hover:underline">
          Ver la agenda <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </p>
    </>
  )
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Se escribe libre y se guarda al salir del campo: a medio escribir una fecha no es válida. */
function DiasCerrados({ guardados, alCambiar }: { guardados: string[]; alCambiar: (cerrado: string[]) => void }) {
  const [texto, setTexto] = useState(guardados.join(', '))
  const validas = texto.split(/[,\s]+/).filter((fecha) => FECHA.test(fecha))
  return (
    <div className="flex flex-col gap-1.5" onBlur={() => alCambiar(validas)}>
      <Campo
        etiqueta="Días cerrados"
        valor={texto}
        alCambiar={setTexto}
        marcador="2026-12-25, 2027-01-01"
        ayuda={`Festivos o vacaciones, como año-mes-día. ${validas.length ? `${validas.length} fecha${validas.length === 1 ? '' : 's'} cerrada${validas.length === 1 ? '' : 's'}.` : ''}`}
      />
    </div>
  )
}
