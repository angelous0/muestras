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
    MoreHorizontal, 
    Pencil, 
    Trash2, 
    Filter,
    X
} from 'lucide-react';

export const DataTable = ({
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    searchValue,
    onSearchChange,
    filterActive,
    onFilterChange,
    loading,
    emptyMessage = 'No hay registros',
    addButtonText = 'Agregar',
    testIdPrefix = 'table'
}) => {
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
                            <DropdownMenuItem 
                                onClick={() => onFilterChange(null)}
                                data-testid={`${testIdPrefix}-filter-all`}
                            >
                                Todos
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onFilterChange(true)}
                                data-testid={`${testIdPrefix}-filter-active`}
                            >
                                Activos
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => onFilterChange(false)}
                                data-testid={`${testIdPrefix}-filter-inactive`}
                            >
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
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            {columns.map((col) => (
                                <TableHead 
                                    key={col.key}
                                    className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4"
                                >
                                    {col.label}
                                </TableHead>
                            ))}
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4 w-20">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-slate-500">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-slate-500">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow 
                                    key={item.id} 
                                    className="table-row-hover border-b border-slate-100"
                                    data-testid={`${testIdPrefix}-row-${item.id}`}
                                >
                                    {columns.map((col) => (
                                        <TableCell 
                                            key={col.key} 
                                            className="py-3 px-4 text-sm text-slate-700"
                                        >
                                            {col.render ? col.render(item[col.key], item) : item[col.key]}
                                        </TableCell>
                                    ))}
                                    <TableCell className="py-3 px-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-slate-100"
                                                    data-testid={`${testIdPrefix}-actions-${item.id}`}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => onEdit(item)}
                                                    data-testid={`${testIdPrefix}-edit-${item.id}`}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => onDelete(item)}
                                                    className="text-red-600 focus:text-red-600"
                                                    data-testid={`${testIdPrefix}-delete-${item.id}`}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default DataTable;
