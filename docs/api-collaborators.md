# Guía de Información de Colaboradores (Directorio de Personal) para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de colaboradores. 

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):** 
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, filtros, tablas, formularios y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Directorio de Personal (Personal)** donde se listan, buscan, filtran y gestionan las fichas de los colaboradores. Para soportar correctamente este módulo, se requiere proveer la siguiente información:

### A. Listado de Colaboradores (Directorio)
Muestra una tabla con paginación, filtros de búsqueda y opciones de edición/eliminación.

*   **Filtros requeridos por el frontend:**
    *   Búsqueda de texto (`search`): Permite buscar coincidencias insensibles a mayúsculas/minúsculas sobre el nombre completo (nombres + apellidos) o email personal.
    *   Filtro por Departamento/Área (`departamento`): Agrupador organizador del colaborador.
    *   Filtro por Estado (`estado`): `ACTIVO`, `INACTIVO`, `LICENCIA`.
*   **Paginación estándar:**
    *   Soporta cambio de página y de cantidad de filas por página (10, 25, 50, 100).
    *   El frontend espera la estructura de paginación estándar que retorna `total`, `total_paginas`, `limite` (cantidad de registros) y `pagina` (página actual).

### B. Formulario de Colaborador (Creación y Edición)
Un formulario de dos secciones ("Datos Personales" e "Información Laboral") que envía datos estructurados para su persistencia.

---

## 2. Estructura de Datos Requerida por el Frontend

La entidad **Colaborador** (llamada internamente `Person` en el frontend actual) debe contener la siguiente información mínima para poder representarse correctamente en las vistas:

### Datos de la Ficha del Colaborador
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único del colaborador | Sí |
| `nombres` | Texto | Nombres del colaborador | Sí |
| `apellidos` | Texto | Apellidos del colaborador | Sí |
| `email_personal` | Correo | Email personal o de contacto alternativo | No |
| `telefono` | Texto | Teléfono o celular del colaborador | No |
| `foto` | URL de Imagen | Dirección pública de la fotografía del colaborador | No |
| `fecha_ingreso` | Fecha (YYYY-MM-DD) | Fecha de contratación del colaborador | No |
| `fecha_nacimiento` | Fecha (YYYY-MM-DD)| Fecha de nacimiento del colaborador | No |
| `departamento` | Texto / Relación | Departamento o Área de la empresa a la que pertenece | No |
| `puesto_id` | Identificador único | Identificador del Puesto específico asociado en el organigrama | No |
| `puesto_nombre` | Texto | Nombre descriptivo del Puesto ocupado (ej. "Desarrollador Fullstack") | No |
| `usuario_id` | Identificador único | Identificador del usuario del sistema asociado al acceso de este colaborador | No |
| `usuario_email` | Correo | Correo corporativo del usuario del sistema asociado | No |
| `estado` | Estado Laboral | Enum con los estados soportados: `ACTIVO`, `INACTIVO`, `LICENCIA` | Sí |

---

## 3. Flujos de Integración y Endpoints Sugeridos

Basado en el consumo del frontend, la API debería soportar los siguientes comportamientos de datos (con las rutas y convenciones que el backend defina):

### 1. Consulta de Colaboradores (Listado Paginado)
*   **Función:** Retornar los colaboradores filtrados, ordenados y paginados bajo la estructura unificada de paginación del sistema.
*   **Campos mínimos requeridos por elemento en la respuesta:**
    *   `id`
    *   `nombres`
    *   `apellidos`
    *   `email_personal`
    *   `telefono`
    *   `departamento`
    *   `fecha_ingreso`
    *   `estado`
    *   `foto`
    *   `puesto_nombre`

### 2. Obtener Detalle de Colaborador por ID
*   **Función:** Devolver la ficha completa de un colaborador específico al abrir su formulario de edición o ficha de legajo.

### 3. Crear Colaborador
*   **Función:** Registrar un colaborador.
*   **Campos enviados por el formulario:**
    *   `nombres` (Obligatorio)
    *   `apellidos` (Obligatorio)
    *   `email_personal` (Opcional)
    *   `telefono` (Opcional)
    *   `departamento` (Opcional)
    *   `fecha_ingreso` (Opcional)
    *   `estado` (Obligatorio - Default: `ACTIVO`)

### 4. Actualizar Colaborador
*   **Función:** Actualizar parcialmente (método `PATCH` sugerido) o totalmente los campos editables del colaborador.

### 5. Eliminar Colaborador
*   **Función:** Remover o desactivar un colaborador de la lista activa.

---

## 4. Validaciones Esperadas en el Backend

Para garantizar que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`):
1.  **Formato de Correo:** El campo `email_personal` (si es provisto) debe validarse sintácticamente en el servidor.
2.  **Formato de Fechas:** Las fechas deben ser validadas en formato ISO `YYYY-MM-DD`.
3.  **Restricciones de Estado:** Solo se admiten valores válidos para el campo `estado` (`ACTIVO`, `INACTIVO`, `LICENCIA`).
4.  **Formatos de Error:** Ante un fallo (ej: email personal ya registrado por otro colaborador), el backend debe responder con un objeto JSON estándar que contenga el mensaje descriptivo del error en la propiedad `message`.
