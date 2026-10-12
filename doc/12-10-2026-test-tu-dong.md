# Bộ test tự động cho backend

Trạng thái: đã commit · Ngày: 12-10-2026

Trước đây mỗi lần sửa backend phải tự viết script thử rồi xóa. Giờ có bộ test cố định: 55 test, chạy khoảng 45 giây, chạy trên máy bằng `npm test` và chạy lại trên CI ở mỗi lần push.

## Đã làm

- Dùng **vitest** (chạy test) và **supertest** (gọi API mà không cần mở cổng). Test nằm ở `backend/tests/`, ngoài `src/` nên không lọt vào bản build.
- Test gọi API thật trên MySQL thật, không giả lập database. Lý do: phần dễ sai nhất của dự án là quyền xem, phiên đăng nhập và truy vấn tìm kiếm, toàn là thứ chỉ lộ ra khi chạy với database.
- Database riêng `studymind_test`. `tests/test-env.ts` lấy `DATABASE_URL` trong `.env` rồi đổi tên database; nếu tên không kết thúc bằng `_test` thì dừng ngay, vì bước chuẩn bị sẽ xóa sạch database đó.
- `tests/global-setup.ts` chạy một lần trước cả bộ: áp migration lên database test, xóa dữ liệu lượt trước.
- Khi `NODE_ENV=test`: tắt giới hạn tần suất và log request, thư không gửi đi mà nằm trong mảng `testOutbox` (`src/lib/mailer.ts`) để test đọc được liên kết đặt lại mật khẩu.

| File | Số test | Kiểm tra gì |
|---|---|---|
| `auth.test.ts` | 20 | Đăng ký, đăng nhập, khóa tài khoản, làm mới phiên (hai tab, token bị dùng lại), đổi mật khẩu, quên mật khẩu, hồ sơ |
| `documents.test.ts` | 26 | Đăng tài liệu (file giả PDF, thông tin cá nhân), ai xem được tài liệu chưa duyệt, tìm kiếm và bộ lọc, sửa, đánh giá, lưu, bình luận, báo cáo, xóa |
| `admin.test.ts` | 9 | Sinh viên bị chặn ở mọi route quản trị, kiểm duyệt, gỡ theo báo cáo, khóa và cấp quyền, môn học, thống kê |

## Lỗi test tìm ra

Gõ `%` hoặc `_` vào ô tìm kiếm thì khớp **mọi** tài liệu, vì Prisma không tự thoát ký tự đại diện của `LIKE`. Đã sửa trong `searchFilter` (`documents.service.ts`) và có test giữ lại.

## Chạy trên máy

```bash
cd backend
npm test
```

MySQL trong Docker phải đang chạy. Database `studymind_test` được tạo bởi `docker/mysql-init/02-test-db.sql`, nhưng file này chỉ chạy khi MySQL khởi tạo lần đầu. Nếu MySQL đã có dữ liệu từ trước, tạo một lần bằng lệnh sau (chạy ở thư mục gốc, trong Git Bash):

```bash
docker compose exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -uroot' < docker/mysql-init/02-test-db.sql
```

Trên máy đang làm việc, database này đã được tạo sẵn.

## Trên CI

Job `backend` trong `.github/workflows/ci.yml` thêm ba việc: tạo database `studymind_test`, kiểm tra kiểu của bộ test (`npx tsc -p tests`), rồi `npm test`.

## Kiểm tra

- `npm test`: 55/55 đạt, chạy lại nhiều lần liên tiếp vẫn đạt (dữ liệu mỗi test tự tạo, không phụ thuộc thứ tự).
- `npx tsc -p tests`: không lỗi.

## Chưa kiểm tra

- Phần thêm vào CI chưa chạy lần nào, vì chưa push.
- Chưa có test cho giao diện (frontend, admin) và cho AI service.
