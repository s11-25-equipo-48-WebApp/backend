# 📝 Sistema de Embed de Testimonios - Documentación

## 🎯 Descripción

Sistema de incrustación de testimonios estilo YouTube que permite a los usuarios copiar y pegar código iframe para mostrar testimonios en sus sitios web.

## 🚀 Características

- ✅ Embed de testimonios individuales
- ✅ Embed de múltiples testimonios de una organización
- ✅ Soporte para videos (YouTube, Vimeo) e imágenes
- ✅ Tema claro/oscuro
- ✅ Autoplay de videos
- ✅ Responsive design
- ✅ Sin dependencias de entidades adicionales
- ✅ Seguridad XSS

## 📋 Endpoints Disponibles

### 1. Obtener código iframe de un testimonio individual

**GET** `/api/v1/api/public/embed/code/testimonio/:id`

**Parámetros de consulta:**
- `organizationId` (string, requerido): ID de la organización
- `width` (string, opcional): Ancho en px (default: "600")
- `height` (string, opcional): Alto en px (default: "400")
- `theme` (string, opcional): "light" o "dark" (default: "light")
- `autoplay` (boolean, opcional): Reproducir video automáticamente (default: false)
- `showAvatar` (boolean, opcional): Mostrar avatar del autor (default: true)
- `showVehicle` (boolean, opcional): Mostrar información del vehículo (default: true)

**Ejemplo de uso:**
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/testimonio/123e4567-e89b-12d3-a456-426614174000?organizationId=abc123&width=800&theme=dark&autoplay=true"
```

**Respuesta:**
```html
<iframe
  src="http://localhost:3002/api/v1/api/public/embed/content/123e4567-e89b-12d3-a456-426614174000?organizationId=abc123&width=800&height=400&theme=dark&autoplay=true"
  width="800"
  height="400"
  frameborder="0"
  allowfullscreen
  loading="lazy"
  style="border: 1px solid #555; border-radius: 8px;"
></iframe>
```

---

### 2. Obtener código iframe de testimonios de una organización

**GET** `/api/v1/api/public/embed/code/organization/:organizationId/testimonios`

**Parámetros de consulta:**
- `width` (string, opcional): Ancho en px (default: "600")
- `height` (string, opcional): Alto en px (default: "600")
- `theme` (string, opcional): "light" o "dark" (default: "light")

**Ejemplo de uso:**
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/organization/abc123/testimonios?width=900&theme=light"
```

**Respuesta:**
```html
<iframe
  src="http://localhost:3002/api/v1/api/public/embed/organization/abc123/testimonios?width=900&height=600&theme=light"
  width="900"
  height="600"
  frameborder="0"
  loading="lazy"
  style="border: 1px solid #ccc; border-radius: 8px;"
></iframe>
```

---

### 3. Renderizar contenido de un testimonio (usado por el iframe)

**GET** `/api/v1/api/public/embed/content/:id`

Este endpoint es llamado automáticamente por el iframe. No debe ser llamado directamente.

---

### 4. Renderizar contenido de testimonios de organización (usado por el iframe)

**GET** `/api/v1/api/public/embed/organization/:organizationId/testimonios`

Este endpoint es llamado automáticamente por el iframe. No debe ser llamado directamente.

---

### 5. Obtener datos de testimonios en JSON (utilidad)

**GET** `/api/v1/api/public/embed/data/organization/:organizationId/testimonios`

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Excelente servicio",
      "body": "Mi experiencia fue increíble...",
      "author_name": "Juan Pérez",
      "author_email": "juan@example.com",
      "media_url": "https://youtube.com/watch?v=...",
      "media_type": "video",
      "created_at": "2024-12-09T10:30:00Z"
    }
  ]
}
```

---

### 6. Obtener datos de un testimonio individual en JSON

**GET** `/api/v1/api/public/embed/data/testimonio/:id?organizationId=abc123`

---

## 💻 Ejemplos de Implementación

### Ejemplo 1: Incrustar un testimonio individual

```html
<!DOCTYPE html>
<html>
<head>
    <title>Testimonios</title>
</head>
<body>
    <h1>Lo que dicen nuestros clientes</h1>
    
    <!-- Copiar y pegar el código del endpoint /code/testimonio/:id -->
    <iframe
      src="http://localhost:3002/api/v1/api/public/embed/content/123e4567-e89b-12d3-a456-426614174000?organizationId=abc123&width=600&height=400&theme=light&autoplay=false"
      width="600"
      height="400"
      frameborder="0"
      allowfullscreen
      loading="lazy"
      style="border: 1px solid #ccc; border-radius: 8px;"
    ></iframe>
</body>
</html>
```

### Ejemplo 2: Incrustar múltiples testimonios

```html
<!DOCTYPE html>
<html>
<head>
    <title>Todos los Testimonios</title>
