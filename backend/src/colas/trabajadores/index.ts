import type { Worker } from 'bullmq'
import { registro } from '../../utilidades/registro.js'
import { desconectarPrisma } from '../../config/prisma.js'
import { crearTrabajadorImagenes } from './imagenes.trabajador.js'

/**
 * Punto de entrada del proceso de trabajadores.
 *
 * Corre aparte de la API (`pm2 start ... --name mitienda-trabajadores`) para
 * que una tanda de imágenes pesadas no consuma el bucle de eventos que atiende
 * a los compradores.
 */
const trabajadores: Worker[] = [crearTrabajadorImagenes()]

registro.info({ cantidad: trabajadores.length }, 'Trabajadores en marcha')

async function apagar(senal: string): Promise<void> {
  registro.info({ senal }, 'Apagando trabajadores…')
  // close() espera a que terminen los trabajos en curso antes de soltar.
  await Promise.all(trabajadores.map((trabajador) => trabajador.close()))
  await desconectarPrisma()
  process.exit(0)
}

process.on('SIGTERM', () => void apagar('SIGTERM'))
process.on('SIGINT', () => void apagar('SIGINT'))
