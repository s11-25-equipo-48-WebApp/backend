# HU-012 – Generar Embed

Epica: API Pública y Embebidos
Estado: Sin empezar
Prioridad: Media
Rol: Editor

**Como** editor,

**quiero** generar un código *embed* para un testimonio,

**para** insertarlo fácilmente en otros sitios web.

**Criterios de aceptación:**

- **Endpoint:** `GET /api/public/embed/:id`
- **Funcionalidad:**
    - Devuelve un pequeño bloque HTML que permita mostrar el testimonio en sitios externos.
    - Ejemplo:
        
        ```html
        <iframesrc="https://cms.edu/testimonios/embed/123"
          width="600"
          height="400"
          frameborder="0"
          allowfullscreen>
        </iframe>
        
        ```
        
- **Configuraciones opcionales por query params:**
    - `width` (por defecto 600 px)
    - `theme` (light/dark)
    - `autoplay` (solo si es video)
- **Seguridad:**
    - Solo permite testimonios con estado `aprobado`.
    - No incluye scripts, solo HTML básico y contenido controlado (texto, imagen o video).
    - No se renderiza HTML del usuario, así que no hay riesgo XSS.
- **Respuesta:**
    - `200 OK` con el snippet HTML listo para copiar/pegar.