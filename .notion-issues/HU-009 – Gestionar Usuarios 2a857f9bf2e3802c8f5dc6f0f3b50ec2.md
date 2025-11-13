# HU-009 – Gestionar Usuarios

Epica: Seguridad y Roles
Estado: Sin empezar
Prioridad: Alta
Rol: Admin

**Como** admin,

**quiero** crear, editar y desactivar cuentas de usuarios,

**para** controlar quién accede al CMS.

**Criterios de aceptación:**

- Endpoints:
    - `POST /api/v1/users`
    - `PATCH /api/v1/users/:id`
    - `PATCH /api/v1/users/:id/deactivate`
- Validaciones:
    - Email único.
    - Rol obligatorio (`admin` o `editor`).