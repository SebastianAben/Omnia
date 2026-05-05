import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

import { appConfig } from "../config/app.config";

export const SYNC_QUEUE_NAME = "omnia.sync";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queueConnection: IORedis;
  private readonly workerConnection: IORedis;
  readonly syncQueue: Queue;
  private readonly syncWorker: Worker;

  constructor(@Inject(appConfig.KEY) config: ConfigType<typeof appConfig>) {
    this.queueConnection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.workerConnection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.syncQueue = new Queue(SYNC_QUEUE_NAME, {
      connection: this.queueConnection,
    });
    this.syncWorker = new Worker(
      SYNC_QUEUE_NAME,
      async (job) => ({
        job_id: job.id,
        name: job.name,
        accepted_at: new Date().toISOString(),
      }),
      {
        connection: this.workerConnection,
        concurrency: 2,
      },
    );
  }

  async enqueueSyncEvent(
    eventId: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const job = await this.syncQueue.add("sync.event.received", payload, {
      jobId: eventId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    return job.id ?? eventId;
  }

  async enqueueSyncBundle(
    eventId: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const jobId = `bundle-${eventId}`;
    const job = await this.syncQueue.add("sync.bundle.received", payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1_000,
      },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1_000 },
    });

    return job.id ?? jobId;
  }

  async onModuleDestroy(): Promise<void> {
    await this.syncWorker.close();
    await this.syncQueue.close();
    await this.workerConnection.quit();
    await this.queueConnection.quit();
  }
}
