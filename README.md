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

Nhật ký các phần việc đã làm nằm trong [`doc/`](doc/README.md). Kiểm tra tự động và đóng gói bản phát hành chạy bằng GitHub Actions (`.github/workflows/`, giải thích ở [`doc/12-10-2026-ci-cd.md`](doc/12-10-2026-ci-cd.md)).

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

Muốn có sẵn nội dung để demo, đặt `DEMO_PASSWORD` trong `backend/.env` rồi chạy:

```bash
npm run db:seed:demo
```

Lệnh này tạo 6 sinh viên mẫu (email `@demo.studymind.local`, đăng nhập bằng `DEMO_PASSWORD`), 18 tài liệu PDF thuộc 8 môn (14 đã duyệt, 2 chờ duyệt, 2 bị từ chối) kèm đánh giá, lượt lưu, lượt tải, bình luận, 2 báo cáo đang chờ và thông báo. Chạy lại sẽ xóa dữ liệu mẫu cũ rồi tạo mới; dữ liệu thật không bị đụng tới. Chỉ xóa dữ liệu mẫu:

```bash
npm run db:seed:demo -- --clear
```

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
| `.env` (thư mục gốc) | Mật khẩu MySQL cho docker-compose; thêm `JWT_ACCESS_SECRET`, `AI_SERVICE_KEY`, `APP_URL`... khi chạy bản đóng gói |
| `backend/.env` | Chuỗi kết nối MySQL, `JWT_ACCESS_SECRET`, `CORS_ORIGIN`, `AI_SERVICE_KEY`, `ADMIN_*`, `APP_URL`, `SMTP_*` (gửi thư), `TRUST_PROXY` |
| `ai-service/.env` | `ANTHROPIC_API_KEY`, `INTERNAL_API_KEY` (trùng `AI_SERVICE_KEY` của backend) |

Sinh chuỗi ngẫu nhiên cho mật khẩu và khóa:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Chạy test

```bash
cd backend
npm test
```

55 test gọi thẳng API trên database riêng `studymind_test` (cùng MySQL trong Docker), không đụng dữ liệu thật. Database này được tạo sẵn khi MySQL khởi tạo lần đầu; nếu MySQL của bạn đã chạy từ trước thì tạo một lần bằng lệnh trong [doc/12-10-2026-test-tu-dong.md](doc/12-10-2026-test-tu-dong.md). CI chạy bộ test này ở mỗi lần push.

## Chạy bản đóng gói bằng Docker

```bash
docker compose --profile app up -d --build
```

Trang sinh viên ở http://localhost:8080, trang quản trị ở http://localhost:8081. Cần điền thêm `JWT_ACCESS_SECRET` và `AI_SERVICE_KEY` vào `.env` ở thư mục gốc. Chi tiết và những việc phải làm khi đưa lên máy chủ thật: [doc/12-10-2026-dong-goi-trien-khai.md](doc/12-10-2026-dong-goi-trien-khai.md).

## Trang cho sinh viên

| Trang | Chức năng |
|---|---|
| Trang chủ | Ô tìm kiếm, 4 tài liệu được tải nhiều nhất |
| Thư viện | Tìm theo tiêu đề, mô tả, tên môn (đủ mọi từ, không cần đúng thứ tự); lọc theo môn, trường, ngành, điểm đánh giá; sắp xếp mới nhất hoặc tải nhiều; phân trang |
| Chi tiết tài liệu | Đọc PDF ngay trên trang (chuyển trang, phóng to), lưu lại, chấm 1 đến 5 sao, tải xuống, bình luận, báo cáo vi phạm |
| Đăng tài liệu | Tải PDF lên, cảnh báo nếu có email hay số điện thoại; trường và ngành điền sẵn từ hồ sơ |
| Của tôi | Tài liệu đã đăng kèm trạng thái duyệt và lý do từ chối, sửa thông tin tài liệu (tài liệu bị từ chối sửa xong sẽ được duyệt lại), tài liệu đã lưu |
| Trang người đăng | Bấm tên người đăng ở trang tài liệu: tên, trường, ngành, số tài liệu, lượt tải và các tài liệu đã duyệt của họ (không hiện email) |
| Tài khoản | Sửa hồ sơ (tên, trường, ngành), đổi mật khẩu, đăng xuất mọi thiết bị (bấm vào tên trên thanh menu) |
| Quên mật khẩu | Nhận liên kết đặt lại mật khẩu qua email (ở trang đăng nhập). Chưa cấu hình `SMTP_*` thì thư được in ra màn hình chạy backend |
| Chuông thông báo | Báo khi tài liệu được duyệt, bị từ chối, bị xóa, có bình luận mới, hoặc báo cáo đã được xử lý |

