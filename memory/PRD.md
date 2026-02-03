# PRD - Módulo Muestras v3.2

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo para gestionar catálogos base, muestras y bases con sus archivos asociados.

## Arquitectura
- **Backend**: FastAPI + PostgreSQL (SQLAlchemy + asyncpg)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: PostgreSQL con schema `muestra`
- **Almacenamiento**: Cloudflare R2 (S3-compatible)
- **Autenticación**: JWT con bcrypt para hash de contraseñas
- **PDF Generation**: ReportLab (server-side)

## Integración Cloudflare R2
- **Bucket**: muestras
- **Características**:
  - Subida automática de archivos a R2
  - URLs presigned para descarga segura
  - Eliminación en cascada de archivos al eliminar registros
  - Nombres de archivo personalizables o usando nombre original

## Sistema de Autenticación (v3.0)
- **Login**: Usuario y contraseña con JWT
- **Usuarios**: username, password_hash, nombre_completo, rol, activo
- **Roles**: 
  - `admin`: Acceso completo + gestión de usuarios
  - `usuario`: Acceso a todas las funcionalidades excepto gestión de usuarios
- **Usuario por defecto**: admin / admin123

## Tablas Implementadas

### Usuarios
| Campo | Tipo |
|-------|------|
| username | String (único) |
| password_hash | String |
| nombre_completo | String |
| rol | String (admin/usuario) |
| activo | Boolean |

### Catálogo Base (7 tablas con drag-and-drop)
| Tabla | Campos |
|-------|--------|
| Marcas | nombre, descripcion, activo, orden |
| Tipo Producto | nombre, descripcion, activo, orden |
| Entalles | nombre, descripcion, activo, orden |
| Telas | nombre, gramaje, elasticidad, proveedor, ancho, color, precio, clasificacion, activo, orden |
| Hilos | nombre, activo, orden |
| Estados Costura | nombre, activo, orden |
| Avios Costura | nombre, activo, orden |

### Gestión de Muestras
| Tabla | Campos |
|-------|--------|
| Muestras Base | nombre, marca_id, tipo_producto_id, hilos, activo, orden |
| Bases | nombre, muestra_base_id, patron_archivo, fichas_archivos, fichas_nombres, tizados_archivos, tizados_nombres, estados_costura_ids, avios_costura_ids, aprobado, activo, orden |
| Fichas | base_id, nombre, archivo, tipo |
| Tizados | ancho, curva, archivo, bases_ids (many-to-many) |
| Modelos | base_id, clasificacion, activo, orden |

## Funcionalidades Completadas

### v3.2 (Febrero 2026)
- **Generación de PDF Checklist**: Se implementó la generación de PDFs en formato A6 desde el backend usando ReportLab
- **Nuevo endpoint**: `POST /api/bases/{base_id}/generate-checklist` genera y guarda PDFs de checklist
- **Integración en Bases**: Modal para seleccionar Estados/Avíos Costura con botón para generar PDF
- **Actualización automática**: Si el PDF ya existe, se reemplaza automáticamente

### v3.1
- Columnas redimensionables en Modelos
- Refactor de UI en página Modelos (nuevas columnas, nombres)
- Eliminación de funcionalidad de Imagen en Bases
- Nuevas entidades: Estados Costura y Avíos Costura

## Tareas Pendientes

### P1 - Alta Prioridad
- Campo "Clasificación" en Telas con historial/autocompletado
- Aplicar columnas redimensionables a tablas restantes

### P2 - Media Prioridad
- Unificar diseño de la aplicación
- Refactorizar BasesPage.jsx (>1500 líneas)

### Backlog
- Exportación/importación de datos con Excel

## Endpoints API

### Nuevo (v3.2)
- `POST /api/bases/{base_id}/generate-checklist` - Genera PDF checklist
  - Body: `{ items: string[], title: string }`
  - Response: `{ file_path, nombre, updated }`

### Estados/Avíos Costura
- CRUD completo en `/api/estados-costura` y `/api/avios-costura`
- Reordenamiento: `PUT /api/reorder/estados-costura` y `PUT /api/reorder/avios-costura`

## Credenciales de Prueba
- **Usuario**: admin
- **Contraseña**: admin123
