# HU-014 – Integración con YouTube

Epica: Integraciones Externas
Estado: Sin empezar
Prioridad: Media
Rol: Sistema

**Como** sistema,

**quiero** validar y almacenar metadatos de videos de YouTube,

**para** asegurar que los embeds sean correctos y vigentes.

**Criterios de aceptación:**

- Validación mediante API de YouTube.
- Guardar: título, duración, thumbnail, estado.
- Si el video no existe → `broken_media = true`.
- Revisión automática: job programado (cron) que revalida medios cada 24h.