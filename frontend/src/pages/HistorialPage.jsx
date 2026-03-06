import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Search, Calendar, User, FileText, RefreshCw, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Upload, Eye, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

// Action colors - más visibles
const actionStyles = {
    CREAR: {
        bg: 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-l-emerald-500',
        badge: 'bg-emerald-500 text-white',
        icon: 'bg-emerald-100 text-emerald-600',
        text: 'text-emerald-700'
    },
    EDITAR: {
        bg: 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500',
        badge: 'bg-blue-500 text-white',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-700'
    },
    ELIMINAR: {
        bg: 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500',
        badge: 'bg-red-500 text-white',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-700'
    },
    SUBIR_ARCHIVO: {
        bg: 'bg-purple-50 hover:bg-purple-100 border-l-4 border-l-purple-500',
        badge: 'bg-purple-500 text-white',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-700'
    }
};

const defaultStyle = {
    bg: 'bg-slate-50 hover:bg-slate-100 border-l-4 border-l-slate-400',
    badge: 'bg-slate-500 text-white',
    icon: 'bg-slate-100 text-slate-600',
    text: 'text-slate-700'
};

// Action icons
const ActionIcon = ({ accion, className }) => {
    const icons = {
        CREAR: Plus,
        EDITAR: Pencil,
        ELIMINAR: Trash2,
        SUBIR_ARCHIVO: Upload,
        ELIMINAR_ARCHIVO: Trash2
    };
    const Icon = icons[accion] || Eye;
    return <Icon className={className || "w-4 h-4"} />;
};

