'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ExternalLink } from 'lucide-react'
import { ErrorPanel, guardarFacturacion, obtenerFacturacion, type FacturacionTienda } from '@/servicios/panel'
import { Aviso, BotonPanel, Campo, Etiqueta, Interruptor } from './ui/basicos'

/** Conectar la cuenta de Alegra para emitir factura electrónica DIAN de los pedidos. */
export function GestionFacturacion() {
  const [actual, setActual] = useState<FacturacionTienda | null>(null)
  const [usuario, setUsuario] = useState('')
  const [token, setToken] = useState('')
  const [activa, setActiva] = useState(false)
  const [automatica, setAutomatica] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [nota, setNota] = useState('')

  useEffect(() => {
    void obtenerFacturacion()
      .then((datos) => {
        setActual(datos)
        setUsuario(datos.usuario)
        setActiva(datos.activa)
        setAutomatica(datos.automatica)
      })
      .catch((problema: unknown) => setError(problema instanceof Error ? problema.message : 'No pudimos cargar la facturación'))
  }, [])

  async function guardar() {
    setGuardando(true)
    setError('')
    setCampos({})
    setNota('')
    try {
      const datos = await guardarFacturacion({ activa, automatica, usuario, ...(token ? { token } : {}) })
      setActual(datos)
      setToken('')
      setNota(datos.activa ? 'Conectado con Alegra. Ya puedes facturar tus pedidos.' : 'Guardado. La factura electrónica está apagada.')
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : 'No se pudo guardar')
      if (problema instanceof ErrorPanel) setCampos(problema.campos)
    } finally {
      setGuardando(false)
    }
  }

  if (!actual) return <div className="brillo h-24 rounded-lg" />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] leading-relaxed text-sitio-suave">
          Emite la factura electrónica de la DIAN con tu cuenta de Alegra. Necesitas tener la facturación electrónica habilitada allá
          (resolución y numeración).
        </p>
        <Etiqueta tono={actual.activa ? 'verde' : 'neutro'}>{actual.activa ? 'Conectada' : 'Sin conectar'}</Etiqueta>
      </div>

      <Campo etiqueta="Correo de tu cuenta de Alegra" valor={usuario} alCambiar={setUsuario} tipo="email" maximo={160} error={campos.usuario} />
      <Campo
        etiqueta="Token de la API"
        valor={token}
        alCambiar={setToken}
        tipo="password"
        maximo={200}
        marcador={actual.tokenPuesto ? '•••••••• (guardado; escribe otro para cambiarlo)' : 'Pégalo aquí'}
        error={campos.token}
        ayuda={
          <a href="https://app.alegra.com/configuration/api" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
            En Alegra: Configuración → Integraciones → API <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        }
      />

      <Interruptor activo={activa} alCambiar={setActiva}>
        Factura electrónica activa
        <small className="block text-[11.5px] text-sitio-tenue">En la tienda, el cliente puede pedirla con su cédula o NIT.</small>
      </Interruptor>
      <Interruptor activo={automatica} alCambiar={setAutomatica}>
        Facturar sola
        <small className="block text-[11.5px] text-sitio-tenue">
          Cada pedido se factura al quedar pagado o entregado. Si no, lo haces con el botón en cada pedido.
        </small>
      </Interruptor>

      <AnimatePresence>{error && <Aviso>{error}</Aviso>}</AnimatePresence>
      {nota && <p className="text-[12.5px] text-sitio-suave">{nota}</p>}

      <BotonPanel variante="primario" disabled={guardando || !usuario} onClick={() => void guardar()} className="self-start">
        {guardando ? 'Comprobando con Alegra…' : 'Guardar'}
      </BotonPanel>
    </div>
  )
}
