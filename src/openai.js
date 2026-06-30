// Gọi OpenAI: nạp toàn bộ tài liệu tour (do caller dựng từ KV) vào system message rồi hỏi.
import { SYSTEM_INSTRUCTIONS } from "./system-prompt.js";

const API_URL = "https://api.openai.com/v1/chat/completions";

// Chuẩn hóa lịch sử chat thành user/assistant xen kẽ, kết thúc bằng assistant.
function normalizeHistory(history) {
  const out = [];
  for (const m of history || []) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || !m.content) continue;
    const content = String(m.content).slice(0, 4000);
    if (out.length && out[out.length - 1].role === m.role) {
      out[out.length - 1].content = content;
    } else {
      out.push({ role: m.role, content });
    }
  }
  while (out.length && out[0].role !== "user") out.shift();
  while (out.length && out[out.length - 1].role !== "assistant") out.pop();
  return out.slice(-8);
}

export async function askAI({ question, history = [], apiKey, model, knowledge }) {
  if (!apiKey) throw new Error("Chưa cấu hình OpenAI API key");

  const messages = [
    {
      role: "system",
      content:
        SYSTEM_INSTRUCTIONS +
        "\n\n=== TÀI LIỆU TOUR (nguồn DUY NHẤT để trả lời) ===\n\n" +
        (knowledge && knowledge.trim() ? knowledge : "(Kho tài liệu đang trống — báo người dùng vào trang 📚 Tài liệu để thêm.)"),
    },
    ...normalizeHistory(history),
    { role: "user", content: String(question).slice(0, 4000) },
  ];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages,
      max_tokens: 1024,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || "Xin lỗi, tôi chưa tạo được câu trả lời. Bạn thử hỏi lại nhé.";
}
