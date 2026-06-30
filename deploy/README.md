# Deploy de Haku a Kubernetes

Guia para desplegar la app en un cluster Kubernetes real usando GitHub Actions + ghcr.io.

## Prerequisitos

- Cuenta en [Oracle Cloud](https://cloud.oracle.com) (Always Free tier incluye OKE)
- [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm) instalado
- `kubectl` instalado
- Repo en GitHub con Actions habilitado
- [Supabase](https://supabase.com) proyecto cloud creado con migraciones aplicadas (`supabase db push`)

## 1. Crear el cluster OKE

En la consola de Oracle Cloud:

1. Ir a **Developer Services > Kubernetes Clusters (OKE)**
2. Crear cluster con **Quick Create** (configura VCN, subnets y node pool automaticamente)
3. Shape: `VM.Standard.A1.Flex` (ARM, 4 OCPUs + 24 GB RAM en Free Tier)
4. Nodos: 1 (suficiente para MVP)
5. Esperar ~10 min a que el cluster este `Active`

### Alternativa: k3s en VM Free Tier

Si OKE no esta disponible en tu region:

```bash
# Crear VM con Ubuntu en Oracle Free Tier
# SSH a la VM y ejecutar:
curl -sfL https://get.k3s.io | sh -
sudo cat /etc/rancher/k3s/k3s.yaml  # este es tu kubeconfig
```

## 2. Obtener kubeconfig

```bash
# OKE: descargar kubeconfig con OCI CLI
oci ce cluster create-kubeconfig \
  --cluster-id <CLUSTER_OCID> \
  --file $HOME/.kube/config \
  --region <REGION> \
  --token-version 2.0.0

# Verificar conexion
kubectl get nodes
```

## 3. Guardar kubeconfig como GitHub Secret

```bash
# Codificar en base64
cat $HOME/.kube/config | base64 -w 0

# Ir a GitHub > Settings > Secrets and variables > Actions
# Crear secret: KUBECONFIG_B64 = <output del comando anterior>
```

## 4. Crear Secret `haku-secrets` en el cluster

```bash
kubectl create secret generic haku-secrets \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co" \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key" \
  --from-literal=EVENTS_INGEST_TOKEN="$(openssl rand -hex 32)" \
  --from-literal=NEXT_PUBLIC_APP_URL="http://<LB_EXTERNAL_IP>"
```

> Nota: `NEXT_PUBLIC_APP_URL` se puede actualizar despues de obtener la IP del
> LoadBalancer (paso 6). Para el primer deploy, usar un placeholder.

Claves opcionales (para email de alertas de ingesta):
```bash
kubectl patch secret haku-secrets --type merge -p \
  '{"stringData":{"RESEND_API_KEY":"re_...","ADMIN_EMAIL":"admin@example.com"}}'
```

## 5. Primer deploy

### Opcion A: Push a main (automatico)

Hacer push a la rama `main`. El workflow `.github/workflows/deploy.yml` se
ejecuta automaticamente: build, push a ghcr.io, kubectl apply.

### Opcion B: Deploy manual con Skaffold

```bash
# Reemplazar OWNER en skaffold.yaml con tu usuario/org de GitHub
skaffold run --profile=prod
```

## 6. Verificar

```bash
# Ver pods
kubectl get pods -l app=haku-web

# Obtener IP publica del LoadBalancer (puede tardar 1-2 min)
kubectl get svc haku-web -w

# Cuando EXTERNAL-IP aparezca:
curl http://<EXTERNAL-IP>/api/health
# Esperado: {"status":"ok"}

# Actualizar NEXT_PUBLIC_APP_URL con la IP real
kubectl patch secret haku-secrets --type merge -p \
  '{"stringData":{"NEXT_PUBLIC_APP_URL":"http://<EXTERNAL-IP>"}}'
kubectl rollout restart deployment/haku-web

# Verificar CronJob de ingesta
kubectl get cronjobs
```

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Service role key (solo servidor) |
| `EVENTS_INGEST_TOKEN` | Si | Token Bearer para el endpoint de ingesta |
| `NEXT_PUBLIC_APP_URL` | Si | URL publica de la app (IP del LB) |
| `RESEND_API_KEY` | No | API key de Resend para emails |
| `ADMIN_EMAIL` | No | Email del admin para alertas de ingesta |
| `EVENTS_SCRAPER_USER_AGENT` | No | User-Agent del scraper (default: HakuBot/0.1) |
