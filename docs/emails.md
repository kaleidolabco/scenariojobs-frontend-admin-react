# Documentación de Gestión de Correos

Esta documentación detalla los endpoints disponibles para la gestión de plantillas de correo (propias del tenant y globales), la configuración del servidor SMTP saliente y la verificación de conexión.

## 1. Generalidades

- **Base URL:** `/emails`
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

1. (Opcional) Consultar y configurar el SMTP → `PUT /emails/smtp`
2. Verificar la conexión → `POST /emails/smtp/test`
3. Explorar el catálogo de plantillas globales → `GET /emails/global-templates`
4. Importar una plantilla global → `POST /emails/global-templates/:id/import` o crear una personalizada → `POST /emails/templates`
5. Editar y activar/desactivar según se necesite → `PATCH /emails/templates/:id` o `PATCH /emails/templates/:id/activo`
6. Previsualizar el render con variables de prueba → `POST /emails/templates/:id/preview`

---

## 2. Tipos de Plantilla Soportados

Los tipos de plantilla se definen mediante el catálogo parametrizable `TIPO_PLANTILLA_CORREO` (tabla `parametros`), lo que permite añadir nuevos tipos sin cambios de código. El tipo `PERSONALIZADO` permite plantillas libres del tenant; el resto están reservados a los escenarios de notificación del sistema.

| Código | Escenario |
| | :--- | :--- |
| `BIENVENIDA` | Correo de bienvenida al crear un nuevo usuario |
| `RESTABLECER_CONTRASENA` | Recuperación / restablecimiento de contraseña |
| `EVALUACION_ASIGNADA` | Notificación al evaluado cuando se le asigna una evaluación |
| `EVALUADOR_ASIGNADO` | Notificación al evaluador con respuestas pendientes de calificar |
| `RECORDATORIO_EVALUACION` | Recordatorio automático previo al cierre de una evaluación |
| `RESULTADO_EVALUACION` | Notificación al evaluado cuando sus resultados han sido publicados |
| `PERSONALIZADO` | Plantilla libre creada por el tenant |

> **Restricción de unicidad:** Para tipos distintos de `PERSONALIZADO`, solo puede existir **una plantilla activa por tipo** dentro del tenant. Al activar una nueva, el backend validará que no exista otra activa para el mismo tipo.

### Variables dinámicas

Las plantillas soportan variables interpuestas en doble llave `{{variable}}`. El backend las reemplaza antes del envío. A continuación se listan las variables disponibles por tipo (definidas también en el seed global como referencia):

| Tipo | Variables |
| :--- | :--- |
| `BIENVENIDA` | `nombre_usuario`, `nombre_empresa`, `link_acceso` |
| `RESTABLECER_CONTRASENA` | `nombre_usuario`, `link_restablecimiento` |
| `EVALUACION_ASIGNADA` | `nombre_usuario`, `nombre_evaluacion`, `nombre_proceso`, `fecha_cierre`, `link_evaluacion` |
| `EVALUADOR_ASIGNADO` | `nombre_usuario`, `nombre_proceso`, `numero_pendientes`, `link_calificacion` |
| `RECORDATORIO_EVALUACION` | `nombre_usuario`, `nombre_evaluacion`, `fecha_cierre`, `link_evaluacion` |
| `RESULTADO_EVALUACION` | `nombre_usuario`, `nombre_evaluacion`, `nombre_proceso`, `link_resultados` |

> Para plantillas `PERSONALIZADO`, las variables disponibles son definidas libremente por el tenant a través del campo `variables`.

---

## 3. Listar Plantillas de Correo (Tenant)

Obtiene una lista paginada de las plantillas del tenant del usuario autenticado, con búsqueda y filtros.

