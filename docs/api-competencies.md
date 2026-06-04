# Guía de Información de Competencias para la API

Este documento sirve como **guía funcional y de datos** para el desarrollo de la API de gestión de competencias y categorías. 

> ⚠️ **Nota Importante para el Desarrollador de la API (Backend):** 
> Los nombres de los campos, variables, rutas de endpoints y métodos HTTP definitivos son establecidos por el backend. Este documento detalla estrictamente la **información y estructuras de datos** requeridas por el frontend actual para renderizar sus vistas, filtros, tablas, formularios y flujos de navegación sin romper la experiencia del usuario.

---

## 1. Vistas y Requerimientos del Frontend

El frontend cuenta con un módulo de **Competencias** que está dividido en dos secciones principales:

### A. Biblioteca de Competencias
Muestra un grid de competencias con búsqueda, filtros y opciones de edición/eliminación. Las competencias se muestran como tarjetas (cards) con la siguiente información:
*   Nombre de la competencia
*   Descripción
*   Categoría (mostrada como badge con color específico)
*   Escala numérica (ej. "Escala: 1-4", "Escala: 1-5")
*   Botones de acción (Editar, Eliminar)

**Filtros requeridos:**
*   Búsqueda de texto (`filtro`): Permite buscar coincidencias insensibles a mayúsculas/minúsculas sobre el nombre o descripción de la competencia.
*   Filtro por Categoría (`categoria`): Filtra competencias por su categoría asociada (usando el slug de la categoría).

**Ordenamiento:**
*   Soporta ordenamiento ascendente (`asc`) y descendente (`desc`).
*   Campos ordenables: `nombre` (mínimo requerido).

**Paginación:**
*   Soporta cambio de página y de cantidad de items por página (6, 9, 12, 18).
*   El frontend espera la estructura de paginación estándar que retorna `total_items`, `total_paginas`, `items_por_pagina` y `pagina` (página actual).

### B. Gestión de Categorías
Pestaña dedicada a la creación, edición y eliminación de categorías de competencias. Las categorías agrupan competencias por tipo (Habilidades Blandas, Técnicas, Idiomas, etc.).

---

## 2. Estructura de Datos Requerida por el Frontend

### A. Entidad Competencia
La entidad **Competencia** debe contener la siguiente información:

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la competencia | Sí |
| `nombre` | Texto | Nombre descriptivo de la competencia (ej. "Orientación de Servicio al Cliente") | Sí |
| `descripcion` | Texto | Descripción detallada de qué implica esta competencia | Sí |
| `categoria` | Slug de Categoría | Referencia a la categoría mediante su slug único (ej. "HABILIDAD_BLANDA", "COMPETENCIA_ORGANIZACIONAL") | Sí |
| `escala` | Número | Escala numérica máxima para evaluar la competencia (ej. 4, 5). Define niveles del 1 al N | Sí |
| `definiciones_niveles` | Array de Objetos | Definiciones opcionales de qué representa cada nivel en la escala (ver estructura abajo) | No |

### B. Estructura de Definición de Nivel (dentro de `definiciones_niveles`)
| Campo | Tipo Funcional | Descripción | Obligatorio |
| :--- | :--- | :--- | :--- |
| `nivel` | Número | Número del nivel dentro de la escala (1 a escala máxima) | Sí |
| `nombre` | Texto | Nombre descriptivo del nivel (ej. "Bajo", "Medio", "Alto") | No |
| `descripcion` | Texto | Descripción detallada de qué implica este nivel de competencia | Sí |

### C. Entidad Categoría
La entidad **Categoría** debe contener la siguiente información:

| Campo Requerido | Tipo Funcional | Descripción Funcional | Obligatorio en Frontend |
| :--- | :--- | :--- | :--- |
| `id` | Identificador único | UUID o string identificador único de la categoría | Sí |
| `nombre` | Texto | Nombre de la categoría (ej. "Habilidades Blandas") | Sí |
| `descripcion` | Texto | Descripción de qué tipos de competencias agrupa esta categoría | No |
| `slug` | Slug único | Identificador único en formato slug usado para relacionar competencias (ej. "HABILIDAD_BLANDA"). Debe ser único en el sistema. | Sí |
| `color` | Variante de Color | Color del badge para identificar visualmente la categoría. Valores válidos: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `ghost` | Sí |

