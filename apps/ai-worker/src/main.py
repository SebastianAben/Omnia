import os
import json
import urllib.error
import urllib.request
from dataclasses import dataclass


@dataclass(frozen=True)
class WorkerConfig:
    app_env: str
    redis_url: str
    database_url: str
    backend_url: str
    backend_token: str | None
    concurrency: int
    log_level: str


def read_config() -> WorkerConfig:
    return WorkerConfig(
        app_env=os.getenv("APP_ENV", "local"),
        redis_url=os.getenv("REDIS_URL", "redis://localhost:6379"),
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://omnia:omnia@localhost:5432/omnia",
        ),
        backend_url=os.getenv("AI_WORKER_BACKEND_URL", "http://localhost:4000/api/v1"),
        backend_token=os.getenv("AI_WORKER_BACKEND_TOKEN"),
        concurrency=int(os.getenv("AI_WORKER_CONCURRENCY", "2")),
        log_level=os.getenv("LOG_LEVEL", "info"),
    )


def fetch_insight_contract(config: WorkerConfig) -> dict[str, object]:
    if not config.backend_token:
        return {
            "status": "dry_run",
            "message": "AI_WORKER_BACKEND_TOKEN not set; backend trigger skipped.",
            "contract": {
                "insight_types": [
                    "low_stock_alert",
                    "stockout_prediction",
                    "sales_trend",
                    "fast_moving",
                    "slow_moving",
                    "data_not_ready",
                ],
                "required_fields": [
                    "insight_type",
                    "summary",
                    "confidence_score",
                    "generated_at",
                    "reference_data",
                ],
                "advisory_only": True,
            },
        }

    request = urllib.request.Request(
        f"{config.backend_url.rstrip('/')}/ai/insights",
        headers={"Authorization": f"Bearer {config.backend_token}"},
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError) as exc:
        return {
            "status": "failed",
            "message": f"Unable to reach backend AI insight API: {exc}",
        }


def main() -> None:
    config = read_config()
    print(
        "omnia ai-worker skeleton ready "
        f"(env={config.app_env}, concurrency={config.concurrency}, "
        f"log_level={config.log_level})",
    )
    print(json.dumps(fetch_insight_contract(config), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
