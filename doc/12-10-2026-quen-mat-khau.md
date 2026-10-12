# Đặt lại mật khẩu qua email

Trạng thái: đã commit · Ngày: 12-10-2026

Trước đây quên mật khẩu là mất tài khoản. Giờ trang đăng nhập có liên kết **Quên mật khẩu?**.

## Luồng

1. Người dùng nhập email ở `/forgot-password` (`POST /api/auth/forgot-password`).
2. Backend gửi thư chứa liên kết `APP_URL/reset-password#<mã>`.
3. Người dùng mở liên kết, nhập mật khẩu mới (`POST /api/auth/reset-password`).
4. Mọi phiên đang đăng nhập bị hủy; người dùng đăng nhập lại và thấy một thông báo trong chuông.

## Các quyết định về bảo mật

- **Không lộ ai đã đăng ký:** email có tồn tại hay không, bị khóa hay không, câu trả lời đều giống nhau.
- **Mã không lưu ở dạng đọc được:** database (bảng `password_reset_tokens`, migration `20261012120000_password_reset`) chỉ giữ SHA-256 của mã. Lộ database cũng không dùng được mã.
- **Mã nằm sau dấu `#`:** trình duyệt không gửi phần này lên máy chủ, nên mã không nằm trong nhật ký truy cập của nginx hay header `Referer`.
- **30 phút, dùng một lần:** đặt lại xong thì mọi mã khác của tài khoản đó cũng bị xóa.
- **Chống gửi thư hàng loạt:** mỗi tài khoản tối đa 3 thư mỗi giờ, mỗi IP tối đa 5 yêu cầu mỗi giờ.
- Tài khoản bị khóa không nhận được thư.

## Gửi thư

Dùng `nodemailer` qua SMTP, cấu hình bằng `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` trong `backend/.env`.

**Bỏ trống `SMTP_HOST` thì thư không gửi đi mà được in ra màn hình đang chạy backend**, kèm liên kết. Cách này đủ để phát triển và demo mà chưa cần chọn dịch vụ thư. Khi muốn gửi thật, cách nhanh nhất là Gmail: `smtp.gmail.com`, cổng 587, `SMTP_USER` là địa chỉ Gmail, `SMTP_PASS` là "mật khẩu ứng dụng" (tạo trong phần bảo mật của tài khoản Google, cần bật xác minh 2 bước).

`APP_URL` phải là địa chỉ trang sinh viên mà người dùng mở được, vì liên kết trong thư ghép từ nó.

## Kiểm tra

- 5 test tự động: email lạ không gửi thư, đặt lại thành công và mã chỉ dùng một lần, mã không lưu ở dạng đọc được, mã hết hạn và mã bịa bị từ chối, giới hạn 3 thư mỗi giờ.
- Thử trên trình duyệt với bản đóng gói Docker và một tài khoản tạm (đã xóa): gửi yêu cầu, lấy liên kết từ log backend, nhập hai mật khẩu không khớp (báo lỗi), đặt mật khẩu mới, mật khẩu cũ bị từ chối, mật khẩu mới đăng nhập được, chuông có thông báo, mở lại liên kết cũ thì bị từ chối.

## Chưa kiểm tra

- **Chưa gửi thư thật lần nào.** Phần nối SMTP chỉ mới được viết, chưa chạy với một máy chủ thư thật.
- Trang quản trị chưa có liên kết "quên mật khẩu". Tài khoản quản trị dùng chung bảng người dùng nên về lý thuyết đặt lại được ở trang sinh viên, nhưng chưa thử.
