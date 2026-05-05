#!/usr/bin/env bash
set -euo pipefail

runner_dir="${RUNNER_DIR:-/home/froztbitez/actions-runner-omnia}"
repo_url="${REPO_URL:-https://github.com/SebastianAben/Omnia}"
runner_name="${RUNNER_NAME:-omnia-home}"
runner_labels="${RUNNER_LABELS:-omnia-home}"
runner_version="${RUNNER_VERSION:-}"

if [[ -z "${RUNNER_TOKEN:-}" ]]; then
  echo "RUNNER_TOKEN is required. Create a repo runner token from GitHub Settings > Actions > Runners." >&2
  exit 1
fi

if [[ -f "$runner_dir/.runner" ]]; then
  echo "Runner is already configured at $runner_dir" >&2
  exit 1
fi

mkdir -p "$runner_dir"
cd "$runner_dir"

if [[ -z "$runner_version" ]]; then
  runner_version="$(
    curl --fail --silent --show-error https://api.github.com/repos/actions/runner/releases/latest |
      sed -nE 's/.*"tag_name": "v([^"]+)".*/\1/p' |
      head -1
  )"
fi

if [[ -z "$runner_version" ]]; then
  echo "Unable to resolve GitHub Actions runner version." >&2
  exit 1
fi

archive="actions-runner-linux-x64-${runner_version}.tar.gz"
download_url="https://github.com/actions/runner/releases/download/v${runner_version}/${archive}"

if [[ ! -f config.sh ]]; then
  curl --fail --location --output "$archive" "$download_url"
  tar xzf "$archive"
  rm "$archive"
fi

./config.sh \
  --url "$repo_url" \
  --token "$RUNNER_TOKEN" \
  --name "$runner_name" \
  --labels "$runner_labels" \
  --work "_work" \
  --unattended \
  --replace

sudo ./svc.sh install "$USER"
sudo ./svc.sh start

systemctl status "actions.runner.SebastianAben-Omnia.${runner_name}.service" --no-pager
