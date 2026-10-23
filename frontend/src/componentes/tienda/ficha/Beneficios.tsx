import { BadgeCheck, CreditCard, Headphones, RefreshCw, ShieldCheck, Truck } from 'lucide-react'
import type { BeneficioFicha, IconoBeneficio } from '@/tipos/tienda'

export const ICONOS_BENEFICIO: Record<IconoBeneficio, { Icono: typeof Truck; etiqueta: string }> = {
  envio: { Icono: Truck, etiqueta: 'Envío' },
  garantia: { Icono: ShieldCheck, etiqueta: 'Garantía' },
  pago: { Icono: CreditCard, etiqueta: 'Pago' },
  cambios: { Icono: RefreshCw, etiqueta: 'Cambios' },
  soporte: { Icono: Headphones, etiqueta: 'Asesoría' },
  calidad: { Icono: BadgeCheck, etiqueta: 'Calidad' },
}

/** Fila de íconos bajo el botón de compra: lo que le da confianza al cliente. */
export function Beneficios({ beneficios }: { beneficios: BeneficioFicha[] }) {
  if (beneficios.length === 0) return null
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {beneficios.map(({ id, icono, texto }) => {
        const { Icono } = ICONOS_BENEFICIO[icono] ?? ICONOS_BENEFICIO.calidad
        return (
          <li
            key={id}
            className="flex items-center gap-2.5 rounded-(--radius-marca) border border-tinta/10 px-3 py-2.5 text-[13px] leading-snug text-tinta/80 sm:flex-col sm:items-start sm:gap-1.5"
          >
            <Icono aria-hidden="true" className="h-5 w-5 shrink-0 text-marca" strokeWidth={1.7} />
            {texto}
          </li>
        )
      })}
    </ul>
  )
}
