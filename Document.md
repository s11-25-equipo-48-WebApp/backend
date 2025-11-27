# Documentación de Endpoints del Backend

Este documento detalla los endpoints disponibles en la API, su propósito, métodos HTTP, rutas, DTOs de entrada y roles requeridos para su acceso. Está dirigido al personal de testing y frontend para facilitar la integración y pruebas.

---

## 1. Módulo de Autenticación (`Auth`)

**Ruta Base:** `/auth`

### 1.1. `POST /auth/register`

- **Descripción:** Registra un nuevo usuario en el sistema.
- **Método:** `POST`
- **Ruta Completa:** `/auth/register`
- **Cuerpo de la Petición (Body):** `RegisterUserDto`
- Contiene los datos necesarios para registrar un usuario (e.g., email, password).
- **Roles Requeridos:** Ninguno (Público)
- **Notas:** Retorna información del usuario y tokens.

### 1.2. `POST /auth/login`

- **Descripción:** Permite a un usuario autenticarse en el sistema.
- **Método:** `POST`
- **Ruta Completa:** `/auth/login`
- **Cuerpo de la Petición (Body):** `LoginUserDto`
- Contiene las credenciales del usuario (e.g., email, password).
- **Roles Requeridos:** Ninguno (Público)
- **Notas:** Retorna un `accessToken` y datos del usuario. Establece un `refreshToken` como cookie `httpOnly`.

### 1.3. `POST /auth/logout`

- **Descripción:** Cierra la sesión del usuario actualmente autenticado.
- **Método:** `POST`
- **Ruta Completa:** `/auth/logout`
- **Cuerpo de la Petición (Body):** N/A
- **Roles Requeridos:** Autenticado (cualquier rol)
- **Notas:** Requiere un `accessToken` válido en el encabezado `Authorization` (Bearer). Elimina el `refreshToken` de las cookies.

### 1.4. `POST /auth/refresh`

- **Descripción:** Refresca el `accessToken` utilizando el `refreshToken` existente.
- **Método:** `POST`
- **Ruta Completa:** `/auth/refresh`
- **Cuerpo de la Petición (Body):** N/A
- **Roles Requeridos:** Autenticado (con `refreshToken` en cookie)
- **Notas:** Requiere un `refreshToken` válido en las cookies. Retorna un nuevo `accessToken` y `refreshToken` (establecido como cookie).

---

## 2. Módulo de Categorías (`Categories`)

**Ruta Base:** `/organizations/:organizationId/categories`

### 2.1. `GET /organizations/:organizationId/categories`

- **Descripción:** Lista todas las categorías para una organización específica.
- **Método:** `GET`
- **Ruta Completa:** `/organizations/:organizationId/categories`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`, `VISITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 2.2. `POST /organizations/:organizationId/categories`

