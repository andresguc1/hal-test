const template = "{{Login Steps.status}}";
const trimmed = template.trim();
const match = trimmed.match(/^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/);

console.log("Match:", !!match);
if (match) {
    const varName = (match[1] || match[2]).trim();
    console.log("VarName:", varName);
}

const templateWithSpaces = "{{ Login Steps.status }}";
const match2 = templateWithSpaces.trim().match(/^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/);
console.log("Match (spaces):", !!match2);
if (match2) {
    const varName2 = (match2[1] || match2[2]).trim();
    console.log("VarName (spaces):", varName2);
}
