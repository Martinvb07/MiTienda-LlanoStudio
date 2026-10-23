# Mi Sitio en el VPS (Ubuntu + nginx + PM2, sin Docker)

```
Internet ─HTTPS─► nginx ─┬─ llanostudio.co, www ───► sitio de Llano Studio (ya existe, no se toca)
                         └─ misitio.llanostudio.co ─┐
                            *.llanostudio.co ────────┤
                                                     ├─ /api/...  ──► mitienda-api  127.0.0.1:<libre> (Express, PM2)
                                                     └─ lo demás ──► mitienda-web  127.0.0.1:<libre> (Next, PM2)
                                                                       │
                                     PostgreSQL (datos) ◄──────────────┤
                                     Redis (colas)      ◄──────────────┘
```

- `misitio.llanostudio.co` → web de Mi Sitio, panel (`/panel`) y tu admin (`/panel/admin`).
- `cualquiercosa.llanostudio.co` → la tienda con ese subdominio. **No hay que crear nada por tienda**:
  un solo registro DNS comodín y un certificado comodín cubren todas.

Carpeta en el VPS: `/var/www/llanostudio/sitios/mitienda`

---

## Instalación en un comando

```bash
cd /var/www/llanostudio/sitios
git clone https://github.com/Martinvb07/MiTienda-LlanoStudio.git mitienda
cd mitienda && sudo bash deploy/instalar.sh
```

Te pregunta el dominio (`llanostudio.co`), el subdominio del panel (`mitienda`), tu correo y la
contraseña de tu panel de admin. Hace todo lo demás:

- Instala lo que falte: PostgreSQL, Redis, nginx y certbot.
- **Busca puertos libres** desde el 4200 y no toca los que ya usas.
- Si tu Node global es menor a 22, baja un Node 22 **aparte**, en `/opt/mitienda-node`, solo
  para Mi Sitio. Tus otras apps siguen con el suyo.
- Crea la base de datos, `backend/.env` y `frontend/.env.local` con claves al azar.
- Construye, arranca todo en PM2 y crea el sitio `mitienda` en nginx sin editar los tuyos.
- Saca el HTTPS de `misitio.llanostudio.co` si el DNS ya apunta al VPS.

Se puede volver a correr cuando quieras: conserva las claves y la base de datos.
Para una tienda de prueba con HTTPS desde ya: `SUBDOMINIOS_PRUEBA="prueba" sudo -E bash deploy/instalar.sh`.

Lo único manual es el DNS (paso 1) y, más adelante, el certificado comodín para todas las tiendas
(paso 7). Los pasos 2 a 6 de abajo explican lo que hace el instalador, por si quieres hacerlo a mano.

## 1. DNS en Namecheap (una vez)

*Domain List → llanostudio.co → Advanced DNS → Add new record*:

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| A Record | `*` | `31.220.52.31` | Automatic |

Con eso, `misitio.llanostudio.co`, `cafe.llanostudio.co` y cualquier otro subdominio llegan al VPS.
Los registros que ya tienes (`@`, `www`, los TXT del correo) se quedan igual: un registro exacto
siempre gana sobre el comodín.

Comprueba (tarda unos minutos): `dig +short prueba.llanostudio.co` → debe responder `31.220.52.31`.

## 2. Puertos libres

El instalador los elige solo. Para verlos tú:

```bash
for p in $(seq 4200 4300); do ss -ltn | awk '{print $4}' | grep -qE "[:.]$p$" || echo "$p libre"; done | head
```

Quedan anotados en `.mitienda.env` (raíz del proyecto, sólo en el servidor), que leen PM2 y el deploy.

## 3. Node 22, PostgreSQL y Redis (sin Docker)

```bash
node -v            # Mi Sitio pide Node 22 o más
# Si sale v20:  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
# (el sitio de Llano Studio corre igual en Node 22; después: pm2 update)

sudo apt update && sudo apt install -y postgresql redis-server
sudo systemctl enable --now postgresql redis-server

# Base de datos y usuario propios (cambia la clave)
sudo -u postgres psql -c "CREATE USER mitienda WITH PASSWORD 'una-clave-larga';"
sudo -u postgres psql -c "CREATE DATABASE mitienda OWNER mitienda;"
```

