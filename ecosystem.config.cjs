/**
 * Procesos de Mi Tienda en el VPS, gestionados por PM2 (sin Docker).
 *
 *   pm2 start ecosystem.config.cjs && pm2 save     primera vez
 *   pm2 reload ecosystem.config.cjs --update-env   lo hace el deploy en cada push
 *   pm2 logs mitienda-api                           ver registros
 *
 * Puertos (sólo escuchan en 127.0.0.1; afuera habla nginx):
 *   mitienda-web  4100  Next: web de Mi Tienda, panel y tiendas
 *   mitienda-api  4101  API de Express (PUERTO en backend/.env)
 * Se eligen lejos del 3001 de la API de Llano Studio, que vive en el mismo VPS.
 *
 * Las variables de entorno se leen de backend/.env y frontend/.env.local, que
 * viven sólo en el servidor y nunca en el repositorio.
 */
const path = require('node:path')

const RAIZ = __dirname
const PUERTO_WEB = process.env.MITIENDA_PUERTO_WEB || '4100'

module.exports = {
  apps: [
    {
      name: 'mitienda-api',
      cwd: path.join(RAIZ, 'backend'),
      script: 'dist/servidor.js',
      // Express no guarda estado en memoria: se puede subir a 'max' cuando
      // haya tráfico. Para empezar, una instancia deja RAM para lo demás.
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
      // Da tiempo al apagado ordenado (cerrar colas, Prisma y Redis).
      kill_timeout: 10000,
      out_file: path.join(RAIZ, 'logs', 'mitienda-api.out.log'),
      error_file: path.join(RAIZ, 'logs', 'mitienda-api.err.log'),
      time: true,
    },
    {
      name: 'mitienda-trabajadores',
      cwd: path.join(RAIZ, 'backend'),
      script: 'dist/colas/trabajadores/index.js',
      // Un solo proceso: la concurrencia la controla BullMQ dentro del worker.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production' },
      kill_timeout: 30000,
      out_file: path.join(RAIZ, 'logs', 'mitienda-trabajadores.out.log'),
      error_file: path.join(RAIZ, 'logs', 'mitienda-trabajadores.err.log'),
      time: true,
    },
    {
      name: 'mitienda-web',
      cwd: path.join(RAIZ, 'frontend'),
      script: 'node_modules/next/dist/bin/next',
      args: `start --hostname 127.0.0.1 --port ${PUERTO_WEB}`,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '800M',
      env: { NODE_ENV: 'production', PORT: PUERTO_WEB },
      kill_timeout: 10000,
      out_file: path.join(RAIZ, 'logs', 'mitienda-web.out.log'),
      error_file: path.join(RAIZ, 'logs', 'mitienda-web.err.log'),
      time: true,
    },
  ],
}
