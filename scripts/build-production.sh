#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/dist/andreevskyfund}"
rm -rf "$OUT"
mkdir -p "$OUT"
rsync -a --exclude='.git' "$ROOT/site/" "$OUT/"
find "$OUT" -type f \( -name '*.html' -o -name '*.js' -o -name '*.json' -o -name '*.yml' -o -name '*.md' -o -name '*.css' \) -print0 \
  | xargs -0 sed -i 's|/AI-Assistant||g'
echo "Built production site at $OUT"
