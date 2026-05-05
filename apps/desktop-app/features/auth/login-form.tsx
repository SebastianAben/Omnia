"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@omnia/ui";

import { useAppState } from "@/lib/app-state";
import { ApiClientError } from "@/lib/api-client";
import { loginWithPassword } from "./auth-service";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAppState((state) => state.setSession);
  const [username, setUsername] = useState("demo.cashier");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await loginWithPassword({
        username,
        password,
        deviceId: "omnia-desktop-register-01",
      });
      setSession(session);
      router.push("/pos");
    } catch (caught) {
      const message =
        caught instanceof ApiClientError
          ? caught.message
          : "Backend belum tersedia. Gunakan role switcher di shell untuk demo.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Username or email
        <input
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          onChange={(event) => setUsername(event.target.value)}
          type="text"
          value={username}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Password
        <input
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <Button disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Continue to POS"}
      </Button>
    </form>
  );
}
