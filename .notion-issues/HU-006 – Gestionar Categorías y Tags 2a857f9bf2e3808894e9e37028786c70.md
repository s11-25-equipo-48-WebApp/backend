# HU-006 – Gestionar Categorías y Tags

Epica: Clasificación y Búsqueda
Estado: Sin empezar
Prioridad: Media
Rol: Admin

**Como** admin,

**quiero** crear, editar y eliminar categorías y tags,

**para** mantener actualizada la taxonomía del sistema.

**Criterios de aceptación:**

- Endpoints:
    - `POST /api/v1/categories`, `PATCH /api/v1/categories/:id`, `DELETE /api/v1/categories/:id`
    - `POST /api/v1/tags`, `PATCH /api/v1/tags/:id`, `DELETE /api/v1/tags/:id`
- Validar unicidad de nombre.
- No eliminar categorías con testimonios asociados (bloquear o reasignar).