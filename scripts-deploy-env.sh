#!/usr/bin/env bash
# Generates the env files the Docker deployment needs.
#
#   scripts-deploy-env.sh            # debug API ON (default; private playtest server)
#   AIVPET_DEBUG=false <script>      # debug API OFF
#
# AI settings are copied from the repo-root .env (source of truth), a DB password is generated
# once and reused, and the API gets its own container-ready env file (gitignored).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

DEBUG="${AIVPET_DEBUG:-true}"

# --- read a value from root .env (strips surrounding quotes) ---
get() {
  grep -E "^$1=" .env | head -n1 | cut -d'=' -f2- | sed -E 's/^"(.*)"$/\1/'
}

AI_PROVIDER=$(get AI_PROVIDER)
AI_BASE_URL=$(get AI_BASE_URL)
AI_MODEL=$(get AI_MODEL)
AI_API_KEY=$(get AI_API_KEY)
AI_JSON_MODE=$(get AI_JSON_MODE)
AI_INTERPRETATION_TIMEOUT_MS=$(get AI_INTERPRETATION_TIMEOUT_MS)
AI_RESPONSE_TIMEOUT_MS=$(get AI_RESPONSE_TIMEOUT_MS)
AI_TURN_BUDGET_MS=$(get AI_TURN_BUDGET_MS)

DB_USER="aivpet"
DB_NAME="ai_virtual_pet"

# reuse an existing generated password if present, else make one
if grep -qE '^POSTGRES_PASSWORD=' .env; then
  DB_PASS=$(grep -E '^POSTGRES_PASSWORD=' .env | head -n1 | cut -d'=' -f2-)
else
  DB_PASS=$(openssl rand -hex 24)
  printf '\n# --- docker deploy (ai-virtual-pet) ---\nPOSTGRES_USER=%s\nPOSTGRES_PASSWORD=%s\nPOSTGRES_DB=%s\n' \
    "$DB_USER" "$DB_PASS" "$DB_NAME" >> .env
fi

# --- container env file for the API ---
cat > apps/api/.env <<EOF
# Generated for the Docker deployment. Do not commit (gitignored).
NODE_ENV=production
API_PORT=3000
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}"
# Debug harness (time travel, force sleep/wake, set stats, reset). On for this playtest server.
ENABLE_DEBUG_API=${DEBUG}
# AI provider (OpenAI-compatible, e.g. 9router). Missing values disable Talk only.
AI_PROVIDER=${AI_PROVIDER}
AI_BASE_URL="${AI_BASE_URL}"
AI_MODEL="${AI_MODEL}"
AI_API_KEY=${AI_API_KEY}
AI_JSON_MODE=${AI_JSON_MODE}
AI_INTERPRETATION_TIMEOUT_MS=${AI_INTERPRETATION_TIMEOUT_MS}
AI_RESPONSE_TIMEOUT_MS=${AI_RESPONSE_TIMEOUT_MS}
AI_TURN_BUDGET_MS=${AI_TURN_BUDGET_MS}
EOF

chmod 600 apps/api/.env
echo "OK: wrote apps/api/.env (ENABLE_DEBUG_API=${DEBUG}) and ensured POSTGRES_* in .env"
echo "AI config: provider=${AI_PROVIDER} model=${AI_MODEL} base_url_set=$([ -n "$AI_BASE_URL" ] && echo yes || echo no) key_set=$([ -n "$AI_API_KEY" ] && echo yes || echo no)"
