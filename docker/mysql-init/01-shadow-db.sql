-- Prisma "migrate dev" cần một database phụ để so sánh lược đồ.
-- Tạo sẵn ở đây để tài khoản studymind không cần quyền tạo database trên toàn máy chủ.
CREATE DATABASE IF NOT EXISTS studymind_shadow;
GRANT ALL PRIVILEGES ON studymind_shadow.* TO 'studymind'@'%';
