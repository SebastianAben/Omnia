# Omnia UI Design Guide

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: UI Design Guide dan Google Stitch Prompt Library
- Versi: 1.0
- Tanggal: 2026-05-05
- Tujuan: menjadi panduan resmi untuk membuat desain UI Omnia di Google Stitch sebelum implementasi frontend Sprint 0 dan sprint lanjutan.
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/User-Flow-Utama-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`

## 2. Design Goal

Omnia harus terasa seperti aplikasi POS desktop modern yang cepat, jelas, dan siap operasional untuk bisnis retail dan UMKM multi-cabang.

Tujuan desain:

- kasir dapat menyelesaikan transaksi dengan cepat dan minim distraksi
- supervisor dapat memantau stok dan operasional cabang dengan jelas
- HQ admin dapat mengelola data pusat dan integrasi dengan rapi
- executive atau analyst dapat membaca insight tanpa masuk ke detail operasional kasir
- status koneksi, sync, shift, pembayaran, dan stok harus terlihat tanpa mengganggu flow utama

Omnia bukan landing page, bukan dashboard dekoratif, dan bukan aplikasi eksperimental. Omnia adalah tool kerja harian yang harus stabil, cepat dibaca, dan mudah digunakan berulang kali.

## 3. Design Source of Truth

Google Stitch digunakan sebagai sumber utama desain visual UI Omnia.

Aturan:

- Semua screen utama dibuat terlebih dahulu di Google Stitch.
- Hasil Stitch dipakai sebagai referensi utama layout, hierarchy, spacing, warna, dan komposisi.
- Implementasi final tetap dilakukan di codebase Omnia agar sesuai dengan flow, backend, local database, sync, dan role access.
- Jika output Stitch menghasilkan kode, kode tersebut boleh dipakai sebagai referensi, tetapi harus dirapikan menjadi komponen frontend yang maintainable.
- Jika desain Stitch bertentangan dengan kebutuhan POS local-first, PRD dan user flow Omnia lebih diutamakan.

## 4. Technical Target

Desain harus bisa diimplementasikan dengan stack berikut:

- Next.js
- Electron
- TypeScript
- Tailwind CSS
- shadcn/ui atau komponen internal berbasis Radix
- Zustand untuk UI/local state
- TanStack Query untuk server state
- SQLite local store untuk mode cabang/offline
- NestJS backend API

Target viewport utama:

- desktop POS: 1366 x 768
- laptop: 1440 x 900
- desktop besar: 1920 x 1080

Mobile bukan target utama MVP. Jika Stitch membuat versi mobile, gunakan hanya sebagai referensi tambahan.

## 5. Visual Direction

Nama arah desain:

`Modern Utilitarian Retail Operations`

Karakter UI:

- profesional
- padat tetapi tetap mudah dibaca
- kontras jelas untuk angka transaksi dan status
- minim dekorasi
- navigasi konsisten
- tombol utama sangat jelas
- tabel dan daftar rapi
- cocok untuk penggunaan harian di toko

Hindari:

- hero section
- layout marketing
- ilustrasi besar
- gradient dekoratif yang dominan
- kartu terlalu besar untuk data operasional
- animasi berlebihan
- UI yang terlihat seperti landing page SaaS
- warna yang terlalu playful untuk flow kasir

## 6. Navigation Model

Omnia memakai satu aplikasi utama berbasis role.

Layout utama yang disarankan:

- left sidebar untuk navigasi role-based
- top status bar untuk branch, register, user, shift, mode online/offline, dan sync
- main workspace untuk screen aktif
- panel kanan opsional untuk summary, cart, detail, atau action review

Routing role:

- Cashier: langsung masuk ke POS Workspace
- Store Supervisor: masuk ke Branch Operations Dashboard
- HQ Admin: masuk ke Central Control Dashboard
- Executive / Analyst: masuk ke Executive Analytics Dashboard

## 7. Role-Based UI Rules

### Cashier

Fokus:

- POS checkout
- scan/search produk
- cart
- payment
- receipt
- shift open/close
- status sync sederhana

Jangan tampilkan:

- dashboard pusat
- AI analytics
- konfigurasi Shopee
- user management

### Store Supervisor

Fokus:

- ringkasan cabang
- inventory
- stock adjustment
- shift/session monitoring
- sync status cabang
- POS jika diberi akses

### HQ Admin

Fokus:

- master product
- branch pricing
- user/role management
- dashboard pusat
- sync monitoring
- Shopee integration
- audit log

### Executive / Analyst

Fokus:

- dashboard pusat
- trend
- KPI
- stockout prediction
- AI insights
- read-only operational visibility

## 8. Screen Priority

Desain di Google Stitch harus dibuat dengan urutan berikut:

1. Login
2. App shell role-based
3. POS checkout
4. Product search dan barcode flow
5. Payment confirmation
6. Receipt preview
7. Shift open/close
8. Inventory adjustment
9. Sync status
10. HQ dashboard
11. Shopee SKU mapping
12. AI insights

Prioritas tertinggi adalah screen 1 sampai 6 karena itu inti flow kasir.

## 9. Google Stitch Workflow

1. Buka Google Stitch.
2. Gunakan prompt utama dari dokumen ini.
3. Generate desain screen prioritas satu per satu.
4. Pilih desain final untuk setiap screen.
5. Simpan hasil desain sebagai screenshot, export, atau file referensi.
6. Catat nama screen, role, viewport, dan state penting.
7. Gunakan hasil Stitch sebagai referensi implementasi frontend.
8. Implementasikan flow ke local state, SQLite, dan backend API.
9. Validasi UI terhadap PRD, user flow, dan acceptance criteria MVP.

## 10. Stitch Handoff Checklist

Untuk setiap screen hasil Stitch, siapkan:

- nama screen
- role pengguna
- viewport target
- screenshot atau export desain
- state utama
- state kosong
- state loading
- state error
- state offline jika relevan
- action utama
- data yang perlu ditampilkan
- endpoint atau local store yang akan dipakai
- catatan interaksi

## 11. Prompt Utama Google Stitch

Gunakan prompt ini sebagai prompt dasar untuk seluruh screen:

```text
Design a production-grade desktop application called Omnia for Indonesian retail and MSME multi-branch businesses.

