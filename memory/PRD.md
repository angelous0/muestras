# PRD - Módulo Muestras Textil v2.1

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo para gestionar catálogos base, muestras y bases con sus archivos asociados.

## Arquitectura
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: MongoDB con 9 colecciones

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
| Muestras Base | nombre (auto-generado), marca_id, tipo_producto_id, entalle_id, tela_id, consumo_tela, costo_estimado (S/), precio_estimado (S/), **rentabilidad_esperada** (auto-calculada), aprobado, archivo_costos |
| Bases | nombre (auto-generado), muestra_base_id, hilo_id, patron_archivo, imagen_archivo, **fichas_archivos[]**, **fichas_nombres[]**, **tizados_archivos[]**, **tizados_nombres[]**, aprobado |
| Fichas | nombre, archivo, descripcion |
| Tizados | nombre, ancho, curva, archivo_tizado |

## Funcionalidades Implementadas
- ✅ Dashboard con estadísticas de 9 tablas
- ✅ CRUD completo para todas las tablas
- ✅ Búsqueda por nombre
- ✅ Filtro por estado activo/inactivo
- ✅ Relaciones entre tablas (selects dinámicos)
- ✅ Upload de archivos (Excel, imágenes, patrones)
- ✅ Cálculo automático de rentabilidad: ((precio - costo) / costo) * 100
- ✅ Drag-and-drop para reordenar catálogos base
- ✅ **Popup rediseñado para Fichas y Tizados** (v2.1)
  - Formulario para crear con nombre personalizado
  - Campo de búsqueda
  - Tabla con numeración (#), nombre, badge de archivo, acciones
  - Nombres personalizados para cada archivo

## Endpoints API (55+ endpoints)
- `/api/marcas` - CRUD + count + reorder
- `/api/tipos-producto` - CRUD + count + reorder
- `/api/entalles` - CRUD + count + reorder
- `/api/telas` - CRUD + count + reorder
- `/api/hilos` - CRUD + count + reorder
- `/api/muestras-base` - CRUD + count + archivo
- `/api/bases` - CRUD + count + patron + imagen + fichas + tizados
- `/api/fichas` - CRUD + count + archivo
- `/api/tizados` - CRUD + count + archivo
- `/api/upload/{category}` - Upload genérico
- `/api/files/{category}/{filename}` - Descarga
- `/api/dashboard/stats` - Estadísticas

## Completado en esta sesión (v2.1) - 2026-02-02
- ✅ Rediseño del popup de Fichas según imagen de referencia del usuario
- ✅ Rediseño del popup de Tizados con el mismo diseño
- ✅ Soporte para nombres personalizados en fichas y tizados
- ✅ Campo de búsqueda para filtrar fichas/tizados
- ✅ Tabla con numeración secuencial y badge de tipo de archivo
- ✅ Mejoras de accesibilidad (DialogDescription)

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
