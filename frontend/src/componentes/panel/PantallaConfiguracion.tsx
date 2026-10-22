'use client'

import Link from 'next/link'
import { configuracionDominios, urlTienda } from '@/utilidades/dominios'
import { Tarjeta } from '@/componentes/comunes/Tarjeta'
import { CabeceraPanel } from './CabeceraPanel'
import { useSesion } from './SesionPanel'
import { Etiqueta } from './ui/basicos'

export function PantallaConfiguracion() {
  const { sesion } = useSesion()
  const direccion = `${sesion.tenant.subdominio}.${configuracionDominios.dominioBase}`

  return (
    <>
      <CabeceraPanel titulo="Configuración" descripcion="Tu cuenta, la dirección de tu tienda y lo que viene." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="Cuenta">
          <dl className="space-y-3 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-sitio-tenue">Nombre</dt>
              <dd>{sesion.usuario.nombre}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-sitio-tenue">Correo</dt>
              <dd className="truncate">{sesion.usuario.email}</dd>
            </div>
          </dl>
        </Tarjeta>

        <Tarjeta titulo="Dirección de la tienda">
          <a
            href={urlTienda(sesion.tenant.subdominio)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[13px] text-sitio-azul-claro hover:underline"
          >
            {direccion} ↗
          </a>
          <p className="mt-3 text-[12.5px] leading-relaxed text-sitio-tenue">
            Viene incluida con tu cuenta. Para cambiar el nombre, el logo o los colores usa{' '}
            <Link href="/panel/plantillas?editar=1" className="text-white underline-offset-4 hover:underline">
              el editor
            </Link>
            .
          </p>
        </Tarjeta>

        <Tarjeta titulo="Dominio propio">
          <div className="flex items-center gap-2">
            <Etiqueta tono="azul">Próximamente</Etiqueta>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-sitio-tenue">
            Conecta www.tutienda.com y tu tienda responde ahí sin cambiar nada más.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Pagos">
          <div className="flex items-center gap-2">
            <Etiqueta tono="azul">Próximamente</Etiqueta>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-sitio-tenue">
            Cobros con Wompi y PSE, directo a tu cuenta, sin comisión de Mi Tienda.
          </p>
        </Tarjeta>
      </div>
    </>
  )
}
