// Cloudflare Worker: web tĩnh (public/) + hỏi-đáp (OpenAI) + Telegram + Cài đặt + Tài liệu — tất cả trong app.
import { askAI } from "./openai.js";
import { KNOWLEDGE } from "./knowledge.js";
import { getConfig, isAdmin, sha256, getDocuments, saveDocuments, getPlaces, savePlaces, getGoogleMapsKey, getSupabase } from "./config.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
    // Không phục vụ mã worker đã bundle như file tĩnh (tránh lộ logic + tên KV key).
    if (p === "/_worker.js") return new Response("Not found", { status: 404 });
    try {
      if (request.method === "POST" && p === "/api/ask") return await handleAsk(request, env);
      if (request.method === "POST" && p === "/api/telegram") return await handleTelegram(request, env, ctx);
      if (request.method === "GET" && p === "/api/settings/status") return await handleStatus(env);
      if (request.method === "POST" && p === "/api/settings/save") return await handleSave(request, env);
      if (request.method === "POST" && p === "/api/settings/telegram-webhook")
        return await handleSetWebhook(request, env, url);
      if (request.method === "POST" && p === "/api/docs/list") return await handleDocsList(request, env);
      if (request.method === "POST" && p === "/api/docs/save") return await handleDocsSave(request, env);
      if (request.method === "POST" && p === "/api/docs/delete") return await handleDocsDelete(request, env);
      if (request.method === "POST" && p === "/api/places/list") return await handlePlacesList(request, env);
      if (request.method === "POST" && p === "/api/places/save") return await handlePlacesSave(request, env);
      if (request.method === "POST" && p === "/api/places/delete") return await handlePlacesDelete(request, env);
      if (request.method === "POST" && p === "/api/places/mapkey") return await handlePlacesMapKey(request, env);
      if (request.method === "POST" && p === "/api/places/upload") return await handlePlacesUpload(request, env);
      if (request.method === "GET" && p.startsWith("/img/")) return await handleImg(p.slice(5), env);
    } catch (e) {
      return json({ error: "Lỗi: " + e.message }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Dựng kho kiến thức cho AI: ưu tiên tài liệu nhập trong app (KV); chưa có thì dùng tài liệu mẫu bundle.
async function buildKnowledge(env) {
  const docs = await getDocuments(env);
  if (docs.length) {
    return docs
      .map((d) => `### ${d.title || "(không tên)"}\n\n${d.content || ""}`)
      .join("\n\n---\n\n");
  }
  return KNOWLEDGE;
}

// ---------- Web chat ----------
async function handleAsk(request, env) {
  const body = await request.json().catch(() => ({}));
  const question = (body.question || "").toString().trim();
  if (!question) return json({ error: "Thiếu câu hỏi" }, 400);

  const cfg = await getConfig(env);
  if (!cfg.openaiKey)
    return json({ error: "Chưa cấu hình OpenAI API key. Mở trang Cài đặt (⚙️) để nhập key nhé." }, 503);

  const knowledge = await buildKnowledge(env);
  const answer = await askAI({ question, history: body.history || [], apiKey: cfg.openaiKey, model: cfg.model, knowledge, base: cfg.base });
  return json({ answer });
}

// ---------- Telegram ----------
async function handleTelegram(request, env, ctx) {
  const cfg = await getConfig(env);
  if (cfg.tgSecret) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== cfg.tgSecret) return new Response("forbidden", { status: 403 });
  }
  let update;
  try {
    update = await request.json();
  } catch {
    return new Response("ok");
  }
  const msg = update.message || update.edited_message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text || "").trim();
  if (!chatId || !text || !cfg.tgToken) return new Response("ok");

  const knowledge = await buildKnowledge(env);
  ctx.waitUntil(replyTelegram(cfg, chatId, text, knowledge));
  return new Response("ok");
}

