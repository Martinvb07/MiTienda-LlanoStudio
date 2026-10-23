#!/usr/bin/env bash
#
# Instalador de Mi Sitio en un VPS Ubuntu (sin Docker).
#
#   cd /var/www/llanostudio/sitios
#   git clone https://github.com/Martinvb07/MiTienda-LlanoStudio.git mitienda
#   cd mitienda && sudo bash deploy/instalar.sh
#
# Deja todo andando: PostgreSQL, Redis, nginx, certificados, variables de
# entorno, base de datos, build y PM2. Se puede volver a correr cuando
# quieras: lo que ya existe (.env, base de datos, contraseñas) no se pisa.
#
# No toca lo que ya tengas en el VPS:
#   - Busca puertos libres (desde el 4200) en vez de asumir unos fijos.
#   - Si el Node global es menor a 22, baja un Node 22 aparte en
#     /opt/mitienda-node sólo para Mi Sitio; el global sigue igual.
#   - Crea su propio archivo de nginx; no edita los de tus otros sitios.
#
# Variables opcionales para no responder preguntas:
#   DOMINIO=llanostudio.co PANEL=misitio CORREO=tu@correo.com \
#   ADMIN_CONTRASENA='...' SUBDOMINIOS_PRUEBA="prueba" sudo -E bash deploy/instalar.sh

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL="$RAIZ/.mitienda.env"
NODE_PROPIO="/opt/mitienda-node"
VERSION_NODE="22.12.0"

verde() { printf '\033[32m%s\033[0m\n' "$*"; }
ambar() { printf '\033[33m%s\033[0m\n' "$*"; }
paso() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }
falla() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || falla "Córrelo con sudo: sudo bash deploy/instalar.sh"
command -v apt-get >/dev/null || falla "Este instalador es para Ubuntu/Debian (apt)."

preguntar() { # preguntar VARIABLE "texto" "por defecto"
  local nombre="$1" texto="$2" defecto="${3:-}" valor="${!1:-}"
  if [ -z "$valor" ]; then
    read -r -p "$texto${defecto:+ [$defecto]}: " valor </dev/tty || true
    valor="${valor:-$defecto}"
  fi
  printf -v "$nombre" '%s' "$valor"
}

azar() { openssl rand -hex "${1:-24}"; }

# Lee una variable de un archivo .env (sin comillas).
leer_env() { (grep -E "^$2=" "$1" 2>/dev/null || true) | tail -1 | cut -d= -f2- | tr -d "\"'\r"; }

# ─────────────────────────────────────────────────────────────────────────────
paso "Datos de la instalación"
# ─────────────────────────────────────────────────────────────────────────────

if [ -f "$LOCAL" ]; then
  DOMINIO="${DOMINIO:-$(leer_env "$LOCAL" DOMINIO)}"
  PANEL="${PANEL:-$(leer_env "$LOCAL" PANEL)}"
  CORREO="${CORREO:-$(leer_env "$LOCAL" CORREO)}"
fi
preguntar DOMINIO "Dominio base de las tiendas" "llanostudio.co"
preguntar PANEL "Subdominio de la web y el panel" "misitio"
preguntar CORREO "Tu correo (admin de la plataforma y avisos de certificados)" ""
[ -n "$CORREO" ] || falla "Hace falta un correo."
HOST_PANEL="$PANEL.$DOMINIO"
verde "Web y panel en https://$HOST_PANEL · tiendas en https://<tienda>.$DOMINIO"

# ─────────────────────────────────────────────────────────────────────────────
paso "Paquetes del sistema (PostgreSQL, Redis, nginx, certbot)"
# ─────────────────────────────────────────────────────────────────────────────

FALTAN=()
for paquete in postgresql redis-server nginx certbot python3-certbot-nginx curl openssl xz-utils dnsutils; do
  dpkg -s "$paquete" >/dev/null 2>&1 || FALTAN+=("$paquete")
