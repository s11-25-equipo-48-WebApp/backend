# HU-001 – Crear Testimonio

Epica: Gestión de Testimonios
Estado: Sin empezar
Prioridad: Alta
Rol: Editor

**Como** editor,

**quiero** crear un testimonio con texto, imagen o video,

**para** registrar experiencias de usuarios y clientes.

**Criterios de aceptación:**

- Endpoint: `POST /api/v1/testimonios`
- Requiere autenticación (`editor` o `admin`).
- Recibe:
    
    `title`, `body`, `category_id`, `tags[]`, `media_url`, `media_type`, `author`, `status`.
    
- **Separación de medios:**
    
    El endpoint NO maneja carga directa. Se asume que el frontend o un endpoint previo (`/api/media/upload`) genera el `secure_url` desde Cloudinary o YouTube.
    
- Validaciones:
    - `title` y `body` son obligatorios.
    - `media_type` debe coincidir con el formato (`image`, `video`, `none`).
    - Validar existencia de la categoría y tags.
- Estado inicial: `pendiente`.
- Devuelve `201 Created` con ID y metadatos.