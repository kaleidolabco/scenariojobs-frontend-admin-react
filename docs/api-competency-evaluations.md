# Guía de Información de Evaluación de Competencias para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de evaluaciones de competencias.

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):**
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, filtros, tablas, formularios y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Evaluación de Competencias** que permite la creación, configuración, gestión, ejecución y revisión de procesos evaluativos. Este módulo es utilizado por diferentes roles (Administrador de RRHH, Evaluador, Empleado) y requiere la siguiente información:

### A. Listado de Procesos de Evaluación (Administrador de RRHH)
Vista: `src/pages/HR/CompetencyEvaluationListPage.tsx`
Muestra una tabla con paginación, filtros de búsqueda, estadísticas y opciones para crear, editar, clonar o eliminar procesos.

*   **Filtros requeridos por el frontend:**
    *   Búsqueda de texto (`search`): Permite buscar coincidencias insensibles a mayúsculas/minúsculas sobre el nombre o descripción del proceso.
    *   Filtro por Estado (`estado`): `BORRADOR`, `PUBLICADO`, `ARCHIVADO`.
    *   Oredenar por estado, nombre, cantidad competencias...
*   **Paginación estándar:**
    *   Soporta cambio de página y de cantidad de filas por página (10, 25, 50, 100).
    *   El frontend espera la estructura de paginación estándar que retorna `pagina_actual`, `items_por_pagina`, `total_items` y `total_paginas`.
*   **Estadísticas requeridas por el frontend:**
    *   `total`: Número total de procesos.
    *   `publicadas`: Número de procesos en estado `PUBLICADO`.
    *   `borradores`: Número de procesos en estado `BORRADOR`.
    *   `total_evaluaciones`: Suma de `total_evaluaciones` de todos los procesos (evaluaciones realizadas).

### B. Formulario de Proceso de Evaluación (Creación y Edición - Administrador de RRHH)
Vista: `src/pages/HR/CompetencyEvaluationListPage.tsx` (Formulario de creación/edición, modalidad modal)
Formulario utilizado para crear o actualizar la información general de un proceso de evaluación.

*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio): Nombre del proceso. Máx 255 caracteres.
    *   `descripcion` (Opcional): Descripción detallada del proceso. Máx 1000 caracteres.
    *   `estado` (Obligatorio - Default: `BORRADOR`): Estado del proceso. Valores: `BORRADOR`, `PUBLICADO`, `ARCHIVADO`.
    *   `total_competencias` (Opcional - Default: 0): Número de competencias que tiene el proceso. Aunque se envía desde el frontend, el backend debe calcularlo en base a las competencias asignadas.
    *   `creado_por` (Obligatorio en creación): Nombre del usuario que crea el proceso. Se debería obtener del contexto de autenticación.

### C. Detalle y Configuración del Proceso (Administrador de RRHH)
Vista: `src/pages/HR/CompetencyEvaluationAdminDetailPage.tsx`
Esta vista se divide en 4 pestañas de configuración:

#### C.1. Pestaña Información General (`activeTab = 'general'`)

Permite configurar los datos básicos del proceso y las políticas generales de evaluación y corrección.

*   **Campos de información general:**
    *   `nombre` (Texto): Nombre del proceso. Máx 255 caracteres.
    *   `descripcion` (Texto): Descripción del proceso. Máx 1000 caracteres.
    *   `estado` (Enum): Estado del proceso. Valores: `BORRADOR`, `PUBLICADO`, `ARCHIVADO`.

*   **Configuración de tipos de evaluación (`config.tipos_evaluacion`):**
    Define los tipos de evaluadores que participarán en el proceso y su ponderación en la calificación final. Los pesos deben sumar 100% si hay participantes asignados.
    *   **Estructura esperada:** Un array de objetos con:
        *   `tipo` (Enum): Tipo de evaluador. Valores: `AUTOEVALUACION`, `JEFE_DIRECTO`, `OTRO`.
        *   `activo` (Booleano): Indica si este tipo de evaluador participa en el proceso.
        *   `peso` (Número): Porcentaje de peso de este tipo de evaluación en la nota final (0-100).

*   **Configuración de calibración por RRHH (`config.calibracion_rrhh`):**
    Controla si el equipo de RRHH puede revisar y/o modificar los puntajes de las evaluaciones.
    *   **Estructura esperada:** Objeto con:
        *   `activo` (Booleano): Indica si la calibración por RRHH está activa.
        *   `modo` (Enum): Modo de calibración si está activa. Valores: `SOLO_REVISAR`, `EDITAR`.

