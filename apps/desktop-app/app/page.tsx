import { LoginForm } from "@/features/auth/login-form";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <section className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Omnia Login</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in to load role, branch, and register context.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
