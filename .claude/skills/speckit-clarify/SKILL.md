---
name: speckit-clarify
description: Resuelve las preguntas marcadas con `?` en `specs/NNN-*/spec.md` antes de planear. Úsalo cuando un spec tiene huecos o cuando el plan se atascó porque algo del spec era ambiguo. Hace preguntas focales al usuario y actualiza el spec.
---

# speckit-clarify

## Cuándo usarlo
- Antes de invocar `speckit-plan` si `spec.md` tiene cualquier línea con `?`.
- Cuando, durante el plan o la implementación, aparece una ambigüedad que requiere
  decisión del usuario.

## Qué hace
1. Abre el `spec.md` de la feature en curso. Lista cada `?`.
2. Para cada uno, formula 1 pregunta concreta con 2–4 opciones razonables (con
   trade-offs). Recomendar una.
3. Tras la respuesta, reemplaza el `?` por la decisión en el spec.
4. Si la respuesta cambia el alcance, actualizar §3/§4 (objetivos/no-objetivos).

## Reglas
- Una pregunta por iteración (no abrumar al usuario).
- Si el usuario no decide, dejar el `?` y NO continuar al plan.
