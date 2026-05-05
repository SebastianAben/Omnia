import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { BranchesModule } from "./branches/branches.module";
import { validateEnvironment } from "./config/env.validation";
import { appConfig } from "./config/app.config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { QueueModule } from "./queue/queue.module";
import { SyncModule } from "./sync/sync.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      load: [appConfig],
    }),
    PrismaModule,
    QueueModule,
    HealthModule,
    AuthModule,
    BranchesModule,
    ProductsModule,
    SyncModule,
  ],
})
export class AppModule {}
