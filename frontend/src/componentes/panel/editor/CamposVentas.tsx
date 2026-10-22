'use client'

import type { AjustesTienda } from '@/tipos/tienda'
import { Campo, CampoArea, Interruptor } from '../ui/basicos'

interface Props {
  ajustes: AjustesTienda
  alCambiar: (cambios: Partial<AjustesTienda>) => void
}

const numero = (valor: string) => {
  const limpio = Number(valor.replace(/\D/g, ''))
  return limpio > 0 ? limpio : undefined
}

/** Envíos, medios de pago y cómo termina la compra. */
export function CamposVentas({ ajustes, alCambiar }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Campo
          etiqueta="Costo del envío"
          valor={ajustes.costoEnvio ?? ''}
          alCambiar={(valor) => alCambiar({ costoEnvio: numero(valor) })}
          prefijo="$"
          marcador="0 = gratis"
        />
        <Campo
          etiqueta="Gratis desde"
          valor={ajustes.envioGratisDesde ?? ''}
          alCambiar={(valor) => alCambiar({ envioGratisDesde: numero(valor) })}
          prefijo="$"
          marcador="Opcional"
        />
      </div>
      <Campo
        etiqueta="Pedido mínimo"
        valor={ajustes.pedidoMinimo ?? ''}
        alCambiar={(valor) => alCambiar({ pedidoMinimo: numero(valor) })}
        prefijo="$"
        marcador="Opcional"
      />

      <span className="mt-1 text-[11.5px] text-sitio-suave">Cómo te pagan</span>
      <Interruptor activo={ajustes.pagoContraEntrega ?? false} alCambiar={(pagoContraEntrega) => alCambiar({ pagoContraEntrega })}>
        Pago contra entrega
      </Interruptor>
      <Interruptor activo={ajustes.pagoTransferencia ?? false} alCambiar={(pagoTransferencia) => alCambiar({ pagoTransferencia })}>
        Transferencia o Nequi
      </Interruptor>
      {ajustes.pagoTransferencia && (
        <CampoArea
          etiqueta="Datos para transferir"
          valor={ajustes.datosTransferencia ?? ''}
          alCambiar={(datosTransferencia) => alCambiar({ datosTransferencia })}
          filas={3}
          maximo={400}
          marcador="Nequi 300 123 4567 a nombre de…"
        />
      )}
      <p className="text-[11px] leading-relaxed text-sitio-tenue">
        Siempre está la opción de acordar el pago por WhatsApp. Wompi y PSE llegan pronto.
      </p>

      <Interruptor activo={ajustes.pedidosWhatsapp ?? false} alCambiar={(pedidosWhatsapp) => alCambiar({ pedidosWhatsapp })}>
        Terminar la compra por WhatsApp
        <small className="block text-[11.5px] text-sitio-tenue">
          {ajustes.whatsapp
            ? 'Al confirmar, el pedido se guarda y se abre tu WhatsApp con el resumen.'
            : 'Agrega tu número en “Contacto y redes” para usarlo.'}
        </small>
      </Interruptor>
    </>
  )
}
