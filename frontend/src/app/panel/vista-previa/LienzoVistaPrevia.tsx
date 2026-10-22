'use client'

import { useEffect, useState } from 'react'
import { BotonWhatsapp } from '@/componentes/tienda/BotonWhatsapp'
import { CabeceraTienda } from '@/componentes/tienda/CabeceraTienda'
import { FichaProducto } from '@/componentes/tienda/FichaProducto'
import { RenderizadorBloques } from '@/componentes/tienda/RenderizadorBloques'
import { ajustarAlPlan, limitesDe } from '@/utilidades/planes'
import { atributosTema, variablesTema } from '@/utilidades/tema'
import { FuentesTema } from '@/componentes/tienda/FuentesTema'
import { BarraSeccion } from './BarraSeccion'
import type { MensajeVistaPrevia } from './mensajes'

/**
 * Pinta el borrador que llega del editor con los mismos componentes de la
 * tienda pública. Sólo acepta mensajes del mismo origen, y los enlaces no
 * navegan: es una vista, no la tienda.
 */
export function LienzoVistaPrevia() {
  const [datos, setDatos] = useState<MensajeVistaPrevia['datos'] | null>(null)

  useEffect(() => {
    function alMensaje(evento: MessageEvent) {
      if (evento.origin !== window.location.origin || evento.data?.tipo !== 'mt-vista') return
      setDatos((evento.data as MensajeVistaPrevia).datos)
    }
    function sinNavegar(evento: MouseEvent) {
      if ((evento.target as HTMLElement).closest('a')) evento.preventDefault()
    }
    window.addEventListener('message', alMensaje)
    document.addEventListener('click', sinNavegar, true)
    window.parent.postMessage({ tipo: 'mt-vista-lista' }, window.location.origin)
    return () => {
      window.removeEventListener('message', alMensaje)
      document.removeEventListener('click', sinNavegar, true)
    }
  }, [])

  const enfocar = datos?.enfocar
  useEffect(() => {
    if (!enfocar) return
    document
      .querySelector(`[data-bloque="${CSS.escape(enfocar)}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [enfocar])

  if (!datos) {
    return <div className="grid min-h-screen place-items-center text-sm text-black/40">Cargando vista previa…</div>
  }

  const { tienda } = datos
  // Igual que la tienda pública: lo que el plan no incluye no se pinta.
  const { ajustes, bloques } = ajustarAlPlan(tienda.plan, tienda.ajustes ?? {}, tienda.configuracionBloques)
  const cabecera = <CabeceraTienda nombre={tienda.nombre || 'Mi tienda'} logoUrl={tienda.logoUrl} ajustes={ajustes} />

  return (
    <div
      style={variablesTema(tienda.tema)}
      {...atributosTema(tienda.tema)}
      className="min-h-screen bg-superficie font-sans text-tinta"
    >
      <FuentesTema tema={tienda.tema} />
      {enfocar && (
        <style>{`[data-bloque="${enfocar.replace(/"/g, '')}"]{outline:1.5px dashed color-mix(in srgb,var(--tinta) 45%,transparent);outline-offset:-6px;animation:mt-enfoque .6s cubic-bezier(.22,1,.36,1)}@keyframes mt-enfoque{from{outline-color:transparent;outline-offset:2px}}`}</style>
      )}
      {datos.vista === 'producto' && datos.producto ? (
        <>
          {cabecera}
          <FichaProducto producto={datos.producto} nombreTienda={tienda.nombre} moneda={tienda.moneda} ajustes={ajustes} catalogo={datos.productos} />
        </>
      ) : (
        <RenderizadorBloques
          bloques={bloques}
          productos={datos.productos}
          moneda={tienda.moneda}
          cabecera={cabecera}
          quitarMarca={limitesDe(tienda.plan).quitarMarca}
          ajustes={ajustes}
          nombreTienda={tienda.nombre}
          tema={tienda.tema}
        />
      )}
      {datos.editable && datos.vista !== 'producto' && <BarraSeccion bloques={bloques.filter((bloque) => bloque.visible !== false)} />}
      {ajustes.whatsappFlotante && ajustes.whatsapp && <BotonWhatsapp numero={ajustes.whatsapp} tienda={tienda.nombre} />}
    </div>
  )
}
