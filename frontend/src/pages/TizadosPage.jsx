import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getTizados, createTizado, updateTizado, deleteTizado, uploadArchivoTizado, getFileUrl
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
import { Upload, FileText, Download } from 'lucide-react';

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'ancho', label: 'Ancho', render: (val) => val ? `${val} cm` : '-' },
    { key: 'curva', label: 'Curva', render: (val) => val || '-' },
    { key: 'archivo_tizado', label: 'Archivo', render: (val) => val ? (
        <span className="text-blue-600 text-xs flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {val.split('/').pop()}
        </span>
    ) : '-' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function TizadosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const response = await getTizados(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar los tizados');
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
                await updateTizado(selectedItem.id, formData);
                toast.success('Tizado actualizado correctamente');
            } else {
                await createTizado(formData);
                toast.success('Tizado creado correctamente');
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
            await uploadArchivoTizado(selectedItem.id, file);
            toast.success('Archivo subido correctamente');
            fetchData();
            setFormOpen(false);
        } catch (error) {
            toast.error('Error al subir archivo');
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            await deleteTizado(selectedItem.id);
            toast.success('Tizado eliminado correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="tizados-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Tizados
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona los tizados con ancho y curva
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
                emptyMessage="No hay tizados registrados"
                addButtonText="Nuevo Tizado"
                testIdPrefix="tizados"
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Tizado' : 'Nuevo Tizado'}
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
                                placeholder="Nombre del tizado"
                                required
                                data-testid="tizado-form-nombre"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Ancho (cm)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.ancho || ''}
                                    onChange={(e) => handleChange('ancho', parseFloat(e.target.value) || null)}
                                    placeholder="Ej: 150"
                                    data-testid="tizado-form-ancho"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Curva</Label>
                                <Input
                                    value={formData.curva || ''}
                                    onChange={(e) => handleChange('curva', e.target.value)}
                                    placeholder="Ej: S, M, L"
                                    data-testid="tizado-form-curva"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
                            <Textarea
                                value={formData.descripcion || ''}
                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                placeholder="Descripción del tizado..."
                                rows={2}
                                data-testid="tizado-form-descripcion"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={formData.activo ?? true}
                                onCheckedChange={(checked) => handleChange('activo', checked)}
                                data-testid="tizado-form-activo"
                            />
                            <span className="text-sm text-slate-600">Activo</span>
                        </div>

                        {selectedItem && (
                            <div className="border-t pt-4 mt-4">
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Archivo Tizado</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1" data-testid="tizado-form-upload">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir Archivo
                                    </Button>
                                    {selectedItem.archivo_tizado && (
                                        <Button type="button" variant="outline" asChild>
                                            <a href={getFileUrl(selectedItem.archivo_tizado)} target="_blank" rel="noreferrer">
                                                <Download className="w-4 h-4 mr-2" />
                                                Descargar
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {selectedItem.archivo_tizado && (
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {selectedItem.archivo_tizado.split('/').pop()}
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="tizado-form-cancel">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700" data-testid="tizado-form-submit">
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
                testIdPrefix="tizado-delete"
            />
        </div>
    );
}
