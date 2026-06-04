# Documentación de Gestión de Cargos

Esta documentación detalla los endpoints disponibles para la creación, consulta, edición y gestión de cargos, sus competencias requeridas y su jerarquía de funciones de hasta 5 niveles.

## 1. Generalidades

- **Base URL:** `/jobs`
- **Autenticación:** Requiere Token Bearer en el header (`Authorization: Bearer <token>`).
- **Formato de Respuesta Estándar:**
  Todas las respuestas siguen la estructura del `ResponseInterceptor`:
  ```json
  {
    "success": boolean,
    "message": "Mensaje descriptivo de la operación",
    "data": T | null
  }
  ```

### Flujo de trabajo recomendado

Los cargos son entidades independientes que se relacionan con competencias ya existentes. El flujo correcto es:

1. Crear el cargo base → `POST /jobs`
2. Crear competencias por separado (ver `api-docs/competencies.md`) si aún no existen.
3. Asignar competencias al cargo → `PATCH /jobs/:id/competencies`
4. Definir la jerarquía de funciones → `PATCH /jobs/:id/functions`

---

## 2. Listar Cargos

Obtiene una lista paginada de cargos del tenant del usuario autenticado.

- **Endpoint:** `GET /jobs`
- **Permiso Requerido:** `CARGOS:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página | `1` |
| `limite` | `number` | No | Registros por página | `10` |
| `filtro` | `string` | No | Búsqueda por nombre o descripción del cargo | `Backend` |
| `nivel_jerarquico` | `string` | No | Filtrar por código de nivel (ej: `SENIOR`, `JUNIOR`) | `SENIOR` |
| `ordenar_por` | `string` | No | Campo de orden: `nombre`, `nivel_jerarquico`, `fecha_registro` | `nombre` |
| `orden` | `string` | No | Dirección: `asc` o `desc`. Default: `desc` | `asc` |

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "nombre": "Desarrollador Backend",
        "descripcion": "Desarrollo de APIs REST y microservicios",
        "nivel_jerarquico": "SENIOR",
        "banda_salarial_min": 3000.00,
        "banda_salarial_max": 5000.00,
        "moneda_salarial": "USD",
        "periodo_salarial": "MENSUAL",
        "competencias_count": 5,
        "funciones_count": 3
      }
    ],
    "paginacion": {
      "limite": 10,
      "pagina": 1,
      "total": 25,
      "total_paginas": 3
    }
  }
  ```

---

## 3. Detalle de Cargo

Obtiene un cargo con toda su información: datos base, competencias requeridas y la jerarquía completa de funciones (5 niveles).

- **Endpoint:** `GET /jobs/:id`
- **Permiso Requerido:** `CARGOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único del cargo.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombre": "Desarrollador Backend",
    "descripcion": "Desarrollo de APIs REST y microservicios",
    "nivel_jerarquico": "SENIOR",
    "banda_salarial_min": 3000.00,
    "banda_salarial_max": 5000.00,
    "moneda_salarial": "USD",
    "periodo_salarial": "MENSUAL",
    "competencias_requeridas": [
      {
        "competencia_id": "uuid-competencia",
        "competencia_nombre": "Pensamiento Analítico",
        "nivel_esperado": 4,
        "peso_ponderacion": 1.5
      }
    ],
    "funciones": [
      {
        "id": "uuid-funcion",
        "titulo": "Liderar desarrollo backend",
        "descripcion": "Gestión técnica del equipo de backend",
        "capacidades": [
          {
            "id": "uuid-capacidad",
            "titulo": "Diseño de arquitectura",
            "descripcion": "Capacidad de diseñar soluciones escalables",
            "conocimientos": [
              {
                "id": "uuid-conocimiento",
                "titulo": "Programación en TypeScript",
                "tipoConocimiento": "ESTANDAR",
                "fuentes": ["INTERNA", "EXTERNA"],
                "nivelDesarrollo": 3,
                "origenEmpleadoId": null,
                "origenExternoReferencia": "Certificación TypeScript avanzado",
                "modulos": [
                  {
                    "id": "uuid-modulo",
                    "titulo": "Módulo 1: Fundamentos",
                    "archivos": [
                      { "id": "uuid-archivo", "nombre": "Guia_TS.pdf", "url": "https://storage.com/guia.pdf" }
                    ],
                    "temas": [
                      {
                        "id": "uuid-tema",
                        "titulo": "Tipos avanzados",
                        "archivos": [],
                        "detalles": [
                          { "id": "uuid-detalle", "titulo": "Generics", "descripcion": "Uso de tipos genéricos en TS" }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
  ```

---

## 4. Crear Cargo

Crea un nuevo cargo base para el tenant del usuario autenticado.

