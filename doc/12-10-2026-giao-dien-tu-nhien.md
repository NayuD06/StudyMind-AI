# Chỉnh giao diện cho tự nhiên hơn

Trạng thái: đã commit · Ngày: 12-10-2026

Giao diện cũ có nhiều chi tiết lặp lại theo khuôn nên trông như do máy sinh ra. Lượt này giữ nguyên phong cách (bảng màu, góc vuông, viền 2px, bóng cứng, phông chữ, nền ô lưới), chỉ bỏ phần trang trí thừa. Áp dụng cho cả trang sinh viên (`frontend/`) và trang quản trị (`admin/`).

## Đã làm

**Nhãn và chữ**

- Bỏ nhãn nhỏ kiểu `/ THƯ VIỆN`, `/ ĐĂNG NHẬP` phía trên tiêu đề, bỏ mã `01 · TỔNG QUAN` ở trang quản trị.
- Nhãn, tab, tiêu đề cột bảng viết thường thay vì in hoa. Phông mono chỉ còn ở mã môn, tên file, IP, số trang PDF.
- Bỏ mũi tên `→` trên các nút. Chỉ giữ ở liên kết quay lại (`←`), nút phân trang và một liên kết "Xem tất cả →".
- Viết lại lời văn cho đúng cái đang có, bỏ khẩu hiệu ("Học cùng nhau, nhanh hơn.", "Chào mừng quay lại.").

**Hiệu ứng**

- Bỏ: chữ chạy ngang, gõ chữ, con trỏ nhấp nháy, hiện dần khi cuộn, vầng sáng theo chuột, khối trôi nổi, đếm số, thẻ hiện lần lượt.
- Giữ: nút lún khi bấm, vệt bút dạ quang ở tiêu đề trang chủ, thông báo và menu hiện ra, cột biểu đồ mọc lên.
- Bóng nhỏ lại: nút 4px → 3px, khung 6px → 4px. Thanh đầu trang không còn làm mờ nền.

**Trang chủ**

- Bỏ khung hỏi đáp AI giả, dải chữ chạy, phần "Cách hoạt động" 5 bước (các tính năng AI này chưa nối).
- Thay bằng: ô tìm kiếm, danh sách môn có sẵn, khung "Mới đăng" (5 tài liệu mới nhất), mục "Đang được tải nhiều".
- Chân trang còn một dòng, bỏ chữ StudyMind viền rỗng cỡ lớn và dòng liệt kê công nghệ.

**Dọn dẹp**

- Xóa `Reveal.tsx`, `Marquee.tsx`, `useTypewriter.ts` (frontend), `useCountUp.ts` (admin).
- Từ điển tiếng Anh: xóa các chuỗi không còn dùng, thêm chuỗi mới (frontend 264 chuỗi, admin 150).

## Kiểm tra

- `npm run build` và `npm run lint` ở cả hai app: qua (còn một cảnh báo oxlint có từ trước ở `src/lib/auth.tsx`).
- Từ điển tiếng Anh không thiếu chuỗi nào.
- Mở trên trình duyệt với dữ liệu mẫu: trang chủ (tối), thư viện, chi tiết tài liệu, đăng nhập (sáng); trang quản trị: đăng nhập, tổng quan, người dùng, nhật ký, kiểm duyệt.

## Chưa kiểm tra

- Chưa xem bằng mắt bản tiếng Anh và màn hình điện thoại sau khi chỉnh.
- Chưa mở các trang cần đăng nhập ở trang sinh viên (tài liệu của tôi, tài khoản, đăng tài liệu, sửa tài liệu) và trang báo cáo, môn học, tài khoản ở trang quản trị; các trang này mới qua build.

## Ghi chú

Khi làm xong phần AI có thể đưa lại phần giới thiệu hỏi đáp trên trang chủ, lúc đó dùng dữ liệu thật.
