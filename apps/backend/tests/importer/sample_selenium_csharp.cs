using OpenQA.Selenium;
using OpenQA.Selenium.Firefox;
using NUnit.Framework;

namespace SeleniumTests
{
    public class SampleTest
    {
        [Test]
        public void TestGoogleSearch()
        {
            IWebDriver driver = new FirefoxDriver();
            driver.Navigate().GoToUrl("http://www.google.com");
            
            IWebElement searchBox = driver.FindElement(By.Name("q"));
            searchBox.SendKeys("Selenium C#");
            
            driver.FindElement(By.Name("btnK")).Click();
            
            driver.Quit();
        }
    }
}
