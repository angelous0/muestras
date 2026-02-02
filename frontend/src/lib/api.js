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

// Tipos Producto
export const getTiposProducto = (params) => api.get('/tipos-producto', { params });
export const getTiposProductoCount = (params) => api.get('/tipos-producto/count', { params });
export const getTipoProducto = (id) => api.get(`/tipos-producto/${id}`);
export const createTipoProducto = (data) => api.post('/tipos-producto', data);
export const updateTipoProducto = (id, data) => api.put(`/tipos-producto/${id}`, data);
export const deleteTipoProducto = (id) => api.delete(`/tipos-producto/${id}`);

// Entalles
export const getEntalles = (params) => api.get('/entalles', { params });
export const getEntallesCount = (params) => api.get('/entalles/count', { params });
export const getEntalle = (id) => api.get(`/entalles/${id}`);
export const createEntalle = (data) => api.post('/entalles', data);
export const updateEntalle = (id, data) => api.put(`/entalles/${id}`, data);
export const deleteEntalle = (id) => api.delete(`/entalles/${id}`);

// Telas
export const getTelas = (params) => api.get('/telas', { params });
export const getTelasCount = (params) => api.get('/telas/count', { params });
export const getTela = (id) => api.get(`/telas/${id}`);
export const createTela = (data) => api.post('/telas', data);
export const updateTela = (id, data) => api.put(`/telas/${id}`, data);
export const deleteTela = (id) => api.delete(`/telas/${id}`);

// Hilos
export const getHilos = (params) => api.get('/hilos', { params });
export const getHilosCount = (params) => api.get('/hilos/count', { params });
export const getHilo = (id) => api.get(`/hilos/${id}`);
export const createHilo = (data) => api.post('/hilos', data);
export const updateHilo = (id, data) => api.put(`/hilos/${id}`, data);
export const deleteHilo = (id) => api.delete(`/hilos/${id}`);

export default api;
