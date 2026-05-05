import os
from dataclasses import dataclass


@dataclass(frozen=True)
class WorkerConfig:
    app_env: str
    redis_url: str
    database_url: str
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
        concurrency=int(os.getenv("AI_WORKER_CONCURRENCY", "2")),
        log_level=os.getenv("LOG_LEVEL", "info"),
    )


def main() -> None:
    config = read_config()
    print(
        "omnia ai-worker skeleton ready "
        f"(env={config.app_env}, concurrency={config.concurrency}, "
        f"log_level={config.log_level})",
    )


if __name__ == "__main__":
    main()
