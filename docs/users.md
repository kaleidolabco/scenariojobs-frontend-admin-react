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
    "colaborador_id": "uuid",
    "correo_activacion": {
      "enviado": true,
      "fecha_envio": "2026-05-25T..."
    }
  }
  ```

- **Comportamiento del correo de activación (bloqueante):**
  - Si `enviar_correo` es `true` (default), el correo de bienvenida se envía de forma **síncrona** usando la plantilla de tipo `BIENVENIDA` (plantilla del tenant → plantilla global → HTML de respaldo).
  - Si el envío **falla** (SMTP caído, credenciales inválidas, etc.), la petición responde **500** con un mensaje descriptivo y **el usuario no queda creado** (se revierte la creación). Ninguna cuenta queda sin posibilidad de activación.
  - Si `enviar_correo` es `false`, el usuario se crea sin enviar correo y `correo_activacion.enviado` será `false` (se podrá usar el reenvío de activación, ver sección 8).
  - Cada intento queda registrado en la tabla de trazabilidad `correos_enviados` (ver documentación de correos en `emails.md`).

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

Genera un token de recuperación único y envía un correo electrónico al usuario para resetear su contraseña **usando la plantilla de tipo `RESTABLECER_CONTRASENA`** (plantilla del tenant → plantilla global → HTML de respaldo).

- **Endpoint:** `POST /users/:id/reset-password`
- **Permiso Requerido:** `USUARIOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del usuario.
- **Comportamiento del envío (bloqueante):**
  - Si el envío del correo falla, responde **500** y el token **no se persiste** (no quedan solicitudes "fantasma" que bloqueen reintentos).
  - Si ya existe una solicitud de recuperación vigente (no expirada), responde **409**.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid"
  }
  ```

---

## 8. Reenviar Correo de Activación

Reenvía el correo de bienvenida/activación a un usuario que **aún no ha activado su cuenta**. Regenera el token de activación (invalidando el anterior) y extiende su expiración a 48 horas.

Útil para los casos: "no me llegó el correo", el token expiró, o el SMTP del tenant fue corregido y se quiere reintentar sin recrear al usuario.

- **Endpoint:** `POST /users/:id/resend-activation`
- **Permiso Requerido:** `USUARIOS:EDITAR` (solo administradores autenticados; **no** existe una variante pública).
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador del usuario.
- **Comportamiento del envío (bloqueante):**
  - Si el usuario **ya activó su cuenta**, responde **409** ("Este usuario ya activó su cuenta...").
  - Si el envío falla, responde **500** y **no se modifica** el token del usuario.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "correo_enviado": true
  }
  ```

---

## 9. Manejo de Errores

El API retorna errores estándar de NestJS. El frontend debe capturar el `message` del cuerpo de la respuesta.

- **400 Bad Request:** Datos de entrada inválidos (ej. email mal formado).
- **403 Forbidden:** El usuario no tiene permisos para la acción o intenta crear usuarios en otro tenant.
- **404 Not Found:** El recurso solicitado (ej. `entidad_id`) no existe.
- **409 Conflict:** El correo electrónico ya está registrado, el usuario ya activó su cuenta, o ya existe una solicitud de recuperación vigente.
- **500 Internal Server Error:** Fallo al enviar el correo (SMTP/plantilla). Incluye un mensaje orientativo; el detalle técnico queda en los logs del servidor y en la tabla `correos_enviados`.

---

## 10. Guía para el Frontend: Activación de cuenta y recuperación de contraseña

Esta sección describe, de punta a punta, lo que el frontend debe implementar para los flujos de **activación de cuentas** y **recuperación de contraseña**.

### 10.1 Resumen de las vistas necesarias

