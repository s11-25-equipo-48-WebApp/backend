# HU-011 – API Pública

Epica: API Pública y Embebidos
Estado: Sin empezar
Prioridad: Media
Rol: Desarrollador Externo

**Como** desarrollador externo,

**quiero** consultar testimonios aprobados,

**para** mostrarlos en sitios externos.

**Criterios de aceptación:**

- Endpoint: `GET /api/v1/public/testimonios`
- Devuelve solo `status = aprobado`.
- Campos expuestos: `title`, `body`, `media_url`, `author`, `tags`, `category`, `created_at`.
- No exponer: `deleted_at`, `audit_logs`, `ip`, `approved_by`.
- Rate limit por IP.
- Documentación Swagger.