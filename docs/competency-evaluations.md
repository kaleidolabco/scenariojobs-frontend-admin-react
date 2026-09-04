# Documentación de la API: Evaluaciones de Competencias

Esta documentación detalla de forma integral los endpoints disponibles para la gestión y configuración de procesos de evaluación de competencias, diseñado para el rol de **Gestor de Recursos Humanos** y evaluadores. El módulo está organizado de forma modular para soportar las 4 pestañas de configuración del frontend, la ejecución de evaluaciones, la calibración por RRHH y el análisis de resultados/brechas.

---

## 1. Generalidades

- **Base URL:** `/competency-evaluations`.
- **Autenticación:** Requiere Token Bearer en el header HTTP (`Authorization: Bearer <token>`).
- **Formato de Respuesta Estándar:**
  Todas las respuestas exitosas y de error están estandarizadas a través del interceptor global:
  ```json
  {
    "success": true,
    "message": "Mensaje descriptivo de la operación",
    "data": T | null
  }
  ```
- **Paginación Estándar:** Los endpoints de listado paginado retornan la estructura:
  ```json
  {
    "datos": [ ... ],
    "paginacion": {
      "total": 50,
      "pagina": 1,
      "limite": 20,
      "total_paginas": 3
    }
  }
  ```

---

## 2. Catálogos y Parámetros del Sistema

Los estados y tipos se gestionan mediante los parámetros del sistema (`Parametro`).

### A. Estados de Proceso (`ESTADO_PROCESO_EVALUACION`)
- `BORRADOR`: Proceso en configuración inicial.
- `PUBLICADO`: Proceso listo o publicado.
- `EN_CALIFICACION`: Evaluaciones en curso por parte de evaluadores.
- `EN_REVISION`: Evaluaciones completadas en fase de revisión/calibración por RRHH.
- `CERRADO`: Proceso finalizado y resultados publicados.
- `ARCHIVADO`: Proceso archivado históricamente.

### B. Estados de Asignación (`ESTADO_ASIGNACION_EVALUACION`)
- `PENDIENTE`: Asignación creada, pendiente de ser iniciada por el evaluador.
- `EN_PROGRESO`: El evaluador ha abierto o iniciado la evaluación.
- `COMPLETADO`: Evaluación respondida y enviada (sin revisión obligatoria).
- `EN_REVISION`: Evaluación enviada y en cola de revisión por RRHH.
- `APROBADO`: Aprobada formalmente por RRHH (resultado definitivo).
- `DEVUELTO`: Devuelta al evaluador para correcciones.

### C. Tipos de Evaluador (`TIPO_EVALUADOR`)
- `AUTOEVALUACION`: Autoevaluación del propio colaborador.
- `JEFE_DIRECTO`: Evaluación por parte del supervisor jerárquico inmediato.
- `OTRO`: Evaluador complementario (pares, clientes internos, subordinados).

### D. Acciones de Calibración (`TIPO_ACCION_CALIBRACION`)
- `APROBAR`: Aprobar la evaluación como definitiva.
- `CALIBRAR`: Ajustar puntajes conservando estado de revisión.
- `DEVOLVER`: Devolver la evaluación al evaluador con observaciones.

---

## 3. Gestión General de Procesos (CRUD y Métricas)

### 3.1 Listado Paginado de Procesos
- **Endpoint:** `GET /competency-evaluations`
- **Permiso:** `EVALUACIONES:LEER`
- **Query Params:**
  - `pagina` (int, default: 1)
  - `limite` (int, default: 20, max: 100)
  - `busqueda` (string, busca en nombre y descripción)
  - `estado` (string: `BORRADOR`, `PUBLICADO`, `EN_CALIFICACION`, etc.)
  - `ordenar_por` (string: `nombre`, `fecha_registro`, `estado`, default: `fecha_registro`)
  - `orden` (`asc` | `desc`, default: `desc`)
