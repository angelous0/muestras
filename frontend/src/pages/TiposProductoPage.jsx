import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SortableDataTable } from '../components/SortableDataTable';
import { StatusBadge } from '../components/DataTable';
import { ItemFormDialog } from '../components/ItemFormDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getTiposProducto, createTipoProducto, updateTipoProducto, deleteTipoProducto, reorderTiposProducto } from '../lib/api';

const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Camiseta, Pantalón, Vestido...' },
    { key: 'activo', label: 'Estado', type: 'switch', defaultValue: true },
];

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function TiposProductoPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (filterActive !== null) params.activo = filterActive;
            const response = await getTiposProducto(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar los tipos de producto');
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
        setFormOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setFormOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const handleReorder = async (newData, reorderItems) => {
        setData(newData);
        try {
            await reorderTiposProducto(reorderItems);
        } catch (error) {
            toast.error('Error al reordenar');
            fetchData();
        }
    };

    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateTipoProducto(selectedItem.id, formData);
                toast.success('Tipo de producto actualizado correctamente');
            } else {
                await createTipoProducto(formData);
                toast.success('Tipo de producto creado correctamente');
            }
            setFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            await deleteTipoProducto(selectedItem.id);
            toast.success('Tipo de producto eliminado correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="tipos-producto-page">
            <div>
                <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Tipos de Producto
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona los tipos de producto textil
                </p>
            </div>

            <SortableDataTable
                data={data}
                columns={tableColumns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReorder={handleReorder}
                searchValue={search}
                onSearchChange={setSearch}
                filterActive={filterActive}
                onFilterChange={setFilterActive}
                loading={loading}
                emptyMessage="No hay tipos de producto registrados"
                addButtonText="Nuevo Tipo"
                testIdPrefix="tipos-producto"
                showActionButtons={true}
            />

            <ItemFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                item={selectedItem}
                title="Tipo de Producto"
                fields={formFields}
                loading={submitting}
                testIdPrefix="tipo-producto-form"
            />

            <DeleteConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={selectedItem?.nombre}
                loading={submitting}
                testIdPrefix="tipo-producto-delete"
            />
        </div>
    );
}
