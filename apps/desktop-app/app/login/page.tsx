import { Button } from "@omnia/ui";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Omnia Login</h1>
          <p className="mt-1 text-sm text-slate-600">
            Authentication skeleton for Sprint 0.
          </p>
        </div>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              defaultValue="cashier@omnia.local"
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              defaultValue="password"
              type="password"
            />
          </label>
          <Button type="button">Continue to shell</Button>
        </form>
      </section>
    </main>
  );
}
