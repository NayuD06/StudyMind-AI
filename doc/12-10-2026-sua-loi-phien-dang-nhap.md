# Sửa hai lỗi phiên đăng nhập

Trạng thái: đã commit · Ngày: 12-10-2026

Hai lỗi tìm ra khi đọc lại mã, cùng một gốc: refresh token đã thu hồi mà được gửi lại thì hệ thống coi là bị đánh cắp và hủy mọi phiên của người đó. Cơ chế này đúng, nhưng có hai tình huống bình thường cũng rơi vào nó.

## Lỗi 1 – Mở hai tab cùng lúc bị đăng xuất cả hai

Hai tab của cùng trình duyệt dùng chung một cookie. Khi cả hai cùng làm mới phiên (ví dụ khôi phục trình duyệt với nhiều tab), tab đến sau gửi token mà tab trước vừa đổi xong, và bị coi là kẻ trộm.

**Sửa** (`auth.service.ts`, hàm `refresh`): token vừa được đổi vẫn dùng lại được trong 10 giây (`REUSE_GRACE_MS`). Quá 10 giây mới coi là bị đánh cắp.

Đánh đổi: nếu token bị lấy cắp, kẻ trộm cũng dùng lại được nó trong đúng 10 giây đó mà không bị phát hiện.

## Lỗi 2 – Đổi quyền hoặc khóa tài khoản xong, phiên mới bị hủy oan

Khi quản trị viên đổi quyền hoặc khóa/mở khóa, các token cũ chỉ được *đánh dấu thu hồi*. Người dùng đăng nhập lại, rồi một thiết bị khác gửi token cũ lên, thế là phiên mới bị hủy theo. Đây là cùng loại lỗi đã sửa ở đổi mật khẩu.

**Sửa** (`admin.service.ts`, hàm `updateUser`): xóa hẳn token thay vì đánh dấu.

## Thay đổi kèm theo

Để khoảng ân hạn 10 giây không bị lợi dụng, cột `revokedAt` giờ chỉ có một nghĩa: token đã được đổi lấy token mới. Mọi trường hợp hủy phiên khác đều xóa hẳn dòng:

| Trường hợp | Trước | Sau |
|---|---|---|
| Đăng xuất | Đánh dấu thu hồi | Xóa |
| Quản trị viên khóa / đổi quyền | Đánh dấu thu hồi | Xóa |
| Phát hiện token bị dùng lại | Đánh dấu thu hồi mọi token | Xóa mọi token |
| Đổi mật khẩu, đăng xuất mọi thiết bị | Xóa | Xóa (không đổi) |

Không cần migration.

## Kiểm tra

Chạy một script thử gọi thẳng các hàm trên database thật, bằng một tài khoản tạm (xong thì xóa). Cả 7 phép thử đạt:

- Hai request đồng thời cùng một token: cả hai nhận được phiên dùng được.
- Request đến sau 1 giây: vẫn có phiên, phiên của request trước không bị hủy.
- Token cũ gửi lại sau 11 giây: bị từ chối, mọi phiên bị hủy.
- Token đã đăng xuất: không dùng lại được, kể cả ngay lập tức.
- Sau khi quản trị viên hủy phiên: token cũ bị từ chối, phiên đăng nhập lại vẫn sống.

**Chưa kiểm tra:** chưa thử bằng hai tab trình duyệt thật.
