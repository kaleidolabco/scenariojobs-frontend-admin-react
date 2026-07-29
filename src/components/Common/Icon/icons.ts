/**
 * Inventario central de íconos del proyecto.
 *
 * Todo componente/página DEBE importar sus íconos desde aquí en lugar de:
 *  - re-declarar SVGs inline (`<svg>...</svg>`), o
 *  - importar directamente de `lucide-react`.
 *
 * DECISIÓN DE UNIFICACIÓN (refactor 2026):
 * Cada concepto funcional expone UN ÚNICO ícono lucide, eliminando las
 * variantes duplicadas que existían antes (ej: 2 lápices, 4 "X" de cerrar,
 * 3 checks, 2 infos, chevron 2048x2048 vs 24x24, etc.).
 *
 * Nomenclatura: `Icon` + Concepto (PascalCase). Si el concepto tiene
 * matices (ej: upload de archivo vs subida de texto), usar sufijo
 * descriptivo (`IconUpload`, `IconFileUpload`).
 *
 * Sizes por defecto: el componente `<Button/>` ya calcula el size según
 * su variante. Para uso fuera de botones, pasar `size` explícito:
 *   <IconPlus size={18} />
 */

export {
    // ─── Acciones CRUD / tabla ────────────────────────────────────────────
    Plus,           // añadir / crear / nuevo
    Pencil,         // editar (única variante: era "pencil" + "pencil-square")
    Trash2,         // eliminar (era basura Heroicons re-declarada en 23 archivos)
    Check,          // confirmar / publicado / correcto (era "check" outline + Material "bookmark-check")
    X,              // cerrar (unifica: SVG Heroicons, ✕ literal Unicode, panel-custom del navbar)
    Save,           // guardar en disco (usado en file editor)
    Download,       // descargar
    Upload,         // subir archivo
    Copy,           // duplicar / clonar
    Clipboard,      // copiar al portapapeles / listado
    RefreshCw,      // refrescar / regenerar

    // ─── Navegación ───────────────────────────────────────────────────────
    ChevronDown,    // desplegar (unifica Heroicons 24x24 + RoleSwitcher 2048x2048)
    ChevronUp,      // colapsar
    ChevronRight,   // siguiente / forward
    ChevronLeft,    // atrás / previous (era "M10 19l-7-7..." único en AssessmentBuilderPage)
    ArrowLeft,      // volver a página anterior
    ArrowUp,        // tendencia alcista (StatsCard)
    ArrowDown,      // tendencia bajista (StatsCard)
    ArrowRight,     // tendencia plana / dirección (StatsCard flat)
    Menu,           // abrir sidebar / hamburger (unifica 3-líneas + panel-lateral custom del Navbar)
    PanelLeft,      // toggle sidebar explícito (reemplaza el panel-lateral custom del Navbar)

    // ─── Visualización / feedback ─────────────────────────────────────────
    Eye,            // ver / preview (unifica ojo Heroicons con/sin iris)
    EyeOff,         // ocultar (mirar contrasena)
    Search,         // buscar / lupa (re-declarada en ~10 archivos)
    Info,           // tooltip info (unifica outline "i" circulo + Material "i" filled)
    AlertTriangle,  // advertencia / warning (triangulo)
    HelpCircle,     // ayuda / FAQ

    // ─── Multimedia ────────────────────────────────────────────────────────
    Video,          // grabar video (era IconVideo custom)
    VideoOff,       // detener video (era IconVideoOff custom)
    Play,           // reproducir
    Pause,          // pausar
    Square,         // stop
    Camera,         // foto / webcam

    // ─── Entidades de dominio ─────────────────────────────────────────────
    Mail,           // correo electrónico
    FileText,       // documento / plantilla / texto
    Folder,         // carpeta vacía (empty state, era "M3 7..." custom)
    FolderOpen,     // carpeta abierta
    Users,          // usuarios / personas
    User,           // persona individual (perfil)
    Briefcase,      // cargo / puesto
    Target,         // objetivo / OKR
    BarChart3,      // gráfico / reporte
    TrendingUp,     // desempeño / evolución positiva
    Flame,          // hito / urgencia (EvaluadoPage)
    Tag,            // etiqueta / categoría
    BookOpen,       // bitácora / diario / conocimiento
    Layers,        // módulos / niveles
    ListChecks,     // checklist / funciones
    CircleDot,      // radio button seleccionado
    Circle,         // radio button vacío
    Building2,      // unidad organizacional
    Network,        // organigrama / jerarquía
    FileSpreadsheet,// exportar Excel
    Star,           // favorito / estrella / calificación

    UserPlus,       // añadir persona

    // ─── Sesión / layout ──────────────────────────────────────────────────
    LogOut,         // cerrar sesión
    Settings,       // configuración / settings
    Bell,           // notificaciones
    Home,           // dashboard / inicio
    LayoutDashboard,// dashboard administrativo
    Database,       // módulo técnico
    Lock,           // permisos / clave
    Key,            // credenciales
    UserCircle,     // avatar / usuario logueado
    Sun,            // tema claro (futuro toggle)
    Moon,           // tema oscuro (futuro toggle)
    CircleUser,     // perfil

    // ─── Job positions / assesment ────────────────────────────────────────
    ClipboardList,  // evaluación / assessment
    FileClock,      // histórico
    Send,           // publicar / enviar resultados
    Clock,          // plazo / vencimiento
    Zap,            // acción IA / automático / rayo
    CircleCheck,    // check en círculo (badge de éxito: "video grabado correctamente")
    CircleAlert,    // alerta "i" rellena (Material filled, era AlertComponent alternativa)
    XCircle,        // error en círculo (alertas con error)

    // ─── Evidencias / archivos ────────────────────────────────────────────
    Link,           // enlace URL (evidencias LINK)
    Paperclip,      // adjuntar archivo (evidencias ARCHIVO)
    ExternalLink,   // abrir enlace externo
    Calendar,       // fecha / calendario (evidencias HITO)
    FilePlus,       // documento nuevo / agregar archivo (empty state)
    Minus,          // colapsar / contraer nodo (OrgUnitNode)
    Filter,         // filtros / faceted search (IntegralEvaluationSummary)
    MessageCircle,  // comentarios / feedback (ObjectiveEditor, SelfAssessmentPanel)
    Edit3,          // edición inline (EvaluationCompetencyPage)
    Activity,       // actividad / línea vital (EvaluationCompetencyPage)
    CheckCircle,    // check dentro de círculo (EvaluationCompetencyPage, difiere de CircleCheck)
} from 'lucide-react';
export type { LucideIcon } from 'lucide-react';
