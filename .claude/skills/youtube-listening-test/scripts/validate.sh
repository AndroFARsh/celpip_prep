#!/usr/bin/env bash
# Validate every test in data/listening/ with the app's own zod schemas and loader.
# Usage: validate.sh   (run from anywhere inside the repo)
set -euo pipefail

root=$(git rev-parse --show-toplevel)
# The project needs Node 20+; fall back to nvm's Node 22 if the default node is older.
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ] && [ -s "$HOME/.nvm/nvm.sh" ]; then
  set +u; . "$HOME/.nvm/nvm.sh"; nvm use 22 >/dev/null; set -u
fi
cd "$root/web"
npx vitest run lib/listening/tests.test.ts -t "data/listening"
