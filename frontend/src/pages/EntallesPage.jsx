import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { ItemFormDialog } from '../components/ItemFormDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getEntalles, createEntalle, updateEntalle, deleteEntalle } from '../lib/api';

const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Regular, Slim Fit, Oversize...' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción del entalle...' },
    { key: 'activo', label: 'Estado', type: 'switch', defaultValue: true },
];

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', render: (val) => val || '-' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function EntallesPage() {
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
            const response = await getEntalles(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar los entalles');
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
                await updateEntalle(selectedItem.id, formData);
                toast.success('Entalle actualizado correctamente');
            } else {
                await createEntalle(formData);
                toast.success('Entalle creado correctamente');
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
            await deleteEntalle(selectedItem.id);
            toast.success('Entalle eliminado correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="entalles-page">
            <div>
                <h1 
                    className="text-2xl font-bold text-slate-800"
                    style={{ fontFamily: 'Manrope' }}
                >
                    Entalles
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona los tipos de entalle
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
                emptyMessage="No hay entalles registrados"
                addButtonText="Nuevo Entalle"
                testIdPrefix="entalles"
            />

            <ItemFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                item={selectedItem}
                title="Entalle"
                fields={formFields}
                loading={submitting}
                testIdPrefix="entalle-form"
            />

            <DeleteConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={selectedItem?.nombre}
                loading={submitting}
                testIdPrefix="entalle-delete"
            />
        </div>
    );
}
