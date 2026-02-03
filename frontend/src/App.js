import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MarcasPage from "./pages/MarcasPage";
import TiposProductoPage from "./pages/TiposProductoPage";
import EntallesPage from "./pages/EntallesPage";
import TelasPage from "./pages/TelasPage";
import HilosPage from "./pages/HilosPage";
import EstadosCosturaPage from "./pages/EstadosCosturaPage";
import AviosCosturaPage from "./pages/AviosCosturaPage";
import MuestrasBasePage from "./pages/MuestrasBasePage";
import BasesPage from "./pages/BasesPage";
import ModelosPage from "./pages/ModelosPage";
import FichasPage from "./pages/FichasPage";
import TizadosPage from "./pages/TizadosPage";
import LoginPage from "./pages/LoginPage";
import UsuariosPage from "./pages/UsuariosPage";
import { Loader2 } from "lucide-react";

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (adminOnly && user.rol !== 'admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

// Public route (redirect if logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }
    
    if (user) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="marcas" element={<MarcasPage />} />
                <Route path="tipos-producto" element={<TiposProductoPage />} />
                <Route path="entalles" element={<EntallesPage />} />
                <Route path="telas" element={<TelasPage />} />
                <Route path="hilos" element={<HilosPage />} />
                <Route path="muestras-base" element={<MuestrasBasePage />} />
                <Route path="bases" element={<BasesPage />} />
                <Route path="modelos" element={<ModelosPage />} />
                <Route path="fichas" element={<FichasPage />} />
                <Route path="tizados" element={<TizadosPage />} />
                <Route path="usuarios" element={
                    <ProtectedRoute adminOnly>
                        <UsuariosPage />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
