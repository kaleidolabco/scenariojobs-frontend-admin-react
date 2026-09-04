# Documentación de Gestión de Colaboradores (Directorio de Personal)

Esta documentación detalla los endpoints disponibles para la consulta, creación y gestión de la ficha de colaboradores (personal) en el sistema.

## 1. Generalidades

- **Base URL:** `/collaborators`
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

## 2. Consulta de Colaboradores (Listado)

Obtiene una lista paginada de colaboradores filtrada por el tenant del usuario autenticado.

- **Endpoint:** `GET /collaborators`
- **Permiso Requerido:** `COLABORADORES:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página actual | `1` |
| `limite` | `number` | No | Cantidad de registros por página | `10` |
| `busqueda` | `string` | No | Búsqueda insensible por nombres, apellidos o email personal | `Juan` |
| `departamento` | `string` | No | Filtrar por departamento o área (Unidad Organizacional) | `Tecnología` |
| `estado` | `string` | No | Filtrar por estado laboral (`ACTIVO`, `INACTIVO`, `LICENCIA`) | `ACTIVO` |
| `ordenar_por`| `string` | No | Campo de orden: `nombres`, `apellidos`, `fecha_ingreso`, `fecha_registro` | `nombres` |
| `orden` | `string` | No | Dirección: `asc` o `desc` (Default: `desc`) | `asc` |

- **Respuesta Exitosa (`data`):**
  Retorna un objeto paginado con la información requerida por el directorio.
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "nombres": "Juan Carlos",
        "apellidos": "Pérez Gómez",
        "email_personal": "juan.perez@gmail.com",
        "telefono": "+573001234567",
        "foto": "https://...",
        "fecha_ingreso": "2023-01-15T00:00:00.000Z",
        "fecha_nacimiento": "1990-05-15T00:00:00.000Z",
        "estado": "ACTIVO",
        "departamento": "Desarrollo",
        "puesto_id": "uuid",
        "puesto_nombre": "Desarrollador Fullstack",
        "usuario_id": "uuid-usuario",
        "usuario_email": "juan.perez@empresa.com"
      }
    ],
    "paginacion": {
      "limite": 10,
      "pagina": 1,
      "total": 50,
      "total_paginas": 5
    }
  }
  ```

---

## 3. Detalle de Colaborador (findOne)

Obtiene la información detallada de la ficha de un colaborador específico.

- **Endpoint:** `GET /collaborators/:id`
- **Permiso Requerido:** `COLABORADORES:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único del colaborador.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombres": "Juan Carlos",
    "apellidos": "Pérez Gómez",
    "email_personal": "juan.perez@gmail.com",
    "telefono": "+573001234567",
    "foto": "https://...",
    "fecha_ingreso": "2023-01-15T00:00:00.000Z",
    "fecha_nacimiento": "1990-05-15T00:00:00.000Z",
    "estado": "ACTIVO",
    "departamento": "Desarrollo",
    "puesto_id": "uuid",
    "puesto_nombre": "Desarrollador Fullstack",
    "usuario_id": "uuid-usuario",
    "usuario_email": "juan.perez@empresa.com"
  }
  ```

---

## 4. Creación de Colaborador

Registra un nuevo colaborador en el directorio de personal, vinculándolo opcionalmente a un puesto en el organigrama y a una cuenta de usuario para acceso.

- **Endpoint:** `POST /collaborators`
- **Permiso Requerido:** `COLABORADORES:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombres` | `string` | **Sí** | Nombres del colaborador | `Juan Carlos` |
| `apellidos` | `string` | **Sí** | Apellidos del colaborador | `Pérez Gómez` |
| `email_personal` | `string` | No | Email personal/contacto (distinto al de login) | `juan@gmail.com` |
| `telefono` | `string` | No | Teléfono de contacto | `+573001234567` |
| `foto_url` | `string` | No | URL pública de la fotografía | `https://...` |
| `fecha_nacimiento`| `string` | No | Fecha de nacimiento en formato ISO (YYYY-MM-DD) | `1990-05-15` |
| `fecha_ingreso` | `string` | No | Fecha de ingreso o contratación (YYYY-MM-DD) | `2023-01-15` |
| `estado` | `string` | No | Código de estado laboral (`ACTIVO`, etc). Default: `ACTIVO` | `ACTIVO` |
| `puesto_id` | `uuid` | No | ID del Puesto en el organigrama (crea Asignación) | `uuid` |
| `usuario_id` | `uuid` | No | ID del Usuario para acceso al sistema (vínculo) | `uuid` |

- **Respuesta Exitosa (`data`):**
  Retorna el objeto del colaborador creado (misma estructura que el Detalle).

---

## 5. Actualización de Colaborador (Edit)

Actualiza la ficha de un colaborador. Permite modificar datos personales, cambiar su estado, o reasignarlo a un nuevo puesto/usuario.

- **Endpoint:** `PATCH /collaborators/:id`
- **Permiso Requerido:** `COLABORADORES:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del colaborador a actualizar.
- **Cuerpo de la Petición (Request Body):**
  Todos los campos son opcionales (los mismos de creación). 
  *Nota: Si se envía un `puesto_id` diferente, el backend automáticamente cerrará la asignación actual y creará una nueva.*
- **Respuesta Exitosa (`data`):**
  Retorna el objeto del colaborador actualizado (misma estructura que el Detalle).

---

## 6. Eliminación de Colaborador (Soft Delete)

Marca un colaborador como eliminado, cerrando sus asignaciones de puesto y desvinculando su acceso de usuario asociado.

- **Endpoint:** `DELETE /collaborators/:id`
- **Permiso Requerido:** `COLABORADORES:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del colaborador a eliminar.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid"
  }
  ```

---

## 7. Notas Importantes sobre Relaciones

1. **Email Personal vs Correo Corporativo (Login):**
   - El `email_personal` que se envía/recibe en la ficha del colaborador es un dato de contacto.
   - El `usuario_email` que se retorna en las respuestas es el correo de login al sistema. Este campo **no se envía** al crear o editar el colaborador; se lee automáticamente de la tabla de usuarios utilizando el `usuario_id` vinculado. Si necesitas actualizar el correo de login, debes usar el endpoint de edición de `Usuarios` (`PATCH /users/:id`).
2. **Departamento y Puesto:**
   - En la consulta se retorna el campo `departamento`. Este campo no se guarda directamente en el colaborador, sino que se infiere navegando la relación del `puesto_id` asignado hacia su Unidad Organizacional.
3. **Manejo de Errores:**
   - **404 Not Found:** Si el `puesto_id` o `usuario_id` enviados no existen en el tenant.
   - **409 Conflict:** Si el `email_personal` ya está en uso por otro colaborador del mismo tenant, o si el `usuario_id` ya está vinculado a otro perfil.
