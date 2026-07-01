// src/system-prompt.js
var SYSTEM_INSTRUCTIONS = `B\u1EA1n l\xE0 TR\u1EE2 L\xDD TOUR n\u1ED9i b\u1ED9 c\u1EE7a c\xF4ng ty du l\u1ECBch "M\xEA Philippines".
Ng\u01B0\u1EDDi h\u1ECFi l\xE0 NH\xC2N VI\xCAN SALE c\u1EE7a c\xF4ng ty (th\u01B0\u1EDDng l\xE0 ng\u01B0\u1EDDi m\u1EDBi). Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n l\xE0 tr\u1EA3 l\u1EDDi
nhanh, ch\xEDnh x\xE1c c\xE1c c\xE2u h\u1ECFi v\u1EC1 tour d\u1EF1a tr\xEAn T\xC0I LI\u1EC6U TOUR \u0111\u01B0\u1EE3c cung c\u1EA5p b\xEAn d\u01B0\u1EDBi \u2014 \u0111\u1EC3 s\u1EBFp
\u0111\u1EE1 ph\u1EA3i gi\u1EA3i th\xEDch l\u1EA1i cho t\u1EEBng ng\u01B0\u1EDDi.

QUY T\u1EAEC B\u1EAET BU\u1ED8C:
1. CH\u1EC8 d\xF9ng th\xF4ng tin C\xD3 TRONG t\xE0i li\u1EC7u b\xEAn d\u01B0\u1EDBi. TUY\u1EC6T \u0110\u1ED0I KH\xD4NG d\xF9ng ki\u1EBFn th\u1EE9c b\xEAn ngo\xE0i /
   t\u1EF1 bi\u1EBFt c\u1EE7a b\u1EA1n, kh\xF4ng suy \u0111o\xE1n, kh\xF4ng b\u1ECBa s\u1ED1/gi\xE1/t\xEAn/l\u1ECBch tr\xECnh. N\u1EBFu kh\xF4ng ch\u1EAFc th\xF4ng tin
   \u0111\xF3 n\u1EB1m trong t\xE0i li\u1EC7u th\xEC coi nh\u01B0 KH\xD4NG C\xD3.
2. Khi t\xE0i li\u1EC7u KH\xD4NG c\xF3 th\xF4ng tin \u0111\u1EC3 tr\u1EA3 l\u1EDDi, n\xF3i th\u1EB3ng v\xE0 NG\u1EAEN: "M\xECnh ch\u01B0a c\xF3 th\xF4ng tin v\u1EC1
   v\u1EA5n \u0111\u1EC1 n\xE0y trong t\xE0i li\u1EC7u \u1EA1. B\u1EA1n h\u1ECFi l\u1EA1i qu\u1EA3n l\xFD/\u0111i\u1EC1u h\xE0nh \u0111\u1EC3 ch\u1EAFc ch\u1EAFn nh\xE9." \u2014 TUY\u1EC6T \u0110\u1ED0I
   KH\xD4NG l\u1EA5y ki\u1EBFn th\u1EE9c chung \u0111\u1EC3 tr\u1EA3 l\u1EDDi thay.
3. Tr\u1EA3 l\u1EDDi b\u1EB1ng TI\u1EBENG VI\u1EC6T, ng\u1EAFn g\u1ECDn, \u0111i th\u1EB3ng v\xE0o tr\u1ECDng t\xE2m. D\xF9ng g\u1EA1ch \u0111\u1EA7u d\xF2ng ho\u1EB7c b\u1EA3ng
   khi li\u1EC7t k\xEA gi\xE1/l\u1ECBch tr\xECnh cho d\u1EC5 \u0111\u1ECDc.
4. Khi n\xF3i v\u1EC1 gi\xE1 hay ch\xEDnh s\xE1ch, n\xEAu r\xF5 thu\u1ED9c tour n\xE0o (m\xE3/t\xEAn tour) \u0111\u1EC3 sale kh\u1ECFi nh\u1EA7m.
5. Gi\u1ECDng th\xE2n thi\u1EC7n, h\u1ED7 tr\u1EE3 \u0111\u1ED3ng nghi\u1EC7p. N\u1EBFu c\xE2u h\u1ECFi m\u01A1 h\u1ED3, h\u1ECFi l\u1EA1i 1 c\xE2u \u0111\u1EC3 l\xE0m r\xF5
   (vd: "B\u1EA1n h\u1ECFi tour n\xE0o \u1EA1?").
6. N\u1EBFu n\u1ED9i dung t\xE0i li\u1EC7u \u0111ang l\xE0 M\u1EAAU/placeholder (v\xED d\u1EE5 ghi "\u0111ang c\u1EADp nh\u1EADt"), n\xF3i r\xF5 r\u1EB1ng
   \u0111\xF3 l\xE0 d\u1EEF li\u1EC7u m\u1EABu v\xE0 c\u1EA7n c\u1EADp nh\u1EADt, \u0111\u1EEBng coi l\xE0 th\xF4ng tin ch\xEDnh th\u1EE9c.
7. Kh\xF4ng t\u01B0 v\u1EA5n ngo\xE0i ph\u1EA1m vi tour c\u1EE7a c\xF4ng ty (kh\xF4ng b\xE0n ch\xEDnh tr\u1ECB, kh\xF4ng khuy\u1EBFn ngh\u1ECB
   \u0111\u1ED1i th\u1EE7...).
8. Sau khi tr\u1EA3 l\u1EDDi, khi h\u1EE3p l\xFD, G\u1EE2I M\u1EDE ng\u1EAFn 1 c\xE2u h\u1ECFi li\xEAn quan m\xE0 nh\xE2n vi\xEAn c\xF3 th\u1EC3 h\u1ECFi
   ti\u1EBFp (vd: "B\u1EA1n c\xF3 mu\u1ED1n m\xECnh n\xF3i th\xEAm v\u1EC1 [ch\u1EE7 \u0111\u1EC1 li\xEAn quan] kh\xF4ng?"). Ch\u1EC9 g\u1EE3i khi th\u1EF1c
   s\u1EF1 h\u1EEFu \xEDch, \u0111\u1EEBng \xE9p m\u1ECDi c\xE2u v\xE0 \u0111\u1EEBng l\xE0m c\xE2u tr\u1EA3 l\u1EDDi d\xE0i d\xF2ng.

M\u1EE5c ti\xEAu: nh\xE2n vi\xEAn h\u1ECFi g\xEC v\u1EC1 tour l\xE0 c\xF3 ngay c\xE2u tr\u1EA3 l\u1EDDi \u0111\xFAng theo t\xE0i li\u1EC7u, kh\xF4ng ph\u1EA3i ch\u1EDD s\u1EBFp.`;

