# 🎉 Sistema de Embed - Guía Rápida

## ✅ Problema Solucionado

El error `{"statusCode":400,"message":["organizationId must be a string"]}` se ha corregido. Ahora el endpoint funciona correctamente.

## 🆕 Nuevo Endpoint: Testimonios con Límite Personalizado

### Endpoint
```
GET /api/v1/api/public/embed/code/organization/{organizationId}/testimonios/limited
```

### Parámetros

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `organizationId` | string | ✅ Sí | - | ID de la organización (en URL) |
| `limit` | number | ❌ No | 5 | Cantidad de testimonios (1-20) |
| `width` | string | ❌ No | 600 | Ancho del iframe en px |
| `height` | string | ❌ No | 600 | Alto del iframe en px |
| `theme` | string | ❌ No | light | Tema: "light" o "dark" |
| `autoplay` | boolean | ❌ No | false | Autoplay de videos |
| `showAvatar` | boolean | ❌ No | true | Mostrar avatar |
| `showVehicle` | boolean | ❌ No | true | Mostrar badge de vehículo |

## 📝 Ejemplos de Uso

### 1. Obtener código para 1 testimonio
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?limit=1"
```

**Respuesta:**
```html
<iframe src="http://localhost:3002/api/v1/api/public/embed/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?width=600&height=600&theme=light&limit=1" width="600" height="600" frameborder="0" loading="lazy" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
```

### 2. Obtener código para 3 testimonios con tema oscuro
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?limit=3&theme=dark&width=800"
```

### 3. Obtener código para 10 testimonios
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?limit=10"
```

### 4. Máximo de testimonios (20)
```bash
curl "http://localhost:3002/api/v1/api/public/embed/code/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?limit=20&width=900&height=800"
```

## 🎨 Características del Diseño

Todos los testimonios mantienen el **mismo estilo bonito** que te encantó:

- ✅ Avatar con gradiente morado/azul
- ✅ Título en negrita
- ✅ Badge de vehículo con icono SVG
- ✅ Footer con fecha y badge "Verificado"
- ✅ Efecto hover (elevación de tarjeta)
- ✅ Videos de YouTube/Vimeo responsive
- ✅ Imágenes con bordes redondeados
- ✅ Tema claro y oscuro

## 📊 Comparación de Endpoints

| Endpoint | ¿Cuántos testimonios? | ¿Para qué sirve? |
|----------|----------------------|------------------|
| `/code/testimonio/:id` | 1 específico | Mostrar un testimonio exacto |
| `/code/organization/:orgId/testimonios` | Todos | Mostrar todos los testimonios |
| `/code/organization/:orgId/testimonios/limited` | 🆕 1-20 (configurable) | Mostrar N testimonios recientes |

## 🚀 Casos de Uso

### Caso 1: Mostrar solo el último testimonio en homepage
```html
<iframe src="http://localhost:3002/api/v1/api/public/embed/organization/tu-org-id/testimonios/limited?limit=1&width=600&height=400" width="600" height="400" frameborder="0" loading="lazy" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
```

### Caso 2: Sección de testimonios con los últimos 5
```html
<iframe src="http://localhost:3002/api/v1/api/public/embed/organization/tu-org-id/testimonios/limited?limit=5&width=900&height=700" width="900" height="700" frameborder="0" loading="lazy" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
```

### Caso 3: Widget lateral con 3 testimonios
```html
<iframe src="http://localhost:3002/api/v1/api/public/embed/organization/tu-org-id/testimonios/limited?limit=3&width=350&height=600&theme=light" width="350" height="600" frameborder="0" loading="lazy" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
```

## 🔧 Solución al Error del organizationId

**Antes (con error):**
```
GET /code/organization/{organizationId}/testimonios
Query: ?organizationId=abc123  ❌ organizationId duplicado
```

**Ahora (correcto):**
```
GET /code/organization/{organizationId}/testimonios
Query: ?width=600&theme=light  ✅ Sin organizationId en query
```

El `organizationId` ahora **solo va en la URL**, no en los query parameters.

## 📱 Ejemplo HTML Completo

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Testimonios</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .testimonials-section {
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <h1>Lo que dicen nuestros clientes</h1>
    
    <div class="testimonials-section">
        <!-- Mostramos los últimos 5 testimonios -->
        <iframe 
            src="http://localhost:3002/api/v1/api/public/embed/organization/ff1b87a3-4a20-4702-a506-0ced798bb9f5/testimonios/limited?limit=5&width=900&theme=light" 
            width="900" 
            height="700" 
            frameborder="0" 
            loading="lazy" 
            style="border: 1px solid #ccc; border-radius: 8px; display: block; margin: 0 auto;"
        ></iframe>
    </div>
</body>
</html>
```

## ✨ Validaciones Implementadas

- ✅ `limit` debe ser entre 1 y 20
- ✅ Si no se envía `limit`, se usa 5 por defecto
- ✅ `theme` solo acepta "light" o "dark"
- ✅ Solo muestra testimonios con `status = APROBADO`
- ✅ Ordenados por fecha (más recientes primero)

## 🎯 Resumen

Ahora tienes **3 formas** de mostrar testimonios:

1. **Un testimonio específico**: `/code/testimonio/:id`
2. **Todos los testimonios**: `/code/organization/:orgId/testimonios`
3. **🆕 N testimonios recientes**: `/code/organization/:orgId/testimonios/limited?limit=N`

¡Todos con el mismo diseño hermoso que te encantó! 🎨✨
