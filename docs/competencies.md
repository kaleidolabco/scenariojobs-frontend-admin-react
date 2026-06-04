# Documentación de Gestión de Competencias y Categorías

Esta documentación detalla los endpoints disponibles para la administración de la biblioteca de competencias y sus categorías asociadas.

## 1. Generalidades

- **Base URL:** `/competencies`
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

## 2. Gestión de Competencias

### 2.1 Consulta de Competencias (Listado)
Obtiene una lista paginada de competencias filtrada por el tenant del usuario autenticado.

- **Endpoint:** `GET /competencies`
- **Permiso Requerido:** `COMPETENCIAS:LEER`
- **Parámetros de Consulta (Query Params):**

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `pagina` | `number` | No | Número de página actual | `1` |
| `limite` | `number` | No | Cantidad de registros por página | `10` |
| `busqueda` | `string` | No | Búsqueda insensible por nombre o descripción | `Liderazgo` |
| `categoria` | `string` | No | Filtrar por slug de la categoría | `HABILIDAD_BLANDA` |
| `ordenar_por`| `string` | No | Campo de orden: `nombre`, `fecha_registro` | `nombre` |
| `orden` | `string` | No | Dirección: `asc` o `desc` (Default: `desc`) | `asc` |

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "nombre": "Liderazgo Estratégico",
        "descripcion": "Capacidad para guiar equipos...",
        "categoria": "HABILIDAD_BLANDA",
        "escala": 5,
        "definiciones_niveles": [
          {
            "id": "uuid",
            "nivel": 1,
            "nombre": "Básico",
            "descripcion": "Sigue instrucciones básicas"
          }
        ]
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

### 2.2 Detalle de Competencia
Obtiene la ficha completa de una competencia, incluyendo sus niveles definidos.

- **Endpoint:** `GET /competencies/:id`
- **Permiso Requerido:** `COMPETENCIAS:LEER`
- **Parámetros de Ruta:** `id` (UUID)

- **Respuesta Exitosa (`data`):** Misma estructura que un elemento del listado.

### 2.3 Creación de Competencia
Registra una nueva competencia y sus niveles asociados.

- **Endpoint:** `POST /competencies`
- **Permiso Requerido:** `COMPETENCIAS:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre de la competencia | `Comunicación Efectiva` |
| `descripcion` | `string` | **Sí** | Descripción detallada | `Capacidad de transmitir...` |
| `categoria` | `string` | **Sí** | Slug de la categoría existente | `HABILIDAD_BLANDA` |
| `escala` | `number` | **Sí** | Valor máximo de la escala (1-10) | `5` |
| `definiciones_niveles` | `array` | No | Lista de objetos con `nivel`, `nombre` y `descripcion` | `[...]` |

- **Respuesta Exitosa (`data`):** Retorna la competencia creada con su ID y categoría.

### 2.4 Actualización de Competencia
Actualiza los datos de una competencia y sincroniza sus niveles.

- **Endpoint:** `PATCH /competencies/:id`
- **Permiso Requerido:** `COMPETENCIAS:EDITAR`
- **Cuerpo de la Petición:**
  Todos los campos de creación son opcionales. Para actualizar niveles específicos, se debe incluir el `id` del nivel dentro de `definiciones_niveles`.

- **Lógica de Sincronización de Niveles:**
  - Si el nivel tiene `id` y existe $\rightarrow$ Se actualiza.
  - Si el nivel no tiene `id` pero el número de `nivel` existe $\rightarrow$ Se actualiza.
  - Si no existe $\rightarrow$ Se crea.
  - Niveles activos en DB que no vengan en el DTO $\rightarrow$ Se marcan como eliminados.

### 2.5 Eliminación de Competencia
Marca una competencia como eliminada (Soft Delete).

- **Endpoint:** `DELETE /competencies/:id`
- **Permiso Requerido:** `COMPETENCIAS:ELIMINAR`
- **Respuesta Exitosa (`data`):** `{ "id": "uuid" }`

---

## 3. Gestión de Categorías

### 3.1 Consulta de Categorías
Obtiene todas las categorías disponibles para el tenant.

- **Endpoint:** `GET /competencies/categories`
- **Permiso Requerido:** `COMPETENCIAS:LEER`
- **Query Params:** `busqueda` (string), `pagina` (number), `limite` (number).

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "datos": [
      {
        "id": "uuid",
        "nombre": "Habilidades Blandas",
        "slug": "HABILIDAD_BLANDA",
        "color": "primary",
        "descripcion": "..."
      }
    ],
    "paginacion": { ... }
  }
  ```

### 3.2 Detalle de Categoría
- **Endpoint:** `GET /competencies/categories/:id`
- **Permiso Requerido:** `COMPETENCIAS:LEER`

### 3.3 Creación de Categoría
- **Endpoint:** `POST /competencies/categories`
- **Permiso Requerido:** `COMPETENCIAS:CREAR`
- **Cuerpo de la Petición:**
  - `nombre` (string, obligatorio)
  - `slug` (string, obligatorio y único por tenant)
  - `color` (string, obligatorio: `primary`, `secondary`, `accent`, `info`, `success`, `warning`, `error`, `ghost`)
  - `descripcion` (string, opcional)

### 3.4 Actualización de Categoría
- **Endpoint:** `PATCH /competencies/categories/:id`
- **Permiso Requerido:** `COMPETENCIAS:EDITAR`
- **Nota:** El campo `slug` es inmutable.

### 3.5 Eliminación de Categoría
- **Endpoint:** `DELETE /competencies/categories/:id`
- **Permiso Requerido:** `COMPETENCIAS:ELIMINAR`
- **Validación:** El sistema rechazará la eliminación si existen competencias asociadas a la categoría.

---

## 4. Notas Técnicas y Validaciones

1. **Relación Competencia-Categoría:** Una competencia siempre debe pertenecer a una categoría válida identificada por su `slug`.
2. **Validación de Escalas:** Si se proporcionan `definiciones_niveles`, la cantidad de elementos debe ser exactamente igual al valor definido en `escala`.
3. **Manejo de Errores:**
   - **409 Conflict:** Si se intenta crear una competencia con un nombre ya existente o una categoría con un slug duplicado en el tenant.
   - **400 Bad Request:** Si la escala es inválida o si se intenta eliminar una categoría con dependencias.
