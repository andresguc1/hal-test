/**
 * AIServiceParsing - Utility functions for parsing and repairing LLM outputs.
 * Extracted from AIService to provide a dedicated parsing module.
 */

/**
 * Attempts to repair common malformed JSON structures produced by local LLMs.
 * @param {string} str - The raw string to repair
 * @returns {string} The repaired string
 */
export const repairJson = (str) => {
    if (!str) return str;
    let fixed = str.trim();

    const markdownMatch = fixed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (markdownMatch) {
        fixed = markdownMatch[1].trim();
    }

    try {
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');
        fixed = fixed.replace(/\/\/.*$/gm, '');
        return fixed;
    } catch (e) {
        return fixed;
    }
};

/**
 * Extracts the first JSON block delimited by braces from a string.
 * @param {string} str - The string to extract from
 * @returns {string} The extracted JSON string or original if no braces found
 */
export const extractJson = (str) => {
    if (!str) return '{}';
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return str.substring(firstBrace, lastBrace + 1);
    }
    return str;
};

/**
 * Robustly parses tool calls inside XML-like tags, even if the closing tag is missing.
 * @param {string} text - The text containing tool calls
 * @returns {Array<{name: string|null, content: string, raw: string}>} Array of parsed tool calls
 */
export const parseToolCalls = (text) => {
    if (!text) return [];
    const toolCalls = [];
    const regex = /<tool_call([^>]*)>/g;
    let match;
    const matches = [];
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            index: match.index,
            attributes: match[1],
            contentStart: regex.lastIndex,
        });
    }

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];

        let contentEnd = text.length;
        if (next) {
            contentEnd = next.index;
        }

        let chunk = text.slice(current.contentStart, contentEnd);

        const closeTag = '</tool_call>';
        const closeTagIndex = chunk.indexOf(closeTag);
        if (closeTagIndex !== -1) {
            chunk = chunk.slice(0, closeTagIndex);
        }

        let toolName = null;
        const nameMatch = current.attributes.match(/name=["']([^"']+)["']/);
        if (nameMatch) {
            toolName = nameMatch[1];
        }

        toolCalls.push({
            name: toolName,
            content: chunk.trim(),
            raw: text.slice(
                current.index,
                current.contentStart + chunk.length + (closeTagIndex !== -1 ? closeTag.length : 0),
            ),
        });
    }
    return toolCalls;
};
