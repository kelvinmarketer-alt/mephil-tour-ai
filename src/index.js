// Cloudflare Worker: web tĩnh (public/) + hỏi-đáp (OpenAI) + Telegram + Cài đặt + Tài liệu — tất cả trong app.
import { askAI } from "./openai.js";
import { KNOWLEDGE } from "./knowledge.js";
import { getConfig, isAdmin, sha256, getDocuments, saveDocuments, getPlaces, savePlaces, getGoogleMapsKey, getSupabase } from "./config.js";
import { createUser, getUserByEmail, getUserById, createSession, deleteSession, verifyPassword, hashPassword, sessionUser, publicUser, isAdmin as isUserAdmin, isActive, isPaid } from "./auth.js";

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
      if (request.method === "GET" && p === "/api/keepalive") return await handleKeepalive(env);
      if (request.method === "POST" && p === "/api/auth/signup") return await handleSignup(request, env);
      if (request.method === "POST" && p === "/api/auth/login") return await handleLogin(request, env);
      if (request.method === "POST" && p === "/api/auth/logout") return await handleLogout(request, env);
      if (request.method === "GET" && p === "/api/auth/me") return await handleMe(request, env);
      if (request.method === "POST" && p === "/api/auth/bootstrap-admin") return await handleBootstrapAdmin(request, env);
      if (request.method === "POST" && p === "/api/admin/users/list") return await handleUsersList(request, env);
      if (request.method === "POST" && p === "/api/admin/users/save") return await handleUsersSave(request, env);
      if (request.method === "POST" && p === "/api/admin/users/delete") return await handleUsersDelete(request, env);
      if (request.method === "POST" && p === "/api/tours/list") return await handleToursList(request, env);
      if (request.method === "POST" && p === "/api/tours/get") return await handleToursGet(request, env);
      if (request.method === "POST" && p === "/api/admin/tours/save") return await handleAdminToursSave(request, env);
      if (request.method === "POST" && p === "/api/admin/tours/delete") return await handleAdminToursDelete(request, env);
      if (request.method === "POST" && p === "/api/admin/migrate-places") return await handleMigratePlaces(request, env);
      if (request.method === "POST" && p === "/api/admin/places/pending") return await handlePendingList(request, env);
      if (request.method === "POST" && p === "/api/admin/places/approve") return await handleApprovePlace(request, env);
      if (request.method === "POST" && p === "/api/admin/places/reject") return await handleRejectPlace(request, env);
      if (request.method === "POST" && p === "/api/reviews/list") return await handleReviewsList(request, env);
      if (request.method === "POST" && p === "/api/reviews/save") return await handleReviewsSave(request, env);
      if (request.method === "POST" && p === "/api/reviews/delete") return await handleReviewsDelete(request, env);
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

// ---- Điểm trong D1: 3 lớp = chính thức (owner NULL) / riêng tư / đề xuất (pending) ----
function placeRow(r) {
  return { id: r.id, name: r.name, lat: r.lat, lng: r.lng, category: r.category, description: r.description || "", photos: r.photos ? JSON.parse(r.photos) : [], address: r.address || "", rating: r.rating, owner_id: r.owner_id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at };
}
async function dbAllPlaces(env) { const { results } = await env.DB.prepare("SELECT * FROM places").all(); return (results || []).map(placeRow); }
async function dbPlace(env, id) { const r = await env.DB.prepare("SELECT * FROM places WHERE id=?").bind(id).first(); return r ? placeRow(r) : null; }

