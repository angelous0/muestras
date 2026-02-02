# PRD - Módulo Muestras Textil v2.3

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo para gestionar catálogos base, muestras y bases con sus archivos asociados.

## Arquitectura
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: MongoDB con 9 colecciones
- **Almacenamiento**: Cloudflare R2 (S3-compatible)

## Integración Cloudflare R2
- **Bucket**: muestras
- **Endpoint**: https://250ad6553555f2b70048aff3d363c852.r2.cloudflarestorage.com
- **Características**:
  - Subida automática de archivos a R2
  - URLs presigned para descarga segura
  - Fallback a almacenamiento local si R2 no está configurado
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
| Muestras Base | nombre (auto-generado), marca_id, tipo_producto_id, entalle_id, tela_id, consumo_tela, costo_estimado (S/), precio_estimado (S/), rentabilidad_esperada (auto-calculada), aprobado, archivo_costos |
| Bases | nombre (auto-generado), muestra_base_id, hilo_id, patron_archivo, imagen_archivo, fichas_archivos[], fichas_nombres[], tizados_archivos[], tizados_nombres[], aprobado |
| Fichas | nombre, archivo, descripcion |
| Tizados | nombre, ancho, curva, archivo_tizado |

## Funcionalidades Implementadas
- ✅ Dashboard con estadísticas de 9 tablas
- ✅ CRUD completo para todas las tablas
- ✅ Búsqueda por nombre
- ✅ Filtro por estado activo/inactivo
- ✅ Relaciones entre tablas (selects dinámicos)
- ✅ Upload de archivos a Cloudflare R2
- ✅ Cálculo automático de rentabilidad
- ✅ Drag-and-drop para reordenar catálogos base
- ✅ Popup rediseñado para Fichas y Tizados
- ✅ Columnas redimensionables en Muestras Base y Bases
- ✅ **Integración Cloudflare R2 para almacenamiento** (v2.3)

## Completado en esta sesión (v2.3) - 2026-02-02
- ✅ Configuración de credenciales R2 en backend/.env
- ✅ Cliente boto3 para conexión S3-compatible
- ✅ Función `save_upload_file` actualizada para R2
- ✅ Generación de URLs presigned para descarga
- ✅ Endpoint `/api/files/{category}/{filename}` con redirección a R2
- ✅ Frontend compatible con rutas r2://

## Variables de Entorno (backend/.env)
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
R2_ACCOUNT_ID="250ad6553555f2b70048aff3d363c852"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="muestras"
```

## Backlog Pendiente

### P1 - Alta Prioridad
- [ ] Campo "Clasificación" en Telas con historial de valores (autocomplete)
- [ ] Unificar diseño de toda la aplicación según página de Telas

### P2 - Media Prioridad
- [ ] Vista detallada de Muestra Base con relaciones expandidas
- [ ] Exportación a Excel
- [ ] Importación masiva desde Excel
- [ ] Preview de imágenes en Bases

### P3 - Baja Prioridad
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Reportes de rentabilidad
- [ ] Dashboard con gráficos
- [ ] Historial de cambios

## Fecha de Implementación
- v1.0: 2026-02-02 (5 tablas base)
- v2.0: 2026-02-02 (4 tablas adicionales + archivos + drag-and-drop)
- v2.1: 2026-02-02 (Rediseño popups Fichas/Tizados)
- v2.2: 2026-02-02 (Columnas redimensionables)
- v2.3: 2026-02-02 (Integración Cloudflare R2)
