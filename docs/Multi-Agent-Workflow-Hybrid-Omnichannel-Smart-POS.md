# Multi-Agent Workflow

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Multi-Agent Workflow
- Versi: 1.0
- Tanggal: 2026-05-05
- Tujuan: mendefinisikan workflow kerja multi-agent untuk perencanaan, implementasi, QA, dokumentasi, dan laporan akhir pada setiap task/sprint Omnia.
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/DESIGN.md`
  - `docs/Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md`

## 2. Prinsip Workflow

Workflow multi-agent Omnia memakai model `PM-led delivery`.

Artinya:

- PM memegang konteks, scope, prioritas, dan laporan akhir.
- Worker mengerjakan implementasi sesuai task yang sudah jelas.
- QA memvalidasi hasil terhadap acceptance criteria.
- Reviewer menjaga kualitas teknis, arsitektur, dan risiko integrasi.
- Semua pekerjaan harus berakhir dengan laporan akhir dari PM.

PM wajib memberikan laporan akhir setelah pekerjaan selesai, baik pekerjaan berhasil penuh, berhasil sebagian, atau gagal karena blocker.

## 3. Role Dasar

### 3.1 PM / Orchestrator

Tanggung jawab:

- memahami request user
- membaca dokumen produk dan teknis yang relevan
- memecah pekerjaan menjadi task kecil
- menentukan prioritas
- menetapkan acceptance criteria
- mengkoordinasikan worker, QA, reviewer, dan dokumentasi
- memastikan pekerjaan tidak keluar scope
- memastikan hasil akhir sesuai PRD, sprint plan, roadmap, design, dan deployment strategy
- membuat laporan akhir wajib

PM tidak boleh hanya mendelegasikan lalu berhenti. PM tetap bertanggung jawab atas integrasi hasil akhir.

### 3.2 Frontend Worker

Tanggung jawab:

- mengimplementasikan UI Next.js/Electron
- mengikuti desain dari Google Stitch dan `docs/DESIGN.md`
- membangun routing, layout, state UI, form, table, dan screen flow
- memastikan UI mendukung role-based access
- memastikan UI POS tetap cepat dan tidak terganggu fitur dashboard/AI

Input utama:

- `docs/DESIGN.md`
- hasil desain Google Stitch
- `docs/User-Flow-Utama-Hybrid-Omnichannel-Smart-POS.md`
- API/local store contract

Output:

- komponen frontend
- screen atau flow yang bisa dijalankan
- catatan state yang belum tersambung ke backend jika ada

### 3.3 Backend Worker

Tanggung jawab:

- mengimplementasikan NestJS API
- membuat module, controller, service, DTO, guard, dan validation
- menghubungkan Prisma/PostgreSQL
- mengimplementasikan auth, master data, sync endpoint, dashboard endpoint, Shopee endpoint, dan AI endpoint sesuai sprint
- menjaga response envelope sesuai API contract

Input utama:

- `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
- `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md`

Output:

- endpoint backend
- schema/migration/seed jika diperlukan
- catatan env variable yang dipakai

### 3.4 Local-First / Sync Worker

Tanggung jawab:

- mengimplementasikan SQLite local store
- membuat sync queue lokal
- menghasilkan sync event dari transaksi, payment, stock movement, dan shift
- menghubungkan retry, acknowledgement, dan status sync
- memastikan POS tetap berjalan saat backend tidak tersedia

Input utama:

- `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
- `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
- `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`

Output:

- local schema
- sync queue
- sync worker/client
- status sync yang bisa dipakai UI

### 3.5 QA Agent

Tanggung jawab:

- memvalidasi hasil terhadap acceptance criteria
- menjalankan atau mendefinisikan test manual dan automated
- mengecek regression risk
- memastikan flow utama bisa dijalankan
- mencatat bug, gap, dan risiko residual

QA harus memvalidasi minimal:

- command test/typecheck/lint yang relevan
- flow manual utama
- state error/loading/offline jika relevan
- role access jika relevan
- deployment/env behavior jika relevan

### 3.6 Technical Reviewer

Tanggung jawab:

