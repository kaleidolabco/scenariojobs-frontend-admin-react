# Módulo de Usuarios y Roles - Documentación Técnica

## Descripción General

Este documento define la especificación técnica del módulo de Usuarios y Roles para el backend del sistema de gestión de desempeño y evaluación de talento. El módulo permite la gestión completa de usuarios del sistema, incluyendo creación, edición, eliminación, asignación de roles y control de acceso basado en roles (RBAC).

El módulo se basa en las vistas y funcionalidades implementadas en el frontend, asegurando compatibilidad total con la interfaz existente.

## Entidades Principales

### 1. Usuario (SystemUser)

Representa a un usuario del sistema con sus datos de acceso y permisos.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| id | string | Sí | Identificador único del usuario |
| email | string | Sí | Dirección de correo electrónico (usada como nombre de usuario) |
| roles | UserRole[] | Sí | Lista de roles asignados al usuario |
| estado | 'ACTIVO' \| 'INACTIVO' \| 'BLOQUEADO' | Sí | Estado actual del usuario |
| ultimo_acceso | string (ISO 8601) | No | Fecha y hora del último acceso |
| persona_id | string | No | Identificador de la persona asociada |
| persona | object | No | Información de la persona asociada |

### 2. Rol (UserRole)

Define los diferentes roles disponibles en el sistema con sus permisos correspondientes.

**Roles definidos:**
- ADMIN: Administrador de la entidad (nivel de acceso más alto)
- HR_MANAGER: Gestor de talento/RRHH (puede crear evaluaciones y procesos)
- EVALUATOR: Evaluador (puede calificar evaluaciones)
- EMPLOYEE: Colaborador/Evaluado (puede responder evaluaciones)

## Endpoints API

### 1. Obtener Usuarios

**Método:** GET
**Ruta:** `/api/users`
**Descripción:** Obtiene una lista paginada de usuarios con filtros opcionales

**Parámetros de consulta:**
- search: string - Término de búsqueda por email o nombre
- rol: string - Filtrar por rol específico
- estado: string - Filtrar por estado ('ACTIVO', 'INACTIVO', 'BLOQUEADO')
- pagina: number - Número de página (default: 1)
- items_por_pagina: number - Cantidad de elementos por página (default: 10)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": "usr_13",
        "email": "juan.erazo@scenariojobs.com",
        "roles": ["ADMIN"],
        "estado": "ACTIVO",
        "ultimo_acceso": "2026-02-10T20:30:00Z",
        "persona_id": "per_13",
        "persona": {
          "nombres": "Juan Fernando",
          "apellidos": "Erazo Ramirez"
        }
      }
    ],
    "paginacion": {
      "pagina_actual": 1,
      "items_por_pagina": 10,
      "total_items": 55,
      "total_paginas": 6
    }
  }
}
```

### 2. Obtener Usuario por ID

**Método:** GET
**Ruta:** `/api/users/{id}`
**Descripción:** Obtiene los detalles de un usuario específico

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "usr_13",
      "email": "juan.erazo@scenariojobs.com",
      "roles": ["ADMIN"],
      "estado": "ACTIVO",
      "ultimo_acceso": "2026-02-10T20:30:00Z",
      "persona_id": "per_13",
      "persona": {
        "nombres": "Juan Fernando",
        "apellidos": "Erazo Ramirez"
      }
    }
  }
}
```

### 3. Crear Usuario

**Método:** POST
**Ruta:** `/api/users`
**Descripción:** Crea un nuevo usuario en el sistema

**Body Request:**
```json
{
  "email": "usuario@empresa.com",
  "roles": ["EMPLOYEE"],
  "estado": "ACTIVO"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "usr_123",
      "email": "usuario@empresa.com",
      "roles": ["EMPLOYEE"],
      "estado": "ACTIVO",
      "ultimo_acceso": null,
      "persona_id": null,
      "persona": null
    }
  }
}
```

### 4. Actualizar Usuario

**Método:** PATCH
**Ruta:** `/api/users/{id}`
**Descripción:** Actualiza datos opcionales de un usuario existente

**Body Request:**
```json
{
  "email": "usuario@empresa.com",
  "roles": ["EMPLOYEE", "EVALUATOR"],
  "estado": "INACTIVO"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": "usr_123",
      "email": "usuario@empresa.com",
      "roles": ["EMPLOYEE", "EVALUATOR"],
      "estado": "INACTIVO",
      "ultimo_acceso": null,
      "persona_id": null,
      "persona": null
    }
  }
}
```

### 5. Eliminar Usuario

**Método:** DELETE
**Ruta:** `/api/users/{id}`
**Descripción:** Elimina un usuario del sistema (no se puede eliminar usuarios con datos asociados)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### 6. Resetear Contraseña

**Método:** POST
**Ruta:** `/api/users/{id}/reset-password`
**Descripción:** Envía un correo para restablecer la contraseña del usuario

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

## Validaciones y Reglas de Negocio

1. **Email único:** Cada dirección de correo electrónico debe ser única en el sistema
2. **Roles válidos:** Solo se permiten los roles definidos en el sistema
3. **Estado válido:** El estado debe ser uno de: 'ACTIVO', 'INACTIVO', 'BLOQUEADO'
4. **Rol mínimo:** Un usuario debe tener al menos un rol asignado
5. **Acceso a recursos:** El sistema debe validar que el usuario tenga permisos para acceder a ciertos recursos según su rol

## Relaciones entre Entidades

- Un usuario puede tener múltiples roles asignados
- Los roles determinan los permisos de acceso al sistema
- La relación entre usuarios y personas se gestiona mediante la entidad de Asignación

## Consideraciones de Seguridad

1. **Autenticación:** Todas las operaciones requieren autenticación JWT
2. **Autorización:** Se debe validar que el usuario tenga permisos para realizar operaciones CRUD
3. **Control de Acceso:** El sistema debe implementar RBAC basado en roles
4. **Auditoría:** Se debe registrar cada operación de usuario para auditoría

## Consideraciones de Implementación

1. **Paginación:** Implementar paginación en todas las operaciones de listado
2. **Filtros:** Soportar búsqueda por email, nombre y filtros por rol y estado
3. **Validaciones:** Implementar validaciones de datos en el backend
4. **Errores:** Manejo consistente de errores con códigos HTTP adecuados
5. **Logs:** Registrar operaciones CRUD para auditoría

## Observaciones Técnicas

1. El frontend utiliza un mock de usuarios para pruebas, pero el backend debe implementar la lógica real
2. El campo `ultimo_acceso` se actualiza automáticamente cuando el usuario inicia sesión
3. La creación de usuarios no requiere contraseña directa, se envía un correo de invitación
4. El backend podrá definir los nombres internos, parámetros a enviar, DTOs, arquitectura. Filtros extra...

## Compatibilidad con Frontend

Este módulo está diseñado para ser completamente compatible con el frontend actual. Todos los endpoints y estructuras de datos reflejan exactamente lo que el frontend espera recibir y enviar.