import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AiController } from "./ai.controller";
import { AiService, GeminiLlmClient, LLM_CLIENT } from "./ai.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiLlmClient,
    { provide: LLM_CLIENT, useExisting: GeminiLlmClient },
  ],
})
export class AiModule {}
