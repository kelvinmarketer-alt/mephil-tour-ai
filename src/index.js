// Cloudflare Worker: phục vụ web tĩnh (public/) + 2 API: /api/ask (web) và /api/telegram (bot).
import { askClaude } from "./claude.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/ask") {
      return handleAsk(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/telegram") {
      return handleTelegram(request, env, ctx);
    }

    // Còn lại: tài nguyên tĩnh (index.html...). Assets-first đã phục vụ; đây là fallback.
    return env.ASSETS.fetch(request);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// ---- Web chat ----
async function handleAsk(request, env) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = (body.question || "").toString().trim();
    if (!question) return json({ error: "Thiếu câu hỏi" }, 400);
    const answer = await askClaude({ question, history: body.history || [], env });
    return json({ answer });
  } catch (e) {
    return json({ error: "Lỗi xử lý: " + e.message }, 500);
  }
}

// ---- Telegram webhook ---- (trả "ok" ngay, xử lý ở nền để Telegram không retry)
async function handleTelegram(request, env, ctx) {
  if (env.TELEGRAM_SECRET) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== env.TELEGRAM_SECRET) return new Response("forbidden", { status: 403 });
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
  if (!chatId || !text) return new Response("ok");

  ctx.waitUntil(replyTelegram(env, chatId, text));
  return new Response("ok");
}

async function replyTelegram(env, chatId, text) {
  if (text.startsWith("/start") || text.startsWith("/help")) {
    return sendMessage(
      env,
      chatId,
      "Xin chào! Mình là trợ lý tour Mê Philippines 🌴\n" +
        "Bạn cứ hỏi bất kỳ điều gì về tour, giá, lịch trình, chính sách... " +
        "mình trả lời theo đúng tài liệu công ty nhé."
    );
  }

  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});

  let answer;
  try {
    answer = await askClaude({ question: text, history: [], env });
  } catch {
    answer = "Xin lỗi, hiện chưa trả lời được. Bạn thử lại sau giúp mình nhé.";
  }
  await sendMessage(env, chatId, answer);
}

async function sendMessage(env, chatId, text) {
  for (let i = 0; i < text.length; i += 3800) {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(i, i + 3800) }),
    }).catch(() => {});
  }
}