Các tab Hỏi đáp, Tóm tắt, Ôn tập và chế độ tìm "Ngữ nghĩa" chưa hoạt động: chúng cần AI service.

## Trang quản trị

| Trang | Chức năng |
|---|---|
| Tổng quan | Số tài liệu chờ duyệt, đã duyệt, người dùng, lượt tải; biểu đồ tài liệu đăng mới và người dùng mới 7 ngày; 5 tài liệu được tải nhiều nhất và 5 người đăng nhiều nhất |
| Kiểm duyệt | Xem PDF, duyệt, từ chối kèm lý do, xóa tài liệu đã từ chối |
| Báo cáo | Xem báo cáo vi phạm của sinh viên, gỡ tài liệu kèm lý do hoặc bỏ qua |
| Người dùng | Tìm kiếm, cấp hoặc bỏ quyền quản trị, khóa và mở khóa |
| Môn học | Thêm, đổi tên, xóa |
| Nhật ký | Ai đã duyệt, từ chối, xóa, khóa, đổi quyền, sửa môn học, xóa bình luận, xử lý báo cáo và đăng nhập trang quản trị lúc nào |
| Tài khoản | Đổi mật khẩu quản trị, đăng xuất mọi thiết bị |

Khi triển khai thật, thêm địa chỉ của trang quản trị vào `CORS_ORIGIN` của backend.

## Giao diện sáng/tối và ngôn ngữ

Cả hai trang đều có nút đổi giao diện sáng/tối và nút đổi tiếng Việt/tiếng Anh (trang sinh viên: thanh menu và chân trang; trang quản trị: thanh bên và màn hình đăng nhập). Lựa chọn được nhớ trong `localStorage` của trình duyệt.

- **Giao diện tối:** `src/index.css` đổi bốn biến màu khi `<html data-theme="dark">`. Lần đầu mở trang thì theo cài đặt của hệ điều hành.
- **Ngôn ngữ:** chuỗi tiếng Việt trong mã nguồn chính là khóa, viết `t('Thư viện')`; bản dịch nằm ở `src/lib/i18n.en.ts`. Thêm chữ mới thì bọc bằng `t()` rồi thêm một dòng vào từ điển; thiếu bản dịch thì hiện nguyên tiếng Việt.
- Thông báo lỗi của backend và tên các môn học có sẵn cũng được dịch qua từ điển. Nội dung do người dùng nhập (tiêu đề, bình luận, tên môn mới) và thông báo trong chuông đã lưu ở database thì giữ nguyên tiếng Việt.

## Bảo mật đã áp dụng

