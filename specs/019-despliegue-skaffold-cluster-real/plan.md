# Plan -- Despliegue Skaffold Cluster Real

> Como lo construimos. Spec aprobado, preguntas cerradas.

## 1. Arquitectura afectada

Esta feature **no toca ningun modulo de codigo** (`shared/`, `core/`, `auth/`, `events/`,
`web/`). Solo modifica archivos de infraestructura y CI/CD:

- `skaffold.yaml` -- agregar profile `prod` con registry ghcr.io
- `deploy/k8s/service.yaml` -- cambiar a `LoadBalancer`
- `deploy/k8s/events-cron.yaml` -- agregar al pipeline de Skaffold
- `.github/workflows/deploy.yml` -- nuevo workflow de deploy
- `deploy/README.md` -- nueva documentacion de setup del cluster

Frontera modular intacta. Sin dependencias npm nuevas.

## 2. Modelo de datos

Sin cambios. Las migraciones se aplican manualmente con `supabase db push` en
Supabase Cloud (fuera del scope de este deploy).

## 3. Diseno de ports y use-cases

No aplica. Esta feature no tiene logica de negocio.

## 4. Diseno de infraestructura

### 4.1 Skaffold profile `prod`

El `skaffold.yaml` actual tiene `push: false` (solo local). Se agrega un profile `prod`:

```yaml
profiles:
  - name: prod
    build:
      artifacts:
        - image: ghcr.io/<owner>/haku-web
          docker:
            dockerfile: Dockerfile
      local:
        push: true
        useBuildkit: true
      tagPolicy:
        gitCommit: {}
    manifests:
      rawYaml:
        - deploy/k8s/deployment.yaml
        - deploy/k8s/service.yaml
        - deploy/k8s/events-cron.yaml
    deploy:
      kubectl: {}
```

Nota: `<owner>` se obtiene del GitHub repo (ej: `dilanperea10` o nombre de org).
El tag lo genera Skaffold automaticamente con el SHA del commit.

### 4.2 Service LoadBalancer

`deploy/k8s/service.yaml` cambia `type: ClusterIP` -> `type: LoadBalancer`.
En Oracle OKE, esto provisiona un OCI Load Balancer con IP publica.
El Service sigue mapeando `port: 80 -> targetPort: 3000`.

### 4.3 Deployment update

El deployment ya referencia `image: haku-web`. En el profile `prod`, Skaffold
reemplaza automaticamente con `ghcr.io/<owner>/haku-web:<sha>`. No hay cambio
manual necesario.

Los env vars vienen del Secret `haku-secrets` (ya configurado en deployment.yaml).
Se agrega `NEXT_PUBLIC_APP_URL` al Secret para que la app sepa su URL publica.

### 4.4 CronJob de ingesta

`events-cron.yaml` ya existe y referencia `http://haku-web/api/events/ingest`.
Solo hay que incluirlo en los manifests del profile `prod` (ya lo hacemos en 4.1).

### 4.5 GitHub Actions workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    needs: []  # el CI ya corre en ci.yml; este job asume que CI paso
    steps:
      - checkout
      - docker login ghcr.io (via GITHUB_TOKEN)
      - docker build + tag + push a ghcr.io/<owner>/haku-web:<sha>
      - setup kubectl con KUBECONFIG secreto (KUBECONFIG_B64)
      - kubectl apply -f deploy/k8s/ (deployment, service, events-cron)
      - kubectl set image (actualizar el tag de la imagen en el deployment)
      - kubectl rollout status (esperar a que el rollout complete)
```

GitHub Secrets necesarios:
- `KUBECONFIG_B64` -- kubeconfig del cluster OKE en base64

El `GITHUB_TOKEN` ya existe y tiene permisos para `ghcr.io` por defecto.

## 5. UI / Server Actions / route handlers (`web`)

No aplica. Sin cambios en la app.

## 6. Estrategia de tests

- **CI existente** (`ci.yml`): ya corre typecheck + test + integration en cada push.
  El workflow de deploy deberia correr despues de que CI pase (o ser independiente
  asumiendo que CI esta verde en main).
- **Smoke test post-deploy**: verificar `curl http://<LB-IP>/api/health` devuelve
  `{ “status”: “ok” }`.
- **No hay tests automaticos nuevos** -- la feature es infra pura.

## 7. Riesgos del plan

- **Oracle OKE no disponible en la region del usuario**: alternativa documentada en
  `deploy/README.md` (usar k3s en VM Oracle Free Tier, o DigitalOcean con free credit).
- **LoadBalancer no provisiona IP**: algunas configs de OKE requieren subnet publica.
  Documentar el prerequisito.
- **GITHUB_TOKEN sin permiso de write packages**: se necesita `permissions: packages: write`
  en el workflow.
- **Imagen build falla en CI** (arm vs amd64): el Dockerfile usa `node:22-alpine` (multi-arch).
  `ubuntu-latest` en GHA es amd64 -- OK.
- **Secret `haku-secrets` no existe**: el pod no arranca. Documentar como paso 0.

## 8. Orden de implementacion

```
T1 [P]: Modificar deploy/k8s/service.yaml -> type: LoadBalancer
    + Agregar NEXT_PUBLIC_APP_URL al secret.example.yaml
    |
T2 [P]: Modificar skaffold.yaml -> agregar profile prod con ghcr.io + events-cron
    |
T3 [B]: Crear .github/workflows/deploy.yml
    (depende de T1+T2 para que los manifests esten listos)
    |
T4 [P]: Crear deploy/README.md con instrucciones de setup del cluster
    (prerequisitos OKE, crear secret, primer deploy)
    |
T5 [B]: Verificacion manual
    (push a main, verificar que el workflow corre y los manifests son validos)
```

Nota: T5 requiere un cluster real y Supabase Cloud configurado. Es responsabilidad
del usuario completar los prerequisitos de infra antes de probar.

