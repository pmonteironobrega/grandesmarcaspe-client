#!/usr/bin/env bash
# Instala nginx HTTP do site SSR (produção) + rate limit
# Uso: sudo bash deploy/scripts/setup-nginx-prod-site.sh
set -eu

DOMAIN="grandesmarcaspe.com.br"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_CONF="${REPO_DIR}/nginx/grandesmarcaspe.com.br.http.conf"
RATE_CONF="${REPO_DIR}/nginx/conf.d/gmpe-rate-limit.conf"

cp "${RATE_CONF}" /etc/nginx/conf.d/gmpe-rate-limit.conf
cp "${REPO_CONF}" "${SITES_AVAILABLE}/${DOMAIN}.conf"
ln -sf "${SITES_AVAILABLE}/${DOMAIN}.conf" "${SITES_ENABLED}/${DOMAIN}.conf"

nginx -t
systemctl reload nginx

echo "Nginx SSR configurado para ${DOMAIN} / www (HTTP)."
echo "Após DNS A → 191.252.223.249: sudo bash deploy/scripts/certbot-prod-site.sh"
