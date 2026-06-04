#!/usr/bin/env bash
# Run ON THE SERVER as user deploy (sudo + docker).
set -euo pipefail

SRC="${1:-/home/vladislav/site-release}"
if [[ ! -d "$SRC" ]]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

if [[ "$(id -un)" != "deploy" ]]; then
  echo "Run as deploy, e.g.: sudo -u deploy $0 $SRC" >&2
  exit 1
fi

cd /opt/andreevsky 2>/dev/null || { echo "Cannot access /opt/andreevsky" >&2; exit 1; }

echo "Contents of /opt/andreevsky:"
ls -la

# Common layouts: static in ./public, ./dist, or docker volume ./www
for TARGET in public dist www html site; do
  if [[ -d "$TARGET" ]]; then
    echo "Syncing into /opt/andreevsky/$TARGET"
    rsync -a --delete "$SRC/" "$TARGET/"
    if [[ -f docker-compose.yml || -f compose.yml ]]; then
      docker compose ps 2>/dev/null && docker compose restart || true
    fi
    echo "Done. Check https://andreevskyfund.ru/"
    exit 0
  fi
done

# Fallback: replace directory used by nginx container (inspect compose first)
if [[ -f docker-compose.yml ]]; then
  echo "No known static folder; inspect docker-compose.yml and volumes:" >&2
  cat docker-compose.yml >&2
  exit 2
fi

echo "Could not detect web root under /opt/andreevsky" >&2
exit 2
