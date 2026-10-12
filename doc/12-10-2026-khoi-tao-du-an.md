# Khởi tạo dự án

Commit: `9108c90`, `bba2628` · Ngày: 12-10-2026

StudyMind AI là hệ thống chia sẻ tài liệu học tập, định hướng tích hợp tìm kiếm ngữ nghĩa và hỏi đáp AI (RAG). Phần này dựng toàn bộ nền: ba ứng dụng chạy được, database, và khung cho AI service.

## Kiến trúc

| Phần | Công nghệ | Cổng |
|---|---|---|
| `frontend/` – trang sinh viên | React 19, Vite, TypeScript, Tailwind v4, TanStack Query, react-pdf | 5173 |
| `admin/` – trang quản trị (app riêng) | Cùng công nghệ với `frontend/` | 5174 |
| `backend/` – REST API | Node 24, Express 5, TypeScript, Prisma, Zod | 4000 |
| MySQL 8.4 | Docker, volume `studymind-ai_mysql_data` | 3307 |
| `ai-service/` – khung | Python, FastAPI, Qdrant | 8000 |

Trang quản trị là một app tách riêng chứ không phải một nhóm trang trong `frontend/`: chỉ tài khoản ADMIN đăng nhập được ở đó và phiên dùng cookie riêng, nên không lẫn với phiên ở trang sinh viên.

## Chức năng đã có sau phần này

**Sinh viên:** đăng ký, đăng nhập; thư viện có tìm theo từ khóa, lọc theo môn, sắp xếp, phân trang; đọc PDF ngay trên trang; lưu lại, chấm sao, tải xuống; đăng tài liệu PDF; trang "Của tôi" xem trạng thái duyệt.

**Quản trị:** tổng quan số liệu và biểu đồ 7 ngày; kiểm duyệt tài liệu (duyệt, từ chối kèm lý do, xóa); quản lý người dùng (cấp/bỏ quyền, khóa/mở khóa); quản lý môn học; nhật ký thao tác chỉ ghi thêm.

**Chưa hoạt động:** các tab Hỏi đáp, Tóm tắt, Ôn tập và chế độ tìm "Ngữ nghĩa" – chúng chờ AI service (xem [kế hoạch AI](12-10-2026-ke-hoach-ai.md)).

## Bảo mật

- Access token sống 15 phút và chỉ nằm trong bộ nhớ trình duyệt. Refresh token nằm trong cookie `httpOnly`, `SameSite=Strict`, dùng một lần rồi đổi mới; token đã thu hồi mà bị gửi lại thì hủy mọi phiên của người đó.
- Mỗi request đều đọc lại tài khoản từ database, nên khóa hay hạ quyền có hiệu lực ngay.
- Giới hạn tần suất cho toàn bộ API, đăng nhập sai, tạo tài khoản và upload.
- Upload chỉ nhận PDF thật (kiểm tra nội dung file), tối đa 20 MB và 1000 trang; file lưu bằng tên UUID và chỉ tải được qua API có kiểm tra quyền.
- Tài liệu mới ở trạng thái chờ duyệt; 30 trang đầu được quét email và số điện thoại để cảnh báo thông tin cá nhân.
- MySQL, Qdrant và AI service chỉ mở cổng cho `127.0.0.1`. Không file `.env` nào được commit.

Danh sách đầy đủ nằm ở mục "Bảo mật đã áp dụng" trong README.

## Phong cách giao diện

Góc vuông, viền đen 2px, bóng cứng lệch góc, nền giấy kẻ ô; ba phông Space Grotesk, Be Vietnam Pro, JetBrains Mono; hai màu nhấn vàng và cam. Chủ ý tránh kiểu bo tròn mềm quen thuộc.

## Khác

- `scripts/backup-db.ps1`: sao lưu database và thư mục PDF, giữ 7 bản mới nhất.
- `npm run db:seed` trong `backend/`: tạo 8 môn học và tài khoản quản trị đầu tiên từ `backend/.env`.
