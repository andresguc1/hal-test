# Guía de Documentación de API (HaltTest Backend)

Esta guía establece los estándares y flujos de trabajo recomendados para mantener y extender la documentación de la API RESTful de HaltTest. Utilizamos un enfoque **Code-First** donde la documentación vive junto al código, asegurando que siempre esté actualizada.

## 🛠 Herramientas y Stack Tecnológico

Utilizamos un conjunto de herramientas estándar en la industria para ecosistemas Node.js/Express:

1.  **[Swagger / OpenAPI 3.0](https://swagger.io/specification/)**: El estándar para describir APIs REST.
2.  **[swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)**: Permite escribir la especificación OpenAPI usando comentarios JSDoc directamente encima de las rutas de Express.
3.  **[swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)**: Genera una interfaz web interactiva y visualmente atractiva para probar la API.
4.  **[joi-to-swagger](https://github.com/twixes/joi-to-swagger)**: **(Pieza Clave)** Automatiza la conversión de nuestros esquemas de validación `Joi` a definiciones OpenAPI. Esto garantiza una **Single Source of Truth (SSOT)**: si cambias la validación, la documentación se actualiza sola.

---

## 📂 Estructura y Organización

-   **`swagger/swaggerConfig.js`**: El corazón de la configuración.
    -   Define la información general (título, versión, servidor).
    -   **Tags**: Define las categorías (e.g., `Browser Management`, `Users`).
    -   **Componentes**: Genera automáticamente los Schemas de Joi usando `convertJoiToOpenApiSchema`.
-   **`schemas/*.js`**: Contienen las reglas de negocio y validación.
-   **`routes/*.js`**: Aquí es donde "vive" la documentación de los endpoints mediante anotaciones `@swagger`.

---

## 📝 Guía Paso a Paso: Documentar un Nuevo Endpoint

Sigue este flujo para añadir un nuevo endpoint correctamente documentado.

### Paso 1: Definir el Contrato (Schema Joi)
En `schemas/testSchemas.js` (o el archivo correspondiente), define la validación de entrada.

```javascript
// schemas/userSchemas.js
export const createUserSchema = Joi.object({
    body: Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required()
    })
});
```

### Paso 2: Registrar el Schema en Swagger
Para que el schema sea reutilizable en la UI, debe estar en `swaggerConfig.js`.

```javascript
// swagger/swaggerConfig.js
// ...
const { createUserSchema } = allJoiSchemas;

// En el objeto 'schemas':
CreateUserInput: convertJoiToOpenApiSchema(createUserSchema),
```

### Paso 3: Documentar la Ruta (JSDoc)
En tu archivo de rutas (`routes/userRoutes.js`), añade el bloque `@swagger`.

> **Buenas Prácticas:**
> *   **Summary**: Verbo + Objeto (e.g., "Crea un nuevo usuario").
> *   **Tags**: Usa una categoría existente en inglés (e.g., `User Management`).
> *   **Request Body**: Referencia siempre al componente (`$ref`). NO escribas el JSON a mano.
> *   **Standard Responses**: Reutiliza `StandardSuccess` y `ErrorResponse`.

```javascript
/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario en el sistema.
 *     tags: [User Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       200:
 *         description: Usuario creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccess'
 *       400:
 *         description: Validación fallida (campos faltantes).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/users', validate(createUserSchema), userController.createUser);
```

---

## 🌟 Recomendaciones para Proyectos Open Source

Para mantener este proyecto amigable para contribuidores y profesional:

### 1. Estandarización de Etiquetas (Tags)
Usa **Inglés** para los Tags (`Browser Management` vs `Gestión de Navegador`). Esto hace el proyecto accesible globalmente. Mantén una lista controlada de tags en `swaggerConfig.js` para evitar duplicados como `User` vs `Users`.

### 2. Versionado
El campo `version` en `swaggerConfig.js` (e.g., `1.0.0-NO-MCP`) debe reflejar `package.json`. Usa [SemVer](https://semver.org/). Si haces cambios que rompen la API, incrementa la versión MAYOR.

### 3. Respuestas Uniformes
Evita devolver estructuras diferentes por endpoint.
*   ✅ `{ status: "success", data: { ... } }`
*   ❌ Endpoint A devuelve `[ ... ]`, Endpoint B devuelve `{ result: ... }`.

Nuestros componentes `StandardSuccess` y `ErrorResponse` fuerzan esta consistencia.

### 4. Descripciones Claras
No asumas conocimiento.
*   Mal: `timeout: number`
*   Bien: `timeout: Integer. Tiempo máximo en ms antes de abortar. Default: 30000.`

### 5. Automatización (CI/CD)
En el futuro, podríamos añadir un paso en el CI que "buildee" el Swagger JSON para asegurar que no hay errores de sintaxis en los comentarios JSDoc antes de hacer merge.
