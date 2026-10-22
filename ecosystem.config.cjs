/**
 * Procesos de Mi Tienda en el VPS, gestionados por PM2 (sin Docker).
 *
 *   pm2 start ecosystem.config.cjs && pm2 save     primera vez
 *   pm2 reload ecosystem.config.cjs --update-env   lo hace el deploy en cada push
 *   pm2 logs mitienda-api                           ver registros
 *
 * Puertos (sólo escuchan en 127.0.0.1; afuera habla nginx): los elige
 * deploy/instalar.sh entre los libres y los deja en .mitienda.env. La API toma
 * el suyo de PUERTO en backend/.env.
 *
 * Las variables de entorno se leen de backend/.env y frontend/.env.local, que
 * viven sólo en el servidor y nunca en el repositorio.
 */
const fs = require('node:fs')
const path = require('node:path')

const RAIZ = __dirname

// Puertos y Node que eligió deploy/instalar.sh (archivo sólo del servidor).
const local = {}
try {
  for (const linea of fs.readFileSync(path.join(RAIZ, '.mitienda.env'), 'utf8').split('\n')) {
    const [clave, ...valor] = linea.split('=')
    if (clave && !clave.startsWith('#') && valor.length) local[clave.trim()] = valor.join('=').trim()
  }
} catch {
  // Sin instalador: valores por defecto.
}

const PUERTO_WEB = local.PUERTO_WEB || '4200'
// Node 22 propio de Mi Tienda si el global es más viejo; si no, el global.
const NODE = local.DIR_NODE ? path.join(local.DIR_NODE, 'node') : 'node'

module.exports = {
  apps: [
    {
      name: 'mitienda-api',
      cwd: path.join(RAIZ, 'backend'),
      script: 'dist/servidor.js',
      interpreter: NODE,
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
      interpreter: NODE,
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
      interpreter: NODE,
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
