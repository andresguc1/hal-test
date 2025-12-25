import { CSharpSeleniumParser } from '../../services/importer/selenium/csharp/CSharpSeleniumParser.js';

const parser = new CSharpSeleniumParser();

const lines = [
    'ReadOnlyCollection<IWebElement> menuItem = driver.FindElements(By.XPath("//ul/li"));',
    'Assert.IsTrue(driver.FindElement(By.Id("logo")).Displayed);',
];

console.log('--- Testing C# Regex Parser (Generics & Asserts) ---');

lines.forEach((line) => {
    console.log(`\nParsing line: ${line}`);
    const result = parser.mockStatementFromLine(line);
    console.log('Result:', JSON.stringify(result, null, 2));
});
