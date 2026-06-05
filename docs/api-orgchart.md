# Guía de Información de Organigrama para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión del organigrama.

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):**
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Estructura Organizacional (Organigrama)** donde se visualiza, crea, edita y elimina unidades organizacionales. Para soportar correctamente este módulo, se requiere proveer la siguiente información:

### A. Listado de Unidades Organizacionales (Organigrama)
Muestra un árbol jerárquico de unidades organizacionales.

*   **Estructura del árbol:** El frontend espera una estructura de datos anidada que represente la jerarquía de las unidades organizacionales, donde cada unidad puede tener `subnodos` (sub-unidades).

### B. Formulario de Unidad Organizacional (Creación y Edición)
Un formulario que envía datos estructurados para la persistencia de una unidad organizacional.

---

## 2. Estructura de Datos Requerida por el Frontend

La entidad **Unidad Organizacional** (llamada internamente `OrgUnit` en el frontend actual) debe contener la siguiente información mínima para poder representarse correctamente en las vistas:

### Datos de la Unidad Organizacional
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la unidad organizacional | Sí |
| `nombre` | Texto | Nombre de la unidad organizacional (ej. "Gerencia General", "Departamento de IT") | Sí |
| `descripcion` | Texto | Descripción detallada de la unidad organizacional | No |
| `tipo` | Texto / Enum | Tipo de unidad organizacional. Valores sugeridos por el frontend: `DEPARTAMENTO`, `GERENCIA`, `DIRECCION`, `SECCION`, `EQUIPO`, `OFICINA`. El backend definirá el listado exhaustivo de valores válidos. | No |
| `subnodos` | Array de OrgUnit | Lista de sub-unidades organizacionales (representa la jerarquía) | No (puede ser un array vacío) |
| `padre_id` | Identificador único | Identificador de la unidad padre (nulo para unidades raíz) | No (automático en creación de sub-unidades) |

---

## 3. Flujos de Integración y Endpoints Sugeridos

Basado en el consumo del frontend, la API debería soportar los siguientes comportamientos de datos (con las rutas y convenciones que el backend defina):

### 1. Consulta del Organigrama (Árbol Completo)
*   **Función:** Retornar la estructura completa del organigrama en formato de árbol.
*   **Campos mínimos requeridos por elemento en la respuesta (OrgUnit):**
    *   `id`
    *   `nombre`
    *   `subnodos` (recursivo)

### 2. Obtener Detalle de Unidad Organizacional por ID
*   **Función:** Devolver la ficha completa de una unidad organizacional específica al abrir su formulario de edición o detalle.

### 3. Crear Unidad Organizacional
*   **Función:** Registrar una nueva unidad organizacional, ya sea raíz o como sub-unidad de una existente.
*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio)
    *   `descripcion` (Opcional)
    *   `tipo` (Opcional)
    *   `padre_id` (Opcional - para crear sub-unidades)

### 4. Actualizar Unidad Organizacional
*   **Función:** Actualizar parcialmente (método `PATCH` sugerido) o totalmente los campos editables de una unidad organizacional.
*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio)
    *   `descripcion` (Opcional)
    *   `tipo` (Opcional)

### 5. Eliminar Unidad Organizacional
*   **Función:** Remover o desactivar una unidad organizacional.
*   **Restricciones:** El frontend verifica si la unidad tiene `subnodos`. En caso de tenerlos, sugiere que no se puede eliminar hasta mover o eliminar sus dependientes. El backend debería reforzar esta validación o manejar la eliminación recursiva según la lógica de negocio.

---

## 4. Validaciones Esperadas en el Backend

Para garantizar que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`):
1.  **Nombre de Unidad:** El campo `nombre` debe ser obligatorio y tener una longitud razonable.
2.  **Unidad Padre:** Si se provee `padre_id`, este debe corresponder a una unidad organizacional existente.
3.  **Restricción de Eliminación:** El backend debe validar que una unidad no pueda ser eliminada si tiene sub-unidades asociadas, a menos que se defina una lógica de eliminación en cascada.
4.  **Formatos de Error:** Ante un fallo (ej: nombre de unidad ya existente en el mismo nivel jerárquico), el backend debe responder con un objeto JSON estándar que contenga el mensaje descriptivo del error en la propiedad `message`.