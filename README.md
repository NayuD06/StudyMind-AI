# StudyMind AI

Hệ thống chia sẻ tài liệu học tập tích hợp tìm kiếm ngữ nghĩa và hỏi đáp AI (RAG).

## Cấu trúc

| Thư mục | Vai trò | Cổng |
|---|---|---|
| `frontend/` | Trang cho sinh viên: React + Vite + TypeScript + Tailwind | 5173 |
| `admin/` | Trang quản trị (app riêng, cùng công nghệ với `frontend/`) | 5174 |
| `backend/` | Node.js + Express + Prisma (REST API) | 4000 |
| `ai-service/` | Python + FastAPI (PDF, embedding, RAG) | 8000 |
| `docker-compose.yml` | MySQL (3307), Qdrant (6333), AI service | |

## Chạy lần đầu

Mở Docker Desktop trước. Tạo các file `.env` theo mục "Biến môi trường" bên dưới, rồi chạy lần lượt:

```bash
docker compose up -d
```

```bash
cd backend
npm run db:migrate
npm run db:seed
npm run dev
```

`db:seed` tạo danh sách môn học và tài khoản quản trị đầu tiên từ `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` trong `backend/.env`. Chạy lại không ghi đè mật khẩu của tài khoản đã có.

```bash
cd frontend
npm run dev
```

```bash
cd admin
npm install
npm run dev
```

Trang quản trị mở ở http://localhost:5174, đăng nhập bằng `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `backend/.env`.

Khi làm tới phần AI (lần đầu build sẽ tải khá nặng):

```bash
docker compose --profile ai up -d --build
```

## Biến môi trường

Không file `.env` nào được commit. Mỗi file có một bản mẫu `.env.example` bên cạnh.

| File | Nội dung |
|---|---|
| `.env` (thư mục gốc) | Mật khẩu MySQL cho docker-compose |
| `backend/.env` | Chuỗi kết nối MySQL, `JWT_ACCESS_SECRET`, `CORS_ORIGIN`, `AI_SERVICE_KEY`, `ADMIN_*` |
| `ai-service/.env` | `ANTHROPIC_API_KEY`, `INTERNAL_API_KEY` (trùng `AI_SERVICE_KEY` của backend) |

Sinh chuỗi ngẫu nhiên cho mật khẩu và khóa:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Trang cho sinh viên

| Trang | Chức năng |
|---|---|
| Trang chủ | Ô tìm kiếm, 4 tài liệu được tải nhiều nhất |
| Thư viện | Tìm theo tiêu đề, mô tả, tên môn; lọc theo môn; sắp xếp mới nhất hoặc tải nhiều; phân trang |
| Chi tiết tài liệu | Đọc PDF ngay trên trang (chuyển trang, phóng to), lưu lại, chấm 1 đến 5 sao, tải xuống |
| Đăng tài liệu | Tải PDF lên, cảnh báo nếu có email hay số điện thoại |
| Của tôi | Tài liệu đã đăng kèm trạng thái duyệt và lý do từ chối, tài liệu đã lưu |

Các tab Hỏi đáp, Tóm tắt, Ôn tập và chế độ tìm "Ngữ nghĩa" chưa hoạt động: chúng cần AI service.

## Trang quản trị

| Trang | Chức năng |
|---|---|
| Tổng quan | Số tài liệu chờ duyệt, đã duyệt, người dùng, lượt tải; biểu đồ tài liệu đăng mới 7 ngày |
| Kiểm duyệt | Xem PDF, duyệt, từ chối kèm lý do, xóa tài liệu đã từ chối |
| Người dùng | Tìm kiếm, cấp hoặc bỏ quyền quản trị, khóa và mở khóa |
| Môn học | Thêm, đổi tên, xóa |
| Nhật ký | Ai đã duyệt, từ chối, xóa, khóa, đổi quyền, sửa môn học và đăng nhập trang quản trị lúc nào |

Khi triển khai thật, thêm địa chỉ của trang quản trị vào `CORS_ORIGIN` của backend.

## Bảo mật đã áp dụng

- Access token (15 phút) chỉ nằm trong bộ nhớ trình duyệt; refresh token nằm trong cookie `httpOnly`, `SameSite=Strict`, dùng một lần rồi đổi mới.
- CORS chỉ cho phép các địa chỉ trong `CORS_ORIGIN`.
- Giới hạn tần suất (`backend/src/middlewares/rateLimit.ts`): toàn bộ API 120 lần/phút; đăng nhập sai 10 lần/15 phút theo IP và theo từng email; tối đa 5 tài khoản mới mỗi giờ mỗi IP; sẵn bộ giới hạn riêng cho API gọi AI. Bộ đếm nằm trong bộ nhớ nên mất khi khởi động lại backend.
- AI service yêu cầu header `X-Internal-Key`; MySQL, Qdrant và AI service chỉ mở cổng cho `127.0.0.1`.
- Upload: chỉ nhận PDF thật (kiểm tra nội dung file, không tin phần đuôi), tối đa 20 MB và 1000 trang, 10 file mỗi giờ mỗi người. File lưu bằng tên UUID và chỉ tải được qua API có kiểm tra quyền.
- Kiểm duyệt: tài liệu mới ở trạng thái chờ duyệt, chỉ người đăng và quản trị viên xem được cho tới khi được duyệt ở trang quản trị.
- Cảnh báo thông tin cá nhân: 30 trang đầu của PDF được quét email và số điện thoại; kết quả (đã che bớt) hiện cho người đăng và quản trị viên.
- Trang quản trị tách riêng: chỉ tài khoản ADMIN đăng nhập được ở đó, phiên dùng cookie riêng (`admin_refresh_token`) nên không lẫn với phiên ở trang sinh viên. Tài khoản không phải admin nhận cùng thông báo "sai email hoặc mật khẩu" như khi nhập sai.
- Mỗi request có token đều đọc lại tài khoản từ database: tài khoản bị khóa, bị hạ quyền hoặc bị xóa mất quyền ngay, không đợi token hết hạn.
- Nhật ký quản trị (bảng `admin_logs`): chỉ ghi thêm, không có API sửa hay xóa.
- Refresh token hết hạn hoặc đã thu hồi được dọn tự động mỗi 6 giờ khi backend đang chạy.

## Sao lưu MySQL

Chạy từ thư mục gốc, cần PowerShell và container MySQL đang chạy. Mỗi lần chạy tạo một cặp file trong `backups/` (không commit): `.sql.gz` là database, `-uploads.zip` là các file PDF. Giữ 7 cặp mới nhất:

```bash
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1
```

Script chưa được đặt lịch tự chạy. Khôi phục từ một bản sao lưu (ghi đè dữ liệu hiện tại; mật khẩu root nằm trong `.env` ở thư mục gốc):

```bash
gunzip -c backups/<tên-file>.sql.gz | docker compose exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot studymind'
```

Khôi phục file PDF: giải nén file `-uploads.zip` cùng mốc thời gian vào `backend/uploads/`.
