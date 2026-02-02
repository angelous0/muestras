import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Marcas
export const getMarcas = (params) => api.get('/marcas', { params });
export const getMarcasCount = (params) => api.get('/marcas/count', { params });
export const getMarca = (id) => api.get(`/marcas/${id}`);
export const createMarca = (data) => api.post('/marcas', data);
export const updateMarca = (id, data) => api.put(`/marcas/${id}`, data);
export const deleteMarca = (id) => api.delete(`/marcas/${id}`);
export const reorderMarcas = (items) => api.put('/marcas/reorder', { items });

// Tipos Producto
export const getTiposProducto = (params) => api.get('/tipos-producto', { params });
export const getTiposProductoCount = (params) => api.get('/tipos-producto/count', { params });
export const getTipoProducto = (id) => api.get(`/tipos-producto/${id}`);
export const createTipoProducto = (data) => api.post('/tipos-producto', data);
export const updateTipoProducto = (id, data) => api.put(`/tipos-producto/${id}`, data);
export const deleteTipoProducto = (id) => api.delete(`/tipos-producto/${id}`);
export const reorderTiposProducto = (items) => api.put('/tipos-producto/reorder', { items });

// Entalles
export const getEntalles = (params) => api.get('/entalles', { params });
export const getEntallesCount = (params) => api.get('/entalles/count', { params });
export const getEntalle = (id) => api.get(`/entalles/${id}`);
export const createEntalle = (data) => api.post('/entalles', data);
export const updateEntalle = (id, data) => api.put(`/entalles/${id}`, data);
export const deleteEntalle = (id) => api.delete(`/entalles/${id}`);
export const reorderEntalles = (items) => api.put('/entalles/reorder', { items });

// Telas
export const getTelas = (params) => api.get('/telas', { params });
export const getTelasCount = (params) => api.get('/telas/count', { params });
export const getTela = (id) => api.get(`/telas/${id}`);
export const createTela = (data) => api.post('/telas', data);
export const updateTela = (id, data) => api.put(`/telas/${id}`, data);
export const deleteTela = (id) => api.delete(`/telas/${id}`);
export const reorderTelas = (items) => api.put('/telas/reorder', { items });

// Hilos
export const getHilos = (params) => api.get('/hilos', { params });
export const getHilosCount = (params) => api.get('/hilos/count', { params });
export const getHilo = (id) => api.get(`/hilos/${id}`);
export const createHilo = (data) => api.post('/hilos', data);
export const updateHilo = (id, data) => api.put(`/hilos/${id}`, data);
export const deleteHilo = (id) => api.delete(`/hilos/${id}`);
export const reorderHilos = (items) => api.put('/hilos/reorder', { items });

// Muestras Base
export const getMuestrasBase = (params) => api.get('/muestras-base', { params });
export const getMuestrasBaseCount = (params) => api.get('/muestras-base/count', { params });
export const getMuestraBase = (id) => api.get(`/muestras-base/${id}`);
export const createMuestraBase = (data) => api.post('/muestras-base', data);
export const updateMuestraBase = (id, data) => api.put(`/muestras-base/${id}`, data);
export const deleteMuestraBase = (id) => api.delete(`/muestras-base/${id}`);
export const uploadArchivoCostos = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/muestras-base/${id}/archivo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Fichas
export const getFichas = (params) => api.get('/fichas', { params });
export const getFichasCount = (params) => api.get('/fichas/count', { params });
export const getFicha = (id) => api.get(`/fichas/${id}`);
export const createFicha = (data) => api.post('/fichas', data);
export const updateFicha = (id, data) => api.put(`/fichas/${id}`, data);
export const deleteFicha = (id) => api.delete(`/fichas/${id}`);
export const uploadArchivoFicha = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/fichas/${id}/archivo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Tizados
export const getTizados = (params) => api.get('/tizados', { params });
export const getTizadosCount = (params) => api.get('/tizados/count', { params });
export const getTizado = (id) => api.get(`/tizados/${id}`);
export const createTizado = (data) => api.post('/tizados', data);
export const updateTizado = (id, data) => api.put(`/tizados/${id}`, data);
export const deleteTizado = (id) => api.delete(`/tizados/${id}`);
export const uploadArchivoTizado = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tizados/${id}/archivo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Bases
export const getBases = (params) => api.get('/bases', { params });
export const getBasesCount = (params) => api.get('/bases/count', { params });
export const getBase = (id) => api.get(`/bases/${id}`);
export const createBase = (data) => api.post('/bases', data);
export const updateBase = (id, data) => api.put(`/bases/${id}`, data);
export const deleteBase = (id) => api.delete(`/bases/${id}`);
export const uploadPatron = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/bases/${id}/patron`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const uploadImagen = (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/bases/${id}/imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const uploadFichasBase = (id, files, nombres = []) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    nombres.forEach(nombre => formData.append('nombres', nombre));
    return api.post(`/bases/${id}/fichas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteFichaBase = (id, fileIndex) => api.delete(`/bases/${id}/fichas/${fileIndex}`);
export const uploadTizadosBase = (id, files, nombres = []) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    nombres.forEach(nombre => formData.append('nombres', nombre));
    return api.post(`/bases/${id}/tizados`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
export const deleteTizadoBase = (id, fileIndex) => api.delete(`/bases/${id}/tizados/${fileIndex}`);

// File download URL helper
export const getFileUrl = (filePath) => `${API_BASE}/files/${filePath}`;

export default api;
