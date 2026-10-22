import Image from 'next/image'
import { cn } from '@/utilidades/clases'

/** Logo de Llano Studio: el blanco en modo oscuro, el negro en modo claro. */
export function LogoMarca({ className, alt = 'Llano Studio', prioridad }: { className?: string; alt?: string; prioridad?: boolean }) {
  return (
    <>
      <Image src="/llanostudio-marca.png" alt={alt} width={232} height={205} priority={prioridad} className={cn('solo-oscuro', className)} />
      <Image src="/llanostudio-marca-oscura.png" alt={alt} width={220} height={194} priority={prioridad} className={cn('solo-claro', className)} />
    </>
  )
}
