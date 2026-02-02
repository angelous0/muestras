import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MarcasPage from "./pages/MarcasPage";
import TiposProductoPage from "./pages/TiposProductoPage";
import EntallesPage from "./pages/EntallesPage";
import TelasPage from "./pages/TelasPage";
import HilosPage from "./pages/HilosPage";

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
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
