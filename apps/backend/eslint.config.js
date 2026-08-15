// eslint.config.js
import eslintRecommended from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import jestPlugin from 'eslint-plugin-jest';
import globals from 'globals';

export default [
    {
        ignores: ['tests/', 'public/', 'database.sqlite*'],
    },
    {
        // 1. Configuración de Archivos y Entornos
        files: ['**/*.js'],
        languageOptions: {
            // Define los entornos: Node.js, y variables globales de Jest
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'module',
            ecmaVersion: 'latest',
        },
        // AÑADIDO: Regla para resolver el error 'no-unused-vars' en los bloques catch
        rules: {
            // Configura no-unused-vars para ignorar las variables de error capturadas
            'no-unused-vars': [
                'error',
                {
                    // Permite variables de error no utilizadas, como '_' en try...catch
                    caughtErrors: 'none',
                    varsIgnorePattern: '^[A-Z_]',
                    argsIgnorePattern: '^_',
                },
            ],
        },
    },
    // 2. Extiende la configuración recomendada de ESLint
    eslintRecommended.configs.recommended,

    // 3. Configuración de Prettier (para que el linter use el formateador)
    {
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            // Activa Prettier como regla de linting y define el nivel de error
            'prettier/prettier': [
                'error',
                {
                    // Opciones de Prettier (pueden duplicar o complementar a .prettierrc.json)
                    singleQuote: true,
                    semi: true,
                    tabWidth: 4,
                    trailingComma: 'all',
                    printWidth: 100,
                },
            ],
        },
    },

    // 4. Configuración del Plugin de Jest (para reglas de testing)
    {
        plugins: {
            jest: jestPlugin,
        },
        // Aquí puedes agregar configuraciones específicas para archivos de prueba si es necesario.
        // Por ejemplo, para usar las reglas recomendadas de Jest:
        // ...jestPlugin.configs['recommended'],
    },
];
