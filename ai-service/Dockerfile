FROM python:3.12-slim

WORKDIR /code

# Cài PyTorch bản CPU trước để tránh kéo bản CUDA nặng vài GB
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
