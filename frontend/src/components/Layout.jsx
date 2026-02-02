import { NavLink, Outlet } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Tags, 
    Package, 
    Ruler,
    Layers,
    Palette,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Toaster } from './ui/sonner';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/marcas', icon: Tags, label: 'Marcas' },
    { to: '/tipos-producto', icon: Package, label: 'Tipo Producto' },
    { to: '/entalles', icon: Ruler, label: 'Entalles' },
    { to: '/telas', icon: Layers, label: 'Telas' },
    { to: '/hilos', icon: Palette, label: 'Hilos' },
];

export const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    data-testid="mobile-menu-btn"
                    className="bg-white shadow-sm"
                >
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-full w-64 
                bg-slate-800 sidebar-texture
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-white text-lg tracking-tight" style={{ fontFamily: 'Manrope' }}>
                            Textil Sample
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg
                                transition-all duration-150
                                ${isActive 
                                    ? 'bg-slate-700 text-white' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }
                            `}
                        >
                            <item.icon className="w-5 h-5" strokeWidth={1.5} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500 text-center">
                        Módulo Muestras v1.0
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 glass-header border-b border-slate-200 flex items-center px-6 lg:px-8">
                    <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
                    <h1 
                        className="text-lg font-semibold text-slate-700"
                        style={{ fontFamily: 'Manrope' }}
                    >
                        Gestión de Muestras Textiles
                    </h1>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            <Toaster position="top-right" richColors />
        </div>
    );
};

export default Layout;
