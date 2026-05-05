import { Inject, Injectable } from "@nestjs/common";

import { QueueService } from "../queue/queue.service";
import { SyncEventDto } from "./sync.dto";

@Injectable()
export class SyncService {
  constructor(
    @Inject(QueueService) private readonly queueService: QueueService,
  ) {}

  async receiveEvent(dto: SyncEventDto, idempotencyKey?: string) {
    const idempotencyKeyValue = idempotencyKey ?? dto.event_id;
    const queueJobId = await this.queueService.enqueueSyncEvent(
      idempotencyKeyValue,
      {
        ...dto,
        idempotency_key: idempotencyKeyValue,
      },
    );

    return {
      success: true,
      data: {
        event_id: dto.event_id,
        status: "received",
        idempotency_key: idempotencyKeyValue,
        queue_job_id: queueJobId,
      },
    };
  }
}
