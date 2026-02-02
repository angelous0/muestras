import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { 
    getMuestrasBase, createMuestraBase, updateMuestraBase, deleteMuestraBase, 
    uploadArchivoCostos, getFileUrl,
    getMarcas, getTiposProducto, getEntalles, getTelas
} from '../lib/api';
import {
    Table,
    TableBody,
    TableCell,
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
import { Search, Plus, Pencil, Trash2, Filter, X, Upload, FileSpreadsheet, Download, Percent, Check, Clock, RotateCcw } from 'lucide-react';

const ApprovalBadge = ({ aprobado }) => (
    <Badge className={aprobado ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
        {aprobado ? <><Check className="w-3 h-3 mr-1" />Aprobado</> : <><Clock className="w-3 h-3 mr-1" />Pendiente</>}
    </Badge>
);

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
    
    // Catalogs
    const [marcas, setMarcas] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [entalles, setEntalles] = useState([]);
    const [telas, setTelas] = useState([]);
    
    // For inline file upload
    const [uploadingId, setUploadingId] = useState(null);
    const fileInputRefs = useRef({});

    // Columnas redimensionables
    const defaultColumnWidths = {
        marca: 120,
        tipo: 120,
        entalle: 100,
        tela: 120,
        costo: 100,
        precio: 100,
        rentabilidad: 110,
        archivo: 100,
        aprobado: 100,
        acciones: 100
    };
    const { columnWidths, updateWidth, resetWidths } = useResizableColumns('muestras-base', defaultColumnWidths);

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

    // Helper to get catalog names
    const getCatalogName = (id, catalog) => catalog.find(c => c.id === id)?.nombre || '-';

    // Generate automatic name
    const generateNombre = (data) => {
        const marca = getCatalogName(data.marca_id, marcas);
        const tipo = getCatalogName(data.tipo_producto_id, tiposProducto);
        const tela = getCatalogName(data.tela_id, telas);
        const entalle = getCatalogName(data.entalle_id, entalles);
        
        const parts = [marca, tipo, tela, entalle].filter(p => p !== '-');
        return parts.length > 0 ? parts.join(' - ') : 'Nueva Muestra';
    };

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
            // Generate nombre automatically
            const submitData = {
                ...formData,
                nombre: generateNombre(formData)
            };
            
            if (selectedItem) {
                await updateMuestraBase(selectedItem.id, submitData);
                toast.success('Muestra actualizada correctamente');
            } else {
                await createMuestraBase(submitData);
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

    // Inline file upload
    const handleFileUpload = async (itemId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setUploadingId(itemId);
        try {
            await uploadArchivoCostos(itemId, file);
            toast.success('Archivo subido correctamente');
            fetchData();
        } catch (error) {
            toast.error('Error al subir archivo');
        } finally {
            setUploadingId(null);
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

    return (
        <div className="space-y-6 animate-fade-in" data-testid="muestras-base-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Muestras Base
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona las muestras base con costos y rentabilidad
                    <span className="ml-2 text-slate-400 text-xs">(Arrastra los bordes de las columnas para ajustar el ancho)</span>
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-10 bg-white"
                        data-testid="muestras-search"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
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

                    <Button onClick={handleAdd} className="bg-slate-800 hover:bg-slate-700 text-white" data-testid="muestras-add-btn">
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Muestra
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
                                <ResizableTableHead columnKey="marca" width={columnWidths.marca} onResize={updateWidth}>Marca</ResizableTableHead>
                                <ResizableTableHead columnKey="tipo" width={columnWidths.tipo} onResize={updateWidth}>Tipo</ResizableTableHead>
                                <ResizableTableHead columnKey="entalle" width={columnWidths.entalle} onResize={updateWidth}>Entalle</ResizableTableHead>
                                <ResizableTableHead columnKey="tela" width={columnWidths.tela} onResize={updateWidth}>Tela</ResizableTableHead>
                                <ResizableTableHead columnKey="costo" width={columnWidths.costo} onResize={updateWidth}>Costo</ResizableTableHead>
                                <ResizableTableHead columnKey="precio" width={columnWidths.precio} onResize={updateWidth}>Precio</ResizableTableHead>
                                <ResizableTableHead columnKey="rentabilidad" width={columnWidths.rentabilidad} onResize={updateWidth}>Rentabilidad</ResizableTableHead>
                                <ResizableTableHead columnKey="archivo" width={columnWidths.archivo} onResize={updateWidth}>Archivo</ResizableTableHead>
                                <ResizableTableHead columnKey="aprobado" width={columnWidths.aprobado} onResize={updateWidth}>Aprobado</ResizableTableHead>
                                <ResizableTableHead columnKey="acciones" width={columnWidths.acciones} onResize={updateWidth}>Acciones</ResizableTableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">Cargando...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">No hay muestras registradas</TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="table-row-hover border-b border-slate-100">
                                        <ResizableTableCell width={columnWidths.marca}>{getCatalogName(item.marca_id, marcas)}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.tipo}>{getCatalogName(item.tipo_producto_id, tiposProducto)}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.entalle}>{getCatalogName(item.entalle_id, entalles)}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.tela}>{getCatalogName(item.tela_id, telas)}</ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.costo}>
                                            {item.costo_estimado ? `S/ ${item.costo_estimado.toFixed(2)}` : '-'}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.precio}>
                                            {item.precio_estimado ? `S/ ${item.precio_estimado.toFixed(2)}` : '-'}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.rentabilidad}>
                                            {item.rentabilidad_esperada ? (
                                                <span className={`font-semibold ${
                                                    item.rentabilidad_esperada >= 30 ? 'text-emerald-600' : 
                                                    item.rentabilidad_esperada >= 15 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                    {item.rentabilidad_esperada}%
                                                </span>
                                            ) : '-'}
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.archivo}>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="file"
                                                    ref={el => fileInputRefs.current[item.id] = el}
                                                    onChange={(e) => handleFileUpload(item.id, e)}
                                                    accept=".xlsx,.xls,.csv"
                                                    className="hidden"
                                                />
                                                {item.archivo_costos ? (
                                                    <div className="flex items-center gap-1">
                                                        <a 
                                                            href={getFileUrl(item.archivo_costos)} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            <FileSpreadsheet className="w-4 h-4" />
                                                            <Download className="w-3 h-3" />
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => fileInputRefs.current[item.id]?.click()}
                                                            className="h-6 px-1 text-slate-500 hover:text-slate-700"
                                                            disabled={uploadingId === item.id}
                                                        >
                                                            <Upload className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => fileInputRefs.current[item.id]?.click()}
                                                        className="h-7 text-xs"
                                                        disabled={uploadingId === item.id}
                                                    >
                                                        {uploadingId === item.id ? (
                                                            'Subiendo...'
                                                        ) : (
                                                            <><Upload className="w-3 h-3 mr-1" />Excel</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.aprobado}>
                                            <ApprovalBadge aprobado={item.aprobado} />
                                        </ResizableTableCell>
                                        <ResizableTableCell width={columnWidths.acciones}>
                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleEdit(item)}
                                                    className="h-8 px-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDelete(item)}
                                                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedItem ? 'Editar Muestra Base' : 'Nueva Muestra Base'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Marca <span className="text-red-500">*</span></Label>
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
                                <Label className="text-sm font-medium text-slate-700">Tipo Producto <span className="text-red-500">*</span></Label>
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
                                <Label className="text-sm font-medium text-slate-700">Costo Estimado (S/)</Label>
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
                                <Label className="text-sm font-medium text-slate-700">Precio Estimado (S/)</Label>
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

                        <div className="flex items-center gap-6 pt-2">
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
