#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./upload_model.sh <bucket-name> <model-file-path> [key]
#
# Example:
#   ./upload_model.sh blind-nav-models-123456789012 ../yolo12n.pt yolo12n.pt

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <bucket-name> <model-file-path> [key]"
  exit 1
fi

BUCKET="$1"
MODEL_PATH="$2"
KEY="${3:-$(basename "$MODEL_PATH")}"

echo "Uploading model '$MODEL_PATH' to s3://$BUCKET/$KEY ..."
aws s3 cp "$MODEL_PATH" "s3://$BUCKET/$KEY"
echo "Done."

