import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getTelas, createTela, updateTela, deleteTela, reorderTelas } from '../lib/api';
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
} from '../components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../components/ui/popover';
import { Check, ChevronsUpDown, Search, Plus, Pencil, Trash2, Filter, X, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

const colorOptions = [
    { value: 'Azul', label: 'Azul' },
    { value: 'Negro', label: 'Negro' },
    { value: 'Color', label: 'Color' },
    { value: 'Crudo', label: 'Crudo' },
];

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'gramaje', label: 'Gramaje', render: (val) => val ? `${val}` : '-' },
    { key: 'proveedor', label: 'Proveedor', render: (val) => val || '-' },
    { key: 'color', label: 'Color', render: (val) => val || '-' },
    { key: 'clasificacion', label: 'Clasificación', render: (val) => val || '-' },
    { key: 'precio', label: 'Precio', render: (val) => val ? `S/ ${val.toFixed(2)}` : '-' },
];

const SortableRow = ({ item, onEdit, onDelete }) => {
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
        <TableRow ref={setNodeRef} style={style} className="table-row-hover border-b border-slate-100">
            <TableCell className="py-3 px-2 w-10">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
                    <GripVertical className="h-4 w-4 text-slate-400" />
                </button>
            </TableCell>
            {tableColumns.map((col) => (
                <TableCell key={col.key} className="py-3 px-4 text-sm text-slate-700">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                </TableCell>
            ))}
            <TableCell className="py-3 px-4">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 px-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
};

export default function TelasPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    const [clasificaciones, setClasificaciones] = useState([]);
    const [clasificacionOpen, setClasificacionOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const itemIds = useMemo(() => data.map(item => item.id), [data]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const response = await getTelas(params);
            setData(response.data);
            const uniqueClasificaciones = [...new Set(response.data.map(t => t.clasificacion).filter(c => c && c.trim() !== ''))];
            setClasificaciones(uniqueClasificaciones);
        } catch (error) {
            toast.error('Error al cargar las telas');
        } finally {
            setLoading(false);
        }
    }, [search, filterActive]);

    useEffect(() => {
        const debounce = setTimeout(fetchData, 300);
        return () => clearTimeout(debounce);
    }, [fetchData]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = data.findIndex(item => item.id === active.id);
            const newIndex = data.findIndex(item => item.id === over.id);
            const newData = arrayMove(data, oldIndex, newIndex);
            setData(newData);
            const reorderItems = newData.map((item, index) => ({ id: item.id, orden: index }));
            try {
                await reorderTelas(reorderItems);
            } catch (error) {
                toast.error('Error al reordenar');
                fetchData();
            }
        }
    };

    const handleAdd = () => { setSelectedItem(null); setFormData({ activo: true }); setFormOpen(true); };
    const handleEdit = (item) => { setSelectedItem(item); setFormData({ ...item }); setFormOpen(true); };
    const handleDelete = (item) => { setSelectedItem(item); setDeleteOpen(true); };
    const handleChange = (key, value) => { setFormData(prev => ({ ...prev, [key]: value })); };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateTela(selectedItem.id, formData);
                toast.success('Tela actualizada correctamente');
            } else {
                await createTela(formData);
                toast.success('Tela creada correctamente');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            await deleteTela(selectedItem.id);
            toast.success('Tela eliminada correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="telas-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>Telas</h1>
                <p className="text-slate-500 text-sm mt-1">Gestión del catálogo de telas</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar por nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 bg-white" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white">
                                <Filter className="h-4 w-4 mr-2" />
                                {filterActive === null ? 'Todos' : filterActive ? 'Activos' : 'Inactivos'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFilterActive(null)}>Todos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterActive(true)}>Activos</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterActive(false)}>Inactivos</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleAdd} className="bg-slate-800 hover:bg-slate-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />Agregar
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-10 px-2"></TableHead>
                                {tableColumns.map((col) => (
                                    <TableHead key={col.key} className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">{col.label}</TableHead>
                                ))}
                                <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4 w-32">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={tableColumns.length + 2} className="text-center py-8 text-slate-500">Cargando...</TableCell></TableRow>
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={tableColumns.length + 2} className="text-center py-8 text-slate-500">No hay telas registradas</TableCell></TableRow>
                            ) : (
                                <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                                    {data.map((item) => <SortableRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />)}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>
            {data.length > 0 && <p className="text-xs text-slate-400 flex items-center gap-1"><GripVertical className="h-3 w-3" />Arrastra las filas para reordenar</p>}

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Tela' : 'Nueva Tela'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre <span className="text-red-500">*</span></Label>
                            <Input value={formData.nombre || ''} onChange={(e) => handleChange('nombre', e.target.value)} placeholder="Nombre de la tela" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gramaje (Onzas)</Label>
                                <Input type="number" step="0.1" value={formData.gramaje || ''} onChange={(e) => handleChange('gramaje', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Ej: 11" />
                            </div>
                            <div className="space-y-2">
                                <Label>Elasticidad</Label>
                                <Input value={formData.elasticidad || ''} onChange={(e) => handleChange('elasticidad', e.target.value)} placeholder="Ej: 2%, 5%" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Proveedor</Label>
                                <Input value={formData.proveedor || ''} onChange={(e) => handleChange('proveedor', e.target.value)} placeholder="Ej: RICHATEX" />
                            </div>
                            <div className="space-y-2">
                                <Label>Ancho (cm)</Label>
                                <Input type="number" step="0.1" value={formData.ancho || ''} onChange={(e) => handleChange('ancho', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Ej: 150" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <Select value={formData.color || ''} onValueChange={(v) => handleChange('color', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar color" /></SelectTrigger>
                                    <SelectContent>
                                        {colorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Precio (S/)</Label>
                                <Input type="number" step="0.01" value={formData.precio || ''} onChange={(e) => handleChange('precio', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Ej: 16.00" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Clasificación</Label>
                            <Popover open={clasificacionOpen} onOpenChange={setClasificacionOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                                        {formData.clasificacion || "Seleccionar o escribir"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar o escribir..." value={formData.clasificacion || ''} onValueChange={(value) => handleChange('clasificacion', value)} />
                                        <CommandList>
                                            <CommandEmpty><span className="text-sm text-slate-500">Usa "{formData.clasificacion}"</span></CommandEmpty>
                                            <CommandGroup heading="Anteriores">
                                                {clasificaciones.map((c) => (
                                                    <CommandItem key={c} value={c} onSelect={() => { handleChange('clasificacion', c); setClasificacionOpen(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", formData.clasificacion === c ? "opacity-100" : "opacity-0")} />{c}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <Switch checked={formData.activo ?? true} onCheckedChange={(checked) => handleChange('activo', checked)} />
                            <span className="text-sm text-slate-600">Activo</span>
                        </div>
                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700">{submitting ? 'Guardando...' : 'Guardar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedItem?.nombre} loading={submitting} />
        </div>
    );
}
