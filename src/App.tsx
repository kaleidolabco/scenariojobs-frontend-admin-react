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
import UnderConstruction from "./components/Common/UnderConstruction";
import { ROUTES } from "./constants/routes";

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
          <Route path="/" element={<Navigate to={ROUTES.HOME} />} />
          <Route path={ROUTES.HOME} element={<PageAnimation key={location.pathname}><div>INICIO</div></PageAnimation>} />

          {/* Módulo Admin */}
          <Route path={ROUTES.COMPANY_CONFIG} element={<PageAnimation key={location.pathname}><UnderConstruction title="Configuración Empresa" /></PageAnimation>} />
          <Route path={ROUTES.USERS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Gestión de Usuarios" /></PageAnimation>} />
          <Route path={ROUTES.ROLES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Roles y Permisos" /></PageAnimation>} />
          <Route path={ROUTES.COMPETENCIES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Biblioteca de Competencias" /></PageAnimation>} />
          <Route path={ROUTES.POSITIONS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Gestión de Cargos" /></PageAnimation>} />
          <Route path={ROUTES.STAFF_DIRECTORY} element={<PageAnimation key={location.pathname}><UnderConstruction title="Directorio de Personal" /></PageAnimation>} />

          {/* Módulo HR (Evaluaciones) */}
          <Route path={ROUTES.ASSESSMENTS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Evaluaciones (Assessment Engine)" /></PageAnimation>} />
          <Route path={ROUTES.ASSESSMENT_CREATE} element={<PageAnimation key={location.pathname}><UnderConstruction title="Crear Evaluación" /></PageAnimation>} />
          <Route path="/evaluaciones/:id/editar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Editar Evaluación" /></PageAnimation>} />

          <Route path={ROUTES.PROCESSES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Procesos de Evaluación" /></PageAnimation>} />
          <Route path={ROUTES.PROCESS_CREATE} element={<PageAnimation key={location.pathname}><UnderConstruction title="Crear Proceso" /></PageAnimation>} />
          <Route path="/procesos/:id/editar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Editar Proceso" /></PageAnimation>} />

          <Route path={ROUTES.ANALYTICS_DASHBOARD} element={<PageAnimation key={location.pathname}><UnderConstruction title="Analítica y Reportes" /></PageAnimation>} />
          <Route path={ROUTES.GAP_ANALYSIS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Análisis de Brechas" /></PageAnimation>} />

          {/* Módulo Evaluador */}
          <Route path={ROUTES.GRADING_PENDING} element={<PageAnimation key={location.pathname}><UnderConstruction title="Calificaciones Pendientes" /></PageAnimation>} />
          <Route path="/calificacion/:id" element={<PageAnimation key={location.pathname}><UnderConstruction title="Calificar Evaluación" /></PageAnimation>} />

          {/* Módulo Empleado */}
          <Route path={ROUTES.MY_ASSESSMENTS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Mis Evaluaciones" /></PageAnimation>} />
          <Route path="/mis-evaluaciones/:id/realizar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Realizar Evaluación" /></PageAnimation>} />
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