// Tự nạp điểm cũ từ KV sang D1 lần đầu (idempotent qua cờ KV).
async function ensurePlaces(env) {
  if (!env.DB || !env.SETTINGS) return;
  if (await env.SETTINGS.get("places_migrated")) return;
  const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM places").first();
  if (!c || c.n === 0) {
    const kv = await getPlaces(env);
    const now = Date.now();
    for (const p of kv) {
      await env.DB.prepare("INSERT OR IGNORE INTO places (id,name,lat,lng,category,description,photos,address,rating,owner_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(p.id, p.name, p.lat, p.lng, p.category || "an", p.description || "", JSON.stringify(p.photos || []), p.address || "", p.rating ?? null, null, "approved", p.createdAt || now, p.updatedAt || now).run();
    }
  }
  await env.SETTINGS.put("places_migrated", "1");
}

async function handlePlacesList(request, env) {
  await ensurePlaces(env);
  const u = await sessionUser(request, env);
  const uid = u ? u.id : null;
  const all = await dbAllPlaces(env);
  const strip = (p) => ({ id: p.id, name: p.name, category: p.category, lat: p.lat, lng: p.lng, locked: true });
  const isMine = (p) => !!uid && p.owner_id === uid;
  const stats = await reviewStats(env);
  const flag = (p) => ({ ...p, mine: isMine(p), reviews: stats[p.id] || { count: 0, avg: null, verified: 0 } });

  if (isUserAdmin(u)) return json({ places: all.map(flag), full: true, tier: "admin" });

  const mine = all.filter(isMine);
  const official = all.filter((p) => p.status === "approved" && !isMine(p));

  if (isPaid(u)) return json({ places: [...official, ...mine].map(flag), full: true, tier: "paid" });
  if (isActive(u)) return json({ places: [...official.map(strip), ...mine.map(flag)], full: false, tier: "trial" });
  const b = await request.json().catch(() => ({}));
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ places: [], full: false, tier: "guest", needLocation: true });
  const near = official.filter((p) => distKmSrv(lat, lng, p.lat, p.lng) <= 5).map(strip);
  return json({ places: near, full: false, tier: "guest" });
}

function distKmSrv(lat1, lng1, lat2, lng2) {
  const R = 6371, toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function handlePlacesSave(request, env) {
  const u = await sessionUser(request, env);
  if (!isActive(u)) return json({ error: "Cần đăng nhập (còn hạn) để thêm/sửa điểm." }, 403);
  const admin = isUserAdmin(u);
  const b = await request.json().catch(() => ({}));
  const name = (b.name || "").toString().trim();
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!name) return json({ error: "Thiếu tên địa điểm." }, 400);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ error: "Thiếu toạ độ địa điểm (chọn trên bản đồ)." }, 400);
  const category = PLACE_CATS.includes(b.category) ? b.category : "an";
  const description = (b.description || "").toString();
  const photos = JSON.stringify(Array.isArray(b.photos) ? b.photos.filter((x) => typeof x === "string" && x).slice(0, 15) : []);
  const address = (b.address || "").toString().trim();
  const rating = b.rating === "" || b.rating == null ? null : Number(b.rating);
  const now = Date.now();

  if (b.id) {
    const ex = await dbPlace(env, b.id);
    if (!ex) return json({ error: "Không tìm thấy điểm." }, 404);
    if (!admin && ex.owner_id !== u.id) return json({ error: "Không có quyền sửa điểm này." }, 403);
    let status = ex.status;
    if (!admin) status = b.suggest ? "pending" : ex.status === "approved" ? "approved" : "private";
    await env.DB.prepare("UPDATE places SET name=?,lat=?,lng=?,category=?,description=?,photos=?,address=?,rating=?,status=?,updated_at=? WHERE id=?")
      .bind(name, lat, lng, category, description, photos, address, rating, status, now, b.id).run();
    return json({ ok: true, id: b.id, status });
  }
  const id = crypto.randomUUID();
  const owner_id = admin ? null : u.id;
  const status = admin ? "approved" : b.suggest ? "pending" : "private";
  await env.DB.prepare("INSERT INTO places (id,name,lat,lng,category,description,photos,address,rating,owner_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, name, lat, lng, category, description, photos, address, rating, owner_id, status, now, now).run();
  return json({ ok: true, id, status });
}

async function handlePlacesDelete(request, env) {
  const u = await sessionUser(request, env);
  if (!isActive(u)) return json({ error: "Cần đăng nhập." }, 403);
  const b = await request.json().catch(() => ({}));
  const ex = await dbPlace(env, b.id);
  if (!ex) return json({ ok: true });
  if (!isUserAdmin(u) && ex.owner_id !== u.id) return json({ error: "Không có quyền xóa điểm này." }, 403);
  await env.DB.prepare("DELETE FROM places WHERE id=?").bind(b.id).run();
  return json({ ok: true });
}