- **Retorno (`data`)** (item de `datos`):
  ```json
  {
    "id": "uuid-proceso",
    "nombre": "Evaluación de Competencias Q1 2026",
    "descripcion": "Evaluación semestral",
    "estado": "PUBLICADO",
    "estado_flujo": "PUBLICADO",
    "total_competencias": 3,
    "total_participantes": 12,
    "total_evaluaciones": 5,
    "creado_por": "Gestor RRHH",
    "fecha_creacion": "2026-01-15T08:00:00.000Z",
    "fecha_actualizacion": "2026-01-20T10:30:00.000Z"
  }
  ```
  > **Nota:** El listado devuelve solo métricas agregadas (conteos). Las listas de IDs de competencias (`competencias_asignadas`) y de colaboradores (`colaboradores_evaluados`) se eliminaron por rendimiento; se consultan en los endpoints de cada pestaña (§5, §6).

### 3.2 Métricas y Estadísticas de Procesos
- **Endpoint:** `GET /competency-evaluations/stats`
- **Permiso:** `EVALUACIONES:LEER`
- **Retorno (`data`):**
  ```json
  {
    "total": 5,
    "publicadas": 2,
    "borradores": 3,
    "total_evaluaciones": 42
  }
  ```

### 3.3 Resumen del Proceso
- **Endpoint:** `GET /competency-evaluations/:id`
- **Permiso:** `EVALUACIONES:LEER`
- **Descripción:** Devuelve únicamente los datos básicos del proceso y métricas agregadas (totales), para pintar el encabezado, el estado y las insignias de las pestañas. Los datos detallados de cada sección (competencia, participantes, configuración, correos) se consultan en los endpoints específicos de cada pestaña (§4–§7), evitando cargas pesadas.
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "nombre": "Evaluación de Competencias Q1 2026",
    "descripcion": "Evaluación semestral de liderazgo y competencias técnicas",
    "estado": "PUBLICADO",
    "estado_flujo": "PUBLICADO",
    "creado_por": "Gestor RRHH",
    "fecha_creacion": "2026-01-15T08:00:00.000Z",
    "fecha_actualizacion": "2026-01-20T10:30:00.000Z",
    "total_competencias": 3,
    "total_participantes": 12,
    "total_evaluadores": 8,
    "total_evaluaciones_completadas": 5
  }
  ```

### 3.4 Crear Proceso
- **Endpoint:** `POST /competency-evaluations`
- **Permiso:** `EVALUACIONES:CREAR`
- **Body:**
  ```json
  {
    "nombre": "Evaluación de Competencias Q1 2026",
    "descripcion": "Evaluación del primer trimestre",
    "estado": "BORRADOR"
  }
  ```
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "nombre": "Evaluación de Competencias Q1 2026",
    "descripcion": "Evaluación del primer trimestre",
    "estado": "BORRADOR",
    "fecha_registro": "2026-01-22T10:00:00.000Z",
    "created_at": "2026-01-22T10:00:00.000Z"
  }
  ```

### 3.5 Actualizar Datos Generales
- **Endpoint:** `PUT /competency-evaluations/:id`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:** `{ "nombre": "Nuevo Nombre", "descripcion": "Nueva Desc...", "estado": "PUBLICADO" }`

### 3.6 Actualizar Estado de Flujo
- **Endpoint:** `PATCH /competency-evaluations/:id/estado` (o `/status`)
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:** `{ "estado_flujo": "PUBLICADO" }`

### 3.7 Clonar Proceso
- **Endpoint:** `POST /competency-evaluations/:id/clone`
- **Permiso:** `EVALUACIONES:CREAR`
- **Retorno (`data`):** `{ "id": "uuid-nuevo", "nombre": "Evaluación... (Copia)" }`

### 3.8 Eliminar Proceso (Soft Delete)
- **Endpoint:** `DELETE /competency-evaluations/:id`
- **Permiso:** `EVALUACIONES:ELIMINAR`
- **Retorno (`data`):** `{ "id": "uuid-proceso" }`

---

## 4. Pestaña 1: Información General (`GeneralTab`)

Permite consultar y actualizar las reglas avanzadas de evaluación del proceso de forma aislada.

