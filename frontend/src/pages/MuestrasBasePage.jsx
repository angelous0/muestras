import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge, ApprovalBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getMuestrasBase, createMuestraBase, updateMuestraBase, deleteMuestraBase, 
    uploadArchivoCostos, getFileUrl,
    getMarcas, getTiposProducto, getEntalles, getTelas
} from '../lib/api';
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
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Upload, FileSpreadsheet, Download, Percent } from 'lucide-react';

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'costo_estimado', label: 'Costo', render: (val) => val ? `$${val.toFixed(2)}` : '-' },
    { key: 'precio_estimado', label: 'Precio', render: (val) => val ? `$${val.toFixed(2)}` : '-' },
    { key: 'rentabilidad_esperada', label: 'Rentabilidad', render: (val) => val ? (
        <span className={`font-medium ${val >= 30 ? 'text-emerald-600' : val >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
            {val}%
        </span>
    ) : '-' },
    { key: 'aprobado', label: 'Aprobado', render: (val) => <ApprovalBadge aprobado={val} /> },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function MuestrasBasePage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    
    // Catalogs for selects
    const [marcas, setMarcas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [entalles, setEntalles] = useState([]);
    const [telas, setTelas] = useState([]);
    
    const fileInputRef = useRef(null);

    const fetchCatalogs = async () => {
        try {
            const [marcasRes, tiposRes, entallesRes, telasRes] = await Promise.all([
                getMarcas({ activo: true }),
                getTiposProducto({ activo: true }),
                getEntalles({ activo: true }),
                getTelas({ activo: true })
            ]);
            setMarcas(marcasRes.data);
            setTiposProducto(tiposRes.data);
            setEntalles(entallesRes.data);
            setTelas(telasRes.data);
        } catch (error) {
            console.error('Error loading catalogs:', error);
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const response = await getMuestrasBase(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar las muestras');
        } finally {
            setLoading(false);
        }
    }, [search, filterActive]);

    useEffect(() => {
        fetchCatalogs();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(fetchData, 300);
        return () => clearTimeout(debounce);
    }, [fetchData]);

    const handleAdd = () => {
        setSelectedItem(null);
        setFormData({ activo: true, aprobado: false });
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
        setFormData(prev => {
            const updated = { ...prev, [key]: value };
            // Auto-calculate rentabilidad
            if (key === 'precio_estimado' || key === 'costo_estimado') {
                const precio = key === 'precio_estimado' ? value : prev.precio_estimado;
                const costo = key === 'costo_estimado' ? value : prev.costo_estimado;
                if (precio && costo && costo > 0) {
                    updated.rentabilidad_esperada = ((precio - costo) / costo * 100).toFixed(2);
                }
            }
            return updated;
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateMuestraBase(selectedItem.id, formData);
                toast.success('Muestra actualizada correctamente');
            } else {
                await createMuestraBase(formData);
                toast.success('Muestra creada correctamente');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedItem) return;
        
        try {
            await uploadArchivoCostos(selectedItem.id, file);
            toast.success('Archivo subido correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir archivo');
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            await deleteMuestraBase(selectedItem.id);
            toast.success('Muestra eliminada correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    const getCatalogName = (id, catalog) => {
        const item = catalog.find(c => c.id === id);
        return item?.nombre || '-';
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="muestras-base-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Muestras Base
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona las muestras base con costos y rentabilidad
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
                emptyMessage="No hay muestras base registradas"
                addButtonText="Nueva Muestra"
                testIdPrefix="muestras-base"
            />

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Muestra Base' : 'Nueva Muestra Base'}
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
                                placeholder="Nombre de la muestra"
                                required
                                data-testid="muestra-form-nombre"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Marca</Label>
                                <Select value={formData.marca_id || ''} onValueChange={(v) => handleChange('marca_id', v)}>
                                    <SelectTrigger data-testid="muestra-form-marca">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {marcas.map(m => (
                                            <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Tipo Producto</Label>
                                <Select value={formData.tipo_producto_id || ''} onValueChange={(v) => handleChange('tipo_producto_id', v)}>
                                    <SelectTrigger data-testid="muestra-form-tipo">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tiposProducto.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Entalle</Label>
                                <Select value={formData.entalle_id || ''} onValueChange={(v) => handleChange('entalle_id', v)}>
                                    <SelectTrigger data-testid="muestra-form-entalle">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {entalles.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Tela</Label>
                                <Select value={formData.tela_id || ''} onValueChange={(v) => handleChange('tela_id', v)}>
                                    <SelectTrigger data-testid="muestra-form-tela">
                                        <SelectValue placeholder="Seleccionar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {telas.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Consumo Tela (metros)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.consumo_tela || ''}
                                onChange={(e) => handleChange('consumo_tela', parseFloat(e.target.value) || null)}
                                placeholder="Ej: 1.5"
                                data-testid="muestra-form-consumo"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Costo Estimado ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.costo_estimado || ''}
                                    onChange={(e) => handleChange('costo_estimado', parseFloat(e.target.value) || null)}
                                    placeholder="0.00"
                                    data-testid="muestra-form-costo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Precio Estimado ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_estimado || ''}
                                    onChange={(e) => handleChange('precio_estimado', parseFloat(e.target.value) || null)}
                                    placeholder="0.00"
                                    data-testid="muestra-form-precio"
                                />
                            </div>
                        </div>

                        {/* Rentabilidad calculated */}
                        {formData.rentabilidad_esperada && (
                            <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-600">Rentabilidad:</span>
                                <span className={`font-semibold ${
                                    formData.rentabilidad_esperada >= 30 ? 'text-emerald-600' : 
                                    formData.rentabilidad_esperada >= 15 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {formData.rentabilidad_esperada}%
                                </span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
                            <Textarea
                                value={formData.descripcion || ''}
                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                placeholder="Descripción de la muestra..."
                                rows={2}
                                data-testid="muestra-form-descripcion"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.aprobado || false}
                                    onCheckedChange={(checked) => handleChange('aprobado', checked)}
                                    data-testid="muestra-form-aprobado"
                                />
                                <span className="text-sm text-slate-600">Aprobado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.activo ?? true}
                                    onCheckedChange={(checked) => handleChange('activo', checked)}
                                    data-testid="muestra-form-activo"
                                />
                                <span className="text-sm text-slate-600">Activo</span>
                            </div>
                        </div>

                        {/* File upload (only for edit) */}
                        {selectedItem && (
                            <div className="border-t pt-4 mt-4">
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                                    Archivo de Costos (Excel)
                                </Label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex-1"
                                        data-testid="muestra-form-upload"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir Archivo
                                    </Button>
                                    {selectedItem.archivo_costos && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            asChild
                                        >
                                            <a href={getFileUrl(selectedItem.archivo_costos)} target="_blank" rel="noreferrer">
                                                <Download className="w-4 h-4 mr-2" />
                                                Descargar
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {selectedItem.archivo_costos && (
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <FileSpreadsheet className="w-3 h-3" />
                                        {selectedItem.archivo_costos.split('/').pop()}
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="muestra-form-cancel">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700" data-testid="muestra-form-submit">
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
                testIdPrefix="muestra-delete"
            />
        </div>
    );
}
