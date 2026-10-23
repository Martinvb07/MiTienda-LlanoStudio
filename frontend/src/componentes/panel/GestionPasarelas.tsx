'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { ErrorPanel, guardarPasarela, listarPasarelas, type PasarelaTienda, type ProveedorPago } from '@/servicios/panel'
import { cn } from '@/utilidades/clases'
import { Aviso, BotonPanel, Campo, Etiqueta, Interruptor } from './ui/basicos'

interface Info {
  nombre: string
  detalle: string
  panel: string
  publica: { etiqueta: string; marcador: string }
  secretos: { clave: string; etiqueta: string }[]
  /** Dónde pegar la URL de avisos; null = la pasarela la recibe sola. */
  aviso: string | null
  pasos: string
}

const INFO: Record<ProveedorPago, Info> = {
  WOMPI: {
    nombre: 'Wompi',
    detalle: 'Bancolombia: tarjeta, PSE, Nequi y botón Bancolombia.',
    panel: 'https://comercios.wompi.co',
    publica: { etiqueta: 'Llave pública', marcador: 'pub_prod_…' },
    secretos: [
      { clave: 'integridad', etiqueta: 'Secreto de integridad' },
      { clave: 'eventos', etiqueta: 'Secreto de eventos' },
    ],
    aviso: 'En Wompi, Desarrolladores → URL de eventos',
    pasos: 'En el panel de Wompi, Desarrolladores → Llaves: copia la llave pública y los secretos de integridad y de eventos.',
  },
  EPAYCO: {
    nombre: 'ePayco',
    detalle: 'Tarjeta, PSE, Daviplata, Efecty y más.',
    panel: 'https://dashboard.epayco.com',
    publica: { etiqueta: 'Llave pública (PUBLIC_KEY)', marcador: '…' },
    secretos: [
      { clave: 'idCliente', etiqueta: 'P_CUST_ID_CLIENTE' },
      { clave: 'pKey', etiqueta: 'P_KEY' },
    ],
    aviso: null,
    pasos: 'En el panel de ePayco, Integraciones → Llaves API: copia PUBLIC_KEY, P_CUST_ID_CLIENTE y P_KEY. La confirmación del pago llega sola.',
  },
  BOLD: {
    nombre: 'Bold',
    detalle: 'Tarjeta, PSE, Nequi y botón Bancolombia.',
    panel: 'https://panel.bold.co',
    publica: { etiqueta: 'Llave de identidad', marcador: '…' },
    secretos: [{ clave: 'secreta', etiqueta: 'Llave secreta' }],
    aviso: 'En Bold, Integraciones → Webhooks',
    pasos: 'En el panel de Bold, Integraciones → Llaves de integración: copia la llave de identidad y la secreta.',
  },
}

function Tarjeta({ pasarela, alGuardar }: { pasarela: PasarelaTienda; alGuardar: (lista: PasarelaTienda[]) => void }) {
  const info = INFO[pasarela.proveedor]
  const [abierta, setAbierta] = useState(false)
  const [llavePublica, setLlavePublica] = useState(pasarela.llavePublica)
  const [modoPrueba, setModoPrueba] = useState(pasarela.modoPrueba)
  const [secretos, setSecretos] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function guardar(activa: boolean) {
    setGuardando(true)
    setError('')
    setCampos({})
    try {
      alGuardar(await guardarPasarela(pasarela.proveedor, { activa, modoPrueba, llavePublica, secretos }))
      setSecretos({})
    } catch (problema) {
      if (problema instanceof ErrorPanel) setCampos(problema.campos)
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <li className={cn('rounded-xl border transition-colors', abierta ? 'border-sitio-borde-fuerte' : 'border-sitio-borde')}>
      <button type="button" aria-expanded={abierta} onClick={() => setAbierta((valor) => !valor)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium">{info.nombre}</span>
          <span className="block truncate text-[12px] text-sitio-tenue">{info.detalle}</span>
        </span>
        {pasarela.activa ? (
          <Etiqueta tono="verde">{pasarela.modoPrueba ? 'Activa · pruebas' : 'Activa'}</Etiqueta>
        ) : (
          <Etiqueta>Sin conectar</Etiqueta>
        )}
      </button>
      <AnimatePresence initial={false}>
        {abierta && (
          <div className="flex flex-col gap-4 border-t border-sitio-borde px-4 pt-4 pb-5">
            <p className="text-[12.5px] leading-relaxed text-sitio-tenue">
              {info.pasos}{' '}
              <a href={info.panel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sitio-suave hover:text-white">
                Abrir {info.nombre}
                <ExternalLink aria-hidden="true" className="h-3 w-3" />
              </a>
            </p>
            <Campo etiqueta={info.publica.etiqueta} valor={llavePublica} alCambiar={setLlavePublica} marcador={info.publica.marcador} error={campos.llavePublica} />
            {info.secretos.map((secreto) => (
              <Campo
                key={secreto.clave}
                etiqueta={secreto.etiqueta}
                tipo="password"
                valor={secretos[secreto.clave] ?? ''}
                alCambiar={(valor) => setSecretos({ ...secretos, [secreto.clave]: valor })}
                marcador={pasarela.secretosPuestos[secreto.clave] ? '•••••••• (guardado; escribe para cambiarlo)' : ''}
                error={campos[secreto.clave]}
                autoCompletar="off"
              />
            ))}
            <Interruptor activo={modoPrueba} alCambiar={setModoPrueba}>
              Llaves de prueba (los cobros no son reales)
            </Interruptor>
            {info.aviso && (
              <div className="rounded-lg border border-sitio-borde bg-sitio-campo p-3">
                <p className="text-[11.5px] text-sitio-suave">{info.aviso}, pega esta dirección para que los pedidos se marquen pagados solos:</p>
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(pasarela.urlAviso).then(() => {
                      setCopiado(true)
                      setTimeout(() => setCopiado(false), 1600)
                    })
                  }
                  className="mt-2 flex w-full items-center gap-2 text-left font-mono text-[12px] break-all"
                >
                  <span className="flex-1">{pasarela.urlAviso}</span>
                  {copiado ? <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-sitio-verde" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </div>
            )}
            <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
            <div className="flex flex-wrap gap-2">
              <BotonPanel variante="primario" disabled={guardando} onClick={() => void guardar(true)}>
                {pasarela.activa ? 'Guardar cambios' : 'Activar'}
              </BotonPanel>
              {pasarela.activa && (
                <BotonPanel variante="peligro" disabled={guardando} onClick={() => void guardar(false)}>
                  Desactivar
                </BotonPanel>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </li>
  )
}

/**
 * Conectar Wompi, ePayco o Bold: el cliente paga en línea en la tienda y el
 * dinero llega directo a la cuenta de la tienda. El pedido se marca pagado solo.
 */
export function GestionPasarelas() {
  const [pasarelas, setPasarelas] = useState<PasarelaTienda[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listarPasarelas()
      .then(setPasarelas)
      .catch((problema: Error) => setError(problema.message))
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!pasarelas) return <div className="brillo h-32 rounded-xl" />

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] leading-relaxed text-sitio-tenue">
        Conecta una o varias. Tus clientes eligen al pagar y el dinero llega a tu cuenta, sin comisión de Mi Tienda (sólo la de la pasarela). Prueba
        primero con las llaves de prueba.
      </p>
      <ul className="flex flex-col gap-2">
        {pasarelas.map((pasarela) => (
          <Tarjeta key={pasarela.proveedor} pasarela={pasarela} alGuardar={setPasarelas} />
        ))}
      </ul>
    </div>
  )
}
