# Một image nginx phục vụ cả trang sinh viên (cổng 80) và trang quản trị (cổng 81).
# Context là thư mục gốc dự án: docker compose --profile app up -d --build
FROM node:24-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:24-slim AS admin
WORKDIR /build
COPY admin/package.json admin/package-lock.json ./
RUN npm ci
COPY admin ./
RUN npm run build

FROM nginx:1.29-alpine
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/web/app.inc /etc/nginx/conf.d/app.inc
COPY --from=frontend /build/dist /srv/frontend
COPY --from=admin /build/dist /srv/admin
EXPOSE 80 81
