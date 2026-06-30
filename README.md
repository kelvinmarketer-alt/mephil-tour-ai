# Trợ lý Tour Mê Philippines 🌴

Trợ lý AI hỏi-đáp nội bộ: nhân viên sale hỏi gì về tour, AI trả lời **theo đúng tài liệu công ty** — sếp đỡ phải giải thích lại cho từng người mới.

- **2 cửa, 1 bộ não:** Web chat + Bot Telegram, dùng chung 1 kho tài liệu.
- **Không bịa:** AI chỉ trả lời trong phạm vi tài liệu trong thư mục `knowledge/`. Thiếu thông tin thì nói thẳng "chưa có trong tài liệu".
- **Hạ tầng:** Cloudflare Pages + Pages Functions (gọi Claude). Push GitHub là tự deploy.

## Kho tài liệu — phần bạn cập nhật thường xuyên

Mọi thứ AI "biết" nằm trong thư mục `knowledge/` dưới dạng file Markdown (`.md`):

```
knowledge/
  00-gioi-thieu.md      ← giới thiệu công ty
  chinh-sach.md         ← chính sách, FAQ
  tours/
    cebu-bohol-4n3d.md  ← mỗi tour 1 file
```

- Thêm tour mới → tạo file `.md` mới trong `knowledge/tours/`.
- Sửa giá/lịch trình → sửa file tương ứng.
- File bắt đầu bằng `_` sẽ bị bỏ qua (dùng cho ghi chú nội bộ).
- **Push lên GitHub là Cloudflare tự build lại + deploy.** AI cập nhật ngay.

> Nội dung hiện tại là **MẪU** để demo. Hãy thay bằng dữ liệu thật.

## Chạy thử ở máy (local)

```bash
npm install
cp .dev.vars.example .dev.vars   # rồi điền ANTHROPIC_API_KEY thật
npm run dev                       # mở http://localhost:8788
```

## Deploy (GitHub-first)

1. Tạo repo GitHub, push code lên.
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → chọn repo.
3. Cấu hình build:
   - **Build command:** `npm run build`
   - **Build output directory:** `public`
4. **Settings → Environment variables** (đánh dấu *Encrypt/Secret*):
   - `ANTHROPIC_API_KEY` = khóa Anthropic của bạn *(bắt buộc)*
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_SECRET` *(nếu dùng Telegram)*
   - `MODEL`, `MAX_TOKENS` *(tùy chọn)*
5. Deploy. Từ giờ mỗi lần push GitHub → tự deploy lại.

## Bật bot Telegram

1. Nhắn [@BotFather](https://t.me/BotFather) → `/newbot` → lấy **token**.
2. Đặt `TELEGRAM_BOT_TOKEN` (và `TELEGRAM_SECRET` = chuỗi ngẫu nhiên tự đặt) trong Cloudflare.
3. Trỏ webhook về Pages:
   ```bash
   BOT_TOKEN=<token> SECRET=<secret> \
   URL=https://<project>.pages.dev/api/telegram \
   ./scripts/set-telegram-webhook.sh
   ```
4. Nhắn bot `/start` để kiểm tra.

## Chi phí & model

- Mặc định dùng **Claude Opus 4.8** (chất lượng cao nhất). Toàn bộ tài liệu được *prompt caching* nên mỗi câu hỏi sau rất rẻ.
- Muốn rẻ hơn nữa: đặt biến `MODEL=claude-haiku-4-5` (nhanh + rẻ ~5 lần, vẫn tốt cho hỏi-đáp tài liệu).

## Cấu trúc

```
knowledge/              # nguồn kiến thức (bạn sửa)
scripts/
  build-knowledge.mjs   # gom knowledge/*.md → bundle
  set-telegram-webhook.sh
functions/
  _shared/
    system-prompt.js    # hướng dẫn cho AI
    claude.js           # gọi Claude (có caching)
    knowledge.js        # TỰ SINH khi build
  api/
    ask.js              # endpoint web chat
    telegram.js         # webhook Telegram
public/index.html       # giao diện chat web
```
