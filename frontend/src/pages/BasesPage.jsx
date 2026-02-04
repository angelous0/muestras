import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getBases, createBase, updateBase, deleteBase, 
    uploadPatron, uploadFichasBase, uploadTizadosBase,
    deleteFichaBase, deleteTizadoBase, getFileUrl,
    getMuestrasBase, getMarcas, getTiposProducto, getEntalles, getTelas,
    getTizados, updateTizado, createTizado, uploadArchivoTizado,
    getEstadosCostura, getAviosCostura, generateChecklistPdf
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
    FileSpreadsheet, Download, Image, Check, Clock, File, FolderOpen, RotateCcw, Link2,
    CheckSquare, Sparkles, FileText
} from 'lucide-react';

const ApprovalBadge = ({ aprobado }) => (
    <Badge className={aprobado ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
        {aprobado ? <><Check className="w-3 h-3 mr-1" />Aprobado</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
    </Badge>
);

// Component for bases search results in new tizado form
const BasesSearchResults = ({ searchTerm, data, currentBaseId, selectedBases, onToggle }) => {
    if (!searchTerm) {
        return <p className="text-center text-slate-400 text-sm py-3">Escribe para buscar bases...</p>;
    }
    
    const filtered = data
        .filter(b => b.id !== currentBaseId)
        .filter(b => b.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const results = filtered.slice(0, 10);
    const total = filtered.length;
    
    if (results.length === 0) {
        return <p className="text-center text-slate-400 text-sm py-3">No se encontraron bases</p>;
    }
    
    return (
        <>
            {results.map(base => (
                <div 
                    key={base.id} 
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 ${selectedBases.includes(base.id) ? 'bg-emerald-50' : ''}`}
                    onClick={() => onToggle(base.id)}
                >
                    <input 
                        type="checkbox" 
                        checked={selectedBases.includes(base.id)}
                        onChange={() => {}}
                        className="rounded"
                    />
                    <span className="text-sm">{base.nombre}</span>
                </div>
            ))}
            {total > 10 && (
                <p className="text-center text-slate-500 text-xs py-2 bg-slate-50">
                    Mostrando 10 de {total} resultados. Refina tu búsqueda.
                </p>
            )}
        </>
    );
};

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
    
    // Estados y Avios Costura
    const [allEstadosCostura, setAllEstadosCostura] = useState([]);
    const [allAviosCostura, setAllAviosCostura] = useState([]);
    const [estadosCosturaDialogOpen, setEstadosCosturaDialogOpen] = useState(false);
    const [aviosCosturaDialogOpen, setAviosCosturaDialogOpen] = useState(false);
    const [selectedEstadosCostura, setSelectedEstadosCostura] = useState([]);
    const [selectedAviosCostura, setSelectedAviosCostura] = useState([]);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    
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
    const [newTizadoFile, setNewTizadoFile] = useState(null);
    const [newTizadoAncho, setNewTizadoAncho] = useState('');
    const [newTizadoCurva, setNewTizadoCurva] = useState('');
    const [newTizadoOtrasBases, setNewTizadoOtrasBases] = useState([]);
    const [newTizadoBasesSearch, setNewTizadoBasesSearch] = useState('');
    const [creatingTizado, setCreatingTizado] = useState(false);
    const [tizadoSearch, setTizadoSearch] = useState('');
    
    // Catalogs
    const [muestrasBase, setMuestrasBase] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [entalles, setEntalles] = useState([]);
    const [telas, setTelas] = useState([]);
    
    // File input refs
    const patronInputRefs = useRef({});
    const fichasInputRef = useRef(null);
    const tizadosInputRef = useRef(null);
    const newFichaFileRef = useRef(null);
    const newTizadoFileRef = useRef(null);

    // Columnas redimensionables
    const defaultColumnWidths = {
        muestraBase: 180,
        nombre: 150,
        patron: 80,
        fichas_generales: 100,
        tizados: 80,
        estadosCostura: 100,
        aviosCostura: 100,
        estado: 80,
        acciones: 80
    };
    const { columnWidths, updateWidth, resetWidths } = useResizableColumns('bases', defaultColumnWidths);

    const fetchCatalogs = async () => {
        try {
            const [muestrasRes, marcasRes, tiposRes, entallesRes, telasRes, tizadosRes, estadosRes, aviosRes] = await Promise.all([
                getMuestrasBase({ activo: true }),
                getMarcas({ activo: true }),
                getTiposProducto({ activo: true }),
                getEntalles({ activo: true }),
                getTelas({ activo: true }),
                getTizados({}),
                getEstadosCostura({}),
                getAviosCostura({})
            ]);
            setMuestrasBase(muestrasRes.data);
            setMarcas(marcasRes.data);
            setTiposProducto(tiposRes.data);
            setEntalles(entallesRes.data);
            setTelas(telasRes.data);
            setAllTizados(tizadosRes.data);
            setAllEstadosCostura(estadosRes.data);
            setAllAviosCostura(aviosRes.data);
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

    // Helper to search base by nombre and muestra base components (marca, tipo, entalle, tela)
    const searchBase = (base, searchTerm) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        
        // Search by base nombre
        if (base.nombre && base.nombre.toLowerCase().includes(searchLower)) {
            return true;
        }
        
        // Search by muestra base components
        const muestra = muestrasBase.find(m => m.id === base.muestra_base_id);
        if (muestra) {
            // Search by marca
            const marca = marcas.find(m => m.id === muestra.marca_id);
            if (marca?.nombre?.toLowerCase().includes(searchLower)) return true;
            
            // Search by tipo producto
            const tipo = tiposProducto.find(t => t.id === muestra.tipo_producto_id);
            if (tipo?.nombre?.toLowerCase().includes(searchLower)) return true;
            
            // Search by entalle
            const entalle = entalles.find(e => e.id === muestra.entalle_id);
            if (entalle?.nombre?.toLowerCase().includes(searchLower)) return true;
            
            // Search by tela
            const tela = telas.find(t => t.id === muestra.tela_id);
            if (tela?.nombre?.toLowerCase().includes(searchLower)) return true;
            
            // Search by muestra nombre
            if (muestra.nombre?.toLowerCase().includes(searchLower)) return true;
        }
        
        return false;
    };

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

    // Create new tizado and link to current base + selected other bases
    const handleCreateNewTizado = async () => {
        if (!newTizadoAncho || !newTizadoCurva) {
            toast.error('Ancho y Curva son requeridos');
            return;
        }
        
        setCreatingTizado(true);
        try {
            // Create tizado with current base + selected other bases
            const allBasesIds = currentBaseForFiles ? [currentBaseForFiles.id, ...newTizadoOtrasBases] : [...newTizadoOtrasBases];
            const tizadoData = {
                nombre: `${newTizadoAncho}-${newTizadoCurva}`,
                ancho: parseFloat(newTizadoAncho),
                curva: newTizadoCurva,
                bases_ids: allBasesIds
            };
            
            const response = await createTizado(tizadoData);
            const newTizadoId = response.data.id;
            
            // Upload file if provided
            if (newTizadoFile) {
                await uploadArchivoTizado(newTizadoId, newTizadoFile);
            }
            
            toast.success('Tizado creado y vinculado');
            
            // Reset form
            setShowNewTizadoForm(false);
            setNewTizadoAncho('');
            setNewTizadoCurva('');
            setNewTizadoOtrasBases([]);
            setNewTizadoBasesSearch('');
            setNewTizadoFile(null);
            if (newTizadoFileRef.current) newTizadoFileRef.current.value = '';
            
            // Refresh data
            fetchData();
            fetchCatalogs();
        } catch (error) {
            toast.error('Error al crear tizado');
        } finally {
            setCreatingTizado(false);
        }
    };

    // Toggle base selection for new tizado
    const toggleBaseForNewTizado = (baseId) => {
        setNewTizadoOtrasBases(prev => 
            prev.includes(baseId) 
                ? prev.filter(id => id !== baseId)
                : [...prev, baseId]
        );
    };

    // Open Estados Costura dialog
    const openEstadosCosturaDialog = (base) => {
        setCurrentBaseForFiles(base);
        setSelectedEstadosCostura(base.estados_costura_ids || []);
        setEstadosCosturaDialogOpen(true);
    };

    // Open Avios Costura dialog
    const openAviosCosturaDialog = (base) => {
        setCurrentBaseForFiles(base);
        setSelectedAviosCostura(base.avios_costura_ids || []);
        setAviosCosturaDialogOpen(true);
    };

    // Toggle estado costura selection
    const toggleEstadoCostura = (id) => {
        setSelectedEstadosCostura(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Toggle avio costura selection
    const toggleAvioCostura = (id) => {
        setSelectedAviosCostura(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Save Estados Costura selection
    const saveEstadosCostura = async () => {
        if (!currentBaseForFiles) return;
        try {
            await updateBase(currentBaseForFiles.id, { 
                ...currentBaseForFiles, 
                estados_costura_ids: selectedEstadosCostura 
            });
            toast.success('Estados Costura actualizados');
            fetchData();
            setEstadosCosturaDialogOpen(false);
        } catch (error) {
            toast.error('Error al guardar');
        }
    };

    // Save Avios Costura selection
    const saveAviosCostura = async () => {
        if (!currentBaseForFiles) return;
        try {
            await updateBase(currentBaseForFiles.id, { 
                ...currentBaseForFiles, 
                avios_costura_ids: selectedAviosCostura 
            });
            toast.success('Avíos Costura actualizados');
            fetchData();
            setAviosCosturaDialogOpen(false);
        } catch (error) {
            toast.error('Error al guardar');
        }
    };

    // Generate PDF checklist and upload to Fichas
    const handleGenerateChecklistPdf = async (type) => {
        if (!currentBaseForFiles) return;
        
        const items = type === 'estados' 
            ? allEstadosCostura.filter(e => selectedEstadosCostura.includes(e.id))
            : allAviosCostura.filter(a => selectedAviosCostura.includes(a.id));
        
        if (items.length === 0) {
            toast.error('Selecciona al menos un item');
            return;
        }
        
        setGeneratingPdf(true);
        try {
            // First, save the selection to the base
            const updateData = {
                ...currentBaseForFiles,
                estados_costura_ids: type === 'estados' ? selectedEstadosCostura : currentBaseForFiles.estados_costura_ids,
                avios_costura_ids: type === 'avios' ? selectedAviosCostura : currentBaseForFiles.avios_costura_ids
            };
            await updateBase(currentBaseForFiles.id, updateData);
            
            // Then generate and save the PDF
            const title = type === 'estados' ? 'ESTADOS COSTURA' : 'AVIOS COSTURA';
            const itemNames = items.map(item => item.nombre);
            
            const response = await generateChecklistPdf(currentBaseForFiles.id, itemNames, title);
            
            if (response.data.updated) {
                toast.success(`Selección guardada y PDF "${title}" actualizado`);
            } else {
                toast.success(`Selección guardada y PDF "${title}" creado`);
            }
            fetchData();
            
            if (type === 'estados') {
                setEstadosCosturaDialogOpen(false);
            } else {
                setAviosCosturaDialogOpen(false);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar PDF');
        } finally {
            setGeneratingPdf(false);
        }
    };

    // Get tizados associated with current base
    const getTizadosForCurrentBase = () => {
        if (!currentBaseForFiles) return [];
        return allTizados.filter(t => (t.bases_ids || []).includes(currentBaseForFiles.id));
    };

    // Filter tizados - only show linked tizados, with optional search
    const filteredTizadosInDialog = allTizados.filter(t => {
        // First, only include tizados linked to current base
        const isLinked = (t.bases_ids || []).includes(currentBaseForFiles?.id);
        if (!isLinked) return false;
        
        const searchLower = tizadoSearchInDialog.toLowerCase();
        if (!searchLower) return true;
        
        // Search by ancho
        const anchoMatch = t.ancho?.toString().includes(searchLower);
        
        // Search by curva
        const curvaMatch = t.curva?.toLowerCase().includes(searchLower);
        
        // Search by otras bases names
        const otherBasesNames = (t.bases_ids || [])
            .filter(id => id !== currentBaseForFiles?.id)
            .map(id => {
                const base = data.find(b => b.id === id);
                return base?.nombre?.toLowerCase() || '';
            });
        const basesMatch = otherBasesNames.some(name => name.includes(searchLower));
        
        return anchoMatch || curvaMatch || basesMatch;
    });
    
    // State for editing bases of a specific tizado
    const [editingTizadoBases, setEditingTizadoBases] = useState(null);
    const [tempBasesIds, setTempBasesIds] = useState([]);
    const [basesEditorSearch, setBasesEditorSearch] = useState('');

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

    // Get other bases names for a tizado (excluding current base)
    const getOtherBasesNames = (tizado) => {
        if (!tizado.bases_ids || !currentBaseForFiles) return [];
        return tizado.bases_ids
            .filter(id => id !== currentBaseForFiles.id)
            .map(id => {
                const base = data.find(b => b.id === id);
                return base?.nombre || `Base ${id.slice(-6)}`;
            });
    };
    
    // Get all bases for a tizado (including current base)
    const getAllBasesForTizado = (tizado) => {
        if (!tizado.bases_ids) return [];
        return tizado.bases_ids.map(id => {
            const base = data.find(b => b.id === id);
            return { id, nombre: base?.nombre || `Base ${id.slice(-6)}` };
        });
    };
    
    // Open bases editor for a tizado
    const openBasesEditor = (tizado) => {
        setEditingTizadoBases(tizado);
        setTempBasesIds([...(tizado.bases_ids || [])]);
        setBasesEditorSearch('');
    };
    
    // Toggle base in temp list
    const toggleBaseInTemp = (baseId) => {
        setTempBasesIds(prev => {
            if (prev.includes(baseId)) {
                return prev.filter(id => id !== baseId);
            } else {
                return [...prev, baseId];
            }
        });
    };
    
    // Save bases for tizado
    const saveBasesForTizado = async () => {
        if (!editingTizadoBases) return;
        try {
            await updateTizado(editingTizadoBases.id, { ...editingTizadoBases, bases_ids: tempBasesIds });
            toast.success('Bases actualizadas');
            
            // Refresh data
            fetchData();
            fetchCatalogs();
            if (currentBaseForFiles) {
                const updated = await getBases({});
                const refreshed = updated.data.find(b => b.id === currentBaseForFiles.id);
                if (refreshed) setCurrentBaseForFiles(refreshed);
            }
            
            setEditingTizadoBases(null);
            setTempBasesIds([]);
        } catch (error) {
            toast.error('Error al actualizar bases');
        }
    };

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
                                <ResizableTableHead columnKey="patron" width={columnWidths.patron} onResize={updateWidth}>Patrón</ResizableTableHead>
                                <ResizableTableHead columnKey="fichas_generales" width={columnWidths.fichas_generales} onResize={updateWidth}>Fichas Gen.</ResizableTableHead>
                                <ResizableTableHead columnKey="tizados" width={columnWidths.tizados} onResize={updateWidth}>Tizados</ResizableTableHead>
                                <ResizableTableHead columnKey="estadosCostura" width={columnWidths.estadosCostura} onResize={updateWidth}>Est. Costura</ResizableTableHead>
                                <ResizableTableHead columnKey="aviosCostura" width={columnWidths.aviosCostura} onResize={updateWidth}>Avíos Cost.</ResizableTableHead>
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
                                        <ResizableTableCell width={columnWidths.fichas_generales}>
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
                                        <ResizableTableCell width={columnWidths.estadosCostura}>
                                            <Button variant="outline" size="sm" onClick={() => openEstadosCosturaDialog(item)} className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50">
                                                <CheckSquare className="w-3 h-3 mr-1" />
                                                {(item.estados_costura_ids?.length || 0)}
                                            </Button>
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.aviosCostura}>
                                            <Button variant="outline" size="sm" onClick={() => openAviosCosturaDialog(item)} className="h-7 text-xs text-amber-600 border-amber-200 hover:bg-amber-50">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                {(item.avios_costura_ids?.length || 0)}
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
                            <Label>Muestra Base <span className="text-red-500">*</span> <span className="text-slate-400 text-xs">(solo aprobadas)</span></Label>
                            <Select value={formData.muestra_base_id || ''} onValueChange={(v) => handleChange('muestra_base_id', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccionar muestra base" className="truncate" />
                                </SelectTrigger>
                                <SelectContent className="max-w-lg">
                                    {muestrasBase.filter(m => m.aprobado).map(m => (
                                        <SelectItem key={m.id} value={m.id} className="max-w-[450px]">
                                            <span className="truncate block max-w-[430px]">{m.n_muestra ? `${m.n_muestra} - ` : ''}{getMuestraBaseName(m.id)}</span>
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
                            Fichas Generales - Base #{currentBaseForFiles?.id?.slice(-4) || ''}
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

            {/* Tizados Dialog - Rediseñado con tabla */}
            <Dialog open={tizadosDialogOpen} onOpenChange={setTizadosDialogOpen}>
                <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Tizados Vinculados - {currentBaseForFiles?.nombre || `Base #${currentBaseForFiles?.id?.slice(-4)}`}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Ver tizados vinculados a esta base
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-4">
                        {/* Botón para nuevo tizado */}
                        {!showNewTizadoForm && (
                            <Button 
                                onClick={() => setShowNewTizadoForm(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                size="sm"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Nuevo Tizado
                            </Button>
                        )}

                        {/* Formulario de nuevo tizado */}
                        {showNewTizadoForm && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <h4 className="font-medium text-slate-700">Crear Nuevo Tizado</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs text-slate-500">Ancho (cm) *</Label>
                                        <Input 
                                            type="number"
                                            placeholder="160"
                                            value={newTizadoAncho}
                                            onChange={(e) => setNewTizadoAncho(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-500">Curva *</Label>
                                        <Input 
                                            placeholder="2-3-3-2"
                                            value={newTizadoCurva}
                                            onChange={(e) => setNewTizadoCurva(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-slate-500">Archivo (opcional)</Label>
                                        <Input 
                                            ref={newTizadoFileRef}
                                            type="file"
                                            onChange={(e) => setNewTizadoFile(e.target.files?.[0])}
                                            className="bg-white"
                                        />
                                    </div>
                                </div>
                                
                                {/* Selector de otras bases */}
                                <div>
                                    <Label className="text-xs text-slate-500 mb-2 block">Otras bases a vincular (opcional)</Label>
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input 
                                            placeholder="Escribe para buscar bases..."
                                            value={newTizadoBasesSearch}
                                            onChange={(e) => setNewTizadoBasesSearch(e.target.value)}
                                            className="pl-10 bg-white"
                                        />
                                    </div>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                                        <BasesSearchResults 
                                            searchTerm={newTizadoBasesSearch}
                                            data={data}
                                            currentBaseId={currentBaseForFiles?.id}
                                            selectedBases={newTizadoOtrasBases}
                                            onToggle={toggleBaseForNewTizado}
                                        />
                                    </div>
                                    {newTizadoOtrasBases.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            <span className="text-xs text-slate-500 mr-1">Seleccionadas:</span>
                                            {newTizadoOtrasBases.map(baseId => {
                                                const base = data.find(b => b.id === baseId);
                                                return (
                                                    <Badge key={baseId} variant="secondary" className="text-xs">
                                                        {base?.nombre || baseId.slice(-4)}
                                                        <X 
                                                            className="w-3 h-3 ml-1 cursor-pointer" 
                                                            onClick={(e) => { e.stopPropagation(); toggleBaseForNewTizado(baseId); }}
                                                        />
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            setShowNewTizadoForm(false);
                                            setNewTizadoAncho('');
                                            setNewTizadoCurva('');
                                            setNewTizadoOtrasBases([]);
                                            setNewTizadoBasesSearch('');
                                            setNewTizadoFile(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={handleCreateNewTizado}
                                        disabled={creatingTizado || !newTizadoAncho || !newTizadoCurva}
                                        className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        {creatingTizado ? 'Creando...' : 'Crear y Vincular'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Campo de búsqueda */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar por ancho, curva u otras bases..."
                                value={tizadoSearchInDialog}
                                onChange={(e) => setTizadoSearchInDialog(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>

                        {/* Tabla de tizados vinculados */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-24">Ancho</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-28">Curva</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3">Otras Bases</TableHead>
                                        <TableHead className="text-slate-500 uppercase text-xs tracking-wider font-semibold py-2 px-3 w-24">Archivo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTizadosInDialog.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                                No hay tizados vinculados a esta base
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTizadosInDialog.map((tizado) => {
                                            const otherBases = getOtherBasesNames(tizado);
                                            return (
                                                <TableRow key={tizado.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <TableCell className="py-2 px-3 text-sm text-slate-600">
                                                        {tizado.ancho ? `${tizado.ancho} cm` : '-'}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3 text-sm text-slate-600">
                                                        {tizado.curva || '-'}
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3 text-sm">
                                                        <div className="flex flex-wrap gap-1">
                                                            {otherBases.length > 0 ? (
                                                                <>
                                                                    {otherBases.slice(0, 3).map((name, i) => (
                                                                        <Badge key={i} variant="outline" className="text-xs truncate max-w-[100px]">
                                                                            {name}
                                                                        </Badge>
                                                                    ))}
                                                                    {otherBases.length > 3 && (
                                                                        <Badge variant="secondary" className="text-xs">+{otherBases.length - 3}</Badge>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">Solo esta base</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2 px-3">
                                                        {tizado.archivo_tizado ? (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => window.open(getFileUrl(tizado.archivo_tizado), '_blank')}
                                                                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            >
                                                                <Download className="w-3 h-3 mr-1" />
                                                                Ver
                                                            </Button>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
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
            
            {/* Dialog para editar bases de un tizado */}
            <Dialog open={!!editingTizadoBases} onOpenChange={(open) => !open && setEditingTizadoBases(null)}>
                <DialogContent className="sm:max-w-md bg-white max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader className="border-b border-slate-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            Editar Bases del Tizado
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                            Ancho: {editingTizadoBases?.ancho || '-'} cm | Curva: {editingTizadoBases?.curva || '-'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4 space-y-3">
                        <p className="text-sm text-slate-500">Selecciona las bases a vincular con este tizado:</p>
                        
                        {/* Buscador de bases */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar por nombre, marca, tipo, entalle, tela..."
                                value={basesEditorSearch}
                                onChange={(e) => setBasesEditorSearch(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                            {data
                                .filter(base => searchBase(base, basesEditorSearch))
                                .map((base) => (
                                <label 
                                    key={base.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        tempBasesIds.includes(base.id) 
                                            ? 'bg-emerald-50 border-emerald-300' 
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <Checkbox 
                                        checked={tempBasesIds.includes(base.id)}
                                        onCheckedChange={() => toggleBaseInTemp(base.id)}
                                    />
                                    <span className="text-sm text-slate-700 flex-1 truncate">
                                        {base.nombre || getMuestraBaseName(base.muestra_base_id)}
                                    </span>
                                </label>
                            ))}
                            {data.filter(base => searchBase(base, basesEditorSearch)).length === 0 && (
                                <p className="text-center text-slate-400 py-4 text-sm">No se encontraron bases</p>
                            )}
                        </div>
                    </div>
                    <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingTizadoBases(null)}>Cancelar</Button>
                        <Button onClick={saveBasesForTizado} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Guardar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} itemName={selectedItem?.nombre} loading={submitting} />

            {/* Estados Costura Dialog */}
            <Dialog open={estadosCosturaDialogOpen} onOpenChange={setEstadosCosturaDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-purple-700">
                            <CheckSquare className="w-5 h-5" />
                            Estados Costura - {currentBaseForFiles?.nombre}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Seleccionar estados de costura</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-500">Selecciona los estados de costura para esta base</p>
                        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                            {allEstadosCostura.length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-sm">No hay estados de costura registrados</p>
                            ) : (
                                allEstadosCostura.map(estado => (
                                    <label 
                                        key={estado.id} 
                                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-slate-100 last:border-0 ${selectedEstadosCostura.includes(estado.id) ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <Checkbox 
                                            checked={selectedEstadosCostura.includes(estado.id)}
                                            onCheckedChange={() => toggleEstadoCostura(estado.id)}
                                        />
                                        <span className="text-sm">{estado.nombre}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="text-sm text-slate-500">
                            {selectedEstadosCostura.length} estado(s) seleccionado(s)
                        </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => handleGenerateChecklistPdf('estados')}
                            disabled={generatingPdf || selectedEstadosCostura.length === 0}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {generatingPdf ? 'Generando...' : 'Generar PDF Checklist'}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setEstadosCosturaDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={saveEstadosCostura} className="bg-purple-600 hover:bg-purple-700 text-white">Guardar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Avios Costura Dialog */}
            <Dialog open={aviosCosturaDialogOpen} onOpenChange={setAviosCosturaDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-amber-700">
                            <Sparkles className="w-5 h-5" />
                            Avíos Costura - {currentBaseForFiles?.nombre}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Seleccionar avíos de costura</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-500">Selecciona los avíos de costura para esta base</p>
                        <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                            {allAviosCostura.length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-sm">No hay avíos de costura registrados</p>
                            ) : (
                                allAviosCostura.map(avio => (
                                    <label 
                                        key={avio.id} 
                                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-slate-100 last:border-0 ${selectedAviosCostura.includes(avio.id) ? 'bg-amber-50' : 'hover:bg-slate-50'}`}
                                    >
                                        <Checkbox 
                                            checked={selectedAviosCostura.includes(avio.id)}
                                            onCheckedChange={() => toggleAvioCostura(avio.id)}
                                        />
                                        <span className="text-sm">{avio.nombre}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <div className="text-sm text-slate-500">
                            {selectedAviosCostura.length} avío(s) seleccionado(s)
                        </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => handleGenerateChecklistPdf('avios')}
                            disabled={generatingPdf || selectedAviosCostura.length === 0}
                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            {generatingPdf ? 'Generando...' : 'Generar PDF Checklist'}
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setAviosCosturaDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={saveAviosCostura} className="bg-amber-600 hover:bg-amber-700 text-white">Guardar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
