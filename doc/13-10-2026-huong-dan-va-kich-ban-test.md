# Hướng dẫn và kịch bản test toàn bộ chức năng

Trạng thái: đã commit · Ngày: 13-10-2026

File này dùng để tự kiểm tra dự án bằng tay trước khi demo hoặc nộp. Phần 1 là cách dựng môi trường, phần 2 là test tự động, phần 3 trở đi là kịch bản từng chức năng. Mỗi kịch bản có mã (ví dụ `TK-03`) để ghi lại kết quả ở bảng cuối file.

## 1. Chuẩn bị

### 1.1. Bật hệ thống

Mở Docker Desktop, rồi chạy lần lượt (mỗi app một cửa sổ terminal):

```bash
docker compose up -d
```

```bash
cd backend
npm run db:migrate
npm run db:seed
npm run db:seed:demo
npm run dev
```

```bash
cd frontend
npm run dev
```

```bash
cd admin
npm run dev
```

| Thành phần | Địa chỉ |
|---|---|
| Trang sinh viên | http://localhost:5173 |
| Trang quản trị | http://localhost:5174 |
| Backend | http://localhost:4000 (kiểm tra nhanh: `/api/health`) |
| MySQL | `127.0.0.1:3307` |

### 1.2. Tài khoản dùng để test

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `ADMIN_EMAIL` trong `backend/.env` | `ADMIN_PASSWORD` trong `backend/.env` |
| Sinh viên A (có tài liệu) | `minhanh@demo.studymind.local` | `DEMO_PASSWORD` trong `backend/.env` |
| Sinh viên B | `quocbao@demo.studymind.local` | `DEMO_PASSWORD` |
| Sinh viên mới | tự đăng ký ở bước `TK-01` | tự đặt |

Mật khẩu không ghi trong file này vì repo công khai.

### 1.3. Dữ liệu mẫu có sẵn

Sau `db:seed:demo`: 6 sinh viên, 8 môn học, 18 tài liệu (14 đã duyệt, 2 chờ duyệt, 2 bị từ chối), có sẵn đánh giá, bình luận, lượt tải và 2 báo cáo đang chờ. Chạy lại lệnh này bất cứ lúc nào để đưa dữ liệu mẫu về trạng thái ban đầu.

### 1.4. Xem database và dữ liệu seed

**Cách dễ nhất: Prisma Studio** (xem và sửa bảng ngay trên trình duyệt)

```bash
cd backend
npm run db:studio
```

Trình duyệt mở http://localhost:5555. Bấm tên bảng ở cột trái để xem dữ liệu; `User`, `Subject`, `Document` là ba bảng nên xem trước. Tắt bằng Ctrl+C ở terminal.

**Xem bằng lệnh SQL** (vào thẳng MySQL trong Docker)

```bash
docker compose exec mysql mysql -u studymind -p studymind
```

Mật khẩu là giá trị `MYSQL_PASSWORD` trong file `.env` ở thư mục gốc. Vào được rồi thì gõ, ví dụ:

```sql
SHOW TABLES;
SELECT id, name, email, role, isLocked FROM users;
SELECT id, title, moderationStatus, downloadCount FROM documents ORDER BY id DESC;
SELECT moderationStatus, COUNT(*) FROM documents GROUP BY moderationStatus;
SELECT * FROM subjects;
```

Gõ `exit` để thoát. Nếu tên cột báo sai, xem tên đúng ở `backend/prisma/schema.prisma`.

**Xem bằng phần mềm ngoài** (DBeaver, MySQL Workbench, HeidiSQL): host `127.0.0.1`, cổng `3307`, database `studymind`, người dùng `studymind`, mật khẩu là `MYSQL_PASSWORD`.

**Seed nạp những gì, sửa ở đâu**

