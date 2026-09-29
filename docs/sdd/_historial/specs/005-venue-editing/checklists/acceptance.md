# Checklist — Venue Editing

> Verificaciones manuales para cerrar la feature. Marcar `[x]` solo cuando se
> haya comprobado en vivo, no asumido.

## Funcional
- [ ] Caso feliz extremo a extremo.
- [ ] Cada edge case del `spec.md` §6 verificado.
- [ ] Mensajes de error coinciden con los del spec.

## Seguridad / RLS
- [ ] Un usuario sin sesión NO puede ver/modificar lo que no debe.
- [ ] Un usuario con sesión pero sin rol suficiente recibe `403`/no-permitido.
- [ ] `service_role` no se expone al cliente (grep del bundle).

## Datos
- [ ] Migración aplicada limpia desde un `db:reset`.
- [ ] Seed funciona con la migración nueva (si aplica).
- [ ] Índices necesarios creados.

## UX / Web
- [ ] Estados: cargando, vacío, error, sin permisos.
- [ ] Accesibilidad básica: foco, labels, contraste.
- [ ] ISR / `revalidatePath` invalidan lo correcto.
