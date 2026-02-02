# PRD - Módulo Muestras Textil

## Problema Original
Crear un módulo de muestras textil con diseño minimalista y corporativo, agradable a la vista. Incluye tablas base: Marcas, Tipo Producto, Entalle, Tela, Hilos (todas con campo Nombre).

## Decisiones del Usuario
- **Funcionalidades**: CRUD completo + búsqueda/filtros
- **Autenticación**: Sin autenticación por ahora
- **Paleta de colores**: Azul corporativo con acentos (Slate)

## Arquitectura
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de datos**: MongoDB con 5 colecciones (marcas, tipos_producto, entalles, telas, hilos)

## User Personas
- Gestores de catálogo textil
- Personal de producción de muestras
- Administradores de inventario

## Requisitos Core
1. Dashboard con estadísticas de todas las tablas
2. CRUD completo para cada tabla
3. Búsqueda por nombre
4. Filtro por estado (activo/inactivo)
5. Diseño minimalista corporativo

## Lo Implementado (Fecha: 2026-02-02)
- ✅ Backend completo con 30 endpoints REST
- ✅ Frontend con dashboard y 5 páginas CRUD
- ✅ Componentes reutilizables (DataTable, ItemFormDialog, DeleteConfirmDialog)
- ✅ Sistema de navegación con sidebar
- ✅ Diseño con tipografía Manrope/Public Sans
- ✅ Paleta Slate corporativa

## Tablas Implementadas
| Tabla | Campos Adicionales |
|-------|-------------------|
| Marcas | nombre, descripcion, activo |
| Tipo Producto | nombre, descripcion, activo |
| Entalles | nombre, descripcion, activo |
| Telas | nombre, composicion, peso_gsm, descripcion, activo |
| Hilos | nombre, color, grosor, descripcion, activo |

## Backlog Priorizado

### P0 - Próxima Fase
- [ ] Muestra Base (relaciona Marca, Tipo Producto, Entalle, Tela + costos)
- [ ] Bases (relaciona Muestra Base + archivos)
- [ ] Upload de archivos (Excel, Imágenes, PDFs)

### P1 - Futuro
- [ ] Fichas (Nombre + Archivo)
- [ ] Tizados (Ancho, Curva, Archivo)
- [ ] Cálculo de rentabilidad (fórmula precio-costo)
- [ ] Histórico de tizados

### P2 - Mejoras
- [ ] Autenticación de usuarios
- [ ] Roles y permisos
- [ ] Exportación a Excel
- [ ] Importación masiva

## Próximos Pasos
1. Implementar tabla Muestra Base con relaciones
2. Agregar upload de archivos
3. Implementar tabla Bases
