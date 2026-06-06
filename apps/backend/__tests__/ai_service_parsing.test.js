import { describe, it, expect } from 'vitest';
import { repairJson, parseToolCalls } from '../services/AIService.js';

describe('AIService - JSON Repair & Tool Call Parsing', () => {
    describe('repairJson', () => {
        it('should return null or undefined as is', () => {
            expect(repairJson(null)).toBeNull();
            expect(repairJson(undefined)).toBeUndefined();
        });

        it('should strip markdown code blocks', () => {
            const malformed = '```json\n{\n  "a": 1\n}\n```';
            expect(repairJson(malformed)).toBe('{\n  "a": 1\n}');
        });

        it('should strip markdown blocks without json language specifier', () => {
            const malformed = '```\n{"a": 1}\n```';
            expect(repairJson(malformed)).toBe('{"a": 1}');
        });

        it('should repair trailing commas', () => {
            const malformed = '{\n  "a": 1,\n  "b": [2, 3,],\n}';
            expect(JSON.parse(repairJson(malformed))).toEqual({
                a: 1,
                b: [2, 3],
            });
        });

        it('should strip single line comments', () => {
            const malformed = '{\n  // this is a comment\n  "a": 1\n}';
            expect(repairJson(malformed)).toBe('{\n  \n  "a": 1\n}');
        });
    });

    describe('parseToolCalls', () => {
        it('should parse closed tool calls correctly', () => {
            const text =
                'Here is the result: <tool_call name="inject_nodes">{"nodes": []}</tool_call> and some suffix.';
            const result = parseToolCalls(text);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('inject_nodes');
            expect(result[0].content).toBe('{"nodes": []}');
            expect(result[0].raw).toBe('<tool_call name="inject_nodes">{"nodes": []}</tool_call>');
        });

        it('should parse unclosed tool calls correctly', () => {
            const text =
                'Prompt: <tool_call name="inject_nodes">\n```json\n[\n  {\n    "nodes": []\n  }\n]\n```';
            const result = parseToolCalls(text);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('inject_nodes');
            expect(result[0].content).toBe('```json\n[\n  {\n    "nodes": []\n  }\n]\n```');
            expect(result[0].raw).toBe(
                '<tool_call name="inject_nodes">\n```json\n[\n  {\n    "nodes": []\n  }\n]\n```',
            );
        });

        it('should parse multiple tool calls with mixing closed/unclosed tags', () => {
            const text =
                '<tool_call name="add_node">{"type":"click"}</tool_call> and next <tool_call name="inject_nodes">{"nodes": []}';
            const result = parseToolCalls(text);
            expect(result).toHaveLength(2);

            expect(result[0].name).toBe('add_node');
            expect(result[0].content).toBe('{"type":"click"}');
            expect(result[0].raw).toBe('<tool_call name="add_node">{"type":"click"}</tool_call>');

            expect(result[1].name).toBe('inject_nodes');
            expect(result[1].content).toBe('{"nodes": []}');
            expect(result[1].raw).toBe('<tool_call name="inject_nodes">{"nodes": []}');
        });
    });
});
