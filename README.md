# Testimonial CMS ✨

[![Sector: Edtech](https://img.shields.io/badge/Sector-Edtech-blueviolet)](https://www.example.com/edtech)

## 🚀 Descripción del Proyecto

> Este proyecto es un Sistema de Gestión de Contenidos (CMS) especializado en la recopilación, organización y publicación de testimonios y casos de éxito. Está diseñado para instituciones y empresas del sector Edtech que buscan mostrar el impacto de sus programas o productos a través de historias reales. El CMS ofrece funcionalidades robustas para la curaduría, moderación y analítica de engagement, permitiendo la integración de testimonios en diversos formatos (texto, video, imagen) en sitios web externos.

## 🎯 Objetivo

> Construir un sistema CMS especializado en la gestión y publicación de testimonios y casos de éxito para sitios web e instituciones, facilitando la demostración del valor y el impacto de sus ofertas.

## 📋 Requerimientos Funcionales

***Creación y Edición:** ✍️ Permite la creación y edición de testimonios que incluyen
texto, imagen y video.

***Clasificación:** 🗂️ Los testimonios pueden ser clasificados por categorías (producto, evento, cliente, industria) para una mejor organización.
***Integración Externa:** 🔗 Ofrece embeds y una API pública para integrar fácilmente los testimonios en otras plataformas web.
***Moderación:** 🛡️ Incluye un sistema de moderación y revisión para asegurar la calidad y pertinencia del contenido antes de su publicación.
***Búsqueda Inteligente:** 🔍 Implementa un sistema de tags y búsqueda inteligente para facilitar la localización de testimonios específicos.

## ⚙️ Requerimientos Técnicos

***Manejo Multimedia:** 🖼️ Integración con APIs de YouTube y Cloudinary para la gestión eficiente de contenido multimedia (videos e imágenes).
***Roles de Usuario:** 👤 Define roles de usuario (admin, editor y visitante) para controlar el acceso y las funcionalidades dentro del CMS.
***API REST:** 🌐 Provee una API RESTful bien documentada para la consulta externa de testimonios.

## 🏛️ Entidades del Proyecto

Las principales entidades que componen el sistema son:

*`Testimonial`: Representa un testimonio individual, incluyendo su contenido (texto, imagen, video), estado de moderación, categorías y tags.
*`User`: Gestiona los usuarios del sistema con sus respectivos roles (admin, editor, visitante).
*`Category`: Permite clasificar los testimonios.
*`Tag`: Facilita la búsqueda y organización de testimonios mediante palabras clave.
*`MediaAsset`: Almacena la información de los activos multimedia (imágenes y videos) gestionados a través de Cloudinary y YouTube.
*`Embed`: Contiene la configuración para la integración de testimonios en sitios externos.
*`AnalyticsEvent`: Registra eventos de engagement y uso para analíticas.
*`AuditLog`: Mantiene un registro de las acciones importantes realizadas en el sistema.
*`AuthToken`: Gestiona los tokens de autenticación para la seguridad de la API.
*`IntegrationLog`: Registra las interacciones con servicios externos como YouTube y Cloudinary.
*`UserProfile`: Almacena información adicional del perfil de usuario.
*`TestimonialTag`: Entidad de unión para la relación muchos a muchos entre Testimonial y Tag.

## 🛠️ Tecnologías Utilizadas

Este proyecto está construido utilizando el framework **NestJS** para el backend, lo que garantiza una arquitectura robusta y escalable. La base de datos utilizada es **PostgreSQL**, gestionada a través de **TypeORM** como ORM.

### Paquetes Principales (Dependencies)

*`@nestjs/common`: Módulos comunes de NestJS.
*`@nestjs/config`: Gestión de configuración basada en variables de entorno.
*`@nestjs/core`: Componentes centrales de NestJS.
*`@nestjs/platform-express`: Adaptador de plataforma para Express.
*`@nestjs/swagger`: Integración de Swagger para la documentación de la API.
*`@nestjs/typeorm`: Integración de TypeORM con NestJS.
*`class-transformer`: Transformación de objetos a clases y viceversa.
*`class-validator`: Validación de clases.
*`nestjs-pino`: Integración del logger Pino con NestJS.
*`pg`: Cliente de PostgreSQL.
*`pino`: Logger de alto rendimiento.
*`pino-pretty`: Formateador de logs para Pino.
*`rxjs`: Librería para programación reactiva.
*`swagger-ui-express`: UI para la documentación de Swagger.
*`typeorm`: ORM para TypeScript y JavaScript.

### Paquetes de Desarrollo (DevDependencies)

*`@nestjs/cli`: Herramienta de línea de comandos de NestJS.
*`@nestjs/schematics`: Esquemas para la generación de código NestJS.
*`@nestjs/testing`: Utilidades para pruebas en NestJS.
*`@types/express`: Tipos de TypeScript para Express.
*`@types/jest`: Tipos de TypeScript para Jest.
*`@types/node`: Tipos de TypeScript para Node.js.
*`@types/supertest`: Tipos de TypeScript para Supertest.
*`jest`: Framework de pruebas unitarias y de integración.
*`prettier`: Formateador de código.
*`source-map-support`: Soporte para mapas de origen.
*`supertest`: Librería para probar APIs HTTP.
*`ts-jest`: Transformador de TypeScript para Jest.
*`ts-loader`: Cargador de TypeScript para Webpack.
*`ts-node`: Ejecutor de TypeScript para Node.js.
*`tsconfig-paths`: Soporte para rutas de módulos en TypeScript.
*`typescript`: Lenguaje de programación.

## 📜 Scripts del Proyecto

Los siguientes scripts están definidos en `package.json` para facilitar el desarrollo, la construcción, las pruebas y la gestión de la base de datos:

*`build`: Compila la aplicación NestJS para producción.
*`format`: Formatea el código fuente utilizando Prettier para mantener la consistencia del estilo.
*`start`: Inicia la aplicación NestJS.
*`start:dev`: Inicia la aplicación en modo de desarrollo con recarga en caliente (`--watch`) para una experiencia de desarrollo ágil.
*`start:debug`: Inicia la aplicación en modo de depuración con recarga en caliente, permitiendo la inspección del código.
*`start:prod`: Inicia la aplicación compilada en modo de producción.
*`lint`: Ejecuta ESLint para analizar el código, identificar problemas y aplicar correcciones automáticas.
*`test`: Ejecuta las pruebas unitarias y de integración con Jest.
*`test:watch`: Ejecuta las pruebas en modo de observación, re-ejecutando solo los tests afectados por cambios.
*`test:cov`: Ejecuta las pruebas y genera un informe de cobertura de código.
*`test:debug`: Ejecuta las pruebas en modo de depuración.
*`test:e2e`: Ejecuta las pruebas end-to-end con Jest, utilizando una configuración específica.