| Lệnh (chạy trong `backend/`) | Tác dụng | File |
|---|---|---|
| `npm run db:seed` | Tạo các môn học và tài khoản quản trị đầu tiên; chạy lại không tạo trùng | `src/scripts/seed.ts` |
| `npm run db:seed:demo` | Xóa dữ liệu mẫu cũ rồi nạp lại 6 sinh viên, 18 tài liệu, đánh giá, bình luận, báo cáo | `src/scripts/seed-demo.ts` |
| `npm run db:seed:demo -- --clear` | Chỉ xóa dữ liệu mẫu, không nạp lại | `src/scripts/seed-demo.ts` |

Muốn đổi nội dung mẫu (tên sinh viên, tiêu đề tài liệu…) thì sửa trong hai file trên rồi chạy lại lệnh. Dữ liệu mẫu nhận ra được nhờ email đuôi `@demo.studymind.local`.

Các bảng chính: `users`, `subjects`, `documents`, `document_subjects`, `comments`, `ratings`, `favorites`, `downloads`, `reports`, `notifications`, `admin_logs`, `refresh_tokens`, `password_reset_tokens`.

### 1.5. File cần chuẩn bị

- Một file PDF thật, dưới 20 MB (dùng cho `TL-01`).
- Một file không phải PDF, ví dụ ảnh `.png` đổi đuôi thành `.pdf` (dùng cho `TL-03`).
- Một file PDF trên 20 MB nếu có (dùng cho `TL-04`).

### 1.6. Mẹo khi test

- Cần hai người dùng cùng lúc thì mở một cửa sổ thường và một cửa sổ ẩn danh.
- Thư đặt lại mật khẩu: khi chưa cấu hình SMTP, thư được in ra cửa sổ terminal đang chạy backend.
- Nhiều thao tác có giới hạn số lần (mục 9). Bị chặn giữa chừng thì khởi động lại backend để đặt lại bộ đếm.
- Phần AI (tìm ngữ nghĩa, Hỏi đáp, Tóm tắt, Ôn tập) chưa nối, xem mục 10.

## 2. Test tự động

```bash
cd backend
npm test
```

Kết quả mong đợi: 3 file, 55 test đều qua (`auth`, `documents`, `admin`). Test chạy trên database riêng `studymind_test`, không đụng dữ liệu đang dùng.

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd admin
npm run lint
npm run build
```

Kết quả mong đợi: build không lỗi; lint chỉ còn một cảnh báo có sẵn ở `src/lib/auth.tsx`.

Mỗi lần push, GitHub Actions chạy lại đúng các bước trên (4 job: backend, frontend, admin, ai-service).

## 3. Tài khoản và phiên đăng nhập (trang sinh viên)

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| TK-01 | Vào `/register`, nhập họ tên, email mới, mật khẩu từ 8 ký tự, bấm **Tạo tài khoản** | Về trang chủ, thanh đầu trang có chuông thông báo, mục "Của tôi" và nút **Đăng xuất** |
| TK-02 | Đăng ký lại bằng đúng email vừa dùng | Báo "Email này đã được đăng ký" |
| TK-03 | Đăng ký với mật khẩu 5 ký tự | Không gửi được, báo mật khẩu tối thiểu 8 ký tự |
| TK-04 | Đăng xuất, vào `/login`, đăng nhập đúng email và mật khẩu | Đăng nhập được |
| TK-05 | Đăng nhập sai mật khẩu | Báo "Email hoặc mật khẩu không đúng" (không nói rõ sai cái nào) |
| TK-06 | Đang đăng nhập, bấm F5 | Vẫn đăng nhập, không bị nháy về nút "Đăng nhập" |
| TK-07 | Mở thêm một tab cùng trang, thao tác ở cả hai tab vài phút | Không tab nào bị đăng xuất |
| TK-08 | Vào `/account`, sửa họ tên, trường, ngành, bấm **Lưu hồ sơ** | Báo "Đã lưu hồ sơ."; tên trên thanh đầu trang đổi theo |
| TK-09 | Ở `/account`, đổi mật khẩu với mật khẩu hiện tại sai | Báo "Mật khẩu hiện tại không đúng" |
| TK-10 | Đổi mật khẩu đúng, rồi đăng xuất và đăng nhập bằng mật khẩu mới | Đăng nhập được bằng mật khẩu mới, mật khẩu cũ không dùng được |
| TK-11 | Đăng nhập cùng tài khoản ở cửa sổ ẩn danh, quay lại cửa sổ thường dùng mục **Đăng xuất mọi thiết bị** ở `/account` | Cửa sổ ẩn danh bị đăng xuất khi thao tác tiếp |
| TK-12 | Chưa đăng nhập, vào thẳng `/me`, `/upload`, `/account` | Được đưa về trang đăng nhập hoặc thấy lời nhắc đăng nhập, không lộ dữ liệu |

### Quên mật khẩu

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| QM-01 | Ở `/login` bấm **Quên mật khẩu?**, nhập email đã đăng ký, bấm **Gửi liên kết** | Trang báo đã gửi; terminal backend in ra thư có liên kết `…/reset-password#<mã>` |
| QM-02 | Nhập một email chưa từng đăng ký | Trang báo y hệt `QM-01`; terminal không in thư nào |
| QM-03 | Mở liên kết ở `QM-01`, nhập mật khẩu mới, bấm **Đặt mật khẩu mới** | Báo thành công; đăng nhập được bằng mật khẩu mới; chuông có thông báo mật khẩu vừa được đặt lại |
| QM-04 | Mở lại đúng liên kết đó lần thứ hai | Báo liên kết không hợp lệ hoặc đã hết hạn |
| QM-05 | Yêu cầu quên mật khẩu 4 lần liên tiếp cho cùng một email | Chỉ 3 thư đầu được in ra (mỗi tài khoản tối đa 3 thư mỗi giờ) |

