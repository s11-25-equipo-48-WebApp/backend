# HU-002 – Editar Testimonio

Epica: Gestión de Testimonios
Estado: Sin empezar
Prioridad: Alta
Rol: Editor

**Como** editor,

**quiero** editar un testimonio existente,

**para** actualizar información o corregir errores.

**Criterios de aceptación:**

- Endpoint: `PATCH /api/v1/testimonios/:id`
- Solo el autor o `admin` puede editar.
- Campos editables: `title`, `body`, `category_id`, `tags[]`, `media_url`.
- **Auditoría:** Registrar en `audit_logs`:
    - Usuario que hizo el cambio.
    - Fecha y hora.
    - **Diff** (antes y después) de los campos modificados.
- Devuelve `200 OK` con el testimonio actualizado.