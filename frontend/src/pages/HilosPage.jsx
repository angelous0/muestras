import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { ItemFormDialog } from '../components/ItemFormDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getHilos, createHilo, updateHilo, deleteHilo } from '../lib/api';

const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Hilo Polyester, Hilo Algodón...' },
    { key: 'activo', label: 'Estado', type: 'switch', defaultValue: true },
];

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function HilosPage() {
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
            const response = await getHilos(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar los hilos');
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

    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        try {
            if (selectedItem) {
                await updateHilo(selectedItem.id, formData);
                toast.success('Hilo actualizado correctamente');
            } else {
                await createHilo(formData);
                toast.success('Hilo creado correctamente');
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
            await deleteHilo(selectedItem.id);
            toast.success('Hilo eliminado correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="hilos-page">
            <div>
                <h1 
                    className="text-2xl font-bold text-slate-800"
                    style={{ fontFamily: 'Manrope' }}
                >
                    Hilos
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona los tipos de hilo
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
                emptyMessage="No hay hilos registrados"
                addButtonText="Nuevo Hilo"
                testIdPrefix="hilos"
                showActionButtons={true}
            />

            <ItemFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                item={selectedItem}
                title="Hilo"
                fields={formFields}
                loading={submitting}
                testIdPrefix="hilo-form"
            />

            <DeleteConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={selectedItem?.nombre}
                loading={submitting}
                testIdPrefix="hilo-delete"
            />
        </div>
    );
}
