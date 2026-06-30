// Lớp gọi Claude: nạp toàn bộ tài liệu tour vào ngữ cảnh (có prompt caching) rồi hỏi.
import { KNOWLEDGE } from "./knowledge.js";
import { SYSTEM_INSTRUCTIONS } from "./system-prompt.js";

const API_URL = "https://api.anthropic.com/v1/messages";

// Chuẩn hóa lịch sử chat thành chuỗi user/assistant xen kẽ, kết thúc bằng assistant.
function normalizeHistory(history) {
  const out = [];
  for (const m of history || []) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || !m.content) continue;
    const content = String(m.content).slice(0, 4000);
    if (out.length && out[out.length - 1].role === m.role) {
      out[out.length - 1].content = content; // gộp nếu trùng vai để giữ xen kẽ
    } else {
      out.push({ role: m.role, content });
    }
  }
  while (out.length && out[0].role !== "user") out.shift();
  while (out.length && out[out.length - 1].role !== "assistant") out.pop();
  return out.slice(-8); // tối đa 4 lượt gần nhất
}

export async function askClaude({ question, history = [], env }) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("Server chưa cấu hình ANTHROPIC_API_KEY");

  const model = env.MODEL || "claude-opus-4-8";
  const maxTokens = Number(env.MAX_TOKENS || 2048);

  // System = hướng dẫn ổn định + tài liệu (đánh dấu cache để các lần sau rẻ + nhanh).
  const system = [
    { type: "text", text: SYSTEM_INSTRUCTIONS },
    {
      type: "text",
      text: "=== TÀI LIỆU TOUR (nguồn DUY NHẤT để trả lời) ===\n\n" + KNOWLEDGE,
      cache_control: { type: "ephemeral" },
    },
  ];

  const messages = [
    ...normalizeHistory(history),
    { role: "user", content: String(question).slice(0, 4000) },
  ];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || "Xin lỗi, tôi chưa tạo được câu trả lời. Bạn thử hỏi lại nhé.";
}
