#!/usr/bin/env bash
# One-command deploy for ai-virtual-pet (Docker Compose, production-ish stack).
#
#   ./deploy.sh              # build + (re)start postgres, api, web (debug API ON)
#   ./deploy.sh --no-build   # restart containers only, reuse existing images
#   ./deploy.sh --logs       # follow api + web logs after the deploy
#   ./deploy.sh --down       # stop the stack
#   AIVPET_DEBUG=false ./deploy.sh   # build with the debug harness OFF
#
# Ports: postgres 5450, api 3032, web 8083 (chosen to avoid the Coderium/CAF stacks).
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
cd "$(dirname "${BASH_SOURCE[0]}")"

BUILD=1
FOLLOW_LOGS=0
DOWN=0

for arg in "$@"; do
  case "$arg" in
    --no-build) BUILD=0 ;;
    --logs) FOLLOW_LOGS=1 ;;
    --down) DOWN=1 ;;
    -h | --help)
      sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

DEBUG="${AIVPET_DEBUG:-true}"

# docker needs sudo on this host; sudo resets the environment, so the debug flag is passed
# explicitly to the compose invocation (it feeds the web bundle's build arg).
DC="sudo AIVPET_DEBUG=$DEBUG docker compose -f $COMPOSE_FILE"

if [ "$DOWN" = "1" ]; then
  echo "==> stopping the stack"
  $DC down
  exit 0
fi

echo "==> generating env files (root .env -> apps/api/.env)"
AIVPET_DEBUG="$DEBUG" bash scripts-deploy-env.sh

if [ "$BUILD" = "1" ]; then
  echo "==> building images"
  $DC build
fi

echo "==> starting containers"
$DC up -d --remove-orphans

echo "==> waiting for the API health check"
API_OK=0
for _ in $(seq 1 30); do
  if curl -fsS http://localhost:3032/health >/dev/null 2>&1; then
    API_OK=1
    break
  fi
  sleep 2
done

echo
$DC ps
echo
if [ "$API_OK" = "1" ]; then
  echo "API health: OK (http://localhost:3032/health)"
else
  echo "API health: NOT READY — check: $DC logs api" >&2
fi

WEB_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8083/ || echo "000")
echo "Web: HTTP ${WEB_CODE} (http://localhost:8083/)"
echo
echo "Access: http://43.133.129.95:8083"
echo "Debug harness is ${AIVPET_DEBUG:-true} (ENABLE_DEBUG_API)."

if [ "$FOLLOW_LOGS" = "1" ]; then
  echo
  echo "==> following logs (Ctrl+C to stop)"
  $DC logs -f --tail=50 api web
fi
