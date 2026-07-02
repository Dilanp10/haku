"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  from: z.string().optional(),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // formData.get devuelve null cuando el campo no está: lo normalizamos a undefined
  // para que el `.optional()` de Zod no falle con "Expected string, received null".
  const parsed = schema.safeParse({
    email: formData.get("email") ?? undefined,
    password: formData.get("password") ?? undefined,
    from: formData.get("from") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  redirect(parsed.data.from === "admin" ? "/admin" : "/");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