### 4.1 Consultar Configuración General
- **Endpoint:** `GET /competency-evaluations/:id/config`
- **Permiso:** `EVALUACIONES:LEER`
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "nombre": "Evaluación de Competencias Q1 2026",
    "descripcion": "Descripción del proceso",
    "estado": "BORRADOR",
    "configuracion": {
      "tipos_evaluacion": [
        { "tipo": "AUTOEVALUACION", "activo": true, "peso": 40 },
        { "tipo": "JEFE_DIRECTO", "activo": true, "peso": 60 },
        { "tipo": "OTRO", "activo": false, "peso": 0 }
      ],
      "calibracion_rrhh": { "activo": true, "modo": "EDITAR" },
      "revision_obligatoria": true,
      "correccion": {
        "permitir": true,
        "maximo_por_asignacion": 3,
        "requiere_revision": true,
        "permitir_cuando_devuelto": true,
        "permitir_voluntaria": false
      }
    },
    "config": { "misma_estructura_que_configuracion": true }
  }
  ```
  > **Nota:** El endpoint devuelve el objeto `config` como alias de `configuracion` (mismo contenido) para compatibilidad.

### 4.2 Guardar Configuración General
- **Endpoint:** `PUT /competency-evaluations/:id/config`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:**
  ```json
  {
    "tipos_evaluacion": [
      { "tipo": "AUTOEVALUACION", "activo": true, "peso": 40 },
      { "tipo": "JEFE_DIRECTO", "activo": true, "peso": 60 },
      { "tipo": "OTRO", "activo": false, "peso": 0 }
    ],
    "calibracion_rrhh": { "activo": true, "modo": "EDITAR" },
    "revision_obligatoria": true,
    "correccion": {
      "permitir": true,
      "maximo_por_asignacion": 3,
      "requiere_revision": true,
      "permitir_cuando_devuelto": true,
      "permitir_voluntaria": false
    }
  }
  ```
- **Validaciones:**
  - Si existen participantes asignados y hay tipos activos, la suma de sus pesos debe ser exactamente 100%.
  - Si `permitir` es `false`, las demás opciones de corrección deben ser `false`.

---

## 5. Pestaña 2: Competencias (`CompetenciesTab`)

Permite consultar, calcular y guardar las competencias vinculadas al proceso.

### 5.1 Consultar Competencias Asignadas al Proceso
- **Endpoint:** `GET /competency-evaluations/:id/competencies`
- **Permiso:** `EVALUACIONES:LEER`
- **Query Params:**
  - `pagina` (int, default: 1)
  - `limite` (int, default: 20, max: 100)
  - `busqueda` (string: filtra por nombre o descripción de la competencia)
  - `categoria_id` (UUID de categoría de competencia)
  - `ordenar_por` (`nombre`, `orden`, `peso_ponderacion`, default: `orden`)
  - `orden` (`asc` | `desc`, default: `asc`)
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "origen_competencias": "manual",
    "datos": [
      {
        "id": "uuid-item-1",
        "competencia_id": "uuid-comp-1",
        "nombre": "Liderazgo",
        "descripcion": "Capacidad de guiar equipos hacia el logro de objetivos",
        "escala": 5,
        "categoria": { "id": "uuid-cat", "nombre": "Habilidades Blandas" },
        "orden": 0,
        "seccion": "Bloque Líderes",
        "peso_ponderacion": 50
      }
    ],
    "paginacion": {
      "total": 2,
      "pagina": 1,
      "limite": 20,
      "total_paginas": 1
    }
  }
  ```
  > **Nota:** El peso de cada competencia se encuentra en el campo `peso_ponderacion` de cada item. No se retorna un mapa separado de pesos.

### 5.2 Actualización Incremental de Competencias (PATCH)
- **Endpoint:** `PATCH /competency-evaluations/:id/competencies`
- **Permiso:** `EVALUACIONES:EDITAR`

#### Modo Manual (`origen: "manual"`)
- **Body:**
  ```json
  {
    "origen": "manual",
    "agregar": [
      { "competencia_id": "uuid-comp-3", "orden": 2, "seccion": "Bloque 3", "peso_ponderacion": 30 }
    ],
    "eliminar": ["uuid-comp-1"],
    "actualizar": [
      { "competencia_id": "uuid-comp-2", "orden": 0, "seccion": "Bloque Actualizado", "peso_ponderacion": 70 }
    ],
    "pesos": { "uuid-comp-2": 70, "uuid-comp-3": 30 }
  }
  ```
