import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { QueueModule } from "../queue/queue.module";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";

@Module({
  imports: [AuthModule, QueueModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
