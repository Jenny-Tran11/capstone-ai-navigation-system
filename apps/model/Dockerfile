FROM python:3.12-slim

# Non-root user for security
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# System libs for OpenCV; curl for docker-compose healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libglib2.0-0 libsm6 libxrender1 libxext6 libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install deps, then force headless OpenCV last so `import cv2` always works (ultralytics may pull opencv-python).
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir --force-reinstall "opencv-python-headless>=4.10.0" \
    && python -c "import cv2; print('opencv', cv2.__version__)"

COPY src/ ./src/

# weights/ is bind-mounted at runtime — not baked into the image
RUN mkdir -p weights && chown -R app:app /app

USER app

EXPOSE 8080

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8080"]