*   **Revisión obligatoria (`config.revision_obligatoria`):**
    *   `revision_obligatoria` (Booleano): Si es `true`, todas las asignaciones deben pasar por el estado `EN_REVISION` antes de ser aprobadas.

*   **Política de corrección (`config.correccion`):**
    Define las reglas para que los evaluadores puedan corregir sus evaluaciones una vez completadas.
    *   **Estructura esperada:** Objeto con:
        *   `permitir` (Booleano): Permite o no cualquier corrección tras completar la evaluación.
        *   `maximo_por_asignacion` (Número | `null`): Número máximo de correcciones permitidas por asignación. `null` = ilimitado, `0` = bloqueado al completar.
        *   `requiere_revision` (Booleano): Si es `true`, al corregir, la asignación vuelve al estado `EN_REVISION`.
        *   `permitir_cuando_devuelto` (Booleano): Si es `true`, el evaluador puede corregir la asignación si RRHH la devuelve.
        *   `permitir_voluntaria` (Booleano): Si es `true`, el evaluador puede corregir desde su panel sin que RRHH la devuelva.

#### C.2. Pestaña Competencias (`activeTab = 'competencias'`)

Permite seleccionar las competencias a evaluar y definir su ponderación. Las competencias pueden ser seleccionadas manualmente o derivadas de los cargos de los participantes.

*   **Origen de competencias (`origen_competencias`):**
    *   `origen` (Enum): Indica cómo se asignan las competencias. Valores: `manual`, `desde_cargos`.
*   **Competencias asignadas (`competencias_asignadas`):**
    *   `competencia_id` (Array de strings): IDs de las competencias seleccionadas para el proceso.
*   **Pesos de competencias (`weights`):**
    *   `competencia_id: peso` (Objeto): Un mapa de `competencia_id` a su peso porcentual. La suma de todos los pesos debe ser 100% si hay competencias asignadas.
*   **Sugerencias de competencias (derivadas de cargos):**
    El frontend calcula y muestra sugerencias de competencias y niveles esperados basados en los cargos de los participantes. El backend debe proveer la información de cargos y sus competencias requeridas para que el frontend pueda hacer este cálculo.

#### C.3. Pestaña Participantes (`activeTab = 'participantes'`)

Permite seleccionar a las personas que serán evaluadas y asignar los evaluadores adicionales (tipo 'OTRO'). El sistema gestiona automáticamente la autoevaluación y la evaluación por jefe directo según la configuración de la pestaña General.

*   **Personas a evaluar (`personas_a_evaluar`):**
    *   `persona_id` (Array de strings): IDs de las personas que serán evaluadas en este proceso.
*   **Evaluadores por persona (`evaluadores_por_persona`):**
    *   `persona_id: [evaluador_id]` (Objeto): Un mapa donde cada clave es el `persona_id` de un participante, y su valor es un array de `evaluador_id` de usuarios que actuarán como evaluadores de tipo 'OTRO' para esa persona.
*   **Resolución de evaluadores (lógica del frontend):**
    *   **Autoevaluación:** El frontend asume que el `evaluador_id` es el `usuario_id` asociado a la `persona_id` del participante.
    *   **Jefe Directo:** El frontend resuelve el `evaluador_id` buscando el `usuario_id` de la persona que ocupa el `jefe_puesto_id` del puesto del participante.

#### C.4. Pestaña Correos (`activeTab = 'correos'`)

Permite asociar plantillas de correo electrónico a eventos específicos del proceso de evaluación.

*   **Plantillas asociadas (`templates_asociadas`):**
    *   `template_id` (Array de strings): IDs de las plantillas de correo electrónico que se utilizarán en este proceso. El frontend espera que el backend gestione la lógica de envío de correos basada en estas plantillas y los eventos del proceso.

### D. Evaluación de Competencias (Rol Evaluador / Empleado)
Vista: `src/pages/Evaluator/CompetencyEvaluationEvaluatorDetailPage.tsx` (para evaluadores externos)
Vista: `src/pages/Employee/MyCompetencyEvaluationsPage.tsx` (para autoevaluaciones)

Permite a los evaluadores (incluido el propio empleado para autoevaluaciones) calificar las competencias asignadas a una persona en un proceso específico y añadir comentarios.

*   **Parámetros de URL:**
    *   `processId` (string): ID del proceso de evaluación.
    *   `personId` (string): ID de la persona que está siendo evaluada.
    *   `asignacionId` (string): ID de la asignación específica que se está realizando.
    *   `tipo` (Enum): Tipo de evaluación (`AUTOEVALUACION` o cualquier otro tipo para evaluadores externos).
