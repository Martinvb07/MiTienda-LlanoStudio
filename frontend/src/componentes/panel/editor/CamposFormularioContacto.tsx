'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { BloqueFormulario } from '@/tipos/bloques'
import { Campo, CampoArea, Interruptor } from '../ui/basicos'

/** Campos de la sección de formulario de contacto. */
export function CamposFormularioContacto({ bloque, alCambiar }: { bloque: BloqueFormulario; alCambiar: (cambios: Record<string, unknown>) => void }) {
  const { props } = bloque
  return (
    <>
      <Campo etiqueta="Título" valor={props.titulo ?? ''} alCambiar={(titulo) => alCambiar({ titulo })} marcador="Vacío = sin título" maximo={80} />
      <Campo etiqueta="Bajada" valor={props.subtitulo ?? ''} alCambiar={(subtitulo) => alCambiar({ subtitulo })} maximo={160} />
      <Campo
        etiqueta="Motivos para escribir"
        valor={props.motivos.join(', ')}
        alCambiar={(valor) => alCambiar({ motivos: valor.split(/, ?/).slice(0, 8) })}
        marcador="Cotización, Una pregunta, Otro"
        ayuda="Separados por coma. Vacío = sin selector."
      />
      <Interruptor activo={props.pedirCorreo} alCambiar={(pedirCorreo) => alCambiar({ pedirCorreo })}>
        Pedir correo
      </Interruptor>
      <Interruptor activo={props.pedirTelefono} alCambiar={(pedirTelefono) => alCambiar({ pedirTelefono })}>
        Pedir celular
      </Interruptor>
      <Interruptor activo={props.conDatos ?? false} alCambiar={(conDatos) => alCambiar({ conDatos })}>
        Mostrar tus datos al lado
        <small className="block text-[11.5px] text-sitio-tenue">WhatsApp, correo y dirección de “Contacto y redes”.</small>
      </Interruptor>
      <Campo etiqueta="Texto del botón" valor={props.textoBoton} alCambiar={(textoBoton) => alCambiar({ textoBoton })} maximo={30} />
      <CampoArea
        etiqueta="Mensaje al enviar"
        valor={props.mensajeExito ?? ''}
        alCambiar={(mensajeExito) => alCambiar({ mensajeExito })}
        filas={2}
        maximo={200}
      />
      <p className="text-[11px] leading-relaxed text-sitio-tenue">
        Lo que escriban llega a tu correo y a{' '}
        <Link href="/panel/mensajes" className="inline-flex items-center gap-0.5 text-sitio-suave underline-offset-2 hover:text-white hover:underline">
          Mensajes <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
        </Link>
      </p>
    </>
  )
}