done
if [ ${#FALTAN[@]} -gt 0 ]; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${FALTAN[@]}"
fi
systemctl enable --now postgresql redis-server nginx >/dev/null 2>&1
verde "Listos."

# Memoria: el build de Next necesita aire. Sin swap y con poca RAM, se crea uno.
RAM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$RAM_MB" -lt 3000 ] && ! swapon --show | grep -q .; then
  ambar "Poca RAM ($RAM_MB MB) y sin swap: creando /swapfile de 2 GB para el build."
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ─────────────────────────────────────────────────────────────────────────────
paso "Node 22 y PM2"
# ─────────────────────────────────────────────────────────────────────────────

MAYOR_GLOBAL=$( (node -v 2>/dev/null || echo v0) | sed 's/^v//; s/\..*//')
if [ "$MAYOR_GLOBAL" -ge 22 ]; then
  DIR_NODE="$(dirname "$(command -v node)")"
  verde "Node global $(node -v): se usa ese."
else
  if [ ! -x "$NODE_PROPIO/bin/node" ]; then
    ambar "Node global es v${MAYOR_GLOBAL}: se baja Node $VERSION_NODE sólo para Mi Sitio (el global no cambia)."
    ARQ=$(uname -m); case "$ARQ" in x86_64) ARQ=x64 ;; aarch64) ARQ=arm64 ;; esac
    curl -fsSL "https://nodejs.org/dist/v$VERSION_NODE/node-v$VERSION_NODE-linux-$ARQ.tar.xz" -o /tmp/node.tar.xz
    mkdir -p "$NODE_PROPIO" && tar -xJf /tmp/node.tar.xz -C "$NODE_PROPIO" --strip-components=1 && rm /tmp/node.tar.xz
  fi
  DIR_NODE="$NODE_PROPIO/bin"
  verde "Mi Sitio usará $("$DIR_NODE/node" -v) desde $NODE_PROPIO."
fi
export PATH="$DIR_NODE:$PATH"

if ! command -v pm2 >/dev/null; then
  npm install -g pm2 >/dev/null
fi
verde "PM2 $(pm2 -v)."

# ─────────────────────────────────────────────────────────────────────────────
paso "Puertos"
# ─────────────────────────────────────────────────────────────────────────────

ocupado() { ss -ltn | awk '{print $4}' | grep -qE "[:.]$1\$"; }
libre_desde() {
  local puerto="$1"
  while ocupado "$puerto" || [ "$puerto" = "${2:-}" ]; do puerto=$((puerto + 1)); done
  echo "$puerto"
}

PUERTO_WEB="$(leer_env "$LOCAL" PUERTO_WEB)"
PUERTO_API="$(leer_env "$LOCAL" PUERTO_API)"
# Si ya estaban asignados y los usa PM2 (Mi Sitio corriendo), se respetan.
if [ -z "$PUERTO_WEB" ] || { ocupado "$PUERTO_WEB" && ! pm2 describe mitienda-web >/dev/null 2>&1; }; then
  PUERTO_WEB="$(libre_desde 4200)"
fi
if [ -z "$PUERTO_API" ] || { ocupado "$PUERTO_API" && ! pm2 describe mitienda-api >/dev/null 2>&1; }; then
  PUERTO_API="$(libre_desde $((PUERTO_WEB + 1)) "$PUERTO_WEB")"
fi
verde "Web en 127.0.0.1:$PUERTO_WEB · API en 127.0.0.1:$PUERTO_API"

cat > "$LOCAL" <<EOF
# Generado por deploy/instalar.sh — lo leen PM2 (ecosystem.config.cjs) y el deploy.
DOMINIO=$DOMINIO
PANEL=$PANEL
CORREO=$CORREO
PUERTO_WEB=$PUERTO_WEB
PUERTO_API=$PUERTO_API
DIR_NODE=$DIR_NODE
EOF

# ─────────────────────────────────────────────────────────────────────────────
paso "Base de datos"
# ─────────────────────────────────────────────────────────────────────────────

ENV_BACK="$RAIZ/backend/.env"
CLAVE_BD="$(leer_env "$ENV_BACK" DATABASE_URL | sed -n 's|postgresql://mitienda:\([^@]*\)@.*|\1|p')"
CLAVE_BD="${CLAVE_BD:-$(azar 16)}"

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='mitienda'" | grep -q 1; then
  sudo -u postgres psql -qc "CREATE USER mitienda WITH PASSWORD '$CLAVE_BD';"
else
  sudo -u postgres psql -qc "ALTER USER mitienda WITH PASSWORD '$CLAVE_BD';"
fi
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='mitienda'" | grep -q 1; then
  sudo -u postgres psql -qc "CREATE DATABASE mitienda OWNER mitienda;"
fi
verde "Usuario y base 'mitienda' listos."

# ─────────────────────────────────────────────────────────────────────────────
paso "Variables de entorno"
# ─────────────────────────────────────────────────────────────────────────────

cd "$RAIZ/backend"
npm ci --no-audit --no-fund --loglevel=error

