# Desktop Wrapper Readiness

## Keputusan Arsitektur

Omnia POS cabang tidak diposisikan sebagai browser-only web app. UI tetap dibangun dengan Next.js/React, tetapi runtime final untuk cabang adalah desktop app wrapper agar dapat mengakses SQLite lokal, file system, printer/scanner di masa depan, dan proses sync background.

Wrapper utama yang dipilih untuk MVP adalah Electron.

## Kenapa Next.js Tetap Bisa Dipakai

Next.js berperan sebagai renderer UI. Electron menyediakan:

- main process untuk akses Node.js, file system, dan SQLite
- preload script untuk bridge aman ke renderer
- BrowserWindow untuk menampilkan UI Next.js
- IPC untuk komunikasi renderer ke local store

Dengan pola ini, UI tetap memakai stack web modern, tetapi fitur lokal berjalan di desktop runtime, bukan di browser biasa.

## Boundary Wajib

| Layer            | Boleh                                               | Tidak boleh                                   |
| ---------------- | --------------------------------------------------- | --------------------------------------------- |
| Renderer Next.js | UI, state, API call, memanggil bridge               | Akses SQLite langsung, akses Node langsung    |
| Preload          | Expose API kecil via `contextBridge`                | Membuka seluruh Node API ke renderer          |
| Electron main    | SQLite, file system, local sync, native integration | Logic UI/React                                |
| Backend pusat    | Auth, sync apply, dashboard, audit, LLM insight     | Menjadi dependency wajib untuk checkout lokal |

## Kondisi Aktual

Sudah ada:

- `apps/desktop-app/electron/main.ts`
- `apps/desktop-app/electron/preload.ts`
- `apps/desktop-app/electron/preload.d.ts`
- encrypted auth session store berbasis Electron `safeStorage`
- `window.omniaDesktop.localStore`
- `window.omniaDesktop.authSession`
- IPC handler untuk checkout, receipt list, inventory, shift, sync queue, dan replay sync
- SQLite local schema di `apps/desktop-app/local-store/schema.sql`
- Script `dev:desktop`
- Script `build:electron`

Catatan penting:

- Mode development memakai `next dev` lalu Electron membuka `http://localhost:3000`.
- Mode production memakai static export renderer dan Electron membuka `out/index.html`.
- Build desktop belum boleh dianggap selesai untuk distribusi cabang sampai packaged app tervalidasi di mesin target.
- `next.config.mjs` memakai `output: "export"` karena route renderer saat ini client/API/Electron-bridge driven dan tidak membutuhkan Next server runtime.

## Strategi Packaging yang Direkomendasikan

Ada dua opsi yang valid. Pilih salah satu sebelum release desktop.

### Opsi A: Electron Membundel Next Standalone Server

Cocok jika aplikasi tetap butuh fitur Next server runtime.

Requirement:

1. Build Next dengan `output: "standalone"`.
2. Package `.next/standalone`, `.next/static`, `public`, dan Electron files.
3. Electron main process menjalankan local Next server pada port internal.
4. BrowserWindow membuka `http://127.0.0.1:<internal-port>`.
5. Port harus dipilih aman dan tidak bentrok.
6. App shutdown harus menghentikan local server.

Kelebihan:

- Kompatibel dengan fitur Next server.
- Tidak perlu static export penuh.

Risiko:

- Packaging lebih kompleks.
- Ada local server process yang harus dimonitor.

### Opsi B: Static Export untuk Renderer

Cocok jika semua route bisa menjadi client/static UI.

Requirement:

1. Pastikan tidak ada fitur Next server-only yang dibutuhkan renderer.
2. Gunakan static export.
3. Electron `loadFile` membuka file HTML hasil export.
4. Semua data runtime datang dari API/backend atau Electron bridge.

Kelebihan:

- Packaging lebih sederhana.
- Tidak perlu local server.

Risiko:

- Tidak semua fitur Next App Router/server feature kompatibel.

Rekomendasi MVP: gunakan Opsi B untuk renderer saat ini. Evaluasi Opsi A hanya jika fitur baru membutuhkan Next server runtime.

## SQLite Requirement

SQLite harus berjalan di Electron main process atau dependency native yang dibundel, bukan dari browser renderer.

Checklist:

- Local DB path berada di app data/user data atau folder writable yang stabil.
- Schema migration lokal berjalan saat app start.
- SQLite binary/dependency tersedia dalam installer.
- Renderer hanya memanggil local store melalui `window.omniaDesktop.localStore`.
- Browser biasa harus menampilkan fallback jelas jika bridge tidak tersedia.

## Auth Session Requirement

- Electron main process memiliki ownership atas persisted token.
- Access dan refresh token dienkripsi dengan OS-backed Electron `safeStorage`.
- Renderer hanya memakai `window.omniaDesktop.authSession`.
- Token `localStorage` lama dimigrasikan lalu dihapus saat bridge tersedia.
- Jika secure storage tidak tersedia, token hanya bertahan di memory dan login
  tidak dipersistenkan.
- Browser fallback juga menggunakan token memory-only.

Catatan aktual: implementasi saat ini memakai command `sqlite3` melalui `execFileSync`. Untuk installer production, pastikan binary `sqlite3` tersedia di target machine atau ganti ke dependency SQLite yang dibundel seperti `better-sqlite3`/native package yang kompatibel dengan Electron.

## Desktop Build Exit Criteria

Sebelum menyebut Omnia siap sebagai app:

1. `pnpm --filter @omnia/desktop-app build` berhasil.
2. Electron production mode dapat membuka renderer tanpa `next dev`.
3. SQLite local store bisa init otomatis.
4. Checkout lokal berhasil dari packaged app.
5. Shift open/close berhasil dari packaged app.
6. Inventory adjustment berhasil dari packaged app.
7. Sync replay berhasil ke backend lokal/target.
8. App tetap memberi pesan jelas saat backend offline.
9. Installer/package memuat Electron files, renderer output, preload, local schema, dan SQLite dependency.
10. Smoke test desktop dicatat di `.agents/sessionHandoff.md`.

## Risiko dan Mitigasi

| Risiko                                              | Mitigasi                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Next standalone tidak bisa diload dengan `loadFile` | Jalankan local Next server dari Electron main atau gunakan static export.  |
| SQLite binary tidak ada di mesin user               | Bundle binary atau gunakan native package yang dipaketkan dengan Electron. |
| Renderer mencoba akses local store dari browser     | Selalu cek bridge dan tampilkan fallback.                                  |
| Port local server bentrok                           | Gunakan port dinamis/internal dan health check.                            |
| File DB berada di path read-only                    | Simpan DB di app user data/writable directory.                             |
| Native module tidak cocok Electron ABI              | Tambahkan rebuild/package step untuk Electron.                             |

## Rule untuk Implementasi Berikutnya

- Jangan menambahkan fitur POS yang hanya bekerja di browser web.
- Semua fitur local-first harus melewati Electron bridge.
- Setiap perubahan local store harus diuji minimal di `dev:desktop`.
- Packaging final wajib punya task eksplisit, bukan diasumsikan dari `next build`.
