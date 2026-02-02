import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { getDashboardStats } from '../lib/api';
import { 
    Tags, 
    Package, 
    Ruler, 
    Layers, 
    Palette,
    ArrowRight,
    TrendingUp,
    FileBox,
    ClipboardList,
    FileText,
    Scissors
} from 'lucide-react';

const statCardsCatalogo = [
    { key: 'marcas', label: 'Marcas', icon: Tags, path: '/marcas', color: 'bg-blue-500', lightColor: 'bg-blue-50' },
    { key: 'tipos_producto', label: 'Tipos Producto', icon: Package, path: '/tipos-producto', color: 'bg-emerald-500', lightColor: 'bg-emerald-50' },
    { key: 'entalles', label: 'Entalles', icon: Ruler, path: '/entalles', color: 'bg-violet-500', lightColor: 'bg-violet-50' },
    { key: 'telas', label: 'Telas', icon: Layers, path: '/telas', color: 'bg-amber-500', lightColor: 'bg-amber-50' },
    { key: 'hilos', label: 'Hilos', icon: Palette, path: '/hilos', color: 'bg-rose-500', lightColor: 'bg-rose-50' },
];

const statCardsMuestras = [
    { key: 'muestras_base', label: 'Muestras Base', icon: FileBox, path: '/muestras-base', color: 'bg-indigo-500', lightColor: 'bg-indigo-50' },
    { key: 'bases', label: 'Bases', icon: ClipboardList, path: '/bases', color: 'bg-cyan-500', lightColor: 'bg-cyan-50' },
    { key: 'fichas', label: 'Fichas', icon: FileText, path: '/fichas', color: 'bg-teal-500', lightColor: 'bg-teal-50' },
    { key: 'tizados', label: 'Tizados', icon: Scissors, path: '/tizados', color: 'bg-orange-500', lightColor: 'bg-orange-50' },
];

export default function Dashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getDashboardStats();
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

    const renderStatCard = (card) => (
        <Link 
            key={card.key} 
            to={card.path}
            className="group"
            data-testid={`dashboard-card-${card.key}`}
        >
            <Card className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 h-full">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 ${card.lightColor} rounded-lg flex items-center justify-center`}>
                            <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} strokeWidth={1.5} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="mt-3">
                        <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {loading ? '...' : stats[card.key] || 0}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5">{card.label}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );

    return (
        <div className="space-y-8 animate-fade-in" data-testid="dashboard">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                    Dashboard
                </h1>
                <p className="text-slate-500">
                    Gestiona tu catálogo de muestras textiles
                </p>
            </div>

            {/* Summary Card */}
            <Card className="border-slate-200 bg-gradient-to-br from-slate-800 to-slate-700 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-300 text-sm font-medium">Total de Registros</p>
                            <p className="text-4xl font-bold mt-1" style={{ fontFamily: 'Manrope' }} data-testid="total-records">
                                {loading ? '...' : totalItems}
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Catálogo Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Manrope' }}>
                    Catálogo Base
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {statCardsCatalogo.map(renderStatCard)}
                </div>
            </div>

            {/* Muestras Section */}
            <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4" style={{ fontFamily: 'Manrope' }}>
                    Gestión de Muestras
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCardsMuestras.map(renderStatCard)}
                </div>
            </div>
        </div>
    );
}
