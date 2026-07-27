/**
 * Procesos de Mi Tienda en el VPS, gestionados por PM2.
 *
 *   pm2 start ecosystem.config.cjs      primera vez
 *   pm2 reload ecosystem.config.cjs     despliegue sin caída (lo usa deploy.yml)
 *   pm2 logs mitienda-api               ver registros
 *
 * Las variables de entorno se leen de los .env de cada carpeta, que viven sólo
 * en el servidor y nunca en el repositorio.
 */
module.exports = {
  apps: [
    {
      name: 'mitienda-api',
      cwd: './backend',
      script: 'dist/servidor.js',
      // Una instancia por núcleo; Express no guarda estado en memoria.
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
      // Da tiempo al apagado ordenado (cerrar colas, Prisma y Redis).
      kill_timeout: 10000,
      wait_ready: false,
    },
    {
      name: 'mitienda-trabajadores',
      cwd: './backend',
      script: 'dist/colas/trabajadores/index.js',
      // Un solo proceso: la concurrencia la controla BullMQ dentro del worker.
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production' },
      kill_timeout: 30000,
    },
    {
      name: 'mitienda-web',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '800M',
      env: { NODE_ENV: 'production', PORT: '3000' },
      kill_timeout: 10000,
    },
  ],
}
