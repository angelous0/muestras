import { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    Filter,
    X,
    GripVertical
} from 'lucide-react';

const SortableRow = ({ item, columns, onEdit, onDelete, testIdPrefix, showActionButtons }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#f1f5f9' : undefined,
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            className="table-row-hover border-b border-slate-100"
            data-testid={`${testIdPrefix}-row-${item.id}`}
        >
            <TableCell className="py-3 px-2 w-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
                    data-testid={`${testIdPrefix}-drag-${item.id}`}
                >
                    <GripVertical className="h-4 w-4 text-slate-400" />
                </button>
            </TableCell>
            {columns.map((col) => (
                <TableCell 
                    key={col.key} 
                    className="py-3 px-4 text-sm text-slate-700"
                >
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                </TableCell>
            ))}
            <TableCell className="py-3 px-4">
                {showActionButtons ? (
                    <div className="flex gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-8 px-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                            data-testid={`${testIdPrefix}-edit-${item.id}`}
                        >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`${testIdPrefix}-delete-${item.id}`}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                        </Button>
                    </div>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 hover:bg-slate-100"
                                data-testid={`${testIdPrefix}-actions-${item.id}`}
                            >
                                <span className="sr-only">Acciones</span>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                </svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onDelete(item)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </TableCell>
        </TableRow>
    );
};

export const SortableDataTable = ({
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    onReorder,
    searchValue,
    onSearchChange,
    filterActive,
    onFilterChange,
    loading,
    emptyMessage = 'No hay registros',
    addButtonText = 'Agregar',
    testIdPrefix = 'table',
    showActionButtons = false
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const itemIds = useMemo(() => data.map(item => item.id), [data]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = data.findIndex(item => item.id === active.id);
            const newIndex = data.findIndex(item => item.id === over.id);
            
            const newData = arrayMove(data, oldIndex, newIndex);
            
            // Create reorder payload with new orden values
            const reorderItems = newData.map((item, index) => ({
                id: item.id,
                orden: index
            }));
            
            onReorder(newData, reorderItems);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10 bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                        data-testid={`${testIdPrefix}-search-input`}
                    />
                    {searchValue && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            data-testid={`${testIdPrefix}-clear-search`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline" 
                                className="bg-white border-slate-200 hover:bg-slate-50"
                                data-testid={`${testIdPrefix}-filter-btn`}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {filterActive === null ? 'Todos' : filterActive ? 'Activos' : 'Inactivos'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onFilterChange(null)}>
                                Todos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onFilterChange(true)}>
                                Activos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onFilterChange(false)}>
                                Inactivos
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Add Button */}
                    <Button 
                        onClick={onAdd}
                        className="bg-slate-800 hover:bg-slate-700 text-white btn-active"
                        data-testid={`${testIdPrefix}-add-btn`}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {addButtonText}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-10 px-2"></TableHead>
                                {columns.map((col) => (
                                    <TableHead 
                                        key={col.key}
                                        className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4"
                                    >
                                        {col.label}
                                    </TableHead>
                                ))}
                                <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4 w-32">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8 text-slate-500">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} className="text-center py-8 text-slate-500">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                                    {data.map((item) => (
                                        <SortableRow
                                            key={item.id}
                                            item={item}
                                            columns={columns}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            testIdPrefix={testIdPrefix}
                                            showActionButtons={showActionButtons}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>
            
            {data.length > 0 && (
                <p className="text-xs text-slate-400 flex items-center gap-1">
                    <GripVertical className="h-3 w-3" />
                    Arrastra las filas para reordenar
                </p>
            )}
        </div>
    );
};

export default SortableDataTable;