*   **Datos enviados por el formulario de calificación:**
    *   `evaluador_id` (string - Obligatorio): ID del usuario que está realizando la evaluación. El backend debe obtenerlo del contexto de autenticación.
    *   `proceso_id` (string - Obligatorio): ID del proceso de evaluación.
    *   `persona_id` (string - Obligatorio): ID de la persona evaluada.
    *   `competencias_evaluadas` (Objeto - Obligatorio): Un mapa de `competencia_id` a `nivel` (número) que representa la calificación para cada competencia.
    *   `comentarios` (Objeto - Opcional): Objeto con comentarios:
        *   `text` (Texto - Opcional): Comentario de texto libre.
        *   `video_url` (URL - Opcional): URL del video si se ha grabado un comentario en video. (Actualmente no persistido en el mock).
    *   `estado` (Enum - Obligatorio): Estado de la respuesta de evaluación. Inicialmente `COMPLETADO` al guardar. El backend gestionará transiciones adicionales (e.g., `EN_REVISION`).
    *   `asignacion_id` (string - Obligatorio): ID de la asignación a la que corresponde esta respuesta.

### E. Lista de Calificaciones Pendientes y Completadas (Rol Evaluador / Empleado)
Vista: `src/pages/Evaluator/CalificationListPage.tsx`
Vista: `src/pages/Employee/MyCompetencyEvaluationsPage.tsx`

Muestra un listado de las evaluaciones pendientes y completadas para un evaluador o las autoevaluaciones del empleado.

*   **Filtros (implícitos por el frontend):**
    *   `evaluador_id` (string): ID del usuario que consulta (obtenido del contexto de autenticación).
    *   `persona_id` (string): ID de la persona que consulta (para autoevaluaciones).
    *   `tipo` (Enum - para autoevaluaciones): `AUTOEVALUACION`.
*   **Datos mostrados en la tabla:**
    *   `id` (string): ID único de la fila (puede ser la asignación_id).
    *   `processId` (string): ID del proceso de evaluación.
    *   `personId` (string): ID de la persona evaluada.
    *   `processName` (string): Nombre del proceso.
    *   `personName` (string): Nombre de la persona evaluada.
    *   `personPosition` (string): Puesto de la persona evaluada.
    *   `competenciesCount` (Número): Cantidad de competencias en la evaluación.
    *   `estado` (Enum): Estado de la asignación. Valores: `PENDIENTE`, `EN_PROGRESO`, `COMPLETADO`, `EN_REVISION`, `APROBADO`, `DEVUELTO`.
    *   `tipo` (Enum): Tipo de evaluación (`AUTOEVALUACION`, `JEFE_DIRECTO`, `OTRO`).
    *   `asignacionId` (string): ID de la asignación.
    *   `correccionDisponible` (Booleano): Indica si el evaluador puede corregir la evaluación según la política configurada.
    *   `correccionVoluntaria` (Booleano): Indica si se permite la corrección voluntaria por el evaluador.
*   **Acciones:**
    *   **Evaluar:** Navega a la vista de detalle de evaluación (`CompetencyEvaluationEvaluatorDetailPage.tsx`).
    *   **Corregir:** Reabre una asignación `COMPLETADO` o `EN_REVISION` a `EN_PROGRESO` para su edición. Esto incrementa `contador_correcciones` en el backend.

### F. Vistas de Calibración de RRHH (Pendientes de implementar completamente en frontend)
Según `docs/EVALUACIONES-COMPETENCIAS.md`, estas vistas están propuestas para una Fase 3 de desarrollo del frontend, pero el backend deberá soportar la lógica subyacente:

