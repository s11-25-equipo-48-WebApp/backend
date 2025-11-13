# HU-008 – Autenticación y Autorización

Epica: Seguridad y Roles
Estado: Sin empezar
Prioridad: Alta
Rol: CMS User

**Como** usuario del CMS,

**quiero** iniciar sesión con mis credenciales,

**para** acceder a las funciones de acuerdo a mi rol.

**Criterios de aceptación:**

- Endpoint: `POST /api/v1/auth/login` → devuelve `JWT`.
- Roles: `admin`, `editor`, `visitor`.
- Middleware para validar JWT y rol.
- Expiración de tokens: 24h.