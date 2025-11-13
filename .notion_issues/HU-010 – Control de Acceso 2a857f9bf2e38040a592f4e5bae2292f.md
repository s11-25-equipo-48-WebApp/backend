# HU-010 – Control de Acceso

Epica: Seguridad y Roles
Estado: Sin empezar
Prioridad: Alta
Rol: Sistema

**Como** sistema,

**quiero** aplicar reglas de permisos por rol,

**para** garantizar la seguridad de los endpoints.

**Criterios de aceptación:**

- Middleware de autorización por rol.
- Log de intentos no autorizados (IP, usuario, endpoint).
- Respuesta: `403 Forbidden` con mensaje estándar.