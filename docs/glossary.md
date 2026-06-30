# Glosario

- **Haku / Haku**: nombre de la app; "vamos" en quechua. Invitación a salir y descubrir.
- **Venue (lugar)**: establecimiento descubrible (bar, café, restaurante, atractivo).
- **Category (categoría)**: clasificación principal de un venue (p.ej. *Cafetería*).
- **Food type (tipo de comida)**: etiqueta gastronómica de un venue (p.ej. *empanadas*).
- **Event (evento)**: actividad local con fecha (recital, feria, festival).
- **Event source (fuente)**: origen del que se ingieren eventos (web, iCal, API).
- **Ingesta**: proceso de scraping + normalización + dedupe que carga eventos.
- **Dedupe hash**: huella para evitar duplicados de un mismo evento entre corridas.
- **Port**: interfaz de la capa de aplicación que la infraestructura implementa.
- **Use-case**: operación de negocio que orquesta dominio + ports.
- **Composition root**: lugar (web) donde se ensamblan módulos e infraestructura.
- **RLS**: Row-Level Security de Postgres/Supabase; autorización en la base de datos.
- **ISR**: Incremental Static Regeneration de Next.js para lectura pública cacheada.
