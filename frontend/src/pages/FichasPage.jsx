import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getFichas, createFicha, updateFicha, deleteFicha, uploadArchivoFicha, getFileUrl
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
    { key: 'archivo', label: 'Archivo', render: (val) => val ? (
        <span className="text-blue-600 text-xs flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {val.split('/').pop()}
        </span>
    ) : '-' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function FichasPage() {
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
            const response = await getFichas(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar las fichas');
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
                await updateFicha(selectedItem.id, formData);
                toast.success('Ficha actualizada correctamente');
            } else {
                await createFicha(formData);
                toast.success('Ficha creada correctamente');
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
            await uploadArchivoFicha(selectedItem.id, file);
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
            await deleteFicha(selectedItem.id);
            toast.success('Ficha eliminada correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="fichas-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Fichas
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona las fichas técnicas
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
                emptyMessage="No hay fichas registradas"
                addButtonText="Nueva Ficha"
                testIdPrefix="fichas"
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Ficha' : 'Nueva Ficha'}
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
                                placeholder="Nombre de la ficha"
                                required
                                data-testid="ficha-form-nombre"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
                            <Textarea
                                value={formData.descripcion || ''}
                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                placeholder="Descripción de la ficha..."
                                rows={2}
                                data-testid="ficha-form-descripcion"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                checked={formData.activo ?? true}
                                onCheckedChange={(checked) => handleChange('activo', checked)}
                                data-testid="ficha-form-activo"
                            />
                            <span className="text-sm text-slate-600">Activo</span>
                        </div>

                        {selectedItem && (
                            <div className="border-t pt-4 mt-4">
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">Archivo</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1" data-testid="ficha-form-upload">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir Archivo
                                    </Button>
                                    {selectedItem.archivo && (
                                        <Button type="button" variant="outline" asChild>
                                            <a href={getFileUrl(selectedItem.archivo)} target="_blank" rel="noreferrer">
                                                <Download className="w-4 h-4 mr-2" />
                                                Descargar
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {selectedItem.archivo && (
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {selectedItem.archivo.split('/').pop()}
                                    </p>
                                )}
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="ficha-form-cancel">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700" data-testid="ficha-form-submit">
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
                testIdPrefix="ficha-delete"
            />
        </div>
    );
}
