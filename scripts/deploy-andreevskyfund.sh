#!/usr/bin/env bash
# Deploy static site to /opt/andreevsky-site/ on VPS (user vladislav).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-188.253.23.192}"
USER="${DEPLOY_USER:-vladislav}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/opt/andreevsky-site}"
ASKPASS="${SSH_ASKPASS:-$ROOT/.ssh_askpass.sh}"

"$ROOT/scripts/build-production.sh" "$ROOT/dist/andreevskyfund"

export DISPLAY="${DISPLAY:-:0}"
export SSH_ASKPASS_REQUIRE=force
export SSH_ASKPASS="$ASKPASS"

RSYNC_RSH="ssh -o StrictHostKeyChecking=accept-new -o BatchMode=no"
export RSYNC_RSH

rsync -avz --delete \
  "$ROOT/dist/andreevskyfund/" \
  "${USER}@${HOST}:${REMOTE_DIR}/"

# Nginx snippet for deploy user
ssh -o BatchMode=no "${USER}@${HOST}" "mkdir -p ${REMOTE_DIR}/deploy"
rsync -avz \
  "$ROOT/scripts/nginx-andreevsky-site.conf" \
  "$ROOT/scripts/server-install-andreevsky-site.sh" \
  "${USER}@${HOST}:${REMOTE_DIR}/deploy/"

echo "Uploaded to ${USER}@${HOST}:${REMOTE_DIR}/"
echo "If the domain still shows the old app, run as deploy: bash ${REMOTE_DIR}/deploy/server-install-andreevsky-site.sh"