- **Endpoint:** `POST /jobs`
- **Permiso Requerido:** `CARGOS:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre del cargo. Máx. 100 caracteres. Único por tenant. | `Desarrollador Backend` |
| `nivel_jerarquico` | `string` | **Sí** | Código del nivel jerárquico. Ver valores válidos abajo. | `SENIOR` |
| `descripcion` | `string` | No | Descripción de funciones y responsabilidades del cargo | `Desarrollo de APIs...` |
| `banda_salarial_min` | `number` | No | Salario mínimo de la banda. Debe ser ≥ 0 | `3000` |
| `banda_salarial_max` | `number` | No | Salario máximo de la banda. Debe ser ≥ `banda_salarial_min` | `5000` |
| `moneda_salarial` | `string` | No | Código de la divisa. Ver valores válidos abajo. | `USD` |
| `periodo_salarial` | `string` | No | Código del periodo de pago. Ver valores válidos abajo. | `MENSUAL` |

**Valores válidos de `nivel_jerarquico`:** `JUNIOR`, `SEMI_SENIOR`, `SENIOR`, `LIDER`, `GERENTE`, `DIRECTOR`

**Valores válidos de `moneda_salarial`:** `COP`, `USD`, `EUR` *(configurados en los parámetros del sistema con tipo `MONEDA_SALARIAL`)*

**Valores válidos de `periodo_salarial`:** `MENSUAL`, `ANUAL` *(configurados en los parámetros del sistema con tipo `PERIODO_SALARIAL`)*

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombre": "Desarrollador Backend",
    "descripcion": "Desarrollo de APIs REST y microservicios",
    "nivel_jerarquico": "SENIOR",
    "banda_salarial_min": 3000.00,
    "banda_salarial_max": 5000.00,
    "moneda_salarial": "USD",
    "periodo_salarial": "MENSUAL"
  }
  ```

---

## 5. Actualizar Cargo

Actualiza los datos base de un cargo existente. Solo se actualizan los campos que se envíen.

- **Endpoint:** `PATCH /jobs/:id`
- **Permiso Requerido:** `CARGOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del cargo a actualizar.
- **Cuerpo de la Petición (Request Body):**
  Todos los campos son opcionales (mismos de creación). Para eliminar `moneda_salarial` o `periodo_salarial`, enviar el campo con valor `null`.
- **Respuesta Exitosa (`data`):**
  Retorna el objeto del cargo actualizado (misma estructura que Crear Cargo).

---

## 6. Eliminar Cargo (Soft Delete)

Marca un cargo como eliminado sin borrarlo físicamente de la base de datos.

- **Endpoint:** `DELETE /jobs/:id`
- **Permiso Requerido:** `CARGOS:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del cargo a eliminar.
- **Respuesta Exitosa (`data`):**
  ```json
  { "id": "uuid" }
  ```

---

## 7. Sincronizar Competencias del Cargo

Reemplaza **completamente** las competencias requeridas de un cargo. Esta operación es destructiva: elimina todas las asignaciones previas y las sustituye por las enviadas en la petición. Para desvincular todas las competencias, enviar `competencias: []`.

> **Importante:** Las competencias deben existir previamente. Crea las competencias usando `POST /competencies` antes de llamar este endpoint.

- **Endpoint:** `PATCH /jobs/:id/competencies`
- **Permiso Requerido:** `CARGOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del cargo.
- **Cuerpo de la Petición (Request Body):**

```json
{
  "competencias": [
    {
      "competencia_id": "uuid-de-la-competencia",
      "nivel_esperado": 4,
      "peso_ponderacion": 1.5
    },
    {
      "competencia_id": "uuid-de-otra-competencia",
      "nivel_esperado": 2
    }
  ]
}
```

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `competencias` | `array` | **Sí** | Lista de competencias a asignar. Puede ser vacío `[]`. | |
| `competencias[].competencia_id` | `uuid` | **Sí** | ID de la competencia ya existente en el tenant | `uuid` |
| `competencias[].nivel_esperado` | `integer` | **Sí** | Nivel de dominio requerido (mínimo 1) | `4` |
| `competencias[].peso_ponderacion` | `number` | No | Factor de peso en evaluaciones. Default: `1.0` | `1.5` |

- **Respuesta Exitosa (`data`):**
  ```json
  { "id": "uuid-del-cargo" }
  ```

---

## 8. Sincronizar Funciones del Cargo

Reemplaza **completamente** la jerarquía de funciones de un cargo con una estructura de hasta 5 niveles: **Función → Capacidad → Conocimiento → Módulo → Tema / Detalle**. Esta operación es destructiva: elimina toda la jerarquía previa.

- **Endpoint:** `PATCH /jobs/:id/functions`
- **Permiso Requerido:** `CARGOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del cargo.

### Jerarquía de la estructura

```
Función (nivel 1)
 └── Capacidad (nivel 2)
      └── Conocimiento (nivel 3)
           └── Módulo (nivel 4)
                ├── Archivos del módulo
                └── Tema (nivel 5)
                     ├── Archivos del tema
                     └── Detalles del tema
```

### Cuerpo de la Petición

