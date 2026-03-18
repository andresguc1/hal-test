# Directrices de Código Limpio (Clean Code)

Este documento sirve como guía para mantener un código fuente legible, mantenible y libre de "código basura".

## Principios Fundamentales

### 1. Hazlo simple o no lo hagas (KISS)
*   **Evita la sobreingeniería**: Resuelve el problema actual, no problemas futuros hipotéticos.
*   **YAGNI (You Aren't Gonna Need It)**: No agregues funcionalidades "por si acaso".
*   **Legibilidad**: El código debe ser fácil de leer para otros (y para ti mismo en 6 meses).

### 2. Borra sin miedo el código inútil
*   **Sin código comentado**: Si no se usa, bórralo. Para recuperar código antiguo, usamos el historial de Control de Versiones (**Git**).
*   **Elimina variables y funciones muertas**: Evita el desorden que distrae de la lógica real.

### 3. Si necesitas comentarios, rehazlo
*   **Código autodocumentado**: Usa nombres de variables y funciones descriptivos (ej. `calcularPrecioTotal()` en lugar de `calc()`).
*   **Evita redundancias**: No comentes lo obvio. El "por qué" es más importante que el "cómo" (si es que es necesario).

### 4. No mezcles refactors con arreglos
*   **Separación de intenciones**: Si estás arreglando un bug, enfócate solo en el bug.
*   **Refactorización aislada**: Mejora la estructura en un paso separado para facilitar las revisiones de código (PRs) y revertir cambios si es necesario.

### 5. Si no lo puedes explicar rápido, está mal
*   **Responsabilidad Única**: Una función o clase debe hacer una sola cosa y hacerla bien.
*   **Técnica del Pato de Goma**: Si te cuesta explicar la lógica, es señal de que necesita simplificación o división.

### 6. Que funcione primero, optimiza después
*   **Lógica Correcta**: Asegúrate de que el código resuelva el problema de forma fiable.
*   **Evita la optimización prematura**: No sacrifiques legibilidad por milisegundos de rendimiento a menos que exista un cuello de botella demostrado.

### 7. Commits pequeños o estás ocultando algo
*   **Commits Atómicos**: Un commit debe representar un solo cambio lógico.
*   **Revisiones Fáciles**: Commits pequeños son más rápidos de revisar y reducen la probabilidad de conflictos graves.

---
*Mantengamos el código limpio y el desarrollo ágil.*
