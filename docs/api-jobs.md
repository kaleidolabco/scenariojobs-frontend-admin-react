# Guía de Información de Cargos (Gestión de Cargos) para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de cargos. 

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):** 
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, filtros, tablas, formularios y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Gestión de Cargos** donde se listan, buscan, filtran, crean, editan y eliminan los perfiles funcionales de la organización. Para soportar correctamente este módulo, se requiere proveer la siguiente información:

### A. Listado de Cargos (Tabla Principal)
Muestra una tabla con paginación, filtros de búsqueda, ordenamiento y opciones de edición/eliminación.

*   **Filtros requeridos por el frontend:**
    *   Búsqueda de texto (`filtro`): Permite buscar coincidencias insensibles a mayúsculas/minúsculas sobre el nombre del cargo o descripción.
    *   Filtro por Nivel Jerárquico (`nivel_jerarquico`): Filtra cargos por su nivel dentro de la organización.
*   **Ordenamiento:**
    *   Soporta ordenamiento ascendente (`asc`) y descendente (`desc`).
    *   Campos ordenables: `nombre`, `nivel_jerarquico` (mínimo requerido).
*   **Paginación estándar:**
    *   Soporta cambio de página y de cantidad de filas por página (10, 25, 50, 100).
    *   El frontend espera la estructura de paginación estándar que retorna `total`, `total_paginas`, `items_por_pagina` (cantidad de registros por página) y `pagina` (página actual).

### B. Formulario de Cargo (Creación y Edición)
Un formulario que envía datos estructurados para crear o actualizar un cargo y sus propiedades asociadas (competencias, funciones y bandas salariales).

### C. Información Mostrada en Listado
*   **Nombre del Cargo:** Título descriptivo del puesto (ej. "Desarrollador Fullstack").
*   **Descripción:** Resumen o descripción corta del cargo (mostrada en preview en la tabla).
*   **Nivel Jerárquico:** Nivel del cargo en la jerarquía organizacional.
*   **Cantidad de Competencias:** Número de competencias asignadas al cargo.
*   **Cantidad de Funciones:** Número de funciones/responsabilidades asociadas al cargo.

---

## 2. Estructura de Datos Requerida por el Frontend

La entidad **Cargo** (llamada internamente `Job` en el frontend actual) debe contener la siguiente información mínima para poder representarse correctamente en las vistas:

### Datos de la Ficha del Cargo
| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único del cargo | Sí |
| `nombre` | Texto | Nombre o título del cargo (ej. "Desarrollador Fullstack") | Sí |
| `descripcion` | Texto | Descripción detallada de las funciones y responsabilidades del cargo | Sí |
| `nivel_jerarquico` | Enum | Nivel jerárquico del cargo. Valores válidos: `JUNIOR`, `SEMI_SENIOR`, `SENIOR`, `LIDER`, `GERENTE`, `DIRECTOR` | Sí |
| `competencias_count` | Número | Cantidad de competencias asignadas (usado en listados) | No |
| `funciones_count` | Número | Cantidad de funciones asignadas (usado en listados) | No |
| `banda_salarial_min` | Número | Salario mínimo de la banda salarial para este cargo | No |
| `banda_salarial_max` | Número | Salario máximo de la banda salarial para este cargo | No |
| `moneda_salarial` | Enum/Texto | Divisa del salario (ej. USD, COP) | No |
| `periodo_salarial` | Enum | Periodo de pago (ej. MENSUAL, ANUAL) | No |

### Estructura de Competencia Requerida (dentro de `competencias_requeridas`)
| Campo | Tipo Funcional | Descripción | Obligatorio |
| :--- | :--- | :--- | :--- |
| `competencia_id` | Identificador único | Identificador único de la competencia | Sí |
| `competencia_nombre` | Texto | Nombre descriptivo de la competencia | Sí |
| `nivel_esperado` | Número | Nivel esperado de profundidad/dominio en la competencia (escala a definir por backend) | No |

### Estructura de Función/Responsabilidad (dentro de `funciones`)
El sistema utiliza una arquitectura de gestión del conocimiento de 5 niveles para las funciones. El backend debe persistir y retornar esta estructura:

1. **JobFunction (Función Principal)**
   * `id`: Identificador único
   * `titulo`: Título de la función
   * `descripcion`: Descripción general
   * `capacidades`: Array de objetos `Capability`

2. **Capability (Capacidad)**
   * `id`: Identificador único
   * `titulo`: Nombre de la capacidad
   * `descripcion`: Detalle de la capacidad
   * `conocimientos`: Array de objetos `Knowledge`

