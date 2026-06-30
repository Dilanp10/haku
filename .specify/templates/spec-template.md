# Feature Spec — {{FEATURE_NAME}}

> Documento de **qué** se construye y **por qué**. No describe cómo (eso va en
> `plan.md`). Léelo como contrato: cualquier ambigüedad acá se decide antes de planear.

## 1. Resumen
Una a tres frases. Qué construimos, para quién, y el resultado observable.

## 2. Motivación
Por qué ahora. Problema concreto, métrica/dolor de usuario o restricción de negocio.
Link a issues/conversaciones si existen.

## 3. Objetivos (en alcance)
- O1 — ...
- O2 — ...

## 4. No-objetivos (fuera de alcance, declarados)
- N1 — ...
- N2 — ...

## 5. Usuarios y permisos
| Rol | Lo que puede hacer |
|---|---|
| visitor | ... |
| editor  | ... |
| admin   | ... |

## 6. Comportamiento esperado
- Caso feliz paso a paso.
- Edge cases relevantes (vacío, duplicado, sin permisos, sin conexión, etc.).
- Errores visibles al usuario y su mensaje.

## 7. Contratos de módulo afectados
- `@haku/<modulo>` — tipos/use-cases nuevos o cambiados (firma exacta).
- Nuevas migraciones Supabase + políticas RLS en `supabase/migrations/`.

## 8. Criterios de aceptación
Lista verificable (cada ítem es un test conceptual):
- AC1 — ...
- AC2 — ...

## 9. Riesgos y supuestos
- Riesgo / mitigación.
- Supuestos que, si fallan, invalidan la spec.

## 10. Preguntas abiertas
Marcar con `?` lo que requiere decidir antes de planear.
- ?  ...
