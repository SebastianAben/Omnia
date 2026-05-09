import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] overflow-hidden bg-surface p-4 md:grid-cols-[minmax(0,1fr)_28rem] md:p-6">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-panel md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_28%_22%,rgba(15,118,110,0.42),transparent_24rem),radial-gradient(circle_at_78%_70%,rgba(148,163,184,0.2),transparent_22rem)]" />
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-lg font-black text-slate-950">
            O
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-none tracking-[-0.06em]">
            Register cabang dan antrean transaksi.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            Masuk untuk membuka POS, shift, sinkronisasi, audit, dan data
            register sesuai role pengguna.
          </p>
        </div>
        <div className="relative grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/8 text-sm backdrop-blur">
          <div className="p-4">
            <div className="font-mono text-lg font-semibold">4.7s</div>
            <div className="mt-1 text-slate-400">pencarian</div>
          </div>
          <div className="border-x border-white/10 p-4">
            <div className="font-mono text-lg font-semibold">18</div>
            <div className="mt-1 text-slate-400">antrean sync</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-lg font-semibold">IDR</div>
            <div className="mt-1 text-slate-400">pajak lokal</div>
          </div>
        </div>
      </section>

      <section className="grid place-items-center p-2 md:p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-line/80 bg-white/90 p-6 shadow-panel backdrop-blur-xl md:p-8">
          <div>
            <div className="text-sm font-semibold text-accent">Omnia POS</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              Masuk ke register
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Gunakan akun internal untuk memuat role, cabang, dan register.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
