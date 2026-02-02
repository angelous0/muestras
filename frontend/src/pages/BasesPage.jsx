import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getBases, createBase, updateBase, deleteBase, 
    uploadPatron, uploadImagen, uploadFichasBase, uploadTizadosBase,
    deleteFichaBase, deleteTizadoBase, getFileUrl,
    getMuestrasBase, getHilos, getMarcas, getTiposProducto, getEntalles, getTelas
} from '../lib/api';
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
import { Badge } from '../components/ui/badge';
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
import { ScrollArea } from '../components/ui/scroll-area';
import { 
    Search, Plus, Pencil, Trash2, Filter, X, Upload, 
    FileSpreadsheet, Download, Image, Check, Clock, File, FolderOpen
} from 'lucide-react';

const ApprovalBadge = ({ aprobado }) => (
    <Badge className={aprobado ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
        {aprobado ? <><Check className="w-3 h-3 mr-1" />Aprobado</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
    </Badge>
);

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
    
    // File upload dialogs
    const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
    const [tizadosDialogOpen, setTizadosDialogOpen] = useState(false);
    const [currentBaseForFiles, setCurrentBaseForFiles] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    
    // New Ficha form states
    const [showNewFichaForm, setShowNewFichaForm] = useState(false);
    const [newFichaName, setNewFichaName] = useState('');
    const [newFichaFile, setNewFichaFile] = useState(null);
    const [fichaSearch, setFichaSearch] = useState('');
    
    // New Tizado form states
    const [showNewTizadoForm, setShowNewTizadoForm] = useState(false);
    const [newTizadoName, setNewTizadoName] = useState('');
    const [newTizadoFile, setNewTizadoFile] = useState(null);
    const [tizadoSearch, setTizadoSearch] = useState('');
    
    // Catalogs
    const [muestrasBase, setMuestrasBase] = useState([]);
    const [hilos, setHilos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [entalles, setEntalles] = useState([]);
    const [telas, setTelas] = useState([]);
    
    // File input refs
    const patronInputRefs = useRef({});
    const imagenInputRefs = useRef({});
    const fichasInputRef = useRef(null);
    const tizadosInputRef = useRef(null);

    const fetchCatalogs = async () => {
        try {
            const [muestrasRes, hilosRes, marcasRes, tiposRes, entallesRes, telasRes] = await Promise.all([
                getMuestrasBase({ activo: true }),
                getHilos({ activo: true }),
                getMarcas({ activo: true }),
                getTiposProducto({ activo: true }),
                getEntalles({ activo: true }),
                getTelas({ activo: true })
            ]);
            setMuestrasBase(muestrasRes.data);
            setHilos(hilosRes.data);
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

    // Helper to get muestra base display name
    const getMuestraBaseName = (muestraId) => {
        const muestra = muestrasBase.find(m => m.id === muestraId);
        if (!muestra) return '-';
        
        const marca = marcas.find(m => m.id === muestra.marca_id)?.nombre || '';
        const tipo = tiposProducto.find(t => t.id === muestra.tipo_producto_id)?.nombre || '';
        const entalle = entalles.find(e => e.id === muestra.entalle_id)?.nombre || '';
        const tela = telas.find(t => t.id === muestra.tela_id)?.nombre || '';
        
        const parts = [marca, tipo, entalle, tela].filter(p => p);
        return parts.length > 0 ? parts.join(' - ') : muestra.nombre;
    };

    const getHiloName = (hiloId) => hilos.find(h => h.id === hiloId)?.nombre || '-';

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
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Generate automatic name
    const generateNombre = (data) => {
        const muestra = muestrasBase.find(m => m.id === data.muestra_base_id);
        if (!muestra) return 'Nueva Base';
        
        const marca = marcas.find(m => m.id === muestra.marca_id)?.nombre || '';
        const tipo = tiposProducto.find(t => t.id === muestra.tipo_producto_id)?.nombre || '';
        const entalle = entalles.find(e => e.id === muestra.entalle_id)?.nombre || '';
        const tela = telas.find(t => t.id === muestra.tela_id)?.nombre || '';
        
        const parts = [marca, tipo, entalle, tela].filter(p => p);
        return parts.length > 0 ? parts.join(' - ') : 'Nueva Base';
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const submitData = {
                ...formData,
                nombre: generateNombre(formData)
            };
            
            if (selectedItem) {
                await updateBase(selectedItem.id, submitData);
                toast.success('Base actualizada correctamente');
            } else {
                await createBase(submitData);
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

    // File uploads
    const handlePatronUpload = async (itemId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await uploadPatron(itemId, file);
            toast.success('Patrón subido correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir patrón');
        }
    };

    const handleImagenUpload = async (itemId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await uploadImagen(itemId, file);
            toast.success('Imagen subida correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir imagen');
        }
    };

    // Fichas dialog
    const openFichasDialog = (item) => {
        setCurrentBaseForFiles(item);
        setFichasDialogOpen(true);
    };

    const handleFichasUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !currentBaseForFiles) return;
        
        setUploadingFiles(true);
        try {
            await uploadFichasBase(currentBaseForFiles.id, files);
            toast.success(`${files.length} archivo(s) subido(s)`);
            fetchData();
            // Refresh current base
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
        } catch (error) {
            toast.error('Error al subir archivos');
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleDeleteFicha = async (fileIndex) => {
        if (!currentBaseForFiles) return;
        try {
            await deleteFichaBase(currentBaseForFiles.id, fileIndex);
            toast.success('Archivo eliminado');
            fetchData();
            // Refresh current base
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
        } catch (error) {
            toast.error('Error al eliminar archivo');
        }
    };

    // Tizados dialog
    const openTizadosDialog = (item) => {
        setCurrentBaseForFiles(item);
        setTizadosDialogOpen(true);
    };

    const handleTizadosUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !currentBaseForFiles) return;
        
        setUploadingFiles(true);
        try {
            await uploadTizadosBase(currentBaseForFiles.id, files);
            toast.success(`${files.length} archivo(s) subido(s)`);
            fetchData();
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
        } catch (error) {
            toast.error('Error al subir archivos');
        } finally {
            setUploadingFiles(false);
        }
    };

    const handleDeleteTizado = async (fileIndex) => {
        if (!currentBaseForFiles) return;
        try {
            await deleteTizadoBase(currentBaseForFiles.id, fileIndex);
            toast.success('Archivo eliminado');
            fetchData();
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
        } catch (error) {
            toast.error('Error al eliminar archivo');
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

    const getFileName = (path) => path?.split('/').pop() || '';

    return (
        <div className="space-y-6 animate-fade-in" data-testid="bases-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>Bases</h1>
                <p className="text-slate-500 text-sm mt-1">Gestión de bases con patrones, imágenes, fichas y tizados</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 bg-white" />
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
                        <Plus className="h-4 w-4 mr-2" />Nueva Base
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Muestra Base</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Hilo</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Patrón</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Imagen</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Fichas</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Tizados</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4">Estado</TableHead>
                            <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-3 px-4 w-28">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Cargando...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No hay bases registradas</TableCell></TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow key={item.id} className="table-row-hover border-b border-slate-100">
                                    <TableCell className="py-3 px-4 text-sm text-slate-700 max-w-xs truncate">
                                        {getMuestraBaseName(item.muestra_base_id)}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-sm text-slate-700">
                                        {getHiloName(item.hilo_id)}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-sm">
                                        <input type="file" ref={el => patronInputRefs.current[item.id] = el} onChange={(e) => handlePatronUpload(item.id, e)} accept=".xlsx,.xls,.pdf" className="hidden" />
                                        {item.patron_archivo ? (
                                            <div className="flex items-center gap-1">
                                                <a href={getFileUrl(item.patron_archivo)} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    <FileSpreadsheet className="w-4 h-4" /><Download className="w-3 h-3" />
                                                </a>
                                                <Button variant="ghost" size="sm" onClick={() => patronInputRefs.current[item.id]?.click()} className="h-6 px-1"><Upload className="w-3 h-3" /></Button>
                                            </div>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => patronInputRefs.current[item.id]?.click()} className="h-7 text-xs">
                                                <Upload className="w-3 h-3 mr-1" />Subir
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-sm">
                                        <input type="file" ref={el => imagenInputRefs.current[item.id] = el} onChange={(e) => handleImagenUpload(item.id, e)} accept="image/*" className="hidden" />
                                        {item.imagen_archivo ? (
                                            <div className="flex items-center gap-1">
                                                <a href={getFileUrl(item.imagen_archivo)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                                                    <Image className="w-4 h-4" /><Download className="w-3 h-3" />
                                                </a>
                                                <Button variant="ghost" size="sm" onClick={() => imagenInputRefs.current[item.id]?.click()} className="h-6 px-1"><Upload className="w-3 h-3" /></Button>
                                            </div>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => imagenInputRefs.current[item.id]?.click()} className="h-7 text-xs">
                                                <Image className="w-3 h-3 mr-1" />Subir
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-sm">
                                        <Button variant="outline" size="sm" onClick={() => openFichasDialog(item)} className="h-7 text-xs">
                                            <FolderOpen className="w-3 h-3 mr-1" />
                                            {(item.fichas_archivos?.length || 0)} archivo(s)
                                        </Button>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-sm">
                                        <Button variant="outline" size="sm" onClick={() => openTizadosDialog(item)} className="h-7 text-xs">
                                            <FolderOpen className="w-3 h-3 mr-1" />
                                            {(item.tizados_archivos?.length || 0)} archivo(s)
                                        </Button>
                                    </TableCell>
                                    <TableCell className="py-3 px-4"><ApprovalBadge aprobado={item.aprobado} /></TableCell>
                                    <TableCell className="py-3 px-4">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 px-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
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
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Base' : 'Nueva Base'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Muestra Base <span className="text-red-500">*</span></Label>
                            <Select value={formData.muestra_base_id || ''} onValueChange={(v) => handleChange('muestra_base_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar muestra base" /></SelectTrigger>
                                <SelectContent>
                                    {muestrasBase.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{getMuestraBaseName(m.id)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hilo</Label>
                            <Select value={formData.hilo_id || ''} onValueChange={(v) => handleChange('hilo_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar hilo" /></SelectTrigger>
                                <SelectContent>
                                    {hilos.map(h => (
                                        <SelectItem key={h.id} value={h.id}>{h.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-3">
                                <Switch checked={formData.aprobado || false} onCheckedChange={(checked) => handleChange('aprobado', checked)} />
                                <span className="text-sm text-slate-600">Aprobado</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={formData.activo ?? true} onCheckedChange={(checked) => handleChange('activo', checked)} />
                                <span className="text-sm text-slate-600">Activo</span>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-700">{submitting ? 'Guardando...' : 'Guardar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fichas Dialog - Rediseñado según imagen de referencia */}
            <Dialog open={fichasDialogOpen} onOpenChange={setFichasDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Fichas de Base #{currentBaseForFiles?.id?.slice(-4) || ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        {/* Formulario para crear nueva ficha */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <Button 
                                type="button"
                                onClick={() => setShowNewFichaForm(!showNewFichaForm)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white mb-3"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Nueva Ficha
                            </Button>
                            
                            {showNewFichaForm && (
                                <div className="space-y-3 mt-3 pt-3 border-t border-slate-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm text-slate-600">Nombre de Ficha <span className="text-red-500">*</span></Label>
                                            <Input 
                                                placeholder="Ej: Ficha de Medidas"
                                                value={newFichaName}
                                                onChange={(e) => setNewFichaName(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm text-slate-600">Archivo</Label>
                                            <div 
                                                className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md bg-white cursor-pointer hover:bg-slate-50"
                                                onClick={() => newFichaFileRef.current?.click()}
                                            >
                                                <Upload className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-500 truncate">
                                                    {newFichaFile ? newFichaFile.name : 'Seleccionar archivo'}
                                                </span>
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={newFichaFileRef} 
                                                onChange={(e) => setNewFichaFile(e.target.files?.[0] || null)}
                                                className="hidden" 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            type="button"
                                            onClick={handleCreateFicha}
                                            disabled={!newFichaName || uploadingFiles}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {uploadingFiles ? 'Guardando...' : 'Guardar Ficha'}
                                        </Button>
                                        <Button 
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowNewFichaForm(false);
                                                setNewFichaName('');
                                                setNewFichaFile(null);
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Campo de búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar por nombre..."
                                value={fichaSearch}
                                onChange={(e) => setFichaSearch(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>

                        {/* Tabla de fichas */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-12">#</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3">Nombre de Ficha</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-32">Archivo</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-24">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFichas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                                No hay fichas registradas
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredFichas.map((ficha, index) => (
                                            <TableRow key={index} className="border-b border-slate-100 hover:bg-slate-50">
                                                <TableCell className="py-2 px-3 text-sm text-slate-600">{index + 1}</TableCell>
                                                <TableCell className="py-2 px-3 text-sm text-slate-700 font-medium">
                                                    {ficha.nombre || getFileName(ficha.archivo)}
                                                </TableCell>
                                                <TableCell className="py-2 px-3 text-sm">
                                                    {ficha.archivo ? (
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs px-2">
                                                                {getFileExtension(ficha.archivo)}
                                                            </Badge>
                                                            <a 
                                                                href={getFileUrl(ficha.archivo)} 
                                                                target="_blank" 
                                                                rel="noreferrer"
                                                                className="text-slate-400 hover:text-slate-600"
                                                                title="Descargar"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 text-xs text-slate-500"
                                                            onClick={() => handleUploadToExistingFicha(index)}
                                                        >
                                                            <Upload className="w-3 h-3 mr-1" />Subir
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 px-3">
                                                    <button 
                                                        onClick={() => handleDeleteFicha(index)} 
                                                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setFichasDialogOpen(false)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Tizados Dialog */}
            <Dialog open={tizadosDialogOpen} onOpenChange={setTizadosDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Tizados
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {/* Drop zone */}
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                            onClick={() => tizadosInputRef.current?.click()}
                        >
                            <input type="file" ref={tizadosInputRef} onChange={handleTizadosUpload} multiple className="hidden" />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-600">
                                    {uploadingFiles ? 'Subiendo archivos...' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                                </p>
                                <p className="text-xs text-slate-400">PDF, Excel, Word, Imágenes</p>
                            </div>
                        </div>

                        {/* Files list */}
                        {(currentBaseForFiles?.tizados_archivos?.length || 0) > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700">Archivos subidos ({currentBaseForFiles?.tizados_archivos?.length})</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {currentBaseForFiles?.tizados_archivos?.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center shrink-0">
                                                    <File className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-sm text-slate-700 truncate">{getFileName(file)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <a 
                                                    href={getFileUrl(file)} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                                    title="Descargar"
                                                >
                                                    <Download className="w-4 h-4 text-slate-600" />
                                                </a>
                                                <button 
                                                    onClick={() => handleDeleteTizado(index)} 
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <X className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setTizadosDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={() => setTizadosDialogOpen(false)} className="bg-slate-800 hover:bg-slate-700">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedItem?.nombre} loading={submitting} />
        </div>
    );
}
