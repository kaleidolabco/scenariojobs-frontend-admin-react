# Guía de Información de Configuración y Plantillas de Correo Electrónico para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de plantillas de correo y configuración del servidor de correo saliente (SMTP).

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):**
> Los nombres de los campos, variables, variables de reemplazo (tokens o placeholders de las plantillas), rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, filtros, formularios y flujos de previsualización sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Configuración de Correos** estructurado en dos pestañas principales para la administración de plantillas de notificación y los parámetros de conexión SMTP.

### A. Gestión de Plantillas de Correo
Muestra un catálogo en forma de tarjetas con opciones de búsqueda, filtrado, creación, edición, desactivación/activación rápida, eliminación y previsualización de correos con datos de prueba.

*   **Filtros requeridos por el frontend:**
    *   Búsqueda de texto (`filtro` / `search`): Permite buscar coincidencias en el nombre de la plantilla, el asunto o su descripción.
    *   Filtro por Tipo de Plantilla (`tipo`): Permite agrupar o clasificar las plantillas en base a eventos de sistema específicos (ej. asignaciones de evaluación, recordatorios, bienvenida, etc.).
    *   Filtro por Estado (`activo`): Permite filtrar entre plantillas activas, inactivas o mostrar todas.
*   **Paginación estándar:**
    *   Soporta paginación devolviendo variables de control como `pagina_actual`, `items_por_pagina`, `total_items` y `total_paginas`.
*   **Gestión de Variables en Plantillas:**
    *   El frontend provee una interfaz para insertar dinámicamente variables encerradas en doble llave `{{variable}}`. El backend es responsable de procesar e interpolar estos valores antes de realizar los envíos reales, así como de documentar qué variables están disponibles para cada tipo de plantilla.

### B. Biblioteca de Plantillas Globales (Sugerencias)
Un catálogo de plantillas predefinidas y optimizadas proporcionadas por la plataforma que los usuarios pueden explorar y "clonar" hacia su propia configuración.
*   **Flujo de Importación:** El usuario selecciona una plantilla global y el sistema crea una copia exacta en la configuración de su organización, permitiendo que sea modificada sin afectar la plantilla original.

### C. Configuración de Servidor SMTP y Envío de Prueba
Un formulario que permite configurar las credenciales del servidor de correo saliente y un panel interactivo para realizar pruebas de conexión enviando un correo de prueba en tiempo real.

---

## 2. Estructura de Datos Requerida por el Frontend

La funcionalidad actual espera interactuar con tres entidades principales: **Plantillas de Correo**, **Plantillas Globales** y **Configuración SMTP**.

### A. Datos de Plantillas de Correo (`EmailTemplate`)
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la plantilla | Sí |
| `nombre` | Texto | Nombre descriptivo interno de la plantilla | Sí |
| `tipo` | Enum / Texto | Tipo/Categoría de la plantilla (ej. `EVALUACION_ASIGNADA`, `PERSONALIZADO`) | Sí |
| `asunto` | Texto | Asunto del correo electrónico (soporta uso de variables `{{var}}`) | Sí |
| `cuerpo` | Texto largo | Cuerpo o contenido principal del mensaje en texto plano o HTML (soporta variables) | Sí |
| `activo` | Booleano | Define si la plantilla está activa para envíos automáticos | Sí |
| `descripcion` | Texto | Nota interna descriptiva sobre cuándo o por qué se envía | No |
| `creado_en` | Fecha ISO-8601 | Fecha y hora de registro de la plantilla | No |
| `actualizado_en`| Fecha ISO-8601 | Fecha y hora de la última modificación | No |

*Nota sobre `tipo`: El frontend actualmente utiliza los siguientes valores enum:*
`EVALUACION_ASIGNADA`, `EVALUADOR_ASIGNADO`, `RECORDATORIO_EVALUACION`, `RESULTADO_EVALUACION`, `BIENVENIDA`, `PERSONALIZADO`.

### B. Datos de Plantillas Globales (`GlobalEmailTemplate`)
Estructura idéntica a `EmailTemplate`, pero representa modelos maestros proporcionados por la plataforma. Son de **solo lectura** para el usuario final.

