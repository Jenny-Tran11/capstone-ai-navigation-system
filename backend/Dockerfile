# Vision service (GPU). Build: docker build -t vision-service -f backend/Dockerfile backend/
# Default yolo12n.pt is downloaded at build time (requires network). Use a custom checkpoint by
# mounting over MODEL_PATH or configuring S3 (MODEL_BUCKET / MODEL_KEY).
#
# CPU smoke test:
#   docker build --build-arg BASE_IMAGE=python:3.11-slim-bookworm --build-arg INSTALL_CPU_TORCH=true \
#     -t vision-service-cpu -f backend/Dockerfile backend/

ARG BASE_IMAGE=pytorch/pytorch:2.10.0-cuda12.6-cudnn9-runtime

FROM ${BASE_IMAGE}

WORKDIR /app

ARG INSTALL_CPU_TORCH=false
RUN if [ "$INSTALL_CPU_TORCH" = "true" ]; then \
      pip install --no-cache-dir \
        torch==2.10.0 torchvision==0.25.0 \
        --index-url https://download.pytorch.org/whl/cpu; \
    fi

COPY requirements-container.txt .
RUN pip install --no-cache-dir -r requirements-container.txt

RUN mkdir -p /opt/ml/model \
    && python -c "from ultralytics import YOLO; YOLO('yolo12n.pt')" \
    && if [ ! -f /opt/ml/model/yolo12n.pt ]; then \
         f="$(find /app /root -name yolo12n.pt -type f 2>/dev/null | head -1)"; \
         test -n "$f" && cp "$f" /opt/ml/model/yolo12n.pt; \
       fi \
    && test -f /opt/ml/model/yolo12n.pt

RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /opt/ml/model /app

COPY --chown=appuser:appuser server.py vision_service.py config.py ./

ENV MODEL_PATH=/opt/ml/model/yolo12n.pt
ENV LOG_LEVEL=INFO

USER appuser
EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
