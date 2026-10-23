import Image from 'next/image'
import { Clock, FileText, Instagram, MapPin, MessageCircle, Scale, ShoppingBag, Users } from 'lucide-react'
import { cn } from '@/utilidades/clases'

/*
 * Maquetas de los productos que vienen: muestran la idea con un negocio de
 * ejemplo, no son capturas. Se pintan con colores fijos de tienda (crema y
 * tinta), igual en el tema claro y en el oscuro del sitio.
 */

const CREMA = 'bg-[#f7f4ef] text-[#1c1917]'

/** Página informativa de un negocio de servicios: portada, servicios y contacto. */
export function MaquetaPagina({ grande = false }: { grande?: boolean }) {
  return (
    <div
      className={cn(
        'absolute overflow-hidden bg-black shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2',
        grande
          ? 'inset-x-5 top-8 -bottom-10 rounded-[10px] md:inset-x-[8%] md:top-12'
          : 'inset-x-7 top-0 -bottom-6 rounded-t-[8px] md:inset-x-8',
      )}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-white/10 bg-sitio-elevado px-3">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="ml-3 truncate font-mono text-[10px] text-white/40">morichal-abogados.llanostudio.co</span>
      </div>
      <div className={cn('h-full', CREMA)}>
        <div className={cn('flex items-center justify-between border-b border-[#1c1917]/10', grande ? 'px-8 py-4' : 'px-4 py-2.5')}>
          <span className={cn('font-serif font-semibold', grande ? 'text-[17px]' : 'text-[12px]')}>Morichal Abogados</span>
          <span className={cn('hidden items-center gap-5 text-[#1c1917]/60 sm:flex', grande ? 'text-[13px]' : 'text-[9.5px]')}>
            <span>Servicios</span>
            <span>Equipo</span>
            <span className={cn('bg-[#1c1917] text-[#ffffff]', grande ? 'px-3.5 py-2' : 'px-2 py-1')}>Agendar cita</span>
          </span>
        </div>
        <div className={cn('relative', grande ? 'h-[220px] md:h-[250px]' : 'h-[118px]')}>
          <Image src="/fotos/casa-historia.webp" alt="" fill sizes={grande ? '90vw' : '45vw'} className="object-cover" />
          <div className="absolute inset-0 bg-[#000000]/45" />
          <div className={cn('absolute text-[#ffffff]', grande ? 'bottom-8 left-8 max-w-[520px]' : 'bottom-3.5 left-4 max-w-[200px]')}>
            <p className={cn('font-serif leading-[1.05] font-semibold', grande ? 'text-[34px] md:text-[40px]' : 'text-[17px]')}>
              Asesoría legal clara, en el Llano
            </p>
            {grande && <p className="mt-2 text-[14px] text-[#ffffff]/80">Familia, contratos y empresas. Primera consulta sin costo.</p>}
          </div>
        </div>
        <div className={cn('grid grid-cols-3', grande ? 'gap-4 p-8' : 'gap-2 p-3.5')}>
          {[
            { Icono: Users, nombre: 'Familia' },
            { Icono: FileText, nombre: 'Contratos' },
            { Icono: Scale, nombre: 'Empresas' },
          ].map(({ Icono, nombre }) => (
            <div key={nombre} className={cn('border border-[#1c1917]/10 bg-[#ffffff]', grande ? 'p-4' : 'p-2.5')}>
              <Icono aria-hidden="true" strokeWidth={1.5} className={cn('text-[#1c1917]/60', grande ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
              <p className={cn('font-medium', grande ? 'mt-3 text-[14px]' : 'mt-1.5 text-[10.5px]')}>{nombre}</p>
            </div>
          ))}
        </div>
        <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-1 text-[#1c1917]/60', grande ? 'px-8 text-[13px]' : 'px-4 text-[9.5px]')}>
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className={grande ? 'h-4 w-4' : 'h-3 w-3'} />
            Villavicencio, Meta
          </span>
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className={grande ? 'h-4 w-4' : 'h-3 w-3'} />
            Lun a vie, 8 a 6
          </span>
        </div>
      </div>
    </div>
  )
}

const ENLACES = [
  { Icono: ShoppingBag, texto: 'Ver la tienda' },
  { Icono: MessageCircle, texto: 'Escríbenos por WhatsApp' },
  { Icono: MapPin, texto: 'Cómo llegar' },
  { Icono: Instagram, texto: 'Instagram' },
]

/** Página de enlaces para la bio: un celular completo sobre la foto de la marca. */
export function MaquetaEnlaces({ grande = false }: { grande?: boolean }) {
  return (
    <>
      {grande && (
        <>
          <Image src="/fotos/lana-hero.webp" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[#000000]/55" />
        </>
      )}
      <div
        className={cn(
          'absolute left-1/2 w-[230px] -translate-x-1/2 overflow-hidden border-[6px] border-sitio-elevado shadow-[0_40px_100px_-30px_rgba(0,0,0,1)] transition-transform duration-[1.2s] ease-salida group-hover:-translate-y-2',
          grande ? 'top-1/2 h-[460px] -translate-y-1/2 rounded-[34px] md:h-[470px]' : 'top-0 -bottom-6 rounded-t-[28px] border-b-0',
          CREMA,
        )}
      >
        <div className="relative h-[92px]">
          <Image src="/fotos/lana-historia.webp" alt="" fill sizes="230px" className="object-cover" />
        </div>
        <div className="relative mx-auto -mt-9 h-[72px] w-[72px] overflow-hidden rounded-full ring-4 ring-[#f7f4ef]">
          <Image src="/fotos/lana-hero.webp" alt="" fill sizes="72px" className="object-cover" />
        </div>
        <p className="mt-2.5 text-center font-serif text-[17px] font-semibold">Lana Andina</p>
        <p className="mt-0.5 text-center text-[11px] text-[#1c1917]/60">Suéteres tejidos en Colombia</p>
        <div className="mt-4 space-y-2 px-4">
          {ENLACES.map(({ Icono, texto }, indice) => (
            <div
              key={texto}
              className={cn(
                'flex h-10 items-center gap-2.5 rounded-full px-4 text-[11.5px] font-medium',
                indice === 0 ? 'bg-[#1c1917] text-[#ffffff]' : 'border border-[#1c1917]/15 bg-[#ffffff]',
              )}
            >
              <Icono aria-hidden="true" strokeWidth={1.6} className="h-3.5 w-3.5 shrink-0" />
              {texto}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
