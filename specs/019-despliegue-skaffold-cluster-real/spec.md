# Feature Spec -- Despliegue Skaffold Cluster Real

> Documento de **que** se construye y **por que**. No describe como (eso va en
> `plan.md`). Leelo como contrato: cualquier ambiguedad aca se decide antes de planear.

## 1. Resumen
Configurar el pipeline de despliegue para que `skaffold run` (o un workflow de GitHub
Actions) construya la imagen Docker de la app Next.js, la suba a un registry real, y
la despliegue en un cluster Kubernetes real con las variables de entorno correctas y un
Ingress publico. El resultado observable es la app accesible en una URL publica.

## 2. Motivacion
La infraestructura de K8s esta casi lista (`skaffold.yaml`, `Dockerfile`, manifests en
`deploy/k8s/`), pero el `skaffold.yaml` actual tiene `push: false` y no hay registry ni
cluster target configurados. Sin esto la app solo corre en local y no puede ser usada
por usuarios reales de Catamarca.

## 3. Objetivos (en alcance)
- O1 -- Configurar el registry de imagenes (push: true + imagen con tag en registry real).
- O2 -- Agregar Ingress (o LoadBalancer) en los manifests K8s para exponer la app al exterior.
- O3 -- Documentar el proceso de creacion del Secret `haku-secrets` en el cluster.
- O4 -- Verificar que `skaffold run` despliega exitosamente y la app responde en la URL publica.
- O5 -- GitHub Actions workflow que dispara el deploy en push a `main`.

## 4. No-objetivos (fuera de alcance, declarados)
- N1 -- No se configura HTTPS/TLS en esta feature (se puede agregar con cert-manager despues).
- N2 -- No se migra la base de datos en el deploy (Supabase cloud es el estado; las
  migraciones se aplican manualmente con `supabase db push`).
- N3 -- No se configura CDN ni cache de assets en esta feature.
- N4 -- No se configura auto-scaling (HPA).

## 5. Usuarios y permisos
Esta feature no afecta roles de la aplicacion. Afecta unicamente a ops/devops.

| Actor | Lo que puede hacer |
|-------|-------------------|
| Developer | Ejecutar `skaffold run` para desplegar |
| CI (GitHub Actions) | Desplegar automaticamente en push a `main` (si O5 aplica) |

## 6. Comportamiento esperado

### Caso feliz
1. Developer corre `skaffold run --profile=prod` (o CI lo corre automaticamente).
2. Skaffold construye la imagen Docker con BuildKit, la sube al registry con tag del commit.
3. Skaffold aplica los manifests K8s (Deployment, Service, Ingress, CronJob).
4. El Deployment arranca el pod; el readiness probe `/api/health` pasa.
5. El Ingress enruta trafico HTTP al Service `haku-web`.
6. La app responde en la URL publica configurada.

### Edge cases
- **Secret no existe en el cluster**: el pod falla con `CreateContainerConfigError`; la
  solucion es aplicar el Secret antes con `kubectl apply -f secret.yaml`.
- **Registry auth no configurada**: `skaffold run` falla en el push; solucion: `docker login`.
- **Imagen demasiado grande**: timeout en el build; mitigacion: el Dockerfile ya usa
  multi-stage y standalone de Next.js (imagen minima ~200MB).

## 7. Contratos de modulo afectados

### `skaffold.yaml` (modificado)
- Agregar profile `prod` con `push: true` e imagen con registry real.
- Incluir `deploy/k8s/ingress.yaml` y `deploy/k8s/events-cron.yaml` en los manifests.

### `deploy/k8s/service.yaml` (modificado)
- Cambiar `type: ClusterIP` a `type: LoadBalancer`.
- Oracle Cloud OKE provisiona automaticamente un Load Balancer publico con IP externa.

### `deploy/k8s/secret.example.yaml` (ya existe, no cambia)
- Ya documenta las claves necesarias.

### `.github/workflows/deploy.yml` (nuevo, si O5 aplica)
- Trigger: push a `main`.
- Steps: checkout, auth a registry, setup kubectl, `skaffold run`.

## 8. Criterios de aceptacion
- AC1 -- `skaffold run --profile=prod` completa sin errores.
- AC2 -- La imagen esta publicada en el registry con tag del commit.
- AC3 -- `kubectl get pods` muestra el pod `haku-web` en estado `Running`.
- AC4 -- `curl http://<URL-publica>/api/health` devuelve `{ “status”: “ok” }`.
- AC5 -- El CronJob de ingesta esta registrado en el cluster (`kubectl get cronjobs`).
- AC6 -- Un push a `main` dispara el workflow de GitHub Actions y despliega automaticamente.

## 9. Riesgos y supuestos
- **Riesgo**: El cluster elegido puede tener limitaciones de red o costos inesperados.
  Mitigacion: usar tier gratuito o el mas economico disponible para una app MVP.
- **Riesgo**: El Ingress controller puede no estar instalado en el cluster.
  Mitigacion: documentar el prerequisito o usar `type: LoadBalancer` como alternativa.
- **Supuesto**: El usuario tiene acceso a un cluster Kubernetes (GKE, EKS, DigitalOcean,
  etc.) o lo puede crear.
- **Supuesto**: Supabase cloud ya esta configurado con las migraciones aplicadas.

## 10. Preguntas abiertas
Todas resueltas:
- RESUELTO **Cluster**: Oracle Cloud Always Free OKE (unica K8s managed gratis para siempre).
  Alternativa: k3s en VM Oracle Free Tier si OKE no esta disponible en la region.
- RESUELTO **Registry**: ghcr.io (GitHub Container Registry, gratis con GitHub).
- RESUELTO **Dominio**: IP publica del LoadBalancer (sin DNS). `NEXT_PUBLIC_APP_URL=http://<IP>`.
  El Service pasa de `ClusterIP` a `LoadBalancer` -- sin Ingress controller necesario.
- RESUELTO **CI/CD**: GitHub Actions en push a `main`. Workflow: checkout -> login ghcr.io
  -> build + push imagen -> kubectl apply manifests.
- RESUELTO **RESEND_API_KEY / ADMIN_EMAIL**: opcionales en el Secret; se agregan si el
  usuario quiere alertas de ingesta por email. No son bloqueantes para el deploy.

