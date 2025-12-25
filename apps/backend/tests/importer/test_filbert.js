import { parse } from 'filbert';

const code = `
from selenium import webdriver
from selenium.webdriver.common.by import By
driver = webdriver.Firefox()
driver.get("http://www.python.org")

def run_selenium_test():
    elem = driver.find_element(By.NAME, "q")
    elem.send_keys("pycon")

run_selenium_test()
driver.close()
`;

try {
    const ast = parse(code);
    console.log('Success:', JSON.stringify(ast, null, 2));
} catch (error) {
    console.error('Error:', error);
}