TOKEN_INTERNO="$(leer_env "$ENV_BACK" TOKEN_INTERNO)"; TOKEN_INTERNO="${TOKEN_INTERNO:-$(azar 24)}"
JWT="$(leer_env "$ENV_BACK" JWT_SECRETO)"; JWT="${JWT:-$(azar 32)}"
HASH_ADMIN="$(leer_env "$ENV_BACK" ADMIN_CONTRASENA_HASH)"
if [ -z "$HASH_ADMIN" ]; then
  if [ -z "${ADMIN_CONTRASENA:-}" ]; then
    while true; do
      read -r -s -p "Contraseña para tu panel /panel/admin (mín. 12): " ADMIN_CONTRASENA </dev/tty; echo
      [ ${#ADMIN_CONTRASENA} -ge 12 ] && break
      ambar "Muy corta, prueba otra."
    done
  fi
  HASH_ADMIN="$(npx tsx scripts/clave-admin.ts "$ADMIN_CONTRASENA" 2>&1 | sed -n "s/^ADMIN_CONTRASENA_HASH='\(.*\)'$/\1/p")"
  [ -n "$HASH_ADMIN" ] || falla "No se pudo generar el hash de la contraseña de admin."
fi

# Se reescribe completo con lo que ya había, para que los puertos y el
# dominio siempre coincidan con esta instalación. R2 se conserva si existe.
cat > "$ENV_BACK" <<EOF
NODE_ENV=production
PUERTO=$PUERTO_API
HOST=127.0.0.1
DATABASE_URL="postgresql://mitienda:$CLAVE_BD@localhost:5432/mitienda?schema=public"
REDIS_URL="redis://localhost:6379"
DOMINIO_BASE="$DOMINIO"
SUBDOMINIO_PANEL="$PANEL"
JWT_SECRETO="$JWT"
ORIGENES_PERMITIDOS="https://$HOST_PANEL"
TOKEN_INTERNO="$TOKEN_INTERNO"
ADMIN_CORREO="$CORREO"
ADMIN_CONTRASENA_HASH='$HASH_ADMIN'
R2_ACCOUNT_ID="$(leer_env "$ENV_BACK.r2" R2_ACCOUNT_ID)"
R2_ACCESS_KEY_ID="$(leer_env "$ENV_BACK.r2" R2_ACCESS_KEY_ID)"
R2_SECRET_ACCESS_KEY="$(leer_env "$ENV_BACK.r2" R2_SECRET_ACCESS_KEY)"
R2_BUCKET="$(leer_env "$ENV_BACK.r2" R2_BUCKET)"
R2_URL_PUBLICA="$(leer_env "$ENV_BACK.r2" R2_URL_PUBLICA)"
EOF
chmod 600 "$ENV_BACK"

cat > "$RAIZ/frontend/.env.local" <<EOF
URL_API="http://127.0.0.1:$PUERTO_API"
MITIENDA_TOKEN_INTERNO="$TOKEN_INTERNO"
NEXT_PUBLIC_DOMINIO_BASE="$DOMINIO"
NEXT_PUBLIC_SUBDOMINIO_PANEL="$PANEL"
EOF
chmod 600 "$RAIZ/frontend/.env.local"
verde "backend/.env y frontend/.env.local escritos (las claves existentes se conservaron)."

# ─────────────────────────────────────────────────────────────────────────────
paso "Construcción (esto tarda unos minutos)"
# ─────────────────────────────────────────────────────────────────────────────

npx prisma generate >/dev/null
npx prisma migrate deploy
npx tsc -p tsconfig.build.json
cd "$RAIZ/frontend"
npm ci --no-audit --no-fund --loglevel=error
npm run build
verde "Build listo."

# ─────────────────────────────────────────────────────────────────────────────
paso "PM2"
# ─────────────────────────────────────────────────────────────────────────────

cd "$RAIZ"
mkdir -p logs
if pm2 describe mitienda-web >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save >/dev/null
# Arranque con el sistema (si ya estaba configurado, no cambia nada).
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

for intento in $(seq 1 20); do
  curl -sf "http://127.0.0.1:$PUERTO_API/api/salud/detallada" >/dev/null && break
  [ "$intento" -eq 20 ] && { pm2 logs mitienda-api --lines 30 --nostream; falla "La API no responde."; }
  sleep 2
done
verde "API respondiendo (PostgreSQL y Redis ok)."

# ─────────────────────────────────────────────────────────────────────────────
paso "nginx"
# ─────────────────────────────────────────────────────────────────────────────

PROXY=/etc/nginx/snippets/mitienda-proxy.conf
cp "$RAIZ/deploy/mitienda-proxy.conf" "$PROXY"

CERT_COMODIN="/etc/letsencrypt/live/$DOMINIO-comodin/fullchain.pem"
SITIO=/etc/nginx/sites-available/mitienda

ubicaciones() {
  cat <<EOF
    client_max_body_size 9m;
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /api/medios-locales/ {
        alias $RAIZ/backend/.medios/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    location /api/tiempo-real {
        proxy_pass http://127.0.0.1:$PUERTO_API;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600s;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:$PUERTO_API;
        include $PROXY;
    }
    location / {
        proxy_pass http://127.0.0.1:$PUERTO_WEB;
        include $PROXY;
    }
EOF
}

# Con certificado comodín, panel y tiendas comparten un solo bloque con ese
# certificado (también cubre $HOST_PANEL) y certbot no se toca: si se le pide
# un certificado para el panel, instala el suyo encima del bloque comodín,
# porque *.dominio también coincide con el panel, y rompe todas las tiendas.
if [ -f "$CERT_COMODIN" ]; then
  {
    echo "# Generado por deploy/instalar.sh — se reescribe al volver a correrlo."
    echo "# Web, panel y todas las tiendas con el certificado comodín. nginx atiende"
    echo "# primero los nombres exactos ($DOMINIO, www), así que tus otros sitios no cambian."
    echo "server {"
    echo "    listen 80;"
    echo "    listen [::]:80;"
    echo "    server_name $HOST_PANEL *.$DOMINIO;"
    echo "    return 301 https://\$host\$request_uri;"
    echo "}"
    echo "server {"
    echo "    listen 443 ssl;"
    echo "    listen [::]:443 ssl;"
    echo "    server_name $HOST_PANEL *.$DOMINIO;"
    echo "    ssl_certificate     $CERT_COMODIN;"
    echo "    ssl_certificate_key /etc/letsencrypt/live/$DOMINIO-comodin/privkey.pem;"
    ubicaciones
    echo "}"
  } > "$SITIO"
else
  {
    echo "# Generado por deploy/instalar.sh — se reescribe al volver a correrlo."
    echo "# Web y panel de Mi Sitio (certbot le agrega el HTTPS)."
    echo "server {"
    echo "    listen 80;"
    echo "    listen [::]:80;"
    echo "    server_name $HOST_PANEL ${SUBDOMINIOS_PRUEBA:+$(printf '%s.'"$DOMINIO"' ' $SUBDOMINIOS_PRUEBA)};"
    ubicaciones
    echo "}"
    echo
    echo "# Sin certificado comodín todavía: las tiendas (*.$DOMINIO) responden por HTTP."
    echo "server {"
    echo "    listen 80;"
    echo "    listen [::]:80;"
    echo "    server_name *.$DOMINIO;"
    ubicaciones
    echo "}"
  } > "$SITIO"
fi

ln -sf "$SITIO" /etc/nginx/sites-enabled/mitienda
nginx -t 2>&1 | tail -1
systemctl reload nginx
verde "nginx recargado."

# ─────────────────────────────────────────────────────────────────────────────
paso "HTTPS"
# ─────────────────────────────────────────────────────────────────────────────

if [ -f "$CERT_COMODIN" ]; then
  verde "Certificado comodín activo: https para $HOST_PANEL y todas las tiendas."
else
  IP_PUBLICA="$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
  NOMBRES=("$HOST_PANEL")
  for sub in ${SUBDOMINIOS_PRUEBA:-}; do NOMBRES+=("$sub.$DOMINIO"); done

  LISTOS=()
  for nombre in "${NOMBRES[@]}"; do
    if [ "$(dig +short "$nombre" A | tail -1)" = "$IP_PUBLICA" ]; then
      LISTOS+=("-d" "$nombre")
    else
      ambar "$nombre todavía no apunta a $IP_PUBLICA en el DNS: se omite su certificado."
      ambar "  Crea en Namecheap un A Record con host '${nombre%%.$DOMINIO}' y valor $IP_PUBLICA, y vuelve a correr el instalador."
    fi
  done
  if [ ${#LISTOS[@]} -gt 0 ]; then
    certbot --nginx --non-interactive --agree-tos -m "$CORREO" --redirect --keep-until-expiring \
      --cert-name "$HOST_PANEL" "${LISTOS[@]}" \
      && verde "Certificado listo para: ${NOMBRES[*]}" \
      || ambar "certbot no pudo emitir el certificado; revisa el mensaje de arriba."
  fi

  ambar "Las tiendas (*.$DOMINIO) funcionan por HTTP hasta que saques el certificado comodín:"
  ambar "  sudo certbot certonly --manual --preferred-challenges dns -d '*.$DOMINIO' --cert-name $DOMINIO-comodin"
  ambar "  (y luego vuelve a correr este instalador)."
fi

# ─────────────────────────────────────────────────────────────────────────────
echo
verde "════════════════════════════════════════════════════════"
verde " Mi Sitio instalado"
verde "   Web y panel:  https://$HOST_PANEL"
verde "   Tu admin:     https://$HOST_PANEL/panel/admin  ($CORREO)"
verde "   Tiendas:      <subdominio>.$DOMINIO"
verde "   Procesos:     pm2 status   ·   registros: pm2 logs mitienda-web"
verde "════════════════════════════════════════════════════════"
