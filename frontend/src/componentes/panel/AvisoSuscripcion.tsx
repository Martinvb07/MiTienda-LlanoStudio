'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { limitesDe } from '@/utilidades/planes'
import { cn } from '@/utilidades/clases'
import { useSesion } from './SesionPanel'

/**
 * Franja arriba del panel cuando el plan está por vencer o ya venció. En
 * gracia cuenta los días que quedan antes de volver a Gratis.
 */
export function AvisoSuscripcion() {
  const { sesion } = useSesion()
  const ruta = usePathname()
  const suscripcion = sesion.tenant.suscripcion
  if (!suscripcion || ruta === '/panel/plan') return null
  if (suscripcion.estado !== 'por-vencer' && suscripcion.estado !== 'gracia') return null

  const plan = limitesDe(sesion.tenant.plan).nombre
  const dias = suscripcion.diasRestantes ?? 0
  const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`
  const gracia = suscripcion.estado === 'gracia'

  return (
    <div
      role="status"
      className={cn(
        'mb-6 flex flex-col gap-3 rounded-[12px] border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between',
        gracia ? 'border-sitio-ambar/40 bg-sitio-ambar/[0.07]' : 'border-sitio-borde-fuerte bg-sitio-superficie',
      )}
    >
      <p className="flex items-start gap-3 text-[13px]">
        <span aria-hidden="true" className="estado-punto mt-[5px]" data-tono="ambar" data-vivo={gracia || undefined} />
        <span>
          {gracia ? (
            <>
              <strong className="font-medium">Tu plan {plan} venció.</strong>{' '}
              <span className="text-sitio-suave">Si no pagas, tu tienda vuelve al plan Gratis {cuando}.</span>
            </>
          ) : (
            <>
              <strong className="font-medium">Tu plan {plan} vence {cuando}.</strong>{' '}
              <span className="text-sitio-suave">Renuévalo para no perder lo que tienes.</span>
            </>
          )}
        </span>
      </p>
      <Link href="/panel/plan" className="group boton boton-primario boton-chico shrink-0 !h-9">
        Pagar ahora
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform duration-500 ease-salida group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