- **Endpoint:** `GET /emails/templates`
- **Permiso Requerido:** `CORREOS:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página actual | `1` |
| `limite` | `number` | No | Cantidad de registros por página (máx. 100) | `20` |
| `busqueda` | `string` | No | Búsqueda insensible sobre `nombre`, `asunto` y `descripcion` | `bienvenida` |
| `tipo` | `string` | No | Filtrar por tipo de plantilla (ver valores válidos) | `BIENVENIDA` |
| `activo` | `boolean` | No | `true` solo activas, `false` solo inactivas, omitir para todas | `true` |
| `ordenar_por` | `string` | No | Campo de orden: `nombre`, `asunto`, `tipo`, `fecha_registro`, `fecha_actualizacion` | `fecha_actualizacion` |
| `orden` | `string` | No | Dirección: `asc` o `desc`. Default: `desc` | `desc` |

> **Nota sobre `activo`:** Se aceptan los valores `true`/`false`, `1`/`0`. Cualquier otro valor se ignora (sin filtro).

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "nombre": "Bienvenida colaboradores",
        "tipo": "BIENVENIDA",
        "asunto": "¡Bienvenido a {{nombre_empresa}}!",
        "activo": true,
        "descripcion": "Correo de bienvenida al crear un nuevo usuario.",
        "variables": ["nombre_usuario", "nombre_empresa", "link_acceso"],
        "creado_en": "2026-01-22T10:00:00.000Z",
        "actualizado_en": "2026-01-22T10:00:00.000Z"
      }
    ],
    "paginacion": {
      "limite": 20,
      "pagina": 1,
      "total": 1,
      "total_paginas": 1
    }
  }
  ```

---

## 4. Detalle de Plantilla del Tenant

Obtiene los datos completos de una plantilla (incluyendo `cuerpo` en HTML) para edición o previsualización.

- **Endpoint:** `GET /emails/templates/:id`
- **Permiso Requerido:** `CORREOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único de la plantilla.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombre": "Bienvenida colaboradores",
    "tipo": "BIENVENIDA",
    "asunto": "¡Bienvenido a {{nombre_empresa}}!",
    "cuerpo": "<html>...<a href=\"{{link_acceso}}\">Activar mi cuenta</a>...</html>",
    "activo": true,
    "descripcion": "Correo de bienvenida al crear un nuevo usuario.",
    "variables": ["nombre_usuario", "nombre_empresa", "link_acceso"],
    "creado_en": "2026-01-22T10:00:00.000Z",
    "actualizado_en": "2026-01-22T10:00:00.000Z"
  }
  ```

---

## 5. Crear Plantilla de Correo

Crea una nueva plantilla de correo para el tenant del usuario autenticado.

- **Endpoint:** `POST /emails/templates`
- **Permiso Requerido:** `CORREOS:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre descriptivo interno. Máx. 150 caracteres. Único por tenant. | `Bienvenida colaboradores` |
| `tipo` | `string` | **Sí** | Tipo/Categoría de la plantilla (ver valores válidos) | `BIENVENIDA` |
| `asunto` | `string` | **Sí** | Asunto del correo (admite `{{var}}`). Máx. 300 caracteres. | `¡Bienvenido a {{nombre_empresa}}!` |
| `cuerpo` | `string` | **Sí** | Cuerpo del correo en HTML (admite `{{var}}`) | `<html>...</html>` |
| `descripcion` | `string` | No | Nota interna sobre cuándo o por qué se envía | `Correo de bienvenida...` |
| `activo` | `boolean` | No | Define si la plantilla queda activa. Default: `true` | `true` |
| `variables` | `string[]` | No | Lista documental de variables disponibles | `["nombre_usuario", "nombre_empresa"]` |

- **Respuesta Exitosa (`data`):**
  Retorna el objeto de la plantilla creada (misma estructura que Detalle de Plantilla).

---

## 6. Actualizar Plantilla de Correo

Actualiza parcial o totalmente una plantilla. Solo se actualizan los campos enviados.

- **Endpoint:** `PATCH /emails/templates/:id`
- **Permiso Requerido:** `CORREOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la plantilla.
- **Cuerpo de la Petición (Request Body):**
  Todos los campos son opcionales (mismos de creación, sin `id`).

  ```json
  {
    "nombre": "Bienvenida (v2)",
    "asunto": "Te damos la bienvenida a {{nombre_empresa}}",
    "cuerpo": "<html>...nuevo contenido...</html>",
    "descripcion": "Versión actualizada",
    "activo": false
  }
  ```

