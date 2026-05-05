#!/usr/bin/env bash
set -euo pipefail

branch="${DEPLOY_TARGET_BRANCH:-${GITHUB_REF_NAME:-$(git branch --show-current)}}"
workspace="${GITHUB_WORKSPACE:-$(pwd)}"
compose_file="deploy/home-server/docker-compose.server.yml"

case "$branch" in
  dev)
    deploy_dir="/home/froztbitez/web-server/omnia/dev"
    compose_project="omnia-dev"
    backend_image="ghcr.io/sebastianaben/omnia-backend-api:dev"
    health_url="http://127.0.0.1:4101/api/v1/health"
    ;;
  main)
    deploy_dir="/home/froztbitez/web-server/omnia/main"
    compose_project="omnia-main"
    backend_image="ghcr.io/sebastianaben/omnia-backend-api:main"
    health_url="http://127.0.0.1:4100/api/v1/health"
    ;;
  *)
    echo "Unsupported deployment branch: $branch" >&2
    exit 1
    ;;
esac

mkdir -p "$deploy_dir"
mkdir -p "$deploy_dir/deploy/home-server"
cp "$workspace/$compose_file" "$deploy_dir/$compose_file"

cd "$deploy_dir"

if [[ ! -f .env.server ]]; then
  cat >&2 <<EOF
Missing $deploy_dir/.env.server.
Create it from deploy/home-server/.env.server.example and set environment-specific secrets.
Expected project: $compose_project
Expected health URL: $health_url
EOF
  exit 1
fi

configured_image="$(grep -E '^BACKEND_IMAGE=' .env.server | tail -1 | cut -d '=' -f 2- || true)"
if [[ "$configured_image" != "$backend_image" ]]; then
  cat >&2 <<EOF
Unexpected BACKEND_IMAGE in $deploy_dir/.env.server.
Expected: $backend_image
Actual:   ${configured_image:-<empty>}
EOF
  exit 1
fi

compose=(docker compose --env-file .env.server -p "$compose_project" -f "$compose_file")

"${compose[@]}" pull backend migrate
"${compose[@]}" up -d postgres redis
"${compose[@]}" run --rm migrate
"${compose[@]}" up -d backend

for attempt in {1..30}; do
  if curl --fail --silent --show-error "$health_url" >/dev/null; then
    echo "Deployment health check passed: $health_url"
    exit 0
  fi

  echo "Waiting for backend health check ($attempt/30): $health_url"
  sleep 2
done

echo "Deployment health check failed: $health_url" >&2
"${compose[@]}" ps
exit 1
