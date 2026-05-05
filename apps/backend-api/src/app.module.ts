import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { BranchesModule } from "./branches/branches.module";
import { CategoriesModule } from "./categories/categories.module";
import { validateEnvironment } from "./config/env.validation";
import { appConfig } from "./config/app.config";
import { DashboardModule } from "./dashboard/dashboard.module";
import { HealthModule } from "./health/health.module";
import { ShopeeModule } from "./integrations/shopee/shopee.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MonitoringModule } from "./monitoring/monitoring.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductsModule } from "./products/products.module";
import { QueueModule } from "./queue/queue.module";
import { RegistersModule } from "./registers/registers.module";
import { ReportsModule } from "./reports/reports.module";
import { RolesModule } from "./roles/roles.module";
import { SyncModule } from "./sync/sync.module";
import { UsersModule } from "./users/users.module";
import { ShopeeWebhookModule } from "./webhooks/shopee/shopee-webhook.module";

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
    UsersModule,
    RolesModule,
    BranchesModule,
    RegistersModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    ShopeeModule,
    ShopeeWebhookModule,
    SyncModule,
    ReportsModule,
    DashboardModule,
    AuditModule,
    MonitoringModule,
  ],
})
export class AppModule {}
