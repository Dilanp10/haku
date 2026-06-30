# Onboarding de admin

Al registrarse, cualquier usuario nuevo recibe rol `visitor` (trigger
`handle_new_user` en `supabase/migrations/0001_auth_profiles.sql`). Para promoverlo
manualmente a admin:

```sql
-- En Supabase Studio (local: http://127.0.0.1:54323) → SQL editor:
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'tu@email.com');
```

A partir de ese momento podés acceder a `/admin` y crear venues.

## Flujo completo en dev
```bash
supabase start                    # stack local
pnpm db:reset                     # migraciones + seed (3 venues publicados)
pnpm dev                          # http://localhost:3000

# 1. Registrate (o creá un usuario desde Studio → Authentication → Users)
# 2. Promovelo a admin con el SQL de arriba
# 3. Ingresá en /login → te lleva a /admin → "Crear lugar"
```