*   **CalibraciónPage (`/calibracion`):** Listado de procesos en estado `EN_REVISION`.
*   **CalibracionDetailPage (`/calibracion/:processId`):** Detalle para revisar las asignaciones, puntajes y logs de calibración, con acciones de Aprobar, Devolver y Calibrar. El frontend esperará la siguiente información:
    *   **Asignaciones por persona:** Listado de `EvaluatorAssignment` para el proceso, incluyendo `estado`, `tipo`, `peso`, `contador_correcciones`, `correccion_disponible`, y datos de calibración (`calibrado_por`, `fecha_calibracion`, `comentario_calibracion`).
    *   **Respuestas de evaluación:** Los puntajes (`competencias_evaluadas`) y comentarios (`comentarios`) guardados por los evaluadores.
    *   **Puntajes calibrados:** Si existen, los puntajes finales después de la calibración de RRHH (`GLOBAL_CALIBRATED_SCORES_DB` en el mock).
    *   **Logs de calibración:** Historial de acciones de calibración (`CalibrationLog`) para cada asignación.
    *   **Acciones requeridas al backend:**
        *   **Aprobar Asignación:** Marca una asignación como `APROBADO`. Puede incluir puntajes calibrados si el modo de calibración es `EDITAR`.
        *   **Calibrar Asignación:** Aplica cambios a los puntajes de una asignación, manteniéndola en `EN_REVISION` o pasándola a `APROBADO` si no hay más acciones. Siempre incluye los `competencias_calibradas`.
        *   **Devolver Asignación:** Pone la asignación en estado `DEVUELTO` para que el evaluador pueda corregirla. Solo si `config.correccion.permitir_cuando_devuelto` es `true`.
        *   **Cerrar Proceso:** Cuando todas las asignaciones de un proceso están `APROBADO`, se permite cerrar el proceso, pasándolo a estado `CERRADO` (esto se espera que lo haga el backend con una llamada específica).

### G. Vistas de Resultados (Pendientes de implementar completamente en frontend)
Según `docs/EVALUACIONES-COMPETENCIAS.md`, estas vistas están propuestas para una Fase 4 de desarrollo del frontend, pero el backend deberá soportar la lógica subyacente:

*   **Dashboard de Brechas (`/analisis/brechas` - Rol RRHH):** Muestra una tabla por persona con información de sus competencias, nivel esperado, nivel obtenido y brecha. El backend debe calcular el "Nivel Obtenido" como el promedio ponderado de las asignaciones `APROBADO` para una persona en un proceso.
*   **Mis Resultados (`/mis-resultados` - Rol Colaborador):** Vista para el colaborador con los resultados publicados de sus evaluaciones. Muestra tabla de competencias con nivel obtenido vs esperado y la brecha. Solo visible si el proceso está `CERRADO`.

---

## 2. Estructura de Datos Requerida por el Frontend

La gestión de evaluaciones de competencias involucra las siguientes entidades principales:

### A. Proceso de Evaluación (`CompetencyEvaluationSummary` / `CompetencyEvaluationDetail`)

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único del proceso | Sí |
| `nombre` | Texto | Nombre del proceso de evaluación. | Sí |
| `descripcion` | Texto | Descripción detallada del proceso. | No |
| `estado` | Estado Legacy | Enum: `BORRADOR`, `PUBLICADO`, `ARCHIVADO`. | Sí |
| `estado_flujo` | Estado Extendido | Enum: `BORRADOR`, `PUBLICADO`, `EN_CALIFICACION`, `EN_REVISION`, `CERRADO`, `ARCHIVADO`. (El frontend usa este para el flujo de trabajo) | No (pero necesario para flujo) |
| `total_competencias` | Número | Cantidad de competencias asociadas al proceso. | Sí (frontend envía, backend calcula) |
| `creado_por` | Texto | Nombre del usuario que creó el proceso. | Sí |
| `fecha_creacion` | Fecha (ISO 8601) | Fecha y hora de creación del proceso. | Sí |
| `fecha_actualizacion` | Fecha (ISO 8601) | Fecha y hora de la última actualización del proceso. | Sí |
| `total_evaluaciones` | Número | Número total de evaluaciones completadas para este proceso. | Sí |
| `competencias_asignadas` | Array de IDs | IDs de las competencias seleccionadas para el proceso. | Sí |
| `personas_a_evaluar` | Array de IDs | IDs de las personas que serán evaluadas. | Sí |
| `evaluadores_asignados` | Array de IDs | IDs de los usuarios asignados como evaluadores. | No (el frontend gestiona `evaluadores_por_persona`) |
| `config` | Objeto JSON | Configuración detallada del proceso (`CompetencyEvaluationConfig`). | Sí |
| `weights` | Objeto JSON | Mapa de `competencia_id` a `peso` (ponderación) de cada competencia. | Sí |
| `origen_competencias` | Enum | `manual` o `desde_cargos` (indica cómo se asignaron las competencias). | No |
| `evaluadores_por_persona` | Objeto JSON | Mapa de `persona_id` a `Array<evaluador_id>` para evaluadores de tipo `OTRO`. | Sí |
| `templates_asociadas` | Array de IDs | IDs de las plantillas de correo asociadas. | No |

### B. Configuración de Evaluación (`CompetencyEvaluationConfig`)

