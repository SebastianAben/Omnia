# Skill Guide by Sprint

## 1. Purpose

Dokumen ini menjelaskan skill yang dipakai pada tiap sprint Omnia dan cara memakainya.

Acuan:

- `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`
- `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
- `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
- `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
- `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`

## 2. Skills Used

Skill utama yang dipakai sepanjang roadmap:

- `skill-scanner`
- `monorepo-management`
- `electron-development`
- `react-nextjs-development`
- `zustand-store-ts`
- `tanstack-query-expert`
- `nestjs-expert`
- `zod-validation-expert`
- `api-design-principles`
- `api-documentation`
- `prisma-expert`
- `postgres-best-practices`
- `docker-expert`
- `bullmq-specialist`
- `fastapi-templates`
- `testing-qa`
- `webapp-testing`

Skill opsional atau post-MVP:

- `vercel-deployment`
- `react-native-architecture`
- `expo-dev-client`

Catatan:

- `react-native-architecture` dan `expo-dev-client` tidak diprioritaskan untuk MVP karena Omnia memakai desktop app berbasis Electron, bukan mobile app.
- `vercel-deployment` hanya relevan jika nanti ada web deployment terpisah untuk demo/admin, bukan untuk POS desktop local-first.

## 3. General Rule

Pakai skill saat task benar-benar cocok dengan domainnya.

Pola pakai sederhana:

1. sebut skill yang dipakai
2. jelaskan target task
3. sebut folder/file target
4. sebut dokumen acuan
5. minta output konkret

Template prompt:

```text
Use <skill-name> untuk mengerjakan <task> pada <folder/file>.
Acuan: <dokumen terkait>.
Ikuti struktur repo yang ada dan hasilkan perubahan yang siap dipakai.
```

## 4. Sprint 0 - Project Foundation

### Main Skills

- `skill-scanner`
- `monorepo-management`
- `electron-development`
- `react-nextjs-development`
- `nestjs-expert`
- `zod-validation-expert`
- `prisma-expert`
- `docker-expert`
- `bullmq-specialist`
- `api-design-principles`
- `api-documentation`

### Use For

- review skill pihak ketiga sebelum dipakai
- setup dan menjaga struktur monorepo `apps/*` dan `packages/*`
- bootstrap desktop app React + Electron
- bootstrap backend NestJS skeleton
- membuat module boundary backend sesuai arsitektur pusat
- env validation dengan Zod
- setup awal Prisma/PostgreSQL/SQLite
- setup Redis + BullMQ skeleton
- API response shape dan endpoint skeleton
- README dan dokumentasi setup dasar

### Expected Output

- monorepo rapi
- desktop shell aktif
- backend NestJS structure aktif
- module `health`, `auth`, `products`, `branches`, dan `sync` tersedia
- `.env.example` tersedia
- struktur database awal siap dikerjakan
- skill yang dipakai sudah ditinjau risikonya

### Example Prompts

```text
Use skill-scanner untuk meninjau skill yang baru diinstall dari sickn33/antigravity-awesome-skills dan beri catatan risiko sebelum dipakai di Omnia.
```

```text
Use monorepo-management untuk review struktur pnpm workspace Omnia di apps/* dan packages/* agar sesuai Sprint 0 foundation.
```

```text
Use nestjs-expert untuk membuat skeleton backend NestJS di apps/backend-api sesuai docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md.
```

```text
Use zod-validation-expert untuk membuat env validation backend di apps/backend-api/src/core/config berdasarkan kebutuhan DATABASE_URL, REDIS_URL, JWT_SECRET, PORT, dan API_PREFIX.
```

```text
Use docker-expert untuk menyiapkan docker compose lokal PostgreSQL dan Redis untuk Sprint 0 Omnia.
```

## 5. Sprint 1 - POS Core and Master Data

### Main Skills

- `react-nextjs-development`
- `electron-development`
- `zustand-store-ts`
- `tanstack-query-expert`
- `nestjs-expert`
- `zod-validation-expert`
- `prisma-expert`

### Use For

- login UI dan role-based shell
- POS cart flow
- product search dan branch price lookup
- Zustand store untuk cart, auth session, branch context, dan sync status ringan
- TanStack Query untuk server state
- endpoint auth, products, categories, branches, dan branch prices
- schema local transaction dan shift dasar
- validation payload login, cart item, payment record, dan transaction draft

### Expected Output

- kasir dapat login
- role-based menu dasar aktif
- product dan branch price dapat dibaca
- cart dapat dibuat dan diubah
- checkout lokal tersimpan
- shift open/close dasar tersedia
- payment record tercatat

### Example Prompts

```text
Use react-nextjs-development untuk membuat halaman POS checkout di apps/desktop-app dengan product search, cart, payment summary, dan role-aware shell.
```

```text
Use zustand-store-ts untuk membuat cart store, auth session store, dan branch context store di apps/desktop-app/stores.
```

```text
Use tanstack-query-expert untuk membuat query products dan branch prices di apps/desktop-app agar cocok untuk POS yang responsif.
```

```text
Use nestjs-expert untuk membuat endpoint products, categories, branches, dan branch prices di apps/backend-api sesuai docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md.
```

```text
Use zod-validation-expert untuk membuat schema login, transaction draft, cart item, dan payment record di packages/types atau package validation yang sesuai.
```

## 6. Sprint 2 - Inventory and Hybrid Sync

### Main Skills

- `prisma-expert`
- `postgres-best-practices`
- `nestjs-expert`
- `zod-validation-expert`
- `bullmq-specialist`
- `tanstack-query-expert`
- `zustand-store-ts`

### Use For

- schema central transaction, payment, stock movement, sync jobs, sync logs, dan idempotency
- local sync queue dan local inventory model
- endpoint `POST /sync/bundles`
- validation envelope sync
- Redis/BullMQ queue untuk sync processing
- retry, replay, acknowledgement, dan job lifecycle
- sync status UI dan polling

### Expected Output

- local sync queue siap
- transaction bundle payload tervalidasi
- sync bundle dapat diterima pusat
- event duplicate tidak membuat data ganda
- retry/replay punya status jelas
- sync status terlihat di desktop app
- inventory ledger pusat mulai terbentuk

### Example Prompts

```text
Use prisma-expert untuk menambahkan model sales_transactions, payments, stock_movements, sync_jobs, sync_logs, dan idempotency_events berdasarkan docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md.
```

```text
Use bullmq-specialist untuk membuat queue sync-bundle, retry policy, dan worker skeleton di apps/backend-api agar proses sync tidak blocking checkout.
```

```text
Use nestjs-expert untuk mengimplementasikan endpoint POST /sync/bundles dan GET /sync/jobs di apps/backend-api dengan module boundary sync yang rapi.
```

```text
Use zod-validation-expert untuk membuat schema sync envelope, transaction bundle, acknowledgement, dan sync status.
```

```text
Use tanstack-query-expert untuk membuat polling sync status di desktop app tanpa membebani UI POS.
```

## 7. Sprint 3 - Dashboard, Reporting, and Audit

### Main Skills

- `nestjs-expert`
- `prisma-expert`
- `postgres-best-practices`
- `react-nextjs-development`
- `tanstack-query-expert`
- `zod-validation-expert`
- `api-design-principles`

### Use For

- dashboard API cabang dan pusat
- report query untuk sales summary dan inventory alerts
- aggregation query atau aggregate table dasar
- audit log schema dan endpoint
- monitoring sync health
- dashboard UI berdasarkan role
- filter periode, cabang, channel, dan payment method

### Expected Output

- dashboard cabang aktif
- dashboard pusat aktif
- audit log dasar aktif
- branch sync health terlihat
- report dasar dapat difilter
- cashier tidak melihat dashboard pusat

### Example Prompts

```text
Use nestjs-expert untuk membuat DashboardModule, ReportsModule, AuditModule, dan MonitoringModule di apps/backend-api sesuai docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md.
```

```text
Use postgres-best-practices untuk review query dashboard agar tidak mengganggu jalur transaksi POS.
```

```text
Use prisma-expert untuk membuat schema audit_logs dan aggregate table dashboard awal.
```

```text
Use react-nextjs-development untuk membuat dashboard cabang dan dashboard pusat role-based di apps/desktop-app.
```

```text
Use api-design-principles untuk review response shape dashboard dan reports agar konsisten dengan envelope API Omnia.
```

## 8. Sprint 4 - Shopee Integration

### Main Skills

- `nestjs-expert`
- `prisma-expert`
- `zod-validation-expert`
- `bullmq-specialist`
- `api-design-principles`
- `react-nextjs-development`
- `tanstack-query-expert`

### Use For

- module integrasi Shopee di backend pusat
- store connection skeleton
- product channel mapping
- webhook receiver
- online order import
- webhook idempotency
- retry failed webhook job
- integration error log
- UI mapping SKU dan integration monitoring

### Expected Output

- Shopee store skeleton tersedia
- SKU Shopee dapat dipetakan ke SKU internal
- webhook order diterima
- order menjadi online order internal
- duplicate webhook aman
- error mapping tercatat dan bisa direview
- integration health terlihat

### Example Prompts

```text
Use nestjs-expert untuk membuat module integrations/shopee di apps/backend-api dengan endpoint stores, product-mappings, orders, webhook, dan retry job.
```

```text
Use zod-validation-expert untuk membuat schema Shopee webhook, product mapping, online order, dan integration error response.
```

```text
Use bullmq-specialist untuk membuat queue shopee-webhook dan retry failed integration job agar integrasi tidak mengganggu POS core.
```

```text
Use prisma-expert untuk membuat model marketplace_accounts, marketplace_stores, product_channel_mappings, online_orders, online_order_items, dan webhook_events.
```

```text
Use react-nextjs-development untuk membuat halaman SKU mapping dan integration health di desktop app untuk role HQ Admin.
```

## 9. Sprint 5 - AI Analytics Dasar

### Main Skills

- `fastapi-templates`
- `nestjs-expert`
- `prisma-expert`
- `zod-validation-expert`
- `bullmq-specialist`
- `react-nextjs-development`
- `tanstack-query-expert`

### Use For

- AI worker/service Python
- contract request-response AI insight
- scheduled job insight generation
- low stock alert
- stockout prediction sederhana
- trend summary per branch, SKU, dan category
- insight persistence di central DB
- AI insight API dan UI

### Expected Output

- AI worker skeleton aktif
- low stock alert muncul
- stockout prediction sederhana muncul
- trend summary dasar muncul
- confidence score tersedia
- AI insight bersifat advisory, bukan aksi otomatis

### Example Prompts

```text
Use fastapi-templates untuk membuat skeleton apps/ai-worker agar siap untuk endpoint health dan proses analytics stockout prediction sederhana.
```

```text
Use nestjs-expert untuk membuat endpoint GET /ai/insights, /ai/insights/low-stock, dan /ai/insights/stockout-predictions di apps/backend-api.
```

```text
Use prisma-expert untuk membuat model ai_insights dan insight_generation_jobs dengan field confidence_score, generated_at, insight_type, branch_id, dan product_id.
```

```text
Use bullmq-specialist untuk membuat queue ai-insight-generation dan failure log untuk job AI.
```

```text
Use zod-validation-expert untuk membuat schema AI insight response, insufficient data response, dan confidence score validation.
```

## 10. Sprint 6 - MVP Hardening and Release Readiness

### Main Skills

- `testing-qa`
- `webapp-testing`
- `nestjs-expert`
- `react-nextjs-development`
- `docker-expert`
- `api-documentation`
- `skill-scanner`
- `zod-validation-expert`

### Use For

- E2E flow cashier, supervisor, HQ admin, dan executive
- smoke test POS, sync, dashboard, Shopee, dan AI
- permission dan branch scoping review
- audit coverage review
- local ops runbook
- Docker compose dan local service readiness
- API documentation dan README final
- review skill atau dependency baru sebelum hardening

### Expected Output

- MVP release candidate siap
- flow utama dapat diuji berulang
- seed demo lengkap
- README dan runbook jelas
- permission dan branch scoping sudah direview
- smoke test utama tersedia
- critical bugs ditutup

### Example Prompts

```text
Use testing-qa untuk menyusun test plan MVP Omnia berdasarkan docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md.
```

```text
Use webapp-testing untuk membuat Playwright smoke test flow cashier checkout, sync status, dashboard HQ, Shopee mapping, dan AI insight.
```

```text
Use docker-expert untuk review local Docker setup PostgreSQL, Redis, backend API, dan AI worker agar demo MVP mudah dijalankan.
```

```text
Use api-documentation untuk merapikan Swagger/OpenAPI notes dan README API endpoint utama Omnia.
```

```text
Use skill-scanner untuk meninjau skill atau dependency baru sebelum masuk hardening MVP.
```

## 11. Sprint 7 - Post-MVP Expansion

### Main Skills

- `api-design-principles`
- `nestjs-expert`
- `prisma-expert`
- `postgres-best-practices`
- `fastapi-templates`
- `react-nextjs-development`
- `testing-qa`
- `vercel-deployment`

### Use For

- marketplace tambahan
- advanced AI dan replenishment recommendation
- export report CSV/XLSX/PDF
- improved conflict resolution
- payment gateway discovery
- return/refund discovery
- performance optimization
- deployment demo/admin jika dipisahkan dari desktop app

### Expected Output

- backlog post-MVP terprioritaskan
- desain marketplace tambahan jelas
- payment dan return/refund masuk discovery
- AI lanjutan punya acceptance criteria
- report export punya target format
- bottleneck performa utama terukur

### Example Prompts

```text
Use api-design-principles untuk merancang API post-MVP marketplace tambahan tanpa mengubah POS core.
```

```text
Use prisma-expert untuk mengevaluasi kebutuhan schema return/refund dan payment gateway discovery setelah MVP stabil.
```

```text
Use fastapi-templates untuk mengembangkan AI worker post-MVP agar mendukung replenishment recommendation.
```

```text
Use postgres-best-practices untuk review bottleneck query dashboard dan report export setelah data MVP terkumpul.
```

```text
Use vercel-deployment hanya jika ada web admin/demo terpisah yang perlu dideploy ke Vercel.
```

## 12. Skill-to-Folder Map

- `apps/backend-api` -> `nestjs-expert`, `zod-validation-expert`, `api-design-principles`, `api-documentation`
- `apps/backend-api/prisma` atau `prisma/` -> `prisma-expert`, `postgres-best-practices`
- `apps/desktop-app` -> `react-nextjs-development`, `electron-development`, `zustand-store-ts`, `tanstack-query-expert`
- `apps/desktop-app/electron` -> `electron-development`
- `apps/ai-worker` -> `fastapi-templates`
- `packages/types` -> `zod-validation-expert`, `api-design-principles`
- `packages/config` -> `monorepo-management`, `zod-validation-expert`
- `packages/shared-utils` -> `monorepo-management`
- `packages/ui` -> `react-nextjs-development`
- `infra/docker` atau `infra/docker/docker-compose.yml` -> `docker-expert`
- `docs/` -> `api-documentation`, `testing-qa`, `skill-scanner`
- Queue/job modules -> `bullmq-specialist`, `nestjs-expert`
- UI smoke tests -> `webapp-testing`, `testing-qa`

## 13. Recommended Prompt Pattern

Gunakan pola prompt ini agar hasil skill lebih konsisten:

```text
Use <skill-name> untuk <goal>.

Context:
- repo: Omnia
- target folder: <folder>
- acuan: <docs yang relevan>

Saya butuh:
- <output 1>
- <output 2>
- <output 3>

Jangan ubah bagian yang tidak relevan.
Jangan jalankan server/watch process kecuali diminta eksplisit.
```

## 14. Practical Tips

- sebut file target agar output lebih fokus
- sebut sprint yang sedang dikerjakan
- sebut dokumen acuan yang relevan
- minta output konkret, bukan saran umum
- untuk backend: sertakan endpoint, module, dan entity target
- untuk database: sertakan ERD, sync spec, dan migration target
- untuk frontend: sertakan role, halaman, dan data yang ditampilkan
- untuk Electron: sertakan boundary main/preload/renderer
- untuk sync: sertakan event type, payload, idempotency, dan acknowledgement
- untuk Shopee: sertakan mapping SKU, webhook, retry, dan error log
- untuk AI: sertakan input dataset, output insight, confidence, dan fallback insufficient data
- untuk infra: sertakan cara verifikasi setelah perubahan

## 15. What Not to Do

- jangan pakai `react-nextjs-development` untuk schema Prisma
- jangan pakai `prisma-expert` untuk UI desktop
- jangan pakai `fastapi-templates` untuk backend NestJS
- jangan pakai `vercel-deployment` untuk POS desktop local-first
- jangan pakai `react-native-architecture` kecuali roadmap mobile benar-benar dimulai
- jangan panggil terlalu banyak skill sekaligus untuk satu task kecil
- jangan gunakan skill risk `critical` tanpa scan manual dan alasan kuat
- jangan jalankan watch/server process saat task hanya meminta struktur atau format
- jangan membuat AI mengubah stok, harga, atau order otomatis pada MVP
- jangan membuat Shopee webhook memblokir checkout POS

## 16. Final Summary

Urutan skill utama per fase:

1. setup -> `skill-scanner`, `monorepo-management`, `docker-expert`
2. desktop foundation -> `electron-development`, `react-nextjs-development`
3. backend foundation -> `nestjs-expert`, `zod-validation-expert`, `api-design-principles`
4. data foundation -> `prisma-expert`, `postgres-best-practices`
5. POS core -> `react-nextjs-development`, `zustand-store-ts`, `tanstack-query-expert`, `nestjs-expert`
6. sync/offline -> `bullmq-specialist`, `nestjs-expert`, `prisma-expert`, `zod-validation-expert`
7. dashboard/audit -> `nestjs-expert`, `react-nextjs-development`, `postgres-best-practices`
8. Shopee -> `nestjs-expert`, `bullmq-specialist`, `prisma-expert`, `zod-validation-expert`
9. AI -> `fastapi-templates`, `bullmq-specialist`, `nestjs-expert`
10. hardening -> `testing-qa`, `webapp-testing`, `docker-expert`, `api-documentation`
11. post-MVP -> `api-design-principles`, `prisma-expert`, `fastapi-templates`, `vercel-deployment` jika diperlukan

Dokumen ini dipakai sebagai panduan kapan skill tertentu sebaiknya diaktifkan selama pengerjaan sprint Omnia.
