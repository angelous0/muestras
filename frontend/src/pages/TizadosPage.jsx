import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getTizados, createTizado, updateTizado, deleteTizado, uploadArchivoTizado, getFileUrl,
    getBases
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
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { ScrollArea } from '../components/ui/scroll-area';
import { Upload, FileText, Download, X, Search } from 'lucide-react';

export default function TizadosPage() {
    const [data, setData] = useState([]);
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    const [basesSearch, setBasesSearch] = useState('');
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const tizadosRes = await getTizados(params);
            const basesRes = await getBases({});
            setData(tizadosRes.data);
            setBases(basesRes.data);
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
        setFormData({ activo: true, bases_ids: [] });
        setBasesSearch('');
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({ ...item, bases_ids: item.bases_ids || [] });
        setBasesSearch('');
        setFormOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleBase = (baseId) => {
        const currentBases = formData.bases_ids || [];
        if (currentBases.includes(baseId)) {
            handleChange('bases_ids', currentBases.filter(id => id !== baseId));
        } else {
            handleChange('bases_ids', [...currentBases, baseId]);
        }
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

    const getBaseName = (baseId) => {
        const base = bases.find(b => b.id === baseId);
        return base?.nombre || 'Base ' + baseId.slice(-6);
    };

    const filteredBases = bases.filter(base => {
        const searchLower = basesSearch.toLowerCase();
        return (base.nombre || '').toLowerCase().includes(searchLower);
    });

    const selectedBasesIds = formData.bases_ids || [];

    const tableColumns = [
        { key: 'nombre', label: 'Nombre' },
        { key: 'ancho', label: 'Ancho', render: (val) => val ? `${val} cm` : '-' },
        { key: 'curva', label: 'Curva', render: (val) => val || '-' },
        { key: 'bases_ids', label: 'Bases', render: (val) => {
            if (!val || val.length === 0) return '-';
            return (
                <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{val.length} base(s)</Badge>
                </div>
            );
        }},
        { key: 'archivo_tizado', label: 'Archivo', render: (val) => val ? (
            <span className="text-blue-600 text-xs flex items-center gap-1">
                <FileText className="w-3 h-3" />Archivo
            </span>
        ) : '-' },
        { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <DataTable
                title="Tizados"
                subtitle="Gestión de tizados con bases asociadas"
                columns={tableColumns}
                data={data}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                filterActive={filterActive}
                onFilterChange={setFilterActive}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                addButtonText="Nuevo Tizado"
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Tizado' : 'Nuevo Tizado'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.nombre || ''} 
                                onChange={(e) => handleChange('nombre', e.target.value)}
                                placeholder="Nombre del tizado"
                                required 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ancho (cm)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01"
                                    value={formData.ancho || ''} 
                                    onChange={(e) => handleChange('ancho', parseFloat(e.target.value) || null)}
                                    placeholder="Ej: 150"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Curva</Label>
                                <Input 
                                    value={formData.curva || ''} 
                                    onChange={(e) => handleChange('curva', e.target.value)}
                                    placeholder="Ej: XS-S-M-L-XL"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Bases Asociadas ({selectedBasesIds.length} seleccionadas)</Label>
                            <div className="border border-slate-200 rounded-lg">
                                <div className="p-2 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            placeholder="Buscar bases..."
                                            value={basesSearch}
                                            onChange={(e) => setBasesSearch(e.target.value)}
                                            className="pl-8 h-8 text-sm"
                                        />
                                    </div>
                                </div>
                                <ScrollArea className="h-[150px]">
                                    <div className="p-2 space-y-1">
                                        {filteredBases.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">No hay bases disponibles</p>
                                        ) : (
                                            filteredBases.map(base => (
                                                <label 
                                                    key={base.id}
                                                    className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                                                >
                                                    <Checkbox 
                                                        checked={selectedBasesIds.includes(base.id)}
                                                        onCheckedChange={() => toggleBase(base.id)}
                                                    />
                                                    <span className="text-sm text-slate-700 truncate">
                                                        {base.nombre || `Base ${base.id.slice(-6)}`}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        {selectedItem && (
                            <div className="space-y-2">
                                <Label>Archivo</Label>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <div className="flex items-center gap-2">
                                    {selectedItem.archivo_tizado ? (
                                        <>
                                            <a 
                                                href={getFileUrl(selectedItem.archivo_tizado)} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                            >
                                                <FileText className="w-4 h-4" />
                                                <Download className="w-3 h-3" />
                                                Ver archivo
                                            </a>
                                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                <Upload className="w-4 h-4 mr-1" />Cambiar
                                            </Button>
                                        </>
                                    ) : (
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-4 h-4 mr-2" />Subir archivo
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Switch checked={formData.activo ?? true} onCheckedChange={(checked) => handleChange('activo', checked)} />
                            <span className="text-sm text-slate-600">Activo</span>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700">
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
            />
        </div>
    );
}
