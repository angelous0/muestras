import { Badge } from './ui/badge';

export const StatusBadge = ({ activo }) => (
    <Badge 
        variant={activo ? 'default' : 'secondary'}
        className={activo 
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' 
            : 'bg-slate-100 text-slate-500 hover:bg-slate-100'
        }
    >
        {activo ? 'Activo' : 'Inactivo'}
    </Badge>
);

export const ApprovalBadge = ({ aprobado }) => (
    <Badge 
        variant={aprobado ? 'default' : 'secondary'}
        className={aprobado 
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
            : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
        }
    >
        {aprobado ? 'Aprobado' : 'Pendiente'}
    </Badge>
);

// Import and re-export DataTable
import { DataTable as DataTableComponent } from './DataTableBase';
export const DataTable = DataTableComponent;