| Vista | Ruta pública sugerida | Campos del formulario | Endpoint que consume |
| :--- | :--- | :--- | :--- |
| Activar cuenta | `/activar?token=<uuid>` | `contraseña`, `confirmar contraseña` | `POST /auth/activar` |
| Olvidé mi contraseña | `/olvide-contrasena` | `correo electrónico` | `POST /auth/olvide-contrasena` |
| Restablecer contraseña | `/restablecer-contrasena?token=<uuid>` | `contraseña`, `confirmar contraseña` | `POST /auth/restablecer-contrasena` |

Las tres vistas son **públicas** (sin login). El `token` siempre llega como **query param** en la URL que contiene el correo.

Adicionalmente, en las vistas **de administrador** (gestión de usuarios) deben existir dos acciones:

| Acción (admin) | Endpoint | Cuándo usarla |
| :--- | :--- | :--- |
| Botón "Reenviar correo de activación" en la ficha/lista del usuario | `POST /users/:id/resend-activation` | El usuario no recibió el correo o el link de activación expiró |
| Botón "Restablecer contraseña" en la ficha del usuario | `POST /users/:id/reset-password` | El admin fuerza el reseteo de la contraseña de alguien |

### 10.2 Flujo 1: Activación de cuenta de un nuevo usuario

```
Admin crea usuario (POST /users)
      │
      ├─► Backend genera token_activacion (válido 48h) y envía el correo
      │   de BIENVENIDA con el link: {APP_URL}/activar?token=<uuid>
      │
      └─► Respuesta incluye correo_activacion: { enviado: true } → el front
          del admin puede mostrar confirmación de que el correo salió.
```

El usuario abre el link desde su correo y el frontend:

1. Lee el `token` del querystring de la URL.
2. Renderiza el formulario: **contraseña** (mínimo 8 caracteres) y **confirmar contraseña** (validar localmente que coincidan).
3. Al enviar: `POST /auth/activar`
   ```json
   { "token": "<uuid-de-la-url>", "contrasena": "NuevaClave123" }
   ```
4. Interpreta la respuesta:
   - **200 OK** → Mostrar "Cuenta activada exitosamente" y redirigir al login.
   - **404** (`Token de activación no válido`) → El enlace no es válido (ya fue usado o es incorrecto). Mostrar mensaje y sugerir contactar al administrador.
   - **400** (`El token de activación ha expirado`) → El enlace superó las 48h. Mostrar mensaje indicando que **un administrador debe reenviar la activación** desde la gestión de usuarios.

> **Nota:** Mientras la cuenta no esté activada, el login rechaza el acceso con `401` y el mensaje *"Tu cuenta aún no ha sido activada. Revisa tu correo electrónico."*. El frontend puede mostrar este mensaje tal cual al usuario.

**Qué ocurre del lado del admin (vista de usuarios):**

- Al crear el usuario (`POST /users`), el envío es **bloqueante**: si el correo no pudo enviarse, la petición falla con `500` y **el usuario no queda creado** → el admin debe corregir la causa (ej. SMTP) e intentarlo de nuevo.
- Si el usuario fue creado con `enviar_correo: false`, o si su link expiró, el admin usa el botón **"Reenviar correo de activación"** (`POST /users/:id/resend-activation`):
  - **200** → `{ id, correo_enviado: true }`. Se generó un token nuevo (el anterior queda invalidado).
  - **409** → El usuario **ya activó su cuenta**; no se puede reenviar activación (usar restablecimiento de contraseña en su lugar).
  - **500** → Falló el envío; el token del usuario no se modificó y puede reintentarse.

### 10.3 Flujo 2: Recuperación de contraseña

Existen **dos puntos de entrada**, el frontend debe soportar ambos:

**A) El propio usuario lo solicita (público):**

1. En la pantalla de login, link "¿Olvidaste tu contraseña?" → vista `/olvide-contrasena`.
2. Formulario con un único campo: **correo electrónico**.
3. Al enviar: `POST /auth/olvide-contrasena`
   ```json
   { "correo": "usuario@empresa.com" }
   ```
