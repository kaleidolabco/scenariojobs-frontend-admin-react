# Documentación de Gestión de Estructura Organizacional

Esta documentación detalla los endpoints disponibles para la gestión de unidades organizacionales (el organigrama) del sistema.

## 1. Generalidades

- **Base URL:** `/units`
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

## 2. Consulta del Organigrama (Listado)

Obtiene la estructura jerárquica completa del organigrama en formato de árbol para el tenant del usuario autenticado.

- **Endpoint:** `GET /units`
- **Permiso Requerido:** `UNIDADES:LEER`
- **Respuesta Exitosa (`data`):**
  Retorna un arreglo de unidades raíz, donde cada una contiene sus sub-unidades de forma recursiva.

  ```json
  [
    {
      "id": "uuid",
      "nombre": "Gerencia General",
      "descripcion": "Unidad principal",
      "padre_id": null,
      "tipo": { "codigo": "GERENCIA", "valor": "Gerencia" },
      "total_puestos": 3,
      "subnodos": [
        {
          "id": "uuid-sub",
          "nombre": "Departamento de TI",
          "descripcion": "Área de tecnología",
          "padre_id": "uuid",
          "tipo": { "codigo": "DEPARTAMENTO", "valor": "Departamento" },
          "total_puestos": 5,
          "subnodos": []
        }
      ]
    }
  ]
  ```

---

## 3. Detalle de Unidad Organizacional

Obtiene la información detallada de una unidad organizacional específica.

- **Endpoint:** `GET /units/:id`
- **Permiso Requerido:** `UNIDADES:LEER`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador único de la unidad.

- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid",
    "nombre": "Gerencia General",
    "descripcion": "Unidad principal",
    "padre_id": null,
    "tipo": { "codigo": "GERENCIA", "valor": "Gerencia" },
    "total_puestos": 3
  }
  ```

---

## 4. Creación de Unidad Organizacional

Crea una nueva unidad organizacional en la estructura.

- **Endpoint:** `POST /units`
- **Permiso Requerido:** `UNIDADES:CREAR`
- **Cuerpo de la Petición (Request Body):**

| Campo | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | `string` | **Sí** | Nombre de la unidad | `Departamento de TI` |
| `descripcion` | `string` | No | Descripción detallada | `Área de tecnología` |
| `tipo_codigo` | `string` | No | Código de tipo de unidad | `DEPARTAMENTO` |
| `padre_id` | `uuid` | No | ID de la unidad padre (si es sub-unidad) | `uuid` |

- **Respuesta Exitosa (`data`):** Retorna el objeto creado.

---

## 5. Actualización de Unidad Organizacional

Actualiza los campos básicos de una unidad organizacional.

- **Endpoint:** `PATCH /units/:id`
- **Permiso Requerido:** `UNIDADES:EDITAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la unidad a actualizar.
- **Cuerpo de la Petición (Request Body):**
  Campos opcionales: `nombre`, `descripcion`, `tipo_codigo`.
- **Respuesta Exitosa (`data`):** Retorna el objeto actualizado.

---

## 6. Eliminación de Unidad Organizacional

Elimina lógicamente una unidad organizacional.

- **Endpoint:** `DELETE /units/:id`
- **Permiso Requerido:** `UNIDADES:ELIMINAR`
- **Parámetros de Ruta:**
  - `id` (UUID): Identificador de la unidad a eliminar.
- **Restricciones:** No permite eliminar unidades que contengan sub-unidades (`subnodos`) activas.
- **Respuesta Exitosa (`data`):**
  ```json
  {
    "id": "uuid"
  }
  ```

---

## 7. Manejo de Errores

El API retorna errores estándar de NestJS.

- **400 Bad Request:** Datos inválidos, `padre_id` inexistente, o intento de eliminar unidad con hijos.
- **403 Forbidden:** Usuario sin permisos para la acción.
- **404 Not Found:** Unidad solicitada no encontrada.

---

## 8. Notas sobre `total_puestos`

El campo `total_puestos` indica la cantidad de puestos de trabajo **activos** (no eliminados) directamente asociados a esa unidad organizacional. No es un conteo acumulado de los subnodos; cada nodo informa únicamente sus propios puestos directos. Este valor es útil para el frontend al decidir si mostrar un indicador de ocupación o vacantes en la vista de detalle de una unidad.
