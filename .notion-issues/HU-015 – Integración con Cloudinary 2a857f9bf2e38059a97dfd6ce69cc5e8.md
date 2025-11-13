# HU-015 – Integración con Cloudinary

Epica: Integraciones Externas
Estado: Sin empezar
Prioridad: Media
Rol: Sistema

**Como** sistema,

**quiero** subir y gestionar archivos multimedia,

**para** optimizar el manejo de imágenes y videos dentro del CMS.

**Criterios de aceptación:**

- **Endpoint:** `POST /api/media/upload`
- **Funcionalidad:**
    - Recibe un archivo (`image` o `video`).
    - Lo sube directamente a Cloudinary usando sus SDK o API.
    - Devuelve:
        
        ```json
        {
          "secure_url": "...",
          "public_id": "...",
          "resource_type": "image|video"
        }
        
        ```
        
- **Validaciones:**
    - Formato permitido: JPG, PNG, MP4.
    - Tamaño máximo configurable (por ejemplo, 50 MB).
    - Verificar tipo MIME.
- **Eliminación:**
    - Si un testimonio se elimina (soft delete o hard delete), se llama directamente a la API de Cloudinary para borrar el archivo relacionado mediante su `public_id`.