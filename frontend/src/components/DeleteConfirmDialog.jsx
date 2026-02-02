import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './ui/alert-dialog';

export const DeleteConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    itemName,
    loading = false,
    testIdPrefix = 'delete'
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle 
                        className="text-lg font-semibold text-slate-800"
                        style={{ fontFamily: 'Manrope' }}
                    >
                        Confirmar eliminación
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-600">
                        ¿Estás seguro de que deseas eliminar <strong className="text-slate-800">{itemName}</strong>? 
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        className="border-slate-200 hover:bg-slate-50"
                        data-testid={`${testIdPrefix}-cancel-btn`}
                    >
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        data-testid={`${testIdPrefix}-confirm-btn`}
                    >
                        {loading ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteConfirmDialog;