- **Semántica:**
  - `agregar`: competencias a añadir al proceso (con orden, sección y peso opcionales).
  - `eliminar`: IDs de competencias a quitar del proceso.
  - `actualizar`: competencias existentes cuyo orden, sección o peso se desea modificar.
  - `pesos`: merge del mapa de pesos por competencia. Claves enviadas reemplazan; se valida que sumen 100% si se envía.

#### Modo Automático (`origen: "desde_cargos"`)
- **Body:**
  ```json
  {
    "origen": "desde_cargos",
    "participante_ids": ["uuid-colab-1", "uuid-colab-2"]
  }
  ```
- **Semántica:**
  - `origen: "desde_cargos"`: calcula las competencias derivadas de los cargos de los participantes y las guarda directamente como items del proceso.
  - `participante_ids`: (opcional) IDs de participantes específicos. Si se omite, usa todos los participantes activos del proceso.
  - **Comportamiento**: soft-delete de items actuales + creación de nuevos items con orden, sección (agrupada por categoría) y peso calculado automáticamente.
  - `pesos`: (opcional) si se omite, se calculan automáticamente desde los pesos de los cargos.
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "total_competencias": 5,
    "agregadas": 5,
    "eliminadas": 0,
    "actualizadas": 0,
    "avisos": [
      { "tipo": "SIN_PUESTO", "persona_id": "...", "persona_nombre": "...", "mensaje": "..." }
    ]
  }
  ```

#### Comportamiento General (Transaccional)
- Valida unicidad de competencias en `agregar`.
- Valida que competencias a eliminar/actualizar estén asignadas al proceso.
- Valida que los pesos sumen 100% si se proveen en modo manual.
- Merge atómico de `pesos_json` (interno).

- **Retorno (`data`) - Modo Manual:**
  ```json
  {
    "id": "uuid-proceso",
    "total_competencias": 3,
    "agregadas": 1,
    "eliminadas": 1,
    "actualizadas": 1
  }
  ```

> **Nota:** El antiguo `PUT /competencies` (full-replace) fue eliminado. Usa `PATCH` para operaciones incrementales. El modo `desde_cargos` reemplaza todos los items actuales con las competencias calculadas desde los cargos de los participantes.

### 5.3 Calcular Competencias Sugeridas (desde Cargos)
Calcula las competencias y pesos sugeridos basados en los cargos de los colaboradores. **`colaborador_ids` es opcional**: si se omite, el sistema usa automáticamente todos los participantes activos del proceso.
- **Endpoint Primario:** `POST /competency-evaluations/:id/suggested-competencies`
- **Permiso:** `EVALUACIONES:LEER`
- **Body (con IDs específicos):**
  ```json
  {
    "colaborador_ids": ["uuid-colaborador-1", "uuid-colaborador-2"],
    "pagina": 1,
    "limite": 20
  }
  ```
- **Body (usando todos los participantes del proceso):**
  ```json
  {
    "pagina": 1,
    "limite": 20
  }
  ```
- **Retorno (`data`):**
  ```json
  {
    "ids": ["uuid-comp-1", "uuid-comp-2"],
    "niveles_esperados": { "uuid-comp-1": 4, "uuid-comp-2": 3 },
    "total_cargos": 2,
    "total_personas": 2,
    "total_competencias": 2,
    "competencias": [
      {
        "id": "uuid-comp-1",
        "competencia_id": "uuid-comp-1",
        "nombre": "Liderazgo",
        "descripcion": "Habilidad de guiar equipos",
        "escala": 5,
        "categoria": { "id": "uuid-cat-1", "nombre": "Blandas" },
        "peso_calculado": 60,
        "nivel_esperado": 4
      }
    ],
    "paginacion": {
      "total": 2,
      "pagina": 1,
      "limite": 20,
      "total_paginas": 1
    },
    "avisos": []
  }
  ```
  > **Nota:** El peso de cada competencia sugerida se encuentra en `peso_calculado` de cada item. No se retorna un mapa separado de pesos.
  > **Nota:** También existe una variante `GET /competency-evaluations/:id/suggested-competencies` (legacy) que recibe los IDs vía query params (`colaborador_ids`), pero se recomienda usar el `POST` para evitar URLs demasiado largas con listas grandes de colaboradores.

---

## 6. Pestaña 3: Participantes (`ParticipantsTab`)

Gestiona la selección de personas a evaluar y la generación de evaluadores.

### 6.1 Listado Paginado y Filtrado de Participantes del Proceso
- **Endpoint:** `GET /competency-evaluations/:id/participants`
- **Permiso:** `EVALUACIONES:LEER`
- **Query Params:**
  - `pagina` (int, default: 1)
  - `limite` (int, default: 20)
  - `busqueda` (string: filtra por nombres, apellidos, email)
  - `unidad_organizacional_id` (UUID de unidad organizacional)
  - `cargo_id` (UUID del cargo)
  - `ordenar_por` (`nombre`, `fecha_ingreso`, `fecha_registro`, default: `fecha_registro`)
  - `orden` (`asc` | `desc`, default: `desc`)

- **Retorno (`data`):**
  ```json
  {
    "datos": [
      {
        "id": "uuid-participante-row",
        "colaborador_id": "uuid-colaborador-1",
        "persona_id": "uuid-colaborador-1",
        "nombres": "María",
        "apellidos": "Gómez",
        "nombre_completo": "María Gómez",
        "email": "maria.gomez@empresa.com",
        "foto_url": "https://...",
        "fecha_ingreso": "2023-03-01",
        "cargo": { "id": "uuid-cargo", "nombre": "Líder de Desarrollo" },
        "puesto": { "id": "uuid-puesto", "nombre": "Tech Lead Core" },
        "unidad_organizacional": { "id": "uuid-unidad", "nombre": "Tecnología" },
        "evaluadores_custom": ["uuid-usuario-par-1"],
        "evaluadores_detalle": [
          {
            "id": "uuid-usuario-par-1",
            "nombre_completo": "Laura Pérez",
            "cargo": { "id": "uuid-cargo", "nombre": "Líder de Desarrollo" },
            "puesto": { "id": "uuid-puesto", "nombre": "Tech Lead Core" }
          }
        ],
        "total_asignaciones": 2,
        "fecha_asignacion": "2026-01-20T10:00:00.000Z"
      }
    ],
    "paginacion": {
      "total": 1,
      "pagina": 1,
      "limite": 20,
      "total_paginas": 1
    }
  }
  ```

### 6.2 Actualización Incremental de Participantes (PATCH)
- **Endpoint:** `PATCH /competency-evaluations/:id/participants`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:**
  ```json
  {
    "agregar": [
      { "colaborador_id": "uuid-colab-1", "evaluadores": ["uuid-evaluador-custom"] },
      { "colaborador_id": "uuid-colab-2" }
    ],
    "retirar": ["uuid-colab-a-retirar"],
    "evaluadores_por_colaborador": {
      "uuid-colab-3": ["uuid-evaluador-nuevo"],
      "uuid-colab-4": []
    }
  }
  ```
- **Semántica:**
  - `agregar`: lista de colaboradores a agregar; opcionalmente con sus evaluadores custom (tipo OTRO) por cada uno.
  - `retirar`: lista de IDs de colaboradores a retirar (soft-delete). Valida inmutabilidad: no permite retirar si ya tienen evaluaciones iniciadas o respuestas.
  - `evaluadores_por_colaborador`: **merge** del mapa de evaluadores. Claves enviadas reemplazan/actualizan; array vacío `[]` elimina la entry.
- **Comportamiento Seguro (Transaccional):**
  - Reactiva participantes si ya existían soft-deleted.
  - Crea nuevos participantes.
  - Soft-delete participantes retirados y sus asignaciones pendientes.
  - Merge atómico del mapa `evaluadores_por_colaborador_json`.
  - **Inmutabilidad:** Rechaza `retirar` de participantes con evaluaciones en `EN_PROGRESO`, `COMPLETADO`, `EN_REVISION`, `APROBADO` o con respuestas registradas.
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "total_participantes": 25,
    "agregados": 2,
    "retirados": 1,
    "reactivados": 0
  }
  ```