Esta es una sub-estructura anidada dentro del `config` del proceso de evaluación.

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `tipos_evaluacion` | Array de Objetos | Configuración de cada tipo de evaluador (ver abajo). | Sí |
| `calibracion_rrhh.activo` | Booleano | Si RRHH puede calibrar. | Sí |
| `calibracion_rrhh.modo` | Enum | `SOLO_REVISAR` o `EDITAR`. | Sí |
| `correccion.permitir` | Booleano | Permite correcciones. | Sí |
| `correccion.maximo_por_asignacion` | Número / `null` | Máximo de correcciones. | Sí |
| `correccion.requiere_revision` | Booleano | Corrección requiere re-revisión. | Sí |
| `correccion.permitir_cuando_devuelto` | Booleano | Permite corregir si RRHH devuelve. | Sí |
| `correccion.permitir_voluntaria` | Booleano | Permite corrección voluntaria. | Sí |
| `revision_obligatoria` | Booleano | Toda asignación debe pasar por `EN_REVISION`. | Sí |

### C. Asignación de Evaluador (`EvaluatorAssignment`)

Representa la asignación de una evaluación específica de un evaluador a una persona para un proceso.

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la asignación. | Sí |
| `proceso_id` | Identificador único | ID del proceso de evaluación. | Sí |
| `persona_id` | Identificador único | ID de la persona evaluada. | Sí |
| `evaluador_id` | Identificador único | ID del usuario que es el evaluador. | Sí |
| `tipo` | Enum | Tipo de evaluación: `AUTOEVALUACION`, `JEFE_DIRECTO`, `OTRO`. | Sí |
| `peso` | Número | Peso de esta asignación en la nota final. | Sí |
| `estado` | Estado Asignación | Enum: `PENDIENTE`, `EN_PROGRESO`, `COMPLETADO`, `EN_REVISION`, `APROBADO`, `DEVUELTO`. | Sí |
| `contador_correcciones` | Número | Cuántas veces se ha corregido esta asignación. | Sí |
| `correccion_disponible` | Booleano | `true` si aún se puede corregir según la política. | Sí |
| `calibrado_por` | Texto / ID | Nombre o ID del usuario de RRHH que calibró. | No |
| `fecha_calibracion` | Fecha (ISO 8601) | Fecha y hora de la calibración. | No |
| `comentario_calibracion` | Texto | Comentario de RRHH al calibrar/aprobar/devolver. | No |

### D. Respuesta de Evaluación (`EvaluationResponse`)

Representa la respuesta (calificaciones y comentarios) de un evaluador para una asignación.

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la respuesta. | Sí |
| `evaluador_id` | Identificador único | ID del usuario que envió la respuesta. | Sí |
| `proceso_id` | Identificador único | ID del proceso de evaluación. | Sí |
| `persona_id` | Identificador único | ID de la persona evaluada. | Sí |
| `asignacion_id` | Identificador único | ID de la asignación a la que pertenece esta respuesta. | Sí |
| `competencias_evaluadas` | Objeto JSON | Mapa de `competencia_id` a `nivel` (número). | Sí |
| `comentarios.text` | Texto | Comentario de texto del evaluador. | No |
| `comentarios.video_url` | URL | URL del video comentario (si se implementa backend de archivos). | No |
| `estado` | Estado Respuesta | Enum: `COMPLETADO` (inicialmente). Backend puede tener otros (`PENDIENTE`, etc.). | Sí |
| `fecha_envio` | Fecha (ISO 8601) | Fecha y hora en que se envió la respuesta. | Sí |
| `fecha_ultima_edicion` | Fecha (ISO 8601) | Fecha y hora de la última edición de la respuesta. | Sí |
| `puntaje_normalizado` | Número (0-1) | Puntaje normalizado (0-1) de la evaluación total. | Sí (para integración integral) |
| `puntaje_numerico` | Número | Puntaje numérico total. | Sí (para integración integral) |
| `escala_maxima` | Número | Escala máxima del puntaje. | Sí (para integración integral) |

### E. Registro de Calibración (`CalibrationLog`)

Almacena el historial de las acciones de calibración realizadas por RRHH.

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único del log. | Sí |
| `asignacion_id` | Identificador único | ID de la asignación calibrada. | Sí |
| `calibrado_por` | Identificador único | ID del usuario de RRHH que realizó la acción. | Sí |
| `competencias_originales` | Objeto JSON | Mapa de `competencia_id` a `nivel` (antes de calibrar). | Sí (si modo `EDITAR`) |
| `competencias_calibradas` | Objeto JSON | Mapa de `competencia_id` a `nivel` (después de calibrar/aprobar). | Sí |
| `comentario` | Texto | Comentario de RRHH sobre la acción. | Sí |
| `tipo_accion` | Enum | `APROBAR`, `DEVOLVER`, `CALIBRAR`. | Sí |
| `fecha` | Fecha (ISO 8601) | Fecha y hora de la acción. | Sí |