- **Descripción:** Crea una nueva categoría dentro de una organización. El nombre de la categoría debe ser único para la organización.
- **Método:** `POST`
- **Ruta Completa:** `/organizations/:organizationId/categories`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `CreateCategoryDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 2.3. `PATCH /organizations/:organizationId/categories/:id`

- **Descripción:** Actualiza una categoría existente dentro de una organización.
- **Método:** `PATCH`
- **Ruta Completa:** `/organizations/:organizationId/categories/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID de la categoría a actualizar.
- **Cuerpo de la Petición (Body):** `UpdateCategoryDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 2.4. `DELETE /organizations/:organizationId/categories/:id`

- **Descripción:** Elimina una categoría de una organización. Si hay testimonios asociados, se pueden reasignar a otra categoría.
- **Método:** `DELETE`
- **Ruta Completa:** `/organizations/:organizationId/categories/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID de la categoría a eliminar.
- **Parámetros de Consulta (Query):**
- `reassign_to` (UUID, opcional): ID de la categoría destino para reasignar testimonios.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`
- **Notas:** Requiere autenticación con `accessToken`.

---

## 3. Módulo de Organización (`Organization`)

**Ruta Base:** `/organization`

### 3.1. `GET /organization/my-organizations`
- **Descripción:** Obtiene una lista de todas las organizaciones a las que pertenece el usuario autenticado.
- **Método:** `GET`
- **Ruta Completa:** `/organization/my-organizations`
- **Cuerpo de la Petición (Body):** N/A
- **Roles Requeridos:** Autenticado (cualquier rol)
- **Notas:** Requiere autenticación con `accessToken` válido en el encabezado `Authorization` (Bearer). Retorna un array de `OrganizationMemberDto` con los detalles de las organizaciones del usuario.

### 3.2. `POST /organization`

- **Descripción:** Crea una nueva organización y asigna al usuario que la crea a ella.
- **Método:** `POST`
- **Ruta Completa:** `/organization`
- **Cuerpo de la Petición (Body):** `CreateOrganizationDto`
- **Roles Requeridos:** Autenticado (usuario sin organizaciones asignadas)
- **Notas:** Retorna la organización creada y un nuevo `accessToken`/`refreshToken`.

### 3.2. `GET /organization/:organizationId`

- **Descripción:** Obtiene los detalles de una organización específica.
- **Método:** `GET`
- **Ruta Completa:** `/organization/:organizationId`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.3. `PATCH /organization/:organizationId`

- **Descripción:** Actualiza los detalles de una organización específica.
- **Método:** `PATCH`
- **Ruta Completa:** `/organization/:organizationId`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `UpdateOrganizationDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.4. `DELETE /organization/:organizationId`

- **Descripción:** Elimina una organización específica.
- **Método:** `DELETE`
- **Ruta Completa:** `/organization/:organizationId`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.5. `POST /organization/:organizationId/members`

- **Descripción:** Agrega un miembro a una organización existente (por email).
- **Método:** `POST`
- **Ruta Completa:** `/organization/:organizationId/members`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `AddOrganizationMemberDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.6. `DELETE /organization/:organizationId/members/:userId`

- **Descripción:** Elimina un miembro de una organización específica.
- **Método:** `DELETE`
- **Ruta Completa:** `/organization/:organizationId/members/:userId`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `userId` (UUID): ID del usuario miembro a eliminar.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.7. `PATCH /organization/:organizationId/members/:userId/role`

- **Descripción:** Actualiza el rol de un miembro dentro de una organización.
- **Método:** `PATCH`
- **Ruta Completa:** `/organization/:organizationId/members/:userId/role`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `userId` (UUID): ID del usuario miembro cuyo rol se actualizará.
- **Cuerpo de la Petición (Body):** `UpdateOrganizationMemberRoleDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.8. `POST /organization/:organizationId/members/register`

- **Descripción:** Agrega un miembro (existente por ID de usuario o email) a una organización específica.
- **Método:** `POST`
- **Ruta Completa:** `/organization/:organizationId/members/register`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `CreateOrganizationMemberDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.9. `GET /organization/:organizationId/members/:userId`

- **Descripción:** Obtiene los detalles de un miembro específico de una organización.
- **Método:** `GET`
- **Ruta Completa:** `/organization/:organizationId/members/:userId`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `userId` (UUID): ID del usuario miembro.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

### 3.10. `GET /organization/:organizationId/members`

- **Descripción:** Obtiene una lista de todos los miembros de una organización específica.
- **Método:** `GET`
- **Ruta Completa:** `/organization/:organizationId/members`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`, `VISITOR` (dentro de la organización `organizationId`)
- **Notas:** Requiere autenticación con `accessToken`.

---

## 4. Módulo de Etiquetas (`Tags`)

**Ruta Base:** `/organizations/:organizationId/tags`

### 4.1. `GET /organizations/:organizationId/tags`

- **Descripción:** Lista todas las etiquetas (tags) para una organización específica.
- **Método:** `GET`
- **Ruta Completa:** `/organizations/:organizationId/tags`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`, `VISITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 4.2. `POST /organizations/:organizationId/tags`

