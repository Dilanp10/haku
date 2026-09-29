# Tasks — Splash screen de inicio

## Tareas
- [x] T1 [B] — Crear `web/components/splash-screen.tsx` (client): overlay fixed z-100,
  "Haku." en `.text-brand` terracota + "vamos" en `.text-section`; timing 700/300/1000ms;
  `sessionStorage` con try/catch para mostrar solo una vez por sesión.
- [x] T2 [B] — Montar `<SplashScreen />` en `web/app/layout.tsx` dentro de `<body>`.
- [x] T3 [B] — `pnpm -r typecheck` + build + deploy + verificación manual (limpiar
  sessionStorage y recargar para confirmar que aparece y desaparece solo).

## Verificación final (definition of done)
- [x] AC1 — Aparece "Haku." + "vamos" en la primera carga de la sesión.
- [x] AC2 — Se desvanece solo en ~1s sin interacción.
- [x] AC3 — No reaparece al navegar/refrescar dentro de la misma sesión.
- [x] AC4 — `pnpm -r typecheck` pasa.
