// Endpoint cho web chat: POST /api/ask  { question, history }
import { askClaude } from "../_shared/claude.js";

export async function onRequestPost({ request, env }) {
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
