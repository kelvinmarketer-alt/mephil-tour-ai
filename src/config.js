// Đọc/ghi cấu hình của app trong Cloudflare KV (binding SETTINGS).
// Đây là "kho cấu hình của app" — sau này có thể đổi sang Supabase rất dễ.

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getConfig(env) {
  const kv = env.SETTINGS;
  const fallbackModel = env.MODEL || "gpt-4o-mini";
  const base = env.OPENAI_BASE || "https://api.openai.com/v1/chat/completions";
  if (!kv) {
    return { openaiKey: null, model: fallbackModel, base, tgToken: null, tgSecret: null, adminHash: null };
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
    base,
    tgToken,
    tgSecret,
    adminHash,
  };
}

// So khớp mật khẩu admin (hằng thời gian đơn giản).
export async function isAdmin(env, password) {
  if (typeof password !== "string" || !password) return false;
  const { adminHash } = await getConfig(env);
  if (!adminHash) return false;
  return (await sha256(password)) === adminHash;
}

// ---- Kho tài liệu tour (lưu trong KV, quản lý qua trang 📚 Tài liệu) ----
export async function getDocuments(env) {
  if (!env.SETTINGS) return [];
  const raw = await env.SETTINGS.get("documents");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveDocuments(env, docs) {
  await env.SETTINGS.put("documents", JSON.stringify(docs));
}

// ---- Kho địa điểm bản đồ (lưu trong KV, quản lý qua trang 🗺️ Bản đồ) ----
export async function getPlaces(env) {
  if (!env.SETTINGS) return [];
  const raw = await env.SETTINGS.get("places");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function savePlaces(env, places) {
  await env.SETTINGS.put("places", JSON.stringify(places));
}

// Key hiển thị bản đồ (dùng ở phía trình duyệt — nhớ giới hạn theo domain).
export async function getGoogleMapsKey(env) {
  if (!env.SETTINGS) return null;
  return await env.SETTINGS.get("google_maps_api_key");
}

// Chuẩn hóa URL Supabase: chấp nhận cả link dashboard (supabase.com/dashboard/project/<ref>)
// lẫn URL API (<ref>.supabase.co) → luôn trả về URL API đúng.
function normalizeSupabaseUrl(url) {
  if (!url) return null;
  url = url.trim().replace(/\/+$/, "");
  const dash = url.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dash) return "https://" + dash[1] + ".supabase.co";       // link dashboard → URL API
  if (/^[a-z0-9]{20}$/i.test(url)) return "https://" + url + ".supabase.co"; // chỉ nhập ref trần
  return url;                                                    // đã là URL API đúng
}

// Cấu hình Supabase Storage (lưu ảnh upload): URL project + service_role key. Cấu hình qua ⚙️.
export async function getSupabase(env) {
  if (!env.SETTINGS) return { url: null, key: null };
  const [url, key] = await Promise.all([
    env.SETTINGS.get("supabase_url"),
    env.SETTINGS.get("supabase_service_key"),
  ]);
  return { url: normalizeSupabaseUrl(url), key: key || null };
}
