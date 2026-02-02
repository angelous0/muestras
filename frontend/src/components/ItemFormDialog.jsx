import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';

export const ItemFormDialog = ({
    open,
    onClose,
    onSubmit,
    item,
    title,
    fields = [],
    loading = false,
    testIdPrefix = 'form'
}) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({ ...item });
        } else {
            const initialData = { activo: true };
            fields.forEach(f => {
                if (f.defaultValue !== undefined) {
                    initialData[f.key] = f.defaultValue;
                }
            });
            setFormData(initialData);
        }
    }, [item, open, fields]);

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const renderField = (field) => {
        const value = formData[field.key] ?? '';

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        id={field.key}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                        data-testid={`${testIdPrefix}-${field.key}`}
                        rows={3}
                    />
                );
            case 'number':
                return (
                    <Input
                        id={field.key}
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder={field.placeholder}
                        className="bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                        data-testid={`${testIdPrefix}-${field.key}`}
                        step={field.step || 'any'}
                    />
                );
            case 'switch':
                return (
                    <div className="flex items-center gap-3">
                        <Switch
                            id={field.key}
                            checked={formData[field.key] ?? false}
                            onCheckedChange={(checked) => handleChange(field.key, checked)}
                            data-testid={`${testIdPrefix}-${field.key}`}
                        />
                        <span className="text-sm text-slate-600">
                            {formData[field.key] ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                );
            default:
                return (
                    <Input
                        id={field.key}
                        type="text"
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-200"
                        data-testid={`${testIdPrefix}-${field.key}`}
                        required={field.required}
                    />
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle 
                        className="text-lg font-semibold text-slate-800"
                        style={{ fontFamily: 'Manrope' }}
                    >
                        {item ? `Editar ${title}` : `Nuevo ${title}`}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label 
                                htmlFor={field.key}
                                className="text-sm font-medium text-slate-700"
                            >
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderField(field)}
                        </div>
                    ))}

                    <DialogFooter className="gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-200 hover:bg-slate-50"
                            data-testid={`${testIdPrefix}-cancel-btn`}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-slate-800 hover:bg-slate-700 text-white btn-active"
                            data-testid={`${testIdPrefix}-submit-btn`}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ItemFormDialog;
