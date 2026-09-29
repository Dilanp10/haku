# Quickstart — Project Bootstrap

```bash
pnpm install
cp .env.example .env.local        # completar claves de Supabase
supabase start                    # stack local
pnpm db:reset                     # migraciones + seed
pnpm dev                          # http://localhost:3000
```

Verificación:
```bash
pnpm -r typecheck                 # 5/5 ✅
pnpm -r test                      # ✅
curl http://localhost:3000/api/health
```
