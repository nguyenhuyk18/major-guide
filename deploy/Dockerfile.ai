# agentic-ai (FastAPI) for a CPU-only server: installs the CPU build of torch first,
# so sentence-transformers does not pull ~3 GB of CUDA libraries.
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 HF_HOME=/models
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY apps ./apps
COPY ml/__init__.py ./ml/__init__.py
COPY ml/career ./ml/career
COPY ml/artifacts ./ml/artifacts
COPY career_model.pkl feature_columns.pkl questions.json ./
# Secrets come from docker compose, never from a baked-in file.
RUN rm -f apps/.env
EXPOSE 8000
CMD ["uvicorn", "apps.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
