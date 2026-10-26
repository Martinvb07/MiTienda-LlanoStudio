'use client'

import type { AjustesTienda } from '@/tipos/tienda'
import type { ZonaEnvio } from '@/utilidades/envios'
import { Campo, CampoArea, Interruptor } from '../ui/basicos'
import { ListaEditable } from './CamposBloque'

interface Props {
  ajustes: AjustesTienda
  alCambiar: (cambios: Partial<AjustesTienda>) => void
}

const numero = (valor: string) => {
  const limpio = Number(valor.replace(/\D/g, ''))
  return limpio > 0 ? limpio : undefined
}

const nuevaZona = (): ZonaEnvio => ({ id: `z${Math.random().toString(36).slice(2, 9)}`, nombre: '', ciudades: [], costo: 0 })

/** Envíos, medios de pago y cómo termina la compra. */
export function CamposVentas({ ajustes, alCambiar }: Props) {
  const zonas = ajustes.zonasEnvio ?? []
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <Campo
          etiqueta={zonas.length ? 'Envío al resto del país' : 'Costo del envío'}
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

      <span className="mt-1 text-[11.5px] text-sitio-suave">Zonas de envío</span>
      <p className="-mt-1 text-[11px] leading-relaxed text-sitio-tenue">
        Cobra distinto según la ciudad: tu ciudad, el área metropolitana, la costa… El cliente ve el precio al escribir su
        ciudad.
      </p>
      <ListaEditable
        elementos={zonas}
        alCambiar={(zonasEnvio) => alCambiar({ zonasEnvio: zonasEnvio.length ? zonasEnvio : undefined })}
        crear={nuevaZona}
        minimo={0}
        maximo={20}
        textoAgregar="Agregar zona"
        titulo={(zona, indice) => zona.nombre || `Zona ${indice + 1}`}
      >
        {(zona, cambiar) => (
          <>
            <div className="grid grid-cols-[1fr_110px] gap-2.5">
              <Campo etiqueta="Nombre" valor={zona.nombre} alCambiar={(nombre) => cambiar({ nombre })} maximo={60} marcador="Mi ciudad" />
              <Campo
                etiqueta="Costo"
                valor={zona.costo || ''}
                alCambiar={(valor) => cambiar({ costo: numero(valor) ?? 0 })}
                prefijo="$"
                marcador="0 = gratis"
              />
            </div>
            <Campo
              etiqueta="Ciudades que cubre"
              valor={zona.ciudades.join(', ')}
              alCambiar={(valor) => cambiar({ ciudades: valor.split(/, ?/) })}
              marcador="Villavicencio, Acacías, Restrepo"
              ayuda="Separadas por coma. Da igual si llevan tilde o mayúsculas."
            />
            <Campo
              etiqueta="Tiempo de entrega"
              valor={zona.tiempo ?? ''}
              alCambiar={(tiempo) => cambiar({ tiempo: tiempo || undefined })}
              maximo={40}
              marcador="Opcional: el mismo día"
            />
          </>
        )}
      </ListaEditable>
      {zonas.length > 0 && (
        <Interruptor activo={ajustes.soloZonas ?? false} alCambiar={(soloZonas) => alCambiar({ soloZonas })}>
          Enviar sólo a estas zonas
          <small className="block text-[11.5px] text-sitio-tenue">Las demás ciudades no podrán pedir a domicilio.</small>
        </Interruptor>
      )}

      <Interruptor activo={ajustes.recogerEnTienda ?? false} alCambiar={(recogerEnTienda) => alCambiar({ recogerEnTienda })}>
        Recoger en la tienda
        <small className="block text-[11.5px] text-sitio-tenue">El cliente pasa por su pedido y no paga envío.</small>
      </Interruptor>
      {ajustes.recogerEnTienda && (
        <Campo
          etiqueta="Dónde se recoge"
          valor={ajustes.direccionRecogida ?? ''}
          alCambiar={(direccionRecogida) => alCambiar({ direccionRecogida: direccionRecogida || undefined })}
          maximo={200}
          marcador={ajustes.direccion || 'Calle 10 # 5-20, local 3'}
          ayuda="Vacío = la dirección de Contacto y redes."
        />
      )}

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
