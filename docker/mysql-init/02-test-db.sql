-- Database riêng cho bộ test tự động của backend (npm test), tách hẳn khỏi dữ liệu thật.
CREATE DATABASE IF NOT EXISTS studymind_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON studymind_test.* TO 'studymind'@'%';
