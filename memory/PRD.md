# PRD - Módulo Muestras Textil v2.0

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo. 

## Arquitectura
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: MongoDB con 9 colecciones

## Tablas Implementadas

### Catálogo Base (5 tablas)
| Tabla | Campos |
|-------|--------|
| Marcas | nombre, descripcion, activo |
| Tipo Producto | nombre, descripcion, activo |
| Entalles | nombre, descripcion, activo |
| Telas | nombre, composicion, peso_gsm, descripcion, activo |
| Hilos | nombre, color, grosor, descripcion, activo |

### Gestión de Muestras (4 tablas)
| Tabla | Campos |
|-------|--------|
| Muestras Base | nombre, marca_id, tipo_producto_id, entalle_id, tela_id, consumo_tela, costo_estimado, precio_estimado, **rentabilidad_esperada** (auto-calculada), aprobado, archivo_costos |
| Bases | nombre, muestra_base_id, patron_archivo, imagen_archivo, fichas_ids[], tizados_ids[], aprobado |
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
- ✅ Checkboxes múltiples para Fichas y Tizados en Bases

## Endpoints API (51 endpoints)
- `/api/marcas` - CRUD + count
- `/api/tipos-producto` - CRUD + count
- `/api/entalles` - CRUD + count
- `/api/telas` - CRUD + count
- `/api/hilos` - CRUD + count
- `/api/muestras-base` - CRUD + count + archivo
- `/api/bases` - CRUD + count + patron + imagen
- `/api/fichas` - CRUD + count + archivo
- `/api/tizados` - CRUD + count + archivo
- `/api/upload/{category}` - Upload genérico
- `/api/files/{category}/{filename}` - Descarga
- `/api/dashboard/stats` - Estadísticas

## Backlog Restante

### P1 - Mejoras
- [ ] Vista detallada de Muestra Base con relaciones expandidas
- [ ] Exportación a Excel
- [ ] Importación masiva desde Excel
- [ ] Preview de imágenes en Bases
- [ ] Historial de cambios

### P2 - Futuro
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Reportes de rentabilidad
- [ ] Dashboard con gráficos

## Fecha de Implementación
- v1.0: 2026-02-02 (5 tablas base)
- v2.0: 2026-02-02 (4 tablas adicionales + archivos)
