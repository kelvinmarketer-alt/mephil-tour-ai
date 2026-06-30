#!/usr/bin/env bash
# Trỏ webhook Telegram về Cloudflare Pages.
# Dùng:
#   BOT_TOKEN=123:abc URL=https://mephil-tour-ai.pages.dev/api/telegram SECRET=xxx ./scripts/set-telegram-webhook.sh
set -euo pipefail
: "${BOT_TOKEN:?Thiếu BOT_TOKEN}"
: "${URL:?Thiếu URL (vd https://<project>.pages.dev/api/telegram)}"

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H 'content-type: application/json' \
  -d "{\"url\":\"${URL}\",\"secret_token\":\"${SECRET:-}\",\"drop_pending_updates\":true}"
echo
echo "→ Kiểm tra: https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
