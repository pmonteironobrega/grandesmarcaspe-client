#!/usr/bin/env bash
# Instala nginx do site Angular SSR (catalog.pmonteirodev.com.br)
# Uso: sudo bash deploy/scripts/setup-nginx-catalog-site.sh
set -eu

DOMAIN="catalog.pmonteirodev.com.br"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
REPO_CONF="$(cd "$(dirname "$0")/.." && pwd)/nginx/catalog.pmonteirodev.com.br.http.conf"

cp "${REPO_CONF}" "${SITES_AVAILABLE}/${DOMAIN}.conf"
ln -sf "${SITES_AVAILABLE}/${DOMAIN}.conf" "${SITES_ENABLED}/${DOMAIN}.conf"

nginx -t
systemctl reload nginx

echo "Nginx configurado para ${DOMAIN} (HTTP)."
echo "Após DNS A → 191.252.222.63: sudo bash deploy/scripts/certbot-catalog-site.sh"