> **Nota:** El antiguo `PUT /participants` (full-replace) fue eliminado. Usa `PATCH` para operaciones incrementales; para reemplazo total, envía `agregar` con la lista completa y `retirar` con los actuales.

### 6.3 Generar Asignaciones de Evaluadores
- **Endpoint:** `POST /competency-evaluations/:id/generate-assignments`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Retorno (`data`):** `{ "id": "uuid-proceso", "total_asignaciones": 10 }`

---

## 7. Pestaña 4: Correos (`EmailConfigTab`)

Permite vincular y gestionar plantillas de notificación de correo para el proceso.

### 7.1 Consultar Plantillas Vinculadas al Proceso
- **Endpoint:** `GET /competency-evaluations/:id/emails`
- **Permiso:** `EVALUACIONES:LEER`
- **Retorno (`data`):**
  ```json
  {
    "id": "uuid-proceso",
    "plantillas_correo_ids": ["uuid-plantilla-1"],
    "plantillas": [
      {
        "id": "uuid-plantilla-1",
        "nombre": "Invitación a Evaluación de Desempeño",
        "asunto": "Tienes una evaluación de competencias pendiente",
        "cuerpo": "Hola {{colaborador_nombre}}...",
        "descripcion": "Notificación inicial para evaluadores",
        "variables": ["colaborador_nombre", "proceso_nombre", "enlace_evaluacion"],
        "tipo": { "id": "uuid-tipo", "codigo": "INVITACION", "valor": "Invitación" },
        "estado": { "id": "uuid-estado", "codigo": "ACTIVO", "valor": "Activo" }
      }
    ]
  }
  ```

