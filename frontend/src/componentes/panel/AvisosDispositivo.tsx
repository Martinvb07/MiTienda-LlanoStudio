'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { borrarSuscripcionPush, guardarSuscripcionPush, llavePush } from '@/servicios/panel'
import { pushDisponible, suscribir, suscripcionActual } from '@/utilidades/avisosPush'
import { BotonPanel, Interruptor } from './ui/basicos'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
}

/** Instalar el panel como app y recibir avisos de pedidos nuevos en este dispositivo. */
export function AvisosDispositivo() {
  const [llave, setLlave] = useState<string | null | undefined>(undefined)
  const [activo, setActivo] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [instalar, setInstalar] = useState<EventoInstalar | null>(null)
  const disponible = pushDisponible()

  useEffect(() => {
    void llavePush()
      .then(setLlave)
      .catch(() => setLlave(null))
    void suscripcionActual().then((suscripcion) => setActivo(Boolean(suscripcion)))
    const alPoderInstalar = (evento: Event) => {
      evento.preventDefault()
      setInstalar(evento as EventoInstalar)
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar)
  }, [])

  async function cambiar(encender: boolean) {
    setTrabajando(true)
    setMensaje('')
    try {
      if (encender) {
        const suscripcion = await suscribir(llave!)
        await guardarSuscripcionPush(suscripcion.toJSON())
        setActivo(true)
        setMensaje('Listo: este dispositivo te avisará de cada pedido, cita y mensaje nuevo.')
      } else {
        const suscripcion = await suscripcionActual()
        if (suscripcion) {
          await borrarSuscripcionPush(suscripcion.endpoint).catch(() => undefined)
          await suscripcion.unsubscribe()
        }
        setActivo(false)
      }
    } catch (problema) {
      setMensaje(problema instanceof Error ? problema.message : 'No se pudieron activar los avisos.')
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {instalar && (
        <BotonPanel
          onClick={() => {
            void instalar.prompt()
            setInstalar(null)
          }}
          className="self-start"
        >
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          Instalar el panel como app
        </BotonPanel>
      )}
      <p className="text-[12.5px] leading-relaxed text-sitio-suave">
        En el celular: abre el menú del navegador y toca «Agregar a la pantalla de inicio» (en iPhone, desde Safari con el botón
        Compartir). El panel se abre como una app y puede avisarte aunque esté cerrado.
      </p>
      {!disponible ? (
        <p className="text-[12.5px] text-sitio-tenue">Este navegador no admite avisos. En iPhone, primero agrega el panel a la pantalla de inicio.</p>
      ) : llave === null ? (
        <p className="text-[12.5px] text-sitio-tenue">Los avisos en el celular todavía no están activos en el servidor.</p>
      ) : (
        <Interruptor activo={activo} alCambiar={(valor) => !trabajando && llave && void cambiar(valor)}>
          Avisarme en este dispositivo
          <small className="block text-[11.5px] text-sitio-tenue">Pedidos nuevos, citas y mensajes, con sonido.</small>
        </Interruptor>
      )}
      {mensaje && <p className="text-[12.5px] text-sitio-suave">{mensaje}</p>}
    </div>
  )
}
