# Kế hoạch phần AI

Trạng thái: **chưa bắt đầu** · Ngày lập: 12-10-2026

Trong dự án mới có khung `ai-service/` (FastAPI) và Qdrant trong `docker-compose.yml`. File này ghi lại kế hoạch đã thống nhất, chưa có gì được cài đặt.

## Lựa chọn đã chốt

| Thành phần | Chọn | Lý do |
|---|---|---|
| Mô hình tạo vector | `bge-m3`, chạy trên máy | Miễn phí, hỗ trợ tiếng Việt |
| Kho vector | Qdrant, chạy bằng Docker | Miễn phí, đã có trong docker-compose |
| Mô hình ngôn ngữ | Google Gemini API, gói miễn phí | Không tốn tiền, nhanh, tiếng Việt tốt; chỉ cần một key |

Phần gọi mô hình ngôn ngữ sẽ viết tách riêng, đổi Gemini sang Claude chỉ bằng cấu hình.

Hạn chế của gói Gemini miễn phí cần ghi vào báo cáo: có giới hạn số lượt gọi mỗi phút và mỗi ngày, và dữ liệu gửi lên có thể được Google dùng để cải thiện mô hình.

## Bốn bước

**Bước 1 – Xử lý tài liệu và tìm kiếm ngữ nghĩa** (chưa cần key; lần đầu tải khoảng 3–4 GB qua Docker)

- Đọc PDF theo trang, cắt thành đoạn, tạo vector, lưu vào Qdrant và MySQL.
- Khi quản trị viên duyệt tài liệu, backend tự gọi AI service xử lý ngầm; tài liệu bị gỡ thì vector cũng bị xóa.
- Lệnh xử lý lại toàn bộ tài liệu đã duyệt.
- API tìm kiếm ngữ nghĩa, nối vào nút "Ngữ nghĩa" ở Thư viện; hiện trạng thái xử lý của từng tài liệu.

**Bước 2 – Hỏi đáp trên tài liệu** (cần key Gemini)

- Tìm các đoạn liên quan, gửi kèm câu hỏi, yêu cầu trả lời chỉ dựa trên các đoạn đó và ghi rõ trang.
- Lưu lịch sử hội thoại theo từng tài liệu; bấm trích dẫn thì trình đọc PDF nhảy tới đúng trang.
- Giới hạn số câu hỏi mỗi người; chống việc nội dung PDF "ra lệnh" cho mô hình.

**Bước 3 – Tóm tắt và câu hỏi ôn tập** (cần key Gemini)

- Tóm tắt theo ý chính, lưu lại để không gọi mô hình lần hai.
- Bộ câu hỏi trắc nghiệm có đáp án và giải thích; tab Ôn tập cho làm bài và chấm điểm.

**Bước 4 – Đánh giá**

- Chạy tìm kiếm từ khóa và ngữ nghĩa trên cùng một bộ câu truy vấn, tính Recall@5 và MRR, xuất bảng so sánh cho báo cáo.

## Cần chuẩn bị

- Key Gemini lấy ở https://aistudio.google.com, tự dán vào `ai-service/.env`. Không gửi key qua chat và không commit.
- 20–30 file PDF thật và khoảng 30 câu truy vấn kèm đáp án đúng cho bước 4.
