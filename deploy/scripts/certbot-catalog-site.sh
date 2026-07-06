#!/usr/bin/env bash
# SSL para catalog.pmonteirodev.com.br
# Uso: sudo bash deploy/scripts/certbot-catalog-site.sh
set -eu

DOMAIN="catalog.pmonteirodev.com.br"
SITES_AVAILABLE="/etc/nginx/sites-available"
REPO_CONF="$(cd "$(dirname "$0")/.." && pwd)/nginx/catalog.pmonteirodev.com.br.conf"

certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@pmonteirodev.com.br || \
  certbot --nginx -d "${DOMAIN}"

cp "${REPO_CONF}" "${SITES_AVAILABLE}/${DOMAIN}.conf"
nginx -t
systemctl reload nginx

echo "HTTPS ativo em https://${DOMAIN}"
