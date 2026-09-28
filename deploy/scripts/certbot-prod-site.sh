#!/usr/bin/env bash
# SSL Let's Encrypt — grandesmarcaspe.com.br + www (após DNS A → 191.252.223.249)
set -eu

DOMAIN="grandesmarcaspe.com.br"
SITES_AVAILABLE="/etc/nginx/sites-available"
REPO_CONF="$(cd "$(dirname "$0")/.." && pwd)/nginx/grandesmarcaspe.com.br.conf"

certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --non-interactive --agree-tos -m admin@grandesmarcaspe.com.br || \
  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}"

cp "${REPO_CONF}" "${SITES_AVAILABLE}/${DOMAIN}.conf"
nginx -t
systemctl reload nginx

echo "HTTPS ativo em https://${DOMAIN} e https://www.${DOMAIN}"
