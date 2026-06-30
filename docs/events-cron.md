# Cron de ingesta de eventos

La ingesta corre **fuera del request del usuario**. En dev se dispara manualmente
con `curl`; en producción se programa con un cron externo.

## Disparo manual

```bash
curl -X POST \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN" \
  http://localhost:3000/api/events/ingest
# o una sola fuente:
curl -X POST \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN" \
  "http://localhost:3000/api/events/ingest?source=demo-catamarca"
```

Respuesta: `{ fetched, inserted, updated, skipped, errors[] }`.

## Producción — opción A: Kubernetes CronJob (Cloud Code)

Ejemplo en [`deploy/k8s/events-cron.yaml`](../deploy/k8s/events-cron.yaml).
Corre cada 6 horas y postea al servicio interno con el token del Secret `haku-secrets`.

```bash
kubectl apply -f deploy/k8s/events-cron.yaml
kubectl get cronjobs
```

## Producción — opción B: Supabase scheduled function

Crear una *Edge Function* y programarla con `cron`/`pg_cron`. Útil si no hay Kubernetes
en frente. Ver docs de Supabase Edge Functions y `extensions.pg_cron`.

## Operación y reintentos
- Fuentes activas: las que tienen `event_sources.active = true`. Toggle desde Supabase
  Studio para activar/desactivar.
- Si una fuente falla, su error aparece en `summary.errors`. **No** hay auto-disable;
  el admin la desactiva cuando rompe de forma sostenida.
- Una corrida nunca produce duplicados gracias al `dedupe_hash` único (constraint en
  Postgres + dedupe dentro del lote).
- Eventos entran como `pending` y requieren moderación en `/admin/eventos` antes de
  ser públicos (`/eventos` solo muestra `published`).
