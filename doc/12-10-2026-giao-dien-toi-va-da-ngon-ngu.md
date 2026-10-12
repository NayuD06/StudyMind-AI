# Giao diện sáng/tối và tiếng Việt/tiếng Anh

Commit: `f62e907` · Ngày: 12-10-2026

## Đã làm

Cả trang sinh viên và trang quản trị có hai nút (`components/Prefs.tsx`): đổi giao diện sáng/tối và đổi VI/EN. Lựa chọn được nhớ trong `localStorage`.

| Vị trí nút | |
|---|---|
| Trang sinh viên | Thanh menu (màn hình từ 1024px) và chân trang (mọi kích thước) |
| Trang quản trị | Cuối thanh bên, và góc trên phải màn hình đăng nhập |

## Giao diện tối

- Toàn bộ màu của giao diện đi qua bốn biến CSS (nền giấy, nền thẻ, mực, chữ phụ). Giao diện tối chỉ đổi bốn biến này khi `<html data-theme="dark">`; vàng và cam giữ nguyên. Phần CSS nằm cuối `src/index.css` của mỗi app.
- Một đoạn script nhỏ trong `index.html` gắn giao diện trước khi trang được vẽ, nên không bị nháy sáng rồi mới tối. Lần đầu mở trang thì theo cài đặt của hệ điều hành.
- Các khối nền đen lớn (chân trang, thanh bên, nửa trái trang đăng nhập) mang class `surface-dark` để vẫn là khối tối chữ sáng; nếu không chúng sẽ đảo thành khối trắng chói. Các nút nhỏ đang được chọn thì đảo màu bình thường.
- Chữ trên nền vàng/cam luôn là đen (biến `--color-coal`), kể cả khi chữ xung quanh đã chuyển sáng.
- Khi bấm đổi có hiệu ứng quét từ trên xuống bằng View Transitions API (`lib/theme.ts`). Trình duyệt cũ hoặc người tắt chuyển động thì đổi ngay.

## Ngôn ngữ

- Module tự viết `lib/i18n.ts`, không dùng thư viện. Chuỗi tiếng Việt trong mã nguồn chính là khóa: `t('Thư viện')`, có chỗ trống thì `t('Còn {0} tài liệu', 3)`. Bản dịch nằm ở `lib/i18n.en.ts`; thiếu thì hiện nguyên tiếng Việt.
- Đổi ngôn ngữ sẽ tải lại trang một lần. Nhờ vậy `t()` gọi được ở mọi nơi, kể cả các hằng số khai báo ngoài component, và mã nguồn không phải chuyển sang hook.
- Khoảng 320 chuỗi được bọc `t()` bằng một script dùng TypeScript compiler API, sau đó sửa tay những chỗ câu bị cắt thành mảnh. Từ điển có 253 mục ở trang sinh viên, 158 mục ở trang quản trị.
- Thông báo lỗi của backend, tên 8 môn học có sẵn và định dạng ngày giờ cũng đổi theo ngôn ngữ.

**Giới hạn:** nội dung người dùng nhập (tiêu đề, bình luận, tên môn tự thêm), thông báo trong chuông và dòng nhật ký quản trị đã lưu trong database nên giữ nguyên tiếng Việt.

## Thêm chữ mới sau này

1. Viết chữ tiếng Việt trong `t('...')`.
2. Thêm một dòng `'chuỗi tiếng Việt': 'English text',` vào `src/lib/i18n.en.ts` của app đó.

## Sửa kèm theo

Thanh menu trang sinh viên trên điện thoại bị tràn khoảng 15px khi đã đăng nhập; đã thu hẹp khoảng cách cho vừa 375px.

## Kiểm tra

- Script đối chiếu mọi lời gọi `t()` với từ điển: không thiếu mục nào ở cả hai app.
- Script đo độ tương phản chữ/nền trên các trang chính, ở cả sáng và tối: không có chỗ nào dưới ngưỡng.
- Bấm nút thật trên trình duyệt: đổi giao diện và ngôn ngữ đều chạy và được nhớ sau khi tải lại; không tràn ngang ở 375px và 1024px.
- **Chưa kiểm tra bằng mắt:** lúc làm không chụp được màn hình, nên hiệu ứng quét và cảm giác tổng thể của bảng màu tối cần người xem lại.
