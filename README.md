# Trợ lý Tour Mê Philippines 🌴

Module **hỏi-đáp tour** trong app tổng hợp: nhân viên sale hỏi gì về tour, AI trả lời **theo đúng tài liệu công ty** — sếp đỡ phải giải thích lại cho từng người mới. Đây là tính năng đầu tiên, sau sẽ thêm nhiều module + lưu dữ liệu trên Supabase.

- **2 cửa, 1 bộ não:** Web chat + Bot Telegram, chung 1 kho tài liệu.
- **Cấu hình NGAY TRONG APP:** trang ⚙️ `/settings.html` — nhập key OpenAI, model, Telegram, mật khẩu admin. Không cần đụng dashboard Cloudflare.
- **Không bịa:** AI chỉ trả lời trong phạm vi tài liệu `knowledge/`. Thiếu thì nói thẳng "chưa có trong tài liệu".
- **Hạ tầng:** Cloudflare Worker + static assets, cấu hình lưu trong **KV** (sau dễ chuyển sang Supabase). Push GitHub → tự deploy.
- **AI:** OpenAI (mặc định `gpt-4o-mini`, đổi được trong Cài đặt).

## Kiến trúc

```
public/
  index.html        ← giao diện chat
  settings.html     ← trang Cài đặt trong app (key, model, Telegram, admin)
src/
  index.js          ← Worker: /api/ask, /api/telegram, /api/settings/*
  openai.js         ← gọi OpenAI (nạp toàn bộ tài liệu vào ngữ cảnh)
  config.js         ← đọc/ghi cấu hình trong KV (admin password hash)
  system-prompt.js  ← hướng dẫn cho AI
  knowledge.js      ← TỰ SINH khi build từ knowledge/*.md
knowledge/**/*.md   ← kho kiến thức (bạn sửa)
scripts/build-knowledge.mjs
```

Bí mật (key OpenAI, Telegram, mật khẩu admin) **lưu trong KV**, không nằm trong code/GitHub, khách **không bao giờ thấy** (chỉ Worker đọc server-side khi gọi OpenAI).

## Kho tài liệu — phần cập nhật thường xuyên

Mọi thứ AI "biết" nằm trong `knowledge/` dạng Markdown:

```
knowledge/
  00-gioi-thieu.md
  chinh-sach.md
  tours/cebu-bohol-4n3d.md   ← mỗi tour 1 file
```

- Thêm tour mới → tạo file `.md` mới. Sửa giá → sửa file. File bắt đầu `_` bị bỏ qua.
- **Push GitHub → Cloudflare tự build lại + deploy.** AI cập nhật ngay.
- *(Nội dung hiện tại là MẪU — thay bằng dữ liệu thật.)*

## Dùng lần đầu (sau khi deploy)

1. Mở app: `https://mephil-tour-ai.<tài-khoản>.workers.dev`
2. Bấm ⚙️ (góc phải) → trang Cài đặt:
   - **Đặt mật khẩu admin** (lần đầu, ≥6 ký tự).
   - Nhập **OpenAI API key** (`sk-...` từ platform.openai.com → API keys), chọn **model**.
   - *(Tùy chọn)* nhập **Telegram bot token** + secret, bấm **Đăng ký webhook**.
   - **Lưu.**
3. Quay lại chat, hỏi thử. Xong.

## Chạy thử local

```bash
npm install
npm run dev        # wrangler dev — mở http://localhost:8787, vào /settings.html nhập key
```

## Deploy

Đã connect GitHub → Cloudflare (Worker). Build command `npm run build`, deploy `npx wrangler deploy`. Mỗi push lên `main` là tự deploy lại. KV binding `SETTINGS` đã khai trong `wrangler.toml`.
