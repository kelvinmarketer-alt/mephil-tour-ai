// Xác thực + phiên + phân quyền trên Cloudflare D1 (thay Supabase Auth).
const enc = new TextEncoder();
const DAY = 86400000;

const bufToHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const hexToBuf = (hex) => { const a = new Uint8Array(hex.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16); return a; };
const uuid = () => crypto.randomUUID();
const newToken = () => bufToHex(crypto.getRandomValues(new Uint8Array(32)));

export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, km, 256);
  return { hash: bufToHex(bits), salt: bufToHex(salt) };
}
export async function verifyPassword(password, saltHex, expected) {
  const { hash } = await hashPassword(password, saltHex);
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export const publicUser = (u) => (u ? { id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan, expires_at: u.expires_at, created_at: u.created_at } : null);

export async function getUserByEmail(env, email) {
  return await env.DB.prepare("SELECT * FROM users WHERE email=?").bind((email || "").trim().toLowerCase()).first();
}
export async function getUserById(env, id) {
  return await env.DB.prepare("SELECT * FROM users WHERE id=?").bind(id).first();
}

export async function createUser(env, { email, password, name, role = "user", plan = "trial", expires_at }) {
  email = (email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Email không hợp lệ.");
  if (!password || password.length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự.");
  if (await getUserByEmail(env, email)) throw new Error("Email đã tồn tại.");
  const { hash, salt } = await hashPassword(password);
  const now = Date.now();
  const id = uuid();
  const exp = expires_at !== undefined && expires_at !== null ? expires_at : plan === "trial" ? now + 3 * DAY : null;
  await env.DB.prepare("INSERT INTO users (id,email,password_hash,salt,name,role,plan,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(id, email, hash, salt, name || null, role, plan, exp, now, now).run();
  return await getUserById(env, id);
}

export async function createSession(env, userId) {
  const t = newToken();
  const now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)").bind(t, userId, now, now + 30 * DAY).run();
  return t;
}
export async function deleteSession(env, t) {
  if (t) await env.DB.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();
}

export function bearerToken(request) {
  const h = request.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}
export async function sessionUser(request, env) {
  const t = bearerToken(request);
  if (!t || !env.DB) return null;
  const s = await env.DB.prepare("SELECT * FROM sessions WHERE token=?").bind(t).first();
  if (!s || s.expires_at < Date.now()) return null;
  return await getUserById(env, s.user_id);
}

export const isAdmin = (u) => !!u && u.role === "admin";
// "Còn hạn dùng" (member bất kỳ, kể cả dùng thử): admin luôn; user cần còn hạn.
export const isActive = (u) => !!u && (u.role === "admin" || (u.expires_at != null && u.expires_at > Date.now()));
// "Đã TRẢ PHÍ" (mở khoá nội dung premium): admin, hoặc gói tháng/năm còn hạn. Dùng thử KHÔNG tính.
export const isPaid = (u) => !!u && (u.role === "admin" || (["month", "year"].includes(u.plan) && u.expires_at != null && u.expires_at > Date.now()));

export { uuid };
