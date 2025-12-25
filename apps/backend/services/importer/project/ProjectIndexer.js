import { parse } from '@babel/parser';
import fs from 'fs';

/**
 * Indexa un proyecto completo para construir una tabla de símbolos.
 * Extrae clases, métodos, funciones y sus cuerpos AST.
 */
export class ProjectIndexer {
    constructor() {
        this.index = {
            classes: {}, // { ClassName: { file, methods: { methodName: { params, body } } } }
            functions: {}, // { functionName: { file, params, body } }
            imports: {}, // { file: [{ source, specifiers }] }
        };
    }

    /**
     * Indexa múltiples archivos.
     */
    indexFiles(files) {
        for (const file of files) {
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                this.indexFile(file.path, content);
            } catch (error) {
                console.warn(`[ProjectIndexer] Error indexing ${file.path}:`, error.message);
            }
        }
        return this.index;
    }

    /**
     * Indexa un archivo individual.
     */
    indexFile(filePath, content) {
        // Solo indexamos archivos JS/TS por ahora
        if (!filePath.match(/\.(js|ts|jsx|tsx)$/)) {
            return;
        }

        try {
            const ast = parse(content, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'],
            });

            this.extractFromAST(ast, filePath);
        } catch (error) {
            console.warn(`[ProjectIndexer] Parse error in ${filePath}:`, error.message);
        }
    }

    /**
     * Extrae símbolos del AST.
     */
    extractFromAST(ast, filePath) {
        if (!ast.program || !ast.program.body) return;

        for (const node of ast.program.body) {
            // Imports
            if (node.type === 'ImportDeclaration') {
                if (!this.index.imports[filePath]) {
                    this.index.imports[filePath] = [];
                }
                this.index.imports[filePath].push({
                    source: node.source.value,
                    specifiers: node.specifiers.map((s) => ({
                        type: s.type,
                        local: s.local?.name,
                        imported: s.imported?.name,
                    })),
                });
            }

            // Class declarations
            if (node.type === 'ClassDeclaration') {
                const className = node.id.name;
                this.index.classes[className] = {
                    file: filePath,
                    methods: {},
                };

                // Extract methods
                for (const member of node.body.body) {
                    if (member.type === 'ClassMethod' || member.type === 'MethodDefinition') {
                        const methodName = member.key.name;
                        this.index.classes[className].methods[methodName] = {
                            params: member.params.map((p) => p.name || p.type),
                            body: member.body,
                            async: member.async,
                        };
                    }
                }
            }

            // Function declarations
            if (node.type === 'FunctionDeclaration') {
                const funcName = node.id?.name;
                if (funcName) {
                    this.index.functions[funcName] = {
                        file: filePath,
                        params: node.params.map((p) => p.name || p.type),
                        body: node.body,
                        async: node.async,
                    };
                }
            }

            // Export default class (common in POM)
            if (node.type === 'ExportDefaultDeclaration') {
                if (node.declaration.type === 'ClassDeclaration') {
                    const className = node.declaration.id?.name || 'default';
                    this.index.classes[className] = {
                        file: filePath,
                        methods: {},
                        isDefault: true,
                    };

                    for (const member of node.declaration.body.body) {
                        if (member.type === 'ClassMethod' || member.type === 'MethodDefinition') {
                            const methodName = member.key.name;
                            this.index.classes[className].methods[methodName] = {
                                params: member.params.map((p) => p.name || p.type),
                                body: member.body,
                                async: member.async,
                            };
                        }
                    }
                }
            }
        }
    }

    /**
     * Busca un método en el índice.
     */
    findMethod(className, methodName) {
        const classInfo = this.index.classes[className];
        if (!classInfo) return null;

        const method = classInfo.methods[methodName];
        if (!method) return null;

        return {
            ...method,
            file: classInfo.file,
            className,
        };
    }

    /**
     * Busca una función en el índice.
     */
    findFunction(functionName) {
        return this.index.functions[functionName];
    }
}
