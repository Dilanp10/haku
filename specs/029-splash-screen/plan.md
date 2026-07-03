# Plan — Splash screen de inicio

## 1. Arquitectura afectada
Solo `web/`. Componente client puro (sin fetch, sin estado servidor). Sin dependencias nuevas.

## 2. Modelo de datos
Sin cambios.

## 3. Diseño de dominio, ports y use-cases
Ninguno.

## 4. Diseño de infraestructura
No aplica.

## 5. UI / Server Actions (`web`)

### `web/components/splash-screen.tsx`
```tsx
"use client";
import { useEffect, useState } from "react";

const KEY = "haku_splash_shown";

export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(KEY) !== null;
      if (!alreadyShown) sessionStorage.setItem(KEY, "1");
    } catch {
      // sessionStorage no disponible: no mostrar el splash
    }
    if (alreadyShown) {
      setMounted(false);
      return;
    }
    const t1 = setTimeout(() => setFading(true), 700);
    const t2 = setTimeout(() => setMounted(false), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "var(--bg-deep)" }}
    >
      <div className="text-center">
        <div
          className="text-brand leading-none"
          style={{ fontSize: "clamp(3.5rem,14vw,5.5rem)", color: "var(--terra)" }}
        >
          Haku.
        </div>
        <div className="text-section mt-3">vamos</div>
      </div>
    </div>
  );
}
```
Usa las utilidades ya existentes `.text-brand` (serif itálica) y `.text-section` (mono
uppercase, ya trae `letter-spacing` y color ocre — visualmente similar al `--fg-30` de
morficat; aceptable, no vale la pena crear una tercera variante solo para esto).

### `web/app/layout.tsx`
Montar `<SplashScreen />` como primer hijo dentro de `<body>`, antes del skip-link, para que
quede por encima de todo (z-[100] ya lo garantiza independientemente del orden en el DOM).

## 6. Estrategia de tests
Sin lógica de negocio testeable (es puramente de presentación/temporización). Gate:
`pnpm -r typecheck` + verificación manual (limpiar sessionStorage y recargar).

## 7. Riesgos del plan
| Riesgo | Mitigación |
|---|---|
| Hydration mismatch (estado inicial distinto server/cliente) | El overlay siempre se monta igual en el server (mounted=true, fading=false); el useEffect solo corre en cliente, no cambia el markup del primer render |
| sessionStorage bloqueado (modo privado estricto) | try/catch: si falla, se trata como "ya mostrado" y no se monta |

## 8. Orden de implementación
```
T1 [B] web/components/splash-screen.tsx
T2 [B] web/app/layout.tsx: montar <SplashScreen />
T3 [B] typecheck + build + deploy + verificación manual
```