```json
{
  "funciones": [
    {
      "titulo": "Liderar desarrollo backend",
      "descripcion": "Gestión técnica del equipo de backend",
      "capacidades": [
        {
          "titulo": "Diseño de arquitectura",
          "descripcion": "Capacidad de diseñar soluciones escalables",
          "conocimientos": [
            {
              "titulo": "Programación en TypeScript",
              "tipoConocimiento": "ESTANDAR",
              "fuentes": ["INTERNA", "EXTERNA"],
              "nivelDesarrollo": 3,
              "origenEmpleadoId": null,
              "origenExternoReferencia": "Certificación TypeScript avanzado",
              "modulos": [
                {
                  "titulo": "Módulo 1: Fundamentos",
                  "archivos": [
                    { "nombre": "Guia_TS.pdf", "url": "https://storage.com/guia.pdf" }
                  ],
                  "temas": [
                    {
                      "titulo": "Tipos avanzados",
                      "archivos": [
                        { "nombre": "Slides.pptx", "url": "https://storage.com/slides.pptx" }
                      ],
                      "detalles": [
                        { "titulo": "Generics", "descripcion": "Uso de tipos genéricos en TS" },
                        { "titulo": "Utility Types", "descripcion": "Partial, Required, Pick, Omit..." }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Descripción de campos por nivel

**Nivel 1 — Función (`funciones[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Título de la función principal |
| `descripcion` | `string` | No | Descripción general de la función |
| `capacidades` | `array` | No | Lista de capacidades asociadas |

**Nivel 2 — Capacidad (`capacidades[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Nombre de la capacidad |
| `descripcion` | `string` | No | Descripción de la capacidad |
| `conocimientos` | `array` | No | Lista de conocimientos requeridos |

**Nivel 3 — Conocimiento (`conocimientos[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Área de conocimiento |
| `tipoConocimiento` | `string` | **Sí** | `ESTANDAR`, `INTERNO` o `CRITICO` |
| `fuentes` | `string[]` | **Sí** | Arreglo con fuentes: `INTERNA`, `EXTERNA` |
| `nivelDesarrollo` | `integer` | **Sí** | Nivel requerido de 0 a 3 |
| `origenEmpleadoId` | `uuid` | No | ID del colaborador experto interno |
| `origenExternoReferencia` | `string` | No | Referencia de fuente externa (curso, certificación, etc.) |
| `modulos` | `array` | No | Módulos de aprendizaje |

**Nivel 4 — Módulo (`modulos[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Título del módulo |
| `archivos` | `array` | No | Recursos adjuntos al módulo |
| `temas` | `array` | No | Temas del módulo |

**Nivel 5 — Tema (`temas[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Título del tema |
| `archivos` | `array` | No | Recursos adjuntos al tema |
| `detalles` | `array` | No | Detalles o sub-puntos del tema |

**Recurso de archivo (`archivos[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre descriptivo del archivo |
| `url` | `string` | **Sí** | URL de acceso o descarga |

**Detalle de tema (`detalles[]`)**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `titulo` | `string` | **Sí** | Título del punto de detalle |
| `descripcion` | `string` | No | Descripción ampliada |

- **Respuesta Exitosa (`data`):**
  ```json
  { "id": "uuid-del-cargo" }
  ```

---

## 9. Notas Importantes

### Comportamiento de Sincronización (Sync)

Los endpoints `PATCH /jobs/:id/competencies` y `PATCH /jobs/:id/functions` implementan un patrón de **sincronización total (full replace)**:

- Toda la información previa es **eliminada** y reemplazada por lo que se envíe en la petición.
- Para **borrar** toda la información, enviar el arreglo vacío (`[]`).
- Para **actualizar** un ítem, se debe reenviar toda la jerarquía incluyendo los ítems sin cambio.

### Separación de responsabilidades — Competencias vs Funciones

- Las **competencias** son entidades independientes del catálogo del tenant. Deben crearse primero vía `POST /competencies` y luego asignarse al cargo con sus IDs.
- Las **funciones y su jerarquía** son exclusivas del cargo. Se crean, editan y eliminan únicamente a través del endpoint de sincronización `PATCH /jobs/:id/functions`.

### Permisos requeridos

| Acción | Permiso |
| :--- | :--- |
| Listar / Ver | `CARGOS:LEER` |
| Crear cargo | `CARGOS:CREAR` |
| Editar cargo / Sincronizar | `CARGOS:EDITAR` |
| Eliminar cargo | `CARGOS:ELIMINAR` |

---

## 10. Manejo de Errores

| Código | Causa |
| :--- | :--- |
| `400 Bad Request` | Campos inválidos (ej. `banda_salarial_min` > `banda_salarial_max`, código de nivel no reconocido, UUID malformado) |
| `400 Bad Request` | Una o más `competencia_id` enviadas no existen o no pertenecen al tenant |
| `401 Unauthorized` | Token de autenticación ausente o expirado |
| `403 Forbidden` | El usuario no tiene el permiso requerido para la operación |
| `404 Not Found` | El cargo con el `id` proporcionado no existe o fue eliminado |
| `409 Conflict` | Ya existe un cargo con el mismo nombre en el tenant |
