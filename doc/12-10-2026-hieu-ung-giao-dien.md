# Thêm hiệu ứng cho giao diện

Trạng thái: đã commit · Ngày: 12-10-2026

Sau lượt [bỏ trang trí thừa](12-10-2026-giao-dien-tu-nhien.md), trang gọn nhưng hơi tĩnh. Lượt này thêm chuyển động để trang nổi bật hơn, vẫn giữ phong cách góc vuông, viền đậm, bóng cứng. Các kiểu hiệu ứng lấy theo những trang cùng phong cách (thẻ nhấc lên kèm bóng cứng, nhãn dán nghiêng, dải chữ chạy, vạch tiến độ cuộn). Không dùng thêm thư viện nào, toàn bộ là CSS và vài hook nhỏ.

## Đã làm

**Trang sinh viên (`frontend/`)**

| Hiệu ứng | Ở đâu | File |
|---|---|---|
| Trang mới trượt nhẹ lên khi đổi đường dẫn | Mọi trang | `Layout.tsx`, `.page-in` |
| Vạch cam chạy theo độ cuộn, nút ↑ lên đầu trang | Thanh đầu trang | `components/ScrollFx.tsx` |
| Logo chữ S nghiêng khi rê chuột | Thanh đầu trang | `Layout.tsx` |
| Thẻ tài liệu nhấc lên, nghiêng nhẹ, góc giấy mở ra đổi màu cam | Mọi lưới tài liệu | `DocCard.tsx`, `.doc-card` |
| Thẻ trong lưới vào lần lượt | Thư viện, Của tôi, trang người đăng | `.stagger` |
| Hiện dần khi cuộn tới | "Đang được tải nhiều", dải kêu gọi ở trang chủ | `components/Reveal.tsx` |
| Dải chữ chạy tên các môn học (dừng khi rê chuột) | Trang chủ | `components/Marquee.tsx` |
| Nhãn dán nghiêng "N tài liệu" đung đưa | Khung "Mới đăng" | `.sticker` |
| Dòng danh sách có vạch cam trượt xuống, chữ nhích sang phải | Khung "Mới đăng" | `.row-slide` |
| Khung chờ lấp lánh khi đang tải | Khung "Mới đăng" | `.skeleton` |
| Sọc chéo chạy chậm | Dải cam cuối trang chủ | `.stripes` |
| Vệt sáng lướt qua nút khi rê chuột | Mọi nút `.btn` | `index.css` |
| Hai ô vuông trôi chậm | Trang đăng nhập, đăng ký, quên mật khẩu | `AuthShell.tsx`, `.drift` |
| Số 0 lắc lư | Trang 404 | `NotFoundPage.tsx` |

**Trang quản trị (`admin/`)**

- Trang mới trượt lên khi đổi mục; bốn ô số liệu vào lần lượt, nhấc lên khi rê chuột, con số chạy từ 0 (`lib/useCountUp.ts`).
- Hàng trong bảng vào lần lượt; vạch cam ở thanh bên mọc ra khi rê chuột.

**Sửa kèm**

- Thanh đầu trang bị tràn ngang ở màn hình hẹp hơn 800px khi đã đăng nhập: tên người dùng giờ chỉ hiện từ 1024px trở lên (vẫn vào trang tài khoản được từ "Của tôi").
- Nút "Ngữ nghĩa" ở thư viện không còn xuống dòng.

**Tắt chuyển động:** người dùng bật "giảm chuyển động" trong hệ điều hành thì mọi hiệu ứng tắt (`prefers-reduced-motion`), số liệu hiện thẳng giá trị thật.

## Kiểm tra

- Backend: `npm test` qua 55/55.
- Hai app: `npm run build`, `npm run lint` qua (còn một cảnh báo oxlint có từ trước ở `src/lib/auth.tsx`); từ điển tiếng Anh không thiếu chuỗi.
- Trên trình duyệt với dữ liệu mẫu, dùng tài khoản thử (đã xóa sau khi xong):
  - Trang chủ: dải chữ chạy, nhãn dán, thẻ hiện dần khi cuộn, nút lên đầu trang.
  - Đăng ký tài khoản, tìm kiếm "SQL" (ra đúng 1 tài liệu), mở tài liệu và xem PDF, lưu lại, chấm 5 sao, gửi bình luận, trang "Của tôi" (đã lưu: 1).
  - Quản trị: đăng nhập, tổng quan (ô số liệu, biểu đồ), môn học.

## Chưa kiểm tra

- Đăng tài liệu, sửa tài liệu, tải xuống, quên mật khẩu, báo cáo vi phạm: lượt này không thử lại bằng tay trên trình duyệt (phần backend có test tự động).
- Chưa xem bản tiếng Anh và màn hình điện thoại bằng mắt.
- Chưa xem lại các trang kiểm duyệt, báo cáo, người dùng, nhật ký của quản trị sau khi thêm hiệu ứng (chỉ qua build).
