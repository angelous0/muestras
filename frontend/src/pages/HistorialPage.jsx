import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Search, Calendar, User, FileText, RefreshCw, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Upload, Eye } from 'lucide-react';
import api from '../lib/api';

// Action badge colors
const actionColors = {
    CREAR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    EDITAR: 'bg-blue-100 text-blue-700 border-blue-200',
    ELIMINAR: 'bg-red-100 text-red-700 border-red-200',
    SUBIR_ARCHIVO: 'bg-purple-100 text-purple-700 border-purple-200',
    ELIMINAR_ARCHIVO: 'bg-orange-100 text-orange-700 border-orange-200',
    VER: 'bg-slate-100 text-slate-700 border-slate-200'
};

// Action icons
const ActionIcon = ({ accion }) => {
    switch (accion) {
        case 'CREAR': return <Plus className="w-3.5 h-3.5" />;
        case 'EDITAR': return <Pencil className="w-3.5 h-3.5" />;
        case 'ELIMINAR': return <Trash2 className="w-3.5 h-3.5" />;
        case 'SUBIR_ARCHIVO': return <Upload className="w-3.5 h-3.5" />;
        case 'ELIMINAR_ARCHIVO': return <Trash2 className="w-3.5 h-3.5" />;
        default: return <Eye className="w-3.5 h-3.5" />;
    }
};

// Entity badge colors
const entityColors = {
    'Base': 'bg-indigo-50 text-indigo-700',
    'Modelo': 'bg-violet-50 text-violet-700',
    'Muestra Base': 'bg-cyan-50 text-cyan-700',
    'Marca': 'bg-amber-50 text-amber-700',
    'Tela': 'bg-teal-50 text-teal-700',
    'Tizado': 'bg-rose-50 text-rose-700',
    'Ficha': 'bg-lime-50 text-lime-700',
    'Usuario': 'bg-fuchsia-50 text-fuchsia-700'
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return '';
};

export default function HistorialPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState(null);
    const [entities, setEntities] = useState([]);
    
    // Filters
    const [filterEntidad, setFilterEntidad] = useState('');
    const [filterAccion, setFilterAccion] = useState('');
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 30 };
            if (filterEntidad) params.entidad = filterEntidad;
            if (filterAccion) params.accion = filterAccion;
            
            const response = await api.get('/audit-logs', { params });
            setLogs(response.data.data || []);
            setTotal(response.data.total || 0);
            setTotalPages(response.data.pages || 0);
        } catch (error) {
            toast.error('Error al cargar historial');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/audit-logs/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error loading stats');
        }
    };

    const fetchEntities = async () => {
        try {
            const response = await api.get('/audit-logs/entities');
            setEntities(response.data || []);
        } catch (error) {
            console.error('Error loading entities');
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filterEntidad, filterAccion]);

    useEffect(() => {
        fetchStats();
        fetchEntities();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            (log.usuario_nombre || '').toLowerCase().includes(searchLower) ||
            (log.entidad_nombre || '').toLowerCase().includes(searchLower) ||
            (log.entidad || '').toLowerCase().includes(searchLower)
        );
    });

    const parseDetalles = (detalles) => {
        if (!detalles) return null;
        try {
            return JSON.parse(detalles);
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                        Historial de Modificaciones
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Registro de todas las acciones realizadas en el sistema
                    </p>
                </div>
                <Button onClick={() => { fetchLogs(); fetchStats(); }} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-slate-800">{total}</div>
                        <div className="text-sm text-slate-500">Total de registros</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-emerald-600">{stats.by_action?.CREAR || 0}</div>
                        <div className="text-sm text-slate-500">Creaciones</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">{stats.by_action?.EDITAR || 0}</div>
                        <div className="text-sm text-slate-500">Ediciones</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-red-600">{stats.by_action?.ELIMINAR || 0}</div>
                        <div className="text-sm text-slate-500">Eliminaciones</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Buscar por usuario o entidad..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={filterEntidad || "all"} onValueChange={(v) => setFilterEntidad(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Todas las entidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las entidades</SelectItem>
                            {entities.map(e => (
                                <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterAccion || "all"} onValueChange={(v) => setFilterAccion(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Todas las acciones" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las acciones</SelectItem>
                            <SelectItem value="CREAR">Crear</SelectItem>
                            <SelectItem value="EDITAR">Editar</SelectItem>
                            <SelectItem value="ELIMINAR">Eliminar</SelectItem>
                            <SelectItem value="SUBIR_ARCHIVO">Subir archivo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando historial...</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No hay registros en el historial</p>
                        <p className="text-sm mt-1">Las acciones que realices se registrarán aquí</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredLogs.map((log) => {
                            const detalles = parseDetalles(log.detalles);
                            return (
                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${actionColors[log.accion] || actionColors.VER}`}>
                                            <ActionIcon accion={log.accion} />
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <Badge className={`${actionColors[log.accion] || actionColors.VER} border`}>
                                                    {log.accion}
                                                </Badge>
                                                <Badge variant="outline" className={entityColors[log.entidad] || 'bg-slate-50'}>
                                                    {log.entidad}
                                                </Badge>
                                            </div>
                                            
                                            <p className="text-sm text-slate-800 font-medium">
                                                {log.entidad_nombre || `${log.entidad} #${log.entidad_id?.slice(-6) || ''}`}
                                            </p>
                                            
                                            {detalles && (
                                                <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2 max-w-xl">
                                                    {Object.entries(detalles).slice(0, 3).map(([key, value]) => (
                                                        <div key={key} className="flex gap-2">
                                                            <span className="text-slate-400">{key}:</span>
                                                            <span className="truncate">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {log.usuario_nombre || 'Sistema'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </span>
                                                {formatRelativeTime(log.created_at) && (
                                                    <span className="text-slate-300">
                                                        ({formatRelativeTime(log.created_at)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Página {page} de {totalPages} ({total} registros)
                        </p>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
