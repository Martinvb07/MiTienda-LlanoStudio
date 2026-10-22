import { crearApp } from './app.js'
import { entorno } from './config/entorno.js'
import { desconectarPrisma } from './config/prisma.js'
import { cerrarRedis } from './config/redis.js'
import { cerrarColas } from './colas/index.js'
import { registro } from './utilidades/registro.js'
import { aplicarVencimientos } from './servicios/suscripciones.servicio.js'

const app = crearApp()

const servidor = app.listen(entorno.PUERTO, entorno.HOST, () => {
  registro.info(
    { puerto: entorno.PUERTO, entorno: entorno.NODE_ENV, dominioBase: entorno.DOMINIO_BASE },
    'API de Mi Tienda escuchando',
  )
})

// Cada hora, las tiendas que pasaron los días de gracia sin pagar vuelven a
// Gratis. La sesión del panel también lo revisa al entrar, así que esto sólo
// cubre a quien no abre el panel.
const revisionVencimientos = setInterval(() => {
  aplicarVencimientos().catch((error: unknown) => registro.error({ err: error }, 'No se pudieron revisar vencimientos'))
}, 60 * 60 * 1000)
revisionVencimientos.unref()

/**
 * Apagado ordenado: PM2 manda SIGINT en cada `pm2 reload`. Dejar de aceptar
 * conexiones nuevas, terminar las que estén en curso y soltar Postgres y Redis
 * evita cortar peticiones de compradores a mitad del despliegue.
 */
async function apagar(senal: string): Promise<void> {
  registro.info({ senal }, 'Apagando la API…')

  servidor.close(() => {
    registro.info('Servidor HTTP cerrado')
  })

  try {
    await cerrarColas()
    await desconectarPrisma()
    await cerrarRedis()
  } catch (error) {
    registro.error({ err: error }, 'Error durante el apagado')
  }

  process.exit(0)
}

process.on('SIGTERM', () => void apagar('SIGTERM'))
process.on('SIGINT', () => void apagar('SIGINT'))
