#!/usr/bin/env bash
# Deploy static site to VPS (upload as vladislav; install step needs deploy/sudo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-188.253.23.192}"
USER="${DEPLOY_USER:-vladislav}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-site-release}"
ASKPASS="${SSH_ASKPASS:-$ROOT/.ssh_askpass.sh}"

"$ROOT/scripts/build-production.sh" "$ROOT/dist/andreevskyfund"

export DISPLAY="${DISPLAY:-:0}"
export SSH_ASKPASS_REQUIRE=force
export SSH_ASKPASS="$ASKPASS"

RSYNC_RSH="ssh -o StrictHostKeyChecking=accept-new -o BatchMode=no"
export RSYNC_RSH

rsync -avz --delete \
  "$ROOT/dist/andreevskyfund/" \
  "${USER}@${HOST}:~/${REMOTE_DIR}/"

echo "Uploaded to ${USER}@${HOST}:~/${REMOTE_DIR}/"
echo "Next: run install on server as deploy (see scripts/server-install-andreevskyfund.sh)"
