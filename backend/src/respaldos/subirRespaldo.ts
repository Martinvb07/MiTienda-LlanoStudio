/**
 * Sube a R2 los archivos de respaldo que le pasan (lo llama deploy/respaldar.sh):
 *
 *   node dist/respaldos/subirRespaldo.js /var/backups/mitienda/diarios/bd-….sql.gz
 *
 * Van al bucket R2_BUCKET_RESPALDOS, que debe ser privado y distinto del de las
 * fotos (ese es público). Para que se borren solos los viejos, configura en
 * Cloudflare una regla de ciclo de vida sobre el prefijo respaldos/.
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { entorno } from '../config/entorno.js'
import { obtenerClienteR2 } from '../almacenamiento/r2.js'

const archivos = process.argv.slice(2)
if (!entorno.R2_BUCKET_RESPALDOS) {
  console.error('Falta R2_BUCKET_RESPALDOS en backend/.env')
  process.exit(1)
}
if (archivos.length === 0) {
  console.error('Uso: node dist/respaldos/subirRespaldo.js <archivo> [<archivo>…]')
  process.exit(1)
}

const cliente = obtenerClienteR2()
for (const archivo of archivos) {
  const { size } = await stat(archivo)
  const clave = `respaldos/${path.basename(path.dirname(archivo))}/${path.basename(archivo)}`
  await cliente.send(
    new PutObjectCommand({
      Bucket: entorno.R2_BUCKET_RESPALDOS,
      Key: clave,
      Body: createReadStream(archivo),
      ContentLength: size,
      ContentType: 'application/gzip',
    }),
  )
  console.warn(`Subido ${clave} (${(size / 1_048_576).toFixed(1)} MB)`)
}