3. **Knowledge (Conocimiento)**
   * `id`: Identificador único
   * `titulo`: Nombre del área de conocimiento
   * `tipoConocimiento`: Enum (`ESTANDAR`, `INTERNO`, `CRITICO`)
   * `fuentes`: Array de Enum (`INTERNA`, `EXTERNA`)
   * `nivelDesarrollo`: Número (0 a 3)
   * `origenEmpleadoId`: Opcional (ID de la persona experta interna)
   * `origenExternoReferencia`: Opcional (Texto de referencia externa)
   * `modulos`: Array de objetos `Module`

4. **Module (Módulo)**
   * `id`: Identificador único
   * `titulo`: Título del módulo de aprendizaje
   * `temas`: Array de objetos `Topic`
   * `archivos`: Array de objetos `FileResource`

5. **Topic (Tema) / Detail (Detalle)**
   * `id`: Identificador único
   * `titulo`: Título del tema
   * `detalles`: Array de objetos `Detail` (con `id`, `titulo`, `descripcion`)
   * `archivos`: Array de objetos `FileResource`

---

## 3. Arquitectura de Endpoints (Separación de Lógicas)

Para garantizar la mantenibilidad y escalabilidad, la API se divide en tres dominios de servicios independientes:

### A. Servicio de Catálogo (Definiciones Globales)
Responsable del CRUD de las competencias y funciones disponibles en la plataforma (independiente de los cargos).

*   **Competencias:**
    *   `GET /catalog/competencies`: Lista todas las competencias disponibles.
    *   `POST /catalog/competencies`: Crea una nueva competencia base.
    *   `PATCH /catalog/competencies/:id`: Actualiza una competencia.
    *   `DELETE /catalog/competencies/:id`: Elimina una competencia.
*   **Funciones:**
    *   `GET /catalog/functions`: Lista todas las funciones base disponibles.
    *   `POST /catalog/functions`: Crea una nueva función base.

### B. Servicio de Gestión de Cargos (Job Core)
Responsable del CRUD del objeto `Cargo` base (sin competencias ni funciones profundas).

*   `GET /jobs`: Listado paginado con campos base y `counts` (`competencias_count`, `funciones_count`).
*   `GET /jobs/:id`: Detalle del cargo base.
*   `POST /jobs`: Crea un nuevo cargo.
*   `PATCH /jobs/:id`: Actualiza datos base del cargo.
*   `DELETE /jobs/:id`: Elimina un cargo.

### C. Servicio de Configuración de Cargos (Job Mapping)
Responsable de asociar elementos del catálogo a un cargo específico.

*   `PATCH /jobs/:id/competencies`: Recibe un array de `{competencia_id, nivel_esperado}`. Sincroniza la relación.
*   `PATCH /jobs/:id/functions`: Recibe la estructura jerárquica de funciones. Sincroniza la relación.

---

## 4. Validaciones Esperadas en el Backend

Para garantizar que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`):

1.  **Campo Nombre:** Debe ser único o validarse según las reglas de negocio. No puede estar vacío.
2.  **Campo Descripción:** No puede estar vacío.
3.  **Nivel Jerárquico:** Solo se admiten los valores válidos: `JUNIOR`, `SEMI_SENIOR`, `SENIOR`, `LIDER`, `GERENTE`, `DIRECTOR`.
4.  **Competencias Requeridas:** 
    *   Los identificadores de competencia deben existir en el sistema.
    *   El nivel esperado, si se proporciona, debe ser un número válido dentro del rango definido.
5.  **Bandas Salariales:** 
    *   Si se proporciona `banda_salarial_min` y `banda_salarial_max`, el mínimo no debe ser mayor que el máximo.
    *   Deben ser valores numéricos válidos (positivos si corresponde).
6.  **Funciones:** Deben cumplir con la estructura jerárquica esperada (a definir por el backend).
7.  **Formatos de Error:** Ante un fallo (ej: nombre duplicado, validación fallida), el backend debe responder con un objeto JSON estándar que contenga el mensaje descriptivo del error en la propiedad `message`.

---

## 5. Niveles Jerárquicos Soportados

El sistema soporta los siguientes niveles jerárquicos para clasificar los cargos:

| Nivel | Código | Descripción |
| :--- | :--- | :--- |
| Junior | `JUNIOR` | Profesional con experiencia limitada en su área |
| Semi Senior | `SEMI_SENIOR` | Profesional con experiencia intermedia y autonomía parcial |
| Senior | `SENIOR` | Profesional con amplia experiencia e independencia completa |
| Líder | `LIDER` | Profesional responsable de la dirección y supervisión de un equipo |
| Gerente | `GERENTE` | Ejecutivo responsable de la gestión integral de un departamento/área |
| Director | `DIRECTOR` | Ejecutivo responsable de la estrategia y dirección de múltiples áreas |
