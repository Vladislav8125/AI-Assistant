#!/usr/bin/env bash
# Run on VPS as deploy (sudo + docker). Switches nginx docroot to /opt/andreevsky-site.
set -euo pipefail

SITE_ROOT="/opt/andreevsky-site"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/andreevsky}"

if [[ "$(id -un)" != "deploy" ]]; then
  echo "Run as deploy: sudo -u deploy $0" >&2
  exit 1
fi

if [[ ! -f "$SITE_ROOT/index.html" ]]; then
  echo "Missing $SITE_ROOT/index.html — upload site first (vladislav: scripts/deploy-andreevskyfund.sh)" >&2
  exit 1
fi

if [[ ! -d "$COMPOSE_DIR" ]]; then
  echo "Compose dir not found: $COMPOSE_DIR" >&2
  exit 1
fi

cd "$COMPOSE_DIR"
cp -a docker-compose.yml "docker-compose.yml.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

# Patch common volume patterns to static site (adjust manually if this does not match)
if grep -q 'andreevsky-site' docker-compose.yml 2>/dev/null; then
  echo "docker-compose.yml already references andreevsky-site"
else
  sed -i.bak \
    -e "s|/opt/andreevsky/[^:]*:/usr/share/nginx/html|${SITE_ROOT}:/usr/share/nginx/html:ro|g" \
    -e "s|\./dist:/usr/share/nginx/html|${SITE_ROOT}:/usr/share/nginx/html:ro|g" \
    -e "s|\./frontend/dist:/usr/share/nginx/html|${SITE_ROOT}:/usr/share/nginx/html:ro|g" \
    docker-compose.yml 2>/dev/null || true
fi

docker compose up -d --force-recreate 2>/dev/null || docker-compose up -d --force-recreate
echo "Done. Check: curl -sI https://andreevskyfund.ru/ | head -5"
