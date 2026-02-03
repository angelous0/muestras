# PRD - Módulo Muestras v3.1

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo para gestionar catálogos base, muestras y bases con sus archivos asociados.

## Arquitectura
- **Backend**: FastAPI + PostgreSQL (SQLAlchemy + asyncpg)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: PostgreSQL con schema `muestra`
- **Almacenamiento**: Cloudflare R2 (S3-compatible)
- **Autenticación**: JWT con bcrypt para hash de contraseñas

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

### Catálogo Base (5 tablas con drag-and-drop)
| Tabla | Campos |
|-------|--------|
| Marcas | nombre, descripcion, activo, orden |
| Tipo Producto | nombre, descripcion, activo, orden |
| Entalles | nombre, descripcion, activo, orden |
| Telas | nombre, gramaje, elasticidad, proveedor, ancho, color, precio, clasificacion, activo, orden |
| Hilos | nombre, activo, orden |

### Gestión de Muestras (5 tablas)
| Tabla | Campos |
|-------|--------|
| Muestras Base | nombre, n_muestra (único), marca_id, tipo_producto_id, entalle_id, tela_id, consumo_tela, costo_estimado, precio_estimado, rentabilidad_esperada, aprobado, archivo_costos |
| Bases | nombre, muestra_base_id, patron_archivo, imagen_archivo, fichas_archivos[], fichas_nombres[], tizados_archivos[], tizados_nombres[], aprobado |
| Modelos | nombre, base_id, hilo_id, fichas_archivos[], fichas_nombres[], aprobado |
| Fichas | nombre, archivo, descripcion |
| Tizados | nombre, ancho, curva, archivo_tizado, bases_ids[] (relación M-M) |

## Funcionalidades Implementadas
- ✅ **Autenticación con JWT** (v3.0)
- ✅ **Gestión de usuarios** (v3.0) - Solo admin
- ✅ **Rutas protegidas** (v3.0)
- ✅ Dashboard con estadísticas
- ✅ CRUD completo para todas las tablas
- ✅ Búsqueda por nombre
- ✅ Filtro por estado activo/inactivo
- ✅ Relaciones entre tablas (selects dinámicos)
- ✅ Upload de archivos a Cloudflare R2
- ✅ Eliminación en cascada de archivos R2
- ✅ Nombres de archivo personalizables
- ✅ Cálculo automático de rentabilidad
- ✅ Drag-and-drop para reordenar catálogos
- ✅ Popup de Tizados con búsqueda avanzada
- ✅ Buscador de bases por nombre, marca, tipo, entalle, tela
- ✅ Columnas redimensionables en Muestras Base y Bases
- ✅ Relación M-M entre Bases y Tizados

## Completado en esta sesión (v3.1) - 2025-12
- ✅ Nueva entidad **Modelos** vinculada a Bases (refactorización de estructura de datos)
- ✅ Campo `N Muestra` único en Muestras Base con prefijo de año automático
- ✅ Fichas Generales y Tizados de la Base visibles en página de Modelos
- ✅ Impresión en formato A6 para Muestras Base
- ✅ El campo `Hilo` se movió de Bases a Modelos
- ✅ Sección "Fichas" en Bases renombrada a "Fichas Generales"

## Completado en sesión anterior (v3.0) - 2025-02
- ✅ Nombre de aplicación cambiado de "Textil Sample" a "Muestras"
- ✅ Sistema de login con usuario y contraseña
- ✅ Gestión de usuarios (CRUD) - Solo administradores
- ✅ Roles: admin y usuario
- ✅ Rutas protegidas con redirección al login
- ✅ Usuario admin creado automáticamente (admin/admin123)
- ✅ Información del usuario en sidebar con botón de logout
- ✅ Sección "Administración" visible solo para admins
- ✅ Eliminado badge "Made with Emergent"
- ✅ Eliminación en cascada de archivos en Cloudflare R2
- ✅ Archivos se guardan con nombre personalizado o nombre original
- ✅ Buscador de bases mejorado (busca por marca, tipo, entalle, tela)

## Backlog Pendiente

### P1 - Alta Prioridad
- [ ] Campo "Clasificación" en Telas con historial/autocompletado
- [ ] Columnas redimensionables en tablas restantes

### P2 - Media Prioridad
- [ ] Unificar diseño de la aplicación según página de Telas
- [ ] Exportación a Excel
- [ ] Importación masiva desde Excel

### P3 - Baja Prioridad
- [ ] Preview de imágenes en Bases
- [ ] Recuperación de contraseña

## Variables de Entorno

### backend/.env
```
DATABASE_URL="postgresql://..."
DB_SCHEMA="muestra"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="muestras"
JWT_SECRET_KEY="..." (opcional, tiene default)
```

## Credenciales por Defecto
- **Usuario**: admin
- **Contraseña**: admin123
- **Rol**: Administrador

## Historial de Versiones
- v1.0: Tablas base iniciales
- v2.0: Tablas adicionales + archivos + drag-and-drop
- v2.1: Rediseño popup Fichas
- v2.2: Columnas redimensionables
- v2.3: Integración Cloudflare R2
- v2.4: Migración a PostgreSQL + Relación M-M
- v2.5: Rediseño popup Tizados
- **v3.0**: Sistema de autenticación completo con JWT + Gestión de usuarios