Omnia is a hybrid omnichannel smart POS with role-based access, local-first checkout, inventory control, offline-to-online sync, dashboard reporting, Shopee marketplace integration, and simple AI insights.

The UI must feel like a modern utilitarian retail operations tool: fast, trustworthy, dense but readable, professional, and optimized for repeated daily cashier and store operations work.

This is not a marketing website and not a landing page. Do not create hero sections, decorative illustrations, oversized promotional cards, or generic SaaS marketing layouts.

Design for a desktop Electron app implemented with Next.js and Tailwind CSS. The primary viewport is 1366x768, with support for 1440x900 and 1920x1080.

Use a role-based app shell:
- left sidebar navigation
- top status bar showing branch, register, active user, shift state, online/offline state, and sync status
- main workspace for the current workflow
- optional right panel for cart, summary, detail, or action review

Use clear visual hierarchy, compact controls, accessible contrast, strong table/list design, status badges, and professional retail operations patterns.

Visual direction: Modern Utilitarian Retail Operations. Neutral base, clear accent color for primary actions, semantic status colors for success, warning, danger, offline, synced, pending, and failed. Components should map cleanly to shadcn/Radix-style primitives.
```

## 12. Prompt: Login

```text
Create the login screen for Omnia, a desktop hybrid smart POS application for Indonesian retail and MSME multi-branch businesses.

The login screen must support username or email, password, optional cashier PIN hint, device/register context, and clear online/offline session messaging.

Requirements:
- professional desktop app login, not a marketing landing page
- compact brand area for Omnia
- login form with username/email and password
- optional branch/register/device information area
- status indicator for online or offline availability
- clear error state for invalid credentials
- clear disabled/loading state while signing in
- visual tone: modern utilitarian retail operations
- optimize for 1366x768 desktop

After login, users route by role:
- Cashier to POS Workspace
- Store Supervisor to Branch Operations Dashboard
- HQ Admin to Central Control Dashboard
- Executive / Analyst to Executive Analytics Dashboard
```

## 13. Prompt: App Shell Role-Based

```text
Create the main role-based app shell for Omnia, a desktop Electron smart POS application.

The shell must work for Cashier, Store Supervisor, HQ Admin, and Executive / Analyst roles.

Layout requirements:
- left sidebar navigation with compact icon + label items
- top status bar with branch, register, current user, role, active shift status, online/offline state, and sync state
- main content workspace
- clear visual treatment for active navigation item
- role-based navigation groups
- compact layout optimized for daily operational use

