FROM public.ecr.aws/lambda/python:3.11

WORKDIR /var/task

COPY requirements.txt .
# Upgrade pip for reliable wheel resolution; Lambda base has no compiler for sdist builds.
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Optional: bake the model into the image at the expected path.
# To make this work, copy your trained model (e.g. yolo12n.pt or best.pt)
# into this directory before building the image.
COPY yolo12n.pt /opt/ml/model/yolo12n.pt

COPY handler.py vision_service_lambda.py config_lambda.py ./

ENV MODEL_PATH=/opt/ml/model/yolo12n.pt

CMD ["handler.lambda_handler"]

