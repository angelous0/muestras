import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DataTable, StatusBadge } from '../components/DataTable';
import { ItemFormDialog } from '../components/ItemFormDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { getTelas, createTela, updateTela, deleteTela } from '../lib/api';

const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Ej: Jersey, Piqué, French Terry...' },
    { key: 'composicion', label: 'Composición', type: 'text', placeholder: 'Ej: 100% Algodón, 95% Algodón 5% Elastano...' },
    { key: 'peso_gsm', label: 'Peso (GSM)', type: 'number', placeholder: 'Ej: 180', step: 1 },
    { key: 'activo', label: 'Estado', type: 'switch', defaultValue: true },
];

const tableColumns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'composicion', label: 'Composición', render: (val) => val || '-' },
    { key: 'peso_gsm', label: 'Peso (GSM)', render: (val) => val ? `${val} g/m²` : '-' },
    { key: 'activo', label: 'Estado', render: (val) => <StatusBadge activo={val} /> },
];

export default function TelasPage() {
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
            const response = await getTelas(params);
            setData(response.data);
        } catch (error) {
            toast.error('Error al cargar las telas');
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
                await updateTela(selectedItem.id, formData);
                toast.success('Tela actualizada correctamente');
            } else {
                await createTela(formData);
                toast.success('Tela creada correctamente');
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
            await deleteTela(selectedItem.id);
            toast.success('Tela eliminada correctamente');
            setDeleteOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" data-testid="telas-page">
            <div>
                <h1 
                    className="text-2xl font-bold text-slate-800"
                    style={{ fontFamily: 'Manrope' }}
                >
                    Telas
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                    Gestiona los tipos de tela
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
                emptyMessage="No hay telas registradas"
                addButtonText="Nueva Tela"
                testIdPrefix="telas"
                showActionButtons={true}
            />

            <ItemFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                item={selectedItem}
                title="Tela"
                fields={formFields}
                loading={submitting}
                testIdPrefix="tela-form"
            />

            <DeleteConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={selectedItem?.nombre}
                loading={submitting}
                testIdPrefix="tela-delete"
            />
        </div>
    );
}