Redis queda escuchando sólo en `127.0.0.1` por defecto; no hace falta abrir nada.

Si el VPS tiene poca RAM (2 GB o menos), el build de Next puede quedarse sin memoria. Un swap de 2 GB lo evita:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 4. Código y variables (una vez)

```bash
cd /var/www/llanostudio/sitios
git clone https://github.com/Martinvb07/MiTienda-LlanoStudio.git mitienda
cd mitienda
```

`backend/.env` (`chmod 600 backend/.env`):

```bash
NODE_ENV=production
PUERTO=4201
DATABASE_URL="postgresql://mitienda:una-clave-larga@localhost:5432/mitienda?schema=public"
REDIS_URL="redis://localhost:6379"
DOMINIO_BASE="llanostudio.co"
SUBDOMINIO_PANEL="misitio"
JWT_SECRETO="pega-aqui-el-resultado-de: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
ORIGENES_PERMITIDOS="https://misitio.llanostudio.co"
TOKEN_INTERNO="otra-cadena-larga-al-azar"
# Tu acceso a /panel/admin (paso 5)
ADMIN_CORREO="martindavidvb@gmail.com"
ADMIN_CONTRASENA_HASH='...'
# Cloudflare R2: vacío = las fotos se guardan en backend/.medios (bien para probar)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET=""
R2_URL_PUBLICA=""
```

`frontend/.env.local`:

```bash
URL_API="http://127.0.0.1:4201"
MITIENDA_TOKEN_INTERNO="la-misma-cadena-que-TOKEN_INTERNO"
NEXT_PUBLIC_DOMINIO_BASE="llanostudio.co"
NEXT_PUBLIC_SUBDOMINIO_PANEL="misitio"
```

## 5. Contraseña de tu panel de admin

```bash
cd backend && npm ci
npm run admin:clave -- "una-contraseña-de-al-menos-12-caracteres"
```

Copia la línea `ADMIN_CONTRASENA_HASH='...'` que imprime y pégala en `backend/.env` (con las comillas simples).

## 6. Primera construcción, base de datos y PM2

```bash
cd /var/www/llanostudio/sitios/mitienda
(cd backend && npx prisma generate && npx prisma migrate deploy && npx tsc -p tsconfig.build.json)
(cd frontend && npm ci && npm run build)
mkdir -p logs
pm2 start ecosystem.config.cjs && pm2 save
pm2 startup        # sólo si nunca lo hiciste: ejecuta el comando que muestra

curl -s http://127.0.0.1:4201/api/salud/detallada   # {"estado":"ok",...postgres ok, redis ok}
```

## 7. nginx y HTTPS para los subdominios

Un certificado comodín (`*.llanostudio.co`) sólo se puede validar por DNS. Hay dos caminos:

**A. Para probar ya (renovación manual cada 90 días):**

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d '*.llanostudio.co' --cert-name llanostudio.co-comodin
```

Certbot te muestra un valor: créalo en Namecheap como **TXT Record**, host `_acme-challenge`, espera
1–2 minutos (`dig +short TXT _acme-challenge.llanostudio.co` debe mostrarlo) y presiona Enter.
Después puedes borrar ese TXT.

**B. Definitivo (se renueva solo):** pasar los DNS de llanostudio.co a Cloudflare (gratis; en Namecheap
sólo cambias los *nameservers*, y Cloudflare copia tus registros) y usar el plugin:

```bash
sudo apt install -y python3-certbot-dns-cloudflare
# /root/.secrets/cloudflare.ini (chmod 600):  dns_cloudflare_api_token = <token con permiso Zone:DNS:Edit>
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d '*.llanostudio.co' --cert-name llanostudio.co-comodin
```

Con el certificado listo, vuelve a correr `sudo bash deploy/instalar.sh`: detecta el comodín y pasa
todas las tiendas a HTTPS. (Si prefieres hacerlo a mano, `deploy/nginx-mitienda.conf` es la plantilla:
ajusta en ella los puertos de `.mitienda.env`.)

nginx atiende primero los nombres exactos (`llanostudio.co`, `www`) con su configuración actual, y sólo lo
demás cae en el comodín de Mi Sitio: tu sitio no cambia.

Prueba: abre `https://misitio.llanostudio.co`, crea una tienda, publícala y visítala en su subdominio.

