// Cloudflare Worker: web tĩnh (public/) + hỏi-đáp (OpenAI) + Telegram + Cài đặt + Tài liệu — tất cả trong app.
import { askAI } from "./openai.js";
import { KNOWLEDGE } from "./knowledge.js";
import { getConfig, isAdmin, sha256, getDocuments, saveDocuments } from "./config.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;
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
  const answer = await askAI({ question, history: body.history || [], apiKey: cfg.openaiKey, model: cfg.model, knowledge });
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
      answer = await askAI({ question: text, history: [], apiKey: cfg.openaiKey, model: cfg.model, knowledge });
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
  return json({
    hasAdmin: !!cfg.adminHash,
    hasOpenAI: !!cfg.openaiKey,
    model: cfg.model,
    hasTelegramToken: !!cfg.tgToken,
    hasTelegramSecret: !!cfg.tgSecret,
    docCount: docs.length,
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
