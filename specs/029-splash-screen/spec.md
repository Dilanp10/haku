# Feature Spec — Splash screen de inicio

> Documento de **qué** se construye y **por qué**. Feature nueva, chica y acotada.

## 1. Resumen
Al abrir Haku (primera carga de la sesión del browser), se muestra brevemente una pantalla
de bienvenida con el logo "Haku." antes de mostrar el contenido, igual que morficat.

## 2. Motivación
Da una sensación de marca/carga intencional en vez de un "flash" directo al contenido,
replicando el patrón ya validado en morficat.

## 3. Objetivos (en alcance)
- O1 — Overlay fijo pantalla completa con fondo `--bg-deep`, "Haku." en serif itálica
  terracota grande y "vamos" en mono uppercase debajo.
- O2 — Se muestra solo **una vez por sesión de navegador** (`sessionStorage`), no en cada
  navegación interna ni cada vez que se refresca dentro de la misma sesión... salvo que el
  usuario cierre la pestaña/navegador.
- O3 — Timing: visible ~700ms, luego fade-out de 300ms, desmonte total al segundo.
- O4 — No bloquea la interacción una vez que empieza el fade (pointer-events-none).
- O5 — Vive en el root layout (`web/app/layout.tsx`), se aplica a toda la app.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — Splash nativo de PWA (`manifest.json` splash screens) — es un overlay en React, no
  el splash del sistema operativo al abrir la app instalada.
- N2 — Animaciones de logo (fade simple, sin transiciones de escala/logo animado).
- N3 — Mostrarlo distinto según ruta de entrada (siempre igual, en cualquier página).

## 5. Usuarios y permisos
Todos los visitantes. Sin lógica de sesión de usuario (no confundir `sessionStorage`
del browser con la sesión de auth de Supabase).

## 6. Comportamiento esperado
### Caso feliz
1. Usuario abre `https://haku20.vercel.app` por primera vez en la pestaña/sesión.
2. Ve el overlay "Haku." centrado sobre fondo oscuro por ~1 segundo, luego se desvanece.
3. Recarga la misma página o navega a otra ruta → no vuelve a aparecer (ya está en sessionStorage).
4. Cierra el navegador/pestaña y vuelve a entrar → aparece de nuevo (nueva sesión).

### Edge cases
- `sessionStorage` no disponible (raro, algunos modos privados) → el `useEffect` con
  `try/catch` implícito de la lógica de morficat; en Haku se envuelve para no romper si falla.
- JS deshabilitado → no se monta el componente cliente, la app funciona igual sin splash (no bloquea SSR).

## 7. Contratos de módulo afectados
Ninguno en `core`/`auth`/`events`/`shared`. Solo `web/`:
- Nuevo: `web/components/splash-screen.tsx` (client component).
- Modificado: `web/app/layout.tsx` (monta `<SplashScreen />` dentro del body).

## 8. Criterios de aceptación
- AC1 — Al entrar por primera vez en la sesión, se ve el overlay con "Haku." y "vamos".
- AC2 — Desaparece solo (fade + unmount) sin interacción del usuario, en ~1s.
- AC3 — No vuelve a aparecer en la misma sesión de navegador al navegar o refrescar.
- AC4 — `pnpm -r typecheck` pasa.

## 9. Riesgos y supuestos
- Timing idéntico al de morficat (700ms/300ms/1000ms) para mantener la misma sensación.
- Reutiliza tokens ya existentes en Haku (`--bg-deep`, `--terra`, `--fg-30`, `.text-brand`/`.text-section`-like), sin agregar CSS nuevo.

## 10. Preguntas abiertas
_(ninguna — implementación de referencia inspeccionada en morficat/_next chunk.)_
