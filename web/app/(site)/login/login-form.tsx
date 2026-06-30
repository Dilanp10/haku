"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm({ from }: { from?: string | undefined }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="mt-6 space-y-4">
      {from ? <input type="hidden" name="from" value={from} /> : null}
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          required
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
        />
      </label>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