async function replyTelegram(cfg, chatId, text, knowledge) {
  if (text.startsWith("/start") || text.startsWith("/help")) {
    return tgSend(cfg.tgToken, chatId,
      "Xin chào! Mình là trợ lý tour Mê Philippines 🌴\nBạn cứ hỏi về tour, giá, lịch trình, chính sách... mình trả lời theo tài liệu công ty nhé.");
  }
  await fetch(`https://api.telegram.org/bot${cfg.tgToken}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});

  let answer;
  if (!cfg.openaiKey) {
    answer = "Bot chưa được cấu hình OpenAI API key. Báo quản trị viên vào trang Cài đặt giúp nhé.";
  } else {
    try {
      answer = await askAI({ question: text, history: [], apiKey: cfg.openaiKey, model: cfg.model, knowledge, base: cfg.base });
    } catch {
      answer = "Xin lỗi, hiện chưa trả lời được. Bạn thử lại sau giúp mình nhé.";
    }
  }
  await tgSend(cfg.tgToken, chatId, answer);
}

async function tgSend(token, chatId, text) {
  for (let i = 0; i < text.length; i += 3800) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(i, i + 3800) }),
    }).catch(() => {});
  }
}

// ---------- Cài đặt (trong app) ----------
async function handleStatus(env) {
  const cfg = await getConfig(env);
  const docs = await getDocuments(env);
  const places = await getPlaces(env);
  const mapsKey = await getGoogleMapsKey(env);
  const sb = await getSupabase(env);
  return json({
    hasAdmin: !!cfg.adminHash,
    hasOpenAI: !!cfg.openaiKey,
    model: cfg.model,
    hasTelegramToken: !!cfg.tgToken,
    hasTelegramSecret: !!cfg.tgSecret,
    docCount: docs.length,
    hasMapsKey: !!mapsKey,
    placeCount: places.length,
    hasSupabase: !!(sb.url && sb.key),
  });
}

async function handleSave(request, env) {
  if (!env.SETTINGS) return json({ error: "Chưa gắn kho cấu hình (KV)." }, 500);
  const b = await request.json().catch(() => ({}));
  const cfg = await getConfig(env);

  if (!cfg.adminHash) {
    if (!b.newAdminPassword || b.newAdminPassword.length < 6)
      return json({ error: "Lần đầu: hãy đặt mật khẩu admin (tối thiểu 6 ký tự)." }, 400);
    await env.SETTINGS.put("admin_password_hash", await sha256(b.newAdminPassword));
  } else {
    if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin." }, 403);
    if (b.newAdminPassword) {
      if (b.newAdminPassword.length < 6) return json({ error: "Mật khẩu mới tối thiểu 6 ký tự." }, 400);
      await env.SETTINGS.put("admin_password_hash", await sha256(b.newAdminPassword));
    }
  }

  const put = async (key, val) => {
    if (typeof val === "string" && val.trim()) await env.SETTINGS.put(key, val.trim());
  };
  await put("openai_api_key", b.openaiKey);
  await put("model", b.model);
  await put("telegram_bot_token", b.telegramBotToken);
  await put("telegram_secret", b.telegramSecret);
  await put("google_maps_api_key", b.googleMapsKey);
  await put("supabase_url", b.supabaseUrl);
  await put("supabase_service_key", b.supabaseKey);

  return json({ ok: true });
}

async function handleSetWebhook(request, env, url) {
  const b = await request.json().catch(() => ({}));
  if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin." }, 403);
  const cfg = await getConfig(env);
  if (!cfg.tgToken) return json({ error: "Chưa có Telegram bot token." }, 400);

  const webhookUrl = `${url.origin}/api/telegram`;
  const res = await fetch(`https://api.telegram.org/bot${cfg.tgToken}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: cfg.tgSecret || undefined,
      drop_pending_updates: true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return json({ ok: data.ok === true, telegram: data, webhookUrl });
}

// ---------- Tài liệu (trong app) ----------
async function handleDocsList(request, env) {
  const b = await request.json().catch(() => ({}));
  if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin." }, 403);
  return json({ documents: await getDocuments(env) });
}

async function handleDocsSave(request, env) {
  const b = await request.json().catch(() => ({}));
  if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin." }, 403);
  const title = (b.title || "").toString().trim();
  const content = (b.content || "").toString();
  if (!title) return json({ error: "Thiếu tiêu đề tài liệu." }, 400);

  const docs = await getDocuments(env);
  if (b.id) {
    const i = docs.findIndex((d) => d.id === b.id);
    if (i >= 0) docs[i] = { ...docs[i], title, content, updatedAt: Date.now() };
    else docs.push({ id: b.id, title, content, updatedAt: Date.now() });
  } else {
    docs.push({ id: crypto.randomUUID(), title, content, updatedAt: Date.now() });
  }
  await saveDocuments(env, docs);
  return json({ ok: true });
}

async function handleDocsDelete(request, env) {
  const b = await request.json().catch(() => ({}));
  if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin." }, 403);
  const docs = (await getDocuments(env)).filter((d) => d.id !== b.id);
  await saveDocuments(env, docs);
  return json({ ok: true });
}

// ---------- Địa điểm bản đồ (trong app) ----------
const PLACE_CATS = ["an", "cafe", "choi", "checkin"];

async function handlePlacesList(request, env) {
  // CÔNG KHAI (chế độ test): ai cũng xem được danh sách địa điểm.
  return json({ places: await getPlaces(env) });
}

async function handlePlacesSave(request, env) {
  const b = await request.json().catch(() => ({}));
  // CÔNG KHAI (chế độ test): ai cũng thêm/sửa được địa điểm.
  const name = (b.name || "").toString().trim();
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!name) return json({ error: "Thiếu tên địa điểm." }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ error: "Thiếu toạ độ địa điểm (chọn trên bản đồ)." }, 400);

  const fields = {
    name,
    lat,
    lng,
    category: PLACE_CATS.includes(b.category) ? b.category : "an",
    description: (b.description || "").toString(),
    photos: Array.isArray(b.photos) ? b.photos.filter((x) => typeof x === "string" && x).slice(0, 15) : (b.photoUrl ? [(b.photoUrl || "").toString()] : []),
    address: (b.address || "").toString().trim(),
    rating: b.rating === "" || b.rating == null ? null : Number(b.rating),
  };

  const places = await getPlaces(env);
  if (b.id) {
    const i = places.findIndex((x) => x.id === b.id);
    if (i >= 0) places[i] = { ...places[i], ...fields, updatedAt: Date.now() };
    else places.push({ id: b.id, ...fields, createdAt: Date.now(), updatedAt: Date.now() });
  } else {
    places.push({ id: crypto.randomUUID(), ...fields, createdAt: Date.now(), updatedAt: Date.now() });
  }
  await savePlaces(env, places);
  return json({ ok: true });
}

