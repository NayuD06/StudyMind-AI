# Dữ liệu mẫu để demo

Commit: `eeaa416` · Ngày: 12-10-2026

## Đã làm

Thêm lệnh `npm run db:seed:demo` trong `backend/` để có sẵn nội dung khi demo, thay vì một thư viện trống.

| Tạo ra | Số lượng |
|---|---|
| Sinh viên mẫu (email `@demo.studymind.local`) | 6 |
| Tài liệu PDF thuộc 8 môn | 18: 14 đã duyệt, 2 chờ duyệt, 2 bị từ chối |
| Kèm theo | Đánh giá, lượt lưu, lượt tải, bình luận, 2 báo cáo đang chờ, thông báo |

File: `backend/src/scripts/seed-demo.ts` (logic) và `seed-demo.data.ts` (nội dung).

## Cách hoạt động

- PDF được sinh thật bằng `pdfkit` với nội dung tiếng Việt theo từng môn, rồi đi qua đúng hàm kiểm tra PDF mà upload thật dùng. Một tài liệu cố ý chứa email và số điện thoại để thấy cảnh báo thông tin cá nhân.
- Số ngẫu nhiên dùng hạt giống cố định, nên chạy lại ra đúng bộ dữ liệu cũ.
- Chạy lại sẽ xóa dữ liệu mẫu cũ rồi tạo mới. Lệnh chỉ đụng tới tài khoản có email `@demo.studymind.local` và những gì thuộc về chúng; dữ liệu thật không bị ảnh hưởng. `npm run db:seed:demo -- --clear` chỉ xóa.
- Mật khẩu chung của các tài khoản mẫu lấy từ `DEMO_PASSWORD` trong `backend/.env`, không viết trong mã nguồn.

## Lưu ý

- Cần chạy `npm run db:seed` trước (môn học và tài khoản quản trị).
- Font có dấu lấy từ máy (Arial trên Windows). Không tìm thấy thì PDF được viết không dấu.
- Nhật ký quản trị không có dữ liệu mẫu, vì bảng đó chỉ ghi thêm và phải phản ánh thao tác thật.

## Kiểm tra

Đăng nhập bằng tài khoản mẫu, thư viện hiện 14 tài liệu, lớp chữ của PDF hiển thị đúng tiếng Việt.