## 4. Thư viện và tìm kiếm

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| TV-01 | Mở trang chủ khi chưa đăng nhập | Khung "Mới đăng" có 5 tài liệu, mục "Đang được tải nhiều" có 4 thẻ, dải tên môn học chạy ngang |
| TV-02 | Ở trang chủ gõ `SQL` vào ô tìm, bấm **Tìm** | Sang `/documents?q=SQL`, ra 1 tài liệu "Đề cương ôn tập SQL…" |
| TV-03 | Ở trang chủ bấm một môn trong dòng "Môn có sẵn" | Sang thư viện, môn đó đang được chọn, chỉ hiện tài liệu của môn đó |
| TV-04 | Vào `/documents` | Hiện "14 tài liệu", 12 thẻ trang đầu, có phân trang "Trang 1/2" |
| TV-05 | Bấm **Sau →** rồi **← Trước** | Sang trang 2 (2 thẻ) rồi quay lại trang 1 |
| TV-06 | Chọn lần lượt bộ lọc trường, ngành, đánh giá | Số tài liệu giảm đúng theo bộ lọc; địa chỉ trang đổi theo để chia sẻ được |
| TV-07 | Bấm **Xóa bộ lọc** | Trở lại 14 tài liệu |
| TV-08 | Đổi sắp xếp **Mới nhất** / **Tải nhiều** | Thứ tự thẻ đổi; "Tải nhiều" đưa tài liệu có lượt tải cao lên đầu |
| TV-09 | Tìm một từ không có, ví dụ `zzzzzz` | Hiện khung trống với gợi ý thử từ khóa khác |
| TV-10 | Tìm không dấu, ví dụ `chuan hoa` | Ghi lại kết quả thực tế (có ra "chuẩn hóa" hay không) |
| TV-11 | Bấm tên người đăng ở trang chi tiết tài liệu | Sang `/users/<id>`: tên, trường, ngành, số tài liệu, lượt tải và các tài liệu đã duyệt của người đó; không hiện email |

## 5. Tài liệu

