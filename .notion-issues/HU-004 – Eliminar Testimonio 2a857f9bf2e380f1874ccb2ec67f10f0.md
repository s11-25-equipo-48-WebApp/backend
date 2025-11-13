# HU-004 – Eliminar Testimonio

Epica: Gestión de Testimonios
Estado: Sin empezar
Prioridad: Alta
Rol: Admin

**Como** admin,

**quiero** eliminar testimonios inapropiados,

**para** mantener el repositorio limpio y confiable.

**Criterios de aceptación:**

- Endpoint: `DELETE /api/v1/testimonios/:id`
- Soft delete: se marca `deleted_at`.
- Registro en `audit_logs`.
- No debe aparecer en API pública o búsquedas.
- **Tarea asincrónica:** disparar job para limpiar medios asociados (Cloudinary).