Navigation examples:
- Cashier: POS, Shift, Receipts, Sync
- Store Supervisor: Branch Dashboard, Inventory, Stock Movements, Shift, Sync
- HQ Admin: Central Dashboard, Products, Pricing, Branches, Users, Shopee, Sync, Audit
- Executive / Analyst: Executive Dashboard, Sales Trends, Stockout Insights, AI Insights

Style: modern utilitarian retail operations, dense but readable, no decorative hero content, optimized for 1366x768 and 1440x900 desktop.
```

## 14. Prompt: POS Checkout

```text
Create the main cashier POS checkout screen for Omnia, a desktop retail POS app.

The screen must support fast product scanning, product search, cart review, discounts, tax, payment method selection, checkout confirmation, local transaction saving, and offline-aware status.

Layout requirements:
- left sidebar with compact role navigation
- top status bar showing branch, register, cashier name, active shift, online/offline mode, and sync status
- main area split into product search/results and cart
- product search supports barcode/SKU/name input
- product result list or grid shows product name, SKU, price, stock, and quick add action
- cart shows item name, SKU, quantity controls, unit price, discount, subtotal, and remove action
- payment summary shows subtotal, discount, tax, total, payment method, and payment status
- primary checkout button must be visually dominant and easy to reach
- offline mode must be visible but not disruptive
- pending sync status must be visible after transaction save

Style: modern utilitarian retail operations, dense but readable, optimized for 1366x768 desktop POS usage. Avoid marketing layout, decorative gradients, and oversized cards.
```

## 15. Prompt: Product Search dan Barcode Flow

```text
Create the product search and barcode scanning flow for Omnia POS.

The user is a cashier who needs to find products quickly by barcode, SKU, or product name.

Requirements:
- prominent scan/search input
- quick keyboard-friendly workflow
- result rows with product name, SKU, barcode, category, price, and available branch stock
- clear empty state when no product is found
- warning state for inactive product or out-of-stock product
- quick add action to cart
- compact product detail preview
- visible branch pricing context
- works inside the Omnia POS desktop shell

Style: operational, fast, dense, high contrast, optimized for repeated cashier use at 1366x768.
```

## 16. Prompt: Payment Confirmation

```text
Create the payment confirmation screen or modal for Omnia POS.

The cashier has completed a cart and must record payment for the transaction. MVP does not use direct payment gateway integration; payment is recorded manually.

Requirements:
- show transaction summary: item count, subtotal, discount, tax, total
- show selectable payment methods such as cash, transfer, QRIS recorded, debit recorded, and split payment placeholder if needed
- show amount received and change for cash payment
- show payment status selection: paid, pending, failed/cancelled where appropriate
- show final confirmation action
- show cancel/back action
- show offline warning only as a status, not as a blocker
- after confirmation, transaction is saved locally and marked pending sync if needed

Style: clear, calm, transaction-safe, with strong emphasis on final total and confirm payment action.
```

## 17. Prompt: Receipt Preview

```text
Create the receipt preview screen for Omnia POS after checkout.

Requirements:
- compact receipt preview with store name, branch, register, cashier, transaction number, date/time, item list, subtotal, discount, tax, total, payment method, and sync status
- actions for print receipt, new transaction, and view transaction detail
- indicate whether transaction is synced or pending sync
- support offline mode messaging without alarming the cashier
- layout should fit 1366x768 desktop and be readable from a cashier workstation

Style: professional POS receipt workflow, simple, focused, no decorative content.
```

## 18. Prompt: Shift Open and Close

```text
Create the shift open and close workflow screens for Omnia.

Users are Cashier, Store Supervisor, or HQ Admin with operational access.

Open shift requirements:
- show branch, register, user, date/time
- input opening cash amount
- confirm open shift action
- show current online/offline and sync status

Close shift requirements:
- show shift summary: opening cash, sales total, cash sales, non-cash recorded sales, transaction count, expected closing cash, variance input, notes
- show confirm close shift action
- show warning if there are pending sync transactions

Style: operational and audit-friendly, clear summary numbers, compact forms, optimized for desktop POS.
```

## 19. Prompt: Inventory Adjustment

```text
Create the inventory adjustment screen for Omnia branch operations.

Users are Store Supervisor or HQ Admin.

