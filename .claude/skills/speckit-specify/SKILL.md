---
name: speckit-specify
description: Crea o actualiza el `spec.md` de una feature en `specs/NNN-<slug>/`. Úsalo cuando el usuario describe una nueva capacidad ("quiero que…", "necesitamos…"). Genera el folder numerado y rellena `spec.md` usando `.specify/templates/spec-template.md`. NO escribe código; solo el contrato.
---

# speckit-specify

## Cuándo usarlo
- Al inicio de cualquier feature nueva. SDD: si no hay `spec.md`, no hay código.
- Cuando el alcance de una feature cambia y el contrato necesita actualización.

## Qué hace
1. Confirma el nombre de la feature con el usuario (1–4 palabras).
2. Crea el folder con el siguiente número disponible:
   ```bash
   .specify/scripts/bash/create-new-feature.sh "Nombre"
   # o en Windows:
   pwsh .specify/scripts/powershell/create-new-feature.ps1 "Nombre"
   ```
3. Edita `specs/NNN-slug/spec.md` rellenando cada sección del template.
   - Marca con `?` toda decisión sin resolver. NO inventar.
   - Para roles/permisos, consulta `@haku/auth.Role` (visitor/editor/admin).
4. Lee la constitución (`.specify/memory/constitution.md`) y verifica que la feature
   no la viole (si la viola, replantear el alcance o registrar un ADR).
5. Reporta al usuario qué quedó decidido y qué quedó como `?`.

## Reglas duras
- No escribir `plan.md` ni `tasks.md` desde acá. Eso es `speckit-plan`/`speckit-tasks`.
- No tocar código de `core/`, `auth/`, `events/`, `shared/`, `web/` desde este skill.
- Validar que cada módulo afectado en §7 del spec respete la frontera modular.
