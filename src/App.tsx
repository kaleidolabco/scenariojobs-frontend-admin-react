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
import CompetenciesPage from "./pages/Admin/CompetenciesPage";
import JobsPage from "./pages/Admin/JobsPage";
import JobDetailPage from "./pages/Admin/JobDetailPage";
import UnderConstruction from "./components/Common/UnderConstruction";
import OrgChartPage from "./pages/Admin/OrgChartPage";
import OrgUnitDetailPage from "./pages/Admin/OrgUnitDetailPage";
import OrgPositionDetailPage from "./pages/Admin/OrgPositionDetailPage";
import UsersPage from "./pages/Admin/UsersPage";
import StaffDirectoryPage from "./pages/Admin/StaffDirectoryPage";
import AssessmentsPage from "./pages/HR/AssessmentPage";
import AssessmentBuilderPage from "./pages/HR/AssessmentBuilderPage";
import PerformancePage from "./pages/HR/PerformancePage";
import EvaluationEditorPage from "./pages/HR/EvaluationEditorPage";
import MyAssessmentsPage from "./pages/Employee/MyAssessmentsPage";
import MyPerformanceEvaluationPage from "./pages/Employee/MyPerformanceEvaluationPage";
import MyCompetencyEvaluationsPage from "./pages/Employee/MyCompetencyEvaluationsPage";
import CompetencyEvaluationListPage from "./pages/HR/CompetencyEvaluationListPage";
import CompetencyEvaluationAdminDetailPage from "./pages/HR/CompetencyEvaluationAdminDetailPage";
import CalificationListPage from "./pages/Evaluator/CalificationListPage";
import CompetencyEvaluationEvaluatorDetailPage from "./pages/Evaluator/CompetencyEvaluationEvaluatorDetailPage";
import IntegralEvaluationsPage from "./pages/HR/IntegralEvaluationsPage";
import IntegralEvaluationDetailPage from "./pages/HR/IntegralEvaluationDetailPage";
import EmailConfigPage from "./pages/Admin/EmailConfigPage";

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
          <Route path={ROUTES.HOME} element={<PageAnimation key={location.pathname}><UnderConstruction title="Evaluaciones (Assessment Engine)" /></PageAnimation>} />

          {/* Módulo Configuración Global */}
          <Route path={ROUTES.COMPANY_CONFIG} element={<PageAnimation key={location.pathname}><UnderConstruction title="Configuración Empresa" /></PageAnimation>} />
          <Route path={ROUTES.USERS} element={<PageAnimation key={location.pathname}><UsersPage /></PageAnimation>} />
          <Route path={ROUTES.ROLES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Roles y Permisos" /></PageAnimation>} />
          <Route path={ROUTES.EMAIL_CONFIG} element={<PageAnimation key={location.pathname}><EmailConfigPage /></PageAnimation>} />

          {/* Módulo Estructura Organizacional (Nuevo) */}
          <Route path={ROUTES.ORG_CHART} element={<PageAnimation key={location.pathname}><OrgChartPage /></PageAnimation>} />
          <Route path="/organizacion/unidades/:id" element={<PageAnimation key={location.pathname}><OrgUnitDetailPage /></PageAnimation>} />
          <Route path="/organizacion/puestos/:id" element={<PageAnimation key={location.pathname}><OrgPositionDetailPage /></PageAnimation>} />

          {/* Módulo Gestión de Talento */}
          <Route path={ROUTES.JOBS} element={<PageAnimation key={location.pathname}><JobsPage /></PageAnimation>} />
          <Route path="/cargos/:id" element={<PageAnimation key={location.pathname}><JobDetailPage /></PageAnimation>} />
          <Route path={ROUTES.COMPETENCIES} element={<PageAnimation key={location.pathname}><CompetenciesPage /></PageAnimation>} />
          <Route path={ROUTES.STAFF_DIRECTORY} element={<PageAnimation key={location.pathname}><StaffDirectoryPage /></PageAnimation>} />

          {/* Módulo HR (Evaluaciones) */}
          <Route path={ROUTES.HR_EVALUACIONES_INTEGRAL} element={<PageAnimation key={location.pathname}><IntegralEvaluationsPage /></PageAnimation>} />
          <Route path={ROUTES.HR_EVALUACIONES_INTEGRAL_DETAIL(":id")} element={<PageAnimation key={location.pathname}><IntegralEvaluationDetailPage /></PageAnimation>} />
          <Route path={ROUTES.COMPETENCIES_EVAL} element={<PageAnimation key={location.pathname}><CompetencyEvaluationListPage /></PageAnimation>} />
          <Route path={ROUTES.COMPETENCY_EVAL_DETAIL(":id")} element={<PageAnimation key={location.pathname}><CompetencyEvaluationAdminDetailPage /></PageAnimation>} />
          <Route path={ROUTES.ASSESSMENTS} element={<PageAnimation key={location.pathname}><AssessmentsPage /></PageAnimation>} />
          <Route path={ROUTES.ASSESSMENT_CREATE} element={<PageAnimation key={location.pathname}><AssessmentBuilderPage /></PageAnimation>} />
          <Route path={ROUTES.ASSESSMENT_EDIT(":id")} element={<PageAnimation key={location.pathname}><UnderConstruction title="Editar Evaluación" /></PageAnimation>} />

          {/* Módulo Desempeño (Objetivos) */}
          <Route path={ROUTES.PERFORMANCE} element={<PageAnimation key={location.pathname}><PerformancePage /></PageAnimation>} />
          <Route path={ROUTES.EVALUATION_EDITOR(":evaluacionId")} element={<PageAnimation key={location.pathname}><EvaluationEditorPage /></PageAnimation>} />

          <Route path={ROUTES.PROCESSES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Procesos de Evaluación" /></PageAnimation>} />
          <Route path={ROUTES.PROCESS_CREATE} element={<PageAnimation key={location.pathname}><UnderConstruction title="Crear Proceso" /></PageAnimation>} />
          <Route path="/procesos/:id/editar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Editar Proceso" /></PageAnimation>} />

          <Route path={ROUTES.ANALYTICS_DASHBOARD} element={<PageAnimation key={location.pathname}><UnderConstruction title="Analítica y Reportes" /></PageAnimation>} />
          <Route path={ROUTES.GAP_ANALYSIS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Análisis de Brechas" /></PageAnimation>} />
          <Route path={ROUTES.OBJECTIVES_REPORT} element={<PageAnimation key={location.pathname}><UnderConstruction title="Reporte de Objetivos" /></PageAnimation>} />

          {/* Módulo Evaluador */}
          <Route path={ROUTES.GRADING_PENDING} element={<PageAnimation key={location.pathname}><CalificationListPage /></PageAnimation>} />
          <Route path="/calificacion/:processId" element={<PageAnimation key={location.pathname}><CompetencyEvaluationEvaluatorDetailPage /></PageAnimation>} />
          <Route path={ROUTES.MY_TEAM} element={<PageAnimation key={location.pathname}><UnderConstruction title="Mi Equipo" /></PageAnimation>} />
          <Route path="/mi-equipo/:userId/objetivos" element={<PageAnimation key={location.pathname}><UnderConstruction title="Objetivos del Colaborador" /></PageAnimation>} />
          <Route path="/objetivos-equipo/:id/validar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Validar Objetivos" /></PageAnimation>} />

          {/* Módulo Empleado */}
          <Route path={ROUTES.MY_ASSESSMENTS} element={<PageAnimation key={location.pathname}><MyAssessmentsPage /></PageAnimation>} />
          <Route path="/mi-desempeno/:evaluacionId" element={<PageAnimation key={location.pathname}><MyPerformanceEvaluationPage /></PageAnimation>} />
          <Route path={ROUTES.MI_COMPETENCIAS_EVAL} element={<PageAnimation key={location.pathname}><MyCompetencyEvaluationsPage /></PageAnimation>} />

          {/* <Route path={ROUTES.MY_ASSESSMENTS} element={<PageAnimation key={location.pathname}><UnderConstruction title="Mis Evaluaciones" /></PageAnimation>} /> */}
          <Route path="/mis-evaluaciones/:id/realizar" element={<PageAnimation key={location.pathname}><UnderConstruction title="Realizar Evaluación" /></PageAnimation>} />
          <Route path={ROUTES.MY_OBJECTIVES} element={<PageAnimation key={location.pathname}><UnderConstruction title="Mis Objetivos" /></PageAnimation>} />
          <Route path="/mis-objetivos/:id" element={<PageAnimation key={location.pathname}><UnderConstruction title="Detalle de Objetivo" /></PageAnimation>} />
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