- **Respuesta Exitosa (`data`):**
  Retorna el objeto de la plantilla actualizada.

---

## 7. Activar / Desactivar Plantilla (Switch rápido)

Cambia solo el estado `activo` de una plantilla. Útil para el switch directo en la tarjeta del UI.

- **Endpoint:** `PATCH /emails/templates/:id/activo`
- **Permiso Requerido:** `CORREOS:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la plantilla.
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `activo` | `boolean` | **Sí** | `true` para activar, `false` para desactivar |

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "activo": true
  }
  ```

---

## 8. Eliminar Plantilla de Correo (Soft Delete)

Marca una plantilla como eliminada sin borrarla físicamente de la base de datos.

- **Endpoint:** `DELETE /emails/templates/:id`
- **Permiso Requerido:** `CORREOS:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la plantilla.
- **Respuesta Exitosa (`data`):**
  ```json
  { "id": "uuid" }
  ```

---

## 9. Previsualizar Plantilla con Datos de Prueba

Renderiza el asunto y el cuerpo de una plantilla con variables de prueba para validar el resultado final antes de activarla.

- **Endpoint:** `POST /emails/templates/:id/preview`
- **Permiso Requerido:** `CORREOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la plantilla.
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `variables` | `object` | No | Mapa de variables a interpolar (clave → valor) |

```json
{
  "variables": {
    "nombre_usuario": "Juan Pérez",
    "nombre_empresa": "Kaleido Lab",
    "link_acceso": "https://app.scenariojobs.com/activar?token=abc"
  }
}
```

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "asunto": "¡Bienvenido a Kaleido Lab!",
    "cuerpo": "<html>... interpolado ...</html>",
    "variables_usadas": ["nombre_usuario", "nombre_empresa", "link_acceso"]
  }
  ```

---

## 10. Listar Plantillas Globales

Retorna el catálogo maestro de plantillas globales proporcionadas por la plataforma. Son de **solo lectura** para todos los tenants.

- **Endpoint:** `GET /emails/global-templates`
- **Permiso Requerido:** `CORREOS:LEER`
- **Parámetros de Consulta:** Ninguno (lista completa, no paginada).

- **Respuesta Exitosa (`data`):**
  ```json
  [
    {
      "id": "uuid",
      "nombre": "Bienvenida al sistema",
      "tipo": "BIENVENIDA",
      "asunto": "¡Bienvenido a {{nombre_empresa}}!",
      "cuerpo": "<html>...</html>",
      "descripcion": "Correo de bienvenida enviado al crear un nuevo usuario.",
      "variables": ["nombre_usuario", "nombre_empresa", "link_acceso"],
      "actualizado_en": "2026-01-22T10:00:00.000Z"
    }
  ]
  ```

---

## 11. Detalle de Plantilla Global

Obtiene el detalle completo de una plantilla global (incluye `cuerpo`).

- **Endpoint:** `GET /emails/global-templates/:id`
- **Permiso Requerido:** `CORREOS:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único de la plantilla global.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombre": "Bienvenida al sistema",
    "tipo": "BIENVENIDA",
    "asunto": "¡Bienvenido a {{nombre_empresa}}!",
    "cuerpo": "<html>...</html>",
    "descripcion": "Correo de bienvenida enviado al crear un nuevo usuario.",
    "variables": ["nombre_usuario", "nombre_empresa", "link_acceso"],
    "creado_en": "2026-01-22T10:00:00.000Z",
    "actualizado_en": "2026-01-22T10:00:00.000Z"
  }
  ```

---

## 12. Importar (Clonar) Plantilla Global

Crea una copia editable de una plantilla global hacia la configuración del tenant actual. La plantilla original permanece intacta.

- **Endpoint:** `POST /emails/global-templates/:id/import`
- **Permiso Requerido:** `CORREOS:CREAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la plantilla global a clonar.

- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `nombre` | `string` | No | Nombre personalizado para la nueva plantilla. Si se omite, se usa `<nombre original> (copia)`. |