4. La respuesta es **siempre la misma** (200, mensaje genérico: *"Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."*), exista o no el correo. Esto es intencional (anti-enumeración): el frontend debe mostrar ese mensaje tal cual, sin intentar deducir nada más.
5. Si el correo existe, el usuario recibe el email con el link: `{APP_URL}/restablecer-contrasena?token=<uuid>`.

**B) Un administrador lo dispara (autenticado):**

- Desde la gestión de usuarios: botón "Restablecer contraseña" → `POST /users/:id/reset-password`.
  - **200** → `{ id }`. El correo de restablecimiento fue enviado al usuario.
  - **409** → Ya existe una solicitud vigente (no expirada); pedir al usuario que revise su correo.
  - **500** → Falló el envío; no se generó ningún token, se puede reintentar.

**Ambos caminos convergen** en la vista `/restablecer-contrasena`:

1. Leer el `token` del querystring.
2. Formulario: **contraseña** (mínimo 8 caracteres) y **confirmar contraseña** (validación local).
3. Al enviar: `POST /auth/restablecer-contrasena`
   ```json
   { "token": "<uuid-de-la-url>", "contrasena": "NuevaClave123" }
   ```
4. Interpreta la respuesta:
   - **200 OK** → *"Contraseña restablecida exitosamente"*. **Importante:** por seguridad, el backend también **invalida todas las sesiones activas** del usuario (refresh token eliminado). Redirigir al login.
   - **404** (`Token de recuperación no válido`) → El enlace ya fue usado o es incorrecto. Ofrecer repetir la solicitud desde `/olvide-contrasena`.
   - **400** (`El token de recuperación ha expirado`) → El enlace superó las 48h. Redirigir a `/olvide-contrasena` para generar uno nuevo.

### 10.4 Contratos de las peticiones

**`POST /auth/activar`** (público)

| Campo | Tipo | Validación |
| :--- | :--- | :--- |
| `token` | `string` | Obligatorio (UUID del correo) |
| `contrasena` | `string` | Obligatorio, mínimo 8 caracteres |

Respuesta `data`: `{ "mensaje": "Cuenta activada exitosamente. Ya puedes iniciar sesión." }`

**`POST /auth/olvide-contrasena`** (público)

| Campo | Tipo | Validación |
| :--- | :--- | :--- |
| `correo` | `string` | Obligatorio, email válido |

Respuesta `data` (siempre igual): `{ "mensaje": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." }`

**`POST /auth/restablecer-contrasena`** (público)

| Campo | Tipo | Validación |
| :--- | :--- | :--- |
| `token` | `string` | Obligatorio (UUID del correo) |
| `contrasena` | `string` | Obligatorio, mínimo 8 caracteres |

Respuesta `data`: `{ "mensaje": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión." }`

### 10.5 Errores relevantes para estas vistas

| Código | Mensaje (`message`) | Qué debe mostrar/hacer el front |
| :--- | :--- | :--- |
| `400` | `El token de activación ha expirado` | Aviso de expiración + indicar que un admin reenvíe la activación |
| `400` | `El token de recuperación ha expirado` | Aviso de expiración + link a `/olvide-contrasena` |
| `400` | Errores de validación del body | Mostrar junto al campo (ej. contraseña muy corta) |
| `404` | `Token de activación no válido` | Enlace inválido o ya usado |
| `404` | `Token de recuperación no válido` | Enlace inválido o ya usado |
| `401` (login) | `Tu cuenta aún no ha sido activada. Revisa tu correo electrónico.` | Mostrar tal cual en la pantalla de login |

### 10.6 Buenas prácticas de UX recomendadas

- **No** pedir login para estas vistas; son públicas.
- Validar localmente contraseña ≥ 8 caracteres y coincidencia de confirmación **antes** de llamar al API (el backend valida igualmente).
- Tras activar o restablecer con éxito, redirigir al login (no autologin: el backend no retorna tokens en esos flujos).
- Mostrar estados de carga durante la petición (los envíos de correo son síncronos y pueden tardar un par de segundos).
- Sanitizar el `token` leído de la URL (no renderizarlo en el DOM).
