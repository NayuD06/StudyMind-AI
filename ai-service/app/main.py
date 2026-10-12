from fastapi import APIRouter, Depends, FastAPI

from app.security import require_internal_key

# Tắt trang /docs công khai; AI service chỉ phục vụ backend
app = FastAPI(title="StudyMind AI Service", docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/health")
def health():
    return {"status": "ok"}


# Mọi router nghiệp vụ gắn vào `internal` để tự động bị kiểm tra khóa nội bộ
internal = APIRouter(dependencies=[Depends(require_internal_key)])


@internal.get("/internal/ping")
def ping():
    return {"status": "ok"}


# Gắn router tại đây khi làm tới phần AI, ví dụ:
# internal.include_router(ingest.router)   # trích xuất PDF, chia đoạn, tạo embedding
# internal.include_router(search.router)   # tìm kiếm ngữ nghĩa
# internal.include_router(chat.router)     # hỏi đáp RAG, tóm tắt, tạo câu hỏi

app.include_router(internal)
