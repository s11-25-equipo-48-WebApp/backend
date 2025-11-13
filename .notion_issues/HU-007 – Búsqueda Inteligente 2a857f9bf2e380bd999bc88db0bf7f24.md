# HU-007 – Búsqueda Inteligente

Epica: Clasificación y Búsqueda
Estado: Sin empezar
Prioridad: Alta
Rol: Visitante

**Como** visitante,

**quiero** buscar testimonios por palabra clave, categoría o etiqueta,

**para** encontrar contenido relevante rápidamente.

**Criterios de aceptación:**

- Endpoint: `GET /api/v1/testimonios/search?q=&category=&tag=`
- Implementación: `tsvector` en PostgreSQL (index combinado `title + body`).
- Resultados paginados (`limit`, `offset`).
- Solo devuelve testimonios `status = aprobado`.
- Ordenar por relevancia y fecha.