---

## 3. Flujos de Integración y Endpoints Sugeridos

Basado en el consumo del frontend, la API debería soportar los siguientes comportamientos de datos (con las rutas y convenciones que el backend defina):

### 1. Gestión de Procesos de Evaluación

*   **GET `/api/competency-evaluations`:** Retorna el listado paginado y filtrado de `CompetencyEvaluationSummary`.
    *   **Parámetros de consulta:** `search`, `estado`, `pagina`, `items_por_pagina`, `orden`, `orden_por`.
    *   **Respuesta:** Objeto con `evaluaciones` (array de `CompetencyEvaluationSummary`) y `paginacion`.
*   **GET `/api/competency-evaluations/stats`:** Retorna las estadísticas generales de los procesos.
    *   **Respuesta:** Objeto con `stats` (`total`, `publicadas`, `borradores`, `total_evaluaciones`).
*   **GET `/api/competency-evaluations/{id}`:** Retorna el detalle completo de un proceso (`CompetencyEvaluationDetail`).
*   **GET `/api/competency-evaluations/person/{personaId}`:** Busca una evaluación de competencias donde `personaId` esté asignada como evaluada. Retorna el primer proceso encontrado o `null`.
*   **POST `/api/competency-evaluations`:** Crea un nuevo proceso de evaluación.
    *   **Body:** Objeto `CompetencyEvaluationSummary` (sin `id`, `fecha_creacion`, `fecha_actualizacion`, `total_evaluaciones`). El `creado_por` debe ser del usuario autenticado.
*   **PUT `/api/competency-evaluations/{id}`:** Actualiza un proceso de evaluación.
    *   **Body:** `Partial<CompetencyEvaluationDetail>`.
*   **DELETE `/api/competency-evaluations/{id}`:** Elimina un proceso de evaluación.
*   **POST `/api/competency-evaluations/{id}/clone`:** Clona un proceso existente, creando uno nuevo en estado `BORRADOR` con el sufijo `(Copia)`.
*   **PATCH `/api/competency-evaluations/{id}/estado`:** Actualiza solo el `estado_flujo` de un proceso.
    *   **Body:** `{ estado_flujo: EstadoProcesoCompetencia }`.

### 2. Gestión de Asignaciones y Configuración por Proceso

*   **PUT `/api/evaluations/{procesoId}/config`:** Actualiza la configuración detallada de un proceso (`CompetencyEvaluationConfig`).
    *   **Body:** Objeto `CompetencyEvaluationConfig`.
*   **GET `/api/evaluations/asignaciones`:** Retorna el listado de asignaciones de evaluadores (`EvaluatorAssignment`).
    *   **Parámetros de consulta:** `proceso_id`, `persona_id`, `evaluador_id`, `estado`, `tipo`.
    *   **Respuesta:** Objeto con `asignaciones` (array de `EvaluatorAssignment`).
*   **POST `/api/evaluations/{procesoId}/generar-asignaciones`:** (Sugerido) Endpoint para que el backend pueda re-generar las asignaciones de un proceso si se cambia la configuración o los participantes. Esto encapsularía la lógica compleja de `generarAsignaciones` del frontend.
    *   **Body:**
        *   `persona_ids` (Array de strings): IDs de las personas a evaluar.
        *   `config` (Objeto): `CompetencyEvaluationConfig` actual del proceso.
        *   `evaluadores_otros` (Objeto): Mapa de `persona_id` a `Array<evaluador_id>` para evaluadores de tipo `OTRO`.
        *   `jefe_por_persona` (Objeto): Mapa de `persona_id` a `evaluador_id` de su jefe directo (resuelto por el backend).
    *   **Respuesta:** Array de `EvaluatorAssignment` (las asignaciones generadas).
