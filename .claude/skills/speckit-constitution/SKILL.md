---
name: speckit-constitution
description: Lee la constitución de Haku (`.specify/memory/constitution.md`) y los principios no negociables del proyecto. Úsalo cuando una decisión técnica pueda chocar con un principio (estructura modular, RLS, dominio puro, etc.). Invoca este skill ANTES de proponer cambios estructurales o de arquitectura.
---

# speckit-constitution

## Cuándo usarlo
- Antes de cualquier refactor que cruce módulos o toque `shared`.
- Antes de proponer dependencias nuevas entre dominios.
- Cuando una sugerencia parece más simple si "rompemos un poquito la regla".
- Al revisar un PR: ¿esto respeta los 8 principios?

## Qué hace
1. Lee `.specify/memory/constitution.md` (8 principios).
2. Evalúa la acción propuesta contra cada principio relevante.
3. Si hay choque: bloquea, propone alternativa que respete el principio, o sugiere
   un cambio explícito a la constitución (que requiere commit propio + ADR en
   `docs/decisions.md`).

## Salida esperada
- Lista de principios aplicables al cambio.
- Veredicto: ✅ alineado / ⚠️ requiere ajuste / ❌ viola → alternativa.