### C. Datos de Configuración SMTP (`SmtpConfig`)
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `host` | Texto | Dirección del servidor de correo saliente (ej. `smtp.gmail.com`) | Sí |
| `puerto` | Número entero | Puerto de conexión (normalmente `587` o `465`) | Sí |
| `usuario` | Correo / Texto | Usuario o cuenta de autenticación SMTP | Sí |
| `password` | Texto | Contraseña de la cuenta. En actualizaciones, dejar en blanco para conservar la actual | No |
| `remitente_nombre`| Texto | Nombre que aparecerá como remitente del correo (ej. `ScenarioJobs`) | Sí |
| `remitente_email` | Correo | Correo que aparecerá como remitente (ej. `no-reply@empresa.com`) | Sí |
| `usar_tls` | Booleano | Determina si se requiere el uso de TLS/STARTTLS para la conexión | Sí |

---

## 3. Flujos de Integración y Endpoints Sugeridos

A continuación se proponen los comportamientos y flujos lógicos para la persistencia y consumo de datos, quedando su diseño definitivo y rutas a discreción del backend:

### 1. Obtener Listado de Plantillas (Paginado y Filtrado)
*   **Función:** Retornar las plantillas registradas bajo filtros de texto, tipo de plantilla y estado de activación.
*   **Campos mínimos requeridos por elemento en la respuesta:**
    *   `id`, `nombre`, `tipo`, `asunto`, `activo`, `descripcion`, `actualizado_en`.

### 2. Detalle de Plantilla por ID
*   **Función:** Retornar los campos completos de una plantilla para su edición o previsualización.

### 3. Crear Plantilla de Correo
*   **Función:** Registrar una nueva plantilla en el sistema.
*   **Campos enviados:** `nombre`, `tipo`, `asunto`, `cuerpo`, `activo`, `descripcion`.

### 4. Actualizar Plantilla de Correo
*   **Función:** Actualizar una plantilla de forma parcial o total (por ejemplo, cambiar su estado de `activo` directamente desde el switch de la tarjeta).

### 5. Eliminar Plantilla de Correo
*   **Función:** Eliminar de forma permanente o desactivación lógica de una plantilla.

### 6. Obtener Configuración SMTP Actual
*   **Función:** Consultar las credenciales y parámetros actuales de conexión del servidor SMTP (excluyendo la contraseña por motivos de seguridad o devolviéndola enmascarada).

### 7. Guardar/Actualizar Configuración SMTP
*   **Función:** Registrar o actualizar los datos del servidor de correo. Si el campo `password` se envía vacío, el backend no debe sobreescribir la contraseña almacenada previamente.

### 8. Probar Conexión SMTP / Envío de Prueba
*   **Función:** Realizar una validación de conexión enviando un correo electrónico genérico o plantilla de prueba a la dirección del usuario autenticado actual, retornando confirmación de éxito o error detallado.

### 9. Obtener Plantillas Globales
*   **Función:** Retornar un catálogo de plantillas maestras optimizadas proporcionadas por la plataforma.
*   **Acceso:** Público para todos los tenants.

### 10. Importar Plantilla Global
*   **Función:** Clonar una plantilla global hacia la configuración del tenant actual.
*   **Comportamiento:** Debe crear un nuevo registro en la tabla de plantillas del tenant con los mismos valores, asignándole un nuevo ID único y marcándola como editable.

---

## 4. Validaciones Esperadas en el Backend y Variables

Para asegurar la robustez de la integración y el correcto feedback al usuario a través del sistema de alertas del frontend:

1.  **Definición de Variables (Tokens):** El backend tiene total autoridad para definir los nombres exactos de las variables de reemplazo soportadas en los textos de asunto y cuerpo. Se sugiere usar un estándar claro (por ejemplo, `{{nombre_colaborador}}`, `{{link_evaluacion}}`, `{{nombre_evaluacion}}`, etc.) y documentar las variables admitidas para cada flujo de negocio.
2.  **Validación de Formatos de Correo:** El campo `remitente_email` y el usuario SMTP (si es un correo) deben validarse sintácticamente en el servidor.
3.  **Seguridad SMTP:** El backend debe almacenar de forma segura la contraseña del servidor de correos y evitar exponerla en texto plano en los endpoints de lectura.
4.  **Tratamiento de Errores de Conexión:** En el flujo de "Probar Conexión", cualquier fallo de red, autenticación o rechazo por parte del servidor SMTP debe ser capturado por el backend y devuelto con un formato JSON estándar que contenga el mensaje descriptivo del fallo bajo la propiedad `message`.
5.  **Inmutabilidad de Plantillas Globales:** Las plantillas globales deben ser estrictamente de solo lectura. Cualquier modificación solicitada por el usuario debe procesarse primero a través del flujo de importación.