// Entity colors
const entityColors = {
    'Base': 'bg-indigo-100 text-indigo-700',
    'Modelo': 'bg-violet-100 text-violet-700',
    'Muestra Base': 'bg-cyan-100 text-cyan-700',
    'Marca': 'bg-amber-100 text-amber-700',
    'Tela': 'bg-teal-100 text-teal-700',
    'Entalle': 'bg-pink-100 text-pink-700',
    'Tipo Producto': 'bg-orange-100 text-orange-700',
    'Hilo': 'bg-lime-100 text-lime-700',
    'Tizado': 'bg-rose-100 text-rose-700',
    'Usuario': 'bg-fuchsia-100 text-fuchsia-700'
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
    
    if (diffMins < 1) return 'Ahora mismo';
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
    
    // Detail modal
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [restoring, setRestoring] = useState(false);
    
    // Expanded rows
    const [expandedRows, setExpandedRows] = useState({});

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
    
    const toggleExpand = (logId) => {
        setExpandedRows(prev => ({
            ...prev,
            [logId]: !prev[logId]
        }));
    };
    
    const openDetail = (log) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };
    
    const handleRestore = async () => {
        if (!selectedLog) return;
        
        const detalles = parseDetalles(selectedLog.detalles);
        if (!detalles?.datos_completos) {
            toast.error('No hay datos para restaurar');
            return;
        }
        
        setRestoring(true);
        try {
            // Determinar el endpoint según la entidad
            const endpoints = {
                'Marca': '/marcas',
                'Tipo Producto': '/tipos-producto',
                'Entalle': '/entalles',
                'Tela': '/telas',
                'Hilo': '/hilos',
                'Muestra Base': '/muestras-base',
                'Base': '/bases',
                'Modelo': '/modelos',
                'Tizado': '/tizados'
            };
            
            const endpoint = endpoints[selectedLog.entidad];
            if (!endpoint) {
                toast.error('No se puede restaurar esta entidad');
                return;
            }
            
            // Crear nuevo registro con los datos guardados
            const datosRestaurar = { ...detalles.datos_completos };
            delete datosRestaurar.id;
            delete datosRestaurar.created_at;
            delete datosRestaurar.updated_at;
            
            await api.post(endpoint, datosRestaurar);
            toast.success(`${selectedLog.entidad} restaurado correctamente`);
            setDetailOpen(false);
            fetchLogs();
            fetchStats();
        } catch (error) {
            toast.error('Error al restaurar: ' + (error.response?.data?.detail || error.message));
        } finally {
            setRestoring(false);
        }
    };

    const getStyle = (accion) => actionStyles[accion] || defaultStyle;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                        Historial de Modificaciones
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Registro de todas las acciones • Clic en cada registro para ver detalles
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
                    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                        <div className="text-2xl font-bold text-emerald-600">{stats.by_action?.CREAR || 0}</div>
                        <div className="text-sm text-emerald-600 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Creaciones
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">{stats.by_action?.EDITAR || 0}</div>
                        <div className="text-sm text-blue-600 flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Ediciones
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                        <div className="text-2xl font-bold text-red-600">{stats.by_action?.ELIMINAR || 0}</div>
                        <div className="text-sm text-red-600 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Eliminaciones
                        </div>
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
                            const style = getStyle(log.accion);
                            const detalles = parseDetalles(log.detalles);
                            const isExpanded = expandedRows[log.id];
                            const canRestore = log.accion === 'ELIMINAR' && detalles?.datos_completos;
                            
                            return (
                                <div 
                                    key={log.id} 
                                    className={`${style.bg} transition-all cursor-pointer`}
                                    onClick={() => openDetail(log)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start gap-4">
                                            {/* Action Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                                                <ActionIcon accion={log.accion} />
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <Badge className={style.badge}>
                                                        {log.accion}
                                                    </Badge>
                                                    <Badge className={entityColors[log.entidad] || 'bg-slate-100 text-slate-700'}>
                                                        {log.entidad}
                                                    </Badge>
                                                    {canRestore && (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                                            <RotateCcw className="w-3 h-3 mr-1" />
                                                            Restaurable
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <p className={`text-sm font-semibold ${style.text}`}>
                                                    {log.entidad_nombre || `${log.entidad} #${log.entidad_id?.slice(-6) || ''}`}
                                                </p>
                                                
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {log.usuario_nombre || 'Sistema'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(log.created_at)}
                                                    </span>
                                                    {formatRelativeTime(log.created_at) && (
                                                        <span className="text-slate-400 font-medium">
                                                            {formatRelativeTime(log.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Arrow */}
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between bg-white">
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
            
            {/* Detail Modal */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-lg bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedLog && (
                                <>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStyle(selectedLog.accion).icon}`}>
                                        <ActionIcon accion={selectedLog.accion} className="w-4 h-4" />
                                    </div>
                                    <span>Detalle de {selectedLog.accion?.toLowerCase()}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="sr-only">Detalles del registro de auditoría</DialogDescription>
                    </DialogHeader>
                    
                    {selectedLog && (
                        <div className="space-y-4 py-4">
                            {/* Main info */}
                            <div className={`p-4 rounded-lg ${getStyle(selectedLog.accion).bg.replace('hover:bg-', '').replace('border-l-4 border-l-', 'border ')}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getStyle(selectedLog.accion).badge}>
                                        {selectedLog.accion}
                                    </Badge>
                                    <Badge className={entityColors[selectedLog.entidad] || 'bg-slate-100'}>
                                        {selectedLog.entidad}
                                    </Badge>
                                </div>
                                <p className="font-semibold text-lg text-slate-800">
                                    {selectedLog.entidad_nombre || `${selectedLog.entidad} #${selectedLog.entidad_id?.slice(-8)}`}
                                </p>
                            </div>
                            
                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Usuario:</span>
                                    <p className="font-medium">{selectedLog.usuario_nombre}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Fecha:</span>
                                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500">ID del registro:</span>
                                    <p className="font-mono text-xs bg-slate-100 p-1 rounded mt-1">{selectedLog.entidad_id}</p>
                                </div>
                            </div>
                            
                            {/* Detalles */}
                            {parseDetalles(selectedLog.detalles) && (
                                <div>
                                    <span className="text-slate-500 text-sm">Datos registrados:</span>
                                    <div className="bg-slate-50 rounded-lg p-3 mt-2 max-h-48 overflow-y-auto">
                                        <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                                            {JSON.stringify(parseDetalles(selectedLog.detalles), null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                            
                            {/* Restore button for deletions */}
                            {selectedLog.accion === 'ELIMINAR' && parseDetalles(selectedLog.detalles)?.datos_completos && (
                                <div className="border-t pt-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                                        <p className="text-sm text-amber-800">
                                            <strong>¿Restaurar este elemento?</strong><br/>
                                            Se creará un nuevo registro con los datos que tenía antes de ser eliminado.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleRestore}
                                        disabled={restoring}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        {restoring ? 'Restaurando...' : 'Restaurar elemento'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