### 5.1. Xem, tải, lưu, đánh giá

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| XT-01 | Chưa đăng nhập, mở một tài liệu | Xem được PDF ngay trên trang; nút tải ghi **Đăng nhập để tải xuống** |
| XT-02 | Trong khung PDF bấm trang sau/trước, gõ số trang, phóng to/thu nhỏ | Trang và tỉ lệ đổi đúng |
| XT-03 | Đăng nhập, bấm **Tải xuống** | Trình duyệt tải file PDF về; số lượt tải tăng 1 |
| XT-04 | Bấm **Lưu lại** | Nút đổi thành "♥ Đã lưu"; tài liệu xuất hiện ở `/me`, tab **Đã lưu** |
| XT-05 | Bấm lại nút đó | Bỏ lưu; tài liệu biến khỏi tab **Đã lưu** |
| XT-06 | Bấm 4 sao ở "Đánh giá của bạn", rồi đổi thành 5 sao | Hiện "Bạn đã chấm 5/5"; điểm trung bình cập nhật; số lượt đánh giá chỉ tăng 1 |
| XT-07 | Đăng nhập bằng chính người đăng, mở tài liệu của mình | Không tự chấm sao được |
| XT-08 | Mở `/documents/999999` | Báo không tìm thấy tài liệu |

### 5.2. Đăng tài liệu

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| TL-01 | Vào `/upload`, chọn file PDF hợp lệ, nhập tiêu đề, chọn môn, bấm **Gửi duyệt** | Báo "Đã gửi, đang chờ duyệt"; trường và ngành được điền sẵn từ hồ sơ |
| TL-02 | Vào `/me`, tab **Đã đăng** | Tài liệu vừa đăng có nhãn "Chờ duyệt"; chưa xuất hiện trong thư viện; người khác mở địa chỉ tài liệu thì báo không tìm thấy |
| TL-03 | Đăng file không phải PDF (ảnh đổi đuôi) | Báo "File không phải PDF hợp lệ" |
| TL-04 | Đăng file PDF trên 20 MB | Bị từ chối vì quá dung lượng |
| TL-05 | Đăng với tiêu đề 2 ký tự | Báo "Tiêu đề quá ngắn" |
| TL-06 | Đăng một PDF có chứa email hoặc số điện thoại | Sau khi gửi, trang cảnh báo có thể chứa thông tin cá nhân (kèm số trang) |

### 5.3. Sửa và xóa tài liệu của mình

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| ST-01 | Ở `/me` bấm sửa một tài liệu của mình, đổi tiêu đề và mô tả, bấm **Lưu thay đổi** | Thông tin mới hiện ở trang chi tiết |
| ST-02 | Sửa một tài liệu đang "Bị từ chối" rồi lưu | Tài liệu chuyển về "Chờ duyệt", lý do từ chối cũ biến mất |
| ST-03 | Đăng nhập người khác, mở `/documents/<id của người khác>/edit` | Không sửa được (báo không có quyền) |
| ST-04 | Ở `/me` bấm **Xóa** một tài liệu, xác nhận **Xóa hẳn?** | Tài liệu biến khỏi danh sách và thư viện |

## 6. Bình luận, báo cáo, thông báo

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| BL-01 | Đăng nhập sinh viên B, mở một tài liệu của sinh viên A, viết bình luận, bấm **Gửi bình luận** | Bình luận hiện ngay, số trong "Bình luận (n)" tăng 1 |
| BL-02 | Đăng nhập sinh viên A | Chuông có chấm đỏ; mở ra thấy "… đã bình luận về tài liệu …"; bấm vào thì số chưa đọc về 0 |
| BL-03 | Gửi bình luận trống | Không gửi được |
| BL-04 | Sinh viên B xóa bình luận của chính mình | Bình luận biến mất |
| BL-05 | Sinh viên B thử xóa bình luận của người khác | Không có nút xóa |
| BC-01 | Sinh viên B mở tài liệu của A, bấm **Báo cáo vi phạm**, nhập lý do từ 10 ký tự, gửi | Báo đã gửi báo cáo |
| BC-02 | Gửi báo cáo lần hai cho cùng tài liệu | Báo "Bạn đã báo cáo tài liệu này, quản trị viên đang xem xét" |
| BC-03 | Nhập lý do 5 ký tự | Báo "Hãy mô tả rõ hơn (ít nhất 10 ký tự)" |
| BC-04 | Sinh viên A mở tài liệu của chính mình | Không tự báo cáo được |

