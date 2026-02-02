import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MarcasPage from "./pages/MarcasPage";
import TiposProductoPage from "./pages/TiposProductoPage";
import EntallesPage from "./pages/EntallesPage";
import TelasPage from "./pages/TelasPage";
import HilosPage from "./pages/HilosPage";
import MuestrasBasePage from "./pages/MuestrasBasePage";
import BasesPage from "./pages/BasesPage";
import FichasPage from "./pages/FichasPage";
import TizadosPage from "./pages/TizadosPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="marcas" element={<MarcasPage />} />
                    <Route path="tipos-producto" element={<TiposProductoPage />} />
                    <Route path="entalles" element={<EntallesPage />} />
                    <Route path="telas" element={<TelasPage />} />
                    <Route path="hilos" element={<HilosPage />} />
                    <Route path="muestras-base" element={<MuestrasBasePage />} />
                    <Route path="bases" element={<BasesPage />} />
                    <Route path="fichas" element={<FichasPage />} />
                    <Route path="tizados" element={<TizadosPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
