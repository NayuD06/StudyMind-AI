import secrets

from fastapi import Header, HTTPException

from app.config import settings


def require_internal_key(x_internal_key: str = Header(default="")):
    """Chỉ backend (biết INTERNAL_API_KEY) mới được gọi các API của AI service."""
    expected = settings.internal_api_key
    # compare_digest so sánh trong thời gian cố định, tránh dò khóa qua thời gian phản hồi
    if not expected or not secrets.compare_digest(x_internal_key.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Khóa nội bộ không hợp lệ")
