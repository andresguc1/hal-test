import { CSharpSeleniumParser } from '../../services/importer/selenium/csharp/CSharpSeleniumParser.js';

const parser = new CSharpSeleniumParser();

const lines = [
    'driver.Navigate().GoToUrl("http://www.google.com");',
    'driver.FindElement(By.Name("btnK")).Click();',
];

console.log('--- Testing C# Regex Parser ---');

lines.forEach((line) => {
    console.log(`\nParsing line: ${line}`);
    const result = parser.mockStatementFromLine(line);
    console.log('Result:', JSON.stringify(result, null, 2));
});