- meninjau arsitektur dan integrasi
- memastikan implementasi tidak menyimpang dari dokumen utama
- mengecek boundary frontend/backend/local store
- mengecek security dan deployment risk
- mengecek apakah ada hardcoded URL, secret, atau coupling yang tidak sehat

Reviewer tidak menggantikan QA. Reviewer fokus pada kualitas teknis dan risiko jangka panjang.

### 3.7 Documentation Agent

Tanggung jawab:

- memperbarui dokumen jika ada keputusan baru
- menjaga README, setup, env, runbook, dan changelog tetap sinkron
- memastikan perubahan behavior penting tercatat

Documentation Agent wajib dilibatkan jika:

- ada perubahan API contract
- ada perubahan env variable
- ada perubahan deployment
- ada perubahan sprint scope
- ada perubahan workflow manual untuk user/developer

### 3.8 Security / Deployment Agent

Tanggung jawab:

- mengecek auth, CORS, secret, env, deployment, dan exposure service
- memastikan PostgreSQL/Redis tidak terbuka publik
- memastikan backend production siap di balik HTTPS reverse proxy
- memastikan Vercel frontend hanya memakai public env

Role ini wajib dilibatkan untuk task:

- auth
- deployment
- Shopee integration
- env/config
- production readiness

## 4. Workflow Standar

### 4.1 Intake

PM melakukan:

- membaca request user
- membaca dokumen terkait
- mengidentifikasi sprint/task yang relevan
- menentukan apakah desain Stitch, backend, local store, QA, atau deployment ikut terdampak
- membuat scope kerja singkat

Output intake:

- tujuan pekerjaan
- in scope
- out of scope
- acceptance criteria
- role agent yang dilibatkan

### 4.2 Planning

PM membuat rencana implementasi yang cukup detail.

Rencana minimal berisi:

- urutan kerja
- file/module yang terdampak
- dependency antar task
- data flow
- test plan
- manual step dari user jika ada

Jika pekerjaan membutuhkan desain UI final, PM harus memastikan hasil Google Stitch sudah tersedia sebelum Frontend Worker mulai implementasi visual.

### 4.3 Delegation

PM membagi pekerjaan ke agent sesuai role.

Aturan:

- task harus kecil dan jelas
- worker tidak boleh mengubah area di luar scope tanpa alasan
- jika beberapa worker berjalan paralel, write area harus dipisah
- worker harus melaporkan file yang diubah dan test yang dijalankan
- worker harus menyebut blocker atau asumsi

### 4.4 Implementation

Worker mengerjakan task sesuai scope.

Aturan implementasi:

- ikuti pola repo yang sudah ada
- jangan hardcode URL production, secret, atau env
- gunakan shared types/config jika sudah tersedia
- untuk UI, ikuti `docs/DESIGN.md` dan hasil Google Stitch
- untuk backend, ikuti API contract dan ERD
- untuk sync, ikuti sync specification

### 4.5 Integration

PM atau integrator menggabungkan hasil worker.

Checklist:

- tidak ada konflik file
- interface frontend/backend cocok
- env variable tercatat
- data flow end-to-end jelas
- dokumentasi terkait ikut diperbarui bila perlu

### 4.6 QA

QA memvalidasi hasil.

Output QA:

- test yang dijalankan
- hasil test
- bug ditemukan
- risiko residual
- rekomendasi fix atau follow-up

Jika QA menemukan bug P0/P1, pekerjaan belum boleh dianggap selesai.

### 4.7 Review

Technical Reviewer mengecek kualitas teknis.

Checklist:

- arsitektur sesuai dokumen
- security baseline tidak dilanggar
- deployment strategy tidak dilanggar
- tidak ada hardcoded production value
- tidak ada perubahan out-of-scope yang berisiko

### 4.8 Final PM Report

PM wajib membuat laporan akhir setelah pekerjaan selesai.

Laporan akhir minimal berisi:

- ringkasan pekerjaan
- detail pekerjaan yang sudah dilakukan
- file/module yang berubah
- hasil validasi/test
- pekerjaan yang belum selesai
- blocker atau risiko
- hal yang harus dikerjakan manual oleh user
- rekomendasi next step

Jika pekerjaan gagal atau hanya selesai sebagian, PM tetap wajib membuat laporan akhir yang menjelaskan penyebabnya.