*   **DELETE `/api/evaluations/{procesoId}/limpiar-asignaciones`:** (Sugerido) Elimina todas las asignaciones de un proceso. Útil antes de una regeneración completa.
*   **PATCH `/api/evaluations/asignaciones/{asignacionId}/iniciar`:** Marca una asignación como `EN_PROGRESO`. Si el estado previo era `COMPLETADO`, incrementa `contador_correcciones`.
*   **PATCH `/api/evaluations/asignaciones/{asignacionId}/completar`:** Marca una asignación como `COMPLETADO` o `EN_REVISION` (según `revision_obligatoria` y `correccion.requiere_revision`).
*   **PATCH `/api/evaluations/asignaciones/{asignacionId}/aprobar`:** Marca una asignación como `APROBADO`. Puede recibir `competencias_calibradas`, `calibrado_por` y `comentario`.
*   **PATCH `/api/evaluations/asignaciones/{asignacionId}/calibrar`:** Realiza una calibración de puntajes sin aprobar definitivamente. Recibe `competencias_calibradas`, `calibrado_por` y `comentario`.
*   **PATCH `/api/evaluations/asignaciones/{asignacionId}/devolver`:** Marca una asignación como `DEVUELTO`. Requiere `calibrado_por` y `comentario`.

### 3. Gestión de Respuestas de Evaluación

*   **POST `/api/evaluation-responses`:** Guarda o actualiza una respuesta de evaluación.
    *   **Body:** Objeto `EvaluationResponse` (sin `id`, `fecha_envio`, `fecha_ultima_edicion`).
*   **GET `/api/evaluation-responses`:** Retorna listado de `EvaluationResponse`.
    *   **Parámetros de consulta:** `evaluador_id`, `proceso_id`, `persona_id`, `asignacion_id`, `estado`.
    *   **Respuesta:** Objeto con `respuestas` (array de `EvaluationResponse`).
*   **GET `/api/evaluation-responses/key`:** (Sugerido) Retorna una respuesta por la clave compuesta `evaluador_id`, `proceso_id`, `persona_id` (o `asignacion_id`).
*   **GET `/api/evaluation-responses/{asignacionId}/calibrated-scores`:** (Sugerido) Retorna los `competencias_calibradas` si existen para una asignación.

### 4. Gestión de Logs de Calibración

*   **GET `/api/calibration-logs/{asignacionId}`:** Retorna el historial de `CalibrationLog` para una asignación.
    *   **Respuesta:** Array de `CalibrationLog`.

### 5. Cálculo de Resultados

*   **GET `/api/competency-evaluations/{procesoId}/personas/{personaId}/niveles-competencia`:** (Sugerido) Retorna el nivel obtenido por competencia para una persona en un proceso, promediando los puntajes calibrados o crudos de las asignaciones aprobadas/completadas.
    *   **Respuesta:** Mapa de `competencia_id` a `nivel_obtenido`.

### 6. Integración con Evaluación Integral

*   **PATCH `/api/integral-evaluations/{integralId}/sync-component`:** Actualiza el estado de un componente de evaluación integral (competencias en este caso).
    *   **Body:**
        *   `componente_id` (string): e.g., `competencias`.
        *   `data` (Objeto): `{ puntaje: number, puntaje_numerico: number, escala_maxima: number, estado: string }`.

---

## 4. Validaciones Esperadas en el Backend

