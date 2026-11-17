# Stage 1: build the React app
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI serving the API and the built UI
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ ./backend/
COPY --from=frontend /frontend/dist ./frontend/dist
WORKDIR /app/backend
ENV FRONTEND_DIST=/app/frontend/dist
EXPOSE 8000
CMD ["sh", "-c", "if [ \"$SEED_ON_START\" = \"true\" ]; then python -m app.seed.run_all; fi; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
