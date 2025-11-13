# HU-013 – Registrar Visualizaciones

Epica: Analítica
Estado: Sin empezar
Prioridad: Media
Rol: Sistema

**Como** sistema,

**quiero** registrar visualizaciones de testimonios,

**para** medir el nivel de engagement.

**Criterios de aceptación:**

- Endpoint: `POST /api/v1/analytics/track`
- Datos: `testimonio_id`, `timestamp`, `referrer`, `ip`, `device`.
- Sin autenticación.
- Anti-spam**:** limitar X visualizaciones por minuto por IP/testimonio.
- Endpoint `GET /api/analytics/summary` (solo admin) para reportes agregados.