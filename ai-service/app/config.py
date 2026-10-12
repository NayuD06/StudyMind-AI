from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "document_chunks"
    embedding_model: str = "BAAI/bge-m3"
    anthropic_api_key: str = ""
    llm_model: str = "claude-haiku-5-5"
    # Khóa nội bộ dùng chung với backend; để trống thì mọi request bị từ chối
    internal_api_key: str = ""


settings = Settings()
