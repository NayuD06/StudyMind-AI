# Phần chung của hai server trong nginx.conf

location /api/ {
  proxy_pass http://backend:4000;
  proxy_set_header Host $host;
  # Backend đặt TRUST_PROXY=1 để đọc IP thật từ đây (dùng cho giới hạn tần suất)
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto $scheme;
  # Hỏi đáp AI có thể trả lời chậm
  proxy_read_timeout 120s;
}

# File có mã băm trong tên nên giữ lâu được; index.html thì luôn hỏi lại để nhận bản mới
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
  try_files $uri =404;
}

location / {
  add_header Cache-Control "no-cache";
  add_header X-Content-Type-Options "nosniff";
  add_header X-Frame-Options "DENY";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  try_files $uri /index.html;
}
