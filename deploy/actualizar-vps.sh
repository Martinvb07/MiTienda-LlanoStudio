#!/usr/bin/env bash
#
# Pone el VPS al día con todo lo nuevo de Mi Sitio, en un solo comando:
#
#   cd /var/www/llanostudio/sitios/mitienda
#   sudo bash deploy/actualizar-vps.sh
#
# Qué hace (y se puede correr las veces que quieras: lo que ya está, lo salta):
#   1. Trae lo último de main (sólo si no hay cambios locales).
#   2. Instala lo que falte del sistema: pg_dump (respaldos) y certbot.
#   3. Completa backend/.env con las variables nuevas sin tocar las que ya
#      tienes (TOKEN_INTERNO, CLAVE_CIFRADO, Bold, SMTP).
#   4. Saca un respaldo de la base de datos ANTES de migrar.
#   5. Instala dependencias, aplica las migraciones y construye.
#   6. nginx: agrega el bloque del chat en vivo (websocket) si no está.
#   7. Programa cada 5 minutos el script de dominios propios (HTTPS).
#   8. Recarga PM2 y comprueba que la API y la web respondan.
#
# Si algo falla, se detiene y te dice en qué paso; los respaldos quedan en
# /var/backups/mitienda.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL="$RAIZ/.mitienda.env"
ENV_BACK="$RAIZ/backend/.env"
ENV_FRONT="$RAIZ/frontend/.env.local"
RESPALDOS="/var/backups/mitienda"
SITIO_NGINX="/etc/nginx/sites-available/mitienda"

verde() { printf '\033[32m✓ %s\033[0m\n' "$*"; }
ambar() { printf '\033[33m! %s\033[0m\n' "$*"; }
paso() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }
falla() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
trap 'falla "Se detuvo en la línea $LINENO. Revisa el mensaje de arriba; nada quedó a medias en PM2."' ERR

leer_env() { (grep -E "^$2=" "$1" 2>/dev/null || true) | tail -1 | cut -d= -f2- | tr -d "\"'\r"; }
# Agrega CLAVE="valor" al archivo sólo si la clave no existe todavía.
agregar_env() {
  local archivo="$1" clave="$2" valor="$3"
  if grep -qE "^$clave=" "$archivo" 2>/dev/null; then return 1; fi
  printf '%s="%s"\n' "$clave" "$valor" >> "$archivo"
  return 0
}

[ "$(id -u)" -eq 0 ] || falla "Córrelo con sudo: sudo bash deploy/actualizar-vps.sh"
[ -f "$LOCAL" ] || falla "No encuentro $LOCAL. ¿Mi Sitio se instaló con deploy/instalar.sh en esta carpeta?"
[ -f "$ENV_BACK" ] || falla "No encuentro $ENV_BACK."
cd "$RAIZ"

DIR_NODE="$(leer_env "$LOCAL" DIR_NODE)"
[ -n "$DIR_NODE" ] && export PATH="$DIR_NODE:$PATH"
PUERTO_API="$(leer_env "$LOCAL" PUERTO_API)"
PUERTO_WEB="$(leer_env "$LOCAL" PUERTO_WEB)"
DOMINIO="$(leer_env "$LOCAL" DOMINIO)"
PANEL="$(leer_env "$LOCAL" PANEL)"
DOMINIO="${DOMINIO:-llanostudio.co}"
PANEL="${PANEL:-misitio}"

# ─────────────────────────────────────────────────────────────────────────────
paso "1/8 · Código"
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  ambar "Hay cambios locales en el código: no traigo nada nuevo y sigo con lo que hay."
else
  git fetch --quiet origin main
  git merge --ff-only --quiet origin/main && verde "Al día con main ($(git rev-parse --short HEAD))." \
    || ambar "No se pudo avanzar main sin conflictos; sigo con $(git rev-parse --short HEAD)."
fi

# ─────────────────────────────────────────────────────────────────────────────
paso "2/8 · Paquetes del sistema"
# ─────────────────────────────────────────────────────────────────────────────
FALTAN=()
command -v pg_dump >/dev/null || FALTAN+=(postgresql-client)
command -v certbot >/dev/null || FALTAN+=(certbot)
command -v curl >/dev/null || FALTAN+=(curl)
if [ "${#FALTAN[@]}" -gt 0 ]; then
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${FALTAN[@]}" >/dev/null
  verde "Instalado: ${FALTAN[*]}"