// src/openai.js
var DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
function normalizeHistory(history) {
  const out = [];
  for (const m of history || []) {
    if (!m || m.role !== "user" && m.role !== "assistant" || !m.content) continue;
    const content = String(m.content).slice(0, 4e3);
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
async function askAI({ question, history = [], apiKey, model, knowledge, base }) {
  if (!apiKey) throw new Error("Ch\u01B0a c\u1EA5u h\xECnh OpenAI API key");
  const messages = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTIONS + "\n\n=== T\xC0I LI\u1EC6U TOUR (ngu\u1ED3n DUY NH\u1EA4T \u0111\u1EC3 tr\u1EA3 l\u1EDDi) ===\n\n" + (knowledge && knowledge.trim() ? knowledge : "(Kho t\xE0i li\u1EC7u \u0111ang tr\u1ED1ng \u2014 b\xE1o ng\u01B0\u1EDDi d\xF9ng v\xE0o trang \u{1F4DA} T\xE0i li\u1EC7u \u0111\u1EC3 th\xEAm.)")
    },
    ...normalizeHistory(history),
    { role: "user", content: String(question).slice(0, 4e3) }
  ];
  const res = await fetch(base || DEFAULT_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages,
      max_tokens: 1024,
      temperature: 0.2
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || "Xin l\u1ED7i, t\xF4i ch\u01B0a t\u1EA1o \u0111\u01B0\u1EE3c c\xE2u tr\u1EA3 l\u1EDDi. B\u1EA1n th\u1EED h\u1ECFi l\u1EA1i nh\xE9.";
}

// src/knowledge.js
var KNOWLEDGE = "### FILE: 00-gioi-thieu.md\n\n# Gi\u1EDBi thi\u1EC7u M\xEA Philippines\n\n> \u26A0\uFE0F \u0110\xC2Y L\xC0 N\u1ED8I DUNG M\u1EAAU \u0111\u1EC3 demo. H\xE3y thay b\u1EB1ng th\xF4ng tin th\u1EADt c\u1EE7a c\xF4ng ty.\n> M\u1ED7i file .md trong th\u01B0 m\u1EE5c `knowledge/` \u0111\u1EC1u \u0111\u01B0\u1EE3c AI d\xF9ng l\xE0m ngu\u1ED3n tr\u1EA3 l\u1EDDi.\n\n## C\xF4ng ty\nM\xEA Philippines l\xE0 \u0111\u01A1n v\u1ECB chuy\xEAn t\u1ED5 ch\u1EE9c tour du l\u1ECBch Philippines (Cebu, Bohol, Boracay,\nCoron, El Nido, Manila, Davao, Batanes...). T\u1EADp trung tr\u1EA3i nghi\u1EC7m bi\u1EC3n \u0111\u1EA3o, l\u1EB7n ng\u1EAFm\nsan h\xF4, v\u0103n h\xF3a \u0111\u1ECBa ph\u01B0\u01A1ng.\n\n## Li\xEAn h\u1EC7 n\u1ED9i b\u1ED9\n- Hotline sale: (\u0111ang c\u1EADp nh\u1EADt)\n- Email: (\u0111ang c\u1EADp nh\u1EADt)\n- Ng\u01B0\u1EDDi ph\u1EE5 tr\xE1ch \u0111i\u1EC1u h\xE0nh: (\u0111ang c\u1EADp nh\u1EADt)\n\n## \u0110\u1ED1i t\u01B0\u1EE3ng kh\xE1ch ch\xEDnh\nKh\xE1ch l\u1EBB v\xE0 \u0111o\xE0n nh\u1ECF t\u1EEB Vi\u1EC7t Nam, \u0111\u1ED9 tu\u1ED5i 25\u201350, th\xEDch bi\u1EC3n \u0111\u1EA3o v\xE0 ngh\u1EC9 d\u01B0\u1EE1ng.\n\n## M\xF9a \u0111\u1EB9p \u0111i Philippines\n- Th\xE1ng 11 \u2013 th\xE1ng 5: kh\xF4 r\xE1o, bi\u1EC3n \u0111\u1EB9p, l\xFD t\u01B0\u1EDFng nh\u1EA5t.\n- Th\xE1ng 6 \u2013 th\xE1ng 10: m\xF9a m\u01B0a, c\xF3 th\u1EC3 c\xF3 b\xE3o, gi\xE1 tour m\u1EC1m h\u01A1n.\n\n---\n\n### FILE: chinh-sach.md\n\n# Ch\xEDnh s\xE1ch chung & c\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p (M\u1EAAU)\n\n> \u26A0\uFE0F N\u1ED8I DUNG M\u1EAAU. Thay b\u1EB1ng ch\xEDnh s\xE1ch th\u1EADt c\u1EE7a c\xF4ng ty.\n\n## \u0110\u1EB7t c\u1ECDc & thanh to\xE1n\n- C\u1ECDc 50% khi \u0111\u0103ng k\xFD, thanh to\xE1n \u0111\u1EE7 tr\u01B0\u1EDBc kh\u1EDFi h\xE0nh 15 ng\xE0y.\n- H\xECnh th\u1EE9c: chuy\u1EC3n kho\u1EA3n c\xF4ng ty (s\u1ED1 TK \u0111ang c\u1EADp nh\u1EADt).\n\n## Ch\xEDnh s\xE1ch h\u1EE7y tour (m\u1EABu)\n- H\u1EE7y tr\u01B0\u1EDBc 30 ng\xE0y: ph\xED 10% gi\xE1 tour.\n- H\u1EE7y tr\u01B0\u1EDBc 15\u201329 ng\xE0y: ph\xED 50%.\n- H\u1EE7y tr\u01B0\u1EDBc 7\u201314 ng\xE0y: ph\xED 70%.\n- H\u1EE7y trong v\xF2ng 7 ng\xE0y: ph\xED 100%.\n- V\xE9 m\xE1y bay \u0111\xE3 xu\u1EA5t: theo \u0111i\u1EC1u ki\u1EC7n h\xE3ng (th\u01B0\u1EDDng kh\xF4ng ho\xE0n).\n\n## Gi\u1EA5y t\u1EDD\n- H\u1ED9 chi\u1EBFu c\xF2n h\u1EA1n \u2265 6 th\xE1ng t\xEDnh t\u1EEB ng\xE0y v\u1EC1.\n- Kh\xE1ch Vi\u1EC7t Nam \u0111i Philippines du l\u1ECBch \u2264 30 ng\xE0y: mi\u1EC5n visa (ki\u1EC3m tra l\u1EA1i t\u1EA1i th\u1EDDi \u0111i\u1EC3m \u0111i).\n\n## H\xE0nh l\xFD\n- X\xE1ch tay 7kg + k\xFD g\u1EEDi theo h\xE3ng bay (th\u01B0\u1EDDng 20\u201323kg, ki\u1EC3m tra theo v\xE9).\n\n## S\u1EE9c kh\u1ECFe & an to\xE0n\n- Mua b\u1EA3o hi\u1EC3m du l\u1ECBch (\u0111\xE3 bao g\u1ED3m trong tour).\n- Kh\xE1ch c\xF3 b\u1EC7nh n\u1EC1n c\u1EA7n b\xE1o tr\u01B0\u1EDBc cho \u0111i\u1EC1u h\xE0nh.\n\n## C\xE2u h\u1ECFi th\u01B0\u1EDDng g\u1EB7p\n**H\u1ECFi: Tr\u1EBB em m\u1EA5y tu\u1ED5i t\xEDnh gi\xE1 tr\u1EBB em?**\n\u0110\xE1p: 5\u201311 tu\u1ED5i t\xEDnh gi\xE1 tr\u1EBB em (ng\u1EE7 gh\xE9p gi\u01B0\u1EDDng v\u1EDBi ng\u01B0\u1EDDi l\u1EDBn). D\u01B0\u1EDBi 5 tu\u1ED5i t\xEDnh gi\xE1 em b\xE9.\n\n**H\u1ECFi: \u0110o\xE0n t\u1ED1i thi\u1EC3u bao nhi\xEAu kh\xE1ch?**\n\u0110\xE1p: T\xF9y tour, th\u01B0\u1EDDng t\u1ED1i thi\u1EC3u 2 kh\xE1ch \u0111\u1EC3 kh\u1EDFi h\xE0nh.\n\n**H\u1ECFi: C\xF3 c\u1EA7n bi\u1EBFt ti\u1EBFng Anh kh\xF4ng?**\n\u0110\xE1p: Kh\xF4ng, tour c\xF3 HDV ti\u1EBFng Vi\u1EC7t su\u1ED1t h\xE0nh tr\xECnh.\n\n---\n\n### FILE: tours/cebu-bohol-4n3d.md\n\n# Tour Cebu \u2013 Bohol 4 ng\xE0y 3 \u0111\xEAm (M\u1EAAU)\n\n> \u26A0\uFE0F N\u1ED8I DUNG M\u1EAAU. Thay b\u1EB1ng tour & gi\xE1 th\u1EADt c\u1EE7a c\xF4ng ty.\n\n## Th\xF4ng tin chung\n- **M\xE3 tour:** CEB-BOH-4N3D\n- **Tuy\u1EBFn:** Cebu \u2013 Bohol \u2013 Cebu\n- **Th\u1EDDi gian:** 4 ng\xE0y 3 \u0111\xEAm\n- **Ph\u01B0\u01A1ng ti\u1EC7n:** M\xE1y bay kh\u1EE9 h\u1ED3i + xe + t\xE0u/ferry\n- **Kh\u1EDFi h\xE0nh:** Th\u1EE9 5 v\xE0 Ch\u1EE7 nh\u1EADt h\xE0ng tu\u1EA7n (t\u1ED1i thi\u1EC3u 2 kh\xE1ch)\n\n## Gi\xE1 tour (m\u1EABu)\n| Lo\u1EA1i kh\xE1ch | Gi\xE1/kh\xE1ch |\n|---|---|\n| Ng\u01B0\u1EDDi l\u1EDBn | 12.900.000\u0111 |\n| Tr\u1EBB em 5\u201311 tu\u1ED5i (ng\u1EE7 gh\xE9p) | 9.900.000\u0111 |\n| Tr\u1EBB em d\u01B0\u1EDBi 5 tu\u1ED5i | 3.500.000\u0111 |\n| Ph\u1EE5 thu ph\xF2ng \u0111\u01A1n | 2.500.000\u0111 |\n\n## L\u1ECBch tr\xECnh t\xF3m t\u1EAFt\n- **Ng\xE0y 1:** Bay t\u1EDBi Cebu \u2013 nh\u1EADn ph\xF2ng \u2013 tham quan th\xE0nh ph\u1ED1 (Magellan's Cross, \u0111\u1EC1n Taoist).\n- **Ng\xE0y 2:** \u0110i Bohol \u2013 \u0111\u1ED3i S\xF4-c\xF4-la (Chocolate Hills) \u2013 khu b\u1EA3o t\u1ED3n kh\u1EC9 Tarsier \u2013 s\xF4ng Loboc \u0103n tr\u01B0a tr\xEAn thuy\u1EC1n.\n- **Ng\xE0y 3:** L\u1EB7n ng\u1EAFm san h\xF4 / b\u01A1i c\xF9ng c\xE1 m\u1EADp voi (Oslob, t\xF9y ch\u1ECDn) \u2013 t\u1EF1 do t\u1EAFm bi\u1EC3n.\n- **Ng\xE0y 4:** Mua s\u1EAFm \u2013 ra s\xE2n bay v\u1EC1 Vi\u1EC7t Nam.\n\n## Bao g\u1ED3m\n- V\xE9 m\xE1y bay kh\u1EE9 h\u1ED3i + thu\u1EBF ph\xED.\n- Kh\xE1ch s\u1EA1n 3\u20134 sao (2 kh\xE1ch/ph\xF2ng).\n- \u0102n theo ch\u01B0\u01A1ng tr\xECnh, xe \u0111\u01B0a \u0111\xF3n, HDV ti\u1EBFng Vi\u1EC7t.\n- V\xE9 tham quan theo l\u1ECBch tr\xECnh, b\u1EA3o hi\u1EC3m du l\u1ECBch.\n\n## Kh\xF4ng bao g\u1ED3m\n- Chi ti\xEAu c\xE1 nh\xE2n, \u0111\u1ED3 u\u1ED1ng.\n- Tip HDV & t\xE0i x\u1EBF (khuy\u1EBFn ngh\u1ECB 5 USD/kh\xE1ch/ng\xE0y).\n- Tour t\u1EF1 ch\u1ECDn ngo\xE0i ch\u01B0\u01A1ng tr\xECnh (vd b\u01A1i c\xF9ng c\xE1 m\u1EADp voi).\n- Visa (n\u1EBFu c\xF3 y\xEAu c\u1EA7u ri\xEAng).\n\n## L\u01B0u \xFD\n- H\u1ED9 chi\u1EBFu c\xF2n h\u1EA1n t\u1ED1i thi\u1EC3u 6 th\xE1ng.\n- Tr\u1EBB em \u0111i c\xF9ng c\u1EA7n gi\u1EA5y khai sinh/h\u1ED9 chi\u1EBFu ri\xEAng.";

// src/config.js
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function getConfig(env) {
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
    kv.get("admin_password_hash")
  ]);
  return {
    openaiKey,
    model: model || fallbackModel,
    base,
    tgToken,
    tgSecret,
    adminHash
  };
}
async function isAdmin(env, password) {
  if (!password) return false;
  const { adminHash } = await getConfig(env);
  if (!adminHash) return false;
  return await sha256(password) === adminHash;
}
async function getDocuments(env) {
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
async function saveDocuments(env, docs) {
  await env.SETTINGS.put("documents", JSON.stringify(docs));
}

// src/index.js
var src_default = {
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
      return json({ error: "L\u1ED7i: " + e.message }, 500);
    }
    return env.ASSETS.fetch(request);
  }
};
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
async function buildKnowledge(env) {
  const docs = await getDocuments(env);
  if (docs.length) {
    return docs.map((d) => `### ${d.title || "(kh\xF4ng t\xEAn)"}

${d.content || ""}`).join("\n\n---\n\n");
  }
  return KNOWLEDGE;
}
async function handleAsk(request, env) {
  const body = await request.json().catch(() => ({}));
  const question = (body.question || "").toString().trim();
  if (!question) return json({ error: "Thi\u1EBFu c\xE2u h\u1ECFi" }, 400);
  const cfg = await getConfig(env);
  if (!cfg.openaiKey)
    return json({ error: "Ch\u01B0a c\u1EA5u h\xECnh OpenAI API key. M\u1EDF trang C\xE0i \u0111\u1EB7t (\u2699\uFE0F) \u0111\u1EC3 nh\u1EADp key nh\xE9." }, 503);
  const knowledge = await buildKnowledge(env);
  const answer = await askAI({ question, history: body.history || [], apiKey: cfg.openaiKey, model: cfg.model, knowledge, base: cfg.base });
  return json({ answer });
}
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
    return tgSend(
      cfg.tgToken,
      chatId,
      "Xin ch\xE0o! M\xECnh l\xE0 tr\u1EE3 l\xFD tour M\xEA Philippines \u{1F334}\nB\u1EA1n c\u1EE9 h\u1ECFi v\u1EC1 tour, gi\xE1, l\u1ECBch tr\xECnh, ch\xEDnh s\xE1ch... m\xECnh tr\u1EA3 l\u1EDDi theo t\xE0i li\u1EC7u c\xF4ng ty nh\xE9."
    );
  }
  await fetch(`https://api.telegram.org/bot${cfg.tgToken}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" })
  }).catch(() => {
  });
  let answer;
  if (!cfg.openaiKey) {
    answer = "Bot ch\u01B0a \u0111\u01B0\u1EE3c c\u1EA5u h\xECnh OpenAI API key. B\xE1o qu\u1EA3n tr\u1ECB vi\xEAn v\xE0o trang C\xE0i \u0111\u1EB7t gi\xFAp nh\xE9.";
  } else {
    try {
      answer = await askAI({ question: text, history: [], apiKey: cfg.openaiKey, model: cfg.model, knowledge, base: cfg.base });
    } catch {
      answer = "Xin l\u1ED7i, hi\u1EC7n ch\u01B0a tr\u1EA3 l\u1EDDi \u0111\u01B0\u1EE3c. B\u1EA1n th\u1EED l\u1EA1i sau gi\xFAp m\xECnh nh\xE9.";
    }
  }
  await tgSend(cfg.tgToken, chatId, answer);
}
async function tgSend(token, chatId, text) {
  for (let i = 0; i < text.length; i += 3800) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(i, i + 3800) })
    }).catch(() => {
    });
  }
}
async function handleStatus(env) {
  const cfg = await getConfig(env);
  const docs = await getDocuments(env);
  return json({
    hasAdmin: !!cfg.adminHash,
    hasOpenAI: !!cfg.openaiKey,
    model: cfg.model,
    hasTelegramToken: !!cfg.tgToken,
    hasTelegramSecret: !!cfg.tgSecret,
    docCount: docs.length
  });
}
async function handleSave(request, env) {
  if (!env.SETTINGS) return json({ error: "Ch\u01B0a g\u1EAFn kho c\u1EA5u h\xECnh (KV)." }, 500);
  const b = await request.json().catch(() => ({}));
  const cfg = await getConfig(env);
  if (!cfg.adminHash) {
    if (!b.newAdminPassword || b.newAdminPassword.length < 6)
      return json({ error: "L\u1EA7n \u0111\u1EA7u: h\xE3y \u0111\u1EB7t m\u1EADt kh\u1EA9u admin (t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1)." }, 400);
    await env.SETTINGS.put("admin_password_hash", await sha256(b.newAdminPassword));
  } else {
    if (!await isAdmin(env, b.adminPassword)) return json({ error: "Sai m\u1EADt kh\u1EA9u admin." }, 403);
    if (b.newAdminPassword) {
      if (b.newAdminPassword.length < 6) return json({ error: "M\u1EADt kh\u1EA9u m\u1EDBi t\u1ED1i thi\u1EC3u 6 k\xFD t\u1EF1." }, 400);
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
  if (!await isAdmin(env, b.adminPassword)) return json({ error: "Sai m\u1EADt kh\u1EA9u admin." }, 403);
  const cfg = await getConfig(env);
  if (!cfg.tgToken) return json({ error: "Ch\u01B0a c\xF3 Telegram bot token." }, 400);
  const webhookUrl = `${url.origin}/api/telegram`;
  const res = await fetch(`https://api.telegram.org/bot${cfg.tgToken}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: cfg.tgSecret || void 0,
      drop_pending_updates: true
    })
  });
  const data = await res.json().catch(() => ({}));
  return json({ ok: data.ok === true, telegram: data, webhookUrl });
}
async function handleDocsList(request, env) {
  const b = await request.json().catch(() => ({}));
  if (!await isAdmin(env, b.adminPassword)) return json({ error: "Sai m\u1EADt kh\u1EA9u admin." }, 403);
  return json({ documents: await getDocuments(env) });
}
async function handleDocsSave(request, env) {
  const b = await request.json().catch(() => ({}));
  if (!await isAdmin(env, b.adminPassword)) return json({ error: "Sai m\u1EADt kh\u1EA9u admin." }, 403);
  const title = (b.title || "").toString().trim();
  const content = (b.content || "").toString();
  if (!title) return json({ error: "Thi\u1EBFu ti\xEAu \u0111\u1EC1 t\xE0i li\u1EC7u." }, 400);
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
  if (!await isAdmin(env, b.adminPassword)) return json({ error: "Sai m\u1EADt kh\u1EA9u admin." }, 403);
  const docs = (await getDocuments(env)).filter((d) => d.id !== b.id);
  await saveDocuments(env, docs);
  return json({ ok: true });
}
export {
  src_default as default
};
