"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded-md border border-destructive bg-[#FEF3F2] p-3 font-semibold text-destructive">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="field-label">
          Adresse e-mail
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required minLength={12} className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
