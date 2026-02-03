import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, User, Shield, Search, Loader2 } from 'lucide-react';

const UsuariosPage = () => {
    const { user: currentUser } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nombre_completo: '',
        rol: 'usuario'
    });

    const fetchUsuarios = async () => {
        try {
            const response = await getUsuarios();
            setUsuarios(response.data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleAdd = () => {
        setSelectedUser(null);
        setFormData({
            username: '',
            password: '',
            nombre_completo: '',
            rol: 'usuario'
        });
        setDialogOpen(true);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: '',
            nombre_completo: user.nombre_completo,
            rol: user.rol
        });
        setDialogOpen(true);
    };

    const handleDelete = async (user) => {
        if (user.id === currentUser.id) {
            toast.error('No puedes eliminar tu propio usuario');
            return;
        }
        
        if (!window.confirm(`¿Eliminar usuario "${user.username}"?`)) return;
        
        try {
            await deleteUsuario(user.id);
            toast.success('Usuario eliminado');
            fetchUsuarios();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al eliminar');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.nombre_completo) {
            toast.error('Completa los campos requeridos');
            return;
        }
        if (!selectedUser && !formData.password) {
            toast.error('La contraseña es requerida para nuevos usuarios');
            return;
        }

        setSubmitting(true);
        try {
            const dataToSend = { ...formData };
            if (!dataToSend.password) delete dataToSend.password;
            
            if (selectedUser) {
                await updateUsuario(selectedUser.id, dataToSend);
                toast.success('Usuario actualizado');
            } else {
                await createUsuario(dataToSend);
                toast.success('Usuario creado');
            }
            setDialogOpen(false);
            fetchUsuarios();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.nombre_completo.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                        Usuarios
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gestiona los usuarios del sistema
                    </p>
                </div>
                <Button 
                    onClick={handleAdd}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid="add-user-btn"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar usuarios..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold text-slate-600">Usuario</TableHead>
                            <TableHead className="font-semibold text-slate-600">Nombre Completo</TableHead>
                            <TableHead className="font-semibold text-slate-600">Rol</TableHead>
                            <TableHead className="font-semibold text-slate-600">Estado</TableHead>
                            <TableHead className="font-semibold text-slate-600 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsuarios.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    No hay usuarios
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsuarios.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium text-slate-800">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                user.rol === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {user.rol === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </div>
                                            {user.username}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{user.nombre_completo}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.rol === 'admin' ? 'default' : 'secondary'} className={
                                            user.rol === 'admin' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''
                                        }>
                                            {user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.activo ? 'default' : 'secondary'} className={
                                            user.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700'
                                        }>
                                            {user.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(user)}
                                                className="text-slate-600 hover:text-emerald-600"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            {user.id !== currentUser.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user)}
                                                    className="text-slate-600 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-slate-800" style={{ fontFamily: 'Manrope' }}>
                            {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Formulario de usuario
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Usuario *</Label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="nombre_usuario"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{selectedUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={selectedUser ? '••••••••' : 'Contraseña segura'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nombre Completo *</Label>
                            <Input
                                value={formData.nombre_completo}
                                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                placeholder="Nombre y Apellido"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Rol</Label>
                            <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="usuario">Usuario</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {selectedUser ? 'Guardar' : 'Crear'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UsuariosPage;