Requirements:
- searchable product table with SKU, product name, category, current stock, minimum stock, and status
- adjustment panel for selected product
- action types: stock in, stock adjustment
- quantity input
- reason selector and notes
- preview of stock before and after adjustment
- confirm adjustment action
- stock movement history table
- low stock warning badges
- branch scope selector only for authorized users
- offline/pending sync status when adjustment is saved locally

Style: modern operational backoffice, dense but readable, strong table design, clear audit trail.
```

## 20. Prompt: Sync Status

```text
Create the sync status screen for Omnia hybrid local-first POS.

The screen must help authorized users understand whether branch data has synced to the central backend.

Requirements:
- summary cards or compact metrics for pending, processing, synced, failed, and conflict events
- sync queue table with event type, entity, created time, last attempt, status, and retry action
- online/offline indicator
- last successful sync timestamp
- retry failed events action
- clear non-technical explanation for cashier-level users
- more detailed logs for supervisor/HQ users
- status colors for pending, processing, synced, failed, and conflict

Style: calm, operational, trustworthy. Do not make failed sync visually catastrophic unless action is required.
```

## 21. Prompt: HQ Dashboard

```text
Create the central HQ dashboard for Omnia.

Users are HQ Admin and Executive / Analyst.

Requirements:
- show sales overview for daily, weekly, and monthly periods
- show transaction count
- show top selling products
- show slow moving products
- show critical stock
- show branch performance
- show channel performance for offline POS and Shopee
- show payment method performance based on recorded payment method
- filters for period and branch
- clear role-safe dashboard layout, no cashier checkout controls
- data-dense but readable layout for management decisions

Style: modern operational analytics dashboard, restrained, professional, no marketing hero, no decorative oversized visuals.
```

## 22. Prompt: Shopee SKU Mapping

```text
Create the Shopee SKU mapping screen for Omnia.

User is HQ Admin.

Requirements:
- show connected Shopee store context
- table of Shopee products/orders needing mapping
- internal product search for SKU mapping
- show Shopee SKU, Shopee product name, internal SKU, internal product name, mapping status, and last sync status
- action to create or update mapping
- warning for unmapped SKU
- import order status panel
- retry/error log area for integration failures
- design for MVP integration workflow, not full marketplace campaign management

Style: operational integration console, compact, clear error handling, table-first design.
```

## 23. Prompt: AI Insights

```text
Create the AI insights screen for Omnia.

Users are Executive / Analyst and authorized HQ Admin.

MVP AI is advisor-only and must not automatically change operational data.

Requirements:
- show low stock alerts
- show simple stockout prediction
- show sales trend summary per branch
- show sales trend summary per SKU or category
- show insight cards with timestamp, confidence/quality label, and source data period
- show recommended human review action, not automatic action
- distinguish alerts, predictions, and summaries
- filters for branch, category, SKU, and period

Style: professional analytics workspace, calm and credible, no magical AI visuals, no chatbot-first layout.
```

## 24. Implementation Notes

When implementing Stitch output into the Omnia codebase:

- Keep POS screens fast and keyboard-friendly.
- Use semantic components and accessible focus states.
- Keep navigation role-based.
- Keep backend authorization separate from UI gating.
- Keep offline and sync state visible on operational screens.
- Build reusable components only after repeated patterns appear in at least two screens.
- Prefer tables, panels, status badges, command inputs, dialogs, and compact forms over decorative cards.
- Do not let dashboard, Shopee, or AI UI interfere with cashier checkout.

## 25. Validation Checklist

Before accepting a Stitch design:

- Does the screen support the correct role?
- Does it fit 1366 x 768 without hiding the primary action?
- Is the cashier flow short and clear?
- Are offline and sync states visible where needed?
- Are destructive or final actions visually distinct?
- Is the layout implementable with Next.js, Tailwind, and shadcn/Radix-style components?
- Does it avoid marketing-page patterns?
- Does it match the MVP scope and avoid out-of-scope features?

## 26. Next Step After This Document

After `docs/DESIGN.md` is created:

1. Generate the priority screens in Google Stitch using the prompts above.
2. Save the selected outputs as design references.
3. Use those references before continuing frontend implementation in Sprint 0.
4. Continue non-visual Sprint 0 work such as backend API, database, auth skeleton, sync skeleton, and developer setup while UI design is being finalized.
