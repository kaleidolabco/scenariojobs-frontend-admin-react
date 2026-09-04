# Documentación de Gestión de Usuarios

Esta documentación detalla los endpoints disponibles para la consulta y creación de usuarios en el sistema.

## 1. Generalidades

- **Base URL:** `/users`
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

## 2. Consulta de Usuarios (Listado)

Obtiene una lista paginada de usuarios filtrada por el tenant del usuario autenticado.

- **Endpoint:** `GET /users`
- **Permiso Requerido:** `USUARIOS:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página actual | `1` |
| `limite` | `number` | No | Cantidad de registros por página | `10` |
| `busqueda` | `string` | No | Búsqueda insensible por correo, nombre o apellido | `Juan` |
| `rol` | `string` | No | Filtrar por código de rol | `ADMIN_EMPRESA` |
| `estado` | `string` | No | Filtrar por estado (`ACTIVO`, `INACTIVO`, `BLOQUEADO`) | `ACTIVO` |
| `ordenar_por`| `string` | No | Campo de orden: `correo`, `nombres`, `apellidos`, `fecha_registro`, `ultimo_acceso` | `correo` |
| `orden` | `string` | No | Dirección: `asc` o `desc` (Default: `desc`) | `asc` |

- **Respuesta Exitosa (`data`):**
  Retorna un objeto paginado.
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "correo": "user@company.com",
        "roles": ["ADMIN_EMPRESA", "EMPLOYEE"],
        "estado": "ACTIVO",
        "ultimo_acceso": "2026-05-25T...",
        "colaborador": {
          "id": "uuid",
          "nombres": "Juan",
          "apellidos": "Perez"
        }
      }
    ],
    "paginacion": {
      "limite": 10,
      "pagina": 1,
      "total": 10,
      "total_paginas": 10
    }
  }
  ```

---

## 3. Detalle de Usuario (findOne)

Obtiene la información detallada de un usuario específico.

- **Endpoint:** `GET /users/:id`
- **Permiso Requerido:** `USUARIOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único del usuario.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "correo": "user@company.com",
    "roles": ["ADMIN_EMPRESA", "EMPLOYEE"],
    "estado": "ACTIVO",
    "ultimo_acceso": "2026-05-25T...",
    "colaborador": {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Perez"
    }
  }
  ```

---

## 4. Creación de Usuarios

Crea un nuevo usuario y dispara la notificación de activación por correo electrónico.

- **Endpoint:** `POST /users`
- **Permiso Requerido:** `USUARIOS:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `correo` | `string` | **Sí** | Email válido del usuario | `nuevo@empresa.com` |
| `entidad_id` | `uuid` | **Sí** | ID del Tenant al que pertenece el usuario | `uuid` |
| `estado` | `string` | No | Código de estado (`ACTIVO`, etc). Default: `ACTIVO` | `ACTIVO` |
| `colaborador_id`| `uuid` | No | ID de la persona vinculada en el directorio | `uuid` |
| `roles` | `string[]` | No | Arreglo de códigos de roles | `['EMPLOYEE']` |
| `nombres` | `string` | No | Nombres del usuario | `Maria` |
| `apellidos` | `string` | No | Apellidos del usuario | `Lopez` |
| `enviar_correo` | `boolean` | No | Si se envía el email de activación. Default: `true` | `true` |

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "email": "nuevo@empresa.com",
    "roles": ["EMPLOYEE"],
    "estado": "ACTIVO",
    "ultimo_acceso": null,
    "colaborador_id": "uuid"
  }
  ```

---

## 5. Actualización de Usuario (Edit)

Actualiza la información de un usuario. Permite cambios en datos básicos o administrativos dependiendo de los permisos.

- **Endpoint:** `PATCH /users/:id`
- **Permiso Requerido:** `USUARIOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del usuario a actualizar.
- **Cuerpo de la Petición (Request Body):**
  Campos opcionales: `correo`, `nombres`, `apellidos`, `contrasena`, `estado`, `roles`, `colaborador_id`.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "correo": "updated@company.com",
    "roles": ["ADMIN_EMPRESA"],
    "estado": "ACTIVO",
    "ultimo_acceso": "2026-05-25T...",
    "colaborador": {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Perez"
    }
  }
  ```

---

## 6. Eliminación de Usuario (Soft Delete)

Marca un usuario como eliminado sin borrarlo físicamente de la base de datos.

- **Endpoint:** `DELETE /users/:id`
- **Permiso Requerido:** `USUARIOS:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del usuario a eliminar.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid"
  }
  ```

---

## 7. Restablecer Contraseña

Genera un token de recuperación único y envía un correo electrónico al usuario para resetear su contraseña.

- **Endpoint:** `POST /users/:id/reset-password`
- **Permiso Requerido:** `USUARIOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del usuario.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid"
  }
  ```

---

## 8. Manejo de Errores

El API retorna errores estándar de NestJS. El frontend debe capturar el `message` del cuerpo de la respuesta.

- **400 Bad Request:** Datos de entrada inválidos (ej. email mal formado).
- **403 Forbidden:** El usuario no tiene permisos para la acción o intenta crear usuarios en otro tenant.
- **404 Not Found:** El recurso solicitado (ej. `entidad_id`) no existe.
- **409 Conflict:** El correo electrónico ya está registrado.