else
  verde "pg_dump, certbot y curl ya están."
fi

# ─────────────────────────────────────────────────────────────────────────────
paso "3/8 · Variables de entorno nuevas"
# ─────────────────────────────────────────────────────────────────────────────
cp "$ENV_BACK" "$ENV_BACK.antes-de-actualizar"
TOKEN="$(leer_env "$ENV_BACK" TOKEN_INTERNO)"
if [ -z "$TOKEN" ]; then
  TOKEN="$(openssl rand -hex 24)"
  sed -i '/^TOKEN_INTERNO=/d' "$ENV_BACK"
  agregar_env "$ENV_BACK" TOKEN_INTERNO "$TOKEN" || true
  verde "TOKEN_INTERNO creado."
fi
# El frontend usa el mismo token para hablar con la API.
if [ -f "$ENV_FRONT" ] && [ "$(leer_env "$ENV_FRONT" MITIENDA_TOKEN_INTERNO)" != "$TOKEN" ]; then
  sed -i '/^MITIENDA_TOKEN_INTERNO=/d' "$ENV_FRONT"
  agregar_env "$ENV_FRONT" MITIENDA_TOKEN_INTERNO "$TOKEN" || true
  verde "frontend/.env.local alineado con el token de la API."
fi
# Cifra las llaves de Wompi/ePayco/Bold de las tiendas. NUNCA la cambies después.
if agregar_env "$ENV_BACK" CLAVE_CIFRADO "$(openssl rand -hex 32)"; then
  verde "CLAVE_CIFRADO creada (guárdala: si se pierde, las tiendas deben volver a pegar sus llaves)."
fi
for clave in BOLD_LLAVE_IDENTIDAD BOLD_LLAVE_SECRETA URL_PANEL SMTP_HOST SMTP_USUARIO SMTP_CLAVE; do
  if agregar_env "$ENV_BACK" "$clave" ""; then ambar "$clave agregada vacía: llénala en backend/.env cuando la tengas."; fi
done
agregar_env "$ENV_BACK" SMTP_PUERTO "465" || true
agregar_env "$ENV_BACK" CORREO_REMITENTE "Mi Sitio <hola@$DOMINIO>" || true
chmod 600 "$ENV_BACK"
verde "backend/.env completo (copia del anterior en backend/.env.antes-de-actualizar)."

# ─────────────────────────────────────────────────────────────────────────────
paso "4/8 · Respaldo de la base de datos"
# ─────────────────────────────────────────────────────────────────────────────
mkdir -p "$RESPALDOS" && chmod 700 "$RESPALDOS"
URL_BD="$(leer_env "$ENV_BACK" DATABASE_URL)"
URL_BD="${URL_BD%%\?*}"
ARCHIVO="$RESPALDOS/antes-de-actualizar-$(date +%Y%m%d-%H%M).sql.gz"
if pg_dump --no-owner --no-privileges "$URL_BD" | gzip > "$ARCHIVO"; then
  verde "Respaldo en $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))."
  # Se guardan los últimos 10.
  ls -1t "$RESPALDOS"/antes-de-actualizar-*.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
else
  rm -f "$ARCHIVO"
  falla "No se pudo sacar el respaldo; no migro sin respaldo."
fi

# ─────────────────────────────────────────────────────────────────────────────
paso "5/8 · Dependencias, migraciones y build"
# ─────────────────────────────────────────────────────────────────────────────
(
  cd backend
  npm ci --no-audit --no-fund --loglevel=error
  npx prisma generate >/dev/null
  npx prisma migrate deploy
  npx tsc -p tsconfig.build.json
)
verde "API lista y base de datos migrada."
(
  cd frontend
  npm ci --no-audit --no-fund --loglevel=error
  npm run build >/tmp/mitienda-build.log 2>&1 || { tail -40 /tmp/mitienda-build.log; exit 1; }
)
verde "Web construida."

# ─────────────────────────────────────────────────────────────────────────────
paso "6/8 · nginx (chat en vivo)"
# ─────────────────────────────────────────────────────────────────────────────
if [ ! -f "$SITIO_NGINX" ]; then
  ambar "No encuentro $SITIO_NGINX: agrega a mano el bloque de deploy/LEEME-VPS.md (sección Chat de soporte)."
elif grep -q "tiempo-real" "$SITIO_NGINX"; then
  verde "El bloque del chat ya está."
