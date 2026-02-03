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
import { Search, Plus, Pencil, Trash2, Upload, Download, FileText, X } from 'lucide-react';

function ModelosPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({});
    const [bases, setBases] = useState([]);
    const [hilos, setHilos] = useState([]);
    const [fichasDialogOpen, setFichasDialogOpen] = useState(false);
    const [currentModelo, setCurrentModelo] = useState(null);
    const [fichaFile, setFichaFile] = useState(null);
    const [fichaName, setFichaName] = useState('');
    const [uploadingFicha, setUploadingFicha] = useState(false);
    const fichaInputRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getModelos({ search });
            setData(res.data);
        } catch (err) {
            toast.error('Error al cargar');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        getBases({ activo: true }).then(res => setBases(res.data)).catch(() => {});
        getHilos({ activo: true }).then(res => setHilos(res.data)).catch(() => {});
    }, []);

    const getBaseName = (id) => bases.find(b => b.id === id)?.nombre || '-';
    const getHiloName = (id) => hilos.find(h => h.id === id)?.nombre || '-';

    const handleAdd = () => {
        setSelectedItem(null);
        setFormData({ aprobado: false });
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({ nombre: item.nombre, base_id: item.base_id, hilo_id: item.hilo_id, aprobado: item.aprobado });
        setFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.base_id) { toast.error('Selecciona una base'); return; }
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateModelo(selectedItem.id, formData);
                toast.success('Actualizado');
            } else {
                await createModelo(formData);
                toast.success('Creado');
            }
            setFormOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteModelo(selectedItem.id);
            toast.success('Eliminado');
            setDeleteOpen(false);
            fetchData();
        } catch (err) {
            toast.error('Error');
        }
    };

    const openFichasDialog = (modelo) => {
        setCurrentModelo(modelo);
        setFichasDialogOpen(true);
        setFichaFile(null);
        setFichaName('');
    };

    const handleUploadFicha = async () => {
        if (!fichaFile || !currentModelo) return;
        setUploadingFicha(true);
        try {
            await uploadFichaModelo(currentModelo.id, [fichaFile], fichaName ? [fichaName] : []);
            toast.success('Ficha subida');
            setFichaFile(null);
            setFichaName('');
            fetchData();
            const res = await getModelos({});
            setCurrentModelo(res.data.find(m => m.id === currentModelo.id));
        } catch (err) {
            toast.error('Error');
        } finally {
            setUploadingFicha(false);
        }
    };

    const handleDeleteFicha = async (index) => {
        try {
            await deleteFichaModelo(currentModelo.id, index);
            toast.success('Eliminada');
            fetchData();
            const res = await getModelos({});
            setCurrentModelo(res.data.find(m => m.id === currentModelo.id));
        } catch (err) {
            toast.error('Error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Modelos</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona los modelos vinculados a bases</p>
                </div>
                <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Nuevo Modelo
                </Button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); fetchData(); }} className="pl-10 bg-white" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead>Nombre</TableHead>
                            <TableHead>Base</TableHead>
                            <TableHead>Hilo</TableHead>
                            <TableHead>Fichas</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">No hay modelos</TableCell></TableRow>
                        ) : data.map((item) => (
                            <TableRow key={item.id} className="hover:bg-slate-50">
                                <TableCell className="font-medium">{item.nombre || '-'}</TableCell>
                                <TableCell>{getBaseName(item.base_id)}</TableCell>
                                <TableCell>{getHiloName(item.hilo_id)}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => openFichasDialog(item)} className="text-blue-600">
                                        <FileText className="w-4 h-4 mr-1" />{item.fichas_archivos?.length || 0}
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Badge className={item.aprobado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                        {item.aprobado ? 'Aprobado' : 'Pendiente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setDeleteOpen(true); }} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Editar' : 'Nuevo'} Modelo</DialogTitle>
                        <DialogDescription className="sr-only">Form</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div>
                            <Label>Nombre</Label>
                            <Input value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                        <div>
                            <Label>Base *</Label>
                            <Select value={formData.base_id || ''} onValueChange={(v) => setFormData({...formData, base_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>{bases.filter(b => b.aprobado).map(b => <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Hilo</Label>
                            <Select value={formData.hilo_id || ''} onValueChange={(v) => setFormData({...formData, hilo_id: v})}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent>{hilos.map(h => <SelectItem key={h.id} value={h.id}>{h.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.aprobado || false} onChange={(e) => setFormData({...formData, aprobado: e.target.checked})} />
                            <Label>Aprobado</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting ? '...' : 'Guardar'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader><DialogTitle>Eliminar</DialogTitle><DialogDescription className="sr-only">Confirm</DialogDescription></DialogHeader>
                    <p className="py-4">¿Eliminar "{selectedItem?.nombre}"?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={fichasDialogOpen} onOpenChange={setFichasDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Fichas - {currentModelo?.nombre}</DialogTitle>
                        <DialogDescription className="sr-only">Fichas</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                            <Input placeholder="Nombre (opcional)" value={fichaName} onChange={(e) => setFichaName(e.target.value)} />
                            <div className="flex gap-2">
                                <Input ref={fichaInputRef} type="file" onChange={(e) => setFichaFile(e.target.files?.[0])} />
                                <Button onClick={handleUploadFicha} disabled={!fichaFile || uploadingFicha} className="bg-emerald-600">
                                    <Upload className="w-4 h-4 mr-1" />{uploadingFicha ? '...' : 'Subir'}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {currentModelo?.fichas_archivos?.map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-white border rounded">
                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4" />{currentModelo.fichas_nombres?.[i] || 'Ficha'}</span>
                                    <div>
                                        <Button variant="ghost" size="sm" onClick={() => window.open(getFileUrl(a), '_blank')}><Download className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFicha(i)} className="text-red-600"><X className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                            {(!currentModelo?.fichas_archivos?.length) && <p className="text-center text-slate-400 py-4">Sin fichas</p>}
                        </div>
                    </div>
                    <div className="flex justify-end"><Button variant="outline" onClick={() => setFichasDialogOpen(false)}>Cerrar</Button></div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ModelosPage;