## 7. Trang quản trị

### 7.1. Đăng nhập và tổng quan

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| QT-01 | Vào http://localhost:5174, đăng nhập bằng tài khoản quản trị | Vào trang **Tổng quan** |
| QT-02 | Đăng nhập trang quản trị bằng tài khoản sinh viên | Bị từ chối |
| QT-03 | Xem trang **Tổng quan** | 4 ô số liệu (chờ duyệt, đã duyệt, người dùng, lượt tải), 2 biểu đồ 7 ngày, bảng tài liệu nổi bật và người đăng tích cực; số khớp với dữ liệu mẫu (2 chờ duyệt, 14 đã duyệt) |
| QT-04 | Xem thanh bên | Mục **Kiểm duyệt** và **Báo cáo** có số đếm việc đang chờ |

### 7.2. Kiểm duyệt

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| KD-01 | Vào **Kiểm duyệt**, tab **Chờ duyệt**, bấm **Xem PDF** | Mở được file để đọc trước khi quyết định |
| KD-02 | Bấm **Duyệt** một tài liệu | Tài liệu sang tab **Đã duyệt**, xuất hiện trong thư viện; người đăng nhận thông báo |
| KD-03 | Bấm **Từ chối** nhưng để trống lý do | Báo "Cần ghi lý do khi từ chối" |
| KD-04 | Từ chối kèm lý do | Tài liệu sang tab **Bị từ chối**; người đăng thấy lý do ở `/me` và nhận thông báo |
| KD-05 | Mở tài liệu mẫu "React Hooks…" ở tab **Chờ duyệt** | Có cảnh báo "Có thể chứa thông tin cá nhân" kèm email và số điện thoại đã che bớt |
| KD-06 | Ở tab **Đã duyệt**, gỡ một tài liệu kèm lý do | Tài liệu biến khỏi thư viện; người đăng nhận thông báo |

### 7.3. Báo cáo vi phạm

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| BX-01 | Vào **Báo cáo**, tab **Chờ xử lý** | Thấy 2 báo cáo mẫu (và báo cáo ở `BC-01` nếu đã làm) |
| BX-02 | Bấm **Bỏ qua** một báo cáo | Báo cáo sang tab **Đã bỏ qua**; tài liệu vẫn còn; người báo cáo nhận thông báo đã được xem xét |
| BX-03 | Bấm **Gỡ** nhưng để trống lý do | Báo "Cần ghi lý do khi gỡ tài liệu" |
| BX-04 | Gỡ kèm lý do | Báo cáo sang tab **Đã gỡ**; tài liệu biến khỏi thư viện; người đăng và người báo cáo đều nhận thông báo |
| BX-05 | Xử lý lại một báo cáo đã xử lý (mở sẵn ở hai tab, xử lý ở tab này rồi bấm ở tab kia) | Báo "Báo cáo này đã được xử lý" |

### 7.4. Người dùng

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| ND-01 | Vào **Người dùng**, gõ tên hoặc email vào ô tìm | Danh sách lọc theo từ khóa |
| ND-02 | Bấm **Khóa** một sinh viên | Hàng đó có nhãn "Đã khóa"; sinh viên đó đang đăng nhập bị văng ra khi thao tác tiếp và không đăng nhập lại được ("Tài khoản đã bị khóa") |
| ND-03 | Bấm **Mở khóa** | Sinh viên đăng nhập lại được |
| ND-04 | Bấm **Cấp quyền quản trị** cho một sinh viên | Vai trò đổi thành "Quản trị"; người đó đăng nhập được trang quản trị. Người đó đang đăng nhập trang sinh viên thì không bị đăng xuất |
| ND-05 | Bấm **Bỏ quyền quản trị** | Vai trò về "Sinh viên" |
| ND-06 | Tìm chính tài khoản quản trị đang dùng | Hàng có nhãn "Bạn", không có nút khóa hay đổi quyền |

