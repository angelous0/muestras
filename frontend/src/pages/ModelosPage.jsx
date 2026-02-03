import { useState, useEffect, useRef } from 'react';
import { getModelos, createModelo, updateModelo, deleteModelo, getBases, getHilos, uploadFichaModelo, deleteFichaModelo, getFileUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Trash2, Upload, Download, FileText, X, Check, Clock } from 'lucide-react';

const ApprovalBadge = ({ aprobado }) => (
    <Badge className={aprobado ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
        {aprobado ? <><Check className="w-3 h-3 mr-1" />Aprobado</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
    </Badge>
);

export default function ModelosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    
    // Catalogs
    const [bases, setBases] = useState([]);
    const [hilos, setHilos] = useState([]);
    
    // For Fichas
    const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
    const [currentModeloForFiles, setCurrentModeloForFiles] = useState(null);
    const [fichaFile, setFichaFile] = useState(null);
    const [fichaName, setFichaName] = useState('');
    const [uploadingFicha, setUploadingFicha] = useState(false);
    const fichaInputRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getModelos({ search });
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar modelos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalogs = async () => {
        try {
            const [basesRes, hilosRes] = await Promise.all([
                getBases({ activo: true }),
                getHilos({ activo: true })
            ]);
            setBases(basesRes.data);
            setHilos(hilosRes.data);
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchCatalogs();
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    // Helper to get base name
    const getBaseName = (baseId) => {
        const base = bases.find(b => b.id === baseId);
        return base?.nombre || '-';
    };

    // Helper to get hilo name
    const getHiloName = (hiloId) => {
        return hilos.find(h => h.id === hiloId)?.nombre || '-';
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setFormData({ activo: true, aprobado: false });
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({
            nombre: item.nombre,
            base_id: item.base_id,
            hilo_id: item.hilo_id,
            aprobado: item.aprobado
        });
        setFormOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.base_id) {
            toast.error('Selecciona una base');
            return;
        }

        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateModelo(selectedItem.id, formData);
                toast.success('Modelo actualizado');
            } else {
                await createModelo(formData);
                toast.success('Modelo creado');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteModelo(selectedItem.id);
            toast.success('Modelo eliminado');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Fichas handlers
    const openFichasDialog = (modelo) => {
        setCurrentModeloForFiles(modelo);
        setFichasDialogOpen(true);
        setFichaFile(null);
        setFichaName('');
    };

    const handleUploadFicha = async () => {
        if (!fichaFile || !currentModeloForFiles) return;
        
        setUploadingFicha(true);
        try {
            await uploadFichaModelo(currentModeloForFiles.id, [fichaFile], fichaName ? [fichaName] : []);
            toast.success('Ficha subida');
            setFichaFile(null);
            setFichaName('');
            if (fichaInputRef.current) fichaInputRef.current.value = '';
            
            // Refresh data
            fetchData();
            const updatedModelos = await getModelos({});
            const refreshed = updatedModelos.data.find(m => m.id === currentModeloForFiles.id);
            if (refreshed) setCurrentModeloForFiles(refreshed);
        } catch (error) {
            toast.error('Error al subir ficha');
        } finally {
            setUploadingFicha(false);
        }
    };

    const handleDeleteFicha = async (index) => {
        if (!currentModeloForFiles) return;
        try {
            await deleteFichaModelo(currentModeloForFiles.id, index);
            toast.success('Ficha eliminada');
            
            // Refresh data
            fetchData();
            const updatedModelos = await getModelos({});
            const refreshed = updatedModelos.data.find(m => m.id === currentModeloForFiles.id);
            if (refreshed) setCurrentModeloForFiles(refreshed);
        } catch (error) {
            toast.error('Error al eliminar ficha');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                        Modelos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestiona los modelos vinculados a bases
                    </p>
                </div>
                <Button 
                    onClick={handleAdd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="modelos-add-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Modelo
                </Button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar modelos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold text-slate-600">Nombre</TableHead>
                            <TableHead className="font-semibold text-slate-600">Base</TableHead>
                            <TableHead className="font-semibold text-slate-600">Hilo</TableHead>
                            <TableHead className="font-semibold text-slate-600">Fichas</TableHead>
                            <TableHead className="font-semibold text-slate-600">Aprobado</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">Cargando...</TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">No hay modelos registrados</TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-slate-50 border-b border-slate-100">
                                    <TableCell className="font-medium text-slate-800">
                                        {item.nombre || '-'}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {getBaseName(item.base_id)}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {getHiloName(item.hilo_id)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openFichasDialog(item)}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            {(item.fichas_archivos?.length || 0)} fichas
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <ApprovalBadge aprobado={item.aprobado} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                                className="h-8 px-2 text-slate-600 hover:text-slate-800"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDelete(item)}
                                                className="h-8 px-2 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Modelo' : 'Nuevo Modelo'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario de modelo
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre <span className="text-slate-400 text-xs">(opcional)</span></Label>
                            <Input
                                value={formData.nombre || ''}
                                onChange={(e) => handleChange('nombre', e.target.value)}
                                placeholder="Se genera automáticamente si se deja vacío"
                                className="bg-white"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Base <span className="text-red-500">*</span> <span className="text-slate-400 text-xs">(solo aprobadas)</span></Label>
                            <Select value={formData.base_id || ''} onValueChange={(v) => handleChange('base_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar base" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bases.filter(b => b.aprobado).map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Hilo</Label>
                            <Select value={formData.hilo_id || ''} onValueChange={(v) => handleChange('hilo_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar hilo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hilos.map(h => (
                                        <SelectItem key={h.id} value={h.id}>{h.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="aprobado"
                                checked={formData.aprobado || false}
                                onChange={(e) => handleChange('aprobado', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300"
                            />
                            <Label htmlFor="aprobado" className="cursor-pointer">Aprobado</Label>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                                {selectedItem ? 'Guardar' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800">Confirmar Eliminación</DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirmación de eliminación
                        </DialogDescription>
                    </DialogHeader>
                    <p className="py-4 text-slate-600">
                        ¿Estás seguro de eliminar "{selectedItem?.nombre}"? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Fichas Dialog */}
            <Dialog open={fichasDialogOpen} onOpenChange={setFichasDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-white max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Fichas del Modelo
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                            {currentModeloForFiles?.nombre}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        {/* Upload Form */}
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                            <p className="text-sm font-medium text-slate-700">Agregar Nueva Ficha</p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nombre de la ficha (opcional)"
                                    value={fichaName}
                                    onChange={(e) => setFichaName(e.target.value)}
                                    className="flex-1 bg-white"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    ref={fichaInputRef}
                                    type="file"
                                    onChange={(e) => setFichaFile(e.target.files?.[0] || null)}
                                    className="flex-1 bg-white"
                                />
                                <Button
                                    onClick={handleUploadFicha}
                                    disabled={!fichaFile || uploadingFicha}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {uploadingFicha ? 'Subiendo...' : 'Subir'}
                                </Button>
                            </div>
                        </div>

                        {/* Files List */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-700">Fichas Cargadas ({currentModeloForFiles?.fichas_archivos?.length || 0})</p>
                            {(!currentModeloForFiles?.fichas_archivos || currentModeloForFiles.fichas_archivos.length === 0) ? (
                                <p className="text-sm text-slate-400 text-center py-4">No hay fichas cargadas</p>
                            ) : (
                                <div className="space-y-2">
                                    {currentModeloForFiles.fichas_archivos.map((archivo, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-blue-500" />
                                                <span className="text-sm text-slate-700">
                                                    {currentModeloForFiles.fichas_nombres?.[index] || `Ficha ${index + 1}`}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(getFileUrl(archivo), '_blank')}
                                                    className="h-8 px-2 text-blue-600 hover:text-blue-800"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteFicha(index)}
                                                    className="h-8 px-2 text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setFichasDialogOpen(false)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