```json
{
  "nombre": "Bienvenida (clon Kaleido)"
}
```

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid-nueva",
    "nombre": "Bienvenida (clon Kaleido)",
    "tipo": "BIENVENIDA",
    "asunto": "¡Bienvenido a {{nombre_empresa}}!",
    "activo": true,
    "descripcion": "Correo de bienvenida enviado al crear un nuevo usuario.",
    "variables": ["nombre_usuario", "nombre_empresa", "link_acceso"],
    "creado_en": "2026-01-22T10:00:00.000Z",
    "actualizado_en": "2026-01-22T10:00:00.000Z",
    "origen_id": "uuid-plantilla-global"
  }
  ```

> **Importante:** La plantilla importada queda `activo: true`. Si ya existe otra plantilla activa para el mismo tipo (`PERSONALIZADO` exento), el backend devolverá `409 Conflict`.

---

## 13. Obtener Configuración SMTP

Consulta las credenciales y parámetros actuales del servidor SMTP saliente del tenant. La contraseña nunca se devuelve en texto plano.

- **Endpoint:** `GET /emails/smtp`
- **Permiso Requerido:** `CORREOS:LEER`

- **Respuesta Exitosa (`data`):**
  - Si existe configuración:
  ```json
  {
    "host": "smtp.gmail.com",
    "puerto": 587,
    "usuario": "no-reply@empresa.com",
    "password": "",
    "password_configurada": true,
    "remitente_nombre": "ScenarioJobs",
    "remitente_email": "no-reply@empresa.com",
    "usar_tls": true,
    "actualizado_en": "2026-01-22T10:00:00.000Z"
  }
  ```
  - Si aún no se ha configurado:
  ```json
  null
  ```

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `host` | `string` | Dirección del servidor SMTP |
| `puerto` | `number` | Puerto de conexión (ej. `587`, `465`) |
| `usuario` | `string` | Usuario o cuenta de autenticación |
| `password` | `string` | Siempre vacío (no expuesto por seguridad) |
| `password_configurada` | `boolean` | `true` si ya existe una contraseña almacenada |
| `remitente_nombre` | `string` | Nombre remitente visible en los correos salientes |
| `remitente_email` | `string` | Email remitente (`From`) |
| `usar_tls` | `boolean` | Indica si la conexión requiere TLS/STARTTLS |
| `actualizado_en` | `string` (ISO-8601) | Fecha y hora de la última modificación |

---

## 14. Guardar / Actualizar Configuración SMTP

Crea o actualiza (upsert) los datos del servidor SMTP del tenant.

- **Endpoint:** `PUT /emails/smtp`
- **Permiso Requerido:** `CORREOS:EDITAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `host` | `string` | **Sí** | Host del servidor SMTP. Máx. 255. | `smtp.gmail.com` |
| `puerto` | `number` | **Sí** | Puerto (1–65535) | `587` |
| `usuario` | `string` | **Sí** | Usuario SMTP. Máx. 255. | `no-reply@empresa.com` |
| `password` | `string` | Condicional | Contraseña SMTP. **Obligatorio al crear**. Al actualizar, enviar vacío/omitir para conservar la actual. | `••••••••` |
| `remitente_nombre` | `string` | **Sí** | Nombre del remitente. Máx. 150. | `ScenarioJobs` |
| `remitente_email` | `string` | **Sí** | Email del remitente (formato válido) | `no-reply@empresa.com` |
| `usar_tls` | `boolean` | No | Requiere TLS/STARTTLS. Default: `true` | `true` |

```json
{
  "host": "smtp.gmail.com",
  "puerto": 587,
  "usuario": "no-reply@empresa.com",
  "password": "mi-contraseña-app",
  "remitente_nombre": "ScenarioJobs",
  "remitente_email": "no-reply@empresa.com",
  "usar_tls": true
}
```

- **Respuesta Exitosa (`data`):**
  Retorna la configuración actualizada (misma estructura que Obtener Configuración SMTP).

> **Seguridad:** La contraseña se encripta con AES-256-GCM antes de almacenarse; nunca se devuelve en texto plano.

---

