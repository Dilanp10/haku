# Plan — {{FEATURE_NAME}}

> **Cómo** lo construimos. Se escribe DESPUÉS de aprobar `spec.md`. Si algo del
> spec sigue sin definir, volver al spec y cerrar la pregunta antes de planear.

## 1. Arquitectura afectada
- Módulos que cambian: `@haku/<modulo>`...
- Frontera respetada (no se cruza ningún módulo).
- Si requiere cambios en `shared`, justificar (suele ser señal de fuga).

## 2. Modelo de datos
- Tablas/columnas nuevas o modificadas (+ archivo de migración).
- Políticas RLS por tabla (lectura/escritura, por rol).

## 3. Diseño de ports y use-cases
Pseudo-código de las firmas que se agregan/cambian:
```ts
interface ...Repository { ... }
function ...UseCase(repo, input): Promise<Result<...>> { ... }
```

## 4. Diseño de infraestructura
Cómo se implementan los ports (Supabase, fetch, etc.). Mapeos fila ↔ dominio.

## 5. UI / Server Actions / route handlers (`web`)
- Rutas nuevas (`/...`) y su estrategia (RSC + ISR / dinámica).
- Server Actions: validación, autorización (`requireProfile`), `revalidatePath`.

## 6. Estrategia de tests
- Unit (use-cases con fakes de ports).
- Integración (opcional, contra Supabase local).
- Manual / smoke en la UI.

## 7. Riesgos del plan
Lo que podría salir mal en la implementación y cómo se mitiga.

## 8. Orden de implementación
Mapa de dependencias internas para que `tasks.md` se materialice ordenado.
