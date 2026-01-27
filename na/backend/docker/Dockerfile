FROM python:3.12-slim

WORKDIR /app


COPY backend/api/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy application code
COPY backend/api/ .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