Para garantizar que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`), el backend debe aplicar las siguientes validaciones y retornar un objeto JSON estándar con un mensaje descriptivo del error en la propiedad `message`:

1.  **Datos del Proceso:**
    *   `nombre`: No vacío, máx 255 caracteres.
    *   `descripcion`: Máx 1000 caracteres.
    *   `estado`: Solo valores válidos de `CompetencyEvaluationStatus`.
2.  **Configuración del Proceso:**
    *   `tipos_evaluacion`: Los pesos (`peso`) de los tipos activos deben sumar 100% si hay participantes.
    *   `tipo`: Solo valores válidos de `TipoEvaluacion`.
    *   `calibracion_rrhh.modo`: Solo `SOLO_REVISAR` o `EDITAR`.
    *   `correccion.maximo_por_asignacion`: Número >= 0 o `null`.
    *   Reglas de corrección: Coherencia entre `permitir`, `maximo_por_asignacion`, `requiere_revision`, `permitir_cuando_devuelto`, `permitir_voluntaria` (e.g., si `permitir` es `false`, las demás opciones de corrección deben ser `false`/`0`).
3.  **Competencias y Pesos:**
    *   `competencias_asignadas`: Los IDs deben corresponder a competencias existentes.
    *   `weights`: Los pesos de las competencias asignadas deben sumar exactamente 100% si hay competencias.
4.  **Participantes y Evaluadores:**
    *   `personas_a_evaluar`: Los IDs deben corresponder a personas existentes.
    *   `evaluadores_por_persona`: Los IDs de evaluadores deben corresponder a usuarios existentes con rol de evaluador.
    *   Resolución de `JEFE_DIRECTO` y `AUTOEVALUACION`: El backend debe poder resolver los `evaluador_id` correctos para estos tipos de asignación.
5.  **Respuestas de Evaluación:**
    *   `competencias_evaluadas`: Todas las competencias asignadas deben tener un nivel calificado.
    *   `nivel`: El nivel debe estar dentro del rango válido (e.g., 0-5).
    *   `asignacion_id`: Debe corresponder a una asignación existente y válida para el evaluador y proceso.
    *   `estado`: Solo valores válidos para el estado de respuesta (e.g., `COMPLETADO`).
6.  **Fechas:** Todas las fechas (creación, actualización, envío, calibración) deben ser válidas y en formato ISO 8601.
7.  **Transiciones de Estado:** Las transiciones de `estado` y `estado_flujo` (de proceso) y `estado` (de asignación) deben respetar el flujo definido (e.g., `PENDIENTE` → `EN_PROGRESO` → `COMPLETADO` / `EN_REVISION` → `APROBADO` / `DEVUELTO` → `EN_PROGRESO`).
8.  **Permisos de Usuario:** Todas las operaciones deben validar que el usuario autenticado tenga los roles y permisos adecuados (RRHH para administración/calibración, Evaluador para calificar, Empleado para autoevaluación).

---

## 5. Glosario de Términos

*   **Proceso de Evaluación:** Contenedor principal que agrupa un conjunto de competencias, participantes, evaluadores y configuraciones.
*   **Asignación:** Una instancia específica de evaluación, que vincula un evaluador con una persona evaluada dentro de un proceso y un `tipo_evaluacion`.
*   **Respuesta de Evaluación:** La calificación efectiva (puntajes por competencia y comentarios) que un evaluador envía para una asignación.
*   **Calibración:** Proceso en el que RRHH revisa y, si es necesario, ajusta los puntajes de las evaluaciones antes de su cierre definitivo.
*   **Brecha de Competencia:** Diferencia entre el nivel esperado de una competencia para un rol o puesto y el nivel obtenido por una persona.
*   **Autoevaluación:** Evaluación realizada por la propia persona sobre sus competencias.
*   **Jefe Directo:** Evaluación realizada por el supervisor o jefe jerárquico de la persona evaluada.
*   **Otro Evaluador:** Evaluador adicional (par, colaborador, etc.) designado manualmente por RRHH.

---

## 6. Roles y Responsabilidades (Frontend)

*   **Administrador de RRHH:**
    *   Crea, edita, publica, archiva, clona y elimina procesos de evaluación.
    *   Configura tipos de evaluación, pesos, política de corrección y calibración.
    *   Asigna competencias (manual/por cargo) y participantes/evaluadores.
    *   Realiza el proceso de calibración, aprobación o devolución de asignaciones.
    *   Cierra procesos de evaluación.
    *   Acceso a dashboards de brechas y resultados.
*   **Evaluador (externo / Jefe Directo / Otro):**
    *   Accede a su lista de evaluaciones pendientes y completadas.
    *   Califica competencias y añade comentarios para las personas asignadas.
    *   Puede corregir evaluaciones según la política.
*   **Empleado (para autoevaluación):**
    *   Accede a su lista de autoevaluaciones pendientes y completadas.
    *   Realiza autoevaluaciones.
    *   Accede a sus resultados de evaluaciones una vez que el proceso está `CERRADO`.

---

## 7. Consideraciones de Integración Futuras

*   **Integración con Módulo de Usuarios/Personas:** La API debe poder consultar información de usuarios (para `evaluador_id`) y personas (para `persona_id`, `puesto_id`, `usuario_id` del empleado) desde sus respectivos módulos.
*   **Integración con Módulo de Organigrama/Puestos/Cargos:** Para la resolución de evaluadores `JEFE_DIRECTO` y la derivación de competencias `desde_cargos`, la API necesitará consultar la estructura del organigrama, los puestos y los cargos con sus competencias requeridas.
*   **Integración con Módulo de Competencias:** Para obtener el detalle de las competencias (nombre, descripción, definiciones de niveles) utilizadas en los procesos de evaluación.
*   **Integración con Módulo de Correos:** Para el envío de notificaciones automáticas relacionadas con el estado de las evaluaciones y asignaciones, utilizando las plantillas asociadas.
*   **Integración con Evaluaciones Integrales:** Como se ve en el servicio, existe una integración con un módulo de evaluación integral que recibe los resultados normalizados de la evaluación de competencias.
