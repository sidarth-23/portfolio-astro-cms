#!/bin/sh
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-sidshub-media}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-${S3_ACCESS_KEY_ID:-minioadmin}}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-${S3_SECRET_ACCESS_KEY:-minioadmin}}"
MINIO_CREATE_BUCKET_ON_STARTUP="${MINIO_CREATE_BUCKET_ON_STARTUP:-true}"

if [ "$MINIO_CREATE_BUCKET_ON_STARTUP" != "true" ]; then
  echo "minio-init: bucket provisioning disabled; skipping"
  exit 0
fi

echo "minio-init: waiting for MinIO endpoint"
attempt=1
while [ "$attempt" -le 30 ]; do
  if mc alias set local "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "minio-init: unable to connect after 30 attempts" >&2
    exit 1
  fi

  echo "minio-init: connection attempt ${attempt}/30 failed; retrying in 2s"
  attempt=$((attempt + 1))
  sleep 2
done

mc mb --ignore-existing "local/${S3_BUCKET}"
mc anonymous set none "local/${S3_BUCKET}"
echo "minio-init: bucket ${S3_BUCKET} is ready and private"
