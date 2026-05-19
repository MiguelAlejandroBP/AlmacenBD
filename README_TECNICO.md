# Documentación Técnica - Sistema AlmacenBD

## 1. Arquitectura del Sistema
El proyecto sigue una arquitectura de **Single Page Application (SPA)** desacoplada, utilizando tecnologías modernas de frontend y servicios en la nube (BaaS).

- **Frontend:** HTML5, CSS3 (Variables y Flexbox/Grid), JavaScript (ES6+ Modules).
- **Backend-as-a-Service:** Firebase (Authentication, Firestore, Storage).
- **Servicios Externos:** Cloudinary (Gestión de Imágenes), QuaggaJS (Escaneo de Barras).

## 2. Seguridad y Roles (RBAC)
Se ha implementado un sistema de **Control de Acceso Basado en Roles (RBAC)**. Los niveles definidos son:
- **Administrador:** Acceso total a usuarios, inventario y reportes.
- **Supervisor:** Gestión de inventario y visualización de bajas.
- **Usuario Estándar:** Solo lectura y registro de movimientos básicos.

*Nota: La seguridad se refuerza mediante Firebase Security Rules en el servidor.*

## 3. Funcionalidades Avanzadas (Nivel Universitario)

### 3.1 Logs de Auditoría (Traceability)
Cada acción crítica (creación, edición, eliminación) es capturada por el `logService.js`. 
- **Estructura del Log:** Usuario (Email/UID), Acción, Timestamp, Detalles técnicos y UserAgent.
- **Objetivo:** Garantizar la trazabilidad y el no-repudio de las acciones dentro del sistema.

### 3.2 Carga Masiva de Datos
Ubicado en el módulo de inventario, permite importar archivos **CSV**.
- **Procesamiento:** El sistema parsea el archivo en el cliente, valida los campos obligatorios y realiza cargas asíncronas por lotes a Firestore.
- **Campos esperados:** nombre, marca, modelo, numeroserie, responsable.

### 3.3 Búsqueda Global Inteligente
Motor de búsqueda implementado en `searchModule.js` que utiliza un algoritmo de coincidencia múltiple.
- **Lógica:** Divide la consulta en términos independientes y verifica que *todos* los términos existan en *al menos uno* de los campos del objeto (nombre, marca, responsable, etc.).

### 3.4 Escaneo Inteligente de Barras
Integración con `QuaggaJS`.
- **Flujo:** Al detectar un código, el sistema busca coincidencias en el estado local. Si no existe, lanza un prompt de confirmación para redirigir al usuario al formulario de registro con el campo S/N ya pre-completado.

## 4. Instalación y Despliegue
1. Clonar el repositorio.
2. Configurar `src/scripts/firebase.js` con las credenciales del proyecto.
3. Abrir `index.html` mediante un servidor local (Live Server recomendado).

---
*Desarrollado como prototipo de gestión de activos institucionales.*
