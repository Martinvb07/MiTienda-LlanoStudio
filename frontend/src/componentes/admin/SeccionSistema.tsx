'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import { Database, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import {
  bloquearSubdominio,
  descargar,
  desbloquearSubdominio,
  guardarMantenimiento,
  leerMantenimiento,
  listarActividad,
  listarBloqueados,
  listarErrores,
  listarTodosLosDominios,
  obtenerSistema,
  quitarDominio,
  type Actividad,
  type EstadoSistema,
  type Mantenimiento,
  type SesionAdmin,
} from '@/servicios/admin'
import { Aviso, BotonPanel, CLASES_ENTRADA, CampoArea, Etiqueta, Interruptor } from '../panel/ui/basicos'
import { confirmar } from '../panel/ui/confirmar'
import { Cargando, Cifra, Desplegable, TituloSeccion, Vacio, fecha, haceCuanto } from './ui'

const gb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`
const mb = (bytes: number) => `${Math.round(bytes / 1024 ** 2)} MB`

/** Salud del servidor, errores, actividad del equipo, subdominios, dominios, mantenimiento y respaldo. */
export function SeccionSistema({ admin }: { admin: SesionAdmin }) {
  const dueno = admin.rol === 'DUENO'
  const [estado, setEstado] = useState<EstadoSistema | null>(null)
  const [errores, setErrores] = useState<Awaited<ReturnType<typeof listarErrores>> | null>(null)
  const [actividad, setActividad] = useState<Actividad[] | null>(null)
  const [bloqueados, setBloqueados] = useState<Awaited<ReturnType<typeof listarBloqueados>> | null>(null)
  const [dominios, setDominios] = useState<Awaited<ReturnType<typeof listarTodosLosDominios>> | null>(null)
  const [mantenimiento, setMantenimiento] = useState<Mantenimiento | null>(null)
  const [nuevo, setNuevo] = useState('')
  const [error, setError] = useState('')
  const [nota, setNota] = useState('')

  const fallar = (problema: unknown) => setError(problema instanceof Error ? problema.message : 'No se pudo')
  const cargarEstado = () => {
    obtenerSistema().then(setEstado).catch(fallar)
    listarErrores().then(setErrores).catch(fallar)
  }

  useEffect(() => {
    cargarEstado()
    listarActividad().then(setActividad).catch(fallar)
    listarBloqueados().then(setBloqueados).catch(fallar)
    listarTodosLosDominios().then(setDominios).catch(fallar)
    leerMantenimiento().then(setMantenimiento).catch(fallar)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga única al abrir la sección
  }, [])

  async function bloquear(evento: FormEvent) {
    evento.preventDefault()
    const subdominio = nuevo.trim().toLowerCase()
    if (!subdominio) return
    try {
      const { aviso } = await bloquearSubdominio(subdominio)
      setBloqueados((lista) => [{ subdominio, motivo: null, creadoEn: new Date().toISOString() }, ...(lista ?? []).filter((fila) => fila.subdominio !== subdominio)])
      setNuevo('')
      if (aviso) setNota(aviso)
    } catch (problema) {
      fallar(problema)
    }
  }

  const disco = estado?.disco ? 1 - estado.disco.libre / estado.disco.total : null

  return (
    <>
      <TituloSeccion
        titulo="Sistema"
        descripcion="Cómo está el servidor y lo que pasa por debajo."
        accion={
          <BotonPanel onClick={cargarEstado}>
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Actualizar
          </BotonPanel>
        }
      />
      <AnimatePresence>{error && <div className="mb-4"><Aviso>{error}</Aviso></div>}</AnimatePresence>
      {nota && <div className="mb-4"><Aviso tono="nota">{nota}</Aviso></div>}

      {!estado ? (
        <Cargando alto="h-28" />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Cifra etiqueta="Base de datos" valor={estado.postgres.ok ? `${estado.postgres.ms} ms` : 'Caída'} tono={estado.postgres.ok ? 'verde' : 'ambar'} pie="PostgreSQL" />
          <Cifra etiqueta="Redis" valor={estado.redis.ok ? `${estado.redis.ms} ms` : 'Caído'} tono={estado.redis.ok ? 'verde' : 'ambar'} pie="Colas y caché" />
          <Cifra
            etiqueta="Disco"
            valor={estado.disco ? `${Math.round((disco ?? 0) * 100)}%` : '—'}
            tono={disco !== null && disco > 0.85 ? 'ambar' : undefined}
            pie={estado.disco ? `${gb(estado.disco.libre)} libres de ${gb(estado.disco.total)}` : 'Sin dato'}
          />
          <Cifra
            etiqueta="Memoria"
            valor={mb(estado.memoria.proceso)}
            pie={`La API · ${gb(estado.memoria.libre)} libres en el servidor`}
          />
        </div>
      )}

      {estado && (
        <p className="mt-3 text-[12px] text-sitio-tenue">
          {estado.version ? (
            <>
              Desplegado <span className="font-mono">{estado.version.sha}</span> · “{estado.version.mensaje}” · {haceCuanto(estado.version.fecha)}
            </>
          ) : (
            'Versión desconocida'
          )}{' '}
          · API encendida {haceCuanto(estado.activoDesde)} · Node {estado.node} · Bold {estado.servicios.bold ? 'conectado' : 'sin llaves'} · Correo{' '}
          {estado.servicios.correo ? 'listo' : 'sin SMTP'}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2.5">
        <Desplegable titulo="Errores recientes" resumen={errores ? (errores.length ? `${errores.length} desde que encendió` : 'Ninguno') : ''} abierto={Boolean(errores?.length)}>
          {!errores ? (
            <Cargando alto="h-16" />
          ) : errores.length === 0 ? (
            <Vacio>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Ningún error desde que la API encendió.
              </span>
            </Vacio>
          ) : (
            <ul className="flex flex-col gap-2">
              {errores.map((fila, indice) => (
                <li key={indice} className="rounded-lg border border-sitio-borde p-3">
                  <p className="text-[12.5px]">
                    <span className="font-mono text-sitio-ambar">{fila.metodo}</span> <span className="font-mono">{fila.ruta}</span>
                    <span className="ml-2 text-[11px] text-sitio-tenue">{haceCuanto(fila.hora)}</span>
                  </p>
                  <p className="mt-1 text-[12.5px] text-red-300">{fila.mensaje}</p>
                  {fila.pila && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-[11px] text-sitio-tenue">Detalle</summary>
                      <pre className="mt-1 overflow-x-auto font-mono text-[10.5px] text-sitio-tenue">{fila.pila}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Actividad del equipo" resumen={actividad?.[0] ? haceCuanto(actividad[0].creadoEn) : ''}>
          {!actividad ? (
            <Cargando alto="h-16" />
          ) : actividad.length === 0 ? (
            <Vacio>Nada todavía.</Vacio>
          ) : (
            <ul className="text-[12.5px]">
              {actividad.map((fila) => (
                <li key={fila.id} className="border-b border-sitio-borde py-2.5 last:border-0">
                  <span className="text-white">{fila.accion}</span>
                  {fila.tienda && <span className="text-sitio-suave"> · {fila.tienda}</span>}
                  {fila.detalle && <span className="text-sitio-tenue"> · {fila.detalle}</span>}
                  <span className="block text-[11px] text-sitio-tenue">
                    {fila.admin} · {fecha(fila.creadoEn, true)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Desplegable>

        <Desplegable titulo="Registros nuevos" resumen={mantenimiento ? (mantenimiento.registrosCerrados ? 'Cerrados' : 'Abiertos') : ''}>
          {mantenimiento && (
            <div className="flex flex-col gap-4">
              <Interruptor
                activo={mantenimiento.registrosCerrados}
                alCambiar={(registrosCerrados) => dueno && setMantenimiento({ ...mantenimiento, registrosCerrados })}
              >
                Cerrar los registros (modo mantenimiento)
              </Interruptor>
              <CampoArea
                etiqueta="Mensaje que ve quien intenta crear una tienda"
                valor={mantenimiento.mensaje}
                alCambiar={(mensaje) => setMantenimiento({ ...mantenimiento, mensaje })}
                filas={2}
                maximo={240}
              />
              {dueno && (
                <BotonPanel
                  variante="primario"
                  className="self-start"
                  onClick={() =>
                    void guardarMantenimiento(mantenimiento)
                      .then(() => setNota(mantenimiento.registrosCerrados ? 'Registros cerrados.' : 'Registros abiertos.'))
                      .catch(fallar)
                  }
                >
                  Guardar
                </BotonPanel>
              )}
              <p className="text-[12px] text-sitio-tenue">Las tiendas que ya existen siguen funcionando normal.</p>
            </div>
          )}
        </Desplegable>

        <Desplegable titulo="Subdominios bloqueados" resumen={bloqueados ? `${bloqueados.length}` : ''}>
          <p className="mb-3 text-[13px] text-sitio-tenue">Nombres que nadie puede registrar: marcas conocidas, bancos o groserías.</p>
          {dueno && (
            <form onSubmit={(evento) => void bloquear(evento)} className="mb-3 flex gap-2">
              <input
                value={nuevo}
                onChange={(evento) => setNuevo(evento.target.value)}
                placeholder="bancolombia"
                aria-label="Subdominio a bloquear"
                className={CLASES_ENTRADA}
              />
              <BotonPanel type="submit" variante="primario">
                Bloquear
              </BotonPanel>
            </form>
          )}
          {bloqueados && bloqueados.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bloqueados.map((fila) => (
                <span key={fila.subdominio} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-sitio-borde px-2.5 font-mono text-[11.5px]">
                  {fila.subdominio}
                  {dueno && (
                    <button
                      type="button"
                      aria-label={`Desbloquear ${fila.subdominio}`}
                      onClick={() =>
                        void desbloquearSubdominio(fila.subdominio).then(() =>
                          setBloqueados((lista) => lista?.filter((otra) => otra.subdominio !== fila.subdominio) ?? null),
                        )
                      }
                      className="text-sitio-tenue hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </Desplegable>

        <Desplegable titulo="Dominios propios" resumen={dominios ? `${dominios.filter((d) => d.verificado).length} de ${dominios.length} verificados` : ''}>
          {!dominios ? (
            <Cargando alto="h-16" />
          ) : dominios.length === 0 ? (
            <Vacio>Ninguna tienda ha conectado un dominio.</Vacio>
          ) : (
            <ul>
              {dominios.map((fila) => (
                <li key={fila.id} className="flex items-center gap-3 border-b border-sitio-borde py-2.5 last:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[12.5px]">{fila.dominio}</span>
                    <span className="text-[11.5px] text-sitio-tenue">
                      {fila.tenant.nombre} · {fecha(fila.creadoEn)}
                    </span>
                  </span>
                  <Etiqueta tono={fila.verificado ? 'verde' : 'ambar'}>{fila.verificado ? 'Verificado' : 'Pendiente'}</Etiqueta>
                  {dueno && (
                    <button
                      type="button"
                      aria-label="Quitar dominio"
                      onClick={() =>
                        void confirmar({ titulo: `¿Quitar ${fila.dominio}?`, mensaje: 'La tienda deja de verse en ese dominio.', confirmar: 'Quitar', peligro: true }).then(
                          async (ok) => {
                            if (!ok) return
                            await quitarDominio(fila.id)
                            setDominios((lista) => lista?.filter((otro) => otro.id !== fila.id) ?? null)
                          },
                        )
                      }
                      className="grid h-8 w-8 place-items-center text-sitio-tenue hover:text-sitio-rojo"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Desplegable>

        {dueno && (
          <Desplegable titulo="Respaldo de la base de datos" resumen="Descarga .sql">
            <p className="mb-4 text-[13px] text-sitio-tenue">
              Una copia completa de la base de datos (tiendas, productos, pedidos, pagos). Guárdala en un lugar seguro: tiene datos personales.
            </p>
            <BotonPanel
              onClick={() =>
                void descargar('/respaldo', `mitienda-respaldo-${new Date().toISOString().slice(0, 10)}.sql`)
                  .then(() => setNota('Respaldo descargado.'))
                  .catch(fallar)
              }
            >
              <Database aria-hidden="true" className="h-3.5 w-3.5" />
              Descargar respaldo
            </BotonPanel>
          </Desplegable>
        )}
      </div>
    </>
  )
}
