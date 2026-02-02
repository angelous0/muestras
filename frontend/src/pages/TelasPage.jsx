import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getTelas, createTela, updateTela, deleteTela } from '../lib/api';
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
import { Check, ChevronsUpDown } from 'lucide-react';
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
    
    // Para el historial de clasificaciones
    const [clasificaciones, setClasificaciones] = useState([]);
    const [clasificacionOpen, setClasificacionOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const response = await getTelas(params);
            setData(response.data);
            
            // Extraer clasificaciones únicas para el historial
            const uniqueClasificaciones = [...new Set(
                response.data
                    .map(t => t.clasificacion)
                    .filter(c => c && c.trim() !== '')
            )];
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

    const handleAdd = () => {
        setSelectedItem(null);
        setFormData({ activo: true });
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({ ...item });
        setFormOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

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
                <h1 
                    className="text-2xl font-bold text-slate-800"
                    style={{ fontFamily: 'Manrope' }}
                >
                    Telas
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestión del catálogo de telas
                </p>
            </div>

            <DataTable
                data={data}
                columns={tableColumns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchValue={search}
                onSearchChange={setSearch}
                filterActive={filterActive}
                onFilterChange={setFilterActive}
                loading={loading}
                emptyMessage="No hay telas registradas"
                addButtonText="Agregar"
                testIdPrefix="telas"
                showActionButtons={true}
            />

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
                            <Label className="text-sm font-medium text-slate-700">
                                Nombre <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.nombre || ''}
                                onChange={(e) => handleChange('nombre', e.target.value)}
                                placeholder="Nombre de la tela"
                                required
                                data-testid="tela-form-nombre"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Gramaje (Onzas)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.gramaje || ''}
                                    onChange={(e) => handleChange('gramaje', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Ej: 11"
                                    data-testid="tela-form-gramaje"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Elasticidad</Label>
                                <Input
                                    value={formData.elasticidad || ''}
                                    onChange={(e) => handleChange('elasticidad', e.target.value)}
                                    placeholder="Ej: 2%, 5%"
                                    data-testid="tela-form-elasticidad"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Proveedor</Label>
                                <Input
                                    value={formData.proveedor || ''}
                                    onChange={(e) => handleChange('proveedor', e.target.value)}
                                    placeholder="Ej: RICHATEX, COLORTEX"
                                    data-testid="tela-form-proveedor"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Ancho (cm)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.ancho || ''}
                                    onChange={(e) => handleChange('ancho', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Ej: 150"
                                    data-testid="tela-form-ancho"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Color</Label>
                                <Select 
                                    value={formData.color || ''} 
                                    onValueChange={(v) => handleChange('color', v)}
                                >
                                    <SelectTrigger data-testid="tela-form-color">
                                        <SelectValue placeholder="Seleccionar color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {colorOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Precio (S/)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio || ''}
                                    onChange={(e) => handleChange('precio', e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="Ej: 16.00"
                                    data-testid="tela-form-precio"
                                />
                            </div>
                        </div>

                        {/* Clasificación con historial */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Clasificación</Label>
                            <Popover open={clasificacionOpen} onOpenChange={setClasificacionOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={clasificacionOpen}
                                        className="w-full justify-between font-normal"
                                        data-testid="tela-form-clasificacion"
                                    >
                                        {formData.clasificacion || "Seleccionar o escribir clasificación"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput 
                                            placeholder="Buscar o escribir clasificación..." 
                                            value={formData.clasificacion || ''}
                                            onValueChange={(value) => handleChange('clasificacion', value)}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                <span className="text-sm text-slate-500">
                                                    Presiona Enter para usar "{formData.clasificacion}"
                                                </span>
                                            </CommandEmpty>
                                            <CommandGroup heading="Clasificaciones anteriores">
                                                {clasificaciones.map((clasificacion) => (
                                                    <CommandItem
                                                        key={clasificacion}
                                                        value={clasificacion}
                                                        onSelect={() => {
                                                            handleChange('clasificacion', clasificacion);
                                                            setClasificacionOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.clasificacion === clasificacion ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {clasificacion}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Switch
                                checked={formData.activo ?? true}
                                onCheckedChange={(checked) => handleChange('activo', checked)}
                                data-testid="tela-form-activo"
                            />
                            <span className="text-sm text-slate-600">Activo</span>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="tela-form-cancel">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700" data-testid="tela-form-submit">
                                {submitting ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={selectedItem?.nombre}
                loading={submitting}
                testIdPrefix="tela-delete"
            />
        </div>
    );
}
