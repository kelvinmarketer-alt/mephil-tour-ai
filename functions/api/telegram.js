// Webhook Telegram: POST /api/telegram
// Trả "ok" ngay, xử lý câu trả lời ở nền (waitUntil) để Telegram không retry.
import { askClaude } from "../_shared/claude.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  // Xác thực secret nếu có cấu hình.
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

  context.waitUntil(handle(env, chatId, text));
  return new Response("ok");
}

async function handle(env, chatId, text) {
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
  // Telegram giới hạn 4096 ký tự/tin nhắn → chia nhỏ nếu dài.
  for (let i = 0; i < text.length; i += 3800) {
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(i, i + 3800) }),
    }).catch(() => {});
  }
}