## 5. Template Task Brief PM

Gunakan template ini sebelum worker mulai:

```md
# Task Brief

## Goal

<Tujuan pekerjaan>

## Context

- Sprint:
- Dokumen referensi:
- Modul terdampak:

## Scope

In:

- ...

Out:

- ...

## Acceptance Criteria

- ...

## Agent Roles

- PM:
- Worker:
- QA:
- Reviewer:
- Documentation:

## Implementation Notes

- ...

## Test Plan

- ...

## Manual User Step

- ...
```

## 6. Template Worker Report

```md
# Worker Report

## Summary

<Ringkasan pekerjaan>

## Changes

- ...

## Files Changed

- ...

## Validation

- ...

## Assumptions

- ...

## Blockers

- ...
```

## 7. Template QA Report

```md
# QA Report

## Scope Tested

- ...

## Tests Run

- ...

## Results

- Pass:
- Fail:
- Not run:

## Bugs / Findings

- ...

## Residual Risk

- ...

## Recommendation

- Approve / Needs fix / Blocked
```

## 8. Template Final PM Report

PM wajib menggunakan template ini di akhir pekerjaan:

```md
# Final PM Report

## Summary

<Ringkasan singkat hasil pekerjaan>

## Completed Work

- ...

## Detailed Work

- ...

## Files / Modules Changed

- ...

## Validation Result

- ...

## Not Completed

- ...

## Manual Action Required From User

- ...

## Risks / Notes

- ...

## Next Step Recommendation

- ...
```

## 9. Agent Assignment per Sprint

### Sprint 0

Wajib:

- PM / Orchestrator
- Backend Worker
- Frontend Worker
- Local-First / Sync Worker
- QA Agent
- Technical Reviewer
- Documentation Agent
- Security / Deployment Agent

Fokus:

- monorepo
- frontend/desktop foundation
- backend foundation
- PostgreSQL/Prisma
- SQLite local store
- Redis/BullMQ
- auth skeleton
- sync skeleton
- env/deployment readiness

### Sprint 1

Wajib:

- PM / Orchestrator
- Frontend Worker
- Backend Worker
- Local-First / Sync Worker
- QA Agent
- Technical Reviewer
- Documentation Agent

Fokus:

- auth
- role
- branch/register
- product/category/pricing
- local cache
- seed data

### Sprint 2

Wajib:

- PM / Orchestrator
- Frontend Worker
- Local-First / Sync Worker
- Backend Worker jika API/backend contract terdampak
- QA Agent
- Technical Reviewer

Fokus:

- POS checkout
- cart
- payment record
- local transaction
- stock decrement
- receipt preview

### Sprint 3 dan Seterusnya

PM menentukan agent berdasarkan domain:

- Inventory dan shift: Frontend, Backend, Local-First, QA
- Sync: Local-First, Backend, QA, Technical Reviewer
- Dashboard: Frontend, Backend, QA
- Shopee: Backend, Frontend, Security/Deployment, QA
- AI: AI Worker, Backend, Frontend, QA
- Hardening: QA, Technical Reviewer, Security/Deployment, Documentation

## 10. Manual User Handoff Rules

PM wajib mencatat manual action jika pekerjaan membutuhkan tindakan user.

Contoh manual action:

- menjalankan Google Stitch dan memilih desain final
- menyediakan hasil screenshot/export Stitch
- menyediakan domain backend home server
- menyediakan credential Shopee sandbox/production
- menyediakan secret JWT production
- menyediakan akses atau konfigurasi home server
- menjalankan deploy manual di Vercel
- mengatur DNS dan reverse proxy

Manual action harus spesifik, tidak boleh hanya ditulis "user perlu setup manual".

## 11. Definition of Done Workflow

Sebuah pekerjaan dianggap selesai jika:

- scope selesai atau gap dicatat jelas
- test/validasi relevan sudah dijalankan
- QA report tersedia untuk pekerjaan yang punya behavior
- risiko residual dicatat
- dokumentasi diperbarui jika ada perubahan kontrak
- PM final report tersedia
- manual action dari user, jika ada, ditulis eksplisit

Jika final PM report belum ada, pekerjaan belum dianggap selesai.