---

## 3. Flujos de Integración y Endpoints Sugeridos

Basado en el consumo del frontend, la API debería soportar los siguientes comportamientos de datos (con las rutas y convenciones que el backend defina):

### COMPETENCIAS

#### 1. Consulta de Competencias (Listado Paginado)
*   **Función:** Retornar las competencias filtradas, ordenadas y paginadas bajo la estructura unificada de paginación del sistema.
*   **Parámetros de consulta soportados:**
    *   `pagina` (número): Número de página (default: 1)
    *   `items_por_pagina` (número): Cantidad de registros por página (default: 9)
    *   `filtro` (texto): Término de búsqueda sobre nombre y descripción
    *   `categoria` (slug): Filtrar por slug de categoría específico
    *   `orden_por` (texto): Campo para ordenar (ej. "nombre")
    *   `orden` (texto): Dirección del ordenamiento ("asc" o "desc")
*   **Campos mínimos requeridos por elemento en la respuesta:**
    *   `id`
    *   `nombre`
    *   `descripcion`
    *   `categoria` (slug)
    *   `escala`

#### 2. Obtener Detalle de Competencia por ID
*   **Función:** Devolver la ficha completa de una competencia específica al abrir el formulario de edición.
*   **Campos retornados:** Todos los campos descritos en la sección 2.A (Competencia).

#### 3. Crear Competencia
*   **Función:** Registrar una nueva competencia en el sistema.
*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio)
    *   `descripcion` (Obligatorio)
    *   `categoria` (Obligatorio - slug de categoría existente)
    *   `escala` (Obligatorio - número positivo, típicamente 4 o 5)
    *   `definiciones_niveles` (Opcional - array de objetos CompetencyLevel)

#### 4. Actualizar Competencia
*   **Función:** Actualizar parcialmente (método `PATCH` sugerido) o totalmente los campos editables de una competencia.
*   **Campos actualizables:** Todos los campos descritos en la sección 3.1 (Crear Competencia).

#### 5. Eliminar Competencia
*   **Función:** Remover una competencia del sistema.
*   **Consideraciones:** El frontend espera una confirmación previa por parte del usuario antes de proceder con la eliminación.

### CATEGORÍAS

#### 6. Consulta de Categorías (Listado Completo)
*   **Función:** Retornar todas las categorías disponibles en el sistema (sin paginación, lista completa).
*   **Parámetros de consulta soportados (opcionales):**
    *   `search` (texto): Filtro de búsqueda por nombre de categoría (opcional)
*   **Campos requeridos por elemento en la respuesta:**
    *   `id`
    *   `nombre`
    *   `slug`
    *   `color`
    *   `descripcion` (opcional pero recomendado)

#### 7. Obtener Detalle de Categoría por ID
*   **Función:** Devolver la información completa de una categoría específica.
*   **Campos retornados:** Todos los campos descritos en la sección 2.C (Categoría).

#### 8. Crear Categoría
*   **Función:** Registrar una nueva categoría en el sistema.
*   **Campos enviados por el formulario:**
    *   `nombre` (Obligatorio)
    *   `descripcion` (Opcional)
    *   `slug` (Obligatorio - debe ser único, generado desde nombre o proporcionado manualmente)
    *   `color` (Obligatorio - uno de los valores válidos: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `ghost`)

#### 9. Actualizar Categoría
*   **Función:** Actualizar los campos editables de una categoría existente.
*   **Campos actualizables:** Todos excepto `slug` (que es el identificador único inmutable).

#### 10. Eliminar Categoría
*   **Función:** Remover una categoría del sistema.
*   **Consideraciones:** 
    *   El backend debe validar que no existan competencias asociadas a la categoría antes de permitir su eliminación.
    *   El frontend espera una confirmación previa por parte del usuario.

---

