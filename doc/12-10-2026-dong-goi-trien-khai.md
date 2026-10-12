# Đóng gói để triển khai

Trạng thái: đã commit · Ngày: 12-10-2026

Trước đây dự án chỉ chạy được bằng `npm run dev` ở ba thư mục. Giờ có thêm cách chạy bản đã build bằng một lệnh, giống cách sẽ chạy trên máy chủ. Cách chạy khi phát triển hằng ngày **không đổi**.

## Đã làm

| File | Vai trò |
|---|---|
| `backend/Dockerfile` | Build backend, chạy bằng tài khoản `node` (không phải root). Khi khởi động: áp migration còn thiếu rồi mới mở cổng |
| `docker/web/Dockerfile` | Build `frontend/` và `admin/`, đưa vào một image nginx |
| `docker/web/nginx.conf`, `app.inc` | Cổng 80 là trang sinh viên, cổng 81 là trang quản trị; `/api` chuyển về backend; đường dẫn khác trả `index.html` |
| `docker-compose.yml` | Thêm dịch vụ `backend` và `web` trong profile `app`; MySQL có thêm healthcheck để backend đợi database sẵn sàng |
| `.dockerignore` (gốc và `backend/`) | Không đưa `.env`, `node_modules`, PDF đã tải lên vào image |

Kèm theo ở backend: biến `TRUST_PROXY`. Khi đứng sau nginx, mọi request đều đến từ IP của nginx; không khai báo thì giới hạn tần suất coi tất cả người dùng là một. Compose đặt sẵn `TRUST_PROXY=1`. Chạy thẳng trên máy thì để 0, vì đặt 1 khi không có proxy sẽ cho phép giả mạo IP qua header.

Hai trang dùng hai cổng khác nhau chứ không phải `/admin` trên cùng một cổng, để cookie phiên của sinh viên và của quản trị viên tiếp tục tách nhau như khi phát triển.

## Chạy

Thêm vào `.env` ở thư mục gốc (mẫu trong `.env.example`): `JWT_ACCESS_SECRET` và `AI_SERVICE_KEY`, mỗi cái là một chuỗi ngẫu nhiên từ 32 ký tự. Rồi:

```bash
docker compose --profile app up -d --build
```

- Trang sinh viên: http://localhost:8080
- Trang quản trị: http://localhost:8081

Tạo quản trị viên đầu tiên (điền `ADMIN_EMAIL`, `ADMIN_PASSWORD` vào `.env` gốc trước, rồi chạy lại lệnh `up` ở trên để backend nhận biến mới):

```bash
docker compose exec backend npm run db:seed
```

Xem log (thư đặt lại mật khẩu cũng in ở đây khi chưa cấu hình SMTP):

```bash
docker compose logs -f backend
```

Dừng:

```bash
docker compose --profile app down
```

Lưu ý: bản đóng gói dùng **chung database và thư mục PDF** với bản phát triển (`studymind` trong MySQL của compose, `backend/uploads/`). Tiện để demo, nhưng nghĩa là đây không phải môi trường tách biệt.

## Khi đưa lên máy chủ thật

Những việc compose này **chưa** làm thay:

1. **HTTPS là bắt buộc.** Ở chế độ production, cookie đăng nhập có cờ `Secure` nên trình duyệt chỉ gửi qua HTTPS (riêng `localhost` được miễn). Truy cập bằng `http://địa-chỉ-IP` thì đăng nhập được nhưng tải lại trang là mất phiên. Cần một lớp HTTPS phía trước (Caddy, Cloudflare, hoặc nginx với chứng chỉ Let's Encrypt). Thêm một lớp proxy thì tăng `TRUST_PROXY` lên 2.
2. Đặt `APP_URL` và `ADMIN_URL` trong `.env` gốc thành địa chỉ thật. Backend dùng chúng cho CORS và cho liên kết trong thư.
3. Cổng 8080 và 8081 đang chỉ mở cho `127.0.0.1`. Lớp HTTPS ở bước 1 trỏ vào hai cổng này.
4. Cấu hình `SMTP_*` nếu muốn thư đặt lại mật khẩu được gửi thật.
5. Sao lưu: volume `mysql_data` và thư mục `backend/uploads/` (script `scripts/backup-db.ps1` mới chỉ lo phần MySQL).
6. Bộ đếm giới hạn tần suất nằm trong bộ nhớ của một tiến trình backend. Chạy nhiều bản backend song song thì cần chuyển sang Redis.

## Kiểm tra

Build và chạy thật trên máy đang làm việc:

- Cả hai image build được; backend áp migration rồi khởi động, chạy bằng tài khoản `node`.
- `:8080/api/health` trả 200; `:8080/` và `:8081/` trả đúng trang; đường dẫn sâu (`/documents/5`, `/moderation`) trả `index.html`; file tĩnh không tồn tại trả 404.
- Trên trình duyệt qua bản đóng gói: đăng ký, đăng nhập, tải PDF lên (ghi được vào `backend/uploads`), đặt lại mật khẩu, đăng nhập trang quản trị.

Xong thì đã dừng và xóa hai container `backend`, `web`; MySQL vẫn chạy như trước.

## Chưa kiểm tra

- Chưa chạy trên một máy chủ Linux thật và chưa chạy sau HTTPS. Trên Linux, thư mục `backend/uploads` phải ghi được bởi UID 1000 (tài khoản `node` trong container).
- Chưa chạy lệnh `db:seed` bên trong container (lệnh tạo quản trị viên ở trên).
- Chưa thử tải lại trang khi đang đăng nhập ở bản đóng gói (cookie `Secure` trên `http://localhost`).
- Chưa chạy cùng AI service (profile `ai`).
- Workflow `release.yml` (đóng gói khi gắn tag) chưa được cập nhật để build các image này.