// ---- Chuyển điểm cũ từ KV sang D1 (chạy 1 lần, idempotent) + duyệt đề xuất ----
async function handleMigratePlaces(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const kv = await getPlaces(env);
  let n = 0;
  for (const p of kv) {
    const ex = await env.DB.prepare("SELECT id FROM places WHERE id=?").bind(p.id).first();
    if (ex) continue;
    await env.DB.prepare("INSERT INTO places (id,name,lat,lng,category,description,photos,address,rating,owner_id,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(p.id, p.name, p.lat, p.lng, p.category || "an", p.description || "", JSON.stringify(p.photos || []), p.address || "", p.rating ?? null, null, "approved", p.createdAt || Date.now(), p.updatedAt || Date.now()).run();
    n++;
  }
  return json({ ok: true, migrated: n, kvTotal: kv.length });
}
async function handlePendingList(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const { results } = await env.DB.prepare("SELECT * FROM places WHERE status='pending' ORDER BY created_at DESC").all();
  const out = [];
  for (const r of results || []) { const o = r.owner_id ? await getUserById(env, r.owner_id) : null; out.push({ ...placeRow(r), owner_email: o ? o.email : null }); }
  return json({ places: out });
}
async function handleApprovePlace(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  await env.DB.prepare("UPDATE places SET status='approved', updated_at=? WHERE id=?").bind(Date.now(), b.id).run();
  return json({ ok: true });
}
async function handleRejectPlace(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  await env.DB.prepare("DELETE FROM places WHERE id=?").bind(b.id).run();
  return json({ ok: true });
}

// ---------- Đánh giá (D1 reviews) ----------
// Thống kê theo điểm: số lượng, điểm TB, số "đã kiểm chứng".
async function reviewStats(env) {
  const m = {};
  if (!env.DB) return m;
  const { results } = await env.DB.prepare("SELECT place_id, COUNT(*) AS n, AVG(rating) AS avg, SUM(verified_checkin) AS v FROM reviews GROUP BY place_id").all();
  for (const r of results || []) m[r.place_id] = { count: r.n, avg: r.avg, verified: r.v };
  return m;
}
// Danh sách đánh giá của 1 điểm — chỉ trả phí/admin (hoặc chủ điểm) mới xem nội dung.
async function handleReviewsList(request, env) {
  const u = await sessionUser(request, env);
  const b = await request.json().catch(() => ({}));
  const placeId = b.place_id;
  if (!placeId) return json({ error: "Thiếu place_id." }, 400);
  const place = await dbPlace(env, placeId);
  const isOwner = u && place && place.owner_id === u.id;
  if (!isPaid(u) && !isOwner) return json({ locked: true, canReview: isActive(u) });
  const { results } = await env.DB.prepare("SELECT * FROM reviews WHERE place_id=? ORDER BY verified_checkin DESC, created_at DESC").bind(placeId).all();
  const out = [];
  for (const r of results || []) {
    const au = await getUserById(env, r.user_id);
    out.push({ id: r.id, author: au ? au.name || au.email.split("@")[0] : "Ẩn danh", rating: r.rating, content: r.content, photos: r.photos ? JSON.parse(r.photos) : [], verified: r.verified_checkin, created_at: r.created_at, mine: !!u && r.user_id === u.id });
  }
  return json({ reviews: out, canReview: isActive(u) });
}
// Viết/sửa đánh giá (mỗi user 1 đánh giá/điểm). Cần ≥100 ký tự. Gần điểm <150m → đã kiểm chứng.
async function handleReviewsSave(request, env) {
  const u = await sessionUser(request, env);
  if (!isActive(u)) return json({ error: "Cần đăng nhập (còn hạn) để đánh giá." }, 403);
  const b = await request.json().catch(() => ({}));
  const place = await dbPlace(env, b.place_id);
  if (!place) return json({ error: "Không tìm thấy điểm." }, 404);
  const rating = Math.max(1, Math.min(5, Math.round(Number(b.rating) || 0)));
  if (!rating) return json({ error: "Chọn số sao (1–5)." }, 400);
  const content = (b.content || "").toString().trim();
  if (content.length < 100) return json({ error: "Đánh giá cần tối thiểu 100 ký tự (hiện " + content.length + ")." }, 400);
  const photos = JSON.stringify(Array.isArray(b.photos) ? b.photos.filter((x) => typeof x === "string" && x).slice(0, 10) : []);
  const lat = Number(b.lat), lng = Number(b.lng);
  const verified = Number.isFinite(lat) && Number.isFinite(lng) && distKmSrv(lat, lng, place.lat, place.lng) <= 0.15 ? 1 : 0;
  const now = Date.now();
  const ex = await env.DB.prepare("SELECT id FROM reviews WHERE place_id=? AND user_id=?").bind(b.place_id, u.id).first();
  if (ex) {
    await env.DB.prepare("UPDATE reviews SET rating=?,content=?,photos=?,verified_checkin=?,lat=?,lng=?,updated_at=? WHERE id=?")
      .bind(rating, content, photos, verified, Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null, now, ex.id).run();
    return json({ ok: true, id: ex.id, verified });
  }
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO reviews (id,place_id,user_id,rating,content,photos,verified_checkin,lat,lng,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, b.place_id, u.id, rating, content, photos, verified, Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null, now, now).run();
  return json({ ok: true, id, verified });
}
async function handleReviewsDelete(request, env) {
  const u = await sessionUser(request, env);
  if (!isActive(u)) return json({ error: "Cần đăng nhập." }, 403);
  const b = await request.json().catch(() => ({}));
  const r = await env.DB.prepare("SELECT * FROM reviews WHERE id=?").bind(b.id).first();
  if (!r) return json({ ok: true });
  if (!isUserAdmin(u) && r.user_id !== u.id) return json({ error: "Không có quyền xóa đánh giá này." }, 403);
  await env.DB.prepare("DELETE FROM reviews WHERE id=?").bind(b.id).run();
  return json({ ok: true });
}

// Tải 1 ảnh lên: nếu đã cấu hình Supabase → lưu Supabase Storage (hợp cho NHIỀU ảnh);
// nếu chưa → fallback lưu KV "photo:<id>" (trả /img/<id>) như cũ.
const SB_BUCKET = "mephil-images";

// Gọi thật vào Supabase để project không bị coi là "im lặng" (free tier tự pause sau 7 ngày).
// GitHub Actions gọi endpoint này hằng ngày. Key lấy từ KV nên không cần lưu secret ở GitHub.
async function handleKeepalive(env) {
  const sb = await getSupabase(env);
  if (!sb.url || !sb.key) return json({ ok: false, reason: "chưa cấu hình Supabase" }, 200);
  try {
    const res = await fetch(`${sb.url}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key },
    });
    return json({ ok: res.ok, status: res.status, at: new Date().toISOString() });
  } catch (e) {
    return json({ ok: false, error: String((e && e.message) || e).slice(0, 200) }, 200);
  }
}

async function handlePlacesUpload(request, env) {
  const u = await sessionUser(request, env);
  if (!isActive(u)) return json({ error: "Cần đăng nhập để tải ảnh." }, 403);
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

// ---------- Xác thực người dùng (D1) ----------
async function handleSignup(request, env) {
  if (!env.DB) return json({ error: "Chưa gắn database (D1)." }, 500);
  const b = await request.json().catch(() => ({}));
  try {
    const u = await createUser(env, { email: b.email, password: b.password, name: b.name });
    const t = await createSession(env, u.id);
    return json({ token: t, user: publicUser(u) });
  } catch (e) { return json({ error: e.message }, 400); }
}
async function handleLogin(request, env) {
  if (!env.DB) return json({ error: "Chưa gắn database (D1)." }, 500);
  const b = await request.json().catch(() => ({}));
  const u = await getUserByEmail(env, b.email);
  if (!u || !(await verifyPassword(b.password || "", u.salt, u.password_hash))) return json({ error: "Sai email hoặc mật khẩu." }, 401);
  const t = await createSession(env, u.id);
  return json({ token: t, user: publicUser(u) });
}
async function handleLogout(request, env) {
  const h = request.headers.get("authorization") || "";
  if (h.startsWith("Bearer ")) await deleteSession(env, h.slice(7).trim());
  return json({ ok: true });
}
async function handleMe(request, env) {
  return json({ user: publicUser(await sessionUser(request, env)) });
}
// Tạo admin ĐẦU TIÊN — chỉ khi chưa có admin nào, bảo vệ bằng mật khẩu admin KV cũ.
async function handleBootstrapAdmin(request, env) {
  if (!env.DB) return json({ error: "Chưa gắn database (D1)." }, 500);
  const b = await request.json().catch(() => ({}));
  if (!(await isAdmin(env, b.adminPassword))) return json({ error: "Sai mật khẩu admin (KV)." }, 403);
  const existing = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
  if (existing) return json({ error: "Đã có admin — hãy đăng nhập." }, 400);
  try {
    const u = await createUser(env, { email: b.email, password: b.password, name: b.name || "Admin", role: "admin", plan: "none", expires_at: null });
    const t = await createSession(env, u.id);
    return json({ token: t, user: publicUser(u) });
  } catch (e) { return json({ error: e.message }, 400); }
}

// ---------- Quản lý user (CHỈ admin) ----------
async function requireAdmin(request, env) {
  const u = await sessionUser(request, env);
  return isUserAdmin(u) ? u : null;
}
async function handleUsersList(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const { results } = await env.DB.prepare("SELECT id,email,name,role,plan,expires_at,created_at FROM users ORDER BY created_at DESC").all();
  return json({ users: results || [] });
}
async function handleUsersSave(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  const now = Date.now();
  try {
    if (b.id) {
      const u = await getUserById(env, b.id);
      if (!u) return json({ error: "Không tìm thấy user." }, 404);
      await env.DB.prepare("UPDATE users SET name=?, role=?, plan=?, expires_at=?, updated_at=? WHERE id=?")
        .bind(b.name ?? u.name, b.role || u.role, b.plan || u.plan, b.expires_at !== undefined ? b.expires_at : u.expires_at, now, b.id).run();
      if (b.password) { const { hash, salt } = await hashPassword(b.password); await env.DB.prepare("UPDATE users SET password_hash=?, salt=? WHERE id=?").bind(hash, salt, b.id).run(); }
      return json({ ok: true });
    }
    const u = await createUser(env, { email: b.email, password: b.password, name: b.name, role: b.role || "user", plan: b.plan || "trial", expires_at: b.expires_at });
    return json({ ok: true, id: u.id });
  } catch (e) { return json({ error: e.message }, 400); }
}
async function handleUsersDelete(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(b.id).run();
  await env.DB.prepare("DELETE FROM users WHERE id=?").bind(b.id).run();
  return json({ ok: true });
}

// ---------- Tour + lịch trình (D1) ----------
// Danh sách tour: admin thấy hết; người khác chỉ tour đã publish. Kèm số ngày.
async function handleToursList(request, env) {
  if (!env.DB) return json({ tours: [], canView: false });
  const u = await sessionUser(request, env);
  const admin = isUserAdmin(u);
  const q = admin ? "SELECT * FROM tours ORDER BY created_at DESC" : "SELECT * FROM tours WHERE published=1 ORDER BY created_at DESC";
  const { results } = await env.DB.prepare(q).all();
  const tours = [];
  for (const t of results || []) {
    const dc = await env.DB.prepare("SELECT COUNT(*) AS n FROM tour_days WHERE tour_id=?").bind(t.id).first();
    tours.push({ id: t.id, title: t.title, description: t.description, cover_photo: t.cover_photo, published: t.published, dayCount: dc ? dc.n : 0 });
  }
  return json({ tours, canView: isPaid(u) });
}

// Chi tiết tour: chỉ TRẢ PHÍ/admin xem đầy đủ lịch trình; còn lại chỉ tên + mô tả (khoá).
async function handleToursGet(request, env) {
  if (!env.DB) return json({ error: "Chưa gắn database." }, 500);
  const u = await sessionUser(request, env);
  const b = await request.json().catch(() => ({}));
  const t = await env.DB.prepare("SELECT * FROM tours WHERE id=?").bind(b.id).first();
  if (!t) return json({ error: "Không tìm thấy tour." }, 404);
  if (!isPaid(u)) return json({ locked: true, tour: { id: t.id, title: t.title, description: t.description, cover_photo: t.cover_photo } });
  const { results: days } = await env.DB.prepare("SELECT * FROM tour_days WHERE tour_id=? ORDER BY day_no").bind(t.id).all();
  const all = await dbAllPlaces(env);
  const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  const fullDays = [];
  for (const d of days || []) {
    const { results: stops } = await env.DB.prepare("SELECT * FROM tour_stops WHERE day_id=? ORDER BY seq").bind(d.id).all();
    fullDays.push({ id: d.id, day_no: d.day_no, title: d.title, note: d.note, stops: (stops || []).map((s) => ({ id: s.id, place_id: s.place_id, guide: s.guide, place: byId[s.place_id] || null })) });
  }
  return json({ tour: { id: t.id, title: t.title, description: t.description, cover_photo: t.cover_photo, published: t.published, days: fullDays } });
}

// Admin lưu tour: tạo/sửa tour + thay toàn bộ ngày & điểm dừng.
async function handleAdminToursSave(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  if (!(b.title || "").trim()) return json({ error: "Thiếu tên tour." }, 400);
  const now = Date.now();
  let id = b.id;
  if (id) {
    await env.DB.prepare("UPDATE tours SET title=?,description=?,cover_photo=?,published=?,updated_at=? WHERE id=?")
      .bind(b.title, b.description || "", b.cover_photo || "", b.published ? 1 : 0, now, id).run();
    const { results: od } = await env.DB.prepare("SELECT id FROM tour_days WHERE tour_id=?").bind(id).all();
    for (const d of od || []) await env.DB.prepare("DELETE FROM tour_stops WHERE day_id=?").bind(d.id).run();
    await env.DB.prepare("DELETE FROM tour_days WHERE tour_id=?").bind(id).run();
  } else {
    id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO tours (id,title,description,cover_photo,published,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .bind(id, b.title, b.description || "", b.cover_photo || "", b.published ? 1 : 0, now, now).run();
  }
  const days = Array.isArray(b.days) ? b.days : [];
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const dayId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO tour_days (id,tour_id,day_no,title,note) VALUES (?,?,?,?,?)").bind(dayId, id, i + 1, d.title || "", d.note || "").run();
    const stops = Array.isArray(d.stops) ? d.stops : [];
    for (let j = 0; j < stops.length; j++) {
      const s = stops[j];
      if (!s || !s.place_id) continue;
      await env.DB.prepare("INSERT INTO tour_stops (id,day_id,place_id,seq,guide) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), dayId, s.place_id, j, s.guide || "").run();
    }
  }
  return json({ ok: true, id });
}

async function handleAdminToursDelete(request, env) {
  if (!(await requireAdmin(request, env))) return json({ error: "Cần quyền admin." }, 403);
  const b = await request.json().catch(() => ({}));
  const { results: days } = await env.DB.prepare("SELECT id FROM tour_days WHERE tour_id=?").bind(b.id).all();
  for (const d of days || []) await env.DB.prepare("DELETE FROM tour_stops WHERE day_id=?").bind(d.id).run();
  await env.DB.prepare("DELETE FROM tour_days WHERE tour_id=?").bind(b.id).run();
  await env.DB.prepare("DELETE FROM tours WHERE id=?").bind(b.id).run();
  return json({ ok: true });
}

// Trả Google Maps API key cho trang bản đồ — chỉ khi đã đăng nhập admin.
async function handlePlacesMapKey(request, env) {
  // CÔNG KHAI (chế độ test): trả key cho trang bản đồ, không cần đăng nhập.
  // (Key vẫn được bảo vệ bằng HTTP-referrer restriction phía Google.)
  const key = await getGoogleMapsKey(env);
  if (!key) return json({ error: "Chưa cấu hình Google Maps API key. Mở trang Cài đặt (⚙️) để nhập nhé." }, 503);
  return json({ mapKey: key });
}
