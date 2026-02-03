import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, User } from 'lucide-react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            toast.success('Sesión iniciada');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl border-0">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>M</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                        Muestras
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Ingresa tus credenciales para continuar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-slate-700">Usuario</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Nombre de usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="pl-10"
                                    data-testid="login-username"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    data-testid="login-password"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5"
                            disabled={loading}
                            data-testid="login-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