### 7.2 Guardar Plantillas Vinculadas
- **Endpoint:** `PUT /competency-evaluations/:id/emails`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:**
  ```json
  {
    "plantillas_correo_ids": ["uuid-plantilla-1", "uuid-plantilla-2"]
  }
  ```

---

## 8. Asignaciones, Respuestas y Calibración

### 8.1 Listado de Asignaciones
- **Endpoint:** `GET /competency-evaluations/assignments`
- **Permiso:** `EVALUACIONES:LEER`
- **Query Params:** `proceso_id`, `evaluador_id`, `colaborador_id`, `estado`, `tipo`, `pagina`, `limite`.

### 8.2 Iniciar Asignación (Evaluador)
- **Endpoint:** `PATCH /competency-evaluations/assignments/:asignacionId/start`
- **Permiso:** `EVALUACIONES:EDITAR`

### 8.3 Guardar / Enviar Respuesta de Evaluación
- **Endpoint:** `POST /competency-evaluations/responses`
- **Permiso:** `EVALUACIONES:EDITAR`
- **Body:**
  ```json
  {
    "asignacion_id": "uuid-asignacion",
    "proceso_id": "uuid-proceso",
    "colaborador_id": "uuid-colaborador",
    "competencias_evaluadas": {
      "uuid-comp-1": 4,
      "uuid-comp-2": 5
    },
    "comentarios": {
      "text": "Excelente desempeño durante el período",
      "video_url": "https://..."
    }
  }
  ```

### 8.4 Calibración de Evaluaciones por RRHH
- **Aprobar:** `PATCH /competency-evaluations/assignments/:asignacionId/approve`
- **Calibrar Puntajes:** `PATCH /competency-evaluations/assignments/:asignacionId/calibrate`
- **Devolver a Evaluador:** `PATCH /competency-evaluations/assignments/:asignacionId/return`
- **Body:**
  ```json
  {
    "competencias_calibradas": {
      "uuid-comp-1": 4.5
    },
    "comentario": "Calibración aplicada según comité de talento"
  }
  ```

---

## 9. Resultados y Análisis de Brechas

Obtiene los puntajes finales consolidados por competencia y el cálculo de brecha frente al perfil del cargo.
- **Endpoint:** `GET /competency-evaluations/:procesoId/collaborators/:colaboradorId/competency-levels`
- **Permiso:** `EVALUACIONES:LEER`
- **Retorno (`data`):**
  ```json
  {
    "proceso_id": "uuid-proceso",
    "colaborador_id": "uuid-colaborador",
    "niveles_competencia": [
      {
        "competencia_id": "uuid-comp-1",
        "competencia_nombre": "Liderazgo",
        "nivel_obtenido": 4.2,
        "nivel_esperado": 4.0,
        "brecha": 0.2,
        "escala_maxima": 5
      }
    ],
    "brechas": {
      "uuid-comp-1": 0.2
    }
  }
  ```