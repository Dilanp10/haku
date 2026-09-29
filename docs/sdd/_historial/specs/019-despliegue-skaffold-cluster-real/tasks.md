# Tasks -- Despliegue Skaffold Cluster Real

> Lista accionable derivada de `plan.md`. Cada tarea: pequena, testeable, con un
> “hecho” sin ambiguedad. Marcar `[x]` al completar.

## Convenciones
- `T1`, `T2`, ... -- orden recomendado.
- `[P]` tarea paralelizable.
- `[B]` bloqueante para otras.

## Tareas

- [x] T1 [P] -- Modificar `deploy/k8s/service.yaml`: cambiar `type: ClusterIP` a
  `type: LoadBalancer`. Agregar `NEXT_PUBLIC_APP_URL` al `deploy/k8s/secret.example.yaml`
  con valor placeholder `http://<LB_EXTERNAL_IP>`.
  **Hecho cuando**: ambos archivos actualizados, YAML valido.

- [x] T2 [P] -- Modificar `skaffold.yaml`: agregar profile `prod` con imagen
  `ghcr.io/OWNER/haku-web`, `push: true`, `tagPolicy: gitCommit`, e incluir
  `deploy/k8s/events-cron.yaml` en los manifests del profile. Mantener el default
  profile (dev) sin cambios.
  **Hecho cuando**: `skaffold diagnose --profile=prod` no reporta errores de schema
  (o al menos el YAML es valido y coherente).

- [x] T3 [B] -- Crear `.github/workflows/deploy.yml`. Trigger: push a `main` +
  `workflow_dispatch`. Job `deploy`: checkout, login a ghcr.io con `GITHUB_TOKEN`
  (permissions: packages: write), build + tag + push de la imagen Docker, setup
  kubectl via secret `KUBECONFIG_B64`, `kubectl apply -f deploy/k8s/`, `kubectl set
  image` con el tag del commit, `kubectl rollout status`. Depende de T1+T2.
  **Hecho cuando**: el archivo YAML es valido y el workflow apareceria en la tab
  Actions al pushear.

- [x] T4 [P] -- Crear `deploy/README.md` con instrucciones paso a paso:
  1. Prerequisitos (cuenta Oracle Cloud, OCI CLI, kubectl).
  2. Crear cluster OKE (o alternativa k3s en VM Free Tier).
  3. Obtener kubeconfig y guardarlo como GitHub Secret `KUBECONFIG_B64`.
  4. Crear Secret `haku-secrets` en el cluster (con ejemplo de `kubectl create secret`).
  5. Primer deploy manual con `skaffold run --profile=prod`.
  6. Verificar con `kubectl get svc haku-web` y `curl http://<EXTERNAL-IP>/api/health`.
  **Hecho cuando**: el README cubre los 6 pasos y es autocontenido para alguien sin
  contexto previo.

- [ ] T5 [B] -- Verificacion manual del pipeline (requiere cluster real):
  1. Cluster OKE creado y kubeconfig configurado.
  2. Secret `haku-secrets` aplicado en el cluster.
  3. Push a `main` dispara el workflow de deploy.
  4. `kubectl get pods` muestra pod `haku-web` en `Running`.
  5. `curl http://<EXTERNAL-IP>/api/health` devuelve `{ “status”: “ok” }`.
  6. `kubectl get cronjobs` muestra `haku-events-ingest`.
  **Hecho cuando**: los 6 pasos verificados sin errores. Si no hay cluster disponible,
  esta tarea queda pendiente con nota.

## Verificacion final (definition of done)
- [x] `pnpm -r typecheck` pasa.
- [x] `pnpm -r test` pasa (29 tests).
- [ ] AC1-AC6 del spec verificados via T5 -- pendiente: requiere cluster real.
- [x] Sin migraciones nuevas.
- [x] `BACKLOG.md` actualizado si surgieron pendientes.

