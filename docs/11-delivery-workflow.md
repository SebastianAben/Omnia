# Delivery Workflow

## Prinsip Kerja

Omnia memakai workflow PM-led multi-agent/tim. Setiap task harus punya scope jelas, acceptance criteria, implementasi terarah, validasi, dan report akhir.

## Role

| Role | Tanggung jawab |
| --- | --- |
| PM / Orchestrator | Mengunci scope, prioritas, acceptance criteria, dan final report. |
| Frontend Worker | UI, state, local-first UX, route, desktop flow. |
| Backend Worker | API, service, Prisma, queue, auth, integration. |
| Local-First / Sync Worker | SQLite, sync queue, replay, idempotency. |
| QA Agent | Smoke, regression, E2E, UAT checklist. |
| Technical Reviewer | Risiko teknis, modularity, performance, security review. |
| Documentation Agent | Docs, runbook, changelog, status. |
| Security / Deployment Agent | Env, CI/CD, Docker, secrets, server readiness. |

## Workflow Standar

1. Intake: pahami tujuan dan batas scope.
2. Planning: pecah task dan tentukan quality gate.
3. Implementation: kerjakan sesuai domain.
4. Integration: pastikan module saling tersambung.
5. QA: jalankan validasi relevan.
6. Review: cek risiko, permission, data, dan edge case.
7. Final report: ringkas hasil, file berubah, validasi, risiko, dan next step.

## Final Report Format

```md
# Final PM Report

## Summary
## Completed Work
## Files / Modules Changed
## Validation Result
## Not Completed
## Risks / Notes
## Next Step Recommendation
```

## Skill Usage

Gunakan skill/tool sesuai kebutuhan, bukan sebagai duplikasi dokumen:

- Backend: NestJS, Prisma, Zod, API documentation.
- Frontend: React/Next.js, Zustand, TanStack Query, UI/design review.
- Sync/local-first: SQLite, queue, idempotency, retry.
- Deployment: Docker, Vercel/home server, CI/CD.
- QA: smoke, Playwright, integration test.
- Security: auth, permission, branch scope, secret handling.

## Definition of Done

Task dianggap selesai jika:

- Scope terpenuhi.
- Tidak mematahkan POS local-first.
- Data penting auditable.
- Permission relevan divalidasi.
- Test/validation minimum dijalankan atau alasan tidak dijalankan dicatat.
- Dokumentasi status diperbarui jika ada perubahan arsitektur, env, command, atau flow.

