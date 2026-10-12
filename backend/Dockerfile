# Backend StudyMind AI. Build: docker compose --profile app up -d --build
FROM node:24-slim

# Prisma cần OpenSSL để nối MySQL
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài thư viện trước, mã nguồn sau: sửa code không phải tải lại node_modules.
# Giữ cả devDependencies vì cần prisma (áp migration) và tsx (lệnh db:seed).
COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Không chạy bằng root; thư mục PDF phải ghi được bởi tài khoản node
RUN mkdir -p /data/uploads && chown -R node:node /data/uploads
USER node

ENV NODE_ENV=production PORT=4000 UPLOAD_DIR=/data/uploads
EXPOSE 4000

# Áp các migration còn thiếu rồi mới mở cổng
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
