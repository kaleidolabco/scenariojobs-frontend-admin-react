---
trigger: always_on
---

# Guía de Desarrollo - Proyecto Antigravity

## 1. Consistencia Visual y UI
* **Fidelidad Estética:** Mantener estrictamente el diseño y la identidad visual actual de todas las vistas. No introducir variaciones de color, espaciado o tipografía.
* **Navegación:** Toda vista nueva debe incluir obligatoriamente el componente de "Breadcrumbs" (migas de pan) siguiendo el formato jerárquico y diseño ya existente.

## 2. Reutilización y Modularidad
* **Prioridad de Componentes:** Antes de crear cualquier elemento desde cero, buscar componentes existentes en el repositorio (inputs, botones, tablas, modales). Si el componente existe, es obligatorio reutilizarlo.
* **Arquitectura Modular:** Al crear nuevos componentes, diseñarlos para que sean modulares y altamente flexibles mediante el uso de "props". Deben estar preparados para su reutilización futura.

## 3. Patrones de Lógica y API
* **Consistencia de API:** Seguir exactamente el patrón de servicios y peticiones implementado en las vistas de `competencias` o `cargos`. Esto incluye el manejo de estados de carga (loading), gestión de errores y estructura de los archivos de servicio.
* **Flujos CRUD:** Para las operaciones de creación, edición y eliminación, replicar fielmente los patrones ya implementados (mismos diálogos de confirmación, flujos de usuario y mensajes de feedback).

## 4. Checklist de Verificación (Antes de Codificar)
1. ¿Existe ya un componente en el proyecto que cumpla esta función?
2. ¿Mi código sigue el patrón técnico de los módulos `competencias/cargos`?
3. ¿He incluido los breadcrumbs correspondientes?
4. ¿El componente que estoy creando es lo suficientemente flexible para ser reutilizado?