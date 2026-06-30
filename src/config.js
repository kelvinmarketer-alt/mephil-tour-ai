// Đọc/ghi cấu hình của app trong Cloudflare KV (binding SETTINGS).
// Đây là "kho cấu hình của app" — sau này có thể đổi sang Supabase rất dễ.

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getConfig(env) {
  const kv = env.SETTINGS;
  const fallbackModel = env.MODEL || "gpt-4o-mini";
  if (!kv) {
    return { openaiKey: null, model: fallbackModel, tgToken: null, tgSecret: null, adminHash: null };
  }
  const [openaiKey, model, tgToken, tgSecret, adminHash] = await Promise.all([
    kv.get("openai_api_key"),
    kv.get("model"),
    kv.get("telegram_bot_token"),
    kv.get("telegram_secret"),
    kv.get("admin_password_hash"),
  ]);
  return {
    openaiKey,
    model: model || fallbackModel,
    tgToken,
    tgSecret,
    adminHash,
  };
}

// So khớp mật khẩu admin (hằng thời gian đơn giản).
export async function isAdmin(env, password) {
  if (!password) return false;
  const { adminHash } = await getConfig(env);
  if (!adminHash) return false;
  return (await sha256(password)) === adminHash;
}
