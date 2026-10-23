'use client'

import type { CheckoutPago } from '@/tipos/pedidos'

declare global {
  interface Window {
    ePayco?: { checkout: { configure: (opciones: { key: string; test: boolean }) => { open: (datos: Record<string, string>) => void } } }
    BoldCheckout?: new (opciones: Record<string, string>) => { open: () => void }
  }
}

const cargas = new Map<string, Promise<void>>()

function cargarScript(url: string) {
  let carga = cargas.get(url)
  if (!carga) {
    carga = new Promise<void>((resolver, rechazar) => {
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.onload = () => resolver()
      script.onerror = () => {
        cargas.delete(url)
        rechazar(new Error('No se pudo cargar la pasarela de pago'))
      }
      document.head.appendChild(script)
    })
    cargas.set(url, carga)
  }
  return carga
}

/** Abre el cobro de la pasarela que eligió el comprador. */
export async function abrirCheckout(checkout: CheckoutPago) {
  if (checkout.tipo === 'redireccion') {
    window.location.assign(checkout.url)
    return
  }
  if (checkout.tipo === 'epayco') {
    await cargarScript('https://checkout.epayco.co/checkout.js')
    if (!window.ePayco) throw new Error('ePayco no cargó')
    window.ePayco.checkout.configure({ key: checkout.llave, test: checkout.prueba }).open(checkout.datos)
    return
  }
  await cargarScript('https://checkout.bold.co/library/boldPaymentButton.js')
  if (!window.BoldCheckout) throw new Error('Bold no cargó')
  new window.BoldCheckout({
    orderId: checkout.referencia,
    currency: checkout.moneda,
    amount: String(checkout.monto),
    apiKey: checkout.llave,
    integritySignature: checkout.firma,
    description: checkout.descripcion,
    redirectionUrl: checkout.redireccion,
    customerData: JSON.stringify({ email: checkout.correo }),
  }).open()
}
