# HU-003 – Moderar Testimonios

Epica: Gestión de Testimonios
Estado: Sin empezar
Prioridad: Alta
Rol: Admin

**Como** admin,

**quiero** aprobar o rechazar testimonios pendientes,

**para** asegurar la calidad del contenido publicado.

**Criterios de aceptación:**

- Endpoint: `PATCH /api/v1/testimonios/:id/status`
- Estados: `pendiente`, `aprobado`, `rechazado`.
- Solo `admin` puede cambiar el estado.
- Registrar `approved_by`, `approved_at`.
- **Transiciones válidas:**
    - `pendiente → aprobado | rechazado`
    - `rechazado → pendiente` (solo si `admin` con permisos extendidos)
    - `aprobado → rechazado` no permitido salvo `superadmin`
- Devuelve `200 OK` con nuevo estado.