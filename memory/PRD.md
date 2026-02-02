# PRD - Módulo Muestras Textil v2.5

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo para gestionar catálogos base, muestras y bases con sus archivos asociados.

## Arquitectura
- **Backend**: FastAPI + PostgreSQL (SQLAlchemy + asyncpg)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: PostgreSQL con schema `muestra`
- **Almacenamiento**: Cloudflare R2 (S3-compatible)

## Integración Cloudflare R2
- **Bucket**: muestras
- **Características**:
  - Subida automática de archivos a R2
  - URLs presigned para descarga segura
  - Soporte para todos los tipos de archivo (fichas, tizados, patrones, imágenes, costos)

## Tablas Implementadas

### Catálogo Base (5 tablas con drag-and-drop para reordenar)
| Tabla | Campos |
|-------|--------|
| Marcas | nombre, descripcion, activo, orden |
| Tipo Producto | nombre, descripcion, activo, orden |
| Entalles | nombre, descripcion, activo, orden |
| Telas | nombre, gramaje, elasticidad, proveedor, ancho, color, precio, clasificacion, activo, orden |
| Hilos | nombre, activo, orden |

### Gestión de Muestras (4 tablas)
| Tabla | Campos |
|-------|--------|
| Muestras Base | nombre, marca_id, tipo_producto_id, entalle_id, tela_id, consumo_tela, costo_estimado, precio_estimado, rentabilidad_esperada, aprobado, archivo_costos |
| Bases | nombre, muestra_base_id, hilo_id, patron_archivo, imagen_archivo, fichas_archivos[], fichas_nombres[], tizados_archivos[], tizados_nombres[], aprobado |
| Fichas | nombre, archivo, descripcion |
| Tizados | nombre, ancho, curva, archivo_tizado, bases_ids[] (relación M-M) |

## Funcionalidades Implementadas
- ✅ Dashboard con estadísticas
- ✅ CRUD completo para todas las tablas
- ✅ Búsqueda por nombre
- ✅ Filtro por estado activo/inactivo
- ✅ Relaciones entre tablas (selects dinámicos)
- ✅ Upload de archivos a Cloudflare R2
- ✅ Cálculo automático de rentabilidad
- ✅ Drag-and-drop para reordenar catálogos base
- ✅ Popup rediseñado para Fichas con tabla, búsqueda y creación
- ✅ Columnas redimensionables en Muestras Base y Bases
- ✅ Migración completa a PostgreSQL
- ✅ Relación muchos-a-muchos entre Bases y Tizados
- ✅ **Popup de Tizados rediseñado** (v2.5)

## Completado en esta sesión (v2.5) - 2025-02-02
- ✅ Eliminadas columnas "#" y "Nombre" del popup de Tizados
- ✅ Popup ahora muestra: Ancho, Curva, Otras Bases, Acciones
- ✅ Buscador filtra por ancho, curva y otras bases
- ✅ Clic en "Otras Bases" abre diálogo para agregar/eliminar bases vinculadas
- ✅ Nuevo diálogo "Editar Bases del Tizado" con checkboxes
- ✅ Verificado que página /tizados carga correctamente

## Backlog Pendiente

### P1 - Alta Prioridad
- [ ] Campo "Clasificación" en Telas con historial/autocompletado
- [ ] Columnas redimensionables en tablas restantes (Marcas, Tipo Producto, Entalles, Telas, Hilos)

### P2 - Media Prioridad
- [ ] Unificar diseño de toda la aplicación según página de Telas
- [ ] Exportación a Excel
- [ ] Importación masiva desde Excel

### P3 - Baja Prioridad
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Preview de imágenes en Bases

## Variables de Entorno (backend/.env)
```
DATABASE_URL="postgresql://..."
DB_SCHEMA="muestra"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="muestras"
```

## Historial de Versiones
- v1.0: Tablas base iniciales
- v2.0: Tablas adicionales + archivos + drag-and-drop
- v2.1: Rediseño popup Fichas
- v2.2: Columnas redimensionables
- v2.3: Integración Cloudflare R2
- v2.4: Migración a PostgreSQL + Relación M-M Bases-Tizados
- v2.5: Rediseño popup Tizados con columnas Ancho/Curva/Otras Bases