## 8. Deploy automático con cada push (igual que Llano Studio)

En el VPS, una llave sólo para el deploy:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy_mitienda -N "" -C "deploy-mitienda"
cat ~/.ssh/github_deploy_mitienda.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy_mitienda      # la PRIVADA: va a GitHub
```

En GitHub → **MiTienda-LlanoStudio** → *Settings → Environments → New environment* `produccion` → secretos:

| Secreto | Valor |
|---|---|
| `VPS_SSH_KEY` | la llave privada completa (con BEGIN/END) |
| `VPS_HOST` | `31.220.52.31` |
| `VPS_USER` | el usuario del VPS que corre PM2 |
| `VPS_PATH` | `/var/www/llanostudio/sitios/mitienda` |

Desde ahí, cada push a `main` que pase el CI se despliega solo: el VPS baja esa versión, instala, construye
y recarga PM2. Si la API o la web no responden, **vuelve sola a la versión anterior**. También se lanza a
mano en *Actions → CI y Deploy a VPS → Run workflow*.

**Migraciones:** el deploy no las aplica solo (una migración mala sobre datos reales no se deshace volviendo
de versión); si hay pendientes, lo avisa en el log. Para aplicarlas:

```bash
cd /var/www/llanostudio/sitios/mitienda/backend
pg_dump -U mitienda -h localhost mitienda > ~/mitienda-respaldos/bd-$(date +%F).sql
npx prisma migrate deploy && pm2 reload mitienda-api
```

## Útiles

| Para | Comando |
|---|---|
| Estado de los procesos | `pm2 status` |
| Registros | `pm2 logs mitienda-api` · `pm2 logs mitienda-web` |
| Reiniciar | `pm2 reload ecosystem.config.cjs --update-env` |
| Salud de la API | `curl -s 127.0.0.1:4201/api/salud/detallada` |
| Respaldo de la base | `pg_dump -U mitienda -h localhost mitienda > respaldo.sql` |
| Respaldo de fotos | `tar -czf medios.tgz -C backend .medios` |

## Chat de soporte en vivo (websocket)

El chat usa socket.io bajo `/api/tiempo-real`. Funciona aunque nginx no deje
pasar el websocket (cae a *polling*), pero va más fluido con este bloque dentro
del `server` de `misitio.llanostudio.co`, **antes** de `location /api/`:

```nginx
location /api/tiempo-real {
    proxy_pass http://mitienda_api;   # o http://127.0.0.1:<PUERTO_API>
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
}
```

Luego `nginx -t && systemctl reload nginx`. Si algún día la API corre con más
de una instancia en PM2, el chat necesita *sticky sessions* (o un adaptador de
Redis para socket.io).

## Actualizar el VPS con un solo comando

```bash
cd /var/www/llanostudio/sitios/mitienda
sudo bash deploy/actualizar-vps.sh
```

Trae lo último de `main`, instala lo que falte (pg_dump, certbot), completa
`backend/.env` sin pisar lo que ya tienes, saca un respaldo de la base de datos
en `/var/backups/mitienda`, migra, construye, agrega el bloque del chat a nginx,
programa los dominios propios con HTTPS y recarga PM2. Se puede correr las veces
que quieras.

## Dominios propios (www.tutienda.com)

`deploy/dominios-propios.sh` corre cada 5 minutos (lo programa el comando de
arriba en `/etc/cron.d/mitienda-dominios`). Toma los dominios verificados de las
tiendas con plan Negocio o Pro, les crea el sitio en
`/etc/nginx/sites-available/mitienda-dominios.conf` y les saca el certificado
con certbot. Para ver qué está haciendo:

```bash
sudo bash deploy/dominios-propios.sh --ver
tail -f /var/log/mitienda-dominios.log
```
