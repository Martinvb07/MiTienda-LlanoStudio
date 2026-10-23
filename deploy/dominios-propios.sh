#!/usr/bin/env bash
#
# Dominios propios de las tiendas (www.mitienda.com) con HTTPS automático.
#
# Lo corre cron cada 5 minutos (lo instala deploy/actualizar-vps.sh):
#   1. Le pide a la API la lista de dominios verificados.
#   2. Escribe /etc/nginx/sites-available/mitienda-dominios.conf: por HTTP
#      sirve el reto de Let's Encrypt y la tienda; por HTTPS, la tienda con
#      su certificado.
#   3. Saca con certbot (webroot) el certificado de los dominios nuevos.
#
# No toca los demás archivos de nginx. Si nada cambió, no recarga nginx.
#
#   sudo bash deploy/dominios-propios.sh            una pasada
#   sudo bash deploy/dominios-propios.sh --ver      sólo muestra qué haría

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL="$RAIZ/.mitienda.env"
CONF_NGINX="/etc/nginx/sites-available/mitienda-dominios.conf"
WEBROOT="/var/www/mitienda-acme"
SNIPPET="/etc/nginx/snippets/mitienda-proxy.conf"
SOLO_VER="${1:-}"

leer_env() { (grep -E "^$2=" "$1" 2>/dev/null || true) | tail -1 | cut -d= -f2- | tr -d "\"'\r"; }
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }

[ "$(id -u)" -eq 0 ] || { echo "Córrelo con sudo" >&2; exit 1; }
[ -f "$LOCAL" ] || { echo "Falta $LOCAL (lo crea deploy/instalar.sh)" >&2; exit 1; }

PUERTO_API="$(leer_env "$LOCAL" PUERTO_API)"
PUERTO_WEB="$(leer_env "$LOCAL" PUERTO_WEB)"
CORREO="$(leer_env "$LOCAL" CORREO)"
TOKEN="$(leer_env "$RAIZ/backend/.env" TOKEN_INTERNO)"
[ -n "$PUERTO_API" ] && [ -n "$PUERTO_WEB" ] || { echo "Faltan PUERTO_API/PUERTO_WEB en $LOCAL" >&2; exit 1; }
[ -n "$TOKEN" ] || { echo "Falta TOKEN_INTERNO en backend/.env" >&2; exit 1; }

# 1. Dominios verificados (uno por línea). Sólo se aceptan nombres válidos.
LISTA="$(curl -fsS --max-time 15 -H "x-mitienda-interno: $TOKEN" "http://127.0.0.1:$PUERTO_API/api/plataforma/dominios" || true)"
mapfile -t DOMINIOS < <(printf '%s\n' "$LISTA" | tr 'A-Z' 'a-z' | grep -E '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' | sort -u || true)

if [ -n "$SOLO_VER" ]; then
  log "Dominios verificados: ${DOMINIOS[*]:-ninguno}"
  for dominio in "${DOMINIOS[@]}"; do
    [ -f "/etc/letsencrypt/live/$dominio/fullchain.pem" ] && log "  $dominio: con certificado" || log "  $dominio: sin certificado todavía"
  done
  exit 0
fi

mkdir -p "$WEBROOT"

# Bloques de proxy comunes, iguales a los de las tiendas en *.llanostudio.co.
proxy() {
  cat <<BLOQUE
    location /.well-known/acme-challenge/ { root $WEBROOT; }
    location /api/ {
        client_max_body_size 2m;
        proxy_pass http://127.0.0.1:$PUERTO_API;
        include $SNIPPET;
    }
    location / {
        proxy_pass http://127.0.0.1:$PUERTO_WEB;
        include $SNIPPET;
    }
BLOQUE
}

# 2. Genera la configuración: HTTP para todos (reto ACME); HTTPS para los que ya tienen certificado.
generar() {
  {
    echo "# Generado por deploy/dominios-propios.sh — no editar a mano."
    for dominio in "${DOMINIOS[@]}"; do
      local cert="/etc/letsencrypt/live/$dominio/fullchain.pem"
      echo "server {"
      echo "    listen 80;"
      echo "    listen [::]:80;"
      echo "    server_name $dominio;"
      if [ -f "$cert" ]; then
        echo "    location /.well-known/acme-challenge/ { root $WEBROOT; }"
        echo "    location / { return 301 https://\$host\$request_uri; }"
        echo "}"
        echo "server {"
        # "listen … http2" sirve en nginx viejo (Ubuntu 22.04) y nuevo.
        echo "    listen 443 ssl http2;"
        echo "    listen [::]:443 ssl http2;"
        echo "    server_name $dominio;"
        echo "    ssl_certificate $cert;"
        echo "    ssl_certificate_key /etc/letsencrypt/live/$dominio/privkey.pem;"
        [ -f /etc/letsencrypt/options-ssl-nginx.conf ] && echo "    include /etc/letsencrypt/options-ssl-nginx.conf;"
      fi
      proxy
      echo "}"
    done
  } > "$CONF_NGINX.nuevo"

  if [ -f "$CONF_NGINX" ] && cmp -s "$CONF_NGINX" "$CONF_NGINX.nuevo"; then
    rm -f "$CONF_NGINX.nuevo"
    return 1 # sin cambios
  fi
  mv "$CONF_NGINX.nuevo" "$CONF_NGINX"
  ln -sf "$CONF_NGINX" /etc/nginx/sites-enabled/mitienda-dominios.conf
  if nginx -t 2>/dev/null; then
    systemctl reload nginx
    log "nginx recargado con ${#DOMINIOS[@]} dominio(s)"
  else
    log "La configuración nueva de nginx no pasó la prueba; se deja la anterior"
    nginx -t || true
    rm -f /etc/nginx/sites-enabled/mitienda-dominios.conf
    systemctl reload nginx || true
    exit 1
  fi
  return 0
}

generar || true

# 3. Certificados para los dominios que todavía no tienen.
CUENTA=(--register-unsafely-without-email)
[ -n "$CORREO" ] && CUENTA=(-m "$CORREO")

NUEVOS=0
for dominio in "${DOMINIOS[@]}"; do
  [ -f "/etc/letsencrypt/live/$dominio/fullchain.pem" ] && continue
  log "Sacando certificado para $dominio"
  if certbot certonly --webroot -w "$WEBROOT" -d "$dominio" --non-interactive --agree-tos "${CUENTA[@]}" \
      --keep-until-expiring --deploy-hook "systemctl reload nginx" >/dev/null 2>&1; then
    NUEVOS=$((NUEVOS + 1))
    log "  listo: https://$dominio"
  else
    log "  no se pudo (¿el DNS apunta aquí?). Se reintenta en la próxima pasada."
  fi
done

[ "$NUEVOS" -gt 0 ] && generar || true
exit 0
