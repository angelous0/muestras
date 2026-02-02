import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getBases, createBase, updateBase, deleteBase, 
    uploadPatron, uploadImagen, uploadFichasBase, uploadTizadosBase,
    deleteFichaBase, deleteTizadoBase, getFileUrl,
    getMuestrasBase, getHilos, getMarcas, getTiposProducto, getEntalles, getTelas,
    getTizados, updateTizado
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
    useResizableColumns,
    ResizableTableHead,
    ResizableTableCell,
} from '../components/ResizableTable';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import { Checkbox } from '../components/ui/checkbox';
import { 
    Search, Plus, Pencil, Trash2, Filter, X, Upload, 
    FileSpreadsheet, Download, Image, Check, Clock, File, FolderOpen, RotateCcw, Link2
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
    
    // All tizados for selection
    const [allTizados, setAllTizados] = useState([]);
    
    // File upload dialogs
    const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
    const [tizadosDialogOpen, setTizadosDialogOpen] = useState(false);
    const [currentBaseForFiles, setCurrentBaseForFiles] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [tizadoSearchInDialog, setTizadoSearchInDialog] = useState('');
    
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
    const newFichaFileRef = useRef(null);
    const newTizadoFileRef = useRef(null);

    // Columnas redimensionables
    const defaultColumnWidths = {
        muestraBase: 180,
        nombre: 150,
        hilo: 100,
        patron: 100,
        imagen: 100,
        fichas: 120,
        tizados: 120,
        estado: 100,
        acciones: 100
    };
    const { columnWidths, updateWidth, resetWidths } = useResizableColumns('bases', defaultColumnWidths);

    const fetchCatalogs = async () => {
        try {
            const [muestrasRes, hilosRes, marcasRes, tiposRes, entallesRes, telasRes, tizadosRes] = await Promise.all([
                getMuestrasBase({ activo: true }),
                getHilos({ activo: true }),
                getMarcas({ activo: true }),
                getTiposProducto({ activo: true }),
                getEntalles({ activo: true }),
                getTelas({ activo: true }),
                getTizados({})
            ]);
            setMuestrasBase(muestrasRes.data);
            setHilos(hilosRes.data);
            setMarcas(marcasRes.data);
            setTiposProducto(tiposRes.data);
            setEntalles(entallesRes.data);
            setTelas(telasRes.data);
            setAllTizados(tizadosRes.data);
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
        setFormData({ nombre: '', activo: true, aprobado: false });
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
            const submitData = {
                ...formData,
                nombre: formData.nombre || ''
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

    // Open tizados dialog for a base
    const openTizadosDialog = (base) => {
        setCurrentBaseForFiles(base);
        setTizadoSearchInDialog('');
        setTizadosDialogOpen(true);
    };

    // Toggle tizado association with base
    const handleToggleTizadoAssociation = async (tizado) => {
        if (!currentBaseForFiles) return;
        
        const baseId = currentBaseForFiles.id;
        const currentBasesIds = tizado.bases_ids || [];
        const isAssociated = currentBasesIds.includes(baseId);
        
        let newBasesIds;
        if (isAssociated) {
            newBasesIds = currentBasesIds.filter(id => id !== baseId);
        } else {
            newBasesIds = [...currentBasesIds, baseId];
        }
        
        try {
            await updateTizado(tizado.id, { ...tizado, bases_ids: newBasesIds });
            toast.success(isAssociated ? 'Tizado desvinculado' : 'Tizado vinculado');
            
            // Refresh data
            fetchData();
            fetchCatalogs();
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === baseId);
            if (refreshed) setCurrentBaseForFiles(refreshed);
        } catch (error) {
            toast.error('Error al actualizar asociación');
        }
    };

    // Get tizados associated with current base
    const getTizadosForCurrentBase = () => {
        if (!currentBaseForFiles) return [];
        return allTizados.filter(t => (t.bases_ids || []).includes(currentBaseForFiles.id));
    };

    // Filter tizados by search
    const filteredTizadosInDialog = allTizados.filter(t => 
        t.nombre?.toLowerCase().includes(tizadoSearchInDialog.toLowerCase())
    );

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
    
    // Helper to get file extension
    const getFileExtension = (path) => {
        const ext = path?.split('.').pop()?.toUpperCase() || 'FILE';
        return ext;
    };

    // Convert fichas_archivos to structured array with names
    const getFichasWithNames = () => {
        if (!currentBaseForFiles?.fichas_archivos) return [];
        return currentBaseForFiles.fichas_archivos.map((archivo, index) => ({
            archivo,
            nombre: currentBaseForFiles.fichas_nombres?.[index] || getFileName(archivo)
        }));
    };

    // Convert tizados_archivos to structured array with names
    const getTizadosWithNames = () => {
        if (!currentBaseForFiles?.tizados_archivos) return [];
        return currentBaseForFiles.tizados_archivos.map((archivo, index) => ({
            archivo,
            nombre: currentBaseForFiles.tizados_nombres?.[index] || getFileName(archivo)
        }));
    };

    // Filter fichas by search
    const filteredFichas = getFichasWithNames().filter(ficha => 
        ficha.nombre.toLowerCase().includes(fichaSearch.toLowerCase())
    );

    // Filter tizados by search
    const filteredTizados = getTizadosWithNames().filter(tizado => 
        tizado.nombre.toLowerCase().includes(tizadoSearch.toLowerCase())
    );

    // Create new ficha with name and file
    const handleCreateFicha = async () => {
        if (!newFichaName || !newFichaFile || !currentBaseForFiles) return;
        
        setUploadingFiles(true);
        try {
            await uploadFichasBase(currentBaseForFiles.id, [newFichaFile], [newFichaName]);
            
            toast.success('Ficha creada correctamente');
            
            // Refresh data
            fetchData();
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
            
            // Reset form
            setNewFichaName('');
            setNewFichaFile(null);
            setShowNewFichaForm(false);
        } catch (error) {
            toast.error('Error al crear ficha');
        } finally {
            setUploadingFiles(false);
        }
    };

    // Create new tizado with name and file
    const handleCreateTizado = async () => {
        if (!newTizadoName || !newTizadoFile || !currentBaseForFiles) return;
        
        setUploadingFiles(true);
        try {
            await uploadTizadosBase(currentBaseForFiles.id, [newTizadoFile], [newTizadoName]);
            
            toast.success('Tizado creado correctamente');
            
            // Refresh data
            fetchData();
            const updated = await getBases({});
            const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
            if (refreshed) setCurrentBaseForFiles(refreshed);
            
            // Reset form
            setNewTizadoName('');
            setNewTizadoFile(null);
            setShowNewTizadoForm(false);
        } catch (error) {
            toast.error('Error al crear tizado');
        } finally {
            setUploadingFiles(false);
        }
    };

    // Handle upload to existing ficha (placeholder for future)
    const handleUploadToExistingFicha = (index) => {
        toast.info('Funcionalidad de subir archivo a ficha existente próximamente');
    };

    // Handle upload to existing tizado (placeholder for future)
    const handleUploadToExistingTizado = (index) => {
        toast.info('Funcionalidad de subir archivo a tizado existente próximamente');
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="bases-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>Bases</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestión de bases con patrones, imágenes, fichas y tizados
                    <span className="ml-2 text-slate-400 text-xs">(Arrastra los bordes de las columnas para ajustar el ancho)</span>
                </p>
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
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="flex justify-end p-2 border-b border-slate-100 bg-slate-50">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetWidths}
                        className="text-xs text-slate-500 hover:text-slate-700"
                        title="Restaurar anchos de columna"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restaurar
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <Table style={{ tableLayout: 'fixed', width: '100%', minWidth: '1000px' }}>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <ResizableTableHead columnKey="muestraBase" width={columnWidths.muestraBase} onResize={updateWidth}>Muestra Base</ResizableTableHead>
                                <ResizableTableHead columnKey="nombre" width={columnWidths.nombre} onResize={updateWidth}>Nombre</ResizableTableHead>
                                <ResizableTableHead columnKey="hilo" width={columnWidths.hilo} onResize={updateWidth}>Hilo</ResizableTableHead>
                                <ResizableTableHead columnKey="patron" width={columnWidths.patron} onResize={updateWidth}>Patrón</ResizableTableHead>
                                <ResizableTableHead columnKey="imagen" width={columnWidths.imagen} onResize={updateWidth}>Imagen</ResizableTableHead>
                                <ResizableTableHead columnKey="fichas" width={columnWidths.fichas} onResize={updateWidth}>Fichas</ResizableTableHead>
                                <ResizableTableHead columnKey="tizados" width={columnWidths.tizados} onResize={updateWidth}>Tizados</ResizableTableHead>
                                <ResizableTableHead columnKey="estado" width={columnWidths.estado} onResize={updateWidth}>Estado</ResizableTableHead>
                                <ResizableTableHead columnKey="acciones" width={columnWidths.acciones} onResize={updateWidth}>Acciones</ResizableTableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">Cargando...</TableCell></TableRow>
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-500">No hay bases registradas</TableCell></TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="table-row-hover border-b border-slate-100">
                                        <ResizableTableCell width={columnWidths.muestraBase}>
                                            {getMuestraBaseName(item.muestra_base_id)}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.nombre}>
                                            {item.nombre || '-'}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.hilo}>
                                            {getHiloName(item.hilo_id)}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.patron}>
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
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.imagen}>
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
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.fichas}>
                                            <Button variant="outline" size="sm" onClick={() => openFichasDialog(item)} className="h-7 text-xs">
                                                <FolderOpen className="w-3 h-3 mr-1" />
                                                {(item.fichas_archivos?.length || 0)} archivo(s)
                                            </Button>
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.tizados}>
                                            <Button variant="outline" size="sm" onClick={() => openTizadosDialog(item)} className="h-7 text-xs">
                                                <Link2 className="w-3 h-3 mr-1" />
                                                {(item.tizados_relacionados?.length || 0)} tizado(s)
                                            </Button>
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.estado}>
                                            <ApprovalBadge aprobado={item.aprobado} />
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.acciones}>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 px-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </ResizableTableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Base' : 'Nueva Base'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Muestra Base <span className="text-red-500">*</span></Label>
                            <Select value={formData.muestra_base_id || ''} onValueChange={(v) => handleChange('muestra_base_id', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar muestra base" className="truncate" />
                                </SelectTrigger>
                                <SelectContent className="max-w-lg">
                                    {muestrasBase.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="max-w-[450px]">
                                            <span className="truncate block max-w-[430px]">{getMuestraBaseName(m.id)}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input 
                                value={formData.nombre || ''} 
                                onChange={(e) => handleChange('nombre', e.target.value)}
                                placeholder="Nombre de la base (opcional)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hilo</Label>
                            <Select value={formData.hilo_id || ''} onValueChange={(v) => handleChange('hilo_id', v)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar hilo" /></SelectTrigger>
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
                        <DialogDescription className="sr-only">
                            Gestionar fichas técnicas de la base seleccionada
                        </DialogDescription>
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
                                            disabled={!newFichaName || !newFichaFile || uploadingFiles}
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

            {/* Tizados Dialog - Para vincular/desvincular tizados */}
            <Dialog open={tizadosDialogOpen} onOpenChange={setTizadosDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Tizados de Base
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500">
                            Selecciona los tizados que quieres vincular a esta base
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        {/* Tizados vinculados */}
                        {getTizadosForCurrentBase().length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Tizados vinculados ({getTizadosForCurrentBase().length})</Label>
                                <div className="flex flex-wrap gap-2">
                                    {getTizadosForCurrentBase().map(t => (
                                        <Badge key={t.id} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 gap-1 pr-1 cursor-pointer" onClick={() => handleToggleTizadoAssociation(t)}>
                                            <span>{t.nombre}</span>
                                            <X className="w-3 h-3 ml-1" />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Campo de búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar tizados..."
                                value={tizadoSearchInDialog}
                                onChange={(e) => setTizadoSearchInDialog(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>

                        {/* Lista de todos los tizados */}
                        <div className="border border-slate-200 rounded-lg">
                            <ScrollArea className="h-[250px]">
                                <div className="p-2 space-y-1">
                                    {filteredTizadosInDialog.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-8">
                                            No hay tizados disponibles. Crea uno desde la sección Tizados.
                                        </p>
                                    ) : (
                                        filteredTizadosInDialog.map(tizado => {
                                            const isLinked = (tizado.bases_ids || []).includes(currentBaseForFiles?.id);
                                            return (
                                                <label 
                                                    key={tizado.id}
                                                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                                                        isLinked ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <Checkbox 
                                                        checked={isLinked}
                                                        onCheckedChange={() => handleToggleTizadoAssociation(tizado)}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate">{tizado.nombre}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {tizado.ancho ? `Ancho: ${tizado.ancho}cm` : ''} 
                                                            {tizado.curva ? ` | Curva: ${tizado.curva}` : ''}
                                                        </p>
                                                    </div>
                                                    {isLinked && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Vinculado</Badge>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setTizadosDialogOpen(false)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-end">
                        <Button variant="outline" onClick={() => setTizadosDialogOpen(false)}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedItem?.nombre} loading={submitting} />
        </div>
    );
}
