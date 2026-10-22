'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { AccionSeccion, MensajeAccionVista, MensajeVistaPrevia } from '@/app/panel/vista-previa/mensajes'

export type Dispositivo = 'escritorio' | 'movil'

const ESCRITORIO = 1440
const TELEFONO = { ancho: 390, alto: 844 }

/**
 * La tienda real dentro de un iframe, a escala: a 1440 px de ancho en
 * escritorio o dentro de un teléfono. Va en iframe (y no pintada aquí mismo)
 * para que las reglas responsive de la tienda respondan al ancho simulado y no
 * al de la ventana del panel.
 *
 * El contenido viaja por postMessage, sólo entre ventanas del mismo origen.
 */
export function VistaPrevia({
  datos,
  dispositivo,
  alAccion,
}: {
  datos: MensajeVistaPrevia['datos']
  dispositivo: Dispositivo
  /** Acciones pedidas desde la barra de cada sección dentro de la vista. */
  alAccion?: (id: string, accion: AccionSeccion) => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  const marco = useRef<HTMLIFrameElement>(null)
  const [medidas, setMedidas] = useState({ ancho: 0, alto: 0 })
  const [lista, setLista] = useState(false)

  useLayoutEffect(() => {
    const elemento = panel.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => {
      if (entrada) setMedidas({ ancho: entrada.contentRect.width, alto: entrada.contentRect.height })
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  const enviar = useCallback(() => {
    marco.current?.contentWindow?.postMessage(
      { tipo: 'mt-vista', datos } satisfies MensajeVistaPrevia,
      window.location.origin,
    )
  }, [datos])

  const enviarRef = useRef(enviar)
  const accionRef = useRef(alAccion)
  useEffect(() => {
    enviarRef.current = enviar
    accionRef.current = alAccion
  }, [enviar, alAccion])

  useEffect(() => {
    function alMensaje(evento: MessageEvent) {
      if (evento.origin !== window.location.origin) return
      if (evento.data?.tipo === 'mt-vista-accion') {
        const { id, accion } = evento.data as MensajeAccionVista
        accionRef.current?.(id, accion)
        return
      }
      if (evento.data?.tipo === 'mt-vista-lista') {
        setLista(true)
        // Responde al iframe que saludó: al cambiar de dispositivo se monta
        // uno nuevo y también tiene que recibir el borrador.
        enviarRef.current()
      }
    }
    window.addEventListener('message', alMensaje)
    return () => window.removeEventListener('message', alMensaje)
  }, [])

  useEffect(() => {
    if (lista) enviar()
  }, [lista, enviar])

  // En paneles angostos la vista previa siempre es de celular.
  const efectivo: Dispositivo = medidas.ancho && medidas.ancho < 700 ? 'movil' : dispositivo
  const escalaEscritorio = medidas.ancho ? Math.min(1, (medidas.ancho - 48) / ESCRITORIO) : 0.5
  const escalaTelefono = medidas.alto ? Math.min(1, (medidas.alto - 48) / TELEFONO.alto) : 0.8
  const altoUtil = Math.max(0, medidas.alto - 48)

  const iframe = (estilo: React.CSSProperties) => (
    <iframe
      // Cambiar de dispositivo monta otro iframe: hay que volver a esperar el saludo.
      key={efectivo}
      ref={marco}
      src="/panel/vista-previa"
      title="Vista previa de la tienda"
      style={estilo}
      className="block origin-top-left border-0 bg-white"
    />
  )

  return (
    <main
      ref={panel}
      className="relative grid h-full min-h-[420px] min-w-0 place-items-center overflow-hidden bg-sitio-lienzo"
    >
      {medidas.ancho > 0 &&
        (efectivo === 'escritorio' ? (
          <div
            className="relative overflow-hidden rounded-[10px] bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.1)]"
            style={{ width: ESCRITORIO * escalaEscritorio, height: altoUtil }}
          >
            {iframe({
              width: ESCRITORIO,
              height: altoUtil / escalaEscritorio,
              transform: `scale(${escalaEscritorio})`,
            })}
          </div>
        ) : (
          <div
            className="relative rounded-[44px] bg-sitio-elevado p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)]"
            style={{
              width: TELEFONO.ancho * escalaTelefono + 20,
              height: TELEFONO.alto * escalaTelefono + 20,
            }}
          >
            <div className="absolute top-2.5 left-2.5 overflow-hidden rounded-[34px]">
              {iframe({
                width: TELEFONO.ancho,
                height: TELEFONO.alto,
                transform: `scale(${escalaTelefono})`,
              })}
            </div>
          </div>
        ))}
    </main>
  )
}
