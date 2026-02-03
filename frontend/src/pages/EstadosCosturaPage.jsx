import { useState, useEffect, useCallback } from 'react';
import { getEstadosCostura, createEstadoCostura, updateEstadoCostura, deleteEstadoCostura, reorderEstadosCostura } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableRow = ({ item, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    return (
        <TableRow ref={setNodeRef} style={style} className="hover:bg-slate-50">
            <TableCell className="w-10">
                <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded">
                    <GripVertical className="w-4 h-4 text-slate-400" />
                </button>
            </TableCell>
            <TableCell className="font-medium">{item.nombre}</TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(item)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
            </TableCell>
        </TableRow>
    );
};

export default function EstadosCosturaPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ nombre: '' });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchData = useCallback(async () => {
        try {
            const res = await getEstadosCostura({ search });
            setData(res.data);
        } catch (error) {
            toast.error('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAdd = () => {
        setSelectedItem(null);
        setFormData({ nombre: '' });
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormData({ nombre: item.nombre });
        setFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateEstadoCostura(selectedItem.id, formData);
                toast.success('Actualizado correctamente');
            } else {
                await createEstadoCostura(formData);
                toast.success('Creado correctamente');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteEstadoCostura(selectedItem.id);
            toast.success('Eliminado correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = data.findIndex(i => i.id === active.id);
            const newIndex = data.findIndex(i => i.id === over.id);
            const newData = arrayMove(data, oldIndex, newIndex);
            setData(newData);
            try {
                await reorderEstadosCostura(newData.map((item, index) => ({ id: item.id, orden: index })));
            } catch (error) {
                toast.error('Error al reordenar');
                fetchData();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Estados Costura</h1>
                    <p className="text-slate-500 text-sm mt-1">Gestiona los estados de costura</p>
                </div>
                <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />Nuevo Estado
                </Button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-8">Cargando...</TableCell></TableRow>
                            ) : data.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-8">No hay estados registrados</TableCell></TableRow>
                            ) : (
                                <SortableContext items={data.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {data.map((item) => (
                                        <SortableRow key={item.id} item={item} onEdit={handleEdit} onDelete={(item) => { setSelectedItem(item); setDeleteOpen(true); }} />
                                    ))}
                                </SortableContext>
                            )}
                        </TableBody>
                    </Table>
                </DndContext>
            </div>

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Editar' : 'Nuevo'} Estado Costura</DialogTitle>
                        <DialogDescription className="sr-only">Formulario</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div>
                            <Label>Nombre *</Label>
                            <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
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
                    <DialogHeader><DialogTitle>Eliminar</DialogTitle><DialogDescription className="sr-only">Confirmar</DialogDescription></DialogHeader>
                    <p className="py-4">¿Eliminar "{selectedItem?.nombre}"?</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
