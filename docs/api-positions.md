# Guía de Información de Puestos de Trabajo y Asignación de Personal para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de puestos de trabajo y la asignación de colaboradores en el organigrama.

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):**
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, tablas, formularios y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de detalle de unidades organizacionales (`src/pages/Admin/OrgUnitDetailPage.tsx`) y detalle de puestos (`src/pages/Admin/OrgPositionDetailPage.tsx`) donde se gestionan los puestos de trabajo de cada unidad, y se asignan o desasignan colaboradores. Para soportar correctamente este módulo, se requiere proveer la siguiente información:

### A. Listado de Puestos por Unidad Organizacional
Muestra una tabla con paginación, búsqueda de texto, ordenación y opciones de edición/eliminación de puestos de trabajo asociados a una unidad específica.

*   **Búsqueda y Filtros requeridos por el frontend:**
    *   Filtro por Unidad Organizacional (`unidad_id`): Identificador único de la unidad a la que pertenece el puesto.
    *   Búsqueda de texto (`filtro`): Permite buscar coincidencias insensibles a mayúsculas/minúsculas sobre el nombre del puesto, nombre del perfil de cargo o el nombre del colaborador asignado.
    *   Filtro por Estado (`estado`): `VACANTE` u `OCUPADO`.
*   **Paginación estándar:**
    *   Soporta cambio de página y de cantidad de filas por página.
    *   El frontend espera la estructura de paginación estándar que retorna `total_items`, `total_paginas`, `cantidad_por_pagina` y `pagina_actual`.

### B. Formulario de Creación y Edición de Puestos
Permite dar de alta un puesto de trabajo asignándolo a una unidad organizacional específica y vinculándolo con un perfil de cargo (Job profile) y un jefe directo (otro puesto en el organigrama).

### C. Asignación de Personas/Colaboradores a Puestos
Permite asignar un colaborador de la lista del directorio del personal a un puesto determinado, cambiando su estado de `VACANTE` a `OCUPADO` y especificando una fecha de inicio de la asignación.

---

## 2. Estructura de Datos Requerida por el Frontend

La entidad **Puesto** debe contener la siguiente información mínima para poder representarse correctamente en las vistas:

### Datos de la Ficha del Puesto de Trabajo
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único del puesto | Sí |
| `nombre` | Texto | Nombre descriptivo del puesto (ej. "Líder de TI", "Desarrollador React") | Sí |
| `unidad_id` | Identificador único | Identificador de la Unidad Organizacional asociada | Sí |
| `unidad_nombre` | Texto | Nombre de la Unidad Organizacional (para visualización) | No |
| `cargo_id` | Identificador único | Identificador del Perfil de Cargo asociado (Job) | Sí |
| `cargo_nombre` | Texto | Nombre del Perfil de Cargo asociado (para visualización) | No |
| `jefe_puesto_id` | Identificador único | Identificador del puesto jerárquico superior (jefe inmediato) | No (Nulo si no reporta a nadie) |
| `jefe_puesto_nombre`| Texto | Nombre del puesto jerárquico superior (para visualización) | No |
| `persona_id` | Identificador único | Identificador del Colaborador asignado actualmente al puesto | No (Nulo si está vacante) |
| `persona_nombre` | Texto | Nombre completo del Colaborador asignado (para visualización) | No |
| `persona_foto` | Texto | URL de la foto del colaborador asociado (para visualización)| No |
| `estado` | Estado del Puesto | Enum con los estados soportados: `VACANTE`, `OCUPADO` | Sí |
| `fecha_creacion` | Fecha (YYYY-MM-DD)| Fecha en que se creó el puesto en la organización | No |

---

## 3. Flujos de Integración y Endpoints Sugeridos

Basado en el consumo del frontend, la API debería soportar los siguientes comportamientos de datos (con las rutas y convenciones que el backend defina):

### 1. Consulta de Puestos (Listado Paginado y Filtrado)
*   **Función:** Retornar los puestos de trabajo filtrados, ordenados y paginados, opcionalmente pertenecientes a una unidad organizacional concreta.
*   **Campos mínimos requeridos por elemento en la respuesta:**
    *   `id`
    *   `nombre`
    *   `cargo_nombre`
    *   `persona_nombre`
    *   `estado`

### 2. Obtener Detalle de Puesto por ID
*   **Función:** Devolver la ficha completa de un puesto específico (incluyendo jefe directo, colaborador asignado e información detallada del cargo asociado).

### 3. Crear Puesto de Trabajo
*   **Función:** Registrar un nuevo puesto en el organigrama dentro de una unidad organizacional.
*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio)
    *   `unidad_id` (Obligatorio)
    *   `cargo_id` (Obligatorio)
    *   `jefe_puesto_id` (Opcional - Jefe inmediato)
    *   *(El estado por defecto al crear es `VACANTE`)*

### 4. Actualizar Puesto de Trabajo
*   **Función:** Modificar los datos del puesto de trabajo (nombre, jefe inmediato, cargo/perfil asignado).

### 5. Eliminar Puesto de Trabajo
*   **Función:** Remover un puesto de trabajo de la estructura organizacional.

### 6. Asignar Colaborador al Puesto
*   **Función:** Vincular un colaborador del directorio de personal al puesto de trabajo, registrando la fecha de inicio y actualizando el estado de la vacante a `OCUPADO`.
*   **Campos enviados:**
    *   `persona_id` (Obligatorio)
    *   `fecha_inicio` (Obligatorio, formato ISO / fecha)

---

## 4. Validaciones Esperadas en el Backend

Para garantizar la integridad estructural y que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`):
1.  **Validación de Jerarquía (Línea de Reporte):** Se debe evitar la creación de bucles infinitos en la jerarquía (ej: que un puesto reporte a sí mismo o que se formen ciclos de reporte mutuo).
2.  **Unicidad de Asignación de Personas:** Un colaborador solo debería estar asignado a un puesto activo a la vez (salvo que la lógica de negocio permita explícitamente pluriempleo en la organización, el backend validará este flujo).
3.  **Estados Soportados:** Los valores para el campo `estado` deben restringirse estrictamente a `VACANTE` y `OCUPADO`.
4.  **Formatos de Error:** Ante un fallo (ej: intentar asignar una persona a un puesto ya ocupado por otro colaborador), el backend debe responder con un objeto JSON estándar que contenga el mensaje descriptivo del error en la propiedad `message`.
