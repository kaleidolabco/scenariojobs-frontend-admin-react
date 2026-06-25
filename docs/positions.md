# Documentación de Gestión de Puestos de Trabajo (Organigrama)

Esta documentación detalla los endpoints disponibles para la consulta, creación, actualización, eliminación y asignación/desasignación de colaboradores en los puestos de trabajo del sistema.

## 1. Generalidades

- **Base URL:** `/positions`
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

---

## 2. Consulta de Puestos (Listado)

Obtiene una lista paginada de puestos de trabajo filtrados por el tenant del usuario autenticado.

- **Endpoint:** `GET /positions`
- **Permiso Requerido:** `PUESTOS:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página actual | `1` |
| `limite` | `number` | No | Cantidad de registros por página | `10` |
| `busqueda` | `string` | No | Búsqueda insensible al nombre del puesto, perfil de cargo o colaborador activo | `Desarrollador` |
| `unidad_id` | `uuid` | No | Filtrar por Unidad Organizacional específica | `d3b07384-d113-4ec6-a55d-20c2834d896e` |
| `estado` | `string` | No | Filtrar por estado del puesto (`VACANTE`, `OCUPADO`) | `VACANTE` |
| `ordenar_por`| `string` | No | Campo de ordenación: `nombre`, `fecha_registro` | `nombre` |
| `orden` | `string` | No | Dirección: `asc` o `desc` (Default: `desc`) | `asc` |

- **Respuesta Exitosa (`data`):**
  Retorna un objeto paginado con la información requerida por las tablas y organigramas.
  ```json
  {
    "datos": [
      {
        "id": "uuid-puesto",
        "nombre": "Desarrollador React Senior",
        "unidad_id": "uuid-unidad",
        "unidad_nombre": "Dirección de TI",
        "cargo_id": "uuid-cargo",
        "cargo_nombre": "Desarrollador Senior",
        "jefe_puesto_id": "uuid-puesto-jefe",
        "jefe_puesto_nombre": "Líder de TI",
        "colaborador_id": "uuid-colaborador",
        "colaborador_nombre": "Juan Pérez",
        "colaborador_foto": "https://...",
        "estado": "OCUPADO",
        "fecha_creacion": "2026-06-23"
      }
    ],
    "paginacion": {
      "limite": 10,
      "pagina": 1,
      "total": 12,
      "total_paginas": 2
    }
  }
  ```

---

## 3. Detalle de Puesto (findOne)

Obtiene la información detallada de la ficha de un puesto específico del organigrama.

- **Endpoint:** `GET /positions/:id`
- **Permiso Requerido:** `PUESTOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único del puesto.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid-puesto",
    "nombre": "Desarrollador React Senior",
    "unidad_id": "uuid-unidad",
    "unidad_nombre": "Dirección de TI",
    "cargo_id": "uuid-cargo",
    "cargo_nombre": "Desarrollador Senior",
    "jefe_puesto_id": "uuid-puesto-jefe",
    "jefe_puesto_nombre": "Líder de TI",
    "colaborador_id": "uuid-colaborador",
    "colaborador_nombre": "Juan Pérez",
    "colaborador_foto": "https://...",
    "estado": "OCUPADO",
    "fecha_creacion": "2026-06-23"
  }
  ```

---

## 4. Creación de Puesto

Registra un nuevo puesto de trabajo en la jerarquía organizativa, asociándolo a una unidad y a un cargo base. Al crearse, el estado por defecto es siempre `VACANTE`.

- **Endpoint:** `POST /positions`
- **Permiso Requerido:** `PUESTOS:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre descriptivo del puesto | `Desarrollador React Senior` |
| `unidad_id` | `uuid` | **Sí** | ID de la Unidad Organizacional asociada | `uuid-unidad` |
| `cargo_id` | `uuid` | **Sí** | ID del Perfil de Cargo base | `uuid-cargo` |
| `jefe_puesto_id`| `uuid` | No | ID del puesto superior jerárquico directo | `uuid-jefe` |

- **Respuesta Exitosa (`data`):**
  Retorna el objeto del puesto creado (misma estructura que el Detalle).

---

## 5. Actualización de Puesto

Permite modificar los datos básicos de un puesto del organigrama (nombre, jefe inmediato, cargo o unidad).

- **Endpoint:** `PATCH /positions/:id`
- **Permiso Requerido:** `PUESTOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del puesto a actualizar.
- **Cuerpo de la Petición (Request Body):**
  Todos los campos son opcionales (los mismos de la creación).
- **Respuesta Exitosa (`data`):**
  Retorna el objeto del puesto actualizado (misma estructura que el Detalle).

---

## 6. Eliminación de Puesto (Soft Delete)

Elimina un puesto de trabajo de la estructura. El puesto se marca como eliminado lógicamente y cualquier asignación activa del puesto se cerrará automáticamente en esa misma fecha.

- **Endpoint:** `DELETE /positions/:id`
- **Permiso Requerido:** `PUESTOS:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del puesto a eliminar.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid-puesto"
  }
  ```

---

## 7. Asignar Colaborador al Puesto

Vincula un colaborador del directorio de personal al puesto de trabajo, registrando la fecha de inicio de su labor y actualizando el estado de la vacante a `OCUPADO`.

- **Endpoint:** `POST /positions/:id/assign`
- **Permiso Requerido:** `PUESTOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del puesto al que se asignará el colaborador.
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `colaborador_id` | `uuid` | **Sí** | ID del colaborador a vincular | `uuid-colaborador` |
| `fecha_inicio` | `string` | **Sí** | Fecha en formato ISO de inicio de la labor | `2026-06-23` |

- **Respuesta Exitosa (`data`):**
  Retorna la información del puesto actualizado con los datos del nuevo ocupante.

---

## 8. Desasignar Colaborador (Vaciar Puesto)

Finaliza la asignación activa actual del puesto (marcando la fecha de término del colaborador a la fecha actual) y restablece el estado del puesto a `VACANTE`.

- **Endpoint:** `POST /positions/:id/unassign`
- **Permiso Requerido:** `PUESTOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del puesto del cual se removerá al colaborador.
- **Respuesta Exitosa (`data`):**
  Retorna la información del puesto con su estado actualizado a `VACANTE` y los campos de persona en `null`.

---

## 9. Notas Importantes y Validaciones de Negocio

1. **Validación de Jerarquía (Bucle Jerárquico):**
   El backend valida recursivamente que un puesto no pueda reportar a sí mismo, ni directa ni indirectamente (evitando ciclos infinitos de reporte).
2. **Unicidad de Asignación de Colaboradores:**
   Un colaborador solo puede estar asignado a un puesto activo a la vez. El sistema validará esto y arrojará un error `400 BadRequest` si el colaborador ya posee una asignación activa en el tenant.
3. **Puestos Ocupados:**
   No se permite asignar un colaborador a un puesto cuyo estado ya sea `OCUPADO`. Para realizar un cambio, primero se debe invocar la desasignación (`POST /positions/:id/unassign`).
4. **Eliminación con Subordinados:**
   No es posible eliminar un puesto que actúe como jefe directo de otros puestos activos (`subordinados`). Deben reasignarse sus subordinados a otro jefe antes de proceder con su eliminación.
