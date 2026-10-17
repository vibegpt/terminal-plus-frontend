#!/usr/bin/env bash
# CC-25 D1 proof: the poller before (afb5dc2) and after this branch, fed the same mocked
# payloads, raise the same toasts in the same order. Run from the repo root:
#   bash tests/agent-card-eval/poller-proof/run.sh
set -euo pipefail
D=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$D/old" "$D/new"
git show afb5dc2:src/hooks/useFlightUpdates.ts > "$D/old/useFlightUpdates.ts"
cp src/hooks/useFlightUpdates.ts "$D/new/useFlightUpdates.ts"
npx esbuild "$D/main.ts" --bundle --platform=node --format=cjs --outfile="$D/out.cjs" --alias:react="$D/stubs/react.ts" --log-level=warning
node "$D/out.cjs"
rm -rf "$D/old" "$D/new" "$D/out.cjs"
