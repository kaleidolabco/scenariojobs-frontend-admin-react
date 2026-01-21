import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PageAnimation from "./layouts/PageAnimation";

// Components
import AlertSystem from './components/AlertSystem/AlertSystem';
import AuthLoader from './components/Auth/AuthLoader';
import PrivateRoute from './components/Auth/PrivateRoute';

//Pages
import NotFound from "./pages/NotFound/NotFound";
import Login from "./pages/Login/Login";

function App() {

  const location = useLocation();

  return (
    <AnimatePresence>
      <Routes location={location} key="app-routes">
        {/* Layout Público (Login, 404, Generales) */}
        <Route element={<PublicLayout />}>
          <Route path="/autenticacion" element={<PageAnimation key={location.pathname}><Login /></PageAnimation>} />
          <Route path="/404" element={<PageAnimation key={location.pathname}><NotFound /></PageAnimation>} />
        </Route>

        {/* Layout Privado (Dashboard) */}
        <Route element={
          <AuthLoader>
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          </AuthLoader>
        }>
          <Route path="/" element={<Navigate to="/inicio" />} />
          <Route path="/inicio" element={<PageAnimation key={location.pathname}><div>INICIO</div></PageAnimation>} />
          <Route path="/cargos" element={<PageAnimation key={location.pathname}><div>CARGOS</div></PageAnimation>} />
          <Route path="/competencias" element={<PageAnimation key={location.pathname}><div>COMPETENCIAS</div></PageAnimation>} />
          <Route path="/usuarios" element={<PageAnimation key={location.pathname}><div>USUARIOS</div></PageAnimation>} />
        </Route>

        {/* Ruta por defecto para 404 */}
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>

      {/* Sistema de alertas */}
      <AlertSystem key="app-alerts" />
    </AnimatePresence>
  )
}

export default App
