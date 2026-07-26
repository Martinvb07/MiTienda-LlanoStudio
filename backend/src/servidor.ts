import { crearApp } from './app.js'
import { entorno } from './config/entorno.js'
import { desconectarPrisma } from './config/prisma.js'
import { cerrarRedis } from './config/redis.js'
import { cerrarColas } from './colas/index.js'
import { registro } from './utilidades/registro.js'

const app = crearApp()

const servidor = app.listen(entorno.PUERTO, () => {
  registro.info(
    { puerto: entorno.PUERTO, entorno: entorno.NODE_ENV, dominioBase: entorno.DOMINIO_BASE },
    'API de MiTienda escuchando',
  )
})

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