async function handlePlacesDelete(request, env) {
  const b = await request.json().catch(() => ({}));
  // CÔNG KHAI (chế độ test): ai cũng xóa được địa điểm.
  const places = (await getPlaces(env)).filter((x) => x.id !== b.id);
  await savePlaces(env, places);
  return json({ ok: true });
}

// Tải 1 ảnh lên: nếu đã cấu hình Supabase → lưu Supabase Storage (hợp cho NHIỀU ảnh);
// nếu chưa → fallback lưu KV "photo:<id>" (trả /img/<id>) như cũ.
const SB_BUCKET = "mephil-images";

async function handlePlacesUpload(request, env) {
  if (!env.SETTINGS) return json({ error: "Chưa gắn kho ảnh (KV)." }, 500);
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (!ct.startsWith("image/")) return json({ error: "Chỉ nhận tệp ảnh." }, 400);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: "Ảnh rỗng." }, 400);
  if (buf.byteLength > 6 * 1024 * 1024) return json({ error: "Ảnh quá lớn (>6MB)." }, 413);

  const sb = await getSupabase(env);
  let sbError = null;
  if (sb.url && sb.key) {
    try {
      return json({ url: await uploadToSupabase(sb, buf, ct) });
    } catch (e) {
      sbError = String((e && e.message) || e).slice(0, 300); // surface để chẩn đoán
    }
  }
  const id = crypto.randomUUID();
  await env.SETTINGS.put("photo:" + id, buf, { metadata: { ct } });
  return json({ url: "/img/" + id, sbError });
}

async function uploadToSupabase(sb, buf, ct) {
  const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
  const key = crypto.randomUUID() + "." + ext;
  const headers = { Authorization: `Bearer ${sb.key}`, apikey: sb.key };
  const doPut = () =>
    fetch(`${sb.url}/storage/v1/object/${SB_BUCKET}/${key}`, {
      method: "POST",
      headers: { ...headers, "content-type": ct, "x-upsert": "true", "cache-control": "31536000" },
      body: buf,
    });
  let up = await doPut();
  if (!up.ok && (up.status === 400 || up.status === 404)) {
    // Bucket chưa có → tạo (public) rồi thử lại.
    await fetch(`${sb.url}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ id: SB_BUCKET, name: SB_BUCKET, public: true }),
    }).catch(() => {});
    up = await doPut();
  }
  if (!up.ok) throw new Error("supabase " + up.status + " " + (await up.text().catch(() => "")));
  return `${sb.url}/storage/v1/object/public/${SB_BUCKET}/${key}`;
}

// Phục vụ ảnh từ KV (công khai, cache lâu).
async function handleImg(id, env) {
  if (!env.SETTINGS || !id) return new Response("not found", { status: 404 });
  const { value, metadata } = await env.SETTINGS.getWithMetadata("photo:" + id, { type: "arrayBuffer" });
  if (!value) return new Response("not found", { status: 404 });
  return new Response(value, {
    headers: {
      "content-type": (metadata && metadata.ct) || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

// Trả Google Maps API key cho trang bản đồ — chỉ khi đã đăng nhập admin.
async function handlePlacesMapKey(request, env) {
  // CÔNG KHAI (chế độ test): trả key cho trang bản đồ, không cần đăng nhập.
  // (Key vẫn được bảo vệ bằng HTTP-referrer restriction phía Google.)
  const key = await getGoogleMapsKey(env);
  if (!key) return json({ error: "Chưa cấu hình Google Maps API key. Mở trang Cài đặt (⚙️) để nhập nhé." }, 503);
  return json({ mapKey: key });
}