</head>
<body>
    <h1>Testimonios de nuestros clientes</h1>
    
    <!-- Copiar y pegar el código del endpoint /code/organization/:id/testimonios -->
    <iframe
      src="http://localhost:3002/api/v1/api/public/embed/organization/abc123/testimonios?width=900&height=600&theme=light"
      width="900"
      height="600"
      frameborder="0"
      loading="lazy"
      style="border: 1px solid #ccc; border-radius: 8px;"
    ></iframe>
</body>
</html>
```

### Ejemplo 3: Tema oscuro con autoplay

```html
<iframe
  src="http://localhost:3002/api/v1/api/public/embed/content/123e4567-e89b-12d3-a456-426614174000?organizationId=abc123&width=700&height=500&theme=dark&autoplay=true"
  width="700"
  height="500"
  frameborder="0"
  allowfullscreen
  loading="lazy"
  style="border: 1px solid #555; border-radius: 8px;"
></iframe>
```

---

## 🎨 Personalización

### Parámetros disponibles:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `width` | string | "600" | Ancho del iframe en píxeles |
| `height` | string | "400" | Alto del iframe en píxeles |
| `theme` | "light" \| "dark" | "light" | Tema visual |
| `autoplay` | boolean | false | Reproducción automática de videos |
| `showAvatar` | boolean | true | Mostrar avatar del autor |
| `showVehicle` | boolean | true | Mostrar info del vehículo/título |
| `organizationId` | string | - | ID de la organización (requerido) |

---

## 🔒 Seguridad

- ✅ Validación de parámetros de entrada
- ✅ Escape de HTML para prevenir XSS
- ✅ Solo muestra testimonios aprobados (`status = APROBADO`)
- ✅ Headers CORS configurados
- ✅ No requiere autenticación (endpoints públicos)

---

## 🧪 Testing con cURL

### 1. Obtener código iframe:
```bash
curl -X GET "http://localhost:3002/api/v1/api/public/embed/code/testimonio/TU_TESTIMONIO_ID?organizationId=TU_ORG_ID&theme=dark&width=800"
```

### 2. Ver contenido renderizado:
```bash
curl -X GET "http://localhost:3002/api/v1/api/public/embed/content/TU_TESTIMONIO_ID?organizationId=TU_ORG_ID&theme=light"
```

### 3. Obtener datos JSON:
```bash
curl -X GET "http://localhost:3002/api/v1/api/public/embed/data/organization/TU_ORG_ID/testimonios"
```

---

## 📱 Responsive Design

El sistema incluye CSS responsive automático:

```css
@media (max-width: 600px) {
    /* Ajustes automáticos para móviles */
    body {
        padding: 10px;
    }
    .testimonial-card {
        padding: 15px;
    }
}
```

---

## 🎥 Soporte de Videos

### YouTube:
- ✅ URLs estándar: `https://youtube.com/watch?v=VIDEO_ID`
- ✅ URLs cortas: `https://youtu.be/VIDEO_ID`
- ✅ URLs embed: `https://youtube.com/embed/VIDEO_ID`

### Vimeo:
- ✅ URLs estándar: `https://vimeo.com/VIDEO_ID`

Los videos se convierten automáticamente a formato embed con los parámetros correctos.

---

## 🛠️ Variables de Entorno

Asegúrate de configurar en tu `.env`:

```env
API_URL=http://localhost:3002
```

Esta URL se usa para generar los enlaces de los iframes.

---

## 📝 Notas Importantes

1. **Sin entidades adicionales**: El sistema solo usa la entidad `Testimonio` existente
2. **Estado de aprobación**: Solo se muestran testimonios con `status = APROBADO`
3. **URLs públicas**: Todos los endpoints son públicos y no requieren autenticación
4. **Carga diferida**: Los iframes usan `loading="lazy"` para mejor rendimiento
5. **Headers CORS**: Configurados para permitir embed desde cualquier dominio

---

## 🐛 Troubleshooting

### El iframe no se muestra:
- Verifica que la URL de la API sea correcta
- Verifica que el testimonio esté aprobado
- Verifica que el `organizationId` sea correcto
- Revisa la consola del navegador por errores

### Los videos no se reproducen:
- Verifica que la URL del video sea válida
- Asegúrate que la URL sea de YouTube o Vimeo
- Revisa las políticas de autoplay del navegador

### Tema no se aplica:
- Verifica que el parámetro `theme` sea "light" o "dark"
- Limpia la caché del navegador
- Verifica que no haya CSS externo sobreescribiendo los estilos

---

## 📞 Soporte

Para reportar problemas o solicitar nuevas características, contacta al equipo de desarrollo.

---

**¡Listo para usar! 🎉**