### 7.5. Môn học

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| MH-01 | Vào **Môn học**, nhập tên môn mới, bấm **+ Thêm** | Môn mới hiện trong bảng, có mã tự sinh; xuất hiện trong bộ lọc ở trang sinh viên |
| MH-02 | Thêm lại đúng tên đó | Báo "Môn học này đã có" |
| MH-03 | Bấm **Đổi tên** một môn | Tên mới hiện ở cả hai trang |
| MH-04 | Bấm **Xóa** một môn đang có tài liệu | Môn biến mất; tài liệu của môn đó vẫn còn, chỉ mất nhãn môn |

### 7.6. Nhật ký và tài khoản quản trị

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| NK-01 | Vào **Nhật ký** sau khi làm các bước trên | Mỗi thao tác (đăng nhập, duyệt, từ chối, khóa, đổi vai trò, thêm/sửa/xóa môn, xử lý báo cáo) có một dòng: thời gian, ai làm, làm gì |
| NK-02 | Tìm nút sửa hoặc xóa nhật ký | Không có: nhật ký chỉ ghi thêm |
| NK-03 | Vào **Tài khoản**, đổi mật khẩu quản trị | Đổi được; mật khẩu mới phải khác mật khẩu cũ |

## 8. Giao diện

| Mã | Các bước | Kết quả mong đợi |
|---|---|---|
| GD-01 | Bấm nút đổi giao diện sáng/tối (cả hai trang) | Màu đổi kiểu quét từ trên xuống; chữ trên nền vàng, cam vẫn đọc được; F5 vẫn giữ lựa chọn |
| GD-02 | Bấm **EN** rồi **VI** | Toàn bộ nhãn, nút, thông báo lỗi và tên môn học đổi ngôn ngữ; không sót chuỗi tiếng Việt khi ở EN |
| GD-03 | Thu hẹp cửa sổ xuống cỡ điện thoại (khoảng 375px) | Không có thanh cuộn ngang; lưới thẻ về một cột; nút đổi giao diện và ngôn ngữ chuyển xuống chân trang |
| GD-04 | Cuộn trang chủ và thư viện | Vạch cam dưới thanh đầu trang dài dần; nút ↑ hiện ra khi cuộn xa và đưa về đầu trang |
| GD-05 | Rê chuột lên thẻ tài liệu và các nút | Thẻ nhấc lên, góc giấy mở ra; nút có vệt sáng lướt qua và lún xuống khi bấm |
| GD-06 | Bật "giảm chuyển động" trong hệ điều hành rồi tải lại | Các hiệu ứng tắt, trang vẫn dùng bình thường |
| GD-07 | Mở một địa chỉ không tồn tại, ví dụ `/abc` | Trang 404 có nút về trang chủ |

## 9. Giới hạn chống lạm dụng

Chỉ cần thử một hai mục để thấy cơ chế hoạt động. Thử xong khởi động lại backend.

| Mã | Thao tác | Giới hạn | Kết quả khi vượt |
|---|---|---|---|
| GH-01 | Đăng nhập sai liên tục | 10 lần / 15 phút | "Thử quá nhiều lần, vui lòng đợi 15 phút." |
| GH-02 | Đăng ký tài khoản | 5 lần / giờ | "Bạn tạo quá nhiều tài khoản, thử lại sau một giờ." |
| GH-03 | Yêu cầu quên mật khẩu | 5 lần / giờ mỗi IP | "Bạn yêu cầu quá nhiều lần, thử lại sau một giờ." |
| GH-04 | Đăng tài liệu | 10 lần / giờ | "Bạn đăng quá nhiều tài liệu, thử lại sau một giờ." |
| GH-05 | Bình luận | 20 lần / 10 phút | "Bạn bình luận quá nhanh, thử lại sau ít phút." |
| GH-06 | Báo cáo vi phạm | 10 lần / giờ | "Bạn gửi quá nhiều báo cáo, thử lại sau một giờ." |

