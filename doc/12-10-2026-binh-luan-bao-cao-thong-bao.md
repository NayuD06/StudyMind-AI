# Bình luận, báo cáo vi phạm, thông báo và đổi mật khẩu

Commit: `6553353` · Ngày: 12-10-2026

## Đã làm

| Chức năng | Trang sinh viên | Trang quản trị | Backend |
|---|---|---|---|
| Bình luận | Khung bình luận dưới trình đọc PDF (`components/Comments.tsx`) | Quản trị viên xóa được bình luận | Chỉ trên tài liệu đã duyệt; tối đa 20 bình luận / 10 phút mỗi người |
| Báo cáo vi phạm | Ô báo cáo trong tab "Thông tin" (`components/ReportBox.tsx`) | Trang Báo cáo: gỡ tài liệu kèm lý do, hoặc bỏ qua | Không tự báo cáo tài liệu của mình; mỗi người một báo cáo đang mở cho mỗi tài liệu; 10 báo cáo / giờ |
| Thông báo | Chuông trên thanh menu, tự hỏi lại server mỗi 60 giây | Số việc đang chờ hiện cạnh mục Kiểm duyệt và Báo cáo | Báo khi tài liệu được duyệt, bị từ chối, bị xóa, có bình luận mới, báo cáo đã xử lý |
| Tài khoản | Trang `/account`: đổi mật khẩu, đăng xuất mọi thiết bị | Trang Tài khoản tương tự | Cột `User.tokensValidAfter`: access token cấp trước mốc này bị từ chối |

Migration: `20261012094609_notifications_token_cutoff`. Nhật ký quản trị ghi thêm ba loại thao tác: xóa bình luận, gỡ theo báo cáo, bỏ qua báo cáo.

## Lỗi phát hiện khi kiểm thử

**Đổi mật khẩu xong thì chính phiên mới cũng bị đăng xuất.** Ban đầu đổi mật khẩu chỉ *đánh dấu thu hồi* các refresh token cũ. Khi một thiết bị khác gửi token cũ đó lên, cơ chế chống đánh cắp coi đây là token bị dùng lại và hủy mọi phiên của người dùng, kể cả phiên vừa cấp cho thiết bị đang đổi mật khẩu. Cách sửa: `endAllSessions` trong `auth.service.ts` **xóa hẳn** refresh token thay vì đánh dấu.

**Bảng thông báo tràn mép trái trên điện thoại.** Sửa bằng cách cho bảng trải ngang màn hình ngay dưới thanh menu ở màn hình hẹp.

## Kiểm tra

- 69 phép thử qua API đều đạt (quyền, giới hạn tần suất, các trường hợp bị cấm).
- Thử các luồng trên giao diện ở cả hai app bằng tài khoản thử, xong thì xóa hết dữ liệu thử.
- Lint, kiểm tra kiểu và build đạt ở cả ba app.