## 15. Probar Conexión SMTP / Envío de Prueba

Realiza una verificación de la conexión SMTP y, opcionalmente, envía un correo de prueba.

- **Endpoint:** `POST /emails/smtp/test`
- **Permiso Requerido:** `CORREOS:EDITAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `correo_destino` | `string` | No | Email destino de la prueba. Si se omite, se envía al usuario autenticado. |
| `solo_verificar` | `boolean` | No | Si es `true`, solo valida la conexión (no envía correo). |
| `plantilla_id` | `uuid` | No | ID de una plantilla del tenant a usar para el envío de prueba (opcional). |
| `asunto_personalizado` | `string` | No | Asunto personalizado cuando no se usa `plantilla_id`. |

```json
{
  "correo_destino": "admin@empresa.com",
  "solo_verificar": false
}
```

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "ok": true,
    "mensaje": "Correo de prueba enviado a admin@empresa.com",
    "destino": "admin@empresa.com"
  }
  ```

  O cuando `solo_verificar: true`:
  ```json
  {
    "ok": true,
    "mensaje": "Conexión verificada correctamente. No se envió ningún correo."
  }
  ```

---

## 16. Permisos requeridos

| Acción | Permiso |
| :--- | :--- |
| Listar / Ver plantillas (tenant o globales) / Ver SMTP | `CORREOS:LEER` |
| Crear plantilla / Importar plantilla global | `CORREOS:CREAR` |
| Editar plantilla / Activar/Desactivar / Guardar SMTP / Probar SMTP | `CORREOS:EDITAR` |
| Eliminar plantilla | `CORREOS:ELIMINAR` |

---

## 17. Notas Importantes

### Inmutabilidad de Plantillas Globales

Las plantillas globales son estrictamente de **solo lectura**. Cualquier modificación solicitada por el usuario debe procesarse primero a través del flujo de **importación** (`POST /emails/global-templates/:id/import`), que genera una copia editable dentro del tenant.

### Seguridad SMTP

- La contraseña SMTP se almacena encriptada (AES-256-GCM) usando la variable de entorno `SECRETS_ENCRYPTION_KEY` (mín. 32 caracteres).
- El endpoint `GET /emails/smtp` devuelve `password` siempre vacío y `password_configurada` como indicador booleano.
- En actualizaciones, dejar `password` vacío o sin enviar para **conservar** la contraseña previamente almacenada.

### Transporter SMTP y fallback

Cuando un proceso del sistema (ej. envío de correo de activación de un nuevo usuario) necesita enviar un correo:
- Si el tenant tiene SMTP configurado, se utiliza ese (con caché en memoria).
- En caso contrario, se usa el transporter global (basado en variables de entorno `MAIL_*`) como fallback.

### Estados de plantillas

Internamente las plantillas usan el parámetro `ESTADO_PLANTILLA_CORREO` con valores `ACTIVO` / `INACTIVO`, mantenido en sincronía con el campo booleano `activo` expuesto en la API. El frontend solo necesita manipular `activo` (booleano).

---

## 18. Manejo de Errores

| Código | Causa |
| :--- | :--- |
| `400 Bad Request` | Campos inválidos (ej. email mal formado en `remitente_email`, puerto fuera de rango, UUID malformado) |
| `400 Bad Request` | No existe configuración SMTP guardada al intentar probar la conexión |
| `400 Bad Request` | Fallo de conexión o de autenticación con el servidor SMTP (mensaje descriptivo bajo `message`) |
| `400 Bad Request` | La contraseña SMTP es obligatoria al configurar el servidor por primera vez |
| `401 Unauthorized` | Token de autenticación ausente o expirado |
| `403 Forbidden` | El usuario no tiene el permiso requerido para la operación |
| `404 Not Found` | La plantilla (tenant o global) con el `id` proporcionado no existe o fue eliminada |
| `409 Conflict` | Ya existe una plantilla con el mismo `nombre` en el tenant |
| `409 Conflict` | Ya existe otra plantilla **activa** para el mismo `tipo` (excepto `PERSONALIZADO`). Desactiva la otra primero |
