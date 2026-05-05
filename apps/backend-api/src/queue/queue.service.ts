import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

import { appConfig } from "../config/app.config";

export const SYNC_QUEUE_NAME = "omnia.sync";

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly connection: IORedis;
  readonly syncQueue: Queue;

  constructor(@Inject(appConfig.KEY) config: ConfigType<typeof appConfig>) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });
    this.syncQueue = new Queue(SYNC_QUEUE_NAME, {
      connection: this.connection,
    });
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

  async onModuleDestroy(): Promise<void> {
    await this.syncQueue.close();
    await this.connection.quit();
  }
}
