# Módulo de Muestras Textiles - PRD

## Problema Original
Aplicación full-stack para gestionar muestras textiles con CRUD para catálogos (Marcas, Tipos Producto, Entalles, Telas, Hilos, Muestras Base, Bases, Modelos), arrastrar y soltar para reordenar, subida de archivos a Cloudflare R2, generación de PDF, y sistema de historial de auditoría.

## Stack Técnico
- **Frontend:** React + Tailwind + shadcn/ui
- **Backend:** FastAPI (Python) + SQLAlchemy async
- **DB:** PostgreSQL (schema: muestra)
- **Almacenamiento:** Cloudflare R2 (boto3)
- **Auth:** JWT (passlib + python-jose)
- **DnD:** @dnd-kit/core + @dnd-kit/sortable

## Funcionalidades Implementadas

### Autenticación
- Login JWT, roles admin/usuario

### CRUDs Completos
- Marcas, Tipos Producto, Entalles, Telas, Hilos, Estados Costura, Avios Costura
- Muestras Base (con N° autoincremental, archivo costos)
- Bases (con patrón, fichas, tizados, estados/avios costura)
- Modelos (con fichas, referencia a Base)
- Tizados (con archivo, vinculación a Bases)

### Funcionalidades Avanzadas
- Drag & Drop para reordenar en todas las tablas
- Subida de archivos a R2 con eliminación en cascada
- Selectores con buscador (Muestra Base en Bases, Base en Modelos)
- Panel informativo dinámico en Modelos
- Clasificación dinámica en Modelos
- Generación de PDF (checklist)
- Sidebar colapsable
- **Descarga ZIP de Modelos:** Botón para descargar todos los archivos de un modelo (patrón, fichas generales, fichas modelo) en un ZIP organizado por carpetas

### Historial de Auditoría (COMPLETO - 2025-03-06)
- Registro de CREAR, EDITAR, ELIMINAR para todas las entidades principales
- **Eliminaciones guardan datos_completos del objeto** para restauración
- **Endpoint de restauración:** `POST /api/historial/{log_id}/restaurar`
- **Acción RESTAURAR** registrada en el historial
- **UI:** Página /historial con filtros, stats, modal de detalles legible y botón restaurar
- Badge "Restaurable" en registros de eliminación

## Backlog Priorizado

### P1
- Autocompletado para campo "Clasificación" en Telas (endpoint + Combobox)
- Completar auditoría para operaciones menores (Tizados vinculación, Fichas, reordenamiento)

### P2
- Unificar diseño visual de todas las páginas de catálogo
- Columnas redimensionables en tablas restantes

### P3 (Futuro)
- Exportación/importación Excel
- Refactorización de server.py (2500+ líneas) en módulos (routes/, models/, services/)

## Credenciales
- Usuario: admin / admin123
