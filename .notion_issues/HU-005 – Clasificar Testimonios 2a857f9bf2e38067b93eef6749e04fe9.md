# HU-005 – Clasificar Testimonios

Epica: Clasificación y Búsqueda
Estado: Sin empezar
Prioridad: Media
Rol: Editor

**Como** editor,

**quiero** asignar categorías y etiquetas,

**para** organizar los testimonios de forma estructurada.

**Criterios de aceptación:**

- Soporta `category_id` y `tags[]`.
- API: `GET /api/v1/categories`, `GET /api/v1/tags`.
- Relaciones:
    - `category` (uno a muchos)
    - `tags` (muchos a muchos)
- Filtrado por `category` y `tag` disponible.