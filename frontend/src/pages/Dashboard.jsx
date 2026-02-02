import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { getDashboardStats } from '../lib/api';
import { 
    Tags, 
    Package, 
    Ruler, 
    Layers, 
    Palette,
    ArrowRight,
    TrendingUp
} from 'lucide-react';

const statCards = [
    { 
        key: 'marcas', 
        label: 'Marcas', 
        icon: Tags, 
        path: '/marcas',
        color: 'bg-blue-500',
        lightColor: 'bg-blue-50'
    },
    { 
        key: 'tipos_producto', 
        label: 'Tipos de Producto', 
        icon: Package, 
        path: '/tipos-producto',
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50'
    },
    { 
        key: 'entalles', 
        label: 'Entalles', 
        icon: Ruler, 
        path: '/entalles',
        color: 'bg-violet-500',
        lightColor: 'bg-violet-50'
    },
    { 
        key: 'telas', 
        label: 'Telas', 
        icon: Layers, 
        path: '/telas',
        color: 'bg-amber-500',
        lightColor: 'bg-amber-50'
    },
    { 
        key: 'hilos', 
        label: 'Hilos', 
        icon: Palette, 
        path: '/hilos',
        color: 'bg-rose-500',
        lightColor: 'bg-rose-50'
    },
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

    return (
        <div className="space-y-8 animate-fade-in" data-testid="dashboard">
            {/* Welcome Section */}
            <div className="space-y-2">
                <h1 
                    className="text-2xl sm:text-3xl font-bold text-slate-800"
                    style={{ fontFamily: 'Manrope' }}
                >
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
                            <p 
                                className="text-4xl font-bold mt-1"
                                style={{ fontFamily: 'Manrope' }}
                                data-testid="total-records"
                            >
                                {loading ? '...' : totalItems}
                            </p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid - Bento Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <Link 
                        key={card.key} 
                        to={card.path}
                        className="group"
                        data-testid={`dashboard-card-${card.key}`}
                    >
                        <Card className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 h-full">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className={`w-12 h-12 ${card.lightColor} rounded-xl flex items-center justify-center`}>
                                        <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} strokeWidth={1.5} />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                </div>
                                <div className="mt-4">
                                    <p 
                                        className="text-3xl font-bold text-slate-800"
                                        style={{ fontFamily: 'Manrope' }}
                                    >
                                        {loading ? '...' : stats[card.key] || 0}
                                    </p>
                                    <p className="text-slate-500 text-sm mt-1">{card.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <CardTitle 
                        className="text-lg font-semibold text-slate-800"
                        style={{ fontFamily: 'Manrope' }}
                    >
                        Próximos Pasos
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 space-y-2">
                    <p>• Agrega tus marcas, tipos de producto, entalles, telas e hilos base.</p>
                    <p>• Estas tablas serán utilizadas para crear Muestras Base y gestionar el catálogo completo.</p>
                    <p>• Las tablas relacionadas (Muestra Base, Bases, Fichas, Tizados) se agregarán próximamente.</p>
                </CardContent>
            </Card>
        </div>
    );
}