- Access token (15 phút) chỉ nằm trong bộ nhớ trình duyệt; refresh token nằm trong cookie `httpOnly`, `SameSite=Strict`, mỗi lần dùng là đổi mới. Token đã đổi mà bị gửi lại sau 10 giây thì mọi phiên của người đó bị hủy (10 giây đầu được bỏ qua, để hai tab mở cùng lúc không đăng xuất lẫn nhau).
- CORS chỉ cho phép các địa chỉ trong `CORS_ORIGIN`.
- Giới hạn tần suất (`backend/src/middlewares/rateLimit.ts`): toàn bộ API 120 lần/phút; đăng nhập sai 10 lần/15 phút theo IP và theo từng email; tối đa 5 tài khoản mới mỗi giờ mỗi IP; sẵn bộ giới hạn riêng cho API gọi AI. Bộ đếm nằm trong bộ nhớ nên mất khi khởi động lại backend.
- AI service yêu cầu header `X-Internal-Key`; MySQL, Qdrant và AI service chỉ mở cổng cho `127.0.0.1`.
- Upload: chỉ nhận PDF thật (kiểm tra nội dung file, không tin phần đuôi), tối đa 20 MB và 1000 trang, 10 file mỗi giờ mỗi người. File lưu bằng tên UUID và chỉ tải được qua API có kiểm tra quyền.
- Kiểm duyệt: tài liệu mới ở trạng thái chờ duyệt, chỉ người đăng và quản trị viên xem được cho tới khi được duyệt ở trang quản trị.
- Cảnh báo thông tin cá nhân: 30 trang đầu của PDF được quét email và số điện thoại; kết quả (đã che bớt) hiện cho người đăng và quản trị viên.
- Trang quản trị tách riêng: chỉ tài khoản ADMIN đăng nhập được ở đó, phiên dùng cookie riêng (`admin_refresh_token`) nên không lẫn với phiên ở trang sinh viên. Tài khoản không phải admin nhận cùng thông báo "sai email hoặc mật khẩu" như khi nhập sai.
- Mỗi request có token đều đọc lại tài khoản từ database: tài khoản bị khóa, bị hạ quyền hoặc bị xóa mất quyền ngay, không đợi token hết hạn.
- Đổi mật khẩu phải nhập đúng mật khẩu hiện tại; đổi xong mọi phiên khác bị hủy ngay (xóa refresh token, và access token cấp trước mốc `tokensValidAfter` bị từ chối). "Đăng xuất mọi thiết bị" dùng cùng cơ chế.
- Bình luận và báo cáo: chỉ trên tài liệu đã duyệt, cần đăng nhập; tối đa 20 bình luận/10 phút và 10 báo cáo/giờ mỗi người; không tự báo cáo tài liệu của mình, mỗi người một báo cáo đang mở cho mỗi tài liệu. Chỉ tác giả hoặc quản trị viên xóa được bình luận.
- Nhật ký quản trị (bảng `admin_logs`): chỉ ghi thêm, không có API sửa hay xóa.
- Quên mật khẩu: mã đặt lại chỉ lưu dạng băm SHA-256, sống 30 phút, dùng một lần, nằm sau dấu `#` của liên kết nên không lọt vào nhật ký máy chủ. Email chưa đăng ký vẫn nhận cùng một câu trả lời; mỗi tài khoản tối đa 3 thư/giờ, mỗi IP 5 yêu cầu/giờ. Đặt lại xong mọi phiên bị hủy.
- Sửa tài liệu: chỉ người đăng (quản trị viên cũng không sửa hộ); không đổi được file PDF.
- `TRUST_PROXY` phải đúng số proxy đứng trước backend, nếu không giới hạn tần suất sẽ tính sai IP.
- Refresh token và mã đặt lại mật khẩu hết hạn được dọn tự động mỗi 6 giờ khi backend đang chạy.

## Dữ liệu nằm ở đâu

| Dữ liệu | Vị trí |
|---|---|
| Database MySQL | Docker volume `studymind-ai_mysql_data`, nằm trong ổ đĩa ảo của Docker Desktop chứ không phải thư mục trong dự án |
| File PDF | `backend/uploads/` (tên file là UUID, không commit) |
| Vector của phần AI (sau này) | Docker volume `studymind-ai_qdrant_data` |

Xem dữ liệu: `npm run db:studio` trong `backend/`, hoặc nối MySQL Workbench / DBeaver tới `127.0.0.1:3307`, database `studymind`, tài khoản `studymind` (mật khẩu là `MYSQL_PASSWORD` trong `.env` ở thư mục gốc).

`docker compose down` giữ nguyên dữ liệu. `docker compose down -v` hoặc xóa volume trong Docker Desktop sẽ xóa sạch database.

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