## 10. Phần chưa có (đừng tính là lỗi)

| Chỗ trên giao diện | Hiện tại |
|---|---|
| Nút **Ngữ nghĩa** ở thư viện | Chưa nối AI service; chỉ tìm theo từ khóa hoạt động |
| Tab **Hỏi đáp**, **Tóm tắt**, **Ôn tập** ở trang tài liệu | Hiện dòng "Chức năng … sẽ có khi kết nối AI service." |

Kế hoạch cho phần này nằm ở [12-10-2026-ke-hoach-ai.md](12-10-2026-ke-hoach-ai.md). Khi làm xong cần bổ sung kịch bản vào file này.

## 11. Bản đóng gói bằng Docker (tùy chọn)

```bash
docker compose --profile app up -d --build
```

Sau khi các container báo khỏe, lặp lại nhanh `TK-04`, `TV-04`, `XT-01`, `QT-01` trên địa chỉ của bản đóng gói (xem [12-10-2026-dong-goi-trien-khai.md](12-10-2026-dong-goi-trien-khai.md)) để chắc bản build chạy giống bản dev.

## 12. Dọn dẹp sau khi test

```bash
cd backend
npm run db:seed:demo
```

Lệnh này đưa dữ liệu mẫu về ban đầu. Tài khoản tự đăng ký ở `TK-01`, môn học thêm ở `MH-01` và các dòng nhật ký không thuộc dữ liệu mẫu nên vẫn còn; xóa tay trong trang quản trị hoặc `npm run db:studio` nếu cần.

## 13. Bảng ghi kết quả

Chép bảng này ra mỗi lần test, ghi Đạt / Lỗi và mô tả ngắn nếu lỗi.

| Nhóm | Mã | Kết quả | Ghi chú |
|---|---|---|---|
| Test tự động | backend, frontend, admin | | |
| Tài khoản | TK-01 → TK-12 | | |
| Quên mật khẩu | QM-01 → QM-05 | | |
| Thư viện | TV-01 → TV-11 | | |
| Xem, tải, lưu, đánh giá | XT-01 → XT-08 | | |
| Đăng tài liệu | TL-01 → TL-06 | | |
| Sửa, xóa tài liệu | ST-01 → ST-04 | | |
| Bình luận | BL-01 → BL-05 | | |
| Báo cáo | BC-01 → BC-04 | | |
| Quản trị: tổng quan | QT-01 → QT-04 | | |
| Quản trị: kiểm duyệt | KD-01 → KD-06 | | |
| Quản trị: báo cáo | BX-01 → BX-05 | | |
| Quản trị: người dùng | ND-01 → ND-06 | | |
| Quản trị: môn học | MH-01 → MH-04 | | |
| Quản trị: nhật ký | NK-01 → NK-03 | | |
| Giao diện | GD-01 → GD-07 | | |
| Giới hạn | GH-01 → GH-06 | | |

## Ghi chú về độ tin cậy của file này

Kết quả mong đợi được viết từ mã nguồn và từ những lần đã chạy thử trước đó, chưa chạy lại từng dòng theo đúng file này. Những dòng đã từng thử tay trên trình duyệt: `TK-01`, `TV-01`, `TV-02`, `TV-04`, `XT-02`, `XT-04`, `XT-06`, `BL-01`, `QT-01`, `QT-03`. Các dòng còn lại nếu kết quả thực tế khác mô tả thì có thể là lỗi của ứng dụng, cũng có thể là mô tả ở đây chưa đúng câu chữ trên giao diện; ghi lại ở bảng trên để đối chiếu.
