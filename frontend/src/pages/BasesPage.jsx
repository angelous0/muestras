import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge, ApprovalBadge } from '../components/DataTable';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getBases, createBase, updateBase, deleteBase, 
    uploadPatron, uploadImagen, getFileUrl,
    getMuestrasBase, getFichas, getTizados
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
import { Checkbox } from '../components/ui/checkbox';
import { Upload, FileText, Image, Download } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'patron_archivo', label: 'Patrón', render: (val) => val ? (
        <span className="text-blue-600 text-xs flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Sí
        </span>
    ) : '-' },
    { key: 'imagen_archivo', label: 'Imagen', render: (val) => val ? (
        <span className="text-emerald-600 text-xs flex items-center gap-1">
            <Image className="w-3 h-3" />
            Sí
        </span>
    ) : '-' },
    { key: 'aprobado', label: 'Aprobado', render: (val) => <ApprovalBadge aprobado={val} /> },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function BasesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    
    const [muestrasBase, setMuestrasBase] = useState([]);
    const [fichas, setFichas] = useState([]);
    const [tizados, setTizados] = useState([]);
    
    const patronInputRef = useRef(null);
    const imagenInputRef = useRef(null);

    const fetchCatalogs = async () => {
        try {
            const [muestrasRes, fichasRes, tizadosRes] = await Promise.all([
                getMuestrasBase({ activo: true }),
                getFichas({ activo: true }),
                getTizados({ activo: true })
            ]);
            setMuestrasBase(muestrasRes.data);
            setFichas(fichasRes.data);
            setTizados(tizadosRes.data);
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
            const response = await getBases(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar las bases');
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
        setFormData({ activo: true, aprobado: false, fichas_ids: [], tizados_ids: [] });
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

    const handleCheckboxChange = (key, id, checked) => {
        setFormData(prev => {
            const current = prev[key] || [];
            if (checked) {
                return { ...prev, [key]: [...current, id] };
            } else {
                return { ...prev, [key]: current.filter(i => i !== id) };
            }
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateBase(selectedItem.id, formData);
                toast.success('Base actualizada correctamente');
            } else {
                await createBase(formData);
                toast.success('Base creada correctamente');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePatronUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedItem) return;
        try {
            await uploadPatron(selectedItem.id, file);
            toast.success('Patrón subido correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir patrón');
        }
    };

    const handleImagenUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedItem) return;
        try {
            await uploadImagen(selectedItem.id, file);
            toast.success('Imagen subida correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir imagen');
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            await deleteBase(selectedItem.id);
            toast.success('Base eliminada correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="bases-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Bases
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona las bases con patrones, imágenes, fichas y tizados
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
                emptyMessage="No hay bases registradas"
                addButtonText="Nueva Base"
                testIdPrefix="bases"
            />

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Base' : 'Nueva Base'}
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
                                placeholder="Nombre de la base"
                                required
                                data-testid="base-form-nombre"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Muestra Base</Label>
                            <Select value={formData.muestra_base_id || ''} onValueChange={(v) => handleChange('muestra_base_id', v)}>
                                <SelectTrigger data-testid="base-form-muestra">
                                    <SelectValue placeholder="Seleccionar muestra base" />
                                </SelectTrigger>
                                <SelectContent>
                                    {muestrasBase.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fichas Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Fichas</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {fichas.length === 0 ? (
                                    <p className="text-sm text-slate-500">No hay fichas disponibles</p>
                                ) : (
                                    <div className="space-y-2">
                                        {fichas.map(ficha => (
                                            <div key={ficha.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`ficha-${ficha.id}`}
                                                    checked={(formData.fichas_ids || []).includes(ficha.id)}
                                                    onCheckedChange={(checked) => handleCheckboxChange('fichas_ids', ficha.id, checked)}
                                                />
                                                <label htmlFor={`ficha-${ficha.id}`} className="text-sm text-slate-700 cursor-pointer">
                                                    {ficha.nombre}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Tizados Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Tizados</Label>
                            <ScrollArea className="h-32 border rounded-md p-2">
                                {tizados.length === 0 ? (
                                    <p className="text-sm text-slate-500">No hay tizados disponibles</p>
                                ) : (
                                    <div className="space-y-2">
                                        {tizados.map(tizado => (
                                            <div key={tizado.id} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`tizado-${tizado.id}`}
                                                    checked={(formData.tizados_ids || []).includes(tizado.id)}
                                                    onCheckedChange={(checked) => handleCheckboxChange('tizados_ids', tizado.id, checked)}
                                                />
                                                <label htmlFor={`tizado-${tizado.id}`} className="text-sm text-slate-700 cursor-pointer">
                                                    {tizado.nombre} {tizado.ancho && `(${tizado.ancho}cm)`}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
                            <Textarea
                                value={formData.descripcion || ''}
                                onChange={(e) => handleChange('descripcion', e.target.value)}
                                placeholder="Descripción de la base..."
                                rows={2}
                                data-testid="base-form-descripcion"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.aprobado || false}
                                    onCheckedChange={(checked) => handleChange('aprobado', checked)}
                                    data-testid="base-form-aprobado"
                                />
                                <span className="text-sm text-slate-600">Aprobado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    checked={formData.activo ?? true}
                                    onCheckedChange={(checked) => handleChange('activo', checked)}
                                    data-testid="base-form-activo"
                                />
                                <span className="text-sm text-slate-600">Activo</span>
                            </div>
                        </div>

                        {/* File uploads (only for edit) */}
                        {selectedItem && (
                            <div className="border-t pt-4 mt-4 space-y-4">
                                {/* Patrón */}
                                <div>
                                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Archivo Patrón</Label>
                                    <div className="flex gap-2">
                                        <input type="file" ref={patronInputRef} onChange={handlePatronUpload} className="hidden" />
                                        <Button type="button" variant="outline" onClick={() => patronInputRef.current?.click()} className="flex-1" data-testid="base-form-upload-patron">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Subir Patrón
                                        </Button>
                                        {selectedItem.patron_archivo && (
                                            <Button type="button" variant="outline" asChild>
                                                <a href={getFileUrl(selectedItem.patron_archivo)} target="_blank" rel="noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Imagen */}
                                <div>
                                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Imagen</Label>
                                    <div className="flex gap-2">
                                        <input type="file" ref={imagenInputRef} onChange={handleImagenUpload} accept="image/*" className="hidden" />
                                        <Button type="button" variant="outline" onClick={() => imagenInputRef.current?.click()} className="flex-1" data-testid="base-form-upload-imagen">
                                            <Image className="w-4 h-4 mr-2" />
                                            Subir Imagen
                                        </Button>
                                        {selectedItem.imagen_archivo && (
                                            <Button type="button" variant="outline" asChild>
                                                <a href={getFileUrl(selectedItem.imagen_archivo)} target="_blank" rel="noreferrer">
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="base-form-cancel">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700" data-testid="base-form-submit">
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
                testIdPrefix="base-delete"
            />
        </div>
    );
}