## 4. Validaciones Esperadas en el Backend

Para garantizar que el frontend maneje los errores de forma clara mediante el sistema de alertas integrado (`openAlert`):

### Validaciones de Competencias:
1.  **Campo Nombre:** Debe ser único dentro del sistema. No puede estar vacío. Longitud máxima recomendada: 100 caracteres.
2.  **Campo Descripción:** No puede estar vacío. Longitud máxima recomendada: 500 caracteres.
3.  **Categoría:** El slug de categoría proporcionado debe existir en el sistema.
4.  **Escala:** Debe ser un número entero positivo (típicamente 4 o 5). Rango sugerido: 1-10.
5.  **Definiciones de Niveles:**
    *   Si se proporciona un array de `definiciones_niveles`, debe contener un elemento por cada nivel de 1 a `escala`.
    *   Cada nivel debe tener un `numero` y una `descripcion` válida.
    *   Los números de nivel deben ser únicos dentro del array (1, 2, 3, etc.).

### Validaciones de Categorías:
1.  **Campo Nombre:** Debe ser único. No puede estar vacío.
2.  **Campo Slug:** Debe ser único en el sistema. Patrón sugerido: `MAYUSCULAS_CON_GUIONES` (ej. "HABILIDAD_BLANDA").
3.  **Campo Color:** Solo se permiten los valores: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `ghost`.
4.  **Eliminación:** Validar que no existan competencias con `categoria` igual al slug de la categoría a eliminar.

### Formato de Errores:
Ante un fallo (ej: nombre duplicado, categoría no existe), el backend debe responder con un objeto JSON estándar que contenga el mensaje descriptivo del error en la propiedad `message`.

---

## 5. Colores de Categoría Soportados

El frontend utiliza variantes de color de la librería DaisyUI para los badges de categoría. Los colores soportados son:

| Color | Variante | Uso Típico |
| :--- | :--- | :--- |
| `primary` | Azul primario | Categoría principal, destacada |
| `secondary` | Azul secundario | Competencias técnicas |
| `accent` | Acento (púrpura/cyan) | Destacar elementos |
| `info` | Información (azul claro) | Datos de referencia |
| `success` | Éxito (verde) | Competencias logradas o productividad |
| `warning` | Advertencia (naranja) | Competencias organizacionales |
| `error` | Error (rojo) | Competencias críticas o de entorno |
| `ghost` | Transparente/Ghost | Categorías menos destacadas |

---

## 6. Respuesta de Paginación Esperada (Competencias)

El endpoint de listado de competencias debe retornar una estructura similar a esta:

```json
{
  "success": true,
  "data": {
    "competencias": [
      {
        "id": "comp-1",
        "nombre": "Orientación de Servicio al Cliente",
        "descripcion": "Capacidad para satisfacer necesidades del cliente...",
        "categoria": "COMPETENCIA_ORGANIZACIONAL",
        "escala": 4,
        "definiciones_niveles": [
          {
            "nivel": 1,
            "nombre": "Bajo",
            "descripcion": "Atiende al cliente solo cuando se solicita..."
          }
        ]
      }
    ],
    "paginacion": {
      "pagina": 1,
      "items_por_pagina": 9,
      "total_items": 41,
      "total_paginas": 5
    }
  }
}
```

---

## 7. Casos de Uso Especiales

### Relación Competencia-Categoría:
*   Una competencia siempre debe pertenecer a exactamente una categoría.
*   La categoría se identifica mediante su `slug`, que es la relación "inmutable" en el sistema.
*   Si se actualiza el `nombre` o `color` de una categoría, no afecta las competencias existentes (la relación está en el `slug`).
*   Si se intenta eliminar una categoría que tiene competencias asociadas, el backend debe rechazar la operación.

### Escalas y Niveles:
*   La escala define cuántos niveles tiene una competencia (típicamente 4 o 5).
*   Las definiciones de nivel son opcionales pero recomendadas para proporcionar claridad en evaluaciones.
*   Si una competencia tiene `definiciones_niveles`, debe tener exactamente `escala` elementos.