- **Descripción:** Crea una nueva etiqueta dentro de una organización.
- **Método:** `POST`
- **Ruta Completa:** `/organizations/:organizationId/tags`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `CreateTagDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 4.3. `GET /organizations/:organizationId/tags/:id`

- **Descripción:** Obtiene una etiqueta específica por su ID.
- **Método:** `GET`
- **Ruta Completa:** `/organizations/:organizationId/tags/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID de la etiqueta.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`, `VISITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 4.4. `PATCH /organizations/:organizationId/tags/:id`

- **Descripción:** Actualiza una etiqueta existente dentro de una organización.
- **Método:** `PATCH`
- **Ruta Completa:** `/organizations/:organizationId/tags/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID de la etiqueta a actualizar.
- **Cuerpo de la Petición (Body):** `UpdateTagDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 4.5. `DELETE /organizations/:organizationId/tags/:id`

- **Descripción:** Elimina una etiqueta de una organización.
- **Método:** `DELETE`
- **Ruta Completa:** `/organizations/:organizationId/tags/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID de la etiqueta a eliminar.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`
- **Notas:** Requiere autenticación con `accessToken`.

---

## 5. Módulo de Testimonios (`Testimonios`)

**Ruta Base:** `/organizations/:organizationId/testimonios`

### 5.1. `POST /organizations/:organizationId/testimonios`

- **Descripción:** Crea un nuevo testimonio. Espera `media_url` como URL segura. Si el usuario es `ADMIN` o `SUPERADMIN`, el estado será `APROBADO` automáticamente.
- **Método:** `POST`
- **Ruta Completa:** `/organizations/:organizationId/testimonios`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Cuerpo de la Petición (Body):** `CreateTestimonioDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 5.2. `PATCH /organizations/:organizationId/testimonios/:id`

- **Descripción:** Edita campos permitidos de un testimonio. Solo el autor o un `ADMIN`/`SUPERADMIN` pueden editar. Se registra un `audit_log`.
- **Método:** `PATCH`
- **Ruta Completa:** `/organizations/:organizationId/testimonios/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID del testimonio a actualizar.
- **Cuerpo de la Petición (Body):** `UpdateTestimonioDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`, `EDITOR`
- **Notas:** Requiere autenticación con `accessToken`.

### 5.3. `PATCH /organizations/:organizationId/testimonios/:id/status`

- **Descripción:** Cambia el estado de un testimonio. Solo `ADMIN` y `SUPERADMIN` pueden realizar esta acción.
- **Método:** `PATCH`
- **Ruta Completa:** `/organizations/:organizationId/testimonios/:id/status`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID del testimonio.
- **Cuerpo de la Petición (Body):** `UpdateStatusDto`
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`
- **Notas:** Requiere autenticación con `accessToken`.

### 5.4. `DELETE /organizations/:organizationId/testimonios/:id`

- **Descripción:** Elimina lógicamente un testimonio (soft delete). Solo `ADMIN` y `SUPERADMIN` pueden realizar esta acción.
- **Método:** `DELETE`
- **Ruta Completa:** `/organizations/:organizationId/testimonios/:id`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- `id` (UUID): ID del testimonio.
- **Roles Requeridos:** `ADMIN`, `SUPERADMIN`
- **Notas:** Requiere autenticación con `accessToken`.

### 5.5. `GET /organizations/:organizationId/testimonios/public`

- **Descripción:** Obtiene una lista paginada de testimonios `APROBADOS` y públicos, opcionalmente filtrados por categoría, etiqueta y organización.
- **Método:** `GET`
- **Ruta Completa:** `/organizations/:organizationId/testimonios/public`
- **Parámetros de Ruta:**
- `organizationId` (UUID): ID de la organización.
- **Parámetros de Consulta (Query):** `GetTestimoniosQueryDto`
- Incluye parámetros como paginación, filtros por `category_id`, `tag_id`, etc.
- **Roles Requeridos:** Ninguno (Público)
- **Notas:** Si `organization_id` se pasa también en la query, debe coincidir con el `organizationId` de la ruta.
