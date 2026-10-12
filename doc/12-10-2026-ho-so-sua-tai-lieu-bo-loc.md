# Hồ sơ, trang người đăng, sửa tài liệu, bộ lọc và thống kê

Trạng thái: đã commit · Ngày: 12-10-2026

Bốn phần việc nhỏ làm cùng lúc vì dùng chung dữ liệu trường và ngành.

## 1. Hồ sơ và trang người đăng

- Trang **Tài khoản** có thêm form hồ sơ: họ tên, trường, ngành (`PATCH /api/auth/me`). Email và vai trò không sửa được qua đây.
- Trang công khai `/users/:id` (`GET /api/users/:id`): tên, trường, ngành, tháng tham gia, số tài liệu đã duyệt, tổng lượt tải và danh sách tài liệu. **Không trả email.** Vào từ tên người đăng ở trang chi tiết tài liệu, hoặc từ "Của tôi" và "Tài khoản".
- Form đăng tài liệu có thêm ô **Ngành**; trường và ngành được điền sẵn từ hồ sơ.

Không làm ảnh đại diện: thêm một luồng tải ảnh (kiểm tra định dạng, đổi kích thước, lưu trữ) là khá nhiều việc so với giá trị cho đồ án.

## 2. Sửa tài liệu

- Trang `/documents/:id/edit`, vào bằng nút **Sửa** ở "Của tôi" (`PUT /api/documents/:id`).
- Sửa được tiêu đề, môn, trường, ngành, mô tả. Không đổi được file PDF; muốn đổi thì xóa rồi đăng lại.
- Chỉ người đăng sửa được. Quản trị viên cũng không sửa hộ (họ đã có quyền từ chối và xóa).
- Tài liệu **bị từ chối** mà sửa thì quay về hàng chờ duyệt, lý do từ chối cũ được xóa. Nút đổi thành "Sửa & gửi lại".
- Tài liệu **đã duyệt** mà sửa thì **vẫn công khai, không duyệt lại**.

Điểm cuối là một lựa chọn có đánh đổi: người đăng có thể sửa tiêu đề và mô tả thành nội dung xấu sau khi đã được duyệt. Chấp nhận vì file PDF không đổi được, và sinh viên khác vẫn báo cáo được. Nếu muốn chặt hơn thì cho tài liệu quay lại hàng chờ sau mỗi lần sửa (đổi một dòng trong `updateDocument`).

## 3. Tìm kiếm và bộ lọc ở thư viện

- **Tìm kiếm:** từ khóa được tách thành từng từ, tài liệu phải chứa đủ mọi từ ở tiêu đề, mô tả hoặc tên môn, thứ tự bất kỳ. Trước đây phải khớp nguyên cụm, nên "sql cơ bản" không ra "Cơ bản về SQL". Tối đa 8 từ.
- **Bộ lọc mới:** trường, ngành, điểm đánh giá trung bình (từ 2, 3 hoặc 4 sao). Danh sách trường và ngành lấy từ các tài liệu đang công khai (`GET /api/documents/facets`). Bộ lọc nằm trên URL như các bộ lọc cũ, có nút xóa hết.

Không dùng FULLTEXT của MySQL như đã đề xuất ban đầu. Bộ tách từ mặc định của MySQL bỏ qua từ ngắn hơn 3 ký tự, mà tiếng Việt rất nhiều từ ngắn ("cơ", "sở", "dữ"), còn bộ ngram thì cần cấu hình máy chủ và đánh chỉ mục lại. Cách tách từ ở trên giải quyết được nhược điểm chính với ít rủi ro hơn. Nhược điểm còn lại: không xếp hạng theo độ liên quan, và sẽ chậm khi có hàng chục nghìn tài liệu. Tìm theo nghĩa là việc của phần AI.

Trường và ngành là chữ người dùng tự gõ, nên "ĐH Bách khoa" và "Đại học Bách Khoa" là hai mục khác nhau trong bộ lọc. Dữ liệu mẫu (`npm run db:seed:demo`) đã có sẵn trường và ngành để thử.

## 4. Thống kê ở trang quản trị

Trang Tổng quan thêm: biểu đồ người dùng mới 7 ngày, 5 tài liệu được tải nhiều nhất, 5 người đăng nhiều tài liệu được duyệt nhất (kèm tổng lượt tải). Tất cả trong cùng một lần gọi `GET /api/admin/stats`.

## Kiểm tra

- Test tự động cho mọi API ở trên (xem [12-10-2026-test-tu-dong.md](12-10-2026-test-tu-dong.md)).
- Thử trên trình duyệt bằng một tài khoản tạm (đã xóa): đăng ký, lưu hồ sơ, mở trang công khai, form đăng tài liệu điền sẵn trường và ngành, đăng một PDF, sửa tiêu đề và môn rồi lưu, lọc thư viện theo trường và điểm đánh giá, xem bảng xếp hạng ở trang quản trị.
- `oxlint` và build của cả hai trang đều qua; mọi chữ mới đã có bản tiếng Anh.

## Chưa kiểm tra

- Chưa nhìn bằng mắt các màn hình mới (kiểm tra qua nội dung trang, không chụp ảnh), nên chưa chắc về bố cục trên điện thoại và ở giao diện tối.
- Chưa thử các trang mới bằng tiếng Anh trên trình duyệt.
