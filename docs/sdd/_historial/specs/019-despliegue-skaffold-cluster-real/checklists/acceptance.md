# Checklist â€” Despliegue Skaffold Cluster Real

> Verificaciones manuales para cerrar la feature. Marcar `[x]` solo cuando se
> haya comprobado en vivo, no asumido.

## Funcional
- [ ] Caso feliz extremo a extremo.
- [ ] Cada edge case del `spec.md` Â§6 verificado.
- [ ] Mensajes de error coinciden con los del spec.

## Seguridad / RLS
- [ ] Un usuario sin sesiÃ³n NO puede ver/modificar lo que no debe.
- [ ] Un usuario con sesiÃ³n pero sin rol suficiente recibe `403`/no-permitido.
- [ ] `service_role` no se expone al cliente (grep del bundle).

## Datos
- [ ] MigraciÃ³n aplicada limpia desde un `db:reset`.
- [ ] Seed funciona con la migraciÃ³n nueva (si aplica).
- [ ] Ãndices necesarios creados.

## UX / Web
- [ ] Estados: cargando, vacÃ­o, error, sin permisos.
- [ ] Accesibilidad bÃ¡sica: foco, labels, contraste.
- [ ] ISR / `revalidatePath` invalidan lo correcto.

