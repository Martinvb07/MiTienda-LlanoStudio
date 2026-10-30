#!/usr/bin/env bash
#
# Respaldo automático de Mi Sitio: base de datos todos los días y, si las fotos
# viven en el disco (sin R2), también la carpeta de medios los domingos.
#
#   sudo bash deploy/respaldar.sh             saca un respaldo ahora
#   sudo bash deploy/respaldar.sh --instalar  lo programa todos los días a las 3:17 a. m.
#
# Guarda en /var/backups/mitienda/diarios (14 días) y /semanales (8 semanas).
# Si backend/.env tiene R2_BUCKET_RESPALDOS (un bucket PRIVADO, distinto del de
# las fotos), además sube cada respaldo ahí: si el VPS se pierde, los datos no.
#
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL="$RAIZ/.mitienda.env"
ENV_BACK="$RAIZ/backend/.env"
RESPALDOS="/var/backups/mitienda"
REGISTRO="/var/log/mitienda-respaldos.log"

verde() { printf '\033[32m✓ %s\033[0m\n' "$*"; }
ambar() { printf '\033[33m! %s\033[0m\n' "$*"; }
falla() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

leer_env() { (grep -E "^$2=" "$1" 2>/dev/null || true) | tail -1 | cut -d= -f2- | tr -d "\"'\r"; }

[ "$(id -u)" -eq 0 ] || falla "Córrelo con sudo: sudo bash deploy/respaldar.sh"
[ -f "$ENV_BACK" ] || falla "No encuentro $ENV_BACK."

if [ "${1:-}" = "--instalar" ]; then
  LINEA="17 3 * * * root bash $RAIZ/deploy/respaldar.sh >> $REGISTRO 2>&1"
  echo "$LINEA" > /etc/cron.d/mitienda-respaldos
  chmod 644 /etc/cron.d/mitienda-respaldos
  verde "Respaldo programado todos los días a las 3:17 a. m. (registro en $REGISTRO)."
  exit 0
fi

command -v pg_dump >/dev/null || falla "Falta pg_dump: sudo apt-get install -y postgresql-client"

DIR_NODE="$(leer_env "$LOCAL" DIR_NODE)"
[ -n "$DIR_NODE" ] && export PATH="$DIR_NODE:$PATH"

mkdir -p "$RESPALDOS/diarios" "$RESPALDOS/semanales"
chmod 700 "$RESPALDOS"

URL_BD="$(leer_env "$ENV_BACK" DATABASE_URL)"
URL_BD="${URL_BD%%\?*}"
FECHA="$(date +%Y%m%d-%H%M)"
ARCHIVO="$RESPALDOS/diarios/bd-$FECHA.sql.gz"

echo "── $(date '+%F %T') ──"
pg_dump --no-owner --no-privileges "$URL_BD" | gzip > "$ARCHIVO"
# Un respaldo vacío o cortado no sirve: se comprueba que el gzip esté sano.
gzip -t "$ARCHIVO" || falla "El respaldo $ARCHIVO salió dañado."
verde "Base de datos: $ARCHIVO ($(du -h "$ARCHIVO" | cut -f1))."
SUBIR=("$ARCHIVO")

# Domingo: copia semanal, y las fotos si viven en el disco del VPS.
if [ "$(date +%u)" = "7" ]; then
  cp "$ARCHIVO" "$RESPALDOS/semanales/"
  if [ -d "$RAIZ/backend/.medios" ] && [ -z "$(leer_env "$ENV_BACK" R2_BUCKET)" ]; then
    MEDIOS="$RESPALDOS/semanales/medios-$FECHA.tgz"
    tar -czf "$MEDIOS" -C "$RAIZ/backend" .medios
    verde "Fotos: $MEDIOS ($(du -h "$MEDIOS" | cut -f1))."
    SUBIR+=("$MEDIOS")
  fi
fi

# Rotación: 14 diarios y 8 semanales.
ls -1t "$RESPALDOS"/diarios/bd-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
ls -1t "$RESPALDOS"/semanales/bd-*.sql.gz 2>/dev/null | tail -n +9 | xargs -r rm -f
ls -1t "$RESPALDOS"/semanales/medios-*.tgz 2>/dev/null | tail -n +5 | xargs -r rm -f

# Copia fuera del VPS, si hay bucket privado para respaldos.
if [ -n "$(leer_env "$ENV_BACK" R2_BUCKET_RESPALDOS)" ]; then
  if (cd "$RAIZ/backend" && node dist/respaldos/subirRespaldo.js "${SUBIR[@]}"); then
    verde "Copia subida a R2."
  else
    ambar "No se pudo subir la copia a R2; el respaldo local sí quedó."
  fi
fi