else
  cp "$SITIO_NGINX" "$SITIO_NGINX.antes-de-actualizar"
  # Antes de cada "location /api/ {" se mete el bloque del websocket, usando el
  # mismo destino (proxy_pass) que ya tiene la API en ese server.
  python3 - "$SITIO_NGINX" <<'PY'
import re, sys
ruta = sys.argv[1]
texto = open(ruta).read()
salida, pos = [], 0
for m in re.finditer(r'^([ \t]*)location /api/ \{', texto, re.M):
    destino = re.search(r'proxy_pass\s+([^;]+);', texto[m.end():])
    if not destino:
        continue
    sangria = m.group(1)
    bloque = (
        f"{sangria}location /api/tiempo-real {{\n"
        f"{sangria}    proxy_pass {destino.group(1).strip()};\n"
        f"{sangria}    proxy_http_version 1.1;\n"
        f"{sangria}    proxy_set_header Upgrade $http_upgrade;\n"
        f"{sangria}    proxy_set_header Connection \"upgrade\";\n"
        f"{sangria}    proxy_set_header Host $host;\n"
        f"{sangria}    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
        f"{sangria}    proxy_set_header X-Forwarded-Proto $scheme;\n"
        f"{sangria}    proxy_read_timeout 3600s;\n"
        f"{sangria}}}\n"
    )
    salida.append(texto[pos:m.start()])
    salida.append(bloque)
    pos = m.start()
salida.append(texto[pos:])
open(ruta, 'w').write(''.join(salida))
PY
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    verde "Bloque del chat agregado y nginx recargado."
  else
    cp "$SITIO_NGINX.antes-de-actualizar" "$SITIO_NGINX"
    nginx -t || true
    ambar "nginx no aceptó el cambio; dejé el archivo como estaba. El chat sigue funcionando (más lento)."
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
paso "7/8 · Dominios propios con HTTPS automático"
# ─────────────────────────────────────────────────────────────────────────────
chmod +x "$RAIZ/deploy/dominios-propios.sh"
cat > /etc/cron.d/mitienda-dominios <<CRON
# Mi Sitio: sitio en nginx y certificado HTTPS para cada dominio propio verificado.
*/5 * * * * root bash $RAIZ/deploy/dominios-propios.sh >> /var/log/mitienda-dominios.log 2>&1
CRON
chmod 644 /etc/cron.d/mitienda-dominios
verde "Programado cada 5 minutos (registro en /var/log/mitienda-dominios.log)."

# ─────────────────────────────────────────────────────────────────────────────
paso "8/8 · Reinicio y comprobación"
# ─────────────────────────────────────────────────────────────────────────────
if pm2 describe mitienda-web >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env >/dev/null
else
  pm2 start ecosystem.config.cjs >/dev/null
fi
pm2 save >/dev/null
for intento in $(seq 1 20); do
  api=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$PUERTO_API/api/salud" || echo 000)
  web=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 -H "Host: $PANEL.$DOMINIO" "http://127.0.0.1:$PUERTO_WEB/" || echo 000)
  if [ "$api" = 200 ] && [ "$web" = 200 ]; then break; fi
  [ "$intento" -eq 20 ] && { pm2 logs mitienda-api --lines 30 --nostream; falla "La API ($api) o la web ($web) no responden."; }
  sleep 3
done
verde "API y web respondiendo."
bash "$RAIZ/deploy/dominios-propios.sh" >/dev/null 2>&1 || true

trap - ERR
echo
printf '\033[32m════════════════════════════════════════════════════════\033[0m\n'
printf '\033[32m Mi Sitio actualizado (%s)\033[0m\n' "$(git rev-parse --short HEAD)"
printf '   Admin:     https://%s.%s/panel/admin\n' "$PANEL" "$DOMINIO"
printf '   Respaldo:  %s\n' "$ARCHIVO"
[ -z "$(leer_env "$ENV_BACK" BOLD_LLAVE_IDENTIDAD)" ] && printf '   Falta:     llaves de Bold en backend/.env (cobro de planes)\n'
[ -z "$(leer_env "$ENV_BACK" SMTP_HOST)" ] && printf '   Opcional:  SMTP en backend/.env para los correos automáticos\n'
printf '   Si cambias backend/.env:  pm2 reload mitienda-api --update-env\n'
printf '\033[32m════════════════════════════════════════════════════════\033[0m\